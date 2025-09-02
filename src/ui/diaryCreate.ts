import { getState, addDiaryEntry, updateDiaryEntryFull, getDiaryCategories, addDiaryCategory } from '../state';
import type { DiaryEntry, DateKey } from '../types';

let editingEntry: DiaryEntry | null = null;

export function renderDiaryCreate(container: HTMLElement) {
    const { selectedDate } = getState();

    // URLからエントリーIDを取得（編集モード判定）
    const fullHash = window.location.hash;
    const urlParams = new URLSearchParams(fullHash.split('?')[1] || '');
    const editId = urlParams.get('edit');

    if (editId) {
        const allEntries = getState().diaryEntries;
        editingEntry = allEntries.find(entry => entry.id === editId) || null;
    } else {
        editingEntry = null;
    }

    const isEditing = !!editingEntry;
    const targetDate = isEditing && editingEntry ? editingEntry.date : selectedDate;
    const currentCategory = isEditing && editingEntry ? editingEntry.category : '';
    const currentContent = isEditing && editingEntry ? editingEntry.content : '';

    container.innerHTML = `
        <div class="view-header">
            <button class="btn btn-back" onclick="window.location.hash='diary'">
                ← 戻る
            </button>
            <h2 class="view-title">${isEditing ? 'ダイアリー編集' : 'ダイアリー作成'}</h2>
        </div>
        
        <div class="diary-form card">
            <div class="form-group">
                <label class="form-label">🗓️ 日付</label>
                <input type="date" class="form-input" id="diary-date" value="${targetDate}">
            </div>
            
            <div class="form-group">
                <label class="form-label">🏷️ カテゴリー</label>
                <div class="category-input-group">
                    <select class="form-input" id="diary-category">
                        <option value="">カテゴリーを選択</option>
                        ${getDiaryCategories().map(cat =>
        `<option value="${cat}" ${cat === currentCategory ? 'selected' : ''}>${cat}</option>`
    ).join('')}
                    </select>
                    <button type="button" class="btn" id="add-category-btn">
                        ➕ 新規
                    </button>
                </div>
                <div class="new-category-input" id="new-category-input" style="display: none;">
                    <input type="text" class="form-input" id="new-category-name" placeholder="新しいカテゴリー名">
                    <div class="category-actions">
                        <button type="button" class="btn btn-primary" id="save-category-btn">保存</button>
                        <button type="button" class="btn btn-secondary" id="cancel-category-btn">キャンセル</button>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">📖 note</label>
                <textarea class="form-textarea" id="diary-content" rows="10">${currentContent}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-primary" id="save-diary-btn">
                    ${isEditing ? '更新' : '保存'}
                </button>
                <button type="button" class="btn btn-secondary" onclick="window.location.hash='diary'">
                    キャンセル
                </button>
            </div>
        </div>
    `;

    // イベントリスナーを設定
    setupEventListeners(container);
}

