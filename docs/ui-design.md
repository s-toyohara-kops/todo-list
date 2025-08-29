# UI設計ドキュメント

## 🎨 デザインコンセプト
温かみのあるベージュを基調とした、習慣管理とダイアリー機能を統合したライフログアプリ。
黒をアクセントカラーに使用することで、全体的に引き締まった洗練された印象を与える。

---

## 🎨 デザインシステム

### カラーパレット

```css
:root {
  /* ベースカラー: 温かみのあるベージュ */
  --color-base: #f7f6f4;
  
  /* プライマリカラー: 黒 - 引き締まった印象 */
  --color-primary: #1a1a1a;
  
  /* セカンダリカラー: ダークオリーブグリーン */
  --color-secondary: #6b7c5a;
  
  /* アクセントカラー: セージグリーン */
  --color-accent: #8b9a7a;
  
  /* カードカラー: 白 */
  --color-card: #ffffff;
  
  /* グラデーション */
  --gradient-bg: linear-gradient(135deg, #f7f6f4 0%, #f0efed 100%);
  --gradient-header: linear-gradient(90deg, #6b7c5a 0%, #8b9a7a 100%);
}
```

### タイポグラフィ

```css
/* フォントファミリー */
--font-family: system-ui, 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;

/* フォントサイズ */
--text-xs: 12px;    /* キャプション */
--text-sm: 14px;    /* 補助テキスト */
--text-base: 16px;  /* 基本テキスト */
--text-lg: 18px;    /* 見出し小 */
--text-xl: 20px;    /* 見出し中 */
--text-2xl: 24px;   /* 見出し大 */
```

### レイアウト・スペーシング

```css
/* 角丸 */
--radius-sm: 8px;
--radius-base: 12px;  /* rounded-xl相当 */
--radius-lg: 16px;

/* スペーシング */
--space-xs: 4px;
--space-sm: 8px;
--space-base: 16px;
--space-lg: 24px;
--space-xl: 32px;

/* シャドウ */
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-base: 0 4px 8px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

---

## 📱 アプリケーション構成

### 4画面構成

#### 1. メイン画面（main）
```
┌─────────────────────────────────────────────────┐
│ [≡] ToDo                                   📱   │ ← ヘッダー
├─────────────────────────────────────────────────┤
│ ┌──────────────┐ │ 2025/08/13 (水)    1/2 ◀│
│ │ 2025年8月     │ │ 完了                    │
│ │ ◀  [日月火...] ▶│ │                        │
│ │ [28][29][30]  │ │ 今日のタスク              │
│ │ [31][ 1][ 2]  │ │ ┌────────────────────┐    │
│ │ [ 3][ 4]...   │ │ │☐ 水を飲む  毎日・健康習慣 │    │
│ │               │ │ └────────────────────┘    │
│ │ [今日]        │ │                        │
│ │ [タスク作成]   │ │ 完了済みタスク           │
│ │ [ダイアリー]   │ │ ┌────────────────────┐    │
│ │               │ │ │☑ ジムに行く  人間関係   │    │
│ └──────────────┘ │ └────────────────────┘    │
└─────────────────────────────────────────────────┘
```

#### 2. タスク作成画面（create）
```
┌─────────────────────────────────────────────────┐
│ ← タスク作成                              保存   │
├─────────────────────────────────────────────────┤
│ 習慣名                                          │
│ ┌─────────────────────────────────────────────┐  │
│ │ 水を飲む                                    │  │
│ └─────────────────────────────────────────────┘  │
│                                                │
│ 繰り返し設定                                     │
│ ○ 毎日                                          │
│ ● 曜日指定  [月][火][水][木][金][土][日]         │
│ ○ なし（一度だけ）                               │
│                                                │
│ リマインド時間（任意）                            │
│ ┌─────────────────────────────────────────────┐  │
│ │ 09:00                                      │  │
│ └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

