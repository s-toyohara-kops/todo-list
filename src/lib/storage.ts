import type { Store, StorageData, StorageResult } from '../types';

// ストレージキーとバージョン
const STORAGE_KEY = 'todo-app-data';
const CURRENT_VERSION = '1.0.0';

// LocalStorageからデータを読み込む
export function loadFromStorage(): StorageResult<Store> {
    try {
        //LocalStorageからデータを取得
        const stored = localStorage.getItem(STORAGE_KEY);

        if (!stored) {
            return {
                success: true,
                data: createDefaultStore()
            };
        }

        const parsedData: StorageData = JSON.parse(stored);

        if (!parsedData.version || parsedData.version !== CURRENT_VERSION) {
            console.warn('データバージョンが古いです。移行処理を実行します');
            const migrated = migrateData(parsedData);
            return {
                success: true,
                data: migrated
            };
        }

        // データの生合成チェック
        const validatedData = validateStorageData(parsedData);
        if (!validatedData.success) {
            throw new Error(validatedData.error);
        }

        // Storeの形式に変換
        const store: Store = {
            tasks: parsedData.tasks,
            completion: parsedData.completion,
            selectedDate: new Date().toISOString().split('T')[0]
        };

        return {
            success: true,
            data: store
        };
    } catch (error) {
        console.error('ストレージからの読み込みに失敗しました：', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー',
            data: createDefaultStore()
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
            lastUpdated: Date.now()
        };

        const jsonString = JSON.stringify(storageData);
        localStorage.setItem(STORAGE_KEY, jsonString);

        return { success: true };

    } catch (error) {
        console.error('ストレージの保存nに失敗しました：', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー'
        };
    }
}

// ストレージをクリアする
export function clearStorage(): StorageResult<void> {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return { success: true };
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
        selectedDate: new Date().toISOString().split('T')[0]
    };
}

// データの生合成をチェック
function validateStorageData(data: any): StorageResult<void> {
    if (!data || typeof data !== 'object') {
        return { success: false, error: 'データ形式が不正です' };
    }

    if (!Array.isArray(data.tasks)) {
        return { success: false, error: 'タスクデータが不正です' };
    }
    if (!data.completion || typeof data.completion !== 'object') {
        return { success: false, error: '完了状態データが不正です' };
    }

    return { success: true };
}

// 古いバージョンデータを新しい形式に移行
function migrateData(oldData: any): Store {
    console.log('データ移行:', oldData);

    // 既存データをそのまま使用
    return {
        tasks: Array.isArray(oldData.tasks) ? oldData.tasks : [],
        completion: oldData.completion && typeof oldData.completion === 'object' ? oldData.completion : {},
        selectedDate: new Date().toISOString().split('T')[0]
    };
}