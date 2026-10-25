// Workbox-Compatible Service Worker for Talmud Bavli 3D Offline Library
const SEFARIA_CACHE = 'talmud-sefaria-texts-cache';
const TRANSLATIONS_CACHE = 'talmud-translations-cache';
const LOCAL_API_CACHE = 'talmud-local-api-cache';
const FONTS_CACHE = 'google-fonts-cache';
const APP_SHELL_CACHE = 'talmud-app-shell-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(['/', '/icon.svg']).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('talmud-app-shell-') && key !== APP_SHELL_CACHE).map(key => caches.delete(key)))),
  ]));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && (response.status === 200 || response.status === 0)) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip Vite internal dev requests
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/src/')
  ) {
    return;
  }

  // 1. Sefaria Talmud Texts & Commentaries API — CacheFirst
  if ((url.hostname === 'sefaria.org' || url.hostname.endsWith('.sefaria.org')) && url.pathname.startsWith('/api/')) {
    event.respondWith(cacheFirst(req, SEFARIA_CACHE));
    return;
  }

  // 2. Live Translations — CacheFirst
  if (url.hostname.includes('translate.googleapis.com')) {
    event.respondWith(cacheFirst(req, TRANSLATIONS_CACHE));
    return;
  }

  // 3. Google Fonts — CacheFirst
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(req, FONTS_CACHE));
    return;
  }

  // 4. Local Talmud API — NetworkFirst with offline cache fallback
  // Generated answers and private app API responses must never be shared-cache entries.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;

  // 5. Navigation requests — NetworkFirst with App Shell fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches
            .open(APP_SHELL_CACHE)
            .then((c) => c.put('/', res.clone()))
            .catch(() => {});
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(APP_SHELL_CACHE);
          return (await cache.match('/')) || new Response('ოფლაინ გვერდი ჯერ არ არის შენახული', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        })
    );
  }
});
