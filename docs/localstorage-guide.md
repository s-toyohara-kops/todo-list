# データ永続化 - LocalStorage実装ガイド

## 📚 基本知識

### LocalStorageとは？
LocalStorageは、ブラウザに内蔵されているWebストレージAPIの一つです。

**特徴**:
- ブラウザを閉じてもデータが残る（永続化）
- ドメインごとに独立してデータを保存
- 容量制限: 通常5-10MB程度
- 同期的なAPI（非同期処理不要）
- ⭐️文字列のみ保存可能（オブジェクトはJSON化が必要）

**他のストレージとの違い**:
- **SessionStorage**: タブを閉じると消える
- **Cookie**: サーバーとの通信で自動送信される
- **IndexedDB**: より大容量、複雑なデータ構造に対応

### なぜLocalStorageを選ぶのか？
✅ **シンプル**: APIが分かりやすい  
✅ **十分な容量**: ToDoアプリには十分  
✅ **オフライン対応**: ネット環境不要  
✅ **学習しやすい**: 初心者向け  

---

## 🏗️ プロジェクト構成案

現在のプロジェクト構造を活かしつつ、データ永続化機能を追加します。

```
src/
├── lib/
│   ├── date.ts          # 既存: 日付ユーティリティ
│   └── storage.ts       # 🆕 LocalStorage操作
├── state.ts             # 既存: 状態管理（修正予定）
├── types.ts             # 既存: 型定義（拡張予定）
└── ...
```

### 新規追加ファイル

#### `src/lib/storage.ts`
**役割**: LocalStorageの読み書きを担当
- データの保存・読み込み
- JSON変換処理
- エラーハンドリング
- データ移行・バージョン管理

#### 既存ファイルの修正

#### `src/state.ts`
**修正内容**: 状態変更時に自動保存機能を追加
- ストア初期化時にLocalStorageから読み込み
- 状態変更時（`emit()`）に自動保存
- バックアップ・復元機能

#### `src/types.ts`
**拡張内容**: ストレージ関連の型定義を追加
- バージョン管理用の型
- 移行データの型

---

## 🔄 データフロー

### 1. アプリ起動時
```
ブラウザ起動
↓
main.ts実行
↓
initStore()呼び出し
↓
storage.tsからデータ読み込み
↓
storeに反映
↓
UI描画
```

### 2. データ変更時
```
ユーザー操作（タスク追加など）
↓
state.tsの関数実行
↓
内部storeを更新
↓
emit()実行
↓
storage.tsに自動保存
↓
UI再描画
```

### 3. データ構造
```typescript
// LocalStorageに保存する形式
interface StorageData {
  version: string;        // データ形式のバージョン
  tasks: Task[];         // タスクリスト
  completion: CompletionMap; // 完了状態
  lastUpdated: number;   // 最終更新時刻
}
```

---

## ⚡ 実装のポイント

### 1. エラーハンドリング
- ストレージ容量不足
- JSON解析エラー
- 古いデータ形式への対応

### 2. パフォーマンス
- 頻繁な保存を避ける（デバウンス）
- 必要な時だけ読み込み
- 大量データの分割保存

### 3. データ整合性
- 保存前のバリデーション
- 破損データの検出・修復
- バックアップ機能

### 4. 開発時の注意点
- ブラウザの開発者ツールでデータ確認可能
- プライベートブラウジングでは制限あり
- 異なるブラウザ間でデータ共有不可

---

## 🔧 実装手順

### Step 1: `storage.ts`作成
基本的な保存・読み込み機能を実装

### Step 2: `state.ts`修正
初期化と自動保存機能を追加

### Step 3: テスト・デバッグ
ブラウザの開発者ツールで動作確認

### Step 4: エラーハンドリング強化
例外処理とフォールバック機能を追加

---

## 🧪 テスト方法

### 基本動作確認
1. タスクを追加
2. ブラウザを再読み込み
3. データが残っているか確認

### 開発者ツールでの確認
```javascript
// コンソールで実行
localStorage.getItem('todo-app-data');
```

### エラーケースのテスト
- ストレージを手動で削除
- 不正なJSONデータを挿入
- 容量制限のテスト

---

## 📝 学習メモ
<!-- 実装中に気づいたことを記録 -->

## 🔗 参考資料
- [MDN - Web Storage API](https://developer.mozilla.org/ja/docs/Web/API/Web_Storage_API)
- [LocalStorage vs SessionStorage](https://developer.mozilla.org/ja/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)

