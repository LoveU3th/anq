/**
 * PWA管理器
 * 负责Service Worker注册、PWA安装提示、离线状态管理等
 */

class PWAManager {
  constructor() {
    this.swRegistration = null;
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.installPromptShown = false;
    
    this.init();
  }

  /**
   * 初始化PWA管理器
   */
  async init() {
    try {
      // 注册Service Worker
      await this.registerServiceWorker();
      
      // 设置PWA安装提示
      this.setupInstallPrompt();
      
      // 监听网络状态变化
      this.setupNetworkListeners();
      
      // 设置推送通知
      this.setupPushNotifications();
      
      console.log('[PWA] PWA Manager initialized successfully');
    } catch (error) {
      console.error('[PWA] Failed to initialize PWA Manager:', error);
    }
  }

  /**
   * 注册Service Worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker not supported');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered:', this.swRegistration);

      // 监听Service Worker更新
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 有新版本可用
            this.showUpdateAvailable();
          }
        });
      });

      // 监听Service Worker消息
      navigator.serviceWorker.addEventListener('message', event => {
        this.handleServiceWorkerMessage(event.data);
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  /**
   * 设置PWA安装提示
   */
  setupInstallPrompt() {
    // 监听beforeinstallprompt事件
    window.addEventListener('beforeinstallprompt', event => {
      // 阻止默认的安装提示
      event.preventDefault();
      
      // 保存事件以便后续使用
      this.deferredPrompt = event;
      
      // 显示自定义安装按钮
      this.showInstallButton();
    });

    // 监听appinstalled事件
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.hideInstallButton();
      this.deferredPrompt = null;
      
      // 记录安装事件
      this.trackEvent('pwa_installed');
    });
  }

  /**
   * 显示安装按钮
   */
  showInstallButton() {
    if (this.installPromptShown) return;
    
    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-button';
    installButton.className = 'pwa-install-btn';
    installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      安装应用
    `;
    
    installButton.addEventListener('click', () => this.promptInstall());
    
    // 添加到页面
    document.body.appendChild(installButton);
    
    // 添加样式
    this.addInstallButtonStyles();
    
    this.installPromptShown = true;
  }

  /**
   * 隐藏安装按钮
   */
  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.remove();
    }
    this.installPromptShown = false;
  }

  /**
   * 提示用户安装PWA
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return;
    }

    try {
      // 显示安装提示
      this.deferredPrompt.prompt();
      
      // 等待用户响应
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('[PWA] Install prompt outcome:', outcome);
      
      // 记录用户选择
      this.trackEvent('pwa_install_prompt', { outcome });
      
      // 清理
      this.deferredPrompt = null;
      this.hideInstallButton();
      
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    }
  }

  /**
   * 设置网络状态监听
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNetworkStatus('online');
      console.log('[PWA] Network: Online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNetworkStatus('offline');
      console.log('[PWA] Network: Offline');
    });
  }

  /**
   * 显示网络状态
   */
  showNetworkStatus(status) {
    // 移除现有的网络状态提示
    const existingToast = document.querySelector('.network-status-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `network-status-toast ${status}`;
    toast.innerHTML = status === 'online' 
      ? '🟢 网络已连接' 
      : '🔴 网络已断开，正在使用离线模式';
    
    document.body.appendChild(toast);
    
    // 自动隐藏
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, status === 'online' ? 2000 : 5000);
  }

  /**
   * 设置推送通知
   */
  async setupPushNotifications() {
    if (!('Notification' in window) || !this.swRegistration) {
      console.warn('[PWA] Push notifications not supported');
      return;
    }

    try {
      // 检查通知权限
      let permission = Notification.permission;
      
      if (permission === 'default') {
        // 请求通知权限
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        console.log('[PWA] Notification permission granted');
        // 这里可以订阅推送服务
      } else {
        console.log('[PWA] Notification permission denied');
      }
      
    } catch (error) {
      console.error('[PWA] Failed to setup push notifications:', error);
    }
  }

  /**
   * 显示更新可用提示
   */
  showUpdateAvailable() {
    const updateToast = document.createElement('div');
    updateToast.className = 'update-available-toast';
    updateToast.innerHTML = `
      <div class="update-message">
        <span>🔄 新版本可用</span>
        <button onclick="window.pwaManager.applyUpdate()">更新</button>
        <button onclick="this.parentNode.parentNode.remove()">稍后</button>
      </div>
    `;
    
    document.body.appendChild(updateToast);
  }

  /**
   * 应用更新
   */
  async applyUpdate() {
    if (!this.swRegistration || !this.swRegistration.waiting) {
      return;
    }

    try {
      // 告诉等待中的Service Worker跳过等待
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // 刷新页面以应用更新
      window.location.reload();
      
    } catch (error) {
      console.error('[PWA] Failed to apply update:', error);
    }
  }

  /**
   * 处理Service Worker消息
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('[PWA] Cache updated:', data.payload);
        break;
      case 'OFFLINE_READY':
        console.log('[PWA] App ready for offline use');
        break;
      default:
        console.log('[PWA] Service Worker message:', data);
    }
  }

  /**
   * 添加安装按钮样式
   */
  addInstallButtonStyles() {
    if (document.getElementById('pwa-install-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'pwa-install-styles';
    styles.textContent = `
      .pwa-install-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }
      
      .pwa-install-btn:hover {
        background: #1d4ed8;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
      }
      
      .network-status-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1001;
        animation: slideDown 0.3s ease;
      }
      
      .network-status-toast.online {
        background: #10b981;
        color: white;
      }
      
      .network-status-toast.offline {
        background: #ef4444;
        color: white;
      }
      
      .update-available-toast {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1001;
      }
      
      .update-message {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .update-message button {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      .update-message button:first-of-type {
        background: #2563eb;
        color: white;
        border-color: #2563eb;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * 跟踪事件
   */
  trackEvent(eventName, data = {}) {
    // 这里可以集成分析服务
    console.log('[PWA] Event tracked:', eventName, data);
    
    // 发送到分析API
    if (window.dataManager) {
      window.dataManager.logUserAction(eventName, data);
    }
  }

  /**
   * 获取PWA状态
   */
  getStatus() {
    return {
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isOnline: this.isOnline,
      hasServiceWorker: !!this.swRegistration,
      canInstall: !!this.deferredPrompt
    };
  }
}

// 导出PWA管理器
export default PWAManager;
