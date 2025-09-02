import type { DateKey, Weekday } from '../types';

export function toKey(d: Date): DateKey {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function fromKey(key: DateKey): Date {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (
        date.getFullYear() !== y ||
        date.getMonth() !== m - 1 ||
        date.getDate() !== d
    ) {
        throw new Error(`Invailed DateKey: ${key}`);
    }
    return date;
}

export function getWeekday(d: Date): Weekday {
    return d.getDay() as Weekday;
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// 画面表示用の日付文字列
export function formatDateLabel(d: Date | DateKey): string {
    const date = typeof d === 'string' ? fromKey(d) : d;
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${y}/${m}/${day}`;
}

export function weekdayJp(d: Date): string {
    return ['日', '月', '火', '水', '木', '金', '土'][getWeekday(d)];
}

export function getMonthMatrix(d: Date): Date[][] {
    const year = d.getFullYear();
    const month = d.getMonth();

    const first = new Date(year, month, 1);
    const firstW = first.getDay();

    const start = new Date(first);
    start.setDate(first.getDate() - firstW);

    const weeks: Date[][] = [];
    let cur = new Date(start);
    for (let w = 0; w < 6; w++) {
        const row: Date[] = [];
        for (let i = 0; i < 7; i++) {
            row.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }
        weeks.push(row);
    }
    return weeks;
}