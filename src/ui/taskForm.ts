import { addTask } from '../state';
import type { RepeatRule, Weekday } from '../types';

export function renderTaskForm(container: HTMLElement) {
    container.innerHTML = `
    <form class="tfm" autocomplete="off">
        <div class="tfm-row">
            <input class="tfm-title" type="text" />
            <button class="tfm-add" type="submit">追加</button>
        </div>
        <fieldset class="tfm-schedule">
            <legend>スケジュール</legend>

            <label class="tfm-radio">
            <input type="radio" name="rule" value="none" checked />
            繰り返しなし
            </label>

            <label class="tfm-radio">
                <input type="radio" name="rule" value="daily" />
                毎日
            </label>

            <label class="tfm-radio">
                <input type="radio" name="rule" value="weekly" />
                曜日指定
            </label>

            <div class="tfm-weekdays" data-disabled="true">
                ${weekdayCheckboxes()}
            </div>
        </fieldset>

        <p class="tdm-help">※「曜日指定を選んだら少なくとも1つはチェック</p>
        <p class="tfm-error" hidden></p>
    </form>
    `;

    const elForm = container.querySelector('form.tfm') as HTMLElement;
    const elTitle = container.querySelector('.tfm-title') as HTMLInputElement;
    const elErr = container.querySelector('.tfm-error') as HTMLParagraphElement;
    const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[name="rule"]'));
    const weekdayBox = container.querySelector('.tfm-weekdays') as HTMLDivElement;

    const updateWeekdayEnabled = () => {
        const rule = getRuleKind(radios);
        const disabled = rule !== 'weekly';
        weekdayBox.dataset.disabled = String(disabled);
        weekdayBox.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(cb => {
            cb.disabled = disabled;
        });
    };

    radios.forEach(r => r.addEventListener('change', updateWeekdayEnabled));
    updateWeekdayEnabled();

    elForm.addEventListener('submit', (e) => {
        e.preventDefault();
        elErr.hidden = true;
        elErr.textContent = '';

        const title = elTitle.value.trim();
        if (!title) {
            return showError(elErr, 'タイトルを入力')
        }

        const ruleKind = getRuleKind(radios);
        let rule: RepeatRule;

        if (ruleKind === 'none') {
            rule = { kind: 'none' };
        } else if (ruleKind === 'daily') {
            rule = { kind: 'daily' };
        } else {
            const days = getCheckedWeekdays(weekdayBox);
            if (days.length === 0) {
                return showError(elErr, '曜日を選択');
            }
            rule = { kind: 'weekly', days };
        }

        addTask(title, rule);
        elTitle.value = '';
        elTitle.focus();
    });

    elTitle.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            e.preventDefault();
            (container.querySelector('.tfm-add') as HTMLButtonElement).click();
        }
    });
}

function weekdayCheckboxes(): string {
    const labels = ['日', '月', '火', '水', '木', '金', '土'];

    return labels
        .map((label, idx) => {
            return `
            <label class="tfm-wd">
                <input type="checkbox" value="${idx}" />
                ${label}
            </label>
        `;
        })
        .join('');
}

function getRuleKind(radios: HTMLInputElement[]): 'none' | 'daily' | 'weekly' {
    const r = radios.find(r => r.checked);
    if (r?.value === 'weekly') return 'weekly';
    if (r?.value === 'daily') return 'daily';
    return 'none';
}

function getCheckedWeekdays(box: HTMLDivElement): Weekday[] {
    const checked = Array.from(box.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'));
    return checked.map(c => Number(c.value) as Weekday);
}

function showError(el: HTMLParagraphElement, msg: string) {
    el.textContent = msg;
    el.hidden = false;
}

