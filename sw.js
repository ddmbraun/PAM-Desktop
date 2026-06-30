const CACHE_NAME = 'pam-desktop-2026-06-30-b396'; // b396: Heute-Ansicht: „📞 Anruf" + „📍 Besichtigung" als Toggle-Buttons (wie Globale Suche), nicht mehr im Typ-Dropdown · b395: Heute-Ansicht: Filter „📞 Anruf offen" + „📍 Besichtigung offen" im Typ-Dropdown ergänzt (Karten + Kachel) · b394: Outlook Auto-Connect: sequenziell + E-Mail-basierte Konto-Zuweisung + Fehlermeldung + kein Toast beim Start · b393: _warnToastShown nach Cloud-Refresh zurücksetzen (kein stummer 2. Ablauf) · b392: Token-Refresh zuverlässiger (visibilitychange + T-10min lösen jetzt Cloud-Refresh aus, [PAM-DEBUG]-Log entfernt) · NAS-Pfadlängen: E-Mail-Betreff 80→40 Zeichen + Datums-Stamp YYMMDD

self.addEventListener('install', event => {
  // Kein pre-caching – verhindert addAll-Fehler bei Subdirectory-Deployments (z.B. GitHub Pages)
  // Assets werden on-the-fly beim ersten Abruf gecacht (fetch-Handler unten)
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Nur Same-Origin-Requests cachen
  if (url.origin !== self.location.origin) return;
  // POST-Requests nicht cachen
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
