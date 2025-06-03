/**
 * 现代化路由系统
 * 提供SPA路由功能，支持History API和路由守卫
 */

import { Logger } from '../utils/logger.js';
import { componentRegistry } from './componentRegistry.js';

export class Router {
  constructor(routes = {}, options = {}) {
    this.routes = routes;
    this.currentRoute = null;
    this.guards = [];
    this.logger = new Logger('Router');

    // 配置选项
    this.options = {
      mode: 'history', // 'history' 或 'hash'
      base: '/',
      linkActiveClass: 'active',
      ...options
    };

    this.init();
  }

  /**
   * 初始化路由系统
   */
  init() {
    // 绑定浏览器前进后退事件
    window.addEventListener('popstate', this.handlePopState.bind(this));

    // 绑定链接点击事件
    document.addEventListener('click', this.handleLinkClick.bind(this));

    // 导航到当前路径
    const currentPath = this.getCurrentPath();
    this.navigate(currentPath, { replace: true });

    this.logger.info('路由系统初始化完成');
  }

  /**
   * 获取当前路径
   */
  getCurrentPath() {
    if (this.options.mode === 'hash') {
      return window.location.hash.slice(1) || '/';
    }
    return window.location.pathname;
  }

  /**
   * 导航到指定路径
   */
  async navigate(path, options = {}) {
    try {
      this.logger.info(`导航到: ${path}`);

      // 标准化路径
      path = this.normalizePath(path);

      // 检查路由是否存在
      const route = this.routes[path];
      if (!route) {
        return this.handleNotFound(path);
      }

      // 执行路由守卫
      const guardResult = await this.executeGuards(route, path);
      if (!guardResult.allowed) {
        return this.handleGuardRejection(guardResult);
      }

      // 更新浏览器历史
      this.updateHistory(path, route, options);

      // 加载页面组件
      await this.loadComponent(route, path);

      // 更新当前路由
      this.currentRoute = { path, route };

      // 更新页面标题
      this.updatePageTitle(route.title);

      // 更新活动链接
      this.updateActiveLinks(path);

      // 触发路由变化事件
      this.dispatchRouteChange(path, route);

    } catch (error) {
      this.logger.error('路由导航失败:', error);
      this.handleNavigationError(error, path);
    }
  }

  /**
   * 标准化路径
   */
  normalizePath(path) {
    // 移除查询参数和hash
    path = path.split('?')[0].split('#')[0];

    // 确保以/开头
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // 移除末尾的/（除了根路径）
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    return path;
  }

  /**
   * 更新浏览器历史
   */
  updateHistory(path, route, options) {
    const url = this.options.mode === 'hash' ? `#${path}` : path;
    const state = { path, route: route.component };

    if (options.replace) {
      history.replaceState(state, route.title, url);
    } else {
      history.pushState(state, route.title, url);
    }
  }

  /**
   * 加载页面组件
   */
  async loadComponent(route, path) {
    try {
      // 显示加载状态
      this.showLoadingState();

      // 动态导入组件
      const componentModule = await this.importComponent(route.component);

      // 渲染组件
      await this.renderComponent(componentModule, route, path);

      // 隐藏加载状态
      this.hideLoadingState();

    } catch (error) {
      this.logger.error('组件加载失败:', error);
      this.showErrorState(error);
    }
  }

  /**
   * 动态导入组件
   */
  async importComponent(componentName) {
    try {
      // 从组件注册表获取组件
      const Component = componentRegistry.getComponent(componentName);

      if (Component) {
        this.logger.debug(`从注册表获取组件: ${componentName}`);
        return { default: Component };
      }

      // 如果注册表中没有，抛出错误
      throw new Error(`组件 ${componentName} 未在注册表中找到`);

    } catch (error) {
      this.logger.warn(`组件 ${componentName} 加载失败:`, error);

      // 返回降级组件
      return {
        default: {
          render: () => `
            <div class="component-error">
              <h1>组件加载失败</h1>
              <p>组件 "${componentName}" 无法加载，请刷新页面重试。</p>
              <button onclick="location.reload()" class="btn btn-primary">刷新页面</button>
              <a href="/" class="btn btn-secondary">返回首页</a>
            </div>
            <style>
              .component-error {
                text-align: center;
                padding: 3rem 2rem;
                max-width: 500px;
                margin: 0 auto;
              }
              .component-error h1 {
                color: #dc2626;
                margin-bottom: 1rem;
              }
              .component-error p {
                color: #6b7280;
                margin-bottom: 2rem;
              }
              .component-error .btn {
                margin: 0 0.5rem;
              }
            </style>
          `
        }
      };
    }
  }

