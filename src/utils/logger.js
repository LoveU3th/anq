/**
 * 日志工具类
 * 提供统一的日志记录功能
 */

export class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.isDevelopment = this.getEnvironment() === 'development';
  }

  /**
   * 获取当前环境
   */
  getEnvironment() {
    return import.meta.env?.MODE || 'production';
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    return [prefix, message, ...args];
  }

  /**
   * 信息日志
   */
  info(message, ...args) {
    if (this.isDevelopment) {
      console.log(...this.formatMessage('info', message, ...args));
    }
  }

  /**
   * 警告日志
   */
  warn(message, ...args) {
    console.warn(...this.formatMessage('warn', message, ...args));
  }

  /**
   * 错误日志
   */
  error(message, ...args) {
    console.error(...this.formatMessage('error', message, ...args));
    
    // 在生产环境中可以发送错误到监控服务
    if (!this.isDevelopment) {
      this.sendErrorToService(message, args);
    }
  }

  /**
   * 调试日志
   */
  debug(message, ...args) {
    if (this.isDevelopment) {
      console.debug(...this.formatMessage('debug', message, ...args));
    }
  }

  /**
   * 发送错误到监控服务
   */
  async sendErrorToService(message, args) {
    try {
      // 这里可以实现发送错误到监控服务的逻辑
      // 例如发送到 Sentry、LogRocket 等
      const errorData = {
        message,
        args,
        context: this.context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // 暂时只在控制台输出，后续可以实现实际的错误上报
      console.log('Error to be sent to monitoring service:', errorData);
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }
}
