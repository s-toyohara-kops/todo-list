import type { Store, Task, TaskId, RepeatRule, DateKey, Weekday, DiaryEntry, DiaryEntryId, DiaryCategory } from './types';
import { toKey, getWeekday } from './lib/date';
import { loadFromStorage, saveToStorage } from './lib/storage';

// デフォルトのダイアリーカテゴリー
const DEFAULT_DIARY_CATEGORIES: DiaryCategory[] = ['日常', '仕事', '運動', '食事'];

// 内部状態
let store: Store = {
    tasks: [],
    completion: {},
    selectedDate: toKey(new Date()),
    diaryEntries: [],
    diaryCategories: [...DEFAULT_DIARY_CATEGORIES],
};

// 隠されたタスクの管理
type HiddenTasksMap = Record<DateKey, Set<TaskId>>;
let hiddenTasks: HiddenTasksMap = {};

//変更通知
type Listener = () => void;
const listeners = new Set<Listener>();

function emit(shouldSave: boolean = true) {
    for (const fn of listeners) fn();

    // 自動保存　
    if (shouldSave) {
        const saveResult = saveToStorage(store);
        if (!saveResult.success) {
            console.error('自動保存に失敗しました', saveResult.error);
        }
    }
}

//　状態の購読
export function subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

// ユーティリティ
function uuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).slice(2, 10);
}

// 外から読み取りように渡す
export function getState(): Store {
    return {
        tasks: [...store.tasks],
        completion: { ...store.completion },
        selectedDate: store.selectedDate,
        diaryEntries: [...store.diaryEntries],
        diaryCategories: [...store.diaryCategories],
    };
}

// 初期化
export function initStore(date?: Date | DateKey) {
    const loadResult = loadFromStorage();

    if (loadResult.success && loadResult.data) {
        store = { ...loadResult.data, diaryEntries: loadResult.data.diaryEntries || [], diaryCategories: loadResult.data.diaryCategories || [...DEFAULT_DIARY_CATEGORIES] };
    } else {
        console.warn('LocalStorageの読み込みに失敗、デフォルト状態を使用:', loadResult.error);
        store = {
            tasks: [],
            completion: {},
            selectedDate: toKey(new Date()),
            diaryEntries: [],
            diaryCategories: [...DEFAULT_DIARY_CATEGORIES],
        };
    }

    if (date) {
        store.selectedDate = typeof date === 'string' ? date : toKey(date);
    }
    emit(true);
}

// 選択中の日付を変更
export function setSelectedDate(next: Date | DateKey) {
    store.selectedDate = typeof next === 'string' ? next : toKey(next);
    emit(false);
}

// 繰り返しタスク追加
export function addRecurringTask(title: string, rule: RepeatRule): Task {
    const task: Task = {
        id: uuid(),
        title: title.trim(),
        rule,
        createdAt: Date.now(),
    };
    store.tasks.push(task);
    emit(true);
    return task;
}

// 指定日のみのタスク追加
export function addOneTimeTask(title: string, targetDate: DateKey): Task {
    const task: Task = {
        id: uuid(),
        title: title.trim(),
        targetDate,
        createdAt: Date.now(),
    };
    store.tasks.push(task);
    emit(true);
    return task;
}

// タイトル編集
export function editTask(id: TaskId, nextTitle: string) {
    const t = store.tasks.find((x) => x.id === id);
    if (!t) return;
    const v = nextTitle.trim();
    if (!v) return;
    t.title = v;
    emit(true);
}

// 当日の完了状態を取得
export function isCompleted(id: TaskId, date: Date | DateKey): boolean {
    const key = typeof date === 'string' ? date : toKey(date);
    return !!store.completion[key]?.[id];
}

// 当日の完了状態を更新
export function setCompletion(id: TaskId, date: Date | DateKey, done: boolean) {
    const key = typeof date === 'string' ? date : toKey(date);
    const dayMap = store.completion[key] ?? {};
    dayMap[id] = done;
    store.completion[key] = dayMap;
    emit(true);
}

