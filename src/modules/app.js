/**
 * 应用主入口文件
 * 负责初始化应用、路由系统和核心功能
 */

import { Router } from './router.js';
import { PerformanceMonitor } from '../utils/performance.js';
import { Logger } from '../utils/logger.js';

class App {
  constructor() {
    this.router = null;
    this.isInitialized = false;
    this.logger = new Logger('App');
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      this.logger.info('正在初始化应用...');
      
      // 显示加载指示器
      this.showLoading();
      
      // 初始化性能监控
      await this.initPerformanceMonitoring();
      
      // 初始化路由系统
      await this.initRouter();
      
      // 注册Service Worker
      await this.registerServiceWorker();
      
      // 设置全局事件监听器
      this.setupEventListeners();
      
      // 隐藏加载指示器
      this.hideLoading();
      
      this.isInitialized = true;
      this.logger.info('应用初始化完成');
      
      // 触发应用就绪事件
      this.dispatchEvent('app:ready');
      
    } catch (error) {
      this.logger.error('应用初始化失败:', error);
      this.showError('应用初始化失败，请刷新页面重试');
    }
  }

  /**
   * 初始化性能监控
   */
  async initPerformanceMonitoring() {
    try {
      await PerformanceMonitor.init();
      this.logger.info('性能监控初始化完成');
    } catch (error) {
      this.logger.warn('性能监控初始化失败:', error);
    }
  }

  /**
   * 初始化路由系统
   */
  async initRouter() {
    const routes = {
      '/': {
        component: 'HomePage',
        title: '安全学习平台',
        auth: false
      },
      '/video/safety': {
        component: 'VideoPage',
        title: '安全操作视频',
        auth: false,
        data: { type: 'safety' }
      },
      '/video/violation': {
        component: 'VideoPage',
        title: '违规操作视频',
        auth: false,
        data: { type: 'violation' }
      },
      '/quiz/safety': {
        component: 'QuizPage',
        title: '安全意识测试',
        auth: false,
        data: { type: 'safety' }
      },
      '/quiz/violation': {
        component: 'QuizPage',
        title: '违规识别测试',
        auth: false,
        data: { type: 'violation' }
      },
      '/admin': {
        component: 'AdminPage',
        title: '管理后台',
        auth: true
      }
    };

    this.router = new Router(routes, {
      mode: 'history',
      base: '/',
      linkActiveClass: 'active'
    });

    // 添加路由守卫
    this.router.addGuard(this.authGuard.bind(this));
    
    this.logger.info('路由系统初始化完成');
  }

  /**
   * 认证守卫
   */
  async authGuard(route, path) {
    if (route.auth) {
      // 检查用户是否已认证
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        return {
          allowed: false,
          redirect: '/login'
        };
      }
    }
    return { allowed: true };
  }

  /**
   * 检查用户认证状态
   */
  async checkAuthentication() {
    // 这里实现认证检查逻辑
    // 暂时返回false，后续实现
    return false;
  }

  /**
   * 注册Service Worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.logger.info('Service Worker注册成功:', registration);
      } catch (error) {
        this.logger.warn('Service Worker注册失败:', error);
      }
    }
  }

  /**
   * 设置全局事件监听器
   */
  setupEventListeners() {
    // 处理未捕获的错误
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // 处理网络状态变化
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // 处理页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * 处理JavaScript错误
   */
  handleError(event) {
    this.logger.error('JavaScript错误:', event.error);
    // 可以在这里发送错误报告到服务器
  }

  /**
   * 处理未捕获的Promise拒绝
   */
  handleUnhandledRejection(event) {
    this.logger.error('未捕获的Promise拒绝:', event.reason);
    event.preventDefault();
  }

  /**
   * 处理网络连接恢复
   */
  handleOnline() {
    this.logger.info('网络连接已恢复');
    this.showNotification('网络连接已恢复', 'success');
  }

  /**
   * 处理网络连接断开
   */
  handleOffline() {
    this.logger.warn('网络连接已断开');
    this.showNotification('网络连接已断开，部分功能可能受限', 'warning');
  }

  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.logger.info('页面变为不可见');
    } else {
      this.logger.info('页面变为可见');
    }
  }

  /**
   * 显示加载指示器
   */
  showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  /**
   * 隐藏加载指示器
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    // 这里可以实现更复杂的错误显示逻辑
    alert(message);
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    // 这里可以实现通知系统
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * 触发自定义事件
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }
}

// 创建应用实例
const app = new App();

// DOM加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// 导出应用实例供其他模块使用
export default app;
