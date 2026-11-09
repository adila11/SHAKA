/* ==========================================================================
   SHAKA Progressive Web App - Service Worker
   Version: 1.0.0
   Quiet Luxury Personal Ledger - Offline, Caching & Update Management
   ========================================================================== */

const CACHE_VERSION = 'shaka-pwa-v1';
const STATIC_CACHE = `shaka-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `shaka-runtime-${CACHE_VERSION}`;

// Pre-cached critical application shell & assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/Logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png'
];

// Install Event: Pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SHAKA SW] Pre-cache partial warning:', err);
      });
    })
  );
  // Do not automatically call self.skipWaiting() here to allow controlled update prompts
});

// Activate Event: Clean up outdated caches & claim clients
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SHAKA SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Message Event: Listen for update commands from UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: Implement intelligent, safe caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Never cache non-GET requests (e.g. POST, PUT, DELETE for transactions/auth)
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. Strict Security: NEVER cache sensitive API responses or Auth routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return structured JSON when offline rather than an unhandled error
        return new Response(
          JSON.stringify({
            success: false,
            error: 'NetworkUnavailable',
            message: 'You are currently offline. Synchronizing changes requires an active connection.',
            isOffline: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 3. Navigation Requests: Network-first with cache & offline page fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Attempt to match the exact URL from cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback to cached index.html (SPA client-side router handles it)
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) {
            return cachedIndex;
          }

          // Final fallback: custom offline.html
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // 4. Static Assets (Vite chunks, fonts, images, stylesheets)
  // Strategy: Cache-first with background network update (Stale-While-Revalidate)
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?|css|js)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Background revalidation
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failure during background revalidation is ignored if cachedResponse exists
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Default Fallback: Network with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
