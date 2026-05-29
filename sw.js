// Service Worker - PAM Mobil
// Google-APIs werden NIEMALS gecacht.

const CACHE_NAME = 'pam-mobil-v27'; // v27: Baudoku-Redesign (Stoppuhr/Fotos/Notizen), E-Mail als PDF

const PRECACHE = [
  './',
  './index.html',
  './artikel.json',
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css',
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js',
  'https://cdn.jsdelivr.net/npm/piexifjs@1.0.6/piexif.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@5.0.7/dist/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Precache fehlgeschlagen:', url, err))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (url.startsWith('blob:') || url.startsWith('data:')) return;

  if (
    url.includes('googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('drive.google.com') ||
    url.includes('oauth2.google') ||
    url.includes('lh3.googleusercontent.com') ||
    url.includes('api.open-meteo.com')
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (e.request.method === 'GET' && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => new Response('', {status: 503, statusText: 'Offline'}));
    })
  );
});
