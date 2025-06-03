/**
 * API通信工具模块
 * 提供统一的API请求接口和错误处理
 */

import { Logger } from './logger.js';

class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.logger = new Logger('APIClient');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * 添加请求拦截器
   * @param {Function} interceptor - 拦截器函数
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   * @param {Function} interceptor - 拦截器函数
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 执行请求拦截器
   * @param {Object} config - 请求配置
   * @returns {Object} - 处理后的配置
   */
  async executeRequestInterceptors(config) {
    let processedConfig = { ...config };
    
    for (const interceptor of this.requestInterceptors) {
      try {
        processedConfig = await interceptor(processedConfig);
      } catch (error) {
        this.logger.warn('请求拦截器执行失败:', error);
      }
    }
    
    return processedConfig;
  }

  /**
   * 执行响应拦截器
   * @param {Response} response - 响应对象
   * @returns {Response} - 处理后的响应
   */
  async executeResponseInterceptors(response) {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      try {
        processedResponse = await interceptor(processedResponse);
      } catch (error) {
        this.logger.warn('响应拦截器执行失败:', error);
      }
    }
    
    return processedResponse;
  }

  /**
   * 构建完整的URL
   * @param {string} endpoint - API端点
   * @returns {string} - 完整URL
   */
  buildURL(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBaseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    return `${cleanBaseURL}/${cleanEndpoint}`;
  }

  /**
   * 发送HTTP请求
   * @param {string} method - HTTP方法
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} - 响应数据
   */
  async request(method, endpoint, options = {}) {
    const startTime = performance.now();
    
    try {
      // 构建请求配置
      let config = {
        method: method.toUpperCase(),
        headers: { ...this.defaultHeaders, ...options.headers },
        ...options
      };

      // 处理请求体
      if (config.data && method.toUpperCase() !== 'GET') {
        if (typeof config.data === 'object') {
          config.body = JSON.stringify(config.data);
        } else {
          config.body = config.data;
        }
        delete config.data;
      }

      // 执行请求拦截器
      config = await this.executeRequestInterceptors(config);

      // 构建URL
      const url = this.buildURL(endpoint);
      
      this.logger.debug(`发送${method.toUpperCase()}请求:`, url);

      // 发送请求
      let response = await fetch(url, config);

      // 执行响应拦截器
      response = await this.executeResponseInterceptors(response);

      // 记录请求时间
      const duration = performance.now() - startTime;
      this.logger.debug(`请求完成，耗时: ${duration.toFixed(2)}ms`);

      // 处理响应
      return await this.handleResponse(response);

    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(`请求失败，耗时: ${duration.toFixed(2)}ms`, error);
      throw this.handleError(error);
    }
  }

  /**
   * 处理响应
   * @param {Response} response - Fetch响应对象
   * @returns {Promise<Object>} - 解析后的数据
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorData;
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }
      } catch (parseError) {
        errorData = { message: `HTTP ${response.status} ${response.statusText}` };
      }
      
      throw new APIError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    // 解析响应数据
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @returns {Error} - 标准化的错误对象
   */
  handleError(error) {
    if (error instanceof APIError) {
      return error;
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new APIError('网络连接失败，请检查网络设置', 0, { originalError: error });
    }

    if (error.name === 'AbortError') {
      return new APIError('请求已取消', 0, { originalError: error });
    }

    return new APIError(error.message || '未知错误', 0, { originalError: error });
  }

  // HTTP方法快捷方式
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, { ...options, data });
  }

  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, { ...options, data });
  }

  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, { ...options, data });
  }
}

/**
 * API错误类
 */
class APIError extends Error {
  constructor(message, status = 0, data = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }

  /**
   * 检查是否为网络错误
   */
  isNetworkError() {
    return this.status === 0;
  }

  /**
   * 检查是否为客户端错误
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * 检查是否为服务器错误
   */
  isServerError() {
    return this.status >= 500;
  }
}

// 创建默认API客户端实例
const apiClient = new APIClient();

// 导出API客户端和错误类
export { APIClient, APIError, apiClient };
export default apiClient;
