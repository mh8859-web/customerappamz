// A robust "stale-while-revalidate" service worker.
// It provides a fast, offline-first experience while ensuring the app
// stays up-to-date automatically in the background.

const CACHE_NAME = 'amaz-pm-v2'; // Increment version to force cache updates on deployment

// On install, activate the new worker immediately.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// On activate, clean up any old, outdated caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim()) // Take control of all open clients
  );
});

// On fetch, apply the caching strategy.
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests (e.g., POST, PUT)
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignore requests to Supabase API and storage to ensure data is always fresh.
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Fetch from the network in the background to get the latest version.
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // If the fetch is successful, update the cache with the new version.
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            console.warn('Service Worker fetch failed, possibly offline:', error);
            // This is expected to fail when the user is offline.
          });

        // Return the cached response immediately if it exists, for a fast load.
        // Otherwise, wait for the network response. This ensures the app works offline.
        return cachedResponse || fetchPromise;
      });
    })
  );
});