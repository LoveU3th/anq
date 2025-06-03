/**
 * 本地存储管理工具
 * 提供localStorage和sessionStorage的统一管理接口
 */

import { Logger } from './logger.js';

class StorageManager {
  constructor() {
    this.logger = new Logger('StorageManager');
    this.prefix = 'anq_'; // 应用前缀，避免命名冲突
    this.version = '1.0'; // 数据版本，用于兼容性检查
  }

  /**
   * 生成带前缀的键名
   * @param {string} key - 原始键名
   * @returns {string} - 带前缀的键名
   */
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * 检查存储是否可用
   * @param {Storage} storage - 存储对象
   * @returns {boolean} - 是否可用
   */
  isStorageAvailable(storage) {
    try {
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      this.logger.warn('存储不可用:', error);
      return false;
    }
  }

  /**
   * 序列化数据
   * @param {*} data - 要序列化的数据
   * @returns {string} - 序列化后的字符串
   */
  serialize(data) {
    try {
      return JSON.stringify({
        version: this.version,
        timestamp: Date.now(),
        data: data
      });
    } catch (error) {
      this.logger.error('数据序列化失败:', error);
      throw new Error('数据序列化失败');
    }
  }

  /**
   * 反序列化数据
   * @param {string} serializedData - 序列化的数据
   * @returns {*} - 反序列化后的数据
   */
  deserialize(serializedData) {
    try {
      const parsed = JSON.parse(serializedData);
      
      // 检查数据版本兼容性
      if (parsed.version !== this.version) {
        this.logger.warn(`数据版本不匹配: ${parsed.version} vs ${this.version}`);
        // 这里可以添加数据迁移逻辑
      }
      
      return parsed.data;
    } catch (error) {
      this.logger.error('数据反序列化失败:', error);
      return null;
    }
  }

  /**
   * 设置localStorage数据
   * @param {string} key - 键名
   * @param {*} value - 值
   * @param {Object} options - 选项
   * @returns {boolean} - 是否成功
   */
  setLocal(key, value, options = {}) {
    if (!this.isStorageAvailable(localStorage)) {
      return false;
    }

    try {
      const serializedData = this.serialize(value);
      const fullKey = this.getKey(key);
      
      localStorage.setItem(fullKey, serializedData);
      
      // 设置过期时间（如果指定）
      if (options.expires) {
        const expiryKey = this.getKey(`${key}_expires`);
        const expiryTime = Date.now() + (options.expires * 1000);
        localStorage.setItem(expiryKey, expiryTime.toString());
      }
      
      this.logger.debug(`localStorage设置成功: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`localStorage设置失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取localStorage数据
   * @param {string} key - 键名
   * @param {*} defaultValue - 默认值
   * @returns {*} - 存储的值或默认值
   */
  getLocal(key, defaultValue = null) {
    if (!this.isStorageAvailable(localStorage)) {
      return defaultValue;
    }

    try {
      const fullKey = this.getKey(key);
      const expiryKey = this.getKey(`${key}_expires`);
      
      // 检查是否过期
      const expiryTime = localStorage.getItem(expiryKey);
      if (expiryTime && Date.now() > parseInt(expiryTime)) {
        this.removeLocal(key);
        return defaultValue;
      }
      
      const serializedData = localStorage.getItem(fullKey);
      if (serializedData === null) {
        return defaultValue;
      }
      
      const data = this.deserialize(serializedData);
      return data !== null ? data : defaultValue;
    } catch (error) {
      this.logger.error(`localStorage获取失败: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * 删除localStorage数据
   * @param {string} key - 键名
   * @returns {boolean} - 是否成功
   */
  removeLocal(key) {
    if (!this.isStorageAvailable(localStorage)) {
      return false;
    }

    try {
      const fullKey = this.getKey(key);
      const expiryKey = this.getKey(`${key}_expires`);
      
      localStorage.removeItem(fullKey);
      localStorage.removeItem(expiryKey);
      
      this.logger.debug(`localStorage删除成功: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`localStorage删除失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 设置sessionStorage数据
   * @param {string} key - 键名
   * @param {*} value - 值
   * @returns {boolean} - 是否成功
   */
  setSession(key, value) {
    if (!this.isStorageAvailable(sessionStorage)) {
      return false;
    }

    try {
      const serializedData = this.serialize(value);
      const fullKey = this.getKey(key);
      
      sessionStorage.setItem(fullKey, serializedData);
      
      this.logger.debug(`sessionStorage设置成功: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`sessionStorage设置失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取sessionStorage数据
   * @param {string} key - 键名
   * @param {*} defaultValue - 默认值
   * @returns {*} - 存储的值或默认值
   */
  getSession(key, defaultValue = null) {
    if (!this.isStorageAvailable(sessionStorage)) {
      return defaultValue;
    }

    try {
      const fullKey = this.getKey(key);
      const serializedData = sessionStorage.getItem(fullKey);
      
      if (serializedData === null) {
        return defaultValue;
      }
      
      const data = this.deserialize(serializedData);
      return data !== null ? data : defaultValue;
    } catch (error) {
      this.logger.error(`sessionStorage获取失败: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * 删除sessionStorage数据
   * @param {string} key - 键名
   * @returns {boolean} - 是否成功
   */
  removeSession(key) {
    if (!this.isStorageAvailable(sessionStorage)) {
      return false;
    }

    try {
      const fullKey = this.getKey(key);
      sessionStorage.removeItem(fullKey);
      
      this.logger.debug(`sessionStorage删除成功: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`sessionStorage删除失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 清空所有应用相关的存储数据
   * @param {boolean} includeSession - 是否包括session存储
   * @returns {boolean} - 是否成功
   */
  clearAll(includeSession = false) {
    try {
      // 清空localStorage
      if (this.isStorageAvailable(localStorage)) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // 清空sessionStorage（如果指定）
      if (includeSession && this.isStorageAvailable(sessionStorage)) {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      }

      this.logger.info('存储数据清空完成');
      return true;
    } catch (error) {
      this.logger.error('存储数据清空失败:', error);
      return false;
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Object} - 存储使用情况
   */
  getStorageInfo() {
    const info = {
      localStorage: { available: false, used: 0, total: 0 },
      sessionStorage: { available: false, used: 0, total: 0 }
    };

    // localStorage信息
    if (this.isStorageAvailable(localStorage)) {
      info.localStorage.available = true;
      try {
        const used = JSON.stringify(localStorage).length;
        info.localStorage.used = used;
        info.localStorage.total = 5 * 1024 * 1024; // 假设5MB限制
      } catch (error) {
        this.logger.warn('无法获取localStorage使用情况:', error);
      }
    }

    // sessionStorage信息
    if (this.isStorageAvailable(sessionStorage)) {
      info.sessionStorage.available = true;
      try {
        const used = JSON.stringify(sessionStorage).length;
        info.sessionStorage.used = used;
        info.sessionStorage.total = 5 * 1024 * 1024; // 假设5MB限制
      } catch (error) {
        this.logger.warn('无法获取sessionStorage使用情况:', error);
      }
    }

    return info;
  }
}

// 创建默认存储管理器实例
const storageManager = new StorageManager();

// 导出存储管理器
export { StorageManager, storageManager };
export default storageManager;
