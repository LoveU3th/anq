/**
 * 视频播放器组件
 * 提供现代化的视频播放功能和控制
 */

import { Logger } from '../utils/logger.js';

export class VideoPlayer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      controls: true,
      autoplay: false,
      preload: 'metadata',
      volume: 0.8,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      ...options
    };
    
    this.logger = new Logger('VideoPlayer');
    this.video = null;
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  /**
   * 初始化视频播放器
   */
  async init() {
    try {
      this.logger.info('初始化视频播放器');
      
      // 创建视频元素
      this.createVideoElement();
      
      // 设置视频属性
      this.setupVideoAttributes();
      
      // 创建自定义控制栏
      this.createCustomControls();
      
      // 绑定事件监听器
      this.bindEvents();
      
      // 插入到容器中
      this.container.innerHTML = '';
      this.container.appendChild(this.video);
      
      this.isInitialized = true;
      this.logger.info('视频播放器初始化完成');
      
    } catch (error) {
      this.logger.error('视频播放器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建视频元素
   */
  createVideoElement() {
    this.video = document.createElement('video');
    this.video.className = 'video-element';
    
    // 设置基本样式
    this.video.style.width = '100%';
    this.video.style.height = 'auto';
    this.video.style.backgroundColor = '#000';
    this.video.style.borderRadius = '8px';
  }

  /**
   * 设置视频属性
   */
  setupVideoAttributes() {
    if (this.options.src) {
      this.video.src = this.options.src;
    }
    
    if (this.options.poster) {
      this.video.poster = this.options.poster;
    }
    
    this.video.controls = this.options.controls;
    this.video.autoplay = this.options.autoplay;
    this.video.preload = this.options.preload;
    this.video.volume = this.options.volume;
    
    // 添加其他属性
    this.video.setAttribute('playsinline', ''); // iOS支持
    this.video.setAttribute('webkit-playsinline', ''); // 旧版iOS支持
  }

  /**
   * 创建自定义控制栏
   */
  createCustomControls() {
    // 如果启用了自定义控制栏
    if (this.options.customControls) {
      this.video.controls = false;
      this.createControlsOverlay();
    }
  }

  /**
   * 创建控制栏覆盖层
   */
  createControlsOverlay() {
    const controlsOverlay = document.createElement('div');
    controlsOverlay.className = 'video-controls-overlay';
    controlsOverlay.innerHTML = `
      <div class="video-controls">
        <button class="control-btn play-pause-btn">
          <span class="play-icon">▶</span>
          <span class="pause-icon" style="display: none;">⏸</span>
        </button>
        
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-filled"></div>
            <div class="progress-handle"></div>
          </div>
          <div class="time-display">
            <span class="current-time">0:00</span>
            <span class="duration">0:00</span>
          </div>
        </div>
        
        <div class="volume-container">
          <button class="control-btn volume-btn">🔊</button>
          <div class="volume-slider">
            <input type="range" min="0" max="1" step="0.1" value="${this.options.volume}">
          </div>
        </div>
        
        <button class="control-btn fullscreen-btn">⛶</button>
      </div>
    `;
    
    // 添加样式
    this.addControlsStyles(controlsOverlay);
    
    // 将控制栏添加到容器
    this.container.appendChild(controlsOverlay);
  }

  /**
   * 添加控制栏样式
   */
  addControlsStyles(controlsOverlay) {
    const style = document.createElement('style');
    style.textContent = `
      .video-controls-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
        padding: 20px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .video-controls-overlay:hover,
      .video-controls-overlay.show {
        opacity: 1;
      }
      
      .video-controls {
        display: flex;
        align-items: center;
        gap: 15px;
        color: white;
      }
      
      .control-btn {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 5px;
        border-radius: 3px;
        transition: background-color 0.2s;
      }
      
      .control-btn:hover {
        background-color: rgba(255,255,255,0.2);
      }
      
      .progress-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .progress-bar {
        flex: 1;
        height: 6px;
        background: rgba(255,255,255,0.3);
        border-radius: 3px;
        position: relative;
        cursor: pointer;
      }
      
      .progress-filled {
        height: 100%;
        background: #ff6b6b;
        border-radius: 3px;
        width: 0%;
        transition: width 0.1s;
      }
      
      .time-display {
        font-size: 14px;
        min-width: 80px;
      }
      
      .volume-container {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .volume-slider {
        width: 60px;
      }
      
      .volume-slider input {
        width: 100%;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 视频事件
    this.video.addEventListener('loadedmetadata', () => {
      this.emit('loadedmetadata');
    });

    this.video.addEventListener('timeupdate', () => {
      this.emit('timeupdate');
    });

    this.video.addEventListener('ended', () => {
      this.emit('ended');
    });

    this.video.addEventListener('play', () => {
      this.emit('play');
    });

    this.video.addEventListener('pause', () => {
      this.emit('pause');
    });

    this.video.addEventListener('error', (e) => {
      this.logger.error('视频播放错误:', e);
      this.emit('error', e);
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
      if (this.isVideoFocused()) {
        this.handleKeyboardControls(e);
      }
    });
  }

  /**
   * 处理键盘控制
   */
  handleKeyboardControls(event) {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.seek(this.getCurrentTime() - 10);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.seek(this.getCurrentTime() + 10);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.setVolume(Math.min(1, this.getVolume() + 0.1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.setVolume(Math.max(0, this.getVolume() - 0.1));
        break;
      case 'KeyF':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      case 'KeyM':
        event.preventDefault();
        this.toggleMute();
        break;
    }
  }

  /**
   * 检查视频是否获得焦点
   */
  isVideoFocused() {
    return document.activeElement === this.video || 
           this.container.contains(document.activeElement);
  }

  /**
   * 播放/暂停切换
   */
  togglePlay() {
    if (this.video.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  /**
   * 播放视频
   */
  async play() {
    try {
      await this.video.play();
      this.logger.info('视频开始播放');
    } catch (error) {
      this.logger.error('视频播放失败:', error);
      throw error;
    }
  }

  /**
   * 暂停视频
   */
  pause() {
    this.video.pause();
    this.logger.info('视频已暂停');
  }

  /**
   * 重播视频
   */
  replay() {
    this.video.currentTime = 0;
    this.play();
  }

  /**
   * 跳转到指定时间
   */
  seek(time) {
    this.video.currentTime = Math.max(0, Math.min(time, this.getDuration()));
  }

  /**
   * 设置音量
   */
  setVolume(volume) {
    this.video.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 获取音量
   */
  getVolume() {
    return this.video.volume;
  }

  /**
   * 静音/取消静音
   */
  toggleMute() {
    this.video.muted = !this.video.muted;
  }

  /**
   * 全屏切换
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  /**
   * 进入全屏
   */
  async enterFullscreen() {
    try {
      if (this.video.requestFullscreen) {
        await this.video.requestFullscreen();
      } else if (this.video.webkitRequestFullscreen) {
        await this.video.webkitRequestFullscreen();
      } else if (this.video.msRequestFullscreen) {
        await this.video.msRequestFullscreen();
      }
    } catch (error) {
      this.logger.warn('全屏模式不支持:', error);
    }
  }

  /**
   * 退出全屏
   */
  async exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      this.logger.warn('退出全屏失败:', error);
    }
  }

  /**
   * 获取当前播放时间
   */
  getCurrentTime() {
    return this.video.currentTime;
  }

  /**
   * 获取视频总时长
   */
  getDuration() {
    return this.video.duration || 0;
  }

  /**
   * 获取播放进度百分比
   */
  getProgress() {
    const duration = this.getDuration();
    if (duration === 0) return 0;
    return (this.getCurrentTime() / duration) * 100;
  }

  /**
   * 检查是否已播放完成
   */
  isEnded() {
    return this.video.ended;
  }

  /**
   * 检查是否正在播放
   */
  isPlaying() {
    return !this.video.paused && !this.video.ended && this.video.readyState > 2;
  }

  /**
   * 事件监听器管理
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.error(`事件回调执行失败 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 销毁播放器
   */
  destroy() {
    if (this.video) {
      this.video.pause();
      this.video.src = '';
      this.video.load();
    }
    
    this.eventListeners.clear();
    this.isInitialized = false;
    
    this.logger.info('视频播放器已销毁');
  }
}
