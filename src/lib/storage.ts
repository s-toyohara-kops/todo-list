import type { Store, StorageData } from '../types';

const STORAGE_KEY = 'todo-app-data';
const CURRENT_VERSION = '1.1.0'; // ダイアリー機能追加でバージョンアップ

export interface StorageResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// LocalStorageからデータを読み込む
export function loadFromStorage(): StorageResult<Store> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return {
                success: true,
                data: createDefaultStore()
            };
        }

        const parsedData = JSON.parse(stored);

        // バージョンチェック
        if (!parsedData.version || parsedData.version !== CURRENT_VERSION) {
            console.log('古いバージョンのデータを検出、移行します');
            const migratedStore = migrateData(parsedData);
            // 移行後のデータを保存
            saveToStorage(migratedStore);
            return {
                success: true,
                data: migratedStore
            };
        }

        // データの整合性チェック
        const validationResult = validateStorageData(parsedData);
        if (!validationResult.success) {
            throw new Error(validationResult.error);
        }

        // Storeの形式に変換
        const store: Store = {
            tasks: parsedData.tasks,
            completion: parsedData.completion,
            selectedDate: new Date().toISOString().split('T')[0],
            diaryEntries: parsedData.diaryEntries || [],
            diaryCategories: parsedData.diaryCategories || ['日常', '仕事', '運動', '食事']
        };

        return {
            success: true,
            data: store
        };

    } catch (error) {
        console.error('LocalStorageの読み込みエラー:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー'
        };
    }
}

// LocalStorageにデータを保存する
export function saveToStorage(store: Store): StorageResult<void> {
    try {
        const storageData: StorageData = {
            version: CURRENT_VERSION,
            tasks: store.tasks,
            completion: store.completion,
            diaryEntries: store.diaryEntries,
            diaryCategories: store.diaryCategories,
            lastUpdated: Date.now()
        };

        const jsonString = JSON.stringify(storageData);
        localStorage.setItem(STORAGE_KEY, jsonString);

        return {
            success: true
        };

    } catch (error) {
        console.error('LocalStorageの保存エラー:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー'
        };
    }
}

// LocalStorageのデータをクリア
export function clearStorage(): StorageResult<void> {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー'
        };
    }
}

// デフォルトのストア状態を作成
function createDefaultStore(): Store {
    return {
        tasks: [],
        completion: {},
        selectedDate: new Date().toISOString().split('T')[0],
        diaryEntries: [],
        diaryCategories: ['日常', '仕事', '運動', '食事']
    };
}

// データの整合性をチェック
function validateStorageData(data: any): StorageResult<void> {
    if (!data || typeof data !== 'object') {
        return { success: false, error: 'データが無効です' };
    }

    if (!Array.isArray(data.tasks)) {
        return { success: false, error: 'tasksが配列ではありません' };
    }

    if (!data.completion || typeof data.completion !== 'object') {
        return { success: false, error: 'completionが無効です' };
    }

    return { success: true };
}

// 古いバージョンデータを新しい形式に移行
function migrateData(oldData: any): Store {
    console.log('データ移行:', oldData);

    // 既存データをそのまま使用し、新しいフィールドを追加
    return {
        tasks: Array.isArray(oldData.tasks) ? oldData.tasks : [],
        completion: oldData.completion && typeof oldData.completion === 'object' ? oldData.completion : {},
        selectedDate: new Date().toISOString().split('T')[0],
        diaryEntries: Array.isArray(oldData.diaryEntries) ? oldData.diaryEntries : [],
        diaryCategories: Array.isArray(oldData.diaryCategories) ? oldData.diaryCategories : ['日常', '仕事', '運動', '食事']
    };
}