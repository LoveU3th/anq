/**
 * 管理页面组件
 * 提供题库管理、视频管理、数据分析等功能
 */

import { dataManager } from '../modules/data-manager.js';
import { Logger } from '../utils/logger.js';
import { ChartComponent } from './ChartComponent.js';

export class AdminPage {
  constructor() {
    this.logger = new Logger('AdminPage');
    this.currentTab = 'dashboard';
    this.isAuthenticated = false;
    this.questions = [];
    this.videos = [];
    this.analytics = {};
    this.charts = {};
  }

  /**
   * 渲染管理页面（路由系统调用）
   */
  async render() {
    try {
      // 检查认证状态
      if (!await this.checkAuthentication()) {
        return this.renderLoginForm();
      }

      // 加载数据
      await this.loadData();

      // 渲染主界面
      return this.renderMainInterface();
    } catch (error) {
      this.logger.error('渲染管理页面失败:', error);
      return this.renderError('页面加载失败，请刷新重试');
    }
  }

  /**
   * 组件挂载后的回调（路由系统调用）
   */
  mounted() {
    // 初始化页面交互
    setTimeout(() => {
      this.initializeInteractions();
    }, 100);
  }

  /**
   * 检查认证状态
   */
  async checkAuthentication() {
    // 简单的认证检查，实际项目中应该使用更安全的方式
    const authToken = localStorage.getItem('admin_auth');
    if (!authToken) {
      return false;
    }

    try {
      // 验证token有效性
      const response = await fetch('/api/admin/auth/verify', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      this.isAuthenticated = response.ok;
      return this.isAuthenticated;
    } catch (error) {
      this.logger.warn('认证验证失败:', error);
      return false;
    }
  }

  /**
   * 渲染登录表单
   */
  renderLoginForm() {
    return `
      <div class="admin-login">
        <div class="login-container">
          <div class="login-header">
            <h1>管理后台登录</h1>
            <p>请输入管理员凭据</p>
          </div>
          
          <form class="login-form" id="admin-login-form">
            <div class="form-group">
              <label for="username">用户名</label>
              <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
              <label for="password">密码</label>
              <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn btn-primary">登录</button>
          </form>
          
          <div class="login-footer">
            <a href="/">返回首页</a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染主界面
   */
  renderMainInterface() {
    return `
      <div class="admin-dashboard">
        <!-- 侧边栏 -->
        <aside class="admin-sidebar">
          <div class="sidebar-header">
            <h2>管理后台</h2>
          </div>
          
          <nav class="sidebar-nav">
            <a href="#dashboard" class="nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" 
               data-tab="dashboard">
              <span class="nav-icon">📊</span>
              <span class="nav-text">仪表板</span>
            </a>
            
            <a href="#questions" class="nav-item ${this.currentTab === 'questions' ? 'active' : ''}" 
               data-tab="questions">
              <span class="nav-icon">📝</span>
              <span class="nav-text">题库管理</span>
            </a>
            
            <a href="#videos" class="nav-item ${this.currentTab === 'videos' ? 'active' : ''}" 
               data-tab="videos">
              <span class="nav-icon">🎥</span>
              <span class="nav-text">视频管理</span>
            </a>
            
            <a href="#analytics" class="nav-item ${this.currentTab === 'analytics' ? 'active' : ''}" 
               data-tab="analytics">
              <span class="nav-icon">📈</span>
              <span class="nav-text">数据分析</span>
            </a>
            
            <a href="#settings" class="nav-item ${this.currentTab === 'settings' ? 'active' : ''}" 
               data-tab="settings">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">系统设置</span>
            </a>
          </nav>
          
          <div class="sidebar-footer">
            <button class="btn btn-outline logout-btn" id="admin-logout">
              <span>🚪</span>
              退出登录
            </button>
          </div>
        </aside>

        <!-- 主内容区 -->
        <main class="admin-main">
          <div class="admin-content">
            ${this.renderTabContent()}
          </div>
        </main>
      </div>
    `;
  }

  /**
   * 渲染标签页内容
   */
  renderTabContent() {
    switch (this.currentTab) {
      case 'dashboard':
        return this.renderDashboard();
      case 'questions':
        return this.renderQuestionsManager();
      case 'videos':
        return this.renderVideosManager();
      case 'analytics':
        return this.renderAnalytics();
      case 'settings':
        return this.renderSettings();
      default:
        return this.renderDashboard();
    }
  }

  /**
   * 渲染仪表板
   */
  renderDashboard() {
    return `
      <div class="dashboard">
        <div class="dashboard-header">
          <h1>仪表板</h1>
          <p>系统概览和关键指标</p>
        </div>
        
        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>${this.analytics.totalUsers || 0}</h3>
              <p>总用户数</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <h3>${this.questions.length}</h3>
              <p>题目总数</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🎥</div>
            <div class="stat-content">
              <h3>${this.videos.length}</h3>
              <p>视频总数</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>${this.analytics.averageScore || 0}%</h3>
              <p>平均得分</p>
            </div>
          </div>
        </div>
        
        <!-- 快速操作 -->
        <div class="quick-actions">
          <h2>快速操作</h2>
          <div class="actions-grid">
            <button class="action-btn" data-action="add-question">
              <span class="action-icon">➕</span>
              <span class="action-text">添加题目</span>
            </button>
            
            <button class="action-btn" data-action="update-video">
              <span class="action-icon">🔄</span>
              <span class="action-text">更新视频</span>
            </button>
            
            <button class="action-btn" data-action="export-data">
              <span class="action-icon">📤</span>
              <span class="action-text">导出数据</span>
            </button>
            
            <button class="action-btn" data-action="system-backup">
              <span class="action-icon">💾</span>
              <span class="action-text">系统备份</span>
            </button>
          </div>
        </div>
        
        <!-- 最近活动 -->
        <div class="recent-activity">
          <h2>最近活动</h2>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon">👤</div>
              <div class="activity-content">
                <p>新用户完成安全测试</p>
                <span class="activity-time">2分钟前</span>
              </div>
            </div>
            
            <div class="activity-item">
              <div class="activity-icon">📝</div>
              <div class="activity-content">
                <p>题库更新了5道新题目</p>
                <span class="activity-time">1小时前</span>
              </div>
            </div>
            
            <div class="activity-item">
              <div class="activity-icon">🎥</div>
              <div class="activity-content">
                <p>安全操作视频被观看</p>
                <span class="activity-time">3小时前</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染题库管理
   */
  renderQuestionsManager() {
    return `
      <div class="questions-manager">
        <div class="manager-header">
          <h1>题库管理</h1>
          <div class="header-actions">
            <button class="btn btn-primary" id="add-question-btn">
              <span>➕</span>
              添加题目
            </button>
            <button class="btn btn-outline" id="import-questions-btn">
              <span>📥</span>
              批量导入
            </button>
            <button class="btn btn-outline" id="export-questions-btn">
              <span>📤</span>
              导出题库
            </button>
          </div>
        </div>
        
        <!-- 筛选器 -->
        <div class="questions-filters">
          <div class="filter-group">
            <label>题目类型</label>
            <select id="question-type-filter">
              <option value="">全部类型</option>
              <option value="safety">安全操作</option>
              <option value="violation">违规识别</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>难度等级</label>
            <select id="question-difficulty-filter">
              <option value="">全部难度</option>
              <option value="1">简单</option>
              <option value="2">中等</option>
              <option value="3">困难</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>搜索</label>
            <input type="text" id="question-search" placeholder="搜索题目内容...">
          </div>
        </div>
        
        <!-- 题目列表 -->
        <div class="questions-list">
          <div class="list-header">
            <div class="list-controls">
              <span class="total-count">共 ${this.questions.length} 道题目</span>
              <div class="pagination-info">
                <span>第 1-10 项，共 ${this.questions.length} 项</span>
              </div>
            </div>
          </div>
          
          <div class="questions-table">
            ${this.renderQuestionsTable()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染题目表格
   */
  renderQuestionsTable() {
    if (this.questions.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>暂无题目</h3>
          <p>点击"添加题目"开始创建题库</p>
        </div>
      `;
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>题目内容</th>
            <th>类型</th>
            <th>难度</th>
            <th>分类</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.questions.slice(0, 10).map(question => `
            <tr>
              <td>${question.id}</td>
              <td class="question-content">${question.question.substring(0, 50)}...</td>
              <td>
                <span class="badge ${question.type === 'safety' ? 'badge-success' : 'badge-warning'}">
                  ${question.type === 'safety' ? '安全操作' : '违规识别'}
                </span>
              </td>
              <td>
                <span class="difficulty-badge difficulty-${question.difficulty}">
                  ${'★'.repeat(question.difficulty)}
                </span>
              </td>
              <td>${question.category || '未分类'}</td>
              <td>${new Date(question.createdAt || Date.now()).toLocaleDateString()}</td>
              <td class="actions">
                <button class="btn-icon" data-action="edit" data-id="${question.id}" title="编辑">
                  ✏️
                </button>
                <button class="btn-icon" data-action="preview" data-id="${question.id}" title="预览">
                  👁️
                </button>
                <button class="btn-icon" data-action="delete" data-id="${question.id}" title="删除">
                  🗑️
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * 加载数据
   */
  async loadData() {
    try {
      // 加载题目数据
      await this.loadQuestions();

      // 加载视频数据
      await this.loadVideos();

      // 加载分析数据
      await this.loadAnalytics();

      this.logger.info('管理数据加载完成');
    } catch (error) {
      this.logger.error('加载管理数据失败:', error);
    }
  }

  /**
   * 加载题目数据
   */
  async loadQuestions() {
    try {
      const response = await fetch('/api/admin/questions');
      if (response.ok) {
        this.questions = await response.json();
      }
    } catch (error) {
      this.logger.warn('加载题目数据失败:', error);
      this.questions = [];
    }
  }

  /**
   * 加载视频数据
   */
  async loadVideos() {
    try {
      const response = await fetch('/api/admin/videos');
      if (response.ok) {
        this.videos = await response.json();
      }
    } catch (error) {
      this.logger.warn('加载视频数据失败:', error);
      this.videos = [];
    }
  }

  /**
   * 加载分析数据
   */
  async loadAnalytics() {
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        this.analytics = await response.json();
      }
    } catch (error) {
      this.logger.warn('加载分析数据失败:', error);
      this.analytics = {};
    }
  }

  /**
   * 渲染视频管理
   */
  renderVideosManager() {
    return `
      <div class="videos-manager">
        <div class="manager-header">
          <h1>视频管理</h1>
          <div class="header-actions">
            <button class="btn btn-primary" id="update-video-btn">
              <span>🔄</span>
              更新视频链接
            </button>
          </div>
        </div>

        <div class="videos-grid">
          ${this.renderVideoCards()}
        </div>
      </div>
    `;
  }

  /**
   * 渲染视频卡片
   */
  renderVideoCards() {
    const defaultVideos = [
      {
        id: 'safety',
        title: '安全操作视频',
        description: '展示正确的安全操作流程',
        url: 'https://example.com/safety-video.mp4',
        thumbnail: '/assets/images/video-thumbnails/safety.jpg'
      },
      {
        id: 'violation',
        title: '违规操作视频',
        description: '展示违规操作的危险性',
        url: 'https://example.com/violation-video.mp4',
        thumbnail: '/assets/images/video-thumbnails/violation.jpg'
      }
    ];

    const videos = this.videos.length > 0 ? this.videos : defaultVideos;

    return videos.map(video => `
      <div class="video-card">
        <div class="video-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='/assets/images/placeholder-video.jpg'">
          <div class="video-overlay">
            <button class="play-btn" data-video-id="${video.id}">▶️</button>
          </div>
        </div>

        <div class="video-info">
          <h3>${video.title}</h3>
          <p>${video.description}</p>

          <div class="video-url">
            <label>视频链接:</label>
            <input type="url" value="${video.url}" data-video-id="${video.id}" class="video-url-input">
          </div>

          <div class="video-actions">
            <button class="btn btn-sm btn-primary" data-action="update-url" data-video-id="${video.id}">
              更新链接
            </button>
            <button class="btn btn-sm btn-outline" data-action="preview" data-video-id="${video.id}">
              预览
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * 渲染数据分析
   */
  renderAnalytics() {
    return `
      <div class="analytics">
        <div class="analytics-header">
          <h1>数据分析</h1>
          <div class="date-range-picker">
            <label>时间范围:</label>
            <select id="analytics-range">
              <option value="7">最近7天</option>
              <option value="30">最近30天</option>
              <option value="90">最近90天</option>
            </select>
          </div>
        </div>

        <!-- 关键指标 -->
        <div class="metrics-grid">
          <div class="metric-card">
            <h3>学习完成率</h3>
            <div class="metric-value">${this.analytics.completionRate || 0}%</div>
            <div class="metric-trend positive">↗️ +5.2%</div>
          </div>

          <div class="metric-card">
            <h3>平均学习时长</h3>
            <div class="metric-value">${this.analytics.avgStudyTime || 0}分钟</div>
            <div class="metric-trend negative">↘️ -2.1%</div>
          </div>

          <div class="metric-card">
            <h3>测试通过率</h3>
            <div class="metric-value">${this.analytics.passRate || 0}%</div>
            <div class="metric-trend positive">↗️ +8.3%</div>
          </div>

          <div class="metric-card">
            <h3>用户活跃度</h3>
            <div class="metric-value">${this.analytics.activeUsers || 0}</div>
            <div class="metric-trend positive">↗️ +12.5%</div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>学习进度趋势</h3>
            <div class="chart-placeholder" id="progress-chart">
              <div class="chart-mock">📈 图表加载中...</div>
            </div>
          </div>

          <div class="chart-card">
            <h3>答题正确率分布</h3>
            <div class="chart-placeholder" id="accuracy-chart">
              <div class="chart-mock">📊 图表加载中...</div>
            </div>
          </div>
        </div>

        <!-- 详细数据表 -->
        <div class="data-table-section">
          <h3>用户学习详情</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>用户ID</th>
                  <th>学习模块</th>
                  <th>完成时间</th>
                  <th>得分</th>
                  <th>用时</th>
                  <th>设备类型</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>user_001</td>
                  <td>安全操作</td>
                  <td>2024-01-20 14:30</td>
                  <td>85分</td>
                  <td>12分钟</td>
                  <td>移动端</td>
                </tr>
                <tr>
                  <td>user_002</td>
                  <td>违规识别</td>
                  <td>2024-01-20 15:45</td>
                  <td>92分</td>
                  <td>8分钟</td>
                  <td>桌面端</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染系统设置
   */
  renderSettings() {
    return `
      <div class="settings">
        <div class="settings-header">
          <h1>系统设置</h1>
        </div>

        <div class="settings-sections">
          <div class="settings-section">
            <h3>基本设置</h3>
            <div class="setting-item">
              <label>平台名称</label>
              <input type="text" value="安全学习平台" id="platform-name">
            </div>

            <div class="setting-item">
              <label>每次测试题目数量</label>
              <input type="number" value="10" min="5" max="20" id="quiz-count">
            </div>

            <div class="setting-item">
              <label>及格分数</label>
              <input type="number" value="90" min="60" max="100" id="pass-score">
            </div>
          </div>

          <div class="settings-section">
            <h3>安全设置</h3>
            <div class="setting-item">
              <label>管理员密码</label>
              <button class="btn btn-outline" id="change-password-btn">修改密码</button>
            </div>

            <div class="setting-item">
              <label>会话超时时间（分钟）</label>
              <input type="number" value="30" min="10" max="120" id="session-timeout">
            </div>
          </div>

          <div class="settings-section">
            <h3>数据管理</h3>
            <div class="setting-item">
              <label>数据备份</label>
              <button class="btn btn-primary" id="backup-data-btn">立即备份</button>
            </div>

            <div class="setting-item">
              <label>清理日志</label>
              <button class="btn btn-outline" id="clear-logs-btn">清理30天前日志</button>
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <button class="btn btn-primary" id="save-settings-btn">保存设置</button>
          <button class="btn btn-outline" id="reset-settings-btn">重置为默认</button>
        </div>
      </div>
    `;
  }

  /**
   * 初始化页面交互
   */
  initializeInteractions() {
    // 初始化标签页切换
    this.initTabSwitching();

    // 初始化图表
    this.initCharts();

    // 初始化事件监听器
    this.initEventListeners();
  }

  /**
   * 初始化标签页切换
   */
  initTabSwitching() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  /**
   * 切换标签页
   */
  async switchTab(tab) {
    this.currentTab = tab;

    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // 更新内容
    const contentArea = document.querySelector('.admin-content');
    contentArea.innerHTML = this.renderTabContent();

    // 重新初始化交互
    this.initializeInteractions();
  }

  /**
   * 初始化图表
   */
  initCharts() {
    if (this.currentTab === 'dashboard') {
      this.initDashboardCharts();
    } else if (this.currentTab === 'analytics') {
      this.initAnalyticsCharts();
    }
  }

  /**
   * 初始化仪表板图表
   */
  initDashboardCharts() {
    // 这里可以添加仪表板的小图表
    const chartContainer = document.querySelector('.dashboard-chart');
    if (chartContainer) {
      const chart = new ChartComponent(chartContainer, {
        width: 300,
        height: 200
      });

      const data = [
        { label: '今日', value: 25 },
        { label: '昨日', value: 18 },
        { label: '本周', value: 120 },
        { label: '本月', value: 450 }
      ];

      chart.renderBarChart(data);
      this.charts.dashboard = chart;
    }
  }

  /**
   * 初始化分析页面图表
   */
  initAnalyticsCharts() {
    // 进度趋势图表
    const progressChart = document.querySelector('#progress-chart');
    if (progressChart) {
      const chart = new ChartComponent(progressChart, {
        width: 500,
        height: 300
      });

      const data = this.generateProgressData();
      chart.renderLineChart(data);
      this.charts.progress = chart;
    }

    // 正确率分布图表
    const accuracyChart = document.querySelector('#accuracy-chart');
    if (accuracyChart) {
      const chart = new ChartComponent(accuracyChart, {
        width: 400,
        height: 300
      });

      const data = [
        { label: '0-60%', value: 5 },
        { label: '60-70%', value: 12 },
        { label: '70-80%', value: 25 },
        { label: '80-90%', value: 35 },
        { label: '90-100%', value: 23 }
      ];

      chart.renderPieChart(data);
      this.charts.accuracy = chart;
    }
  }

  /**
   * 生成进度数据
   */
  generateProgressData() {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        value: Math.floor(Math.random() * 50) + 20
      });
    }

    return data;
  }

  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 登录表单
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // 登出按钮
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }

    // 快速操作按钮
    const actionBtns = document.querySelectorAll('[data-action]');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', this.handleQuickAction.bind(this));
    });

    // 题目管理按钮
    const addQuestionBtn = document.getElementById('add-question-btn');
    if (addQuestionBtn) {
      addQuestionBtn.addEventListener('click', this.showAddQuestionModal.bind(this));
    }

    // 视频URL更新
    const updateUrlBtns = document.querySelectorAll('[data-action="update-url"]');
    updateUrlBtns.forEach(btn => {
      btn.addEventListener('click', this.handleUpdateVideoUrl.bind(this));
    });
  }

  /**
   * 处理登录
   */
  async handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const credentials = {
      username: formData.get('username'),
      password: formData.get('password')
    };

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('admin_auth', result.token);
        location.reload();
      } else {
        alert(result.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('登录失败，请重试');
    }
  }

  /**
   * 处理登出
   */
  async handleLogout() {
    try {
      const token = localStorage.getItem('admin_auth');
      if (token) {
        await fetch('/api/admin/auth', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      localStorage.removeItem('admin_auth');
      location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('admin_auth');
      location.reload();
    }
  }

  /**
   * 处理快速操作
   */
  handleQuickAction(event) {
    const action = event.currentTarget.dataset.action;

    switch (action) {
      case 'add-question':
        this.showAddQuestionModal();
        break;
      case 'update-video':
        this.switchTab('videos');
        break;
      case 'export-data':
        this.exportData();
        break;
      case 'system-backup':
        this.performBackup();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  /**
   * 显示添加题目模态框
   */
  showAddQuestionModal() {
    // 这里可以实现模态框显示逻辑
    alert('添加题目功能开发中...');
  }

  /**
   * 处理视频URL更新
   */
  async handleUpdateVideoUrl(event) {
    const videoId = event.currentTarget.dataset.videoId;
    const urlInput = document.querySelector(`[data-video-id="${videoId}"].video-url-input`);

    if (!urlInput) return;

    const newUrl = urlInput.value.trim();
    if (!newUrl) {
      alert('请输入有效的视频URL');
      return;
    }

    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch(`/api/admin/videos?id=${videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: newUrl })
      });

      const result = await response.json();

      if (result.success) {
        alert('视频链接更新成功');
      } else {
        alert(result.message || '更新失败');
      }
    } catch (error) {
      console.error('Update video URL error:', error);
      alert('更新失败，请重试');
    }
  }

  /**
   * 导出数据
   */
  async exportData() {
    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          format: 'json',
          range: '30',
          type: 'overview'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analytics_data.json';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('导出失败');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    }
  }

  /**
   * 执行系统备份
   */
  performBackup() {
    alert('系统备份功能开发中...');
  }

  /**
   * 渲染错误页面
   */
  renderError(message) {
    return `
      <div class="error-page">
        <div class="error-content">
          <h1>出错了</h1>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">重新加载</button>
        </div>
      </div>
    `;
  }
}

// 创建并导出AdminPage实例
const adminPageInstance = new AdminPage();
export default adminPageInstance;
