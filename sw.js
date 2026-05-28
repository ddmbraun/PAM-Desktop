// Service Worker - PAM Desktop (Workboard + Stammblatt)
// Google-APIs werden NIEMALS gecacht.

const CACHE_NAME = 'pam-desktop-2026-05-28-b81'; // b81: Drive-Browser Suche: Suchfeld mit Debounce, Treffer anzeigen + direkt öffnen oder auswählen // b80: Baudoku: Live-Preisupdate (oninput statt onchange), Autocomplete für Personal + Maschinen aus allen Tasks // b79: Fix internetMessageId in _saveThreadMailsAsEml (Outlook-Thread-Mails wurden nie als Original gespeichert); Drive-Browser statt prompt() im Verschieben-Button // b78: Projektordner-Verschieben-Button (📁↗) in Verknüpfungen: verschiebt Hauptordner in neuen Bauvorhaben-Ordner + sucht _Stammdaten // b77: Outlook-Verlauf: echte MIME-Originale via Graph /$value automatisch in emailOriginals speichern // b76: Dual-Outlook: zweiter Konto-Slot (f.braun@ddmbraun.de), Button 📨 f.B, automatische Fallback-Suche Token2 // b74: Outlook-Fix: Token-Refresh auch wenn msToken=null (nach Reload), Auto-Load im Popup auch bei gespeichertem MSAL-Account // b73: tDokOrdner-Feld (01_Dokumente-Ordner)
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

  // Cache-First fuer CDN-Bibliotheken
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (e.request.method === 'GET' && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => new Response('', {status: 503, st