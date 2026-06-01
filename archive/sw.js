/* ============================================================
   LAYA — Service Worker v2
   File: sw.js  (place in root alongside laya.html)
   ============================================================ */

const CACHE = 'laya-v2';

const PRECACHE_URLS = [
  '/laya.html',
  '/manifest.json',
  '/laya-icon-192.png',
  '/laya-icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Rajdhani:wght@300;400;500;600;700&display=swap',
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(e => console.warn('[LAYA SW] Could not cache:', url, e))
        )
      );
    })
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: cache-first for local, network-first for external ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;

  if (isLocal) {
    /* Cache-first for app files */
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(event.request, clone));
          }
          return res;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/laya.html');
          }
        });
      })
    );
  }
  /* Let cross-origin (fonts, etc.) pass through normally */
});
