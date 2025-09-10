import { getAllTasks, getCurrentWeekDates, getAllTasksPerformance, getBestDay, getDailyAchievements, getTasksFor, isCompleted, calculateTaskPerformance, calculateStreakDays, getPreviousWeekDates } from '../state';
import { toKey } from '../lib/date';

// レポートの状態管理
interface ReportState {
    currentView: 'overview' | 'task-detail';
    selectedTaskId: string | null;
}

let reportState: ReportState = {
    currentView: 'overview',
    selectedTaskId: null
};

export function renderReport(container: HTMLElement) {
    container.innerHTML = `
    <header class="view-header">
      <button class="sidebar-toggle mobile-only" aria-label="メニューを開く">≡</button>
      <h2>レポート</h2>
    </header>

    <div class="report-content">
      <!-- フィルターセクション -->
      <section class="report-filters card">
        <div class="report-filter-tabs">
          <button class="report-filter-tab active" data-filter="task">タスクフィルター</button>
          <button class="report-filter-tab" data-filter="period">期間フィルター</button>
        </div>
        
        <!-- タスクフィルター（初期表示） -->
        <div class="filter-content" id="task-filter-content">
          <h4>タスクを選択</h4>
          <div class="task-selection" id="task-selection">
            <select class="form-input task-select" id="task-select">
              <option value="">タスクを選択してください</option>
              <!-- 動的に生成 -->
            </select>
          </div>
          <div class="filter-actions">
            <button class="btn btn-primary" id="apply-task-filter">適用</button>
            <button class="btn btn-secondary" id="reset-task-filter">リセット</button>
          </div>
        </div>

        <!-- 期間フィルター（非表示） -->
        <div class="filter-content" id="period-filter-content" style="display: none;">
          <h4>期間を選択</h4>
          <div class="period-tabs">
            <button class="period-tab active" data-period="week">今週</button>
            <button class="period-tab" data-period="month">今月</button>
            <button class="period-tab" data-period="custom">カスタム</button>
          </div>
          <div class="custom-period" id="custom-period" style="display: none;">
            <input type="date" id="start-date" class="form-input">
            <span>〜</span>
            <input type="date" id="end-date" class="form-input">
          </div>
          <div class="filter-actions">
            <button class="btn btn-primary" id="apply-period-filter">適用</button>
            <button class="btn btn-secondary" id="reset-period-filter">リセット</button>
          </div>
        </div>
      </section>

      <!-- 概要表示エリア（初期表示） -->
      <section class="report-overview" id="report-overview">
        <div class="performance-section card">
          <h3>習慣別パフォーマンス</h3>
          <div class="performance-list" id="performance-list">
            <!-- 動的に生成 -->
          </div>
        </div>

        <div class="daily-achievement card">
          <h3>日別達成率</h3>
          <div class="chart-container" id="daily-chart">
          </div>
        </div>

        <div class="highlight-section card">
          <h3>🏆 今週のハイライト</h3>
          <div class="highlight-info" id="highlight-info">
          </div>
        </div>
      </section>

      <!-- タスク詳細表示エリア（非表示） -->
      <section class="report-detail" id="report-detail" style="display: none;">
        <div class="filter-status card">
          <h3>🔍 フィルター適用中</h3>
          <div id="filter-status-text"></div>
          <button class="btn btn-secondary" id="change-filter">フィルター変更</button>
        </div>

        <div class="task-detail-table card">
          <h3>タスクの詳細</h3>
          <p id="task-title"></p>
          <div class="task-table" id="task-table">
          </div>
        </div>

        <div class="stats-cards">
          <div class="stats-card">
            <div class="stats-value" id="achievement-rate">--%</div>
            <div class="stats-label">達成率</div>
          </div>
          <div class="stats-card">
            <div class="stats-value" id="streak-days">--日</div>
            <div class="stats-label">継続日数</div>
          </div>
        </div>

        <div class="trend-analysis card">
            <h3>🔍 トレンド分析</h3>
            <div class="trend-content" id="trend-content">
            </div>
        </div>

        <div class="task-highlights card">
          <h3>🏆 このタスクのハイライト</h3>
          <div class="task-highlight-info" id="task-highlight-info">
          </div>
        </div>
      </section>
    </div>
  `;

    setupReportEventListeners(container);
    initializeReport();
}