// タスクを削除
export function deleteTask(id: TaskId) {
    const index = store.tasks.findIndex(t => t.id === id);
    if (index === -1) return;
    store.tasks.splice(index, 1);

    // 完了状態も削除
    for (const dateKey in store.completion) {
        delete store.completion[dateKey][id];
    }

    emit(true);
}

// 特定の日からタスクを削除
export function removeTaskFromDate(id: TaskId, date: Date | DateKey) {
    const key = typeof date === 'string' ? date : toKey(date);
    if (!hiddenTasks[key]) {
        hiddenTasks[key] = new Set();
    }
    hiddenTasks[key].add(id);
    emit(true);
}

// タスクが特定の日から削除されているかチェック
export function isTaskRemovedFromDate(id: TaskId, date: Date | DateKey): boolean {
    const key = typeof date === 'string' ? date : toKey(date);
    return hiddenTasks[key]?.has(id) ?? false;
}

// 指定日の表示対象タスクを算出
export function getTasksFor(date: Date | DateKey): Task[] {
    const key = typeof date === 'string' ? date : toKey(date);
    const d = new Date(key);
    const wd: Weekday = getWeekday(d);
    const isWeekDay = [1, 2, 3, 4, 5].includes(wd);
    const isWeekEnd = [0, 6].includes(wd);

    return store.tasks.filter((t) => {
        if (t.archived) return false;

        // この日から削除されているタスクは表示しない
        if (isTaskRemovedFromDate(t.id, key)) return false;

        if (!t.rule) return t.targetDate === key;
        if (t.rule?.kind === 'daily') return true;
        if (t.rule?.kind === 'weekly') return t.rule.days.includes(wd);
        if (t.rule?.kind === 'weekDays') return isWeekDay;
        if (t.rule?.kind === 'weekEnds') return isWeekEnd;
        return false;
    });
}

// 全てのタスクを取得
export function getAllTasks(): Task[] {
    return [...store.tasks].filter(t => !t.archived);
}

// 特定のタスクを取得
export function getTaskById(id: TaskId): Task | undefined {
    return store.tasks.find(t => t.id === id);
}

// ダイアリーエントリーの追加
export function addDiaryEntry(date: DateKey, category: DiaryCategory, content: string): DiaryEntry {
    const entry: DiaryEntry = {
        id: uuid(),
        date,
        category,
        content: content.trim(),
        createdAt: Date.now(),
    };
    store.diaryEntries.push(entry);
    emit(true);
    return entry;
}

// ダイアリーエントリーの完全更新（日付・カテゴリー・内容すべて）
export function updateDiaryEntryFull(id: DiaryEntryId, date: DateKey, category: DiaryCategory, content: string): void {
    const entry = store.diaryEntries.find(e => e.id === id);
    if (!entry) return;

    entry.date = date;
    entry.category = category;
    entry.content = content.trim();
    entry.updatedAt = Date.now();
    emit(true);
}

// ダイアリーエントリーの削除
export function deleteDiaryEntry(id: DiaryEntryId): void {
    const index = store.diaryEntries.findIndex(e => e.id === id);
    if (index === -1) return;

    store.diaryEntries.splice(index, 1);
    emit(true);
}

// 特定日のダイアリーエントリーを取得
export function getDiaryEntriesFor(date: DateKey): DiaryEntry[] {
    return store.diaryEntries.filter(entry => entry.date === date);
}

// 全てのダイアリーを取得
export function getAllDiaryEntries(): DiaryEntry[] {
    return [...store.diaryEntries].sort((a, b) => b.createdAt - a.createdAt);
}

// カテゴリー別のダイアリーエントリーを取得
export function getDiaryEntriesByCategory(category: DiaryCategory): DiaryEntry[] {
    return [...store.diaryEntries].filter(entry => entry.category === category);
}

//　　ダイアリー　カテゴリーの追加
export function addDiaryCategory(category: DiaryCategory): void {
    const trimmed = category.trim();
    if (!trimmed || store.diaryCategories.includes(trimmed)) return;

    store.diaryCategories.push(trimmed);
    emit(true);
}

