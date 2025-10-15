// A new, robust, architecturally-correct service worker.
// This version uses a "Stale-While-Revalidate" strategy for assets,
// which is resilient to hashed filenames from the build process.

const CACHE_NAME = 'amaz-pm-cache-v8'; // Incremented version to force update.
const APP_SHELL_URLS = [
  '/',
  '/index.html'
];

// On install, cache the minimal, un-hashed app shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting()) // Activate immediately.
  );
});

// On activate, clean up all old caches to remove stale files.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of the page immediately.
  );
});

// On fetch, handle requests with a robust caching strategy.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For navigation requests (opening the app), use a Network-First strategy.
  // This ensures the user gets the latest version if they're online,
  // but the app still loads from the cache if they're offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For all other requests (assets like JS, CSS, fonts, manifest),
  // use a "Stale-While-Revalidate" strategy.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 1. Return the cached response immediately if it exists.
      // 2. In the background, fetch a fresh version from the network.
      const fetchPromise = fetch(request).then((networkResponse) => {
        // If the network request is successful, update the cache with the new version.
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
        return networkResponse;
      });

      // Return the cached response right away if we have it,
      // otherwise, wait for the network response.
      return cachedResponse || fetchPromise;
    })
  );
});
