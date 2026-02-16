const CACHE_NAME = 'gracestack-v3';
const API_CACHE_NAME = 'gracestack-api-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// API endpoints to cache for offline reading
const CACHEABLE_API = [
  '/api/dashboard',
  '/api/rag/stats',
  '/api/rag/sources',
  '/api/memories',
  '/api/global-rules',
  '/api/dashboard/trends/daily',
  '/api/dashboard/budget',
  '/api/dashboard/models',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first with offline fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip socket.io requests entirely
  if (url.pathname.startsWith('/socket.io')) {
    return;
  }

  // API requests: network-first, cache for offline
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_API.some((p) => url.pathname === p);

    if (isCacheable && event.request.method === 'GET') {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(API_CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            return caches.match(event.request).then((cached) => {
              if (cached) return cached;
              // Return offline indicator JSON
              return new Response(
                JSON.stringify({ offline: true, error: 'Offline — visar cachad data' }),
                { headers: { 'Content-Type': 'application/json' } }
              );
            });
          })
      );
      return;
    }

    // Non-cacheable API: just try network, return error if offline
    if (event.request.method === 'GET') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response(
            JSON.stringify({ offline: true, error: 'Offline' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      return;
    }

    // POST/PUT/DELETE: queue if offline (handled by app code)
    return;
  }

  // Static assets: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'gracestack-offline-messages') {
    event.waitUntil(sendQueuedMessages());
  }
});

async function sendQueuedMessages() {
  // This is handled by the app when it comes back online
  // Notify all clients to flush their offline queue
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'FLUSH_OFFLINE_QUEUE' });
  });
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Gracestack AI Lab', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'gracestack-notification',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
