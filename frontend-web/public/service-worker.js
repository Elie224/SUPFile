// Service Worker pour SUPFile PWA
const CACHE_NAME = 'supfile-v1';
const STATIC_CACHE = 'supfile-static-v1';

// Fichiers à mettre en cache au moment de l'installation
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/files',
  '/search',
  '/trash',
  '/settings'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Mise en cache des fichiers statiques');
      return cache.addAll(STATIC_FILES);
    }).then(() => {
      return self.skipWaiting(); // Activer immédiatement le nouveau SW
    })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => {
            console.log('[Service Worker] Suppression du cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim(); // Prendre le contrôle immédiatement
    })
  );
});

// Stratégie de cache : Network First avec fallback sur cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas mettre en cache les requêtes API (toujours aller sur le réseau)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // En cas d'échec réseau, retourner une réponse d'erreur
        return new Response(
          JSON.stringify({ error: 'Mode hors ligne - Impossible de se connecter au serveur' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Pour les autres ressources, utiliser une stratégie Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la réponse est valide, la mettre en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, essayer de récupérer depuis le cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si pas de cache, retourner une page offline basique
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Gestion des messages depuis le client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});