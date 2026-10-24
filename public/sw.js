const CACHE_NAME = 'retailx-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Pre-caching assets failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests and skip API requests / hot reloads
  if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('chrome-extension:')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone and cache it for offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a page request fails offline, fallback to /index.html
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Handle clicks on native device notifications (especially on mobile phones and background tabs)
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification banner

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Look for an existing open window of the app
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Send message to client to navigate to alerts tab
          client.postMessage({ type: 'NAVIGATE', url: '/dashboard/alerts' });
          return client.focus();
        }
      }
      
      // If no open window, open a new tab/window directly on alerts feed
      if (self.clients.openWindow) {
        return self.clients.openWindow('/dashboard/alerts');
      }
    })
  );
});

