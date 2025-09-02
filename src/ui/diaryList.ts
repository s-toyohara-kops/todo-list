import { getState, getAllDiaryEntries, getDiaryEntriesFor, getDiaryCategories, deleteDiaryEntry } from '../state';
import { formatDateLabel } from '../lib/date';
import type { DiaryEntry, DateKey } from '../types';

let currentFilter: { type: 'all' | 'date' | 'category'; value?: string } = { type: 'all' };

export function renderDiaryList(container: HTMLElement) {
    const { selectedDate } = getState();

    container.innerHTML = `
        <div class="view-header">
            <h2>📖 ダイアリー</h2>
            <button class="btn btn-primary" onclick="window.location.hash='diaryCreate'">
                ✏️ 新規作成
            </button>
        </div>
        
        <div class="diary-filters card">
            <div class="filter-buttons">
                <button class="btn btn-secondary filter-btn" data-filter="all">
                    📚 すべて
                </button>
                <button class="btn btn-secondary filter-btn" data-filter="date">
                    🗓️ 日付指定
                </button>
                <button class="btn btn-secondary filter-btn" data-filter="category">
                    🏷️ カテゴリー別
                </button>
            </div>
            
            <div class="date-filter" id="date-filter" style="display: none;">
                <input type="date" class="form-input" id="date-select" value="${selectedDate}">
            </div>
            
            <div class="category-filter" id="category-filter" style="display: none;">
                <select class="form-input" id="category-select">
                    <option value="">カテゴリーを選択</option>
                    ${getDiaryCategories().map(cat =>
        `<option value="${cat}">${cat}</option>`
    ).join('')}
                </select>
            </div>
            
            <div class="filter-status" id="filter-status"></div>
        </div>
        
        <div class="diary-entries" id="diary-entries">
            <!-- エントリー一覧がここに表示される -->
        </div>
    `;

    // イベントリスナーを設定
    setupEventListeners(container);

    // 初期表示
    updateDiaryList(container);
}

function setupEventListeners(container: HTMLElement) {
    // フィルターボタンのイベント
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            const filterType = target.dataset.filter as 'all' | 'today' | 'date' | 'category';

            // アクティブ状態の更新
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            target.classList.add('active');

            handleFilterChange(filterType, container);
        });
    });

    // 日付選択のイベント
    const dateSelect = container.querySelector('#date-select') as HTMLInputElement;
    dateSelect?.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
            currentFilter = { type: 'date', value: target.value };
            updateDiaryList(container);
        }
    });

    // カテゴリー選択のイベント
    const categorySelect = container.querySelector('#category-select') as HTMLSelectElement;
    categorySelect?.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        if (target.value) {
            currentFilter = { type: 'category', value: target.value };
            updateDiaryList(container);
        }
    });
}

function handleFilterChange(filterType: 'all' | 'today' | 'date' | 'category', container: HTMLElement) {
    const dateFilter = container.querySelector('#date-filter') as HTMLElement;
    const categoryFilter = container.querySelector('#category-filter') as HTMLElement;
    const dateSelect = container.querySelector('#date-select') as HTMLInputElement;
    const categorySelect = container.querySelector('#category-select') as HTMLSelectElement;

    // すべてのフィルターを非表示
    dateFilter.style.display = 'none';
    categoryFilter.style.display = 'none';

    switch (filterType) {
        case 'all':
            currentFilter = { type: 'all' };
            break;

        case 'today':
            currentFilter = { type: 'date', value: getState().selectedDate };
            break;

        case 'date':
            dateFilter.style.display = 'block';
            // 現在の日付選択値でフィルター適用
            if (dateSelect.value) {
                currentFilter = { type: 'date', value: dateSelect.value };
            } else {
                // デフォルトで今日の日付を設定
                dateSelect.value = getState().selectedDate;
                currentFilter = { type: 'date', value: dateSelect.value };
            }
            break;

        case 'category':
            categoryFilter.style.display = 'block';
            categorySelect.value = '';
            // カテゴリー選択まで待つ
            return;
    }

    updateDiaryList(container);
}

function updateDiaryList(container: HTMLElement) {
    const entriesContainer = container.querySelector('#diary-entries') as HTMLElement;
    const filterStatus = container.querySelector('#filter-status') as HTMLElement;

    let entries: DiaryEntry[] = [];
    let statusText = '';

    switch (currentFilter.type) {
        case 'all':
            entries = getAllDiaryEntries();
            statusText = `全 ${entries.length} 件`;
            break;

        case 'date':
            entries = getDiaryEntriesFor(currentFilter.value as DateKey);
            statusText = `${formatDateLabel(currentFilter.value as DateKey)}  ${entries.length} 件`;
            break;

        case 'category':
            entries = getAllDiaryEntries().filter(entry => entry.category === currentFilter.value);
            statusText = `「${currentFilter.value}」カテゴリー ${entries.length} 件`;
            break;
    }

    // フィルター状態の表示
    filterStatus.textContent = statusText;

    // エントリー一覧の表示
    entriesContainer.innerHTML = entries.map(entry => `
        <div class="diary-entry-card card" data-entry-id="${entry.id}">
            <div class="entry-header">
                <div class="entry-meta">
                    <span class="entry-date">📅 ${formatDateLabel(entry.date)}</span>
                    <span class="entry-category">🏷️ ${entry.category}</span>
                </div>
                <div class="entry-actions">
                    <button class="btn-icon edit-btn" data-entry-id="${entry.id}" title="編集">
                        ✏️
                    </button>
                    <button class="btn-icon delete-btn" data-entry-id="${entry.id}" title="削除">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="entry-content">
                ${entry.content.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('')}
            </div>
            <div class="entry-footer">
                <small class="entry-time">
                    作成: ${new Date(entry.createdAt).toLocaleString('ja-JP')}
                    ${entry.updatedAt ? `・更新: ${new Date(entry.updatedAt).toLocaleString('ja-JP')}` : ''}
                </small>
            </div>
        </div>
    `).join('');

    // エントリーカードのイベントリスナー
    setupEntryEventListeners(entriesContainer);
}

function setupEntryEventListeners(container: HTMLElement) {
    // 編集ボタン
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const entryId = (e.target as HTMLElement).dataset.entryId;
            if (entryId) {
                // 編集画面に遷移（エントリーIDをURLハッシュに含める）
                window.location.hash = `diaryCreate?edit=${entryId}`;
            }
        });
    });

    // 削除ボタン
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const entryId = (e.target as HTMLElement).dataset.entryId;
            if (entryId && confirm('このダイアリーを削除しますか？')) {
                deleteDiaryEntry(entryId);
                // 再描画
                const mainContainer = container.closest('.view') as HTMLElement;
                if (mainContainer) {
                    updateDiaryList(mainContainer);
                }
            }
        });
    });
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// フィルターをクリア（外部から呼び出し可能）
export function clearDiaryFilter() {
    currentFilter = { type: 'all' };
}