const CACHE = 'Salaus-v1';
const FILES = [
  '/',
  '/index.html?v=1.5',
  '/info.html?v=1.5',
  '/informazioni.html?v=1.5',
  '/cookie-privacy.html?v=1.5',
  '/style.css?v=1.5',
  '/Salaus.js?v=1.5',
  '/app.js?v=1.5',
  '/site.webmanifest',
  '/sw.js?v=1.5',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
self.addEventListener('activate', event => {
    event.waitUntil(
        clients.claim().then(() => {
            return self.clients.matchAll().then(clients => {
                return Promise.all(
                    clients.map(client => client.postMessage({ type: 'SW_ACTIVATED' }))
                );
            });
        })
    );
});