function setupEventListeners(container: HTMLElement) {
    const dateInput = container.querySelector('#diary-date') as HTMLInputElement;
    const categorySelect = container.querySelector('#diary-category') as HTMLSelectElement;
    const contentTextarea = container.querySelector('#diary-content') as HTMLTextAreaElement;
    const saveDiaryBtn = container.querySelector('#save-diary-btn') as HTMLButtonElement;

    // カテゴリー関連の要素
    const addCategoryBtn = container.querySelector('#add-category-btn') as HTMLButtonElement;
    const newCategoryInput = container.querySelector('#new-category-input') as HTMLElement;
    const newCategoryName = container.querySelector('#new-category-name') as HTMLInputElement;
    const saveCategoryBtn = container.querySelector('#save-category-btn') as HTMLButtonElement;
    const cancelCategoryBtn = container.querySelector('#cancel-category-btn') as HTMLButtonElement;

    // 新規カテゴリー追加の表示/非表示
    addCategoryBtn.addEventListener('click', () => {
        newCategoryInput.style.display = 'block';
        addCategoryBtn.style.display = 'none';
        newCategoryName.focus();
    });

    cancelCategoryBtn.addEventListener('click', () => {
        newCategoryInput.style.display = 'none';
        addCategoryBtn.style.display = 'block';
        newCategoryName.value = '';
    });

    // 新規カテゴリー保存
    saveCategoryBtn.addEventListener('click', () => {
        const categoryName = newCategoryName.value.trim();
        if (!categoryName) {
            alert('カテゴリー名を入力してください');
            return;
        }

        if (getDiaryCategories().includes(categoryName)) {
            alert('このカテゴリーは既に存在します');
            return;
        }

        // カテゴリーを追加
        addDiaryCategory(categoryName);

        // セレクトボックスを更新
        updateCategorySelect(categorySelect, categoryName);

        // 入力フィールドをリセット
        newCategoryInput.style.display = 'none';
        addCategoryBtn.style.display = 'block';
        newCategoryName.value = '';
    });

    // Enterキーでカテゴリー保存
    newCategoryName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveCategoryBtn.click();
        }
    });

    // ダイアリー保存
    saveDiaryBtn.addEventListener('click', () => {
        const date = dateInput.value as DateKey;
        const category = categorySelect.value;
        const content = contentTextarea.value.trim();

        // バリデーション
        if (!date) {
            alert('日付を選択してください');
            return;
        }

        if (!category) {
            alert('カテゴリーを選択してください');
            return;
        }

        if (!content) {
            alert('内容を入力してください');
            return;
        }

        try {
            if (editingEntry) {
                // 編集モード - 全フィールドを更新
                updateDiaryEntryFull(editingEntry.id, date, category, content);
            } else {
                // 新規作成モード
                addDiaryEntry(date, category, content);
            }

            // ダイアリー一覧に戻る
            window.location.hash = 'diary';

        } catch (error) {
            console.error('保存エラー:', error);
            alert('保存に失敗しました。もう一度お試しください。');
        }
    });

    // 自動保存（下書き機能）- オプション
    let autoSaveTimer: number;
    const autoSave = () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = window.setTimeout(() => {
            const content = contentTextarea.value.trim();
            if (content) {
                // LocalStorageに下書きを保存
                localStorage.setItem('diary-draft', JSON.stringify({
                    date: dateInput.value,
                    category: categorySelect.value,
                    content: content,
                    timestamp: Date.now()
                }));
            }
        }, 2000); // 2秒後に自動保存
    };

    contentTextarea.addEventListener('input', autoSave);
    dateInput.addEventListener('change', autoSave);
    categorySelect.addEventListener('change', autoSave);
}

function updateCategorySelect(selectElement: HTMLSelectElement, newCategory: string) {
    // 新しいオプションを追加
    const option = document.createElement('option');
    option.value = newCategory;
    option.textContent = newCategory;
    option.selected = true;
    selectElement.appendChild(option);
}

// 下書きを復元（オプション機能）
export function restoreDraft(): boolean {
    const draft = localStorage.getItem('diary-draft');
    if (!draft) return false;

    try {
        const draftData = JSON.parse(draft);
        const isRecent = Date.now() - draftData.timestamp < 24 * 60 * 60 * 1000; // 24時間以内

        if (isRecent && confirm('保存されていない下書きがあります。復元しますか？')) {
            // フォームに下書きデータを設定
            const dateInput = document.querySelector('#diary-date') as HTMLInputElement;
            const categorySelect = document.querySelector('#diary-category') as HTMLSelectElement;
            const contentTextarea = document.querySelector('#diary-content') as HTMLTextAreaElement;

            if (dateInput) dateInput.value = draftData.date;
            if (categorySelect) categorySelect.value = draftData.category;
            if (contentTextarea) contentTextarea.value = draftData.content;

            return true;
        }
    } catch (error) {
        console.error('下書き復元エラー:', error);
    }

    return false;
}

// 下書きをクリア
export function clearDraft() {
    localStorage.removeItem('diary-draft');
}
