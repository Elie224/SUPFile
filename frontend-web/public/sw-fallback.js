/* Service Worker minimal pour mode hors ligne - SUPFile (fallback sans plugin PWA) */
const CACHE = 'supfile-offline-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(['/', '/index.html']).then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE).map((n) => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return r;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => {
          if (cached) return cached;
          if (e.request.mode === 'navigate') return caches.match('/index.html') || caches.match('/');
          return new Response('', { status: 503, statusText: 'Hors ligne' });
        })
      )
  );
});
