const CACHE_NAME = 'level-up-fitness-v2';

const ASSETS = [
  '/fitness-app-upgraded/',
  '/fitness-app-upgraded/index.html',
  '/fitness-app-upgraded/manifest.webmanifest',
  '/fitness-app-upgraded/icon.svg',
  '/fitness-app-upgraded/src/style.css',
  '/fitness-app-upgraded/src/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) => cached || caches.match('/fitness-app-upgraded/index.html'),
        ),
      ),
  );
});
