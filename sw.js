// This service worker has been intentionally disabled to ensure the application always fetches the latest version from the network, resolving caching issues.
// All PWA offline capabilities are turned off as a result.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return self.clients.matchAll({ type: 'window' });
    }).then(clients => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});
