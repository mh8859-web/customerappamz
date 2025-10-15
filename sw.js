const CACHE_NAME = 'amaz-pm-cache-v12-shell';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://res.cloudinary.com/dzvmyhpff/image/upload/w_192,h_192,c_pad/v1759808706/highqualiamaz_etnjtt.png',
  'https://res.cloudinary.com/dzvmyhpff/image/upload/w_512,h_512,c_pad/v1759808706/highqualiamaz_etnjtt.png'
];

// Install event: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event: clean up old caches
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
    }).then(() => self.clients.claim()) // Take control of pages
  );
});

// Fetch event: serve from cache first for the app shell, otherwise network.
self.addEventListener('fetch', (event) => {
  // For navigation requests (e.g., loading the page), use a network-first strategy
  // to ensure users get the latest HTML, but fall back to the cache if offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If the network fails, serve the cached index.html.
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // For other requests (JS, CSS, images), use a cache-first strategy.
  // This is safe because we only pre-cache the app shell, not dynamic assets.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we have a cached response for one of our shell assets, return it.
        if (response) {
          return response;
        }

        // Otherwise, go to the network.
        // We don't cache the response here to avoid caching old, hashed assets.
        return fetch(event.request);
      })
  );
});