function setupReportEventListeners(container: HTMLElement) {
    const sidebarToggle = container.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar && overlay) {
                sidebar.classList.add('is-open');
                overlay.classList.add('is-visible');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    const filterTabs = container.querySelectorAll('.report-filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const filter = target.dataset.filter;

            filterTabs.forEach(t => t.classList.remove('active'));
            target.classList.add('active');

            const taskFilter = document.getElementById('task-filter-content');
            const periodFilter = document.getElementById('period-filter-content');

            if (filter === 'task') {
                if (taskFilter) taskFilter.style.display = 'block';
                if (periodFilter) periodFilter.style.display = 'none';
            } else if (filter === 'period') {
                if (taskFilter) taskFilter.style.display = 'none';
                if (periodFilter) periodFilter.style.display = 'block';
            }
        });
    });

    const periodTabs = container.querySelectorAll('.period-tab');
    periodTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            periodTabs.forEach(t => t.classList.remove('active'));
            target.classList.add('active');

            const customPeriod = document.getElementById('custom-period');
            const period = target.dataset.period;
            if (customPeriod) {
                customPeriod.style.display = period === 'custom' ? 'block' : 'none';
            }
        });
    });

    const applyTaskFilter = container.querySelector('#apply-task-filter');
    if (applyTaskFilter) {
        applyTaskFilter.addEventListener('click', () => {
            const taskSelect = container.querySelector('#task-select') as HTMLSelectElement;
            if (taskSelect && taskSelect.value) {
                reportState.selectedTaskId = taskSelect.value;
                showTaskDetail();
            } else {
                alert('タスクを選択してください');
            }
        });
    }

    const changeFilter = container.querySelector('#change-filter');
    if (changeFilter) {
        changeFilter.addEventListener('click', () => {
            reportState.selectedTaskId = null;
            reportState.currentView = 'overview';
            showOverview();
        });
    }

    const resetTaskFilter = container.querySelector('#reset-task-filter');
    if (resetTaskFilter) {
        resetTaskFilter.addEventListener('click', () => {
            const taskSelect = container.querySelector('#task-select') as HTMLSelectElement;
            if (taskSelect) {
                taskSelect.value = '';
            }
        });
    }
}

function initializeReport() {
    updateTaskSelection();
    showOverview();
}

function updateTaskSelection() {
    const taskSelection = document.getElementById('task-selection');
    const taskSelect = document.getElementById('task-select') as HTMLSelectElement;
    if (!taskSelection || !taskSelect) return;

    const allTasks = getAllTasks();

    if (allTasks.length === 0) {
        taskSelection.innerHTML = '<p class="empty-state">タスクがありません</p>';
        return;
    }

    const taskOptions = allTasks.map(task =>
        `<option value="${task.id}">${task.title}</option>`
    ).join('');

    taskSelect.innerHTML = `
        <option value="">タスクを選択してください</option>
        ${taskOptions}
    `;
}

function showOverview() {
    const overview = document.getElementById('report-overview');
    const detail = document.getElementById('report-detail');
    if (overview) overview.style.display = 'block';
    if (detail) detail.style.display = 'none';

    reportState.currentView = 'overview';
    updateOverviewData();
}

function updateOverviewData() {
    updatePerformanceList();
    updateDailyChart();
    updateHighlightInfo();
}

function updatePerformanceList() {
    const performanceList = document.getElementById('performance-list');
    if (!performanceList) return;

    const weekDates = getCurrentWeekDates();
    const taskPerformances = getAllTasksPerformance(weekDates);

    if (taskPerformances.length === 0) {
        performanceList.innerHTML = '<p class="empty-state">タスクがありません</p>';
        return;
    }

    const performanceHtml = taskPerformances.map(performance => `
        <div class="performance-item">
            <div class="performance-dot"></div>
            <div class="performance-label">${performance.taskName}</div>
            <div class="performance-bar-container">
                <div class="performance-bar-fill" style="width: ${performance.achievementRate}%"></div>
            </div>
            <div class="performance-percentage">${performance.achievementRate}%</div>
        </div>
    `).join('');

    performanceList.innerHTML = performanceHtml;
}

