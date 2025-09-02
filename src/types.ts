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
