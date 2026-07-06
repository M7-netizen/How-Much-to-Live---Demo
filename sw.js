const CACHE = 'yuezh-v108';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png', '/header-logo.png'];

// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first for Firebase, cache first for app shell
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase requests: always network, no cache interception
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return; // let browser handle normally
  }

  // App shell: cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    }).catch(() => caches.match('/index.html'))
  );
});

// Listen for skipWaiting message
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
