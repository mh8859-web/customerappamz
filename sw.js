// A unique cache name to force updates when the service worker changes.
const CACHE_NAME = 'amaz-pm-cache-v30-final';

// The essential files needed for the app to start. This is the "app shell".
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// On install, pre-cache the app shell.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active one.
        return self.skipWaiting();
      })
  );
});

// On activate, clean up old caches and take control.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        // Delete all caches that are not our current one.
        cacheNames.filter(name => name !== CACHE_NAME).map(name => {
          console.log('[Service Worker] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      // Take control of all open clients (pages) immediately.
      return self.clients.claim();
    })
  );
});

// On fetch, apply caching strategies.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For navigation requests (loading a page), use a network-first strategy.
  // This ensures the user gets the latest version of the app if they are online.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If the network response is good, cache it for offline use.
          if (response.ok) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request.url, resClone));
          }
          return response;
        })
        .catch(() => {
          // If the network fails (i.e., the user is offline),
          // serve the main index.html from the cache. This is the offline fallback.
          console.log('[Service Worker] Network failed, serving /index.html from cache for navigation.');
          return caches.match('/index.html');
        })
    );
  }
  // For all other requests (like JS, CSS, images, fonts), use a cache-first strategy.
  else {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        // If the resource is in the cache, return it immediately.
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in the cache, fetch it from the network.
        return fetch(request).then(networkResponse => {
          // If we get a valid response, clone it and put it in the cache for next time.
          if (networkResponse && networkResponse.ok) {
             const resClone = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => cache.put(request, resClone));
          }
          return networkResponse;
        });
      })
    );
  }
});