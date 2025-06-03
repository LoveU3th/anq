/**
 * 管理页面组件
 * 提供题库管理、视频管理、数据分析等功能
 */

import { dataManager } from '../modules/data-manager.js';
import { Logger } from '../utils/logger.js';
import { ChartComponent } from './ChartComponent.js';
import { ProgressChart } from './ProgressChart.js';
import { QuizStatsChart } from './QuizStatsChart.js';
import { DashboardWidget } from './DashboardWidget.js';

// 引入分析界面样式
const analyticsStyleLink = document.createElement('link');
analyticsStyleLink.rel = 'stylesheet';
analyticsStyleLink.href = '/src/styles/admin-analytics.css';
document.head.appendChild(analyticsStyleLink);

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
        method: 'GET',
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
        
        <!-- 数据可视化仪表板 -->
        <div class="visualization-dashboard">
          <h2>📊 数据可视化仪表板</h2>
          <div id="realtime-dashboard" class="realtime-dashboard-container">
            <!-- DashboardWidget 将在这里渲染 -->
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
      const token = localStorage.getItem('admin_auth');
      const response = await fetch('/api/admin/questions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      const token = localStorage.getItem('admin_auth');
      const response = await fetch('/api/admin/videos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      const token = localStorage.getItem('admin_auth');
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
            <button class="btn btn-primary" id="add-video-btn">
              <span>➕</span>
              添加视频
            </button>
            <button class="btn btn-outline" id="batch-upload-btn">
              <span>📤</span>
              批量上传
            </button>
            <button class="btn btn-outline" id="video-stats-btn">
              <span>📊</span>
              观看统计
            </button>
          </div>
        </div>

        <!-- 视频筛选和搜索 -->
        <div class="video-filters">
          <div class="filter-group">
            <label>分类筛选:</label>
            <select id="video-category-filter">
              <option value="">全部分类</option>
              <option value="safety_operation">安全操作</option>
              <option value="violation_identification">违规识别</option>
              <option value="emergency_response">应急响应</option>
              <option value="equipment_usage">设备使用</option>
            </select>
          </div>

          <div class="filter-group">
            <label>状态筛选:</label>
            <select id="video-status-filter">
              <option value="">全部状态</option>
              <option value="active">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已归档</option>
            </select>
          </div>

          <div class="search-group">
            <input type="text" id="video-search" placeholder="搜索视频标题或描述...">
            <button class="btn btn-outline" id="search-video-btn">🔍</button>
          </div>
        </div>

        <!-- 视频列表 -->
        <div class="videos-list">
          <div class="list-header">
            <div class="list-controls">
              <span class="total-count">共 ${this.videos.length} 个视频</span>
              <div class="view-toggle">
                <button class="view-btn active" data-view="grid">网格视图</button>
                <button class="view-btn" data-view="list">列表视图</button>
              </div>
            </div>
          </div>

          <div class="videos-content" id="videos-content">
            ${this.renderVideoContent('grid')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染视频内容（网格或列表视图）
   */
  renderVideoContent(viewType = 'grid') {
    const defaultVideos = [
      {
        id: 'safety',
        title: '安全操作视频',
        description: '展示正确的安全操作流程和标准规范',
        url: 'https://example.com/safety-video.mp4',
        thumbnail: '/assets/images/video-thumbnails/safety.jpg',
        duration: 180,
        category: 'safety_operation',
        status: 'active',
        views: 1250,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      },
      {
        id: 'violation',
        title: '违规操作识别',
        description: '识别和避免常见的违规操作行为',
        url: 'https://example.com/violation-video.mp4',
        thumbnail: '/assets/images/video-thumbnails/violation.jpg',
        duration: 240,
        category: 'violation_identification',
        status: 'active',
        views: 980,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z'
      }
    ];

    const videos = this.videos.length > 0 ? this.videos : defaultVideos;

    if (videos.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🎥</div>
          <h3>暂无视频</h3>
          <p>点击"添加视频"开始创建视频库</p>
        </div>
      `;
    }

    if (viewType === 'grid') {
      return `
        <div class="videos-grid">
          ${videos.map(video => this.renderVideoCard(video)).join('')}
        </div>
      `;
    } else {
      return `
        <div class="videos-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>缩略图</th>
                <th>标题</th>
                <th>分类</th>
                <th>时长</th>
                <th>观看次数</th>
                <th>状态</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${videos.map(video => this.renderVideoRow(video)).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  /**
   * 渲染视频卡片
   */
  renderVideoCard(video) {
    return `
      <div class="video-card" data-video-id="${video.id}">
        <div class="video-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='/assets/images/placeholder-video.jpg'">
          <div class="video-overlay">
            <button class="play-btn" data-action="preview" data-video-id="${video.id}">▶️</button>
            <div class="video-duration">${this.formatDuration(video.duration)}</div>
          </div>
          <div class="video-status ${video.status}">
            ${video.status === 'active' ? '已发布' : video.status === 'draft' ? '草稿' : '已归档'}
          </div>
        </div>

        <div class="video-info">
          <h3>${video.title}</h3>
          <p>${video.description}</p>

          <div class="video-meta">
            <span class="category-tag">${this.getCategoryName(video.category)}</span>
            <span class="views-count">👁️ ${video.views || 0}</span>
          </div>

          <div class="video-actions">
            <button class="btn btn-sm btn-primary" data-action="edit" data-video-id="${video.id}">
              ✏️ 编辑
            </button>
            <button class="btn btn-sm btn-outline" data-action="preview" data-video-id="${video.id}">
              👁️ 预览
            </button>
            <button class="btn btn-sm btn-outline" data-action="stats" data-video-id="${video.id}">
              📊 统计
            </button>
            <button class="btn btn-sm btn-danger" data-action="delete" data-video-id="${video.id}">
              🗑️ 删除
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染视频表格行
   */
  renderVideoRow(video) {
    return `
      <tr data-video-id="${video.id}">
        <td>
          <img src="${video.thumbnail}" alt="${video.title}" class="table-thumbnail"
               onerror="this.src='/assets/images/placeholder-video.jpg'">
        </td>
        <td>
          <div class="video-title-cell">
            <strong>${video.title}</strong>
            <small>${video.description.substring(0, 50)}...</small>
          </div>
        </td>
        <td>
          <span class="category-badge">${this.getCategoryName(video.category)}</span>
        </td>
        <td>${this.formatDuration(video.duration)}</td>
        <td>
          <span class="views-badge">👁️ ${video.views || 0}</span>
        </td>
        <td>
          <span class="status-badge status-${video.status}">
            ${video.status === 'active' ? '已发布' : video.status === 'draft' ? '草稿' : '已归档'}
          </span>
        </td>
        <td>${new Date(video.updatedAt).toLocaleDateString()}</td>
        <td class="actions">
          <button class="btn-icon" data-action="edit" data-video-id="${video.id}" title="编辑">
            ✏️
          </button>
          <button class="btn-icon" data-action="preview" data-video-id="${video.id}" title="预览">
            👁️
          </button>
          <button class="btn-icon" data-action="stats" data-video-id="${video.id}" title="统计">
            📊
          </button>
          <button class="btn-icon" data-action="delete" data-video-id="${video.id}" title="删除">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }

  /**
   * 格式化视频时长
   */
  formatDuration(seconds) {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 获取分类名称
   */
  getCategoryName(category) {
    const categoryMap = {
      'safety_operation': '安全操作',
      'violation_identification': '违规识别',
      'emergency_response': '应急响应',
      'equipment_usage': '设备使用'
    };
    return categoryMap[category] || '未分类';
  }

  /**
   * 渲染数据分析
   */
  renderAnalytics() {
    return `
      <div class="analytics">
        <div class="analytics-header">
          <h1>📊 用户数据分析界面</h1>
          <div class="analytics-controls">
            <div class="date-range-picker">
              <label>时间范围:</label>
              <select id="analytics-range">
                <option value="7">最近7天</option>
                <option value="30" selected>最近30天</option>
                <option value="90">最近90天</option>
              </select>
            </div>
            <div class="analytics-actions">
              <button class="btn btn-outline" id="refresh-analytics-btn">
                <span>🔄</span>
                刷新数据
              </button>
              <button class="btn btn-primary" id="export-analytics-btn">
                <span>📤</span>
                导出报告
              </button>
            </div>
          </div>
        </div>

        <!-- 关键指标卡片 -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">📈</div>
            <div class="metric-content">
              <h3>学习完成率</h3>
              <div class="metric-value">${this.analytics.completionRate || 0}%</div>
              <div class="metric-trend ${this.analytics.trends?.completionRate > 0 ? 'positive' : 'negative'}">
                ${this.analytics.trends?.completionRate > 0 ? '↗️' : '↘️'} ${Math.abs(this.analytics.trends?.completionRate || 5.2)}%
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">⏱️</div>
            <div class="metric-content">
              <h3>平均学习时长</h3>
              <div class="metric-value">${this.analytics.avgStudyTime || 0}分钟</div>
              <div class="metric-trend ${this.analytics.trends?.avgStudyTime > 0 ? 'positive' : 'negative'}">
                ${this.analytics.trends?.avgStudyTime > 0 ? '↗️' : '↘️'} ${Math.abs(this.analytics.trends?.avgStudyTime || 2.1)}%
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">✅</div>
            <div class="metric-content">
              <h3>测试通过率</h3>
              <div class="metric-value">${this.analytics.passRate || 0}%</div>
              <div class="metric-trend ${this.analytics.trends?.passRate > 0 ? 'positive' : 'negative'}">
                ${this.analytics.trends?.passRate > 0 ? '↗️' : '↘️'} ${Math.abs(this.analytics.trends?.passRate || 8.3)}%
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">👥</div>
            <div class="metric-content">
              <h3>活跃用户数</h3>
              <div class="metric-value">${this.analytics.activeUsers || 0}</div>
              <div class="metric-trend ${this.analytics.trends?.activeUsers > 0 ? 'positive' : 'negative'}">
                ${this.analytics.trends?.activeUsers > 0 ? '↗️' : '↘️'} ${Math.abs(this.analytics.trends?.activeUsers || 12.5)}%
              </div>
            </div>
          </div>
        </div>

        <!-- 用户学习统计 -->
        <div class="analytics-section">
          <h2>📚 用户学习统计</h2>
          <div class="charts-grid">
            <div class="chart-card">
              <h3>学习进度趋势</h3>
              <div class="chart-placeholder" id="progress-chart">
                <div class="chart-loading">📈 图表加载中...</div>
              </div>
            </div>

            <div class="chart-card">
              <h3>学习时长分布</h3>
              <div class="chart-placeholder" id="study-time-chart">
                <div class="chart-loading">⏱️ 图表加载中...</div>
              </div>
            </div>

            <div class="chart-card">
              <h3>设备使用分布</h3>
              <div class="chart-placeholder" id="device-chart">
                <div class="chart-loading">📱 图表加载中...</div>
              </div>
            </div>

            <div class="chart-card">
              <h3>学习路径分析</h3>
              <div class="chart-placeholder" id="learning-path-chart">
                <div class="chart-loading">🛤️ 图表加载中...</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 答题情况分析 -->
        <div class="analytics-section">
          <h2>📝 答题情况分析</h2>
          <div class="charts-grid">
            <div class="chart-card">
              <h3>答题正确率分布</h3>
              <div class="chart-placeholder" id="accuracy-chart">
                <div class="chart-loading">📊 图表加载中...</div>
              </div>
            </div>

            <div class="chart-card">
              <h3>题目难度分析</h3>
              <div class="chart-placeholder" id="difficulty-chart">
                <div class="chart-loading">🎯 图表加载中...</div>
              </div>
            </div>

            <div class="chart-card">
              <h3>知识点掌握情况</h3>
              <div class="chart-placeholder" id="knowledge-chart">
                <div class="chart-loading">🧠 图表加载中...</div>
              </div>
            </div>

            <div class="chart-card">
              <h3>答题时间分析</h3>
              <div class="chart-placeholder" id="answer-time-chart">
                <div class="chart-loading">⏰ 图表加载中...</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 学习进度追踪 -->
        <div class="analytics-section">
          <h2>📈 学习进度追踪</h2>
          <div class="progress-tracking">
            <div class="progress-summary">
              <div class="summary-card">
                <h4>总体进度</h4>
                <div class="progress-ring">
                  <div class="progress-value">${this.analytics.completionRate || 0}%</div>
                </div>
              </div>

              <div class="summary-card">
                <h4>用户留存率</h4>
                <div class="retention-stats">
                  <div class="retention-item">
                    <span class="retention-label">1天</span>
                    <span class="retention-value">${this.analytics.retentionRate?.day1 || 85}%</span>
                  </div>
                  <div class="retention-item">
                    <span class="retention-label">7天</span>
                    <span class="retention-value">${this.analytics.retentionRate?.day7 || 60}%</span>
                  </div>
                  <div class="retention-item">
                    <span class="retention-label">30天</span>
                    <span class="retention-value">${this.analytics.retentionRate?.day30 || 35}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="progress-details">
              <div class="chart-card full-width">
                <h3>用户活动热力图</h3>
                <div class="chart-placeholder" id="activity-heatmap">
                  <div class="chart-loading">🔥 图表加载中...</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户学习详情表 -->
        <div class="analytics-section">
          <h2>📋 用户学习详情</h2>
          <div class="table-controls">
            <div class="table-filters">
              <select id="user-filter">
                <option value="">所有用户</option>
                <option value="active">活跃用户</option>
                <option value="completed">已完成用户</option>
                <option value="struggling">学习困难用户</option>
              </select>

              <select id="module-filter">
                <option value="">所有模块</option>
                <option value="safety">安全操作</option>
                <option value="violation">违规识别</option>
              </select>

              <input type="text" id="user-search" placeholder="搜索用户ID或设备类型...">
            </div>

            <div class="table-actions">
              <button class="btn btn-outline" id="export-user-data-btn">
                <span>📤</span>
                导出用户数据
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table" id="user-analytics-table">
              <thead>
                <tr>
                  <th>用户ID</th>
                  <th>学习模块</th>
                  <th>完成时间</th>
                  <th>得分</th>
                  <th>用时</th>
                  <th>设备类型</th>
                  <th>学习状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="user-analytics-tbody">
                ${this.renderUserAnalyticsRows()}
              </tbody>
            </table>
          </div>

          <div class="table-pagination">
            <div class="pagination-info">
              显示 <span id="pagination-start">1</span> - <span id="pagination-end">10</span>
              共 <span id="pagination-total">${this.analytics.userActivity?.length || 0}</span> 条记录
            </div>
            <div class="pagination-controls">
              <button class="btn btn-outline" id="prev-page-btn" disabled>上一页</button>
              <span class="page-numbers">
                <button class="btn btn-primary">1</button>
                <button class="btn btn-outline">2</button>
                <button class="btn btn-outline">3</button>
              </span>
              <button class="btn btn-outline" id="next-page-btn">下一页</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染用户分析数据行
   */
  renderUserAnalyticsRows() {
    const userActivity = this.analytics.userActivity || [];

    if (userActivity.length === 0) {
      return `
        <tr>
          <td colspan="8" class="no-data">
            <div class="no-data-message">
              <span class="no-data-icon">📊</span>
              <p>暂无用户学习数据</p>
              <small>用户完成学习后，数据将在此处显示</small>
            </div>
          </td>
        </tr>
      `;
    }

    return userActivity.map(activity => {
      const statusClass = this.getUserStatusClass(activity.score);
      const statusText = this.getUserStatusText(activity.score);

      return `
        <tr class="user-row" data-user-id="${activity.userId}">
          <td>
            <div class="user-id">
              <span class="user-avatar">${activity.userId.charAt(activity.userId.length - 1)}</span>
              <span class="user-name">${activity.userId}</span>
            </div>
          </td>
          <td>
            <span class="module-badge module-${activity.module === '安全操作' ? 'safety' : 'violation'}">
              ${activity.module}
            </span>
          </td>
          <td>
            <div class="completion-time">
              <span class="date">${activity.completedAt.split(' ')[0]}</span>
              <span class="time">${activity.completedAt.split(' ')[1]}</span>
            </div>
          </td>
          <td>
            <div class="score-display">
              <span class="score-value ${statusClass}">${activity.score}分</span>
              <div class="score-bar">
                <div class="score-fill ${statusClass}" style="width: ${activity.score}%"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="time-spent">${activity.timeSpent}分钟</span>
          </td>
          <td>
            <span class="device-type device-${activity.deviceType === '移动端' ? 'mobile' : 'desktop'}">
              ${activity.deviceType === '移动端' ? '📱' : '💻'} ${activity.deviceType}
            </span>
          </td>
          <td>
            <span class="status-badge ${statusClass}">
              ${statusText}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-outline" onclick="adminPage.viewUserDetail('${activity.userId}')" title="查看详情">
                👁️
              </button>
              <button class="btn btn-sm btn-outline" onclick="adminPage.exportUserData('${activity.userId}')" title="导出数据">
                📤
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * 获取用户状态样式类
   */
  getUserStatusClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'average';
    return 'poor';
  }

  /**
   * 获取用户状态文本
   */
  getUserStatusText(score) {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '一般';
    return '需改进';
  }

  /**
   * 查看用户详情
   */
  viewUserDetail(userId) {
    // 显示用户详情模态框
    const userActivity = this.analytics.userActivity?.find(activity => activity.userId === userId);
    if (!userActivity) {
      alert('用户数据不存在');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal user-detail-modal">
        <div class="modal-header">
          <h3>👤 用户学习详情</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="user-detail-content">
            <div class="user-info">
              <h4>基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>用户ID:</label>
                  <span>${userActivity.userId}</span>
                </div>
                <div class="info-item">
                  <label>设备类型:</label>
                  <span>${userActivity.deviceType}</span>
                </div>
                <div class="info-item">
                  <label>学习模块:</label>
                  <span>${userActivity.module}</span>
                </div>
                <div class="info-item">
                  <label>完成时间:</label>
                  <span>${userActivity.completedAt}</span>
                </div>
              </div>
            </div>

            <div class="performance-info">
              <h4>学习表现</h4>
              <div class="performance-grid">
                <div class="performance-card">
                  <div class="performance-icon">📊</div>
                  <div class="performance-content">
                    <h5>得分</h5>
                    <div class="performance-value">${userActivity.score}分</div>
                  </div>
                </div>
                <div class="performance-card">
                  <div class="performance-icon">⏱️</div>
                  <div class="performance-content">
                    <h5>用时</h5>
                    <div class="performance-value">${userActivity.timeSpent}分钟</div>
                  </div>
                </div>
                <div class="performance-card">
                  <div class="performance-icon">🎯</div>
                  <div class="performance-content">
                    <h5>状态</h5>
                    <div class="performance-value">${this.getUserStatusText(userActivity.score)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
          <button class="btn btn-primary" onclick="adminPage.exportUserData('${userActivity.userId}')">导出数据</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * 导出用户数据
   */
  exportUserData(userId) {
    const userActivity = this.analytics.userActivity?.find(activity => activity.userId === userId);
    if (!userActivity) {
      alert('用户数据不存在');
      return;
    }

    const data = {
      userId: userActivity.userId,
      module: userActivity.module,
      completedAt: userActivity.completedAt,
      score: userActivity.score,
      timeSpent: userActivity.timeSpent,
      deviceType: userActivity.deviceType,
      status: this.getUserStatusText(userActivity.score),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_${userId}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
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
    // 初始化实时数据仪表板
    const dashboardContainer = document.getElementById('realtime-dashboard');
    if (dashboardContainer && !this.dashboardWidget) {
      this.dashboardWidget = new DashboardWidget(dashboardContainer, {
        refreshInterval: 30000,
        autoRefresh: true,
        theme: 'light'
      });

      // 初始化仪表板
      this.dashboardWidget.init().catch(error => {
        console.error('Dashboard initialization failed:', error);
      });
    }
  }

  /**
   * 初始化分析页面图表
   */
  initAnalyticsCharts() {
    // 学习进度趋势图表
    const progressChart = document.querySelector('#progress-chart');
    if (progressChart && !this.progressChart) {
      this.progressChart = new ProgressChart(progressChart, {
        width: 500,
        height: 300
      });

      const data = this.generateProgressData();
      this.progressChart.renderProgressTrend(data, { type: 'area' });
      this.charts.progress = this.progressChart;
    }

    // 学习时长分布图表
    const studyTimeChart = document.querySelector('#study-time-chart');
    if (studyTimeChart && !this.studyTimeChart) {
      this.studyTimeChart = new ProgressChart(studyTimeChart, {
        width: 400,
        height: 300
      });

      const studyTimeData = this.generateStudyTimeData();
      this.studyTimeChart.renderStudyTimeDistribution(studyTimeData);
      this.charts.studyTime = this.studyTimeChart;
    }

    // 设备使用分布图表
    const deviceChart = document.querySelector('#device-chart');
    if (deviceChart && !this.deviceChart) {
      this.deviceChart = new ChartComponent(deviceChart, {
        width: 400,
        height: 300
      });

      const deviceData = this.generateDeviceData();
      this.deviceChart.renderPieChart(deviceData);
      this.charts.device = this.deviceChart;
    }

    // 学习路径分析图表
    const learningPathChart = document.querySelector('#learning-path-chart');
    if (learningPathChart && !this.learningPathChart) {
      this.learningPathChart = new ChartComponent(learningPathChart, {
        width: 400,
        height: 300
      });

      const pathData = this.generateLearningPathData();
      this.learningPathChart.renderDoughnutChart(pathData, { centerText: '学习路径' });
      this.charts.learningPath = this.learningPathChart;
    }

    // 答题正确率分布图表
    const accuracyChart = document.querySelector('#accuracy-chart');
    if (accuracyChart && !this.quizStatsChart) {
      this.quizStatsChart = new QuizStatsChart(accuracyChart, {
        width: 400,
        height: 300
      });

      const quizData = this.generateQuizStatsData();
      this.quizStatsChart.renderAccuracyDistribution(quizData);
      this.charts.accuracy = this.quizStatsChart;
    }

    // 题目难度分析图表
    const difficultyChart = document.querySelector('#difficulty-chart');
    if (difficultyChart && !this.difficultyChart) {
      this.difficultyChart = new QuizStatsChart(difficultyChart, {
        width: 400,
        height: 300
      });

      const difficultyData = this.generateDifficultyData();
      this.difficultyChart.renderDifficultyAnalysis(difficultyData);
      this.charts.difficulty = this.difficultyChart;
    }

    // 知识点掌握情况雷达图
    const knowledgeChart = document.querySelector('#knowledge-chart');
    if (knowledgeChart && !this.knowledgeChart) {
      this.knowledgeChart = new QuizStatsChart(knowledgeChart, {
        width: 400,
        height: 300
      });

      const knowledgeData = this.generateKnowledgeData();
      this.knowledgeChart.renderKnowledgePoints(knowledgeData);
      this.charts.knowledge = this.knowledgeChart;
    }

    // 答题时间分析图表
    const answerTimeChart = document.querySelector('#answer-time-chart');
    if (answerTimeChart && !this.answerTimeChart) {
      this.answerTimeChart = new QuizStatsChart(answerTimeChart, {
        width: 400,
        height: 300
      });

      const timeData = this.generateAnswerTimeData();
      this.answerTimeChart.renderTimeAnalysis(timeData);
      this.charts.answerTime = this.answerTimeChart;
    }

    // 用户活动热力图
    const activityHeatmap = document.querySelector('#activity-heatmap');
    if (activityHeatmap && !this.activityHeatmap) {
      this.activityHeatmap = new ChartComponent(activityHeatmap, {
        width: 800,
        height: 200
      });

      const heatmapData = this.generateActivityHeatmapData();
      this.renderActivityHeatmap(heatmapData);
      this.charts.activityHeatmap = this.activityHeatmap;
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
        value: Math.floor(Math.random() * 50) + 20,
        date: date.toISOString(),
        details: `第${30 - i}天学习进度`
      });
    }

    return data;
  }

  /**
   * 生成答题统计数据
   */
  generateQuizStatsData() {
    const quizzes = [];

    for (let i = 0; i < 50; i++) {
      const totalQuestions = 10;
      const correctAnswers = Math.floor(Math.random() * totalQuestions) + 1;

      quizzes.push({
        id: `quiz_${i}`,
        totalQuestions,
        correctAnswers,
        timeSpent: Math.floor(Math.random() * 300) + 60, // 60-360秒
        completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        score: Math.round((correctAnswers / totalQuestions) * 100),
        questions: Array.from({ length: totalQuestions }, (_, index) => ({
          id: `q_${i}_${index}`,
          difficulty: Math.floor(Math.random() * 3) + 1,
          category: ['安全操作', '违规识别', '应急处理', '设备使用'][Math.floor(Math.random() * 4)],
          isCorrect: index < correctAnswers
        }))
      });
    }

    return quizzes;
  }

  /**
   * 生成知识点数据
   */
  generateKnowledgeData() {
    return [
      { name: '安全操作', accuracy: 85, total: 25, correct: 21 },
      { name: '违规识别', accuracy: 78, total: 20, correct: 16 },
      { name: '应急处理', accuracy: 92, total: 15, correct: 14 },
      { name: '设备使用', accuracy: 73, total: 18, correct: 13 },
      { name: '防护措施', accuracy: 88, total: 22, correct: 19 },
      { name: '规章制度', accuracy: 81, total: 16, correct: 13 }
    ];
  }

  /**
   * 生成学习时长分布数据
   */
  generateStudyTimeData() {
    return [
      { range: '0-5分钟', count: 12, percentage: 15 },
      { range: '5-10分钟', count: 28, percentage: 35 },
      { range: '10-15分钟', count: 24, percentage: 30 },
      { range: '15-20分钟', count: 12, percentage: 15 },
      { range: '20分钟以上', count: 4, percentage: 5 }
    ];
  }

  /**
   * 生成设备使用分布数据
   */
  generateDeviceData() {
    return [
      { label: '移动端', value: 65, color: '#3b82f6' },
      { label: '桌面端', value: 30, color: '#10b981' },
      { label: '平板端', value: 5, color: '#f59e0b' }
    ];
  }

  /**
   * 生成学习路径数据
   */
  generateLearningPathData() {
    return [
      { label: '视频优先', value: 70, color: '#8b5cf6' },
      { label: '测试优先', value: 30, color: '#ef4444' }
    ];
  }

  /**
   * 生成题目难度数据
   */
  generateDifficultyData() {
    return [
      { label: '简单', value: 40, accuracy: 92 },
      { label: '中等', value: 45, accuracy: 78 },
      { label: '困难', value: 15, accuracy: 65 }
    ];
  }

  /**
   * 生成答题时间数据
   */
  generateAnswerTimeData() {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        value: Math.floor(Math.random() * 20) + 15, // 15-35秒
        date: date.toISOString(),
        details: `平均答题时间`
      });
    }

    return data;
  }

  /**
   * 生成活动热力图数据
   */
  generateActivityHeatmapData() {
    const data = [];
    const hours = 24;
    const days = 7;
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    for (let day = 0; day < days; day++) {
      for (let hour = 0; hour < hours; hour++) {
        // 模拟活动强度，工作时间和晚上活动较多
        let intensity = 0;
        if (day >= 1 && day <= 5) { // 工作日
          if (hour >= 9 && hour <= 17) {
            intensity = Math.random() * 0.8 + 0.2; // 0.2-1.0
          } else if (hour >= 19 && hour <= 22) {
            intensity = Math.random() * 0.6 + 0.3; // 0.3-0.9
          } else {
            intensity = Math.random() * 0.3; // 0-0.3
          }
        } else { // 周末
          if (hour >= 10 && hour <= 22) {
            intensity = Math.random() * 0.7 + 0.2; // 0.2-0.9
          } else {
            intensity = Math.random() * 0.2; // 0-0.2
          }
        }

        data.push({
          day: dayNames[day],
          hour: hour,
          intensity: Math.round(intensity * 100) / 100,
          count: Math.floor(intensity * 50) // 活动次数
        });
      }
    }

    return data;
  }

  /**
   * 渲染活动热力图
   */
  renderActivityHeatmap(data) {
    const container = document.querySelector('#activity-heatmap');
    if (!container) return;

    const width = 800;
    const height = 200;
    const cellWidth = width / 24;
    const cellHeight = height / 7;

    // 清空容器
    container.innerHTML = '';

    // 创建SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // 创建热力图网格
    data.forEach((item, index) => {
      const day = Math.floor(index / 24);
      const hour = index % 24;
      const x = hour * cellWidth;
      const y = day * cellHeight;

      // 创建矩形
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', cellWidth - 1);
      rect.setAttribute('height', cellHeight - 1);
      rect.setAttribute('fill', this.getHeatmapColor(item.intensity));
      rect.setAttribute('stroke', '#fff');
      rect.setAttribute('stroke-width', '1');
      rect.classList.add('heatmap-cell');

      // 添加交互
      rect.addEventListener('mouseenter', () => {
        this.showHeatmapTooltip(item, rect);
      });

      rect.addEventListener('mouseleave', () => {
        this.hideHeatmapTooltip();
      });

      svg.appendChild(rect);
    });

    // 添加坐标轴标签
    this.addHeatmapLabels(svg, width, height, cellWidth, cellHeight);

    container.appendChild(svg);
  }

  /**
   * 获取热力图颜色
   */
  getHeatmapColor(intensity) {
    const colors = [
      '#f3f4f6', // 0-0.2
      '#dbeafe', // 0.2-0.4
      '#93c5fd', // 0.4-0.6
      '#3b82f6', // 0.6-0.8
      '#1d4ed8'  // 0.8-1.0
    ];

    const index = Math.min(Math.floor(intensity * 5), 4);
    return colors[index];
  }

  /**
   * 添加热力图标签
   */
  addHeatmapLabels(svg, width, height, cellWidth, cellHeight) {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // 添加天数标签
    dayNames.forEach((day, index) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', -10);
      text.setAttribute('y', index * cellHeight + cellHeight / 2 + 5);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#6b7280');
      text.textContent = day;
      svg.appendChild(text);
    });

    // 添加小时标签（每4小时显示一次）
    for (let hour = 0; hour < 24; hour += 4) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', hour * cellWidth + cellWidth / 2);
      text.setAttribute('y', height + 15);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#6b7280');
      text.textContent = `${hour}:00`;
      svg.appendChild(text);
    }
  }

  /**
   * 显示热力图提示
   */
  showHeatmapTooltip(data, element) {
    const tooltip = document.createElement('div');
    tooltip.className = 'heatmap-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <strong>${data.day} ${data.hour}:00</strong>
        <div>活动强度: ${Math.round(data.intensity * 100)}%</div>
        <div>活动次数: ${data.count}</div>
      </div>
    `;

    document.body.appendChild(tooltip);

    // 定位提示框
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
  }

  /**
   * 隐藏热力图提示
   */
  hideHeatmapTooltip() {
    const tooltip = document.querySelector('.heatmap-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
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

    // 批量导入按钮
    const importBtn = document.getElementById('import-questions-btn');
    if (importBtn) {
      importBtn.addEventListener('click', this.showImportModal.bind(this));
    }

    // 导出按钮
    const exportBtn = document.getElementById('export-questions-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', this.exportQuestions.bind(this));
    }

    // 初始化题目表格事件
    this.initQuestionTableEvents();

    // 视频管理按钮
    const addVideoBtn = document.getElementById('add-video-btn');
    if (addVideoBtn) {
      addVideoBtn.addEventListener('click', this.showAddVideoModal.bind(this));
    }

    const batchUploadBtn = document.getElementById('batch-upload-btn');
    if (batchUploadBtn) {
      batchUploadBtn.addEventListener('click', this.showBatchUploadModal.bind(this));
    }

    const videoStatsBtn = document.getElementById('video-stats-btn');
    if (videoStatsBtn) {
      videoStatsBtn.addEventListener('click', this.showVideoStatsModal.bind(this));
    }

    // 视图切换按钮
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', this.handleViewToggle.bind(this));
    });

    // 筛选和搜索
    const categoryFilter = document.getElementById('video-category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', this.handleVideoFilter.bind(this));
    }

    const statusFilter = document.getElementById('video-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', this.handleVideoFilter.bind(this));
    }

    const searchInput = document.getElementById('video-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleVideoSearch.bind(this));
    }

    // 初始化视频事件
    this.initVideoEvents();

    // 初始化分析页面事件
    this.initAnalyticsEvents();
  }

  /**
   * 初始化分析页面事件监听器
   */
  initAnalyticsEvents() {
    // 时间范围选择器
    const analyticsRange = document.getElementById('analytics-range');
    if (analyticsRange) {
      analyticsRange.addEventListener('change', this.handleAnalyticsRangeChange.bind(this));
    }

    // 刷新数据按钮
    const refreshBtn = document.getElementById('refresh-analytics-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', this.refreshAnalyticsData.bind(this));
    }

    // 导出报告按钮
    const exportBtn = document.getElementById('export-analytics-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', this.exportAnalyticsReport.bind(this));
    }

    // 用户筛选器
    const userFilter = document.getElementById('user-filter');
    if (userFilter) {
      userFilter.addEventListener('change', this.handleUserFilter.bind(this));
    }

    // 模块筛选器
    const moduleFilter = document.getElementById('module-filter');
    if (moduleFilter) {
      moduleFilter.addEventListener('change', this.handleModuleFilter.bind(this));
    }

    // 用户搜索
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
      userSearch.addEventListener('input', this.handleUserSearch.bind(this));
    }

    // 导出用户数据按钮
    const exportUserDataBtn = document.getElementById('export-user-data-btn');
    if (exportUserDataBtn) {
      exportUserDataBtn.addEventListener('click', this.exportAllUserData.bind(this));
    }

    // 分页控制
    const prevPageBtn = document.getElementById('prev-page-btn');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', this.handlePrevPage.bind(this));
    }

    const nextPageBtn = document.getElementById('next-page-btn');
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', this.handleNextPage.bind(this));
    }
  }

  /**
   * 处理分析时间范围变化
   */
  async handleAnalyticsRangeChange(event) {
    const range = event.target.value;
    this.logger.info(`切换分析时间范围: ${range}天`);

    try {
      // 重新加载分析数据
      await this.loadAnalytics();

      // 重新渲染图表
      this.refreshCharts();

      // 更新表格数据
      this.updateUserAnalyticsTable();

    } catch (error) {
      this.logger.error('切换时间范围失败:', error);
      alert('切换时间范围失败，请重试');
    }
  }

  /**
   * 刷新分析数据
   */
  async refreshAnalyticsData() {
    const refreshBtn = document.getElementById('refresh-analytics-btn');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<span>🔄</span> 刷新中...';
    }

    try {
      await this.loadAnalytics();
      this.refreshCharts();
      this.updateUserAnalyticsTable();

      // 显示成功提示
      this.showToast('数据刷新成功', 'success');

    } catch (error) {
      this.logger.error('刷新数据失败:', error);
      this.showToast('数据刷新失败，请重试', 'error');
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span>🔄</span> 刷新数据';
      }
    }
  }

  /**
   * 导出分析报告
   */
  async exportAnalyticsReport() {
    try {
      const range = document.getElementById('analytics-range')?.value || '30';

      const reportData = {
        title: '用户数据分析报告',
        generatedAt: new Date().toISOString(),
        timeRange: `最近${range}天`,
        summary: {
          totalUsers: this.analytics.totalUsers || 0,
          completionRate: this.analytics.completionRate || 0,
          avgStudyTime: this.analytics.avgStudyTime || 0,
          passRate: this.analytics.passRate || 0,
          activeUsers: this.analytics.activeUsers || 0
        },
        userActivity: this.analytics.userActivity || [],
        deviceStats: this.analytics.deviceStats || {},
        learningPaths: this.analytics.learningPaths || {},
        retentionRate: this.analytics.retentionRate || {}
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${range}days_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.showToast('报告导出成功', 'success');

    } catch (error) {
      this.logger.error('导出报告失败:', error);
      this.showToast('导出报告失败，请重试', 'error');
    }
  }

  /**
   * 处理用户筛选
   */
  handleUserFilter(event) {
    const filterValue = event.target.value;
    this.currentUserFilter = filterValue;
    this.updateUserAnalyticsTable();
  }

  /**
   * 处理模块筛选
   */
  handleModuleFilter(event) {
    const filterValue = event.target.value;
    this.currentModuleFilter = filterValue;
    this.updateUserAnalyticsTable();
  }

  /**
   * 处理用户搜索
   */
  handleUserSearch(event) {
    const searchValue = event.target.value.toLowerCase();
    this.currentSearchTerm = searchValue;
    this.updateUserAnalyticsTable();
  }

  /**
   * 导出所有用户数据
   */
  exportAllUserData() {
    const userActivity = this.analytics.userActivity || [];

    if (userActivity.length === 0) {
      this.showToast('暂无用户数据可导出', 'warning');
      return;
    }

    const csvData = this.convertToCSV(userActivity);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('用户数据导出成功', 'success');
  }

  /**
   * 转换为CSV格式
   */
  convertToCSV(data) {
    const headers = ['用户ID', '学习模块', '完成时间', '得分', '用时(分钟)', '设备类型', '学习状态'];
    const rows = data.map(item => [
      item.userId,
      item.module,
      item.completedAt,
      item.score,
      item.timeSpent,
      item.deviceType,
      this.getUserStatusText(item.score)
    ]);

    return [headers, ...rows].map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  /**
   * 更新用户分析表格
   */
  updateUserAnalyticsTable() {
    const tbody = document.getElementById('user-analytics-tbody');
    if (!tbody) return;

    // 应用筛选和搜索
    let filteredData = this.analytics.userActivity || [];

    // 用户类型筛选
    if (this.currentUserFilter) {
      filteredData = filteredData.filter(item => {
        switch (this.currentUserFilter) {
          case 'active':
            return item.score >= 80;
          case 'completed':
            return item.score >= 90;
          case 'struggling':
            return item.score < 70;
          default:
            return true;
        }
      });
    }

    // 模块筛选
    if (this.currentModuleFilter) {
      const moduleMap = {
        'safety': '安全操作',
        'violation': '违规识别'
      };
      filteredData = filteredData.filter(item =>
        item.module === moduleMap[this.currentModuleFilter]
      );
    }

    // 搜索筛选
    if (this.currentSearchTerm) {
      filteredData = filteredData.filter(item =>
        item.userId.toLowerCase().includes(this.currentSearchTerm) ||
        item.deviceType.toLowerCase().includes(this.currentSearchTerm)
      );
    }

    // 更新表格内容
    tbody.innerHTML = this.renderFilteredUserRows(filteredData);

    // 更新分页信息
    this.updatePaginationInfo(filteredData.length);
  }

  /**
   * 渲染筛选后的用户行
   */
  renderFilteredUserRows(data) {
    if (data.length === 0) {
      return `
        <tr>
          <td colspan="8" class="no-data">
            <div class="no-data-message">
              <span class="no-data-icon">🔍</span>
              <p>未找到匹配的用户数据</p>
              <small>请尝试调整筛选条件</small>
            </div>
          </td>
        </tr>
      `;
    }

    return data.map(activity => {
      const statusClass = this.getUserStatusClass(activity.score);
      const statusText = this.getUserStatusText(activity.score);

      return `
        <tr class="user-row" data-user-id="${activity.userId}">
          <td>
            <div class="user-id">
              <span class="user-avatar">${activity.userId.charAt(activity.userId.length - 1)}</span>
              <span class="user-name">${activity.userId}</span>
            </div>
          </td>
          <td>
            <span class="module-badge module-${activity.module === '安全操作' ? 'safety' : 'violation'}">
              ${activity.module}
            </span>
          </td>
          <td>
            <div class="completion-time">
              <span class="date">${activity.completedAt.split(' ')[0]}</span>
              <span class="time">${activity.completedAt.split(' ')[1]}</span>
            </div>
          </td>
          <td>
            <div class="score-display">
              <span class="score-value ${statusClass}">${activity.score}分</span>
              <div class="score-bar">
                <div class="score-fill ${statusClass}" style="width: ${activity.score}%"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="time-spent">${activity.timeSpent}分钟</span>
          </td>
          <td>
            <span class="device-type device-${activity.deviceType === '移动端' ? 'mobile' : 'desktop'}">
              ${activity.deviceType === '移动端' ? '📱' : '💻'} ${activity.deviceType}
            </span>
          </td>
          <td>
            <span class="status-badge ${statusClass}">
              ${statusText}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-outline" onclick="adminPage.viewUserDetail('${activity.userId}')" title="查看详情">
                👁️
              </button>
              <button class="btn btn-sm btn-outline" onclick="adminPage.exportUserData('${activity.userId}')" title="导出数据">
                📤
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * 刷新图表
   */
  refreshCharts() {
    // 清除现有图表
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.container) {
        chart.container.innerHTML = '<div class="chart-loading">📈 图表加载中...</div>';
      }
    });

    // 重新初始化图表
    setTimeout(() => {
      this.initAnalyticsCharts();
    }, 100);
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <span class="toast-message">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // 自动移除
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * 更新分页信息
   */
  updatePaginationInfo(totalCount) {
    const startSpan = document.getElementById('pagination-start');
    const endSpan = document.getElementById('pagination-end');
    const totalSpan = document.getElementById('pagination-total');

    if (startSpan) startSpan.textContent = '1';
    if (endSpan) endSpan.textContent = Math.min(10, totalCount).toString();
    if (totalSpan) totalSpan.textContent = totalCount.toString();
  }

  /**
   * 处理上一页
   */
  handlePrevPage() {
    // 分页逻辑实现
    this.showToast('分页功能开发中...', 'info');
  }

  /**
   * 处理下一页
   */
  handleNextPage() {
    // 分页逻辑实现
    this.showToast('分页功能开发中...', 'info');
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
    this.showQuestionModal();
  }

  /**
   * 显示题目编辑模态框
   */
  showEditQuestionModal(questionId) {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      this.showQuestionModal(question);
    }
  }

  /**
   * 显示题目模态框（添加/编辑）
   */
  showQuestionModal(question = null) {
    const isEdit = !!question;
    const modalId = 'question-modal';

    // 移除已存在的模态框
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content question-modal">
        <div class="modal-header">
          <h2>${isEdit ? '编辑题目' : '添加题目'}</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <form class="question-form" id="question-form">
          <div class="form-group">
            <label for="question-text">题目内容 *</label>
            <textarea
              id="question-text"
              name="question"
              required
              placeholder="请输入题目内容..."
              rows="3"
            >${question?.question || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="question-type">题目类型 *</label>
              <select id="question-type" name="type" required>
                <option value="">请选择类型</option>
                <option value="single" ${question?.type === 'single' ? 'selected' : ''}>单选题</option>
                <option value="multiple" ${question?.type === 'multiple' ? 'selected' : ''}>多选题</option>
                <option value="judge" ${question?.type === 'judge' ? 'selected' : ''}>判断题</option>
              </select>
            </div>

            <div class="form-group">
              <label for="question-difficulty">难度等级 *</label>
              <select id="question-difficulty" name="difficulty" required>
                <option value="">请选择难度</option>
                <option value="1" ${question?.difficulty === 1 ? 'selected' : ''}>简单 ★</option>
                <option value="2" ${question?.difficulty === 2 ? 'selected' : ''}>中等 ★★</option>
                <option value="3" ${question?.difficulty === 3 ? 'selected' : ''}>困难 ★★★</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="question-category">分类标签</label>
              <input
                type="text"
                id="question-category"
                name="category"
                placeholder="如：安全操作、违规识别等"
                value="${question?.category || ''}"
              >
            </div>

            <div class="form-group">
              <label for="question-points">分值</label>
              <input
                type="number"
                id="question-points"
                name="points"
                min="1"
                max="20"
                value="${question?.points || 10}"
              >
            </div>
          </div>

          <div class="options-section">
            <label>选项设置 *</label>
            <div id="options-container">
              ${this.renderOptionsInputs(question)}
            </div>
            <button type="button" class="btn btn-outline btn-sm" id="add-option-btn">
              + 添加选项
            </button>
          </div>

          <div class="form-group">
            <label for="question-explanation">答案解析</label>
            <textarea
              id="question-explanation"
              name="explanation"
              placeholder="请输入答案解析..."
              rows="2"
            >${question?.explanation || ''}</textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
              取消
            </button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? '保存修改' : '添加题目'}
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // 初始化模态框交互
    this.initQuestionModalInteractions(modal, question);
  }

  /**
   * 渲染选项输入框
   */
  renderOptionsInputs(question = null) {
    const options = question?.options || [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ];

    return options.map((option, index) => `
      <div class="option-input" data-index="${index}">
        <div class="option-content">
          <input
            type="text"
            name="option-${index}"
            placeholder="选项 ${String.fromCharCode(65 + index)}"
            value="${option.text || ''}"
            required
          >
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="correct-${index}"
              ${option.isCorrect ? 'checked' : ''}
            >
            <span class="checkmark"></span>
            正确答案
          </label>
        </div>
        <button type="button" class="btn-icon remove-option" onclick="this.closest('.option-input').remove()">
          🗑️
        </button>
      </div>
    `).join('');
  }

  /**
   * 初始化题目模态框交互
   */
  initQuestionModalInteractions(modal, question) {
    const form = modal.querySelector('#question-form');
    const addOptionBtn = modal.querySelector('#add-option-btn');
    const optionsContainer = modal.querySelector('#options-container');
    const typeSelect = modal.querySelector('#question-type');

    // 添加选项按钮
    addOptionBtn.addEventListener('click', () => {
      const currentOptions = optionsContainer.querySelectorAll('.option-input');
      const newIndex = currentOptions.length;

      if (newIndex < 6) { // 最多6个选项
        const optionHtml = `
          <div class="option-input" data-index="${newIndex}">
            <div class="option-content">
              <input
                type="text"
                name="option-${newIndex}"
                placeholder="选项 ${String.fromCharCode(65 + newIndex)}"
                required
              >
              <label class="checkbox-label">
                <input type="checkbox" name="correct-${newIndex}">
                <span class="checkmark"></span>
                正确答案
              </label>
            </div>
            <button type="button" class="btn-icon remove-option" onclick="this.closest('.option-input').remove()">
              🗑️
            </button>
          </div>
        `;
        optionsContainer.insertAdjacentHTML('beforeend', optionHtml);
      }
    });

    // 题目类型变化处理
    typeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');

      if (type === 'judge') {
        // 判断题只需要两个选项
        const options = optionsContainer.querySelectorAll('.option-input');
        options.forEach((option, index) => {
          if (index >= 2) {
            option.remove();
          } else {
            const input = option.querySelector('input[type="text"]');
            input.value = index === 0 ? '正确' : '错误';
            input.readOnly = true;
          }
        });
      } else {
        // 恢复选项输入
        const inputs = optionsContainer.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
          input.readOnly = false;
        });
      }

      if (type === 'single') {
        // 单选题只能选择一个正确答案
        checkboxes.forEach(checkbox => {
          checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
              checkboxes.forEach(cb => {
                if (cb !== e.target) cb.checked = false;
              });
            }
          });
        });
      }
    });

    // 表单提交
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleQuestionSubmit(form, question);
      modal.remove();
    });
  }

  /**
   * 处理题目提交
   */
  async handleQuestionSubmit(form, existingQuestion = null) {
    const formData = new FormData(form);
    const isEdit = !!existingQuestion;

    // 收集选项数据
    const options = [];
    const optionInputs = form.querySelectorAll('[name^="option-"]');

    optionInputs.forEach((input, index) => {
      const correctCheckbox = form.querySelector(`[name="correct-${index}"]`);
      if (input.value.trim()) {
        options.push({
          text: input.value.trim(),
          isCorrect: correctCheckbox ? correctCheckbox.checked : false
        });
      }
    });

    // 验证至少有一个正确答案
    const hasCorrectAnswer = options.some(option => option.isCorrect);
    if (!hasCorrectAnswer) {
      alert('请至少选择一个正确答案');
      return;
    }

    const questionData = {
      id: existingQuestion?.id || `q_${Date.now()}`,
      question: formData.get('question'),
      type: formData.get('type'),
      difficulty: parseInt(formData.get('difficulty')),
      category: formData.get('category') || '未分类',
      points: parseInt(formData.get('points')) || 10,
      options: options,
      explanation: formData.get('explanation') || '',
      createdAt: existingQuestion?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('admin_auth');
      const url = isEdit ? `/api/admin/questions/${existingQuestion.id}` : '/api/admin/questions';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(questionData)
      });

      const result = await response.json();

      if (result.success) {
        // 更新本地数据
        if (isEdit) {
          const index = this.questions.findIndex(q => q.id === existingQuestion.id);
          if (index !== -1) {
            this.questions[index] = questionData;
          }
        } else {
          this.questions.push(questionData);
        }

        // 重新渲染题目列表
        this.refreshQuestionsTable();

        alert(isEdit ? '题目更新成功' : '题目添加成功');
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('Question submit error:', error);
      alert('操作失败，请重试');
    }
  }

  /**
   * 刷新题目表格
   */
  refreshQuestionsTable() {
    const tableContainer = document.querySelector('.questions-table');
    if (tableContainer) {
      tableContainer.innerHTML = this.renderQuestionsTable();
      this.initQuestionTableEvents();
    }
  }

  /**
   * 初始化题目表格事件
   */
  initQuestionTableEvents() {
    // 编辑按钮
    const editBtns = document.querySelectorAll('[data-action="edit"]');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const questionId = e.target.dataset.id;
        this.showEditQuestionModal(questionId);
      });
    });

    // 删除按钮
    const deleteBtns = document.querySelectorAll('[data-action="delete"]');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const questionId = e.target.dataset.id;
        this.handleDeleteQuestion(questionId);
      });
    });

    // 预览按钮
    const previewBtns = document.querySelectorAll('[data-action="preview"]');
    previewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const questionId = e.target.dataset.id;
        this.showQuestionPreview(questionId);
      });
    });
  }

  /**
   * 处理删除题目
   */
  async handleDeleteQuestion(questionId) {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return;

    if (!confirm(`确定要删除题目"${question.question.substring(0, 30)}..."吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // 从本地数据中移除
        this.questions = this.questions.filter(q => q.id !== questionId);

        // 重新渲染表格
        this.refreshQuestionsTable();

        alert('题目删除成功');
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete question error:', error);
      alert('删除失败，请重试');
    }
  }

  /**
   * 显示题目预览
   */
  showQuestionPreview(questionId) {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content question-preview">
        <div class="modal-header">
          <h2>题目预览</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <div class="preview-content">
          <div class="question-info">
            <span class="badge ${question.type === 'safety' ? 'badge-success' : 'badge-warning'}">
              ${question.type === 'safety' ? '安全操作' : '违规识别'}
            </span>
            <span class="difficulty-badge difficulty-${question.difficulty}">
              ${'★'.repeat(question.difficulty)}
            </span>
            <span class="category-tag">${question.category}</span>
          </div>

          <div class="question-text">
            <h3>${question.question}</h3>
          </div>

          <div class="question-options">
            ${question.options.map((option, index) => `
              <div class="option-item ${option.isCorrect ? 'correct-option' : ''}">
                <span class="option-label">${String.fromCharCode(65 + index)}.</span>
                <span class="option-text">${option.text}</span>
                ${option.isCorrect ? '<span class="correct-mark">✓</span>' : ''}
              </div>
            `).join('')}
          </div>

          ${question.explanation ? `
            <div class="question-explanation">
              <h4>答案解析：</h4>
              <p>${question.explanation}</p>
            </div>
          ` : ''}
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
            关闭
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * 显示批量导入模态框
   */
  showImportModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content import-modal">
        <div class="modal-header">
          <h2>批量导入题目</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <div class="import-content">
          <div class="import-instructions">
            <h3>导入说明</h3>
            <ul>
              <li>支持JSON格式文件导入</li>
              <li>文件大小不超过5MB</li>
              <li>请确保数据格式正确</li>
            </ul>
          </div>

          <div class="file-upload-area">
            <input type="file" id="import-file" accept=".json" style="display: none;">
            <div class="upload-zone" onclick="document.getElementById('import-file').click()">
              <div class="upload-icon">📁</div>
              <p>点击选择文件或拖拽文件到此处</p>
              <small>支持 .json 格式</small>
            </div>
          </div>

          <div class="import-preview" id="import-preview" style="display: none;">
            <h4>预览数据</h4>
            <div class="preview-stats"></div>
            <div class="preview-list"></div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
            取消
          </button>
          <button class="btn btn-primary" id="confirm-import-btn" disabled>
            确认导入
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.initImportModalEvents(modal);
  }

  /**
   * 初始化导入模态框事件
   */
  initImportModalEvents(modal) {
    const fileInput = modal.querySelector('#import-file');
    const uploadZone = modal.querySelector('.upload-zone');
    const previewDiv = modal.querySelector('#import-preview');
    const confirmBtn = modal.querySelector('#confirm-import-btn');
    let importData = null;

    // 文件选择事件
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleImportFile(file, previewDiv, confirmBtn).then(data => {
          importData = data;
        });
      }
    });

    // 拖拽上传
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/json') {
        this.handleImportFile(file, previewDiv, confirmBtn).then(data => {
          importData = data;
        });
      } else {
        alert('请选择JSON格式文件');
      }
    });

    // 确认导入
    confirmBtn.addEventListener('click', async () => {
      if (importData) {
        await this.performImport(importData);
        modal.remove();
      }
    });
  }

  /**
   * 处理导入文件
   */
  async handleImportFile(file, previewDiv, confirmBtn) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error('文件格式错误：应为题目数组');
      }

      // 验证数据格式
      const validQuestions = data.filter(item =>
        item.question && item.type && item.options && Array.isArray(item.options)
      );

      if (validQuestions.length === 0) {
        throw new Error('未找到有效的题目数据');
      }

      // 显示预览
      this.showImportPreview(validQuestions, previewDiv);
      confirmBtn.disabled = false;

      return validQuestions;
    } catch (error) {
      alert('文件解析失败：' + error.message);
      confirmBtn.disabled = true;
      return null;
    }
  }

  /**
   * 显示导入预览
   */
  showImportPreview(questions, previewDiv) {
    const statsDiv = previewDiv.querySelector('.preview-stats');
    const listDiv = previewDiv.querySelector('.preview-list');

    statsDiv.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">${questions.length}</span>
          <span class="stat-label">题目总数</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${questions.filter(q => q.type === 'single').length}</span>
          <span class="stat-label">单选题</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${questions.filter(q => q.type === 'multiple').length}</span>
          <span class="stat-label">多选题</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${questions.filter(q => q.type === 'judge').length}</span>
          <span class="stat-label">判断题</span>
        </div>
      </div>
    `;

    listDiv.innerHTML = `
      <div class="preview-questions">
        ${questions.slice(0, 5).map((q, index) => `
          <div class="preview-question">
            <span class="question-index">${index + 1}.</span>
            <span class="question-text">${q.question.substring(0, 60)}...</span>
            <span class="question-type">${q.type}</span>
          </div>
        `).join('')}
        ${questions.length > 5 ? `<div class="more-indicator">还有 ${questions.length - 5} 道题目...</div>` : ''}
      </div>
    `;

    previewDiv.style.display = 'block';
  }

  /**
   * 执行导入
   */
  async performImport(questions) {
    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch('/api/admin/questions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questions })
      });

      const result = await response.json();

      if (result.success) {
        // 更新本地数据
        this.questions.push(...questions);
        this.refreshQuestionsTable();

        alert(`成功导入 ${questions.length} 道题目`);
      } else {
        alert(result.message || '导入失败');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('导入失败，请重试');
    }
  }

  /**
   * 导出题目
   */
  async exportQuestions() {
    try {
      if (this.questions.length === 0) {
        alert('暂无题目可导出');
        return;
      }

      const exportData = this.questions.map(q => ({
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        category: q.category,
        points: q.points,
        options: q.options,
        explanation: q.explanation
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questions_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      alert('题库导出成功');
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    }
  }

  /**
   * 初始化视频事件
   */
  initVideoEvents() {
    // 视频操作按钮
    const videoActionBtns = document.querySelectorAll('[data-action]');
    videoActionBtns.forEach(btn => {
      const action = btn.dataset.action;
      const videoId = btn.dataset.videoId;

      if (action && videoId) {
        btn.addEventListener('click', (e) => {
          this.handleVideoAction(action, videoId, e);
        });
      }
    });
  }

  /**
   * 处理视频操作
   */
  handleVideoAction(action, videoId, event) {
    switch (action) {
      case 'edit':
        this.showEditVideoModal(videoId);
        break;
      case 'preview':
        this.showVideoPreview(videoId);
        break;
      case 'stats':
        this.showVideoStats(videoId);
        break;
      case 'delete':
        this.handleDeleteVideo(videoId);
        break;
      default:
        console.log('Unknown video action:', action);
    }
  }

  /**
   * 显示添加视频模态框
   */
  showAddVideoModal() {
    this.showVideoModal();
  }

  /**
   * 显示编辑视频模态框
   */
  showEditVideoModal(videoId) {
    const video = this.videos.find(v => v.id === videoId);
    if (video) {
      this.showVideoModal(video);
    }
  }

  /**
   * 显示视频模态框（添加/编辑）
   */
  showVideoModal(video = null) {
    const isEdit = !!video;
    const modalId = 'video-modal';

    // 移除已存在的模态框
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content video-modal">
        <div class="modal-header">
          <h2>${isEdit ? '编辑视频' : '添加视频'}</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <form class="video-form" id="video-form">
          <div class="form-row">
            <div class="form-group">
              <label for="video-title">视频标题 *</label>
              <input
                type="text"
                id="video-title"
                name="title"
                required
                placeholder="请输入视频标题"
                value="${video?.title || ''}"
              >
            </div>

            <div class="form-group">
              <label for="video-category">视频分类 *</label>
              <select id="video-category" name="category" required>
                <option value="">请选择分类</option>
                <option value="safety_operation" ${video?.category === 'safety_operation' ? 'selected' : ''}>安全操作</option>
                <option value="violation_identification" ${video?.category === 'violation_identification' ? 'selected' : ''}>违规识别</option>
                <option value="emergency_response" ${video?.category === 'emergency_response' ? 'selected' : ''}>应急响应</option>
                <option value="equipment_usage" ${video?.category === 'equipment_usage' ? 'selected' : ''}>设备使用</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="video-description">视频描述</label>
            <textarea
              id="video-description"
              name="description"
              placeholder="请输入视频描述..."
              rows="3"
            >${video?.description || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="video-url">视频链接 *</label>
              <input
                type="url"
                id="video-url"
                name="url"
                required
                placeholder="https://example.com/video.mp4"
                value="${video?.url || ''}"
              >
            </div>

            <div class="form-group">
              <label for="video-thumbnail">缩略图链接</label>
              <input
                type="url"
                id="video-thumbnail"
                name="thumbnail"
                placeholder="https://example.com/thumbnail.jpg"
                value="${video?.thumbnail || ''}"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="video-duration">视频时长（秒）</label>
              <input
                type="number"
                id="video-duration"
                name="duration"
                min="1"
                placeholder="180"
                value="${video?.duration || ''}"
              >
            </div>

            <div class="form-group">
              <label for="video-status">发布状态</label>
              <select id="video-status" name="status">
                <option value="draft" ${video?.status === 'draft' ? 'selected' : ''}>草稿</option>
                <option value="active" ${video?.status === 'active' ? 'selected' : ''}>已发布</option>
                <option value="archived" ${video?.status === 'archived' ? 'selected' : ''}>已归档</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
              取消
            </button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? '保存修改' : '添加视频'}
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // 初始化模态框交互
    this.initVideoModalInteractions(modal, video);
  }

  /**
   * 初始化视频模态框交互
   */
  initVideoModalInteractions(modal, video) {
    const form = modal.querySelector('#video-form');

    // 表单提交
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleVideoSubmit(form, video);
      modal.remove();
    });
  }

  /**
   * 处理视频提交
   */
  async handleVideoSubmit(form, existingVideo = null) {
    const formData = new FormData(form);
    const isEdit = !!existingVideo;

    const videoData = {
      id: existingVideo?.id || `v_${Date.now()}`,
      title: formData.get('title'),
      description: formData.get('description') || '',
      url: formData.get('url'),
      thumbnail: formData.get('thumbnail') || '/assets/images/placeholder-video.jpg',
      category: formData.get('category'),
      duration: parseInt(formData.get('duration')) || 0,
      status: formData.get('status') || 'draft',
      views: existingVideo?.views || 0,
      createdAt: existingVideo?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('admin_auth');
      const url = isEdit ? `/api/admin/videos/${existingVideo.id}` : '/api/admin/videos';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(videoData)
      });

      const result = await response.json();

      if (result.success) {
        // 更新本地数据
        if (isEdit) {
          const index = this.videos.findIndex(v => v.id === existingVideo.id);
          if (index !== -1) {
            this.videos[index] = videoData;
          }
        } else {
          this.videos.push(videoData);
        }

        // 重新渲染视频列表
        this.refreshVideoContent();

        alert(isEdit ? '视频更新成功' : '视频添加成功');
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('Video submit error:', error);
      alert('操作失败，请重试');
    }
  }

  /**
   * 刷新视频内容
   */
  refreshVideoContent() {
    const contentContainer = document.getElementById('videos-content');
    if (contentContainer) {
      const currentView = document.querySelector('.view-btn.active')?.dataset.view || 'grid';
      contentContainer.innerHTML = this.renderVideoContent(currentView);
      this.initVideoEvents();
    }
  }

  /**
   * 处理视图切换
   */
  handleViewToggle(event) {
    const viewType = event.target.dataset.view;

    // 更新按钮状态
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // 重新渲染内容
    const contentContainer = document.getElementById('videos-content');
    if (contentContainer) {
      contentContainer.innerHTML = this.renderVideoContent(viewType);
      this.initVideoEvents();
    }
  }

  /**
   * 处理视频筛选
   */
  handleVideoFilter() {
    // 这里可以实现筛选逻辑
    console.log('Video filter triggered');
  }

  /**
   * 处理视频搜索
   */
  handleVideoSearch() {
    // 这里可以实现搜索逻辑
    console.log('Video search triggered');
  }

  /**
   * 显示视频统计模态框
   */
  showVideoStatsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content stats-modal">
        <div class="modal-header">
          <h2>视频观看统计</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <div class="stats-content">
          <div class="stats-summary">
            <div class="stat-card">
              <h3>总观看次数</h3>
              <div class="stat-number">2,230</div>
            </div>
            <div class="stat-card">
              <h3>平均观看时长</h3>
              <div class="stat-number">2:45</div>
            </div>
            <div class="stat-card">
              <h3>完成率</h3>
              <div class="stat-number">78%</div>
            </div>
          </div>

          <div class="stats-chart">
            <h3>观看趋势</h3>
            <div id="video-stats-chart" style="height: 300px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6c757d;">
              图表加载中...
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
            关闭
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * 显示批量上传模态框
   */
  showBatchUploadModal() {
    alert('批量上传功能开发中...');
  }

  /**
   * 显示视频预览
   */
  showVideoPreview(videoId) {
    const video = this.videos.find(v => v.id === videoId);
    if (!video) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content video-preview-modal">
        <div class="modal-header">
          <h2>视频预览</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <div class="video-preview-content">
          <div class="video-player">
            <video controls style="width: 100%; max-height: 400px;">
              <source src="${video.url}" type="video/mp4">
              您的浏览器不支持视频播放。
            </video>
          </div>

          <div class="video-details">
            <h3>${video.title}</h3>
            <p>${video.description}</p>
            <div class="video-meta">
              <span>分类：${this.getCategoryName(video.category)}</span>
              <span>时长：${this.formatDuration(video.duration)}</span>
              <span>观看次数：${video.views || 0}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
            关闭
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * 显示视频统计
   */
  showVideoStats(videoId) {
    alert(`视频 ${videoId} 的详细统计功能开发中...`);
  }

  /**
   * 处理删除视频
   */
  async handleDeleteVideo(videoId) {
    const video = this.videos.find(v => v.id === videoId);
    if (!video) return;

    if (!confirm(`确定要删除视频"${video.title}"吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // 从本地数据中移除
        this.videos = this.videos.filter(v => v.id !== videoId);

        // 重新渲染列表
        this.refreshVideoContent();

        alert('视频删除成功');
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete video error:', error);
      alert('删除失败，请重试');
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

// 创建全局实例，供HTML中的onclick事件使用
window.adminPage = adminPageInstance;