function updateDailyChart() {
    const chartContainer = document.getElementById('daily-chart');
    if (!chartContainer) return;

    const weekDates = getCurrentWeekDates();
    const dailyAchievements = getDailyAchievements(weekDates);

    const chartData = dailyAchievements.map((day) => {
        const date = new Date(day.date + 'T00:00:00');
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        return `${dateStr}: ${day.achievementRate}%`;
    }).join(' | ');

    chartContainer.innerHTML = `
        <div class="simple-chart">
            <div class="chart-info">
                ${chartData}
            </div>
            <div class="chart-visual">
                達成率の推移: ${dailyAchievements.map(d => d.achievementRate + '%').join(' → ')}
            </div>
        </div>
    `;
}

function updateHighlightInfo() {
    const highlightInfo = document.getElementById('highlight-info');
    if (!highlightInfo) return;

    const weekDates = getCurrentWeekDates();
    const bestDay = getBestDay(weekDates);

    if (!bestDay) {
        highlightInfo.innerHTML = '<p class="empty-state">データがありません</p>';
        return;
    }

    const bestDate = new Date(bestDay.date + 'T00:00:00');
    const dateStr = `${bestDate.getMonth() + 1}/${bestDate.getDate()}`;

    // 週全体の統計を計算
    const weekStats = calculateWeekStats(weekDates);

    highlightInfo.innerHTML = `
        <div class="highlight-item">
            🚀 最も頑張った日: ${dateStr} (${bestDay.completedTasks}個のタスク完了)
        </div>
        <div class="highlight-item">
            📝 今週の平均達成率: ${weekStats.averageRate}%
        </div>
        <div class="highlight-item">
            🔥 今週の総完了タスク: ${weekStats.totalCompleted}個
        </div>
    `;
}

// 週全体の統計を計算するヘルパー関数
function calculateWeekStats(weekDates: string[]) {
    const dailyAchievements = getDailyAchievements(weekDates);

    const totalCompleted = dailyAchievements.reduce((sum, day) => sum + day.completedTasks, 0);
    const totalTasks = dailyAchievements.reduce((sum, day) => sum + day.totalTasks, 0);
    const averageRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    return {
        totalCompleted,
        totalTasks,
        averageRate
    };
}

function showTaskDetail() {
    const overview = document.getElementById('report-overview');
    const detail = document.getElementById('report-detail');
    if (overview) overview.style.display = 'none';
    if (detail) detail.style.display = 'block';

    reportState.currentView = 'task-detail';
    updateTaskDetailData();
}

function updateTaskDetailData() {
    if (!reportState.selectedTaskId) return;
    updateFilterStatus();
    updateTaskTable();
    updateTaskStats();
    updateTrendAnalysis();
    updateTaskHighlights();
}

function updateFilterStatus() {
    const filterStatusText = document.getElementById('filter-status-text');
    if (!filterStatusText || !reportState.selectedTaskId) return;

    const task = getAllTasks().find(t => t.id === reportState.selectedTaskId);
    const taskName = task ? task.title : '不明なタスク';

    filterStatusText.innerHTML = `
    タスク：<strong>${taskName}</strong><br>
    期間：今週（${getCurrentWeekDateRange()}）
    `;
}

