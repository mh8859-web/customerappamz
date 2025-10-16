// sw.js - THE FINAL, ARCHITECTURALLY CORRECT SERVICE WORKER - v3

const CACHE_NAME = 'amaz-pm-final-v3'; // A new name to guarantee a fresh start
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  // The manifest is fetched by the browser, not the service worker, so it doesn't need to be here.
];

// --- INSTALL: Pre-cache the essential App Shell ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event: Caching App Shell.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()) // Force activation immediately
      .catch(error => {
        console.error('[Service Worker] App Shell caching failed during install:', error);
      })
  );
});

// --- ACTIVATE: Clean up old caches and take control ---
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
      return self.clients.claim(); // Take control of all open pages
    })
  );
});

// --- FETCH: Intercept network requests ---
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // --- CORE FIX FOR SINGLE-PAGE APPS (SPA) ---
  // If this is a navigation request (the user is trying to open a page),
  // we MUST ALWAYS respond with the cached index.html. The client-side React Router
  // will then read the URL and render the correct components.
  // This prevents all "Page Not Found" errors and fixes the infinite loading screen.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(response => {
        // If index.html is in the cache, return it. Otherwise, fetch it as a fallback.
        // This ensures the app shell always loads, even on first visit or if cache is cleared.
        return response || fetch('/index.html');
      }).catch(error => {
        // This should not happen if install was successful, but as a last resort:
        console.error('[Service Worker] Failed to serve index.html for navigation:', error);
        // If cache fails for some reason, just try the network.
        return fetch('/index.html');
      })
    );
    return; // Stop processing for navigation requests.
  }
  
  // For all other requests (JS, CSS, images from CDN, fonts, etc.), use a "Stale-While-Revalidate" strategy.
  // This serves assets from the cache for speed, while simultaneously fetching an update in the background for the next visit.
  // It provides a great balance of performance and freshness.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          // If the fetch is successful, update the cache with the new version.
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return the cached response immediately if it exists, otherwise wait for the network.
        // The network fetch will happen in the background regardless.
        return cachedResponse || fetchPromise;
      });
    })
  );
});