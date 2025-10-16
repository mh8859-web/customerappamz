// --- THE DEFINITIVE SERVICE WORKER ---
// This file is the architecturally correct solution to the PWA issues.
// It is designed to work with modern build tools that hash filenames.

// A unique name for the cache. Incrementing this version will force all clients
// to discard old caches and fetch the new service worker and assets.
const CACHE_NAME = 'amaz-pm-cache-v100-definitive';

// The essential "app shell" files. We only cache the entry points.
// All other assets (hashed JS, CSS, etc.) will be cached at runtime.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// --- INSTALL: Pre-cache the essential App Shell ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event: Caching App Shell.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => {
        // Force the waiting service worker to become the active one immediately.
        // This is crucial for applying updates without a page reload.
        console.log('[Service Worker] Installation successful, activating immediately.');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] App Shell caching failed during install:', error);
      })
  );
});

// --- ACTIVATE: Clean up old caches ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event: Cleaning up old caches and taking control.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        // Find and delete any caches that are not our current one.
        cacheNames.filter(name => name !== CACHE_NAME).map(name => {
          console.log('[Service Worker] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      // Take control of all open clients (browser tabs, PWA windows) immediately.
      console.log('[Service Worker] Claiming clients now.');
      return self.clients.claim();
    })
  );
});

// --- FETCH: Intercept network requests and apply caching strategy ---
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For navigation requests (loading the app page itself), use a "Network First" strategy.
  // This ensures users get the latest HTML shell if they are online, but the app
  // can still load from the cache if they are offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If the network fails, serve the main index.html from the cache.
          // This is what allows the app to launch offline.
          console.log('[Service Worker] Network failed for navigation, serving from cache.');
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For all other requests (JS, CSS, images, API calls), use a "Cache First" strategy.
  // This makes the app feel instant and work offline after the first visit.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // If the resource is in the cache, return it immediately.
        return cachedResponse;
      }

      // If the resource is not in the cache, fetch it from the network.
      return fetch(request).then(networkResponse => {
        // Don't cache unsuccessful responses or non-GET requests.
        if (!networkResponse || networkResponse.status !== 200 || request.method !== 'GET') {
          return networkResponse;
        }

        // Cache the newly fetched resource for future requests.
        // This is how the service worker "learns" about the hashed file names.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
