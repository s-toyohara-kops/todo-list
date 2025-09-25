import { getAllTasks, getCurrentWeekDates, getAllTasksPerformance, getBestDay, getDailyAchievements, getTasksFor, isCompleted, calculateTaskPerformance, calculateStreakDays, getPreviousWeekDates, getCurrentMonthDates, getPreviousMonthDates, getDateRange } from '../state';
import { toKey } from '../lib/date';
import Chart from 'chart.js/auto';


let reportState: ReportState = {
    currentView: 'overview',
    selectedTaskId: null,
    periodType: 'week',
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

    // 期間フィルター
    const applyPeriodFilter = container.querySelector('#apply-period-filter');
    if (applyPeriodFilter) {
        applyPeriodFilter.addEventListener('click', () => {
            const activePeriodTab = container.querySelector('.period-tab.active') as HTMLElement;
            const selectedPeriod = activePeriodTab?.dataset.period as 'week' | 'month' | 'custom';

            if (selectedPeriod === 'custom') {
                const startDateInput = container.querySelector('#start-date') as HTMLInputElement;
                const endDateInput = container.querySelector('#end-date') as HTMLInputElement;
                if (!startDateInput.value || !endDateInput.value) {
                    alert('開始日と終了日を両方選択してください');
                    return;
                }
                if (new Date(startDateInput.value) > new Date(endDateInput.value)) {
                    alert('開始日が終了日より後の日付になっています');
                    return;
                }
                reportState.customStartDate = startDateInput.value;
                reportState.customEndDate = endDateInput.value;
            }
            reportState.periodType = selectedPeriod;

            if (reportState.currentView === 'overview') {
                updateOverviewData();
            } else if (reportState.currentView === 'task-detail') {
                updateTaskDetailData();
            }
        });
    }

    const resetPeriodFilter = container.querySelector('#reset-period-filter');
    if (resetPeriodFilter) {
        resetPeriodFilter.addEventListener('click', () => {
            reportState.periodType = 'week';
            reportState.customStartDate = undefined;
            reportState.customEndDate = undefined;

            const periodTabs = container.querySelectorAll('.period-tab');
            periodTabs.forEach(tab => tab.classList.remove('active'));
            const weekTab = container.querySelector('[data-period="week"]');
            if (weekTab) weekTab.classList.add('active');

            const customPeriod = container.querySelector('#custom-period') as HTMLElement;
            if (customPeriod) customPeriod.style.display = 'none';

            const startDateInput = container.querySelector('#start-date') as HTMLInputElement;
            const endDateInput = container.querySelector('#end-date') as HTMLInputElement;
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';

            if (reportState.currentView === 'overview') {
                updateOverviewData();
            } else if (reportState.currentView === 'task-detail') {
                updateTaskDetailData();
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

    const dates = getCurrentPeriodDates();
    const taskPerformances = getAllTasksPerformance(dates);

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

    const dates = getCurrentPeriodDates();
    const dailyAchievements = getDailyAchievements(dates);

    const existingCanvas = chartContainer.querySelector('canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'achievement-chart';
    canvas.style.maxHeight = '320px';
    chartContainer.appendChild(canvas);

    // Chart.jsでグラフを作成
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = dailyAchievements.map(day => {
        const date = new Date(day.date + 'T00:00:00');
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = dailyAchievements.map(day => day.achievementRate);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '達成率',
                data: data,
                borderColor: 'rgb(139, 154, 122)',
                backgroundColor: 'rgba(139, 154, 122, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: 'rgb(139, 154, 122)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgb(139, 154, 122)',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return `達成率: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        },
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function updateHighlightInfo() {
    const highlightInfo = document.getElementById('highlight-info');
    if (!highlightInfo) return;

    const dates = getCurrentPeriodDates();
    const bestDay = getBestDay(dates);

    if (!bestDay) {
        highlightInfo.innerHTML = '<p class="empty-state">データがありません</p>';
        return;
    }

    const bestDate = new Date(bestDay.date + 'T00:00:00');
    const dateStr = `${bestDate.getMonth() + 1}/${bestDate.getDate()}`;

    // 週全体の統計を計算
    const weekStats = calculateWeekStats(dates);

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
function calculateWeekStats(dates: string[]) {
    const dailyAchievements = getDailyAchievements(dates);

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
    期間：${getPeriodLabel()}
    `;
}

function updateTaskTable() {
    const taskTable = document.getElementById('task-table');
    const taskTitle = document.getElementById('task-title');

    if (!taskTable || !taskTitle || !reportState.selectedTaskId) return;

    const dates = getCurrentPeriodDates();
    const task = getAllTasks().find(t => t.id === reportState.selectedTaskId);

    if (!task) {
        taskTitle.textContent = 'タスクが見つかりません';
        taskTable.innerHTML = '';
        return;
    }

    taskTitle.textContent = task.title;
    console.log('task.title:', task.title);

    const tableRows = dates.map(date => {
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

    const dates = getCurrentPeriodDates();
    const performance = calculateTaskPerformance(reportState.selectedTaskId, dates);

    const today = toKey(new Date());
    const streak = calculateStreakDays(reportState.selectedTaskId, today)

    achievementRate.textContent = `${performance.achievementRate}%`;
    streakDays.textContent = `${streak}日`;
}

function updateTrendAnalysis() {
    const trendContent = document.getElementById('trend-content');
    if (!trendContent || !reportState.selectedTaskId) return;

    const currentDates = getCurrentPeriodDates();
    const previousDates = getPreviousPeriodDates();

    const thisWeekPerformance = calculateTaskPerformance(reportState.selectedTaskId, currentDates);
    const lastWeekPerformance = calculateTaskPerformance(reportState.selectedTaskId, previousDates);

    const rateChange = thisWeekPerformance.achievementRate - lastWeekPerformance.achievementRate;
    const completedChange = thisWeekPerformance.completedDays - lastWeekPerformance.completedDays;

    const getRateArrow = (change: number) => change > 0 ? '↗️' : change < 0 ? '↘️' : '→';
    const getChangeText = (change: number, unit: string) => {
        const sign = change > 0 ? '+' : change < 0 ? '-' : '';
        return `${sign}${change}${unit}`;
    };

    const periodLabel = getPeriodLabel();
    const previousPeriodLabel = getPreviousPeriodLabel();


    trendContent.innerHTML = `
        <div class="trend-item">
            <h4>${periodLabel} vs ${previousPeriodLabel}</h4>
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

    const dates = getCurrentPeriodDates();
    const performance = calculateTaskPerformance(reportState.selectedTaskId, dates);
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

// レポートの状態管理を拡張
interface ReportState {
    currentView: 'overview' | 'task-detail';
    selectedTaskId: string | null;
    periodType: 'week' | 'month' | 'custom';
    customStartDate?: string;
    customEndDate?: string;
}

// 期間に応じた日付配列を取得
function getCurrentPeriodDates(): string[] {
    switch (reportState.periodType) {
        case 'week':
            return getCurrentWeekDates();
        case 'month':
            return getCurrentMonthDates();
        case 'custom':
            if (reportState.customStartDate && reportState.customEndDate) {
                return getDateRange(reportState.customStartDate, reportState.customEndDate)
            }
            return getCurrentWeekDates();
        default:
            return getCurrentWeekDates();
    }
}

// 前期間の日付配列を取得
function getPreviousPeriodDates(): string[] {
    switch (reportState.periodType) {
        case 'week':
            return getPreviousWeekDates();
        case 'month':
            return getPreviousMonthDates();
        case 'custom':
            if (reportState.customStartDate && reportState.customEndDate) {
                const startDate = new Date(reportState.customStartDate + 'T00:00:00');
                const endDate = new Date(reportState.customEndDate + 'T00:00:00');
                const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                const prevEndDate = new Date(startDate);
                prevEndDate.setDate(startDate.getDate() - 1);
                const prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

                return getDateRange(toKey(prevStartDate), toKey(prevEndDate));
            }
            return getPreviousWeekDates();
    }
}

// 現在の期間ラベルを取得
function getPeriodLabel(): string {
    const dates = getCurrentPeriodDates();
    const startDate = new Date(dates[0] + 'T00:00:00');
    const endDate = new Date(dates[dates.length - 1] + 'T00:00:00');

    const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
    const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`;

    switch (reportState.periodType) {
        case 'week':
            return `今週（${startStr} - ${endStr}）`;
        case 'month':
            return `今月（${startStr} - ${endStr}）`;
        case 'custom':
            return `カスタム期間（${startStr} - ${endStr}）`;
        default:
            return `今週（${startStr} - ${endStr}）`;
    }
}

// 前期間の期間ラベルを取得
function getPreviousPeriodLabel(): string {
    switch (reportState.periodType) {
        case 'week':
            return '先週';
        case 'month':
            return '先月';
        case 'custom':
            return '前期間';
        default:
            return '先週';
    }
}