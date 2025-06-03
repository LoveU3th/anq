/**
 * 首页组件
 * 显示平台介绍和主要功能模块
 */

import { Logger } from '../utils/logger.js';

export default class HomePage {
  constructor() {
    this.logger = new Logger('HomePage');
  }

  /**
   * 渲染首页内容
   */
  static async render(data = {}) {
    return `
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">安全管理交互学习平台</h1>
          <p class="hero-description">
            通过视频学习和智能测试，提升您的安全意识和操作规范
          </p>
          <div class="hero-actions">
            <a href="/video/safety" class="btn btn-primary">开始学习</a>
            <a href="/quiz/safety" class="btn btn-secondary">立即测试</a>
          </div>
        </div>
        <div class="hero-image">
          <div style="width: 350px; height: 280px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
            🛡️
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <h2 class="section-title">学习模块</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🎥</div>
            <h3 class="feature-title">视频学习</h3>
            <p class="feature-description">观看安全操作和违规案例视频，直观了解安全规范</p>
            <a href="/video/safety" class="feature-link">开始观看</a>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📝</div>
            <h3 class="feature-title">智能测试</h3>
            <p class="feature-description">通过随机题目测试，检验您的安全知识掌握程度</p>
            <a href="/quiz/safety" class="feature-link">开始测试</a>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3 class="feature-title">学习分析</h3>
            <p class="feature-description">查看学习进度和成绩分析，持续提升安全意识</p>
            <a href="#" class="feature-link">查看进度</a>
          </div>
        </div>
      </section>

      <!-- Statistics Section -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number" id="total-users">1,234</div>
            <div class="stat-label">学习用户</div>
          </div>
          <div class="stat-item">
            <div class="stat-number" id="total-videos">12</div>
            <div class="stat-label">教学视频</div>
          </div>
          <div class="stat-item">
            <div class="stat-number" id="total-questions">156</div>
            <div class="stat-label">测试题目</div>
          </div>
          <div class="stat-item">
            <div class="stat-number" id="completion-rate">95%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
      </section>

      <!-- Recent Activity -->
      <section class="recent-activity">
        <h2 class="section-title">最近活动</h2>
        <div class="activity-list" id="activity-list">
          <div class="activity-item">
            <div class="activity-icon">🎥</div>
            <div class="activity-content">
              <h4>安全操作视频</h4>
              <p>最新的安全操作规范演示视频已上线</p>
              <span class="activity-time">2小时前</span>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon">📝</div>
            <div class="activity-content">
              <h4>新增测试题目</h4>
              <p>安全意识测试新增了20道题目</p>
              <span class="activity-time">1天前</span>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon">🏆</div>
            <div class="activity-content">
              <h4>学习成就</h4>
              <p>恭喜您完成了基础安全培训</p>
              <span class="activity-time">3天前</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * 组件挂载后的初始化
   */
  static async mounted() {
    const instance = new HomePage();
    await instance.init();
  }

  /**
   * 初始化首页
   */
  async init() {
    try {
      this.logger.info('初始化首页');

      // 加载统计数据
      await this.loadStatistics();

      // 加载最近活动
      await this.loadRecentActivity();

      // 绑定事件监听器
      this.bindEventListeners();

      this.logger.info('首页初始化完成');
    } catch (error) {
      this.logger.error('首页初始化失败:', error);
    }
  }

  /**
   * 加载统计数据
   */
  async loadStatistics() {
    try {
      // 这里可以从API获取真实数据
      // 暂时使用模拟数据
      const stats = {
        totalUsers: 1234,
        totalVideos: 12,
        totalQuestions: 156,
        completionRate: 95
      };

      // 更新显示
      this.updateStatistics(stats);

    } catch (error) {
      this.logger.error('加载统计数据失败:', error);
    }
  }

  /**
   * 更新统计数据显示
   */
  updateStatistics(stats) {
    const elements = {
      'total-users': stats.totalUsers.toLocaleString(),
      'total-videos': stats.totalVideos,
      'total-questions': stats.totalQuestions,
      'completion-rate': `${stats.completionRate}%`
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        // 添加数字动画效果
        this.animateNumber(element, value);
      }
    });
  }

  /**
   * 数字动画效果
   */
  animateNumber(element, targetValue) {
    const isPercentage = targetValue.includes('%');
    const numericValue = parseInt(targetValue.replace(/[,%]/g, ''));
    const duration = 1000; // 1秒
    const steps = 30;
    const stepValue = numericValue / steps;
    let currentValue = 0;

    const timer = setInterval(() => {
      currentValue += stepValue;
      if (currentValue >= numericValue) {
        currentValue = numericValue;
        clearInterval(timer);
      }

      let displayValue = Math.floor(currentValue);
      if (targetValue.includes(',')) {
        displayValue = displayValue.toLocaleString();
      }
      if (isPercentage) {
        displayValue += '%';
      }

      element.textContent = displayValue;
    }, duration / steps);
  }

  /**
   * 加载最近活动
   */
  async loadRecentActivity() {
    try {
      // 这里可以从API获取真实数据
      // 暂时使用已有的模拟数据
      this.logger.info('最近活动数据已加载');
    } catch (error) {
      this.logger.error('加载最近活动失败:', error);
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 为功能卡片添加点击事件
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // 如果点击的不是链接，则触发链接点击
        if (e.target.tagName !== 'A') {
          const link = card.querySelector('.feature-link');
          if (link) {
            link.click();
          }
        }
      });
    });

    // 为统计项添加悬停效果
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-5px)';
      });

      item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0)';
      });
    });
  }
}
