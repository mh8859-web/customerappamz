const CACHE_NAME = 'amaz-pm-cache-v7';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx'
];

// On install, cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting()) // Force the waiting service worker to become the active service worker.
  );
});

// On activation, clean up old caches and take control of the page.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          return caches.delete(cacheName);
        }
      })
    )).then(() => self.clients.claim()) // Take control of all open clients immediately.
  );
});

// On fetch, use a network-first strategy.
self.addEventListener('fetch', (event) => {
  // For navigation requests (e.g., opening the app), try the network first.
  // If the network fails (offline), serve the cached index.html as a fallback.
  // This is a standard pattern for Single Page Applications.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For all other requests (JS, CSS, images, etc.), try the network first.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the network request is successful, clone it and cache it for future offline use.
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // If the network request fails (offline), try to serve the response from the cache.
        return caches.match(event.request);
      })
  );
});