#### 3. ダイアリー一覧画面（diary）
```
┌─────────────────────────────────────────────────┐
│ ← ダイアリー                              新規作成 │
│ 日記一覧                                        │
├─────────────────────────────────────────────────┤
│ フィルター                                       │
│ 日付で絞り込み         カテゴリーで絞り込み        │
│ ┌────────────┐      ┌────────────────────┐      │
│ │年/月/日      │      │すべてのカテゴリー    ▼│      │
│ └────────────┘      └────────────────────┘      │
│                                                │
│ ┌─────────────────────────────────────────────┐  │
│ │ 2025/08/13 (水)                    日常 今日 │  │
│ │ 今日は良い一日でした。朝から運動をして、       │  │
│ │ 仕事も順調に進みました...                   │  │
│ └─────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────┐  │
│ │ 2025/08/12 (火)                    仕事 昨日 │  │
│ │ 新しいプロジェクトが始まりました。          │  │
│ │ チームメンバーとの打ち合わせも...           │  │
│ └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

#### 4. ダイアリー作成画面（diaryCreate）
```
┌─────────────────────────────────────────────────┐
│ ← 新しいダイアリー                          保存   │
│ 日記を作成                                      │
├─────────────────────────────────────────────────┤
│ 日付                                           │
│ ┌─────────────────────────────────────────────┐  │
│ │ 2025/08/13                               📅│  │
│ └─────────────────────────────────────────────┘  │
│                                                │
│ カテゴリー                                       │
│ ┌─────────────────────────────────────────────┐  │
│ │ カテゴリーを選択                           ▼│  │
│ └─────────────────────────────────────────────┘  │
│                                                │
│ note                                           │
│ ┌─────────────────────────────────────────────┐  │
│ │                                            │  │
│ │                                            │  │
│ │                                            │  │
│ │                                            │  │
│ │                                            │  │
│ │                                            │  │
│ │                                            │  │
│ │                                            │  │
│ └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🏗️ レイアウト構造

### 2カラムレイアウト

```css
.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width, 280px) 1fr;
  height: 100vh;
  background: var(--gradient-bg);
}

/* ドラッグリサイズ機能 */
.sidebar {
  min-width: 200px;
  max-width: 400px;
  resize: horizontal;
  overflow: auto;
}

/* レスポンシブ: モバイル */
@media (max-width: 768px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 300ms ease;
  }
  
  .sidebar.is-open {
    transform: translateX(0);
  }
}
```

### カードベースデザイン

```css
.card {
  background: var(--color-card);
  border-radius: var(--radius-base);
  padding: var(--space-base);
  box-shadow: var(--shadow-base);
  transition: all 300ms ease;
}

.card:hover {
  box-shadow: var(--shadow-xl);
  border-color: var(--color-accent);
}

/* タスクカード */
.task-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: 44px; /* タッチターゲット */
}

/* ダイアリーカード */
.diary-card {
  margin-bottom: var(--space-base);
}

.diary-card .category-badge {
  background: var(--color-accent);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}
```

---

## 🎯 インタラクション設計

### アニメーション・トランジション

```css
/* 基本トランジション */
.transition-base {
  transition: all 300ms ease;
}

/* サイドバー開閉 */
.sidebar-toggle {
  transition: transform 300ms ease;
}

/* ホバーエフェクト */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* フェードイン */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 300ms ease;
}
```

### タッチ・クリックターゲット

```css
/* 最小タッチターゲット: 44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ボタンスタイル */
.btn {
  padding: 12px 24px;
  border: 1px solid var(--color-secondary);
  border-radius: var(--radius-base);
  background: var(--color-card);
  color: var(--color-primary);
  transition: all 300ms ease;
}

.btn:hover {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.btn-primary {
  background: var(--color-secondary);
  color: white;
  border-color: var(--color-secondary);
}

.btn-primary:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
```

---

## 🔄 画面遷移

### ルーティング

