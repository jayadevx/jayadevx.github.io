/* ============================================================
   LAYA — Service Worker
   Place this file at: apps/sw.js
   ============================================================ */

const CACHE_NAME = 'laya-v1';

/* Files to pre-cache on install */
const PRECACHE = [
  './',
  './laya.html',
];

/* ── INSTALL: pre-cache core files ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: clean up old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── FETCH: cache-first for same-origin, network-first for fonts/external ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Skip non-GET and cross-origin requests like analytics */
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          /* Offline fallback for navigation */
          if (event.request.mode === 'navigate') {
            return caches.match('./laya.html');
          }
        });
    })
  );
});
