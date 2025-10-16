// sw.js - Architecturally Correct Service Worker for a Single-Page Application (v-critical-deps-fix)

const CACHE_VERSION = 'v-critical-deps-fix';
const STATIC_CACHE = `amaz-pm-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `amaz-pm-dynamic-${CACHE_VERSION}`;

// The essential files for the app to function offline.
// CRITICAL FIX: Added all CDN dependencies to the app shell.
const APP_SHELL = [
  '/',
  '/index.html',
  '/index.tsx', 
  '/offline.html',
  '/manifest.json',
  // --- Core Dependencies ---
  'https://esm.sh/react@19.2.0',
  'https://esm.sh/react-dom@19.2.0/client',
  'https://esm.sh/react-router-dom@7.9.4',
  'https://esm.sh/@supabase/supabase-js@2',
  'https://esm.sh/recharts@3.2.1',
  // --- Core Assets ---
  'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
  'https://res.cloudinary.com/dzvmyhpff/image/upload/w_192,h_192,c_pad/v1759808706/highqualiamaz_etnjtt.png'
];

// 1. Install Event: Pre-cache the essential app shell.
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching App Shell:', APP_SHELL);
        // Use 'reload' to bypass the browser's HTTP cache for these requests.
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
  
  // Ignore requests that are not GET, not part of the app's origin, or for browser extensions.
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // For SPA navigation, always serve index.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => response || fetch('/index.html'))
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Network-first strategy for the main application script to get updates quickly.
  if (url.pathname === '/index.tsx') {
    event.respondWith(
      fetch(request, { cache: 'reload' })
        .then(networkResponse => {
          // If successful, cache the new response and return it
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // If the network fails, return the cached version
          return caches.match(request);
        })
    );
    return;
  }

  // For all other requests (images, fonts, CDN scripts), use a stale-while-revalidate strategy.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached response immediately if available.
        const networkFetch = fetch(request)
          .then(networkResponse => {
            // Update the dynamic cache with the fresh response.
            if (networkResponse && networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => { /* Network failed, but we already returned a cached response if we had one. */ });
        
        return cachedResponse || networkFetch;
      })
  );
});