```typescript
type AppView = 'main' | 'create' | 'diary' | 'diaryCreate';

interface AppState {
  currentView: AppView;
  // ... 他の状態
}

// ハッシュベースルーティング
const routes = {
  '#main': 'main',
  '#create': 'create', 
  '#diary': 'diary',
  '#diary/create': 'diaryCreate'
} as const;
```

### ナビゲーション

```css
/* サイドバーナビゲーション */
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.nav-item {
  padding: 12px 16px;
  border-radius: var(--radius-base);
  transition: all 300ms ease;
  cursor: pointer;
}

.nav-item.is-active {
  background: var(--color-secondary);
  color: white;
}

.nav-item:hover:not(.is-active) {
  background: var(--color-accent);
  color: white;
}
```

---

## 📋 コンポーネント仕様

### カレンダーコンポーネント

```css
.calendar {
  border-radius: var(--radius-base);
  overflow: hidden;
}

.calendar-header {
  background: var(--gradient-header);
  color: white;
  padding: var(--space-base);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e5e5e5;
}

.calendar-cell {
  background: white;
  padding: 8px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 300ms ease;
}

.calendar-cell:hover {
  background: var(--color-accent);
  color: white;
}

.calendar-cell.is-selected {
  background: var(--color-secondary);
  color: white;
}

.calendar-cell.is-today {
  background: var(--color-primary);
  color: white;
  font-weight: bold;
}
```

### フォームコンポーネント

```css
.form-group {
  margin-bottom: var(--space-base);
}

.form-label {
  display: block;
  margin-bottom: var(--space-sm);
  font-weight: 500;
  color: var(--color-primary);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: var(--radius-base);
  transition: all 300ms ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(139, 154, 122, 0.1);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor'><polyline points='6,9 12,15 18,9'></polyline></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}
```

---

## 🚀 実装優先度

### Phase 1: デザインシステム基盤 (1-2週間)
- [x] カラーパレット定義
- [ ] CSS変数システム
- [ ] 2カラムレイアウト
- [ ] 基本コンポーネント（ボタン、カード、フォーム）
- [ ] レスポンシブ対応

### Phase 2: ダイアリー機能 (2-3週間)
- [ ] データモデル拡張
- [ ] ダイアリー一覧画面
- [ ] ダイアリー作成画面
- [ ] カテゴリー管理機能

### Phase 3: 画面遷移システム (1週間)
- [ ] ルーティング実装
- [ ] ナビゲーション強化
- [ ] URL連携

### Phase 4: UX改善 (1週間)
- [ ] アニメーション追加
- [ ] ローディング状態
- [ ] エラーハンドリング
- [ ] 最終調整

---

## 📝 実装メモ

### 既存コードとの互換性
- 現在の `style.css` を段階的に移行
- タスク管理機能のロジックは保持
- LocalStorage の形式は拡張のみ

### パフォーマンス考慮
- CSS変数の活用でテーマ変更を高速化
- 必要な部分のみ再レンダリング
- 画像の最適化（SVGアイコン使用）

### アクセシビリティ
- 適切なコントラスト比の確保
- キーボードナビゲーション対応
- スクリーンリーダー対応（ARIA属性）

---
```

両ドキュメントを新しいデザインシステムと4画面構成に合わせて完全に更新いたしました！

**主な変更点**:

### `roadmap.md` の更新
- ✅ アプリコンセプトをダイアリー機能を含む統合アプリに変更
- ✅ 4画面構成の明確化
- ✅ 新デザインシステムの要件を含むフェーズ構成に再編
- ✅ 具体的な実装期間とマイルストーンを追加
- ✅ 現在の実装状況（85%完了）を正確に反映

### `ui-design.md` の更新
- ✅ 完全な新デザインシステムの仕様書化
- ✅ 温かみのあるベージュ系カラーパレットの定義
- ✅ 4画面すべてのワイヤーフレーム追加
- ✅ CSS実装例とコンポーネント仕様を詳細化
- ✅ レスポンシブ対応とアニメーション仕様を追加

これで、開発チーム全体が同じビジョンを共有して実装を進められる詳細な設計書が完成しました！