function updateTaskTable() {
    const taskTable = document.getElementById('task-table');
    const taskTitle = document.getElementById('task-title');

    if (!taskTable || !taskTitle || !reportState.selectedTaskId) return;

    const weekDates = getCurrentWeekDates();
    const task = getAllTasks().find(t => t.id === reportState.selectedTaskId);

    if (!task) {
        taskTitle.textContent = 'タスクが見つかりません';
        taskTable.innerHTML = '';
        return;
    }

    taskTitle.textContent = task.title;
    console.log('task.title:', task.title);

    const tableRows = weekDates.map(date => {
        const tasksForDate = getTasksFor(date);
        const taskExists = tasksForDate.some(t => t.id === task.id);
        const completed = taskExists && isCompleted(task.id, date);
        const dateObj = new Date(date + 'T00:00:00');
        const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

        return `
        <tr class="task-row ${completed ? 'completed' : taskExists ? 'pending' : 'not-scheduled'}">
            <td class="task-date">${dateStr}</td>
            <td class="task-status">${taskExists ? (completed ? '✓' : '✗') : '-'}</td>
        </tr>
        `;
    }).join('');

    taskTable.innerHTML = `
        <table class="task-detail-table">
            <thead>
                <tr>
                    <th>設定した日付</th>
                    <th>完了チェック</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

function updateTaskStats() {
    const achievementRate = document.getElementById('achievement-rate');
    const streakDays = document.getElementById('streak-days');

    if (!achievementRate || !streakDays || !reportState.selectedTaskId) return;

    const weekDates = getCurrentWeekDates();
    const performance = calculateTaskPerformance(reportState.selectedTaskId, weekDates);

    const today = toKey(new Date());
    const streak = calculateStreakDays(reportState.selectedTaskId, today)

    achievementRate.textContent = `${performance.achievementRate}%`;
    streakDays.textContent = `${streak}日`;
}

function updateTrendAnalysis() {
    const trendContent = document.getElementById('trend-content');
    if (!trendContent || !reportState.selectedTaskId) return;

    const thisWeekDates = getCurrentWeekDates();
    const lastWeekDates = getPreviousWeekDates();

    const thisWeekPerformance = calculateTaskPerformance(reportState.selectedTaskId, thisWeekDates);
    const lastWeekPerformance = calculateTaskPerformance(reportState.selectedTaskId, lastWeekDates);

    const rateChange = thisWeekPerformance.achievementRate - lastWeekPerformance.achievementRate;
    const completedChange = thisWeekPerformance.completedDays - lastWeekPerformance.completedDays;

    const getRateArrow = (change: number) => change > 0 ? '↗️' : change < 0 ? '↘️' : '→';
    const getChangeText = (change: number, unit: string) => {
        const sign = change > 0 ? '+' : change < 0 ? '-' : '';
        return `${sign}${change}${unit}`;
    };

    trendContent.innerHTML = `
        <div class="trend-item">
            <h4>今週 vs 先週</h4>
            <div class="trend-stats">
                <div class="trend-stat">
                    達成率: ${lastWeekPerformance.achievementRate}% → ${thisWeekPerformance.achievementRate}% 
                    (${getChangeText(rateChange, '%')} ${getRateArrow(rateChange)})
                </div>
                <div class="trend-stat">
                    完了回数: ${lastWeekPerformance.completedDays}回 → ${thisWeekPerformance.completedDays}回 
                    (${getChangeText(completedChange, '回')} ${getRateArrow(completedChange)})
                </div>
                <div class="trend-stat">
                    対象日数: ${lastWeekPerformance.totalDays}日 → ${thisWeekPerformance.totalDays}日
                </div>
            </div>
        </div>
    `;
}

function updateTaskHighlights() {
    const taskHighlightInfo = document.getElementById('task-highlight-info');
    if (!taskHighlightInfo || !reportState.selectedTaskId) return;

    const weekDates = getCurrentWeekDates();
    const performance = calculateTaskPerformance(reportState.selectedTaskId, weekDates);
    const task = getAllTasks().find(t => t.id === reportState.selectedTaskId);

    if (!task) return;

    const highlights = [];

    if (performance.achievementRate >= 80) {
        highlights.push('🎉 素晴らしい達成率です！');
    } else if (performance.achievementRate >= 60) {
        highlights.push('👍 良いペースで続けています');
    } else if (performance.achievementRate > 0) {
        highlights.push('💪 継続することが大切です');
    } else {
        highlights.push('🌱 今週から始めてみましょう');
    }

    if (performance.completedDays >= 3) {
        highlights.push(`🔥 今週${performance.completedDays}日達成しました`);
    }

    taskHighlightInfo.innerHTML = `
        <ul class="highlight-list">
            ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
    `;
}

// ヘルパー関数: 今週の日付範囲を文字列で取得
function getCurrentWeekDateRange(): string {
    const weekDates = getCurrentWeekDates();
    const startDate = new Date(weekDates[0] + 'T00:00:00');
    const endDate = new Date(weekDates[weekDates.length - 1] + 'T00:00:00');

    const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
    const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`;

    return `${startStr} - ${endStr}`;
}