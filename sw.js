// --- THE DEFINITIVE, FINAL SERVICE WORKER ---
// This file is the architecturally correct solution to the PWA loading issues.

const CACHE_NAME = 'amaz-pm-cache-final-fix';
const APP_SHELL_URLS = [
  '/index.html',
];

// --- INSTALL: Pre-cache the essential App Shell ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event: Caching App Shell.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => {
        console.log('[Service Worker] Installation successful, activating immediately.');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] App Shell caching failed:', error);
      })
  );
});

// --- ACTIVATE: Clean up old caches ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event: Cleaning up old caches and taking control.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => {
          console.log('[Service Worker] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients now.');
      return self.clients.claim();
    })
  );
});

// --- FETCH: Intercept network requests ---
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // --- CORE FIX FOR SINGLE-PAGE APPS ---
  // If this is a navigation request (the user is trying to open a page),
  // ALWAYS respond with the cached index.html. The client-side router will handle the rest.
  // This prevents "Page Not Found" errors and fixes the infinite loading screen.
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('/index.html'));
    return;
  }

  // For all other requests (JS, CSS, images, etc.), use a "Stale-While-Revalidate" strategy.
  // This makes the app feel instant and self-updates in the background.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          // If the fetch is successful, update the cache with the new version.
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return the cached version immediately if it exists, otherwise wait for the network.
        return cachedResponse || fetchPromise;
      });
    })
  );
});