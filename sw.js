// sw.js - Architecturally Correct Service Worker for a Single-Page Application (v-network-first-fix)

const CACHE_VERSION = 'v-network-first-fix';
const STATIC_CACHE = `amaz-pm-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `amaz-pm-dynamic-${CACHE_VERSION}`;

// The essential files for the app to function offline.
const APP_SHELL = [
  '/',
  '/index.html',
  '/index.tsx', 
  '/offline.html',
  '/manifest.json'
];

// 1. Install Event: Pre-cache the essential app shell.
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching App Shell:', APP_SHELL);
        const cachePromises = APP_SHELL.map(url => {
          return cache.add(new Request(url, { cache: 'reload' }));
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
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
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intercept network requests and apply caching strategies.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignore cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // For SPA navigation, always serve index.html. This is correct.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => response || fetch('/index.html'))
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // ** CRITICAL FIX: Network-first strategy for the main application script **
  // This ensures users always get the latest version of the app logic if online.
  if (url.pathname === '/index.tsx') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return fetch(request, { cache: 'reload' }) // Attempt to fetch from the network first
          .then(networkResponse => {
            // If successful, cache the new response and return it
            cache.put(request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // If the network fails, return the cached version
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Stale-while-revalidate for all other assets (CSS, images, etc.)
  // This serves from cache for speed, but updates in the background.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        const networkFetch = fetch(request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => { /* Network failed, but we might have a cached response */ });
        
        return cachedResponse || networkFetch;
      })
  );
});