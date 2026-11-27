const CACHE_NAME = 'my-uk-address-finder-shell-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/app-192.png',
  './icons/app-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache address API calls or external navigation/maps.
  if (url.origin !== self.location.origin || request.method !== 'GET') return;

  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.ok && (
        url.pathname.endsWith('/') ||
        url.pathname.endsWith('/index.html') ||
        url.pathname.endsWith('.webmanifest') ||
        url.pathname.includes('/icons/')
      )) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        return (await caches.match('./index.html')) || Response.error();
      }
      return Response.error();
    })
  );
});
