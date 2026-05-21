// Service Worker - PAM Desktop (Workboard + Stammblatt)
// Google-APIs werden NIEMALS gecacht.

const CACHE_NAME = 'pam-desktop-v112';
const PRECACHE = [
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css',
  'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js',
  'https://cdn.jsdelivr.net/npm/piexifjs@1.0.6/piexif.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@5.0.7/dist/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// Installation: CDN-Ressourcen einzeln cachen - ein Fehler blockiert nicht den ganzen Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Precache fehlgeschlagen:', url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Aktivierung: veraltete Caches loeschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function isHtmlPage(url) {
  const u = new URL(url);
  return u.pathname === '/' ||
         u.pathname.endsWith('/index.html') ||
         u.pathname.endsWith('/stammblatt.html') ||
         u.pathname.endsWith('.html');
}

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (url.startsWith('blob:') || url.startsWith('data:')) return;

  if (
    url.includes('googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('drive.google.com') ||
    url.includes('oauth2.google') ||
    url.includes('lh3.googleusercontent.com') ||
    url.includes('withgoogle.com') ||
    url.includes('ssl.gstatic.com') ||
    url.includes('microsoft.com') ||
    url.includes('microsoftonline.com') ||
    url.includes('microsoftauthenticator') ||
    url.includes('graph.microsoft.com') ||
    url.includes('login.live.com') ||
    url.includes('cdn.jsdelivr.net/npm/@azure')
  ) {
    return;
  }

  if (e.request.redirect && e.request.redirect !== 'follow') return;

  // Nur Same-Origin und bekannte CDN-Bibliotheken abfangen.
  // Alle anderen externen Domains (z.B. E-Mail-Bilder, Tracking-Pixel, fremde CDNs)
  // werden NICHT interceptet – verhindert CORS-Fehler im SW.
  const isSameOrigin = url.startsWith(self.location.origin);
  const isKnownCdn   = PRECACHE.some(p => url === p);
  if (!isSameOrigin && !isKnownCdn) return;

  // Network-First fuer HTML-Seiten
  if (isHtmlPage(url)) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if (resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then(c => c || new Response('Offline', {status: 503})))
    );
    return;
  }

  // Cache-First fuer CDN-Bibliotheken (nur bekannte URLs aus PRECACHE)
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
