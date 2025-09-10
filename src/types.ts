/** 曜日：０（日）〜６（土） */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** タスクID */
export type TaskId = string;

/** 日付キー */
export type DateKey = string;

/** ダイアリーエントリーID */
export type DiaryEntryId = string;

/** 繰り返しルール */
export type RepeatRule =
    | { kind: 'daily' }
    | { kind: 'weekly'; days: Weekday[] }
    | { kind: 'weekDays'; days: [1, 2, 3, 4, 5] }
    | { kind: 'weekEnds'; days: [0, 6] };

/** ダイアリーカテゴリー */
export type DiaryCategory = string;

/** タスク定義 */
export interface Task {
    id: TaskId;
    title: string;
    targetDate?: DateKey;
    rule?: RepeatRule;
    createdAt: number;
    archived?: boolean;
}

/** ダイアリーエントリー */
export interface DiaryEntry {
    id: DiaryEntryId;
    date: DateKey;
    category: DiaryCategory;
    content: string;
    createdAt: number;
    updatedAt?: number;
}

/** 完了状態 */
export type CompletionMap = Record<DateKey, Record<TaskId, boolean>>;

/** アプリ状態 */
export interface Store {
    tasks: Task[];
    completion: CompletionMap;
    selectedDate: DateKey;
    diaryEntries: DiaryEntry[];
    diaryCategories: DiaryCategory[];
}

/** ストレージに保存するデータ形式 */
export interface StorageData {
    version: string;
    tasks: Task[];
    completion: CompletionMap;
    diaryEntries: DiaryEntry[];
    diaryCategories: DiaryCategory[];
    lastUpdated: number;
}

/** ストレージ操作の結果 */
export interface StorageResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/** 期間フィルターの種類 */
export type PeriodType = 'week' | 'month' | 'custom';

/** 期間フィルター */
export interface periodConfig {
    type: PeriodType;
    startDate?: DateKey;
    endDate?: DateKey;
}

/** レポートフィルター */
export interface ReportFilter {
    selectedTaskId?: TaskId;
    period: periodConfig;
}

/** タスクパフォーマンス */
export interface TaskPerformance {
    taskId: TaskId;
    taskName: string;
    totalDays: number;
    completedDays: number;
    achievementRate: number;
}

/** 日別の達成データ */
export interface DailyAchievement {
    date: DateKey;
    totalTasks: number;
    completedTasks: number;
    achievementRate: number;
}

/** トレンド比較データ */
export interface TrendComparison {
    current: {
        period: string;
        achievementRate: number;
        completedCount: number;
        streakDays: number;
    };
    previous: {
        period: string;
        achievementRate: number;
        completedCount: number;
        streakDays: number;
    };
    changes: {
        achievementRate: number;
        completedCount: number;
        streakDays: number;
    };
}

/** ハイライト情報 */
export interface HighlightInfo {
    bestDay: {
        date: DateKey;
        completedCount: number;
        totalTasks: number;
    };
    currentStreak: number;
    longestStreak: number;
    improvements: string[];
}

/** レポートデータ全体 */
export interface ReportData {
    filter: ReportFilter;
    overview: {
        taskPerformances: TaskPerformance[];
        dailyAchievements: DailyAchievement[];
        highlights: HighlightInfo;
    };
    taskDetail?: {
        task: Task;
        performance: TaskPerformance;
        dailyData: Array<{
            date: DateKey;
            scheduled: boolean;
            completed: boolean;
        }>;
        trend: TrendComparison;
        highlights: HighlightInfo;
    };
}