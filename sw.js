// sw.js - robust PWA service worker (network-first for navigation + SWR for assets)
const CACHE_NAME = 'amaz-pm-shell-v1';
const ASSET_CACHE = 'amaz-pm-assets-v1';
const OFFLINE_PAGE = '/offline.html';

// Files we want pre-cached (app shell)
const PRECACHE = [
  '/',
  '/index.html',
  OFFLINE_PAGE,
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE.map(u => new Request(u, {cache: 'reload'}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME && k !== ASSET_CACHE).map(k => caches.delete(k)));
      if (self.registration && self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

// Helper: network timeout wrapper
const networkWithTimeout = (request, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('network-timeout')), ms);
    fetch(request).then(r => { clearTimeout(timer); resolve(r); }).catch(err => { clearTimeout(timer); reject(err); });
  });
};

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  // Navigation requests (SPA) -> network-first with cache/offline fallback
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      // Try navigation preload (fast) first
      const preload = await event.preloadResponse.catch(() => null);
      if (preload) return preload;

      try {
        // Try network with a short timeout to avoid long spinner
        const networkResponse = await networkWithTimeout(req, 7000);
        // update cache with the fresh index.html (store under CACHE_NAME root '/')
        const cache = await caches.open(CACHE_NAME);
        try { cache.put('/', networkResponse.clone()); } catch (_) {}
        return networkResponse;
      } catch (err) {
        // Network failed -> fallback to cached index or offline page
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        if (cachedIndex) return cachedIndex;
        const offline = await cache.match(OFFLINE_PAGE);
        if (offline) return offline;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Non-navigation requests -> stale-while-revalidate using ASSET_CACHE
  event.respondWith((async () => {
    const cache = await caches.open(ASSET_CACHE);
    const cached = await cache.match(req);
    const networkPromise = fetch(req).then(networkResponse => {
      if (networkResponse && networkResponse.ok) {
        cache.put(req, networkResponse.clone()).catch(()=>{});
      }
      return networkResponse;
    }).catch(() => null);

    // Return cached if available, otherwise the network, otherwise cached
    return cached || networkPromise || (await cache.match(req));
  })());
});
