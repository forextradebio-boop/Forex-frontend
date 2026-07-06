self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Simplest service worker, just passes through the requests
  e.respondWith(fetch(e.request));
});