// ダイアリーカテゴリーnの削除
export function deleteDiaryCategory(category: DiaryCategory): void {
    const index = store.diaryCategories.indexOf(category);
    if (index === -1) return;

    store.diaryCategories.splice(index, 1);
    emit(true);
}

//　ダイアリーカテゴリー一覧を取得
export function getDiaryCategories(): DiaryCategory[] {
    return [...store.diaryCategories];
}


// カスタム期間の日付配列を取得
export function getDateRange(startDate: DateKey, endDate: DateKey): DateKey[] {
    const dates: DateKey[] = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    const current = new Date(start);
    while (current <= end) {
        dates.push(toKey(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

// 今週の日付配列を取得
export function getCurrentWeekDates(): DateKey[] {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);

    const dates: DateKey[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(toKey(date));
    }
    return dates;

}

// 先週の日付配列を取得
export function getPreviousWeekDates(): DateKey[] {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek - 7);

    const dates: DateKey[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(toKey(date));
    }
    return dates;
}

// 今月の日付配列を取得
export function getCurrentMonthDates(): DateKey[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return getDateRange(toKey(firstDay), toKey(lastDay));
}

// 　先月の日付配列を取得
export function getPreviousMonthDates(): DateKey[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() - 1;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return getDateRange(toKey(firstDay), toKey(lastDay));
}

// 指定期間でのタスクのパフォーマンスを計算
export function calculateTaskPerformance(taskId: TaskId, dates: DateKey[]): {
    totalDays: number;
    completedDays: number;
    achievementRate: number;
} {
    let totalDays = 0;
    let completedDays = 0;

    for (const date of dates) {
        const tasksForDate = getTasksFor(date);
        const hasTask = tasksForDate.some(task => task.id === taskId);

        if (hasTask) {
            totalDays++;
            if (isCompleted(taskId, date)) {
                completedDays++;
            }
        }
    }

    const achievementRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    return {
        totalDays,
        completedDays,
        achievementRate
    };
}

// 全タスクの指定期間でのパフォーマンスを取得
export function getAllTasksPerformance(dates: DateKey[]) {
    const allTasks = getAllTasks();

    return allTasks.map(task => {
        const performance = calculateTaskPerformance(task.id, dates);
        return {
            taskId: task.id,
            taskName: task.title,
            ...performance
        };
    });
}

// 指定期間の日別達成データを取得
export function getDailyAchievements(dates: DateKey[]) {
    return dates.map(date => {
        const tasksForDate = getTasksFor(date);
        const completedTasks = tasksForDate.filter(task => isCompleted(task.id, date));
        const achievementRate = tasksForDate.length > 0
            ? Math.round((completedTasks.length / tasksForDate.length) * 100)
            : 0;

        return {
            date,
            totalTasks: tasksForDate.length,
            completedTasks: completedTasks.length,
            achievementRate
        };
    });
}

// 指定期間で最も頑張った日を取得
export function getBestDay(dates: DateKey[]) {
    const dailyData = getDailyAchievements(dates);

    return dailyData.reduce((best, current) => {
        if (current.completedTasks > best.completedTasks) {
            return current;
        } else if (current.completedTasks === best.completedTasks && current.achievementRate > best.achievementRate) {
            return current;
        }
        return best;
    }, dailyData[0]);
}

// 連続達成日数を計算
export function calculateStreakDays(taskId: TaskId, endDate: DateKey): number {
    let streak = 0;
    const endDateObj = new Date(endDate + 'T00:00:00');

    for (let i = 0; i < 30; i++) {
        const checkDate = new Date(endDateObj);
        checkDate.setDate(endDateObj.getDate() - i);
        const dateKey = toKey(checkDate);

        const tasksForDate = getTasksFor(dateKey);
        const hasTask = tasksForDate.some(task => task.id === taskId);

        if (hasTask && isCompleted(taskId, dateKey)) {
            streak++;
        } else if (hasTask) {
            break;
        }
    }
    return streak;
}


