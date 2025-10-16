// sw.js - Architecturally Correct Service Worker for a Single-Page Application (v-final)

const CACHE_VERSION = 'v-final';
const STATIC_CACHE = `amaz-pm-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `amaz-pm-dynamic-${CACHE_VERSION}`;

// The essential files for the app to function offline.
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html'
];

// 1. Install Event: Pre-cache the essential app shell.
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching App Shell:', APP_SHELL);
        // Use 'reload' to ensure we get fresh files from the network, not the browser's HTTP cache.
        const cachePromises = APP_SHELL.map(url => {
          return cache.add(new Request(url, { cache: 'reload' }));
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // Force the new service worker to become active.
      .catch(error => console.error('[SW] App Shell caching failed:', error))
  );
});

// 2. Activate Event: Clean up old caches.
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim()) // Take control of all open pages immediately.
  );
});

// 3. Fetch Event: Intercept network requests and apply caching strategies.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignore requests to Supabase or other external APIs
  if (url.hostname.includes('supabase.co') || url.hostname.includes('cloudinary.com')) {
    return;
  }

  // For SPA navigation (requests for HTML documents), use a Network-Falling-Back-to-Cache strategy.
  // CRITICAL: All navigation requests must fall back to serving '/index.html'.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
           // If the network is successful, update the cache with the new index.html
           return caches.open(STATIC_CACHE).then(cache => {
             cache.put('/index.html', response.clone());
             return response;
           });
        })
        .catch(() => {
          // If the network fails, serve the cached index.html. This is the key to offline launch.
          return caches.match('/index.html')
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If index.html is not in the cache, serve the offline fallback page.
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // For all other requests (JS, CSS, fonts), use a Stale-While-Revalidate strategy.
  // This serves content from the cache instantly for speed, then updates the cache from the network.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        const networkFetch = fetch(request)
          .then(networkResponse => {
            // Check if the response is valid before caching
            if (networkResponse && networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE).then(cache => {
                // Cache a clone of the successful network response for next time.
                cache.put(request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => {
             // If network fails, and we don't have a cached response, do nothing.
             // The browser will show its default offline error for this specific asset.
          });
        
        // Return the cached response immediately if it exists, otherwise wait for the network.
        return cachedResponse || networkFetch;
      })
  );
});