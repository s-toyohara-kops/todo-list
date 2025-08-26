/** 曜日：０（日）〜６（土） */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** タスクID */
export type TaskId = string;

/** 日付キー */
export type DateKey = string;

/** 繰り返しルール */
export type RepeatRule =
    | { kind: 'none' }
    | { kind: 'daily' }
    | { kind: 'weekly'; days: Weekday[] }
    | { kind: 'weekDays'; days: [1, 2, 3, 4, 5] }
    | { kind: 'weekEnds'; days: [0, 6] };

/** タスク定義 */
export interface Task {
    id: TaskId;
    title: string;
    rule: RepeatRule;
    createdAt: number;
    archived?: boolean;
}

/** 完了状態 */
export type CompletionMap = Record<DateKey, Record<TaskId, boolean>>;

/** アプリ状態 */
export interface Store {
    tasks: Task[];
    completion: CompletionMap;
    selectedDate: DateKey;
}