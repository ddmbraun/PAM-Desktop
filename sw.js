const CACHE_NAME = 'pam-desktop-2026-07-01-b416'; // b416: Kanban-Karte: Aufgaben/Termine-Zeilen ("Aufg.: … Datum") stehen jetzt hintereinander in einer flex-wrap-Zeile statt je einer eigenen Zeile; Datum direkt hinter dem Text mit eigenem Rahmen (Badge), bricht bei Platzmangel normal um · b415: Globale Suche (alle Boards): Filterzeile "Anruf/Besichtigung" um Eintrag "📋 Auftrag planen" ergänzt (Button + Filterlogik auf t.auftragPlanen) · b412: Archiv + Später-bearbeiten: Meta-Zeile (Hausverwaltung/Adresse/Schadensbild) auf 2 Zeilen begrenzt, per Klick auf-/zuklappbar (.pam-clamp2); Archiviert-am/Später-bearbeiten-seit-Badge und Projekt-Label jetzt fett + im Kästchen; "🌐 HTML erstellen"-Button jetzt auch bei Später-bearbeiten-Karten (spaeterBearbeitenTaskToHtml); Später-bearbeiten-Ansicht hat jetzt dieselbe Filterzeile (Suche+Jahr+Monat) wie das Archiv, basierend auf spaeterBearbeitenAm · b411: Archiv-Datenmodell umgebaut – archivierte Tasks liegen jetzt in eigenem, projektunabhängigem Speicher (archivedTasks) statt weiterhin im Projekt-Array (boards[k]); überleben dadurch das Löschen des Ursprungsprojekts. Auto-Migration bestehender archivierter Tasks beim Laden. Wiederherstellen fällt auf das aktuelle bzw. ein beliebiges Projekt zurück, falls das Ursprungsprojekt gelöscht wurde, statt zu scheitern. Betrifft auch den Duplikate-Zusammenführen-Snapshot · b410: Archiv-Karte: Textkontrast erhöht (opacity:0.85 entfernt, Meta-Zeile 11→12px), neuer Button „🌐 HTML erstellen" pro Karte (Abschlussakte-HTML jetzt auch direkt aus dem Archiv ohne Modal-Umweg, dafür createAbschlussHtml() in gemeinsamen Baustein _buildAbschlussHtml(task) aufgeteilt), Archiv-Ansicht hat jetzt eigene Filterzeile (Suche + Jahr + Monat), Jahr-Filter springt bei jedem Öffnen des Archivs auf das aktuelle Jahr zurück · b408: Markierung des zuletzt geöffneten Tasks ist jetzt kein 4s-Timer mehr, sondern gilt dauerhaft für JEDES Task-Öffnen (openEditTaskModal) und bleibt bis zum nächsten geöffneten Task stehen · b407: „Zurück ins Projekt" klappt die Ziel-Spalte des Tasks auf (statt alle einzuklappen) und hebt die Karte 4s farblich hervor (pam-just-restored) · b406: „Zurück ins Projekt" verlässt jetzt auch den Später-bearbeiten-Filter + wechselt das Board – Speichern/Schließen landet im richtigen Projekt+Spalte statt in der Später-bearbeiten-Liste · b405: „Zurück ins Projekt" öffnet den Task jetzt direkt (openEditTaskModal), kein manuelles Suchen mehr nötig · b404: Neuer Task-Status „Später bearbeiten" (Flag spaeterBearbeiten, eigener Modal-Button, eigener Topbar-Filter + Übersicht projektübergreifend, analog zum Archiv-System) · Filterleiste neu gruppiert (Ansicht/Status/Zeit), Sortierung-Auf/Ab-Buttons zu einem kombinierten Button zusammengelegt · b403: Gmail/Outlook/f.B-Buttons: Status-Punkt + Farbstreifen oben (grün=verbunden, grau=getrennt) + Hover-Tooltip · Gmail Auto-Reconnect beim Seitenstart via Refresh-Token // b399: Abschlussakte HTML: Vorschau-Iframes für E-Mail-PDFs + Anhänge, Foto-Zoom-Lightbox, ↩ In PAM wiederherstellen-Button mit ZIP-Export // b398: Popup-Auto-Save: kein Browser-Dialog beim Schließen, Task wird per localStorage-Event ans Hauptfenster gesendet → Hauptfenster speichert auf Drive · b397: Task-Popup: ⇱-Button im Task-Header öffnet Task in eigenem frei verschiebbarem Fenster, Hauptfenster schließt Modal · b396: Heute-Ansicht: „📞 Anruf" + „📍 Besichtigung" als Toggle-Buttons (wie Globale Suche), nicht mehr im Typ-Dropdown · b395: Heute-Ansicht: Filter „📞 Anruf offen" + „📍 Besichtigung offen" im Typ-Dropdown ergänzt (Karten + Kachel) · b394: Outlook Auto-Connect: sequenziell + E-Mail-basierte Konto-Zuweisung + Fehlermeldung + kein Toast beim Start · b393: _warnToastShown nach Cloud-Refresh zurücksetzen (kein stummer 2. Ablauf) · b392: Token-Refresh zuverlässiger (visibilitychange + T-10min lösen jetzt Cloud-Refresh aus, [PAM-DEBUG]-Log entfernt) · NAS-Pfadlängen: E-Mail-Betreff 80→40 Zeichen + Datums-Stamp YYMMDD

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
