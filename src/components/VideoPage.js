/**
 * 视频页面组件
 * 负责视频播放、进度追踪和用户交互
 */

import { Logger } from '../utils/logger.js';
import { VideoPlayer } from './VideoPlayer.js';

export default class VideoPage {
  constructor() {
    this.logger = new Logger('VideoPage');
    this.videoPlayer = null;
    this.videoData = null;
    this.currentVideoType = null;
  }

  /**
   * 渲染视频页面
   */
  static async render(data = {}) {
    const videoType = data.type || 'safety';
    const pageTitle = videoType === 'safety' ? '安全操作视频' : '违规操作视频';
    const pageDescription = videoType === 'safety' 
      ? '学习正确的安全操作规范，掌握标准作业流程'
      : '了解常见违规操作案例，提高安全意识';

    return `
      <div class="video-page">
        <!-- 页面头部 -->
        <div class="page-header">
          <div class="container">
            <div class="page-header-content">
              <button class="back-btn" onclick="history.back()">
                ← 返回
              </button>
              <div class="page-info">
                <h1 class="page-title">${pageTitle}</h1>
                <p class="page-description">${pageDescription}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频播放区域 -->
        <div class="video-section">
          <div class="container">
            <div class="video-container">
              <div id="video-player" class="video-player-wrapper">
                <!-- 视频播放器将在这里初始化 -->
                <div class="video-placeholder">
                  <div class="video-loading">
                    <div class="loading-spinner"></div>
                    <p>正在加载视频...</p>
                  </div>
                </div>
              </div>
              
              <!-- 视频信息 -->
              <div class="video-info">
                <div class="video-meta">
                  <span class="video-duration" id="video-duration">--:--</span>
                  <span class="video-progress" id="video-progress">0%</span>
                </div>
                <div class="video-controls-extra">
                  <button class="btn btn-outline btn-sm" id="replay-btn" disabled>
                    🔄 重播
                  </button>
                  <button class="btn btn-outline btn-sm" id="fullscreen-btn">
                    📺 全屏
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频描述和学习要点 -->
        <div class="video-content">
          <div class="container">
            <div class="content-grid">
              <div class="video-description">
                <h2>视频内容</h2>
                <div id="video-description-content">
                  <p>正在加载视频信息...</p>
                </div>
              </div>
              
              <div class="learning-points">
                <h3>学习要点</h3>
                <div id="learning-points-content">
                  <ul>
                    <li>观看完整视频内容</li>
                    <li>理解关键操作步骤</li>
                    <li>记住安全注意事项</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 相关推荐 -->
        <div class="related-content">
          <div class="container">
            <h3>相关内容</h3>
            <div class="related-grid" id="related-videos">
              <!-- 相关视频将动态加载 -->
            </div>
          </div>
        </div>

        <!-- 学习完成操作 -->
        <div class="completion-section">
          <div class="container">
            <div class="completion-card">
              <h3>完成学习</h3>
              <p>观看完视频后，您可以进行相关测试来检验学习效果</p>
              <div class="completion-actions">
                <button class="btn btn-primary" id="take-quiz-btn" disabled>
                  开始测试
                </button>
                <button class="btn btn-secondary" id="mark-complete-btn" disabled>
                  标记完成
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 组件挂载后的初始化
   */
  static async mounted() {
    const instance = new VideoPage();
    await instance.init();
  }

  /**
   * 初始化视频页面
   */
  async init() {
    try {
      this.logger.info('初始化视频页面');
      
      // 获取当前路径确定视频类型
      this.currentVideoType = this.getVideoTypeFromPath();
      
      // 加载视频数据
      await this.loadVideoData();
      
      // 初始化视频播放器
      await this.initVideoPlayer();
      
      // 绑定事件监听器
      this.bindEventListeners();
      
      // 加载相关内容
      await this.loadRelatedContent();
      
      this.logger.info('视频页面初始化完成');
    } catch (error) {
      this.logger.error('视频页面初始化失败:', error);
      this.showError('视频加载失败，请刷新页面重试');
    }
  }

  /**
   * 从路径获取视频类型
   */
  getVideoTypeFromPath() {
    const path = window.location.pathname;
    if (path.includes('/video/safety')) {
      return 'safety';
    } else if (path.includes('/video/violation')) {
      return 'violation';
    }
    return 'safety'; // 默认
  }

  /**
   * 加载视频数据
   */
  async loadVideoData() {
    try {
      // 这里应该从API获取视频数据
      // 暂时使用模拟数据
      this.videoData = this.getMockVideoData();
      
      // 更新页面内容
      this.updateVideoDescription();
      this.updateLearningPoints();
      
    } catch (error) {
      this.logger.error('加载视频数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取模拟视频数据
   */
  getMockVideoData() {
    const videoData = {
      safety: {
        id: 'safety_001',
        title: '安全操作规范演示',
        description: '本视频详细演示了工作场所的标准安全操作流程，包括个人防护装备的正确佩戴、设备操作规范、应急处理程序等关键内容。',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 596,
        learningPoints: [
          '正确佩戴个人防护装备',
          '遵循标准操作流程',
          '识别潜在安全隐患',
          '掌握应急处理方法'
        ]
      },
      violation: {
        id: 'violation_001',
        title: '常见违规操作案例',
        description: '通过真实案例展示工作中常见的违规操作行为及其潜在危险，帮助员工识别和避免类似错误。',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: 653,
        learningPoints: [
          '识别违规操作行为',
          '了解违规操作后果',
          '学习正确操作方法',
          '提高安全意识'
        ]
      }
    };

    return videoData[this.currentVideoType] || videoData.safety;
  }

  /**
   * 初始化视频播放器
   */
  async initVideoPlayer() {
    const playerContainer = document.getElementById('video-player');
    if (!playerContainer) {
      throw new Error('视频播放器容器未找到');
    }

    // 创建视频播放器实例
    this.videoPlayer = new VideoPlayer(playerContainer, {
      src: this.videoData.url,
      poster: '', // 可以添加视频封面
      controls: true,
      autoplay: false,
      preload: 'metadata'
    });

    // 监听播放器事件
    this.videoPlayer.on('loadedmetadata', () => {
      this.updateVideoDuration();
    });

    this.videoPlayer.on('timeupdate', () => {
      this.updateVideoProgress();
    });

    this.videoPlayer.on('ended', () => {
      this.onVideoCompleted();
    });

    // 初始化播放器
    await this.videoPlayer.init();
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 重播按钮
    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        this.videoPlayer.replay();
      });
    }

    // 全屏按钮
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.videoPlayer.toggleFullscreen();
      });
    }

    // 开始测试按钮
    const takeQuizBtn = document.getElementById('take-quiz-btn');
    if (takeQuizBtn) {
      takeQuizBtn.addEventListener('click', () => {
        this.navigateToQuiz();
      });
    }

    // 标记完成按钮
    const markCompleteBtn = document.getElementById('mark-complete-btn');
    if (markCompleteBtn) {
      markCompleteBtn.addEventListener('click', () => {
        this.markAsCompleted();
      });
    }
  }

  /**
   * 更新视频描述
   */
  updateVideoDescription() {
    const descriptionElement = document.getElementById('video-description-content');
    if (descriptionElement && this.videoData) {
      descriptionElement.innerHTML = `<p>${this.videoData.description}</p>`;
    }
  }

  /**
   * 更新学习要点
   */
  updateLearningPoints() {
    const pointsElement = document.getElementById('learning-points-content');
    if (pointsElement && this.videoData) {
      const pointsHtml = this.videoData.learningPoints
        .map(point => `<li>${point}</li>`)
        .join('');
      pointsElement.innerHTML = `<ul>${pointsHtml}</ul>`;
    }
  }

  /**
   * 更新视频时长显示
   */
  updateVideoDuration() {
    const durationElement = document.getElementById('video-duration');
    if (durationElement && this.videoPlayer) {
      const duration = this.videoPlayer.getDuration();
      durationElement.textContent = this.formatTime(duration);
    }
  }

  /**
   * 更新视频进度显示
   */
  updateVideoProgress() {
    const progressElement = document.getElementById('video-progress');
    if (progressElement && this.videoPlayer) {
      const progress = this.videoPlayer.getProgress();
      progressElement.textContent = `${Math.round(progress)}%`;
    }
  }

  /**
   * 视频播放完成处理
   */
  onVideoCompleted() {
    this.logger.info('视频播放完成');
    
    // 启用操作按钮
    const replayBtn = document.getElementById('replay-btn');
    const takeQuizBtn = document.getElementById('take-quiz-btn');
    const markCompleteBtn = document.getElementById('mark-complete-btn');
    
    if (replayBtn) replayBtn.disabled = false;
    if (takeQuizBtn) takeQuizBtn.disabled = false;
    if (markCompleteBtn) markCompleteBtn.disabled = false;

    // 记录完成状态
    this.recordVideoCompletion();
  }

  /**
   * 加载相关内容
   */
  async loadRelatedContent() {
    // 这里可以加载相关视频推荐
    const relatedContainer = document.getElementById('related-videos');
    if (relatedContainer) {
      relatedContainer.innerHTML = `
        <div class="related-item">
          <div class="related-thumbnail">🎥</div>
          <div class="related-info">
            <h4>相关视频即将推出</h4>
            <p>更多安全培训内容正在制作中</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * 导航到测试页面
   */
  navigateToQuiz() {
    const quizPath = `/quiz/${this.currentVideoType}`;
    window.history.pushState({}, '', quizPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  /**
   * 标记为已完成
   */
  markAsCompleted() {
    this.logger.info('标记视频为已完成');
    // 这里可以保存到本地存储或发送到服务器
    localStorage.setItem(`video_${this.videoData.id}_completed`, 'true');
    
    // 显示完成提示
    this.showSuccess('视频学习已完成！');
  }

  /**
   * 记录视频完成状态
   */
  recordVideoCompletion() {
    const completionData = {
      videoId: this.videoData.id,
      completedAt: new Date().toISOString(),
      duration: this.videoPlayer.getDuration(),
      watchTime: this.videoPlayer.getCurrentTime()
    };
    
    // 保存到本地存储
    localStorage.setItem(`video_${this.videoData.id}_completion`, JSON.stringify(completionData));
  }

  /**
   * 格式化时间显示
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    // 简单的错误显示，后续可以改进
    alert(`错误: ${message}`);
  }

  /**
   * 显示成功信息
   */
  showSuccess(message) {
    // 简单的成功显示，后续可以改进
    alert(`成功: ${message}`);
  }
}
