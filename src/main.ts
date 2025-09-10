import './style.css'
import type { DateKey } from './types';
import { initStore, subscribe, setSelectedDate, getState, getTasksFor, isCompleted } from './state';
import { renderTaskForm } from './ui/taskForm';
import { renderDayList } from './ui/dayList';
import { renderCalender } from './ui/calendar';
import { fromKey, formatDateLabel, weekdayJp, toKey } from './lib/date';
import { renderDiaryList } from './ui/diaryList';
import { renderDiaryCreate } from './ui/diaryCreate';
import { renderReport } from './ui/report';

// ユーティリティ関数
function $(sel: string, root: Document | HTMLElement = document) {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`Element not found: ${sel}`);
  return el as HTMLElement;
}

// オプショナルセレクター（エラーを投げない）
function $optional(sel: string, root: Document | HTMLElement = document) {
  return root.querySelector(sel) as HTMLElement | null;
}

// アプリの状態管理
type AppView = 'main' | 'create' | 'diary' | 'diaryCreate' | 'report';

// 日付ラベルの更新
function updateDateLabel() {
  const { selectedDate } = getState();
  const d = fromKey(selectedDate);
  ($('#date-label') as HTMLElement).textContent =
    `${formatDateLabel(d)} (${weekdayJp(d)})`;
}

// 進捗情報の更新
function updateProgressInfo() {
  // TODO: タスクの完了率を計算して表示
  const { selectedDate } = getState();
  const allTasks = getTasksFor(selectedDate);

  const progressInfo = $optional('#progress-info');
  if (!progressInfo) return;

  if (allTasks.length === 0) {
    progressInfo.textContent = '';
    return;
  }

  // 完了・未完了でタスクを分離
  const completedTasks = allTasks.filter(t => isCompleted(t.id, selectedDate));
  progressInfo.textContent = `${completedTasks.length}/${allTasks.length}完了`;
}

// 画面表示の切り替え
function showView(view: AppView) {
  // すべてのビューを非表示
  document.querySelectorAll('.view').forEach(v => {
    (v as HTMLElement).style.display = 'none';
  });

  // 対象ビューを表示
  const targetView = $(`#view-${view}`);
  if (targetView) {
    targetView.style.display = 'block';

    // ビュー固有の処理
    if (view === 'create') {
      const taskFormEl = targetView.querySelector('.task-form');
      if (taskFormEl) renderTaskForm(taskFormEl as HTMLElement);
    } else if (view === 'diary') {
      renderDiaryList(targetView);
    } else if (view === 'diaryCreate') {
      renderDiaryCreate(targetView);
    } else if (view === 'report') {
      const reportEl = $('#view-report');
      renderReport(reportEl);
    }
  }

  // ナビゲーションのアクティブ状態を更新
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('is-active');
  });

  const activeNavItem = document.querySelector(`[data-view="${view}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('is-active');
  }

  // URLハッシュを更新（既存のクエリパラメータがある場合は保持）
  const currentHash = window.location.hash;
  const hasQueryParams = currentHash.includes('?');

  if (!hasQueryParams || !currentHash.startsWith(`#${view}`)) {
    window.location.hash = view;
  }

  updateDateLabel();
  updateProgressInfo();
}

// サイドバーのトグル機能
function initSidebarToggle() {
  const sidebar = $('#sidebar');
  const sidebarOverlay = $('#sidebar-overlay');
  const sidebarToggle = $optional('#sidebar-toggle');
  const mobileSidebarToggle = $optional('#mobile-sidebar-toggle');

  // サイドバーを閉じる関数
  function closeSidebar() {
    sidebar.classList.remove('is-open');
    sidebarOverlay.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  // サイドバーを開く関数
  function openSidebar() {
    sidebar.classList.add('is-open');
    sidebarOverlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  // デスクトップ用サイドバートグル（閉じる）
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', closeSidebar);
  }

  // モバイル用サイドバートグル（開く）
  if (mobileSidebarToggle) {
    mobileSidebarToggle.addEventListener('click', openSidebar);
  }

  // オーバーレイクリックで閉じる
  sidebarOverlay.addEventListener('click', closeSidebar);

  // カレンダーの日付クリックでサイドバーを閉じる（モバイルのみ）
  function handleCalendarClick() {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  }

  // カレンダーコンテナにイベントデリゲーションを設定
  const calendarContainer = $('#calender');
  calendarContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    // カレンダーの日付セル（.cal-cell）がクリックされた場合
    if (target.classList.contains('cal-cell')) {
      handleCalendarClick();
    }
  });

  // 「今日」ボタンクリックでもサイドバーを閉じる
  const todayButton = $optional('.btn-today');
  if (todayButton) {
    todayButton.addEventListener('click', handleCalendarClick);
  }

  // ESCキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      closeSidebar();
    }
  });

  // リサイズ時の処理
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      // デスクトップサイズではサイドバーを常に表示
      closeSidebar();
    }
  });
}

// ナビゲーション機能の初期化
function initNavigation() {
  // ナビゲーションボタンのクリックイベント
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-view') as AppView;
      // クエリパラメータをクリアしてからビューを表示
      window.location.hash = view;
      showView(view);

      // モバイルでナビゲーション後はサイドバーを閉じる
      if (window.innerWidth <= 768) {
        const sidebar = $('#sidebar');
        const sidebarOverlay = $('#sidebar-overlay');
        sidebar.classList.remove('is-open');
        sidebarOverlay.classList.remove('is-visible');
        document.body.style.overflow = '';
      }
    });
  });

  // 戻るボタンのクリックイベント
  document.querySelectorAll('.btn-back').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target') as AppView;
      window.location.hash = target;
      showView(target);
    });
  });

  // 日付ボタンのクリックイベント
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('cal-cell')) {
      const date = target.getAttribute('data-date') as DateKey;
      setSelectedDate(date);
      showView('main');
    }
  });

  // ハッシュ変更のイベントリスナーを追加
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    const view = hash.split('?')[0] as AppView;
    if (view && ['main', 'create', 'diary', 'diaryCreate'].includes(view)) {
      showView(view);
    }
  });

  // URLハッシュから初期画面を設定
  const hash = window.location.hash.slice(1);
  const view = hash.split('?')[0] as AppView;
  if (view && ['main', 'create', 'diary', 'diaryCreate'].includes(view)) {
    showView(view);
  } else {
    showView('main');
  }
}

// メインのレンダリング関数
function renderAll() {
  renderCalender($('#calender'));

  // タスクフォームは create 画面にある場合のみレンダリング
  const taskFormEl = $optional('.task-form');
  if (taskFormEl) {
    renderTaskForm(taskFormEl);
  }

  renderDayList($('.day-list') as HTMLElement);
  updateDateLabel();
  updateProgressInfo();
}

// メイン関数
function main() {
  initStore();
  renderAll();
  subscribe(renderAll);

  // サイドバートグル機能を初期化
  initSidebarToggle();

  // ナビゲーション機能を初期化
  initNavigation();

  // 今日ボタンのイベント
  ($('.btn-today') as HTMLButtonElement).addEventListener('click', () => {
    setSelectedDate(toKey(new Date()));
    showView('main');
  });

  // 初期画面の表示
  showView('main');
}

main();