// Service worker for Rake Reports: keeps the page itself available offline.
// Google Sheets and sign-in requests are never cached, so reports are always live.
const CACHE_VERSION = 'rake-reports-v1';
const PRECACHE_URLS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const net = fetch(event.request).then((resp) => {
        if (resp && resp.ok) { const copy = resp.clone(); caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy)); }
        return resp;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
