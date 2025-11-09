const CACHE_NAME = 'salaus-v4';
const FILES_TO_CACHE = [
  '/Salaus/',
  '/Salaus/index.html?v=1.9.7',
  '/Salaus/style.css?v=1.9.7',
  '/Salaus/salaus.js?v=1.9.7',
  '/Salaus/app.js?v=1.9.7',
  '/Salaus/manifest.json',
  '/Salaus/apple-touch-icon.png',
  '/Salaus/favicon.ico',
  '/Salaus/favicon.svg',
  '/Salaus/favicon-96x96.png',
  '/Salaus/web-app-manifest-192x192.png',
  '/Salaus/web-app-manifest-512x512.png',
  '/Salaus/cookie-privacy.html?v=1.9.7',
  '/Salaus/info.html?v=1.9.7',
  '/Salaus/informazioni.html?v=1.9.7',
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
  if (e.request.url.startsWith('http://')) {
    e.respondWith(fetch(e.request.url.replace('http://', 'https://')));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/Salaus/index.html?v=1.9.7'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(response => response || fetch(e.request))
    );
  }
});