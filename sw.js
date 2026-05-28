const CACHE_NAME = 'pam-desktop-2026-05-28-b94'; // b94: CID-Bilder Größenfilter 20KB beim EML-Import
const ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (
    url.includes('accounts.google.com') ||
    url.includes('oauth2.googleapis.com') ||
    url.includes('googleapis.com') ||
    url.includes('login.microsoftonline.com') ||
    url.includes('login.microsoft.com') ||
    url.includes('graph.microsoft.com') ||
    url.includes('azure.com') ||
    url.includes('token') ||
    url.includes('auth') ||
    e.request.method !== 'GET'
  ) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});
