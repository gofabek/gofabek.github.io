// Service worker: makes the site work offline after the first visit.
// Pages, CSS and JS: network first (so updates show up immediately), cache as fallback.
// Images and fonts: served from cache, refreshed in the background.
// Bump VERSION to drop every old cache.
const VERSION = 'v1';
const CACHE = `gofa-${VERSION}`;
const CORE = ['/', '/styles.css', '/i18n.js', '/script.js', '/404.html', '/images/gofur-480.webp', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('gofa-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isStatic(url) {
  return /\.(webp|png|jpe?g|svg|woff2)$/.test(url.pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') return (await cache.match('/404.html')) || Response.error();
    throw error;
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(update);
    return cached;
  }
  return update;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(isStatic(url) ? staleWhileRevalidate(request, event) : networkFirst(request));
});