  /**
   * 渲染组件
   */
  async renderComponent(componentModule, route, path) {
    const Component = componentModule.default;
    const app = document.getElementById('app');

    if (Component && typeof Component.render === 'function') {
      // 如果组件有render方法，调用它
      const html = await Component.render(route.data || {});
      app.innerHTML = html;

      // 如果组件有mounted方法，调用它
      if (typeof Component.mounted === 'function') {
        Component.mounted();
      }
    } else {
      // 简单的HTML替换
      app.innerHTML = `<h1>页面: ${route.component}</h1>`;
    }
  }

  /**
   * 执行路由守卫
   */
  async executeGuards(route, path) {
    for (const guard of this.guards) {
      const result = await guard(route, path);
      if (!result.allowed) {
        return result;
      }
    }
    return { allowed: true };
  }

  /**
   * 添加路由守卫
   */
  addGuard(guard) {
    if (typeof guard === 'function') {
      this.guards.push(guard);
    }
  }

  /**
   * 处理浏览器前进后退
   */
  handlePopState(event) {
    const path = this.getCurrentPath();
    this.navigate(path, { replace: true });
  }

  /**
   * 处理链接点击
   */
  handleLinkClick(event) {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return; // 外部链接或特殊链接，使用默认行为
    }

    // 阻止默认行为
    event.preventDefault();

    // 导航到目标路径
    this.navigate(href);
  }

  /**
   * 处理404错误
   */
  handleNotFound(path) {
    this.logger.warn(`路由未找到: ${path}`);

    // 可以导航到404页面
    const notFoundRoute = this.routes['/404'] || {
      component: 'NotFoundPage',
      title: '页面未找到'
    };

    this.loadComponent(notFoundRoute, path);
  }

  /**
   * 处理路由守卫拒绝
   */
  handleGuardRejection(guardResult) {
    if (guardResult.redirect) {
      this.navigate(guardResult.redirect);
    } else {
      this.logger.warn('路由访问被拒绝:', guardResult.reason);
    }
  }

  /**
   * 处理导航错误
   */
  handleNavigationError(error, path) {
    this.logger.error(`导航到 ${path} 时发生错误:`, error);
    this.showErrorState(error);
  }

  /**
   * 更新页面标题
   */
  updatePageTitle(title) {
    if (title) {
      document.title = title;
    }
  }

  /**
   * 更新活动链接
   */
  updateActiveLinks(currentPath) {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add(this.options.linkActiveClass);
      } else {
        link.classList.remove(this.options.linkActiveClass);
      }
    });
  }

  /**
   * 显示加载状态
   */
  showLoadingState() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  /**
   * 隐藏加载状态
   */
  hideLoadingState() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * 显示错误状态
   */
  showErrorState(error) {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="error-state">
          <h1>页面加载失败</h1>
          <p>抱歉，页面加载时出现了错误。</p>
          <button onclick="location.reload()">重新加载</button>
        </div>
      `;
    }
  }

  /**
   * 触发路由变化事件
   */
  dispatchRouteChange(path, route) {
    const event = new CustomEvent('route:change', {
      detail: { path, route }
    });
    window.dispatchEvent(event);
  }

  /**
   * 获取当前路由信息
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * 编程式导航方法
   */
  push(path) {
    this.navigate(path);
  }

  replace(path) {
    this.navigate(path, { replace: true });
  }

  back() {
    history.back();
  }

  forward() {
    history.forward();
  }
}
