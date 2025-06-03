/**
 * Service Worker for ANQ Platform
 * 提供离线支持、缓存管理和推送通知功能
 */

const CACHE_NAME = 'anq-platform-v1.0.0';
const STATIC_CACHE_NAME = 'anq-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'anq-dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/styles/main.css',
  '/src/modules/app.js',
  '/src/modules/router.js',
  '/src/modules/data-manager.js',
  '/src/components/HomePage.js',
  '/src/components/VideoPage.js',
  '/src/components/VideoPlayer.js',
  '/src/components/QuizPage.js',
  '/src/components/QuizEngine.js',
  '/src/utils/api.js',
  '/src/utils/storage.js',
  '/src/utils/validation.js',
  '/src/utils/logger.js',
  '/src/utils/performance.js'
];

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
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

/**
 * Service Worker激活事件
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // 删除旧版本的缓存
              return cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME &&
                     (cacheName.startsWith('anq-static-') || 
                      cacheName.startsWith('anq-dynamic-') ||
                      cacheName.startsWith('anq-platform-'));
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('[SW] Failed to activate Service Worker:', error);
      })
  );
});

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
      const offlineResponse = await caches.match('/');
      if (offlineResponse) {
        return offlineResponse;
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
