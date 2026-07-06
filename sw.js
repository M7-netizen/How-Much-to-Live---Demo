const CACHE = 'yuezh-demo-v1';
const ASSETS = ['/How-Much-to-Live/demo/', '/How-Much-to-Live/demo/index.html', '/How-Much-to-Live/demo/manifest.json', '/How-Much-to-Live/icon-192.png', '/How-Much-to-Live/icon-512.png', '/How-Much-to-Live/header-logo.png'];

// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches (only this demo's own old versions)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('yuezh-demo-') && k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache first for app shell. Demo never talks to Firebase.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return; // let browser handle normally (harmless, demo never calls these APIs)
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    }).catch(() => caches.match('/How-Much-to-Live/demo/index.html'))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
