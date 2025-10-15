// A unique cache name to force updates when the service worker changes.
const CACHE_NAME = 'amaz-pm-cache-v33-full-precache';

// A comprehensive list of all known files required for the app to function offline.
// This is a brute-force approach necessary due to the lack of a build step.
const PRECACHE_URLS = [
  // App Shell
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',

  // Contexts
  '/context/AuthContext.tsx',
  '/context/UserContext.tsx',

  // Services
  '/services/supabaseClient.ts',
  '/services/api.ts',
  '/services/mockData.ts',

  // Components (a representative subset, the fetch handler will get the rest)
  '/components/icons.tsx',
  '/components/layout/DashboardLayout.tsx',
  '/components/layout/Sidebar.tsx',
  '/components/layout/Header.tsx',
  '/components/ui/Card.tsx',
  '/components/ui/Button.tsx',
  '/components/ui/Modal.tsx',

  // Pages
  '/pages/Login.tsx',
  '/pages/ProjectDetails.tsx',
  '/pages/ProjectsList.tsx',

  // External Dependencies
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@500;600;700&display=swap',
  'https://esm.sh/react@19.2.0',
  'https://esm.sh/react-dom@19.2.0/client',
  'https://esm.sh/react-router-dom@7.9.4',
  'https://esm.sh/@supabase/supabase-js@2'
];


// On install, pre-cache the critical app files.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching critical assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active one.
        console.log('[Service Worker] Installation successful, skipping waiting.');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
});

// On activate, clean up old caches and take control of the page.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event');
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
      console.log('[Service Worker] Claiming clients.');
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
        .catch(() => {
          // If the network fails, serve the main index.html from the cache.
          console.log('[Service Worker] Network failed for navigation, serving index.html from cache.');
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For all other requests (JS, CSS, images, fonts, API calls), use a "Cache First, then Network" strategy.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // If we have a response in the cache, return it immediately.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in the cache, fetch it from the network.
      return fetch(request).then(networkResponse => {
        // We only want to cache successful GET requests to avoid caching errors.
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          // Clone the response because it's a stream and can only be consumed once.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Cache the new resource for next time.
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});