/**
 * Service Worker for ANQ Platform
 * 提供离线支持、缓存管理和推送通知功能
 */

const CACHE_VERSION = '1.1.0';
const CACHE_NAME = `anq-platform-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `anq-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `anq-dynamic-v${CACHE_VERSION}`;
const OFFLINE_CACHE_NAME = `anq-offline-v${CACHE_VERSION}`;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/styles/main.css',
  '/src/modules/app.js',
  '/src/modules/router.js',
  '/src/modules/data-manager.js',
  '/src/modules/pwa-manager.js',
  '/src/components/HomePage.js',
  '/src/components/VideoPage.js',
  '/src/components/VideoPlayer.js',
  '/src/components/QuizPage.js',
  '/src/components/QuizEngine.js',
  '/src/components/AdminPage.js',
  '/src/components/ChartComponent.js',
  '/src/utils/api.js',
  '/src/utils/storage.js',
  '/src/utils/validation.js',
  '/src/utils/logger.js',
  '/src/utils/performance.js'
];

// 离线页面内容
const OFFLINE_PAGE_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>离线模式 - 安全学习平台</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .offline-container { max-width: 600px; margin: 50px auto; text-align: center; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .offline-icon { font-size: 64px; margin-bottom: 20px; }
        .offline-title { font-size: 24px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
        .offline-message { color: #64748b; line-height: 1.6; margin-bottom: 30px; }
        .retry-btn { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; }
        .retry-btn:hover { background: #1d4ed8; }
        .cached-content { margin-top: 30px; text-align: left; }
        .cached-item { padding: 10px; border-left: 3px solid #2563eb; margin: 10px 0; background: #f1f5f9; }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1 class="offline-title">您当前处于离线模式</h1>
        <p class="offline-message">
            网络连接似乎出现了问题，但您仍然可以访问已缓存的内容。
            请检查网络连接后重试。
        </p>
        <button class="retry-btn" onclick="window.location.reload()">重新连接</button>

        <div class="cached-content">
            <h3>可用的离线内容：</h3>
            <div class="cached-item">🏠 首页 - 平台介绍和导航</div>
            <div class="cached-item">🎥 视频学习 - 已缓存的安全培训视频</div>
            <div class="cached-item">📝 智能测试 - 离线答题功能</div>
            <div class="cached-item">📊 学习记录 - 本地存储的学习进度</div>
        </div>
    </div>
</body>
</html>
`;

// 缓存大小限制（MB）
const CACHE_SIZE_LIMIT = 50;
const MAX_CACHE_ENTRIES = 100;

// 需要网络优先的资源
const NETWORK_FIRST_URLS = [
  '/api/',
  '/functions/'
];

// 需要缓存优先的资源
const CACHE_FIRST_URLS = [
  '/src/assets/',
  '/assets/',
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg'
];

/**
 * Service Worker安装事件
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE_NAME)
        .then(cache => {
          console.log('[SW] Caching static assets...');
          return cache.addAll(STATIC_ASSETS);
        }),

      // 缓存离线页面
      caches.open(OFFLINE_CACHE_NAME)
        .then(cache => {
          console.log('[SW] Caching offline page...');
          return cache.put('/offline.html', new Response(OFFLINE_PAGE_CONTENT, {
            headers: { 'Content-Type': 'text/html' }
          }));
        })
    ])
      .then(() => {
        console.log('[SW] All assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache assets:', error);
      })
  );
});

/**
 * Service Worker激活事件
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      cleanupOldCaches(),

      // 清理超大缓存
      cleanupOversizedCaches(),

      // 声明控制权
      self.clients.claim()
    ])
      .then(() => {
        console.log('[SW] Service Worker activated successfully');

        // 通知所有客户端更新完成
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: CACHE_VERSION
            });
          });
        });
      })
      .catch(error => {
        console.error('[SW] Failed to activate Service Worker:', error);
      })
  );
});

/**
 * 清理旧版本缓存
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, OFFLINE_CACHE_NAME];

  return Promise.all(
    cacheNames
      .filter(cacheName => {
        // 删除不是当前版本的缓存
        return !currentCaches.includes(cacheName) &&
          (cacheName.startsWith('anq-static-') ||
            cacheName.startsWith('anq-dynamic-') ||
            cacheName.startsWith('anq-offline-') ||
            cacheName.startsWith('anq-platform-'));
      })
      .map(cacheName => {
        console.log('[SW] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

/**
 * 清理超大缓存
 */
async function cleanupOversizedCaches() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();

    if (requests.length > MAX_CACHE_ENTRIES) {
      console.log(`[SW] Cache has ${requests.length} entries, cleaning up...`);

      // 删除最旧的条目
      const entriesToDelete = requests.slice(0, requests.length - MAX_CACHE_ENTRIES);
      await Promise.all(
        entriesToDelete.map(request => cache.delete(request))
      );

      console.log(`[SW] Deleted ${entriesToDelete.length} old cache entries`);
    }
  } catch (error) {
    console.error('[SW] Failed to cleanup oversized caches:', error);
  }
}

/**
 * 网络请求拦截
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过chrome-extension和其他协议
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

/**
 * 处理网络请求的核心逻辑
 */
async function handleFetch(request) {
  const url = new URL(request.url);

  try {
    // API请求 - 网络优先策略
    if (isNetworkFirst(url.pathname)) {
      return await networkFirstStrategy(request);
    }

    // 静态资源 - 缓存优先策略
    if (isCacheFirst(url.pathname)) {
      return await cacheFirstStrategy(request);
    }

    // 页面请求 - 网络优先，失败时返回缓存
    if (isPageRequest(request)) {
      return await networkFirstStrategy(request);
    }

    // 默认策略 - 网络优先
    return await networkFirstStrategy(request);

  } catch (error) {
    console.error('[SW] Fetch error:', error);

    // 如果是页面请求且网络失败，返回离线页面
    if (isPageRequest(request)) {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }

      // 如果离线页面也没有，尝试返回首页缓存
      const homeResponse = await caches.match('/');
      if (homeResponse) {
        return homeResponse;
      }
    }

    // 返回网络错误
    return new Response('Network error', {
      status: 408,
      statusText: 'Network timeout'
    });
  }
}

/**
 * 网络优先策略
 */
async function networkFirstStrategy(request) {
  try {
    // 尝试网络请求
    const networkResponse = await fetch(request);

    // 如果是成功的响应，缓存它
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * 缓存优先策略
 */
async function cacheFirstStrategy(request) {
  // 先尝试从缓存获取
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // 缓存未命中，从网络获取
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * 判断是否为网络优先的URL
 */
function isNetworkFirst(pathname) {
  return NETWORK_FIRST_URLS.some(pattern => pathname.startsWith(pattern));
}

/**
 * 判断是否为缓存优先的URL
 */
function isCacheFirst(pathname) {
  return CACHE_FIRST_URLS.some(pattern =>
    pathname.startsWith(pattern) || pathname.endsWith(pattern)
  );
}

/**
 * 判断是否为页面请求
 */
function isPageRequest(request) {
  return request.destination === 'document' ||
    request.headers.get('accept')?.includes('text/html');
}

/**
 * 推送通知事件处理
 */
self.addEventListener('push', event => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || '您有新的学习内容',
    icon: '/assets/images/icons/pwa/icon-192x192.png',
    badge: '/assets/images/icons/pwa/icon-72x72.png',
    tag: data.tag || 'anq-notification',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: '查看详情'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ANQ安全平台', options)
  );
});

/**
 * 通知点击事件处理
 */
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

/**
 * 后台同步事件处理
 */
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * 执行后台同步
 */
async function doBackgroundSync() {
  try {
    // 这里可以添加后台同步逻辑
    // 例如：同步离线时的用户数据
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

console.log('[SW] Service Worker script loaded');
