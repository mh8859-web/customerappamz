const CACHE_NAME = "amaz-modular-cache-v1";
// Add the resources that should be cached on install
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/index.tsx"
];

// Install the service worker and cache the static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Serve cached content when offline, and cache new requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      // Cache hit - return response from cache
      if (response) {
        return response;
      }

      // Not in cache - fetch from network
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Don't cache Supabase API calls
        if (event.request.url.includes('.supabase.co')) {
            return response;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // For index.tsx with cache-busting, we store it without the param
          let requestToCache = event.request.url.includes('/index.tsx?t=') 
            ? new Request('/index.tsx') 
            : event.request;

          cache.put(requestToCache, responseToCache);
        });

        return response;
      });
    })
  );
});
