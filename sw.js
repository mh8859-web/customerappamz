const CACHE_NAME = 'amaz-pm-cache-v11-passthrough'; // New version to force update

// This event fires when the service worker is first installed.
self.addEventListener('install', (event) => {
  // By calling skipWaiting(), the new service worker activates immediately
  // instead of waiting for the old one to be garbage collected.
  event.waitUntil(self.skipWaiting());
  console.log('[Service Worker] V11 Installed and skipping waiting.');
});

// This event fires when the new service worker is activated.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Get all the cache keys (cache names).
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If a cache name is not our current one, delete it.
          // This aggressively removes all old, broken caches.
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tell the active service worker to take control of the page immediately.
      console.log('[Service Worker] V11 Activated and claimed clients.');
      return self.clients.claim();
    })
  );
});

// This event fires for every network request.
self.addEventListener('fetch', (event) => {
  // By NOT calling event.respondWith(), we are letting the browser
  // handle the request as it normally would. The service worker
  // does not intercept the request at all. This makes the app
  // online-only but guarantees it will never get stuck on a loading screen
  // due to a bad cache.
  // This is a "pass-through" or "no-op" (no-operation) fetch listener.
});
