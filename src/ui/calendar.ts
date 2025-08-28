import { getState, setSelectedDate } from '../state';
import { toKey, fromKey, getMonthMatrix, isSameDay } from '../lib/date';
import type { DateKey } from '../types';

export function renderCalender(container: HTMLElement) {
    const { selectedDate } = getState();
    const base = fromKey(selectedDate);
    const matrix = getMonthMatrix(base);

    const monthLabel = `${base.getFullYear()}年${base.getMonth() + 1}月`;

    container.innerHTML = `
        <div class="cal-head">
            <button class="cal-nav cal-prev" aria-label="前の月">◀︎</button>
            <div class="cal-title">${monthLabel}</div>
            <button class="cal-nav cal-next" aria-label="次の月">▶︎</button>
        </div>

        <div class="cal-grid">
            ${['日', '月', '火', '水', '木', '金', '土'].map((w) => `<div class="cal-w">${w}</div>`).join('')}

            ${matrix
            .flat()
            .map((d) => {
                const key = toKey(d);
                const isSel = isSameDay(d, fromKey(selectedDate));
                const isSameMonth = d.getMonth() === base.getMonth();
                const klass = [
                    'cal-cell',
                    isSel ? 'is-selected' : '',
                    isSameMonth ? '' : 'is-dim',
                ]
                    .filter(Boolean)
                    .join('');
                return `<button class="${klass}" data-date="${key}">${d.getDate()}</button>`;
            })
            .join('')}
        </div>
    `;

    (container.querySelector('.cal-prev') as HTMLButtonElement).onclick = () => {
        const d = new Date(base);
        d.setMonth(d.getMonth() - 1);
        setSelectedDate(alignWithinMonth(selectedDate, d));
    };
    (container.querySelector('.cal-next') as HTMLButtonElement).onclick = () => {
        const d = new Date(base);
        d.setMonth(d.getMonth() + 1);
        setSelectedDate(alignWithinMonth(selectedDate, d));
    };

    container.querySelectorAll<HTMLButtonElement>('.cal-cell').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.date as DateKey;
            setSelectedDate(key);
        });
    });

    function alignWithinMonth(currentKey: DateKey, targetMonthDate: Date): DateKey {
        const cur = fromKey(currentKey);
        const day = cur.getDate();              // 現在の日
        const d = new Date(targetMonthDate);
        d.setDate(1);                           // 移動先月の1日
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); // 月末日

        // 現在の日が移動先月に存在するかチェック
        const targetDay = Math.min(day, last);  // より小さい値を選択
        d.setDate(targetDay);                   // 調整された日付を設定

        return toKey(d);
    }
}