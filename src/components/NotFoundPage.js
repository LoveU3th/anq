import { Logger } from '../utils/logger.js';

/**
 * 404页面组件
 */
export default class NotFoundPage {
  constructor() {
    this.logger = new Logger('NotFoundPage');
  }

  /**
   * 渲染404页面内容
   */
  static async render(data = {}) {
    return `
      <div class="not-found-page">
        <div class="not-found-content">
          <div class="not-found-icon">
            <span style="font-size: 120px;">🔍</span>
          </div>
          
          <h1 class="not-found-title">页面未找到</h1>
          <p class="not-found-description">
            抱歉，您访问的页面不存在或已被移动。
          </p>
          
          <div class="not-found-actions">
            <a href="/" class="btn btn-primary">返回首页</a>
            <button onclick="history.back()" class="btn btn-secondary">返回上页</button>
          </div>
          
          <div class="not-found-suggestions">
            <h3>您可以尝试：</h3>
            <ul>
              <li><a href="/video/safety">观看安全操作视频</a></li>
              <li><a href="/quiz/safety">参加安全意识测试</a></li>
              <li><a href="/video/violation">查看违规案例</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <style>
        .not-found-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          padding: 2rem;
          text-align: center;
        }
        
        .not-found-content {
          max-width: 500px;
        }
        
        .not-found-icon {
          margin-bottom: 2rem;
        }
        
        .not-found-title {
          font-size: 2.5rem;
          color: #1f2937;
          margin-bottom: 1rem;
        }
        
        .not-found-description {
          font-size: 1.1rem;
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .not-found-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        
        .not-found-suggestions {
          text-align: left;
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .not-found-suggestions h3 {
          margin-bottom: 1rem;
          color: #374151;
        }
        
        .not-found-suggestions ul {
          list-style: none;
          padding: 0;
        }
        
        .not-found-suggestions li {
          margin-bottom: 0.5rem;
        }
        
        .not-found-suggestions a {
          color: #2563eb;
          text-decoration: none;
        }
        
        .not-found-suggestions a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 640px) {
          .not-found-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .not-found-title {
            font-size: 2rem;
          }
        }
      </style>
    `;
  }

  /**
   * 组件挂载后的初始化
   */
  static async mounted() {
    const instance = new NotFoundPage();
    await instance.init();
  }

  /**
   * 初始化404页面
   */
  async init() {
    try {
      this.logger.info('初始化404页面');
      
      // 记录404事件用于分析
      this.trackNotFoundEvent();
      
      this.logger.info('404页面初始化完成');
    } catch (error) {
      this.logger.error('404页面初始化失败:', error);
    }
  }

  /**
   * 记录404事件
   */
  trackNotFoundEvent() {
    try {
      const currentPath = window.location.pathname;
      const referrer = document.referrer;
      
      // 这里可以发送到分析服务
      this.logger.info('404事件记录:', {
        path: currentPath,
        referrer: referrer,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.warn('404事件记录失败:', error);
    }
  }
}
