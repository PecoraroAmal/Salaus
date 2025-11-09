const CACHE_NAME = 'salaus-v4';
const FILES_TO_CACHE = [
  '/',
  '/index.html?v=1',
  '/style.css?v=1',
  '/salaus.js?v=1',
  '/app.js?v=1',
  '/site.webmanifest',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/cookie-privacy.html',
  '/info.html',
  '/informazioni.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => { if (key !== CACHE_NAME) caches.delete(key); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(response => response || fetch(e.request))
    );
  }
});