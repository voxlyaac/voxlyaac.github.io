const CACHE = 'aac-v1.7';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './lang.js',
  './langs/en.js',
  './langs/he.js',
  './langs/uk.js',
  './langs/pt.js',
  './profiles.js',
  './stats.js',
  './ai-friend.js',
  './chat.js',
  './reports.js',
  './tutorial.js',
  './manifest.webmanifest',
  './icon-192.svg',
  './icon-512.svg',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: serve cached version instantly,
// fetch fresh copy in background to update cache for next visit
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fetched = fetch(e.request).then(response => {
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetched;
      })
    )
  );
});
