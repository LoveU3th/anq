/**
 * 性能监控工具
 * 监控Core Web Vitals和其他性能指标
 */

import { Logger } from './logger.js';

export class PerformanceMonitor {
  static logger = new Logger('PerformanceMonitor');
  static isInitialized = false;

  /**
   * 初始化性能监控
   */
  static async init() {
    if (this.isInitialized) return;

    try {
      // 监控Core Web Vitals
      await this.initWebVitals();
      
      // 监控页面加载性能
      this.initPageLoadMetrics();
      
      // 监控资源加载性能
      this.initResourceMetrics();
      
      this.isInitialized = true;
      this.logger.info('性能监控初始化完成');
    } catch (error) {
      this.logger.error('性能监控初始化失败:', error);
    }
  }

  /**
   * 初始化Web Vitals监控
   */
  static async initWebVitals() {
    try {
      // 动态导入web-vitals库
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      
      // 监控各项指标
      getCLS(this.sendMetric.bind(this));
      getFID(this.sendMetric.bind(this));
      getFCP(this.sendMetric.bind(this));
      getLCP(this.sendMetric.bind(this));
      getTTFB(this.sendMetric.bind(this));
      
      this.logger.info('Web Vitals监控已启动');
    } catch (error) {
      this.logger.warn('Web Vitals库加载失败，使用备用方案:', error);
      this.initFallbackMetrics();
    }
  }

  /**
   * 备用性能指标监控
   */
  static initFallbackMetrics() {
    // 监控页面加载时间
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.sendMetric({
        name: 'page_load_time',
        value: loadTime,
        id: this.generateId()
      });
    });

    // 监控首次内容绘制
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.sendMetric({
                name: 'FCP',
                value: entry.startTime,
                id: this.generateId()
              });
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        this.logger.warn('PerformanceObserver不支持:', error);
      }
    }
  }

  /**
   * 初始化页面加载指标
   */
  static initPageLoadMetrics() {
    window.addEventListener('load', () => {
      // 获取导航时间
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const metrics = {
          dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp_connect: navigation.connectEnd - navigation.connectStart,
          request_response: navigation.responseEnd - navigation.requestStart,
          dom_parse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
          resource_load: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
        };

        Object.entries(metrics).forEach(([name, value]) => {
          this.sendMetric({
            name,
            value,
            id: this.generateId()
          });
        });
      }
    });
  }

  /**
   * 初始化资源加载指标
   */
  static initResourceMetrics() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // 监控大型资源加载时间
            if (entry.transferSize > 100000) { // 大于100KB的资源
              this.sendMetric({
                name: 'large_resource_load',
                value: entry.duration,
                id: this.generateId(),
                resource: entry.name
              });
            }
          }
        });
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        this.logger.warn('资源性能监控初始化失败:', error);
      }
    }
  }

  /**
   * 发送性能指标
   */
  static sendMetric(metric) {
    // 记录到控制台（开发环境）
    this.logger.info(`性能指标 ${metric.name}:`, metric.value);

    // 发送到分析服务
    this.sendToAnalytics(metric);
  }

  /**
   * 发送到分析服务
   */
  static async sendToAnalytics(metric) {
    try {
      // 这里可以发送到实际的分析服务
      // 例如 Google Analytics、自定义分析服务等
      
      const data = {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // 使用sendBeacon API发送数据（如果支持）
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon('/api/v1/analytics/performance', blob);
      } else {
        // 备用方案：使用fetch
        fetch('/api/v1/analytics/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }).catch(error => {
          this.logger.warn('性能数据发送失败:', error);
        });
      }
    } catch (error) {
      this.logger.warn('发送性能数据时出错:', error);
    }
  }

  /**
   * 生成唯一ID
   */
  static generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 手动记录性能指标
   */
  static recordMetric(name, value, additionalData = {}) {
    this.sendMetric({
      name,
      value,
      id: this.generateId(),
      ...additionalData
    });
  }

  /**
   * 开始性能计时
   */
  static startTiming(name) {
    performance.mark(`${name}-start`);
  }

  /**
   * 结束性能计时
   */
  static endTiming(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      this.sendMetric({
        name,
        value: measure.duration,
        id: this.generateId()
      });
    }
  }
}
