// sw.js - Architecturally Correct Service Worker for a Single-Page Application (v-final-fix-2)

const CACHE_VERSION = 'v-final-fix-2';
const STATIC_CACHE = `amaz-pm-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `amaz-pm-dynamic-${CACHE_VERSION}`;

// The essential files for the app to function offline.
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json' // Explicitly cache the manifest
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
  
  // Let browser handle requests to external APIs/CDNs
  if (url.origin !== self.location.origin) {
    return;
  }

  // ** CRITICAL FIX FOR SPA ROUTING **
  // For all navigation requests (i.e., requests for HTML pages), always serve the
  // cached index.html. This allows the client-side router (React Router) to handle
  // the URL and display the correct page, preventing "Page Not Found" errors on refresh
  // or when accessing deep links directly.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => {
          if (response) {
            return response; // Serve the app shell from cache.
          }
          // If index.html is not in cache for some reason, try fetching it.
          return fetch('/index.html'); 
        })
        .catch(() => {
          // If everything fails, show the offline fallback page.
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // For all other requests (JS, CSS, fonts, manifest), use a Stale-While-Revalidate strategy.
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
             // If network fails and we don't have a cached response, do nothing.
             // The browser will show its default offline error for this specific asset.
          });
        
        // Return the cached response immediately if it exists, otherwise wait for the network.
        return cachedResponse || networkFetch;
      })
  );
});