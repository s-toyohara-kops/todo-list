import {
    getState,
    getTasksFor,
    isCompleted,
    setCompletion,
    editTask,
    deleteTask,
    removeTaskFromDate,
} from '../state';
import type { Task } from '../types';

export function renderDayList(container: HTMLElement) {
    const { selectedDate } = getState();
    const allTasks = getTasksFor(selectedDate);

    // 完了・未完了でタスクを分離
    const incompleteTasks = allTasks.filter(t => !isCompleted(t.id, selectedDate));
    const completedTasks = allTasks.filter(t => isCompleted(t.id, selectedDate));

    container.innerHTML = `
    <div class="dl-section">
        <div class="dl-head">
            <span>この日のタスク</span>
            <span class="dl-count">${incompleteTasks.length}件</span>
        </div>
        <ul class="dl-list" id="incomplete-tasks"></ul>
        <div class="dl-empty" ${incompleteTasks.length ? 'hidden' : ''}>この日はタスクがありません</div>
    </div>
    
    ${completedTasks.length > 0 ? `
    <div class="dl-section dl-completed">
        <div class="dl-head">
            <span>完了したタスク</span>
            <span class="dl-count">${completedTasks.length}件</span>
        </div>
        <ul class="dl-list" id="completed-tasks"></ul>
    </div>
    ` : ''}
    `;

    const incompleteUl = container.querySelector('#incomplete-tasks') as HTMLUListElement;
    const completedUl = container.querySelector('#completed-tasks') as HTMLUListElement;

    // 未完了タスクを描画
    for (const task of incompleteTasks) {
        const li = createTaskItem(task, selectedDate, false);
        incompleteUl.appendChild(li);
    }

    // 完了タスクを描画
    for (const task of completedTasks) {
        const li = createTaskItem(task, selectedDate, true);
        if (completedUl) completedUl.appendChild(li);
    }
}

function createTaskItem(task: Task, selectedDate: string, isCompleted: boolean): HTMLLIElement {
    const li = document.createElement('li');
    li.className = `dl-item ${isCompleted ? 'dl-item-completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'dl-check';
    checkbox.checked = isCompleted;

    const title = document.createElement('span');
    title.className = `dl-title ${isCompleted ? 'is-done' : ''}`;
    title.textContent = task.title;

    const btnEdit = document.createElement('button');
    btnEdit.className = 'dl-btn';
    btnEdit.textContent = '編集';

    const btnDel = document.createElement('button');
    btnDel.className = 'dl-btn dl-danger';
    btnDel.textContent = '削除';

    // チェックボックスの変更イベント
    checkbox.addEventListener('change', () => {
        setCompletion(task.id, selectedDate, checkbox.checked);
        // 再描画してタスクを適切なセクションに移動
        const container = li.closest('.day-list') as HTMLElement;
        if (container) {
            renderDayList(container);
        }
    });

    // 編集ボタン
    btnEdit.addEventListener('click', () => {
        const current = task.title;
        const next = window.prompt('タイトルを編集', current);
        if (next === null) return;
        const trimmed = next.trim();
        if (!trimmed) return;
        editTask(task.id, trimmed);
    });

    // 削除ボタン
    btnDel.addEventListener('click', () => {
        handleDeleteTask(task, selectedDate);
    });

    li.append(checkbox, title, btnEdit, btnDel);
    return li;
}

function handleDeleteTask(task: Task, selectedDate: string): Promise<void> {
    return new Promise((resolve) => {
        if (!task.rule) {
            // スケジュールなしタスクは完全削除のみ
            if (confirm(`「${task.title}」を削除しますか？`)) {
                deleteTask(task.id);
            }
            resolve();
        } else {
            // スケジュールありタスクは選択肢を提供
            showDeleteDialog(task, selectedDate, resolve);
        }
    });
}

function showDeleteDialog(task: Task, selectedDate: string, callback: () => void) {
    // カスタムダイアログを作成
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    dialog.innerHTML = `
        <div class="dialog-content">
            <h3>タスクの削除</h3>
            <p>「${task.title}」をどのように削除しますか？</p>
            <div class="dialog-buttons">
                <button class="dialog-btn dialog-btn-primary" id="delete-today">この日のみ削除</button>
                <button class="dialog-btn dialog-btn-danger" id="delete-all">全体を削除</button>
                <button class="dialog-btn dialog-btn-secondary" id="cancel">キャンセル</button>
            </div>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // ボタンのイベントリスナー
    const deleteTodayBtn = dialog.querySelector('#delete-today') as HTMLButtonElement;
    const deleteAllBtn = dialog.querySelector('#delete-all') as HTMLButtonElement;
    const cancelBtn = dialog.querySelector('#cancel') as HTMLButtonElement;

    const closeDialog = () => {
        document.body.removeChild(overlay);
        callback();
    };

    // この日のみ削除
    deleteTodayBtn.addEventListener('click', () => {
        removeTaskFromDate(task.id, selectedDate);
        closeDialog();
    });

    // 全体削除
    deleteAllBtn.addEventListener('click', () => {
        if (confirm(`「${task.title}」を完全に削除しますか？\n（すべての日から削除されます）`)) {
            deleteTask(task.id);
        }
        closeDialog();
    });

    cancelBtn.addEventListener('click', closeDialog);

    // オーバーレイクリックで閉じる
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    });
}