/**
 * 实时数据仪表板组件
 * 提供实时数据展示和交互功能
 */

import { ChartComponent } from './ChartComponent.js';
import { ProgressChart } from './ProgressChart.js';
import { QuizStatsChart } from './QuizStatsChart.js';

export class DashboardWidget {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      refreshInterval: options.refreshInterval || 30000, // 30秒刷新
      autoRefresh: options.autoRefresh !== false,
      theme: options.theme || 'light',
      ...options
    };
    
    this.widgets = new Map();
    this.refreshTimer = null;
    this.isInitialized = false;
  }

  /**
   * 初始化仪表板
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // 创建仪表板布局
      this.createDashboardLayout();
      
      // 初始化各个组件
      await this.initializeWidgets();
      
      // 加载初始数据
      await this.loadDashboardData();
      
      // 启动自动刷新
      if (this.options.autoRefresh) {
        this.startAutoRefresh();
      }
      
      this.isInitialized = true;
      console.log('Dashboard initialized successfully');
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      this.showError('仪表板初始化失败');
    }
  }

  /**
   * 创建仪表板布局
   */
  createDashboardLayout() {
    this.container.innerHTML = `
      <div class="dashboard-container">
        <!-- 顶部统计卡片 -->
        <div class="stats-row">
          <div class="stat-card" id="total-users-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3 id="total-users">-</h3>
              <p>总用户数</p>
              <span class="stat-trend" id="users-trend"></span>
            </div>
          </div>
          
          <div class="stat-card" id="completion-rate-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3 id="completion-rate">-</h3>
              <p>完成率</p>
              <span class="stat-trend" id="completion-trend"></span>
            </div>
          </div>
          
          <div class="stat-card" id="avg-score-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <h3 id="avg-score">-</h3>
              <p>平均分数</p>
              <span class="stat-trend" id="score-trend"></span>
            </div>
          </div>
          
          <div class="stat-card" id="active-users-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <h3 id="active-users">-</h3>
              <p>活跃用户</p>
              <span class="stat-trend" id="active-trend"></span>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-grid">
          <div class="chart-widget" id="progress-widget">
            <div class="widget-header">
              <h3>学习进度趋势</h3>
              <div class="widget-controls">
                <select id="progress-period">
                  <option value="7">最近7天</option>
                  <option value="30" selected>最近30天</option>
                  <option value="90">最近90天</option>
                </select>
                <button class="refresh-btn" data-widget="progress">🔄</button>
              </div>
            </div>
            <div class="widget-content" id="progress-chart"></div>
          </div>

          <div class="chart-widget" id="quiz-stats-widget">
            <div class="widget-header">
              <h3>答题统计分析</h3>
              <div class="widget-controls">
                <select id="quiz-type">
                  <option value="all">全部题目</option>
                  <option value="safety">安全操作</option>
                  <option value="violation">违规识别</option>
                </select>
                <button class="refresh-btn" data-widget="quiz">🔄</button>
              </div>
            </div>
            <div class="widget-content" id="quiz-chart"></div>
          </div>

          <div class="chart-widget" id="realtime-widget">
            <div class="widget-header">
              <h3>实时活动监控</h3>
              <div class="widget-controls">
                <span class="status-indicator online" id="realtime-status">●</span>
                <span>实时更新</span>
              </div>
            </div>
            <div class="widget-content" id="realtime-chart"></div>
          </div>

          <div class="chart-widget" id="performance-widget">
            <div class="widget-header">
              <h3>系统性能监控</h3>
              <div class="widget-controls">
                <button class="refresh-btn" data-widget="performance">🔄</button>
              </div>
            </div>
            <div class="widget-content" id="performance-chart"></div>
          </div>
        </div>

        <!-- 详细数据表格 -->
        <div class="data-table-widget" id="recent-activities">
          <div class="widget-header">
            <h3>最近活动</h3>
            <div class="widget-controls">
              <button class="export-btn" data-type="activities">导出</button>
            </div>
          </div>
          <div class="widget-content">
            <div class="table-container" id="activities-table"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 初始化各个组件
   */
  async initializeWidgets() {
    // 初始化进度图表
    const progressContainer = document.getElementById('progress-chart');
    if (progressContainer) {
      this.widgets.set('progress', new ProgressChart(progressContainer, {
        width: 500,
        height: 300
      }));
    }

    // 初始化答题统计图表
    const quizContainer = document.getElementById('quiz-chart');
    if (quizContainer) {
      this.widgets.set('quiz', new QuizStatsChart(quizContainer, {
        width: 500,
        height: 300
      }));
    }

    // 初始化实时监控图表
    const realtimeContainer = document.getElementById('realtime-chart');
    if (realtimeContainer) {
      this.widgets.set('realtime', new ChartComponent(realtimeContainer, {
        width: 500,
        height: 300
      }));
    }

    // 初始化性能监控图表
    const performanceContainer = document.getElementById('performance-chart');
    if (performanceContainer) {
      this.widgets.set('performance', new ChartComponent(performanceContainer, {
        width: 500,
        height: 300
      }));
    }

    // 绑定事件监听器
    this.bindEventListeners();
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 刷新按钮
    document.querySelectorAll('.refresh-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const widget = e.target.dataset.widget;
        this.refreshWidget(widget);
      });
    });

    // 时间段选择
    const progressPeriod = document.getElementById('progress-period');
    if (progressPeriod) {
      progressPeriod.addEventListener('change', () => {
        this.refreshWidget('progress');
      });
    }

    // 题目类型选择
    const quizType = document.getElementById('quiz-type');
    if (quizType) {
      quizType.addEventListener('change', () => {
        this.refreshWidget('quiz');
      });
    }

    // 导出按钮
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        this.exportData(type);
      });
    });
  }

  /**
   * 加载仪表板数据
   */
  async loadDashboardData() {
    try {
      // 并行加载所有数据
      const [statsData, progressData, quizData, realtimeData, performanceData] = await Promise.all([
        this.fetchStatsData(),
        this.fetchProgressData(),
        this.fetchQuizData(),
        this.fetchRealtimeData(),
        this.fetchPerformanceData()
      ]);

      // 更新统计卡片
      this.updateStatsCards(statsData);

      // 更新图表
      this.updateProgressChart(progressData);
      this.updateQuizChart(quizData);
      this.updateRealtimeChart(realtimeData);
      this.updatePerformanceChart(performanceData);

      // 更新活动表格
      this.updateActivitiesTable(realtimeData.activities || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.showError('数据加载失败');
    }
  }

  /**
   * 获取统计数据
   */
  async fetchStatsData() {
    const response = await fetch('/api/analytics/public');
    const result = await response.json();
    return result.stats || {};
  }

  /**
   * 获取进度数据
   */
  async fetchProgressData() {
    const period = document.getElementById('progress-period')?.value || '30';
    const response = await fetch(`/api/admin/analytics?type=progress&range=${period}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_auth')}`
      }
    });
    const result = await response.json();
    return result.data || [];
  }

  /**
   * 获取答题数据
   */
  async fetchQuizData() {
    const type = document.getElementById('quiz-type')?.value || 'all';
    const response = await fetch(`/api/admin/analytics?type=quiz&category=${type}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_auth')}`
      }
    });
    const result = await response.json();
    return result.data || [];
  }

  /**
   * 获取实时数据
   */
  async fetchRealtimeData() {
    const response = await fetch('/api/admin/analytics?type=realtime', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_auth')}`
      }
    });
    const result = await response.json();
    return result.data || {};
  }

  /**
   * 获取性能数据
   */
  async fetchPerformanceData() {
    // 模拟性能数据
    return {
      responseTime: Math.random() * 100 + 50,
      throughput: Math.random() * 1000 + 500,
      errorRate: Math.random() * 5,
      uptime: 99.9
    };
  }

  /**
   * 更新统计卡片
   */
  updateStatsCards(data) {
    const updates = [
      { id: 'total-users', value: data.totalUsers || 0, trend: '+12%' },
      { id: 'completion-rate', value: `${data.completionRate || 0}%`, trend: '+5%' },
      { id: 'avg-score', value: `${data.averageScore || 0}分`, trend: '+8%' },
      { id: 'active-users', value: data.activeUsers || 0, trend: '+15%' }
    ];

    updates.forEach(({ id, value, trend }) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
        
        // 添加动画效果
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 200);
      }

      const trendElement = document.getElementById(id.replace(/^[^-]+-/, '') + '-trend');
      if (trendElement) {
        trendElement.textContent = trend;
        trendElement.className = 'stat-trend positive';
      }
    });
  }

  /**
   * 更新进度图表
   */
  updateProgressChart(data) {
    const progressChart = this.widgets.get('progress');
    if (progressChart && data.length > 0) {
      progressChart.renderProgressTrend(data, { type: 'area' });
    }
  }

  /**
   * 更新答题图表
   */
  updateQuizChart(data) {
    const quizChart = this.widgets.get('quiz');
    if (quizChart && data.length > 0) {
      quizChart.renderAccuracyDistribution(data);
    }
  }

  /**
   * 更新实时图表
   */
  updateRealtimeChart(data) {
    const realtimeChart = this.widgets.get('realtime');
    if (realtimeChart && data.timeline) {
      realtimeChart.renderLineChart(data.timeline);
    }
  }

  /**
   * 更新性能图表
   */
  updatePerformanceChart(data) {
    const performanceChart = this.widgets.get('performance');
    if (performanceChart) {
      const chartData = [
        { label: '响应时间', value: data.responseTime },
        { label: '吞吐量', value: data.throughput },
        { label: '错误率', value: data.errorRate },
        { label: '可用性', value: data.uptime }
      ];
      performanceChart.renderBarChart(chartData);
    }
  }

  /**
   * 更新活动表格
   */
  updateActivitiesTable(activities) {
    const tableContainer = document.getElementById('activities-table');
    if (!tableContainer) return;

    const tableHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>用户</th>
            <th>活动</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${activities.slice(0, 10).map(activity => `
            <tr>
              <td>${new Date(activity.timestamp).toLocaleString()}</td>
              <td>${activity.user || '匿名用户'}</td>
              <td>${activity.action}</td>
              <td><span class="status ${activity.status}">${activity.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    tableContainer.innerHTML = tableHTML;
  }

  /**
   * 刷新指定组件
   */
  async refreshWidget(widgetName) {
    try {
      switch (widgetName) {
        case 'progress':
          const progressData = await this.fetchProgressData();
          this.updateProgressChart(progressData);
          break;
        case 'quiz':
          const quizData = await this.fetchQuizData();
          this.updateQuizChart(quizData);
          break;
        case 'realtime':
          const realtimeData = await this.fetchRealtimeData();
          this.updateRealtimeChart(realtimeData);
          break;
        case 'performance':
          const performanceData = await this.fetchPerformanceData();
          this.updatePerformanceChart(performanceData);
          break;
      }
    } catch (error) {
      console.error(`Failed to refresh ${widgetName}:`, error);
    }
  }

  /**
   * 启动自动刷新
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.loadDashboardData();
    }, this.options.refreshInterval);
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 导出数据
   */
  async exportData(type) {
    try {
      let data;
      let filename;

      switch (type) {
        case 'activities':
          data = await this.fetchRealtimeData();
          filename = 'activities.json';
          break;
        default:
          throw new Error('Unknown export type');
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      this.showError('导出失败');
    }
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    // 这里可以集成通知组件
    console.error(message);
  }

  /**
   * 销毁仪表板
   */
  destroy() {
    this.stopAutoRefresh();
    this.widgets.clear();
    this.container.innerHTML = '';
    this.isInitialized = false;
  }
}
