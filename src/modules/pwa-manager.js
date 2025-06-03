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
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.warn('[PWA] Push notifications not supported');
      return;
    }

    // 检查当前权限状态
    if (Notification.permission === 'granted') {
      await this.subscribeToPush();
    } else if (Notification.permission !== 'denied') {
      // 延迟显示通知权限请求，避免打扰用户
      setTimeout(() => {
        this.showNotificationPrompt();
      }, 30000); // 30秒后显示
    }
  }

  /**
   * 显示通知权限请求提示
   */
  showNotificationPrompt() {
    // 检查是否最近被拒绝过
    const lastDismissed = localStorage.getItem('notification-prompt-dismissed');
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
      return; // 24小时内不再显示
    }

    const promptContainer = document.createElement('div');
    promptContainer.className = 'notification-prompt';
    promptContainer.innerHTML = `
      <div class="notification-prompt-content">
        <div class="notification-prompt-icon">🔔</div>
        <div class="notification-prompt-text">
          <h3>开启学习提醒</h3>
          <p>允许我们发送学习提醒和成绩通知，帮助您保持学习进度</p>
        </div>
        <div class="notification-prompt-actions">
          <button class="btn btn-primary" id="enable-notifications">开启通知</button>
          <button class="btn btn-secondary" id="dismiss-notifications">稍后再说</button>
        </div>
      </div>
    `;

    // 添加样式
    this.addNotificationPromptStyles();
    document.body.appendChild(promptContainer);

    // 绑定事件
    document.getElementById('enable-notifications').addEventListener('click', async () => {
      await this.requestNotificationPermission();
      promptContainer.remove();
    });

    document.getElementById('dismiss-notifications').addEventListener('click', () => {
      promptContainer.remove();
      // 记录用户拒绝，一段时间内不再显示
      localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
    });

    // 10秒后自动隐藏
    setTimeout(() => {
      if (document.body.contains(promptContainer)) {
        promptContainer.remove();
      }
    }, 10000);
  }

  /**
   * 请求通知权限
   */
  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('[PWA] Notification permission granted');
        await this.subscribeToPush();
        this.showToast('🎉 通知已开启！我们会在适当的时候提醒您学习', 'success');

        // 发送欢迎通知
        this.sendWelcomeNotification();
      } else {
        console.log('[PWA] Notification permission denied');
        this.showToast('您可以稍后在浏览器设置中开启通知权限', 'info');
      }
    } catch (error) {
      console.error('[PWA] Failed to request notification permission:', error);
    }
  }

  /**
   * 订阅推送服务
   */
  async subscribeToPush() {
    if (!this.swRegistration) {
      console.warn('[PWA] Service Worker not registered');
      return;
    }

    try {
      // 检查是否已经订阅
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[PWA] Already subscribed to push notifications');
        return existingSubscription;
      }

      // 创建新的订阅（这里需要VAPID密钥，暂时跳过实际订阅）
      console.log('[PWA] Push subscription setup ready');

      // 设置学习提醒
      this.setupLearningReminders();

    } catch (error) {
      console.error('[PWA] Failed to subscribe to push notifications:', error);
    }
  }

  /**
   * 设置学习提醒
   */
  setupLearningReminders() {
    // 设置每日学习提醒
    this.scheduleDailyReminder();

    // 设置成绩通知
    this.setupScoreNotifications();
  }

  /**
   * 安排每日学习提醒
   */
  scheduleDailyReminder() {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0); // 每天上午9点

    // 如果今天的提醒时间已过，设置为明天
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(() => {
      this.sendLearningReminder();
      // 设置每24小时重复
      setInterval(() => {
        this.sendLearningReminder();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilReminder);
  }

  /**
   * 发送学习提醒
   */
  sendLearningReminder() {
    if (Notification.permission === 'granted') {
      new Notification('📚 学习时间到了！', {
        body: '坚持每日学习，提升安全意识。今天您准备好学习了吗？',
        icon: '/src/assets/images/icons/pwa/icon-192x192.png',
        tag: 'daily-reminder',
        actions: [
          { action: 'start-learning', title: '开始学习' },
          { action: 'remind-later', title: '稍后提醒' }
        ]
      });
    }
  }

  /**
   * 设置成绩通知
   */
  setupScoreNotifications() {
    // 监听测试完成事件
    window.addEventListener('quiz-completed', (event) => {
      const { score, totalQuestions, passed } = event.detail;
      this.sendScoreNotification(score, totalQuestions, passed);
    });
  }

  /**
   * 发送成绩通知
   */
  sendScoreNotification(score, totalQuestions, passed) {
    if (Notification.permission === 'granted') {
      const percentage = Math.round((score / totalQuestions) * 100);
      const title = passed ? '🎉 测试通过！' : '📝 继续努力！';
      const body = passed
        ? `恭喜您获得 ${percentage}% 的好成绩！继续保持优秀表现。`
        : `您获得了 ${percentage}% 的成绩，建议复习相关内容后重新测试。`;

      new Notification(title, {
        body,
        icon: '/src/assets/images/icons/pwa/icon-192x192.png',
        tag: 'score-notification',
        actions: [
          { action: 'view-results', title: '查看详情' },
          { action: 'retry-quiz', title: '重新测试' }
        ]
      });
    }
  }

  /**
   * 发送欢迎通知
   */
  sendWelcomeNotification() {
    if (Notification.permission === 'granted') {
      new Notification('欢迎使用安全学习平台！', {
        body: '您已成功开启学习提醒，我们会帮助您保持学习进度',
        icon: '/src/assets/images/icons/pwa/icon-192x192.png',
        tag: 'welcome-notification'
      });
    }
  }

  /**
   * 显示Toast消息
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 添加Toast样式（如果还没有）
    this.addToastStyles();

    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => toast.classList.add('show'), 100);

    // 自动隐藏
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
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
   * 添加通知提示样式
   */
  addNotificationPromptStyles() {
    if (document.getElementById('notification-prompt-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'notification-prompt-styles';
    styles.textContent = `
      .notification-prompt {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        padding: 20px;
        max-width: 350px;
        z-index: 10000;
        border: 1px solid #e2e8f0;
        animation: slideInUp 0.3s ease-out;
      }

      @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .notification-prompt-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .notification-prompt-icon {
        font-size: 32px;
        text-align: center;
      }

      .notification-prompt-text h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .notification-prompt-text p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
        line-height: 1.5;
      }

      .notification-prompt-actions {
        display: flex;
        gap: 12px;
      }

      .notification-prompt .btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .notification-prompt .btn-primary {
        background: #2563eb;
        color: white;
      }

      .notification-prompt .btn-primary:hover {
        background: #1d4ed8;
      }

      .notification-prompt .btn-secondary {
        background: #f1f5f9;
        color: #64748b;
      }

      .notification-prompt .btn-secondary:hover {
        background: #e2e8f0;
      }

      @media (max-width: 480px) {
        .notification-prompt {
          bottom: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * 添加Toast样式
   */
  addToastStyles() {
    if (document.getElementById('toast-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
      }

      .toast.show {
        transform: translateX(0);
      }

      .toast-success {
        background: #10b981;
        color: white;
      }

      .toast-info {
        background: #3b82f6;
        color: white;
      }

      .toast-warning {
        background: #f59e0b;
        color: white;
      }

      .toast-error {
        background: #ef4444;
        color: white;
      }

      @media (max-width: 480px) {
        .toast {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(styles);
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
