const CACHE = 'aac-v3.5';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './state.js',
  './events.js',
  './lang.js',
  './stats.js',
  './profiles.js',
  './langs/en.js',
  './langs/he.js',
  './langs/uk.js',
  './langs/pt.js',
  './services/speech.js',
  './services/camera.js',
  './services/symbols.js',
  './components/strip.js',
  './components/strip-ops.js',
  './components/deck-area.js',
  './components/binder-bar.js',
  './components/modal.js',
  './components/settings.js',
  './components/search.js',
  './components/profile-switcher.js',
  './components/suggest-bar.js',
  './components/chat.js',
  './components/reports.js',
  './components/quick-access.js',
  './components/tutorial.js',
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
