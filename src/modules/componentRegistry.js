/**
 * 组件注册表
 * 用于预加载和管理所有页面组件
 */

import { Logger } from '../utils/logger.js';

// 预导入所有组件，确保它们在构建时被包含
import HomePage from '../components/HomePage.js';
import VideoPage from '../components/VideoPage.js';
import QuizPage from '../components/QuizPage.js';
import AdminPage from '../components/AdminPage.js';
import NotFoundPage from '../components/NotFoundPage.js';

/**
 * 组件注册表类
 */
export class ComponentRegistry {
  constructor() {
    this.logger = new Logger('ComponentRegistry');
    this.components = new Map();
    this.init();
  }

  /**
   * 初始化组件注册表
   */
  init() {
    try {
      // 注册所有组件
      this.registerComponent('HomePage', HomePage);
      this.registerComponent('VideoPage', VideoPage);
      this.registerComponent('QuizPage', QuizPage);
      this.registerComponent('AdminPage', AdminPage);
      this.registerComponent('NotFoundPage', NotFoundPage);

      this.logger.info(`组件注册表初始化完成，共注册 ${this.components.size} 个组件`);
    } catch (error) {
      this.logger.error('组件注册表初始化失败:', error);
    }
  }

  /**
   * 注册组件
   */
  registerComponent(name, component) {
    if (!name || !component) {
      throw new Error('组件名称和组件类不能为空');
    }

    this.components.set(name, component);
    this.logger.debug(`组件 ${name} 注册成功`);
  }

  /**
   * 获取组件
   */
  getComponent(name) {
    const component = this.components.get(name);
    if (!component) {
      this.logger.warn(`组件 ${name} 未找到`);
      return null;
    }
    return component;
  }

  /**
   * 检查组件是否存在
   */
  hasComponent(name) {
    return this.components.has(name);
  }

  /**
   * 获取所有已注册的组件名称
   */
  getComponentNames() {
    return Array.from(this.components.keys());
  }

  /**
   * 预加载所有组件
   */
  async preloadComponents() {
    try {
      this.logger.info('开始预加载组件...');
      
      const preloadPromises = Array.from(this.components.entries()).map(
        async ([name, component]) => {
          try {
            // 如果组件有预加载方法，调用它
            if (typeof component.preload === 'function') {
              await component.preload();
            }
            this.logger.debug(`组件 ${name} 预加载完成`);
          } catch (error) {
            this.logger.warn(`组件 ${name} 预加载失败:`, error);
          }
        }
      );

      await Promise.all(preloadPromises);
      this.logger.info('所有组件预加载完成');
    } catch (error) {
      this.logger.error('组件预加载失败:', error);
    }
  }

  /**
   * 获取组件统计信息
   */
  getStats() {
    return {
      totalComponents: this.components.size,
      componentNames: this.getComponentNames(),
      registeredAt: new Date().toISOString()
    };
  }
}

// 创建全局组件注册表实例
export const componentRegistry = new ComponentRegistry();

// 导出默认实例
export default componentRegistry;
