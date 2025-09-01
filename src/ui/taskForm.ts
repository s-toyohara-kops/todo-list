import { addRecurringTask, addOneTimeTask, getState, setSelectedDate } from '../state';
import type { Weekday, DateKey } from '../types';

export function renderTaskForm(container: HTMLElement) {
    const { selectedDate } = getState();

    console.log(selectedDate);

    container.innerHTML = `
    <form class="tfm" autocomplete="off">
        <div class="form-group">
            <input class="form-input tfm-title" type="text" id="task-title" placeholder="タスク名を入力" />
        </div>

        <fieldset class="tfm-schedule">
            <legend class="form-label">スケジュール</legend>

            <label class="tfm-radio">
                <input type="radio" name="rule" value="none" checked />
                対象日
            </label>

            <div class="tfm-date-selector" data-disabled="false">
                <input class="form-input" type="date" id="selected-date" value="${selectedDate}" />
            </div>

            <label class="tfm-radio">
                <input type="radio" name="rule" value="daily" />
                毎日
            </label>

            <label class="tfm-radio">
                <input type="radio" name="rule" value="weekly" />
                曜日指定
            </label>

            <div class="tfm-weekdays" data-disabled="true">
                <div class="tfm-help">実行する曜日を選択してください</div>
                ${weekdayCheckboxes()}
            </div>
        </fieldset>

        <div class="form-group">
            <label class="form-label" for="reminder-time">リマインド時間（任意）</label>
            <input class="form-input" type="time" id="reminder-time" placeholder="09:00" />
            <div class="tfm-help">通知したい時間を設定できます（将来実装予定）</div>
        </div>

        <div class="form-actions">
            <button class="btn btn-primary tfm-add" type="submit">タスクを追加</button>
        </div>

        <p class="tfm-error" hidden></p>
    </form>
    `;

    const elForm = container.querySelector('form.tfm') as HTMLElement;
    const elTitle = container.querySelector('.tfm-title') as HTMLInputElement;
    const elDateInput = container.querySelector('#selected-date') as HTMLInputElement;
    const elErr = container.querySelector('.tfm-error') as HTMLParagraphElement;
    const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[name="rule"]'));
    const weekdayBox = container.querySelector('.tfm-weekdays') as HTMLDivElement;


    // 日付入力フィールドの変更を監視
    elDateInput.addEventListener('change', () => {
        const newDate = elDateInput.value as DateKey;
        if (newDate) {
            setSelectedDate(newDate);
        }
    })
    // 繰り返し設定に応じて表示を切り替える
    const updateFormDisplay = () => {
        const rule = getRuleKind(radios);

        // 曜日選択の有効/無効
        const weekdayDisabled = rule !== 'weekly';
        weekdayBox.dataset.disabled = String(weekdayDisabled);
        weekdayBox.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(cb => {
            cb.disabled = weekdayDisabled;
        });

        radios.forEach(r => r.addEventListener('change', updateFormDisplay));
        updateFormDisplay();
    }

    // フォーム送信
    elForm.addEventListener('submit', (e) => {
        e.preventDefault();
        elErr.hidden = true;
        elErr.textContent = '';

        const title = elTitle.value.trim();
        if (!title) {
            return showError(elErr, 'タスク名を入力してください');
        }

        const rule = getRuleKind(radios);

        try {
            if (!rule) { // rule が undefined の場合（繰り返しなし）
                // 繰り返しなし - 選択された日付を使用
                if (!selectedDate) {
                    return showError(elErr, '対象日を選択してください');
                }
                addOneTimeTask(title, selectedDate);
            } else if (rule === 'daily') {
                addRecurringTask(title, { kind: 'daily' });
            } else if (rule === 'weekly') {
                const checkedDays = getCheckedWeekdays(weekdayBox);
                if (checkedDays.length === 0) {
                    return showError(elErr, '実行する曜日を選択してください');
                }
                addRecurringTask(title, { kind: 'weekly', days: checkedDays });
            }

            // フォームをリセット
            elTitle.value = '';

            // メイン画面に戻る
            window.location.hash = 'main';

        } catch (error) {
            showError(elErr, 'タスクの追加に失敗しました');
            console.error('タスク追加エラー:', error);
        }
    });

    // Enterキーでの送信
    elTitle.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (e.metaKey || e.ctrlKey) {
                e.preventDefault();
                (container.querySelector('.tfm-add') as HTMLButtonElement).click();
            } else {
                e.preventDefault();
            }
        }
    });

    // 初期フォーカス
    setTimeout(() => {
        elTitle.focus();
    }, 100);
}

function weekdayCheckboxes(): string {
    const labels = ['日', '月', '火', '水', '木', '金', '土'];

    return `
        <div class="weekday-grid">
            ${labels
            .map((label, idx) => {
                return `
                    <label class="tfm-wd">
                        <input type="checkbox" value="${idx}" />
                        <span class="weekday-label">${label}</span>
                    </label>
                `;
            })
            .join('')}
        </div>
    `;
}

function getRuleKind(radios: HTMLInputElement[]): 'daily' | 'weekly' | undefined {
    const r = radios.find(r => r.checked);
    if (r?.value === 'weekly') return 'weekly';
    if (r?.value === 'daily') return 'daily';
    return undefined; // "none" の場合
}

function getCheckedWeekdays(box: HTMLDivElement): Weekday[] {
    const checked = Array.from(box.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'));
    return checked.map(c => Number(c.value) as Weekday);
}

function showError(el: HTMLParagraphElement, msg: string) {
    el.textContent = msg;
    el.hidden = false;
    el.style.color = '#dc3545';
    el.style.background = '#f8d7da';
    el.style.padding = '8px 12px';
    el.style.borderRadius = '6px';
    el.style.border = '1px solid #f5c6cb';
}


