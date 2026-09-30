// PAM – Formulare: gemeinsame Datei für PAM Mobil und PAM Desktop.
// ⛔ Nicht in einer App-Kopie ändern – beim Bau wird diese Datei in die Apps kopiert und muss dort gleich sein.
// Inhalt: Feuchte- und Schimmelprotokoll (auch Keller). Wird von index.html VOR dem Hauptprogramm geladen.
const PAM_FORMULARE_VERSION='F2c';
/* ══ v291: FEUCHTE- UND SCHIMMELPROTOKOLL (Mobil) ═════════════════════════════════════════
   Befund Frank 14.09.2026: ein Formular wie das Wartungsprotokoll, aber mit Messwerten – am
   Tablet vor Ort ausfüllen, als PDF abheften. Werte werden eingetippt; das Einlesen der
   testo-Datei folgt, sobald eine echte Probedatei vorliegt.
   Rechenwege (reine Funktionen, von test_v291 AUSGEFÜHRT):
   · Taupunkt nach Magnus (a=17,62 · b=243,12 °C, über Wasser)
   · Oberflächenfeuchte = Luftfeuchte × Sättigungsdruck(Raum) : Sättigungsdruck(Oberfläche)
   · Ampel wie die testo-App: unter 70 % grün, 70 bis unter 80 % gelb, ab 80 % rot
   · Temperaturfaktor nur ab 10 K zwischen innen und außen (sonst ohne Aussage)
   ⛔ Datenform bleibt zum PC verträglich: sektionen[].items[] mit status ok/mangel/offen und
     bemerkung. Bis der PC nachgezogen ist, öffnet er das Protokoll als einfachen Prüfbericht.
   ⛔ Eingaben rendern NICHT neu (sonst springt die Tastatur weg) – nur die Rechenzeilen werden
     nachgezogen (_fsWerteNeu); neu gebaut wird nur bei Hinzufügen/Entfernen/Auswahl.
   ⛔ Texte, die ins PDF gehen, nur mit Zeichen, die die PDF-Grundschrift kennt (kein ⚠ ● ≥). */
const FS_FARBE='#1f5f8b';
const FS_SEKTIONEN_DEF=[
  {titel:'1 · Befund in den Räumen',items:[
    'Schimmel sichtbar (Lage und Größe notieren)',
    'Fenster beschlagen / Dichtungen verfärbt',
    'Möbel dicht an Außenwänden',
    'Abluft Küche und Bad zieht',
    'Wäsche wird in der Wohnung getrocknet'
  ]},
  {titel:'2 · Dach / Dachboden / Hohlraum',items:[
    'Dämmung vollständig bis an den Rand',
    'Dämmung trocken',
    'Unterseite Dach bzw. Decke ohne Wasserspuren',
    'Abdichtung / Eindeckung ohne Schäden',
    'Anschlüsse, Durchdringungen, Dachrand dicht',
    'Entwässerung frei'
  ]},
  {titel:'3 · Angaben der Nutzer',items:[
    'Seit wann? Nur nach Regen oder immer?',
    'Was hat sich zuletzt geändert (Personen, Sanierung, Heizung)?',
    'Wie wird gelüftet und geheizt?'
  ]}
];
const FS_RAUM_VORSCHLAEGE=['Wohnzimmer','Schlafzimmer','Kinderzimmer','Küche','Bad','Flur','Treppenhaus'];
const FS_BEFUNDE=['trocken','feucht','nass','Schimmel'];
const FS_BEWERTUNGEN=[
  {k:'A',text:'Wasser von außen/oben (z. B. Dach) wahrscheinlich'},
  {k:'B',text:'Tauwasser / zu hohe Raumluftfeuchte wahrscheinlich'},
  {k:'C',text:'beides'}
];
const FS_LEGENDE='Taupunkt nach Magnus-Formel aus Raumtemperatur und Luftfeuchte. Abstand = Oberflächentemperatur minus Taupunkt. '
  +'Oberflächenfeuchte = Luftfeuchte, umgerechnet auf die gemessene Oberflächentemperatur: unter 60 % grün, 60 bis unter 80 % gelb, ab 80 % rot (Schimmelgefahr, Grenze nach DIN 4108-2). '
  +'Bauteilfeuchte in Digits: Vergleichswerte, keine Masse-%. Temperaturfaktor nur bei mindestens 10 K zwischen innen und außen; Mindestwert 0,70 nach DIN 4108-2.';
const _fsPdfBlobs={}; // zuletzt erstelltes PDF je Bericht – bewusst NICHT am Bericht (würde mitgespeichert)

/* ══ v303: KELLER-VARIANTE ════════════════════════════════════════════════════════════════════
   Menü „＋" → „💧 Feuchte – Keller" legt dasselbe Formular mit art:'keller' an: eigene Abhakliste,
   Raumvorschläge und Ursachen. Messen, Rechnen, Fotos und PDF bleiben gleich.
   ⛔ Bewertungs-Schlüssel A–C bedeuten je nach Art etwas anderes – immer über _fsBewertungenFuer lesen.
   ⛔ Texte gehen ins PDF: nur Zeichen der PDF-Schrift. */
const FS_KELLER_TITEL='Feuchte- und Schimmelprotokoll Keller';
const FS_KELLER_SEKTIONEN=[ // v304: fünf Abschnitte, ergänzt nach UBA-Schimmelleitfaden 2024 und Fachquellen
  {titel:'1 · Befund im Keller',items:[
    'Zugang zum Keller nur über Treppenhaus oder Hof (kein Wohnraum)',
    'Schimmel an Gegenständen oder Wänden (wo?)',
    'Schimmelfläche: unter 20 cm² / bis 0,5 m² / über 0,5 m²',
    'Hinter Regalen, Schränken und Verkleidungen nachgesehen',
    'Wasser oder Pfützen am Boden',
    'Salzausblühungen, abplatzender Putz oder Farbe',
    'Feuchterand an der Wand (Höhe über Boden notieren)',
    'Muffiger Geruch'
  ]},
  {titel:'2 · Wand und Boden innen',items:[
    'Wand grenzt an Erdreich (Außenwand)',
    'Innendämmung, Vorsatzschale oder Verkleidung an der Wand',
    'Rohr- und Leitungsdurchführungen trocken',
    'Übergang Wand / Boden: Feuchte, Risse, Fugen',
    'Wasser- und Abwasserleitungen im Raum trocken',
    'Bodenablauf, Rückstauklappe oder Hebeanlage vorhanden und gewartet'
  ]},
  {titel:'3 · Außen am Haus',items:[
    'Fallrohre und Regenwasseranschluss in Ordnung',
    'Gelände / Pflaster fällt vom Haus weg ab',
    'Kellerfenster / Lichtschacht dicht, Lichtschacht entwässert',
    'Sockel: Risse, Putzschäden oder Feuchteflecken',
    'Spritzwasser, Bewuchs oder Erde direkt an der Hauswand',
    'Drainage / Kontrollschacht vorhanden, Wasserstand'
  ]},
  {titel:'4 · Lüftung und Nutzung',items:[
    'Kellerfenster im Sommer offen (warme Luft schlägt sich an kalten Wänden nieder)',
    'Gegenstände direkt an der Außenwand oder in Kartons auf dem Boden',
    'Weitere Feuchtequellen (Luftentfeuchter, Pflanzen, Brennholz)',
    'Nachbarkeller ebenso betroffen',
    'Wäsche wird im Keller getrocknet'
  ]},
  {titel:'5 · Angaben der Nutzer',items:[
    'Seit wann? Nur nach Regen, nur im Sommer oder immer?',
    'Frühere Wasserschäden, Hochwasser, bisherige Maßnahmen',
    'Was hat sich zuletzt geändert?'
  ]}
];
const FS_KELLER_RAEUME=['Kellerraum','Kellergang','Nachbarkeller (Vergleich)','Treppenhaus'];
const FS_KELLER_BEWERTUNGEN=[
  {k:'A',text:'Wasser von außen (Erdreich, Lichtschacht, Fallrohr) wahrscheinlich'},
  {k:'B',text:'Tauwasser: warme, feuchte Luft an kalten Wänden wahrscheinlich'},
  {k:'C',text:'Aufsteigende Feuchte aus Boden oder Mauerwerk wahrscheinlich'},
  {k:'D',text:'mehrere Ursachen'}
];
function _fsIstKeller(b){return !!b&&b.art==='keller';}
function _fsBewertungenFuer(b){return _fsIstKeller(b)?FS_KELLER_BEWERTUNGEN:FS_BEWERTUNGEN;}
function _fsRaumVorschlaege(b){return _fsIstKeller(b)?FS_KELLER_RAEUME:FS_RAUM_VORSCHLAEGE;}
function _fsTitel(b){
  if(b&&b.fassung==='begehung')return 'Begehungsprotokoll'+(b.art==='keller'?' Keller':' Wohnung'); // F2a (bewusst ohne Hilfsnamen: alte Prüfungen schneiden diese Funktion einzeln aus)
  return _fsIstKeller(b)?FS_KELLER_TITEL:'Feuchte- und Schimmelprotokoll';
}

function _fsZahl(v){
  if(v===null||v===undefined)return null;
  const s=String(v).trim().replace(',','.');
  if(s===''||!/^-?\d+(\.\d+)?$/.test(s))return null;
  const n=parseFloat(s);
  return isFinite(n)?n:null;
}
function _fsSaettigung(T){return 611.2*Math.exp(17.62*T/(243.12+T));}
function _fsTaupunkt(T,rf){
  const t=_fsZahl(T),r=_fsZahl(rf);
  if(t===null||r===null||r<=0||r>100)return null;
  const a=Math.log(r/100)+17.62*t/(243.12+t);
  return 243.12*a/(17.62-a);
}
function _fsOberflaechenFeuchte(T,rf,ts){
  const t=_fsZahl(T),r=_fsZahl(rf),s=_fsZahl(ts);
  if(t===null||r===null||s===null||r<=0||r>100)return null;
  return Math.min(100,r*_fsSaettigung(t)/_fsSaettigung(s));
}
function _fsAmpel(ofRf){
  if(ofRf===null||ofRf===undefined)return '';
  return ofRf<60?'gruen':ofRf<80?'gelb':'rot'; // v294: gelb ab 60 % (Franks Entscheidung), rot ab 80 % (DIN 4108-2)
}
function _fsEins(n){
  if(n===null||n===undefined||!isFinite(n))return '–';
  return (Math.round(n*10)/10).toFixed(1).replace('.',',');
}
function _fsStelleWerte(bericht,st){
  const raeume=(bericht&&bericht.raeume)||[];
  const raum=raeume.find(r=>r&&r.name&&st&&r.name===st.raum)||null;
  const eigeneLuft=!!st&&_fsZahl(st.luftT)!==null&&_fsZahl(st.luftRf)!==null; // v292: Luft aus der testo-Messung derselben Sekunde
  const T=eigeneLuft?_fsZahl(st.luftT):(raum?_fsZahl(raum.t):null),rf=eigeneLuft?_fsZahl(st.luftRf):(raum?_fsZahl(raum.rf):null),ts=_fsZahl(st&&st.ts);
  const td=(T!==null&&rf!==null)?_fsTaupunkt(T,rf):null;
  const abstand=(td!==null&&ts!==null)?ts-td:null;
  const ofRf=(T!==null&&rf!==null&&ts!==null)?_fsOberflaechenFeuchte(T,rf,ts):null;
  let grenzeTs=null; // v294: Schimmelgrenze = Oberflächentemperatur, bei der die Oberfläche 80 % erreicht
  if(T!==null&&rf!==null&&rf>0&&rf<=100){const ga=Math.log(rf/80)+17.62*T/(243.12+T);grenzeTs=243.12*ga/(17.62-ga);}
  const reserve=(grenzeTs!==null&&ts!==null)?ts-grenzeTs:null;
  const ta=_fsZahl(bericht&&bericht.kopf&&bericht.kopf.aussenT);
  const frsi=(T!==null&&ta!==null&&ts!==null&&(T-ta)>=10)?(ts-ta)/(T-ta):null;
  const mf=_fsZahl(st&&st.mf),mv=_fsZahl(st&&st.mfVergleich);
  const faktor=(mf!==null&&mv!==null&&mv>0)?mf/mv:null;
  const bef=(st&&Array.isArray(st.befund))?st.befund:[];
  const hinweise=[];
  if(st&&st.testo&&Array.isArray(st.testo.warnungen))st.testo.warnungen.forEach(h=>{if(typeof h==='string'&&h)hinweise.push(h);}); // v292
  if(abstand!==null&&abstand>=3&&(bef.indexOf('nass')>=0||bef.indexOf('feucht')>=0))
    hinweise.push('Feucht, obwohl 3 K oder mehr über dem Taupunkt – spricht gegen Tauwasser: Wasser von außen/oben prüfen');
  if(abstand!==null&&abstand<=1)hinweise.push('Oberfläche am Taupunkt – Tauwasser möglich');
  if(frsi!==null&&frsi<0.7)hinweise.push('Temperaturfaktor unter 0,70 (Mindestwert DIN 4108-2)');
  return {raumGefunden:!!raum||eigeneLuft,luftQuelle:eigeneLuft?'testo':(raum?'raum':''),T,rf,td,ts,abstand,ofRf,ampel:_fsAmpel(ofRf),frsi,mf,mv,faktor,hinweise,grenzeTs,reserve};
}
function _fsNeuerBericht(t,art){
  const jetzt=new Date();
  const b={
    id:'fs_'+Date.now(),vorlage:'feuchte',titel:'Feuchte- und Schimmelprotokoll',
    datum:jetzt.toLocaleDateString('de-DE'),createdAt:jetzt.toISOString(),
    kopf:Object.assign({anwesend:'',uhrzeit:jetzt.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}),
      wetter:'',letzterRegen:'',aussenT:'',aussenRf:'',messgeraete:'',pruefer:''},_fsKopfAusKarte(t)), // v294: Auftraggeber, Nutzer, Auftrag-Nr., Objekt
    raeume:[],stellen:[],
    sektionen:FS_SEKTIONEN_DEF.map(s=>({titel:s.titel,items:s.items.map(text=>({text,status:'offen',notiz:''}))})),
    bewertung:'',bemerkung:'',empfehlungen:'',fotos:[]
  };
  if(art==='keller'){ // v303: eigene Abhakliste für Keller; ohne „art" bleibt es das Wohnungsprotokoll
    b.art='keller';b.titel=FS_KELLER_TITEL;
    b.sektionen=FS_KELLER_SEKTIONEN.map(s=>({titel:s.titel,items:s.items.map(text=>({text,status:'offen',notiz:''}))}));
  }
  return b;
}
// Altbestand/Fremdgerät: fehlende Teile ergänzen, nichts überschreiben
function _fsVervollstaendigen(b){
  if(!b)return b;
  if(!b.id)b.id='fs_'+Date.now();
  if(!b.kopf||typeof b.kopf!=='object')b.kopf={};
  ['auftraggeber','objektAdresse','auftragNr','nutzer','anwesend','uhrzeit','wetter','letzterRegen','aussenT','aussenRf','messgeraete','pruefer']
    .forEach(k=>{if(b.kopf[k]===undefined||b.kopf[k]===null)b.kopf[k]='';});
  ['raeume','stellen','sektionen','fotos'].forEach(k=>{if(!Array.isArray(b[k]))b[k]=[];});
  b.stellen.forEach(st=>{if(!Array.isArray(st.befund))st.befund=[];if(!Array.isArray(st.fotoRefs))st.fotoRefs=[];if(st.text===undefined)st.text='';});
  if(typeof b.bemerkung!=='string')b.bemerkung='';
  if(typeof b.empfehlungen!=='string')b.empfehlungen='';
  if(b.fassung==='begehung'){ // F2a: neue Felder des Begehungsprotokolls – Altbestand ohne „fassung" bleibt unberührt
    ['anlass','beginn','ende','geraetLuft','geraetOberflaeche','geraetBauteil'].forEach(k=>{if(b.kopf[k]===undefined||b.kopf[k]===null)b.kopf[k]='';});
    if(!Array.isArray(b.anwesende))b.anwesende=[];
    if(!Array.isArray(b.angaben))b.angaben=[];
  }
  return b;
}
function _fsPdfName(bericht,zeit){
  const d=String((bericht&&bericht.datum)||'').split('.');
  const datum=(d.length===3&&d[2])?(('0'+d[0]).slice(-2)+'-'+('0'+d[1]).slice(-2)+'-'+d[2]):'';
  const uhr=(zeit instanceof Date&&isFinite(zeit.getTime()))?'_'+('0'+zeit.getHours()).slice(-2)+('0'+zeit.getMinutes()).slice(-2):''; // v294
  if(bericht&&bericht.fassung==='begehung')return 'Begehung'+(bericht.art==='keller'?'_Keller':'_Wohnung')+(datum?'_'+datum:'')+uhr+'.pdf'; // F2a: kurzer Name (Pfadlänge)
  return 'Feuchteprotokoll'+(bericht&&bericht.art==='keller'?'_Keller':'')+(datum?'_'+datum:'')+uhr+'.pdf';
}

/* ══ v304: ABSCHNITTE EINKLAPPEN + „📘 So geht's" ═══════════════════════════════════════════════
   Einklappen ist nur Anzeige: gemerkt je Gerät im Browser-Speicher (Bericht-Kennung → Abschnitt-Nummern),
   NICHT am Bericht – sonst würde es mitgespeichert und auf dem anderen Gerät mit zugeklappt. Das PDF zeigt immer alles.
   Die Anleitung steht fest im Programm, damit sie im Keller auch ohne Empfang aufgeht. */
const FS_ZU_KEY='pam_fs_zu';
function _fsZuLesen(id){
  try{const m=JSON.parse(localStorage.getItem(FS_ZU_KEY)||'{}');return Array.isArray(m[id])?m[id]:[];}catch(e){return [];}
}
// F2b: mehrere Schlüssel auf einmal zu (zu=true) oder auf (zu=false) – „Alles zu/auf“, „Nur dieser“
function _fsZuMehrere(id,keys,zu){
  try{
    const m=JSON.parse(localStorage.getItem(FS_ZU_KEY)||'{}');
    let l=(Array.isArray(m[id])?m[id]:[]).filter(i=>keys.indexOf(i)<0);
    if(zu)l=l.concat(keys);
    if(l.length)m[id]=l;else delete m[id];
    localStorage.setItem(FS_ZU_KEY,JSON.stringify(m));
  }catch(e){}
}
function _fsZuSetzen(id,idx,zu){
  try{
    const m=JSON.parse(localStorage.getItem(FS_ZU_KEY)||'{}');
    const l=(Array.isArray(m[id])?m[id]:[]).filter(i=>i!==idx);
    if(zu)l.push(idx);
    if(l.length)m[id]=l;else delete m[id];
    localStorage.setItem(FS_ZU_KEY,JSON.stringify(m));
  }catch(e){}
}
function _fsSektionKurz(sek){
  let ok=0,mangel=0,offen=0;
  ((sek&&sek.items)||[]).forEach(it=>{if(it.status==='ok')ok++;else if(it.status==='mangel')mangel++;else offen++;});
  return [mangel?mangel+' auffällig':'',ok?ok+' unauffällig':'',offen?offen+' offen':''].filter(Boolean).join(' · ')||'keine Punkte';
}
const FS_HILFE=[
  ['Vorbereitung',[
    'Messgeräte 10 Minuten im Keller liegen lassen – kalt/warm verfälscht die Werte.',
    'Das Protokoll darf vorher angelegt sein. Am Termin „🌤 Wetter holen" antippen (Standort nötig) oder Wetter, letzten Regen, Außen °C und % rF selbst eintragen.',
    'Oben bei Raumklima den Raum anlegen (z. B. „＋ Kellerraum") und Temperatur und Luftfeuchte eintragen – der Taupunkt steht dann daneben.'
  ]],
  ['testo 605i (Luft) und 805i (Oberfläche)',[
    'ERST beide Fühler einschalten und in der testo Smart App verbinden, DANN Schimmelindikation starten.',
    'Unter „Messparameter" prüfen: bei Lufttemperatur und Feuchte muss „testo 605i" stehen, nicht „20,0 °C / 50 %". Die Einstellung springt sonst zurück.',
    'Emissionsgrad VOR dem Messen einstellen – nachträglich ändert er gespeicherte Werte nicht (die testo-Datei merkt sich den verwendeten Wert).',
    'Laser auf die Stelle, Foto, Speichern. Im Keller ohne Netz nur speichern – exportiert wird später.',
    'Mit Netz: Menü ☰ → Messdaten → Messung öffnen → Export → Bilder anhaken → JSON (NICHT CSV – PAM liest nur JSON) → Google Drive → „00_App-Daten / testo-Eingang".',
    'In PAM bei Messstellen „📥 testo-Messung einlesen" → alle Messungen antippen → Raum wählen → Einlesen → in jedem Foto auf die Stelle tippen → „✓ Punkt übernehmen". Braucht Internet.',
    'Die Messstellen sind dann mit Luft, Oberfläche und Foto angelegt – nur noch Namen und Digits ergänzen.'
  ]],
  ['Emissionsgrad je Wand (testo-Leitfaden Infrarot)',[
    'Putz, Mauerwerk, Ziegel, Mörtel, Beton: 0,93 · Kalksandstein: 0,95 · Farbe: 0,91–0,96 · Fliesen: 0,93 → 0,95 lassen (Fehler etwa 1 °C oder weniger).',
    'Gipsputz: 0,80–0,90 → auf 0,90 stellen. Holz: 0,80–0,94 → 0,90.',
    'Rohes Naturstein-Mauerwerk (Sandstein 0,67, Basalt 0,72, Granit 0,45): so NICHT messen – mattes schwarzes Klebeband aufkleben und darauf messen, oder eine verputzte Stelle suchen.',
    'Blankes Metall und Rohre nicht mit Infrarot messen.',
    'Zusätzlich oben bei „Messgeräte" eintragen, z. B. „805i, ε 0,95" – dann steht es im PAM-PDF.'
  ]],
  ['Trotec BM31WP (Bauteilfeuchte in Digits)',[
    'Taste 3× kurz (Lampe gelb) → Trotec-App: SENSOREN → Aktualisieren → Verbinden (Lampe grün). Dabei hinten halten und in die Luft richten.',
    'Zuerst eine trockene Stelle messen (hoch an der Wand) → „Vergleich trocken".',
    'Gerade und fest andrücken, 8–10 cm Abstand zu Ecken und Kanten. Menü → „Min / Max / Ø zurücksetzen", 3× messen, den Ø-Wert in „Bauteil (Digits)" eintragen.',
    'Mit Foto in der Trotec-App: Menü → Aufzeichnung starten → „Einzelpunktmessung mit Bild", im Foto auf jede Messstelle tippen, von unten nach oben. REC → Aufzeichnung beenden → Speichern mit Namen der Wand.',
    'Salze und Metall machen die Zahl zu hoch, raue Flächen zu niedrig. Digits sind Vergleichswerte, keine Prozent Wasser – kein Material wählen.'
  ]],
  ['Messstellen benennen',[
    'Wände durchnummerieren und Höhe dazu: „Wand 1 Außenwand 10 cm", „Wand 1 Außenwand 50 cm", „Wand 1 Außenwand 100 cm".',
    'Trotec-Foto und testo-Messung unter demselben Wand-Namen speichern – dann gehören sie eindeutig zusammen.',
    'An jeder Messstelle „📷 Fotos zu dieser Stelle" → Kamera: ganze Wand mit Zollstock.'
  ]],
  ['Abhaken',[
    'Nur antippen, was zutrifft: ✓ unauffällig · ⚠ auffällig · ○ offen. Was offen bleibt, stört nicht.',
    'Überschrift eines Abschnitts antippen oder „▲ Abschnitt einklappen" am Ende – dann bleibt nur eine Zeile mit der Kurzfassung. Im PDF steht trotzdem alles.',
    'Außen-Rundgang ums Haus: Abschnitt „Außen am Haus" (nur im Keller-Protokoll).'
  ]],
  ['Abschluss',[
    'Ursache wählen und kurz begründen. Nur Fotos mit grünem Haken kommen ins PDF.',
    '„PDF erstellen" – das PDF landet im Ordner der Karte, „📂 Öffnen" zeigt es sofort.'
  ]]
];
// F2a: im Begehungsprotokoll gelten andere Hinweise zum Abhaken und zum Abschluss (keine Ursache, keine Empfehlung)
const FS_HILFE_BG={
  'Abhaken':[
    'Tippe den Satz an, der stimmt. Er steht später wörtlich im PDF. Was du offen lässt, steht nicht im PDF.',
    'Bei Bedarf eine Anmerkung dazu (Ort, Größe …): Sie wird in den Satz eingebaut.',
    'Überschrift eines Abschnitts antippen oder „▲ Abschnitt einklappen" am Ende – dann bleibt nur eine Zeile mit der Kurzfassung.',
    'Etwas, das nicht in der Liste steht: „＋ Freier Eintrag" – dein eigener Satz kommt ins PDF.'
  ],
  'Abschluss':[
    'Was Mieter oder Nutzer gesagt haben, gehört unter „Angaben der Nutzer" – mit dem Namen, von wem es stammt.',
    'Zusammenfassung: nur das Festgestellte, eine Momentaufnahme. Keine Ursache, keine Empfehlung.',
    '„PDF erstellen" – das PDF landet im Ordner der Karte, „📂 Öffnen" zeigt es sofort. Nur Fotos mit grünem Haken kommen hinein.'
  ]
};
function _fsHilfeZeigen(b){
  const alt=document.getElementById('_fsHilfe');if(alt){alt.remove();return;}
  if(!b){try{b=(document.getElementById('_fsMobOverlay')||{})._fsBericht;}catch(e){b=null;}} // F2a: das offene Protokoll (Knopf ruft ohne Angabe auf)
  const bg=!!b&&b.fassung==='begehung'&&typeof FS_HILFE_BG!=='undefined';
  const ov=document.createElement('div');ov.id='_fsHilfe';
  ov.style.cssText='position:fixed;inset:0;z-index:99999;background:var(--bg);display:flex;flex-direction:column;';
  const kopf=document.createElement('div');
  kopf.style.cssText='background:'+FS_FARBE+';padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  const zu=document.createElement('button');zu.type='button';zu.textContent='←';zu.setAttribute('aria-label','Anleitung schließen');
  zu.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:18px;cursor:pointer;flex-shrink:0;';
  zu.onclick=()=>ov.remove();
  const t=document.createElement('div');t.style.cssText='font-size:15px;font-weight:700;color:#fff;';t.textContent="📘 So geht's – Feuchte messen";
  kopf.append(zu,t);
  const inhalt=document.createElement('div');
  inhalt.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 16px 40px;';
  FS_HILFE.forEach(([titel,zeilen0])=>{
    const zeilen=(bg&&FS_HILFE_BG[titel])?FS_HILFE_BG[titel]:zeilen0; // F2a
    const h=document.createElement('div');h.textContent=titel;
    h.style.cssText='font-size:15px;font-weight:700;color:var(--text);margin:16px 0 6px;padding-left:8px;border-left:4px solid '+FS_FARBE+';';
    const ol=document.createElement('ol');ol.style.cssText='margin:0;padding-left:22px;';
    zeilen.forEach(z=>{const li=document.createElement('li');li.textContent=z;li.style.cssText='font-size:15px;line-height:1.5;color:var(--text);margin-bottom:6px;';ol.appendChild(li);});
    inhalt.append(h,ol);
  });
  ov.append(kopf,inhalt);
  document.body.appendChild(ov);
}

/* ══ v294: AUSFÜLLHILFEN UND ERGEBNIS (Wunsch Frank 14.09.2026) ═══════════════════════════════
   · Kopf aus der Karte: Auftraggeber = Hausverwaltung › Rechnungsanschrift › Kontakt (Auftraggeber/Privatkunde/
     Eigentümer/Hausverwaltung), Nutzer = Kontakte mit Rolle Mieter, Auftrag-Nr. = Vorgangsnummer + Rep-Nr.,
     Objekt = Adresse › Objektname. „↻ aus Karte" füllt nur LEERE Felder.
   · 🌤 Wetter holen: Standort → Open-Meteo (Temperatur, Luftfeuchte, Wetterlage, Niederschlag der letzten 7 Tage).
   · Ampel: gelb ab 60 % (Franks Entscheidung), rot ab 80 % (Kriterium DIN 4108-2). testo nennt öffentlich keine Zahlen.
   · Schimmelgrenze = Oberflächentemperatur, bei der die Oberfläche 80 % erreicht; Reserve = Oberfläche minus Grenze.
   · Ungenutzte Checklisten (alles offen, keine Notiz) stehen im PDF nur als „Nicht geprüft".
   ⛔ Texte, die ins PDF gehen, nur mit Zeichen der PDF-Schrift (kein Emoji – Emoji nur in der Anzeige). */
const FS_WOHNUNG=['Wohnzimmer','Schlafzimmer','Küche','Bad','Flur'];

function _fsKontaktName(k){return String((k&&(k.name||k.firma))||'').trim();}
function _fsKopfAusKarte(t){
  const kontakte=(t&&Array.isArray(t.kontakte))?t.kontakte:[];
  const nachRolle=rollen=>{const k=kontakte.find(x=>x&&rollen.indexOf(x.rolle)>=0&&_fsKontaktName(x));return k?_fsKontaktName(k):'';};
  const rech=t&&t.rechnungsanschrift;
  const rechName=(typeof rech==='string')?rech.split(/\r?\n|,/)[0].trim():String((rech&&(rech.name||rech.firma))||'').trim();
  const auftraggeber=String((t&&t.hausverwaltung)||'').trim()||rechName||nachRolle(['ag','privatkunde','eigentuemer','hausverwaltung']);
  const nutzer=kontakte.filter(x=>x&&x.rolle==='mieter'&&_fsKontaktName(x)).map(_fsKontaktName).join(', ');
  const quelle=[String((t&&t.title)||'')].concat((t&&Array.isArray(t.tags))?t.tags.map(String):[]).join(' ');
  const vm=/(?:^|\D)(2\d{5})(?!\d)/.exec(quelle);
  const auftragNr=[vm?vm[1]:'',(t&&t.repNr)?'Rep '+t.repNr:''].filter(Boolean).join(' · ')||String((t&&t.kundenNr)||'');
  const objektAdresse=String((t&&(t.adresse||t.objektName))||'').trim();
  return {auftraggeber,nutzer,auftragNr,objektAdresse};
}
// Nur leere Felder füllen – was Frank schon eingetragen hat, bleibt stehen. Gibt die Zahl der gefüllten Felder zurück.
function _fsKopfErgaenzen(bericht,t){
  if(!bericht||!bericht.kopf)return 0;
  const v=_fsKopfAusKarte(t);let n=0;
  Object.keys(v).forEach(key=>{if(v[key]&&!String(bericht.kopf[key]||'').trim()){bericht.kopf[key]=v[key];n++;}});
  return n;
}

// Klartext zu einer Messstelle – ohne Emoji (geht auch ins PDF)
function _fsKlartext(w){
  if(!w||w.ofRf===null||w.ofRf===undefined||w.grenzeTs===null||w.grenzeTs===undefined||w.ts===null||w.ts===undefined)return {stufe:'',text:''};
  const ts=_fsEins(w.ts),g=_fsEins(w.grenzeTs),res=w.reserve;
  if(w.ampel==='gruen')return {stufe:'gruen',text:'Keine Schimmelgefahr: Oberfläche '+ts+' °C, kritisch erst unter '+g+' °C (80 % an der Oberfläche) – Reserve '+_fsEins(res)+' K.'};
  if(w.ampel==='gelb')return {stufe:'gelb',text:'Mögliches Schimmelrisiko: Oberfläche '+ts+' °C, nur noch '+_fsEins(res)+' K über der Schimmelgrenze von '+g+' °C.'};
  return {stufe:'rot',text:'Akute Schimmelgefahr: Oberfläche '+ts+' °C liegt '+_fsEins(Math.max(0,-res))+' K unter der Schimmelgrenze von '+g+' °C.'};
}
// Gesamtergebnis über alle Messstellen – die schlechteste Ampel bestimmt die Stufe
function _fsErgebnis(bericht){
  const w=((bericht&&bericht.stellen)||[]).map(st=>_fsStelleWerte(bericht,st));
  const bew=w.filter(x=>x.ampel);
  const z={gruen:0,gelb:0,rot:0};bew.forEach(x=>{z[x.ampel]++;});
  const hinweise=w.reduce((s,x)=>s+x.hinweise.length,0);
  const n=w.length,b=bew.length;
  const stufe=z.rot?'rot':z.gelb?'gelb':b?'gruen':'';
  let text;
  if(!n)text='Noch keine Messstelle.';
  else if(!b)text=n+(n===1?' Messstelle':' Messstellen')+', noch ohne Bewertung (Oberflächentemperatur oder Luftwerte fehlen).';
  else if(n===1)text=_fsKlartext(bew[0]).text.replace(/^[^:]+: /,''); // eine Stelle: Klartext statt Zählung (Überschrift nennt die Stufe)
  else if(stufe==='gruen')text=(b===1?'Keine Schimmelgefahr an der Messstelle':'Keine Schimmelgefahr an allen '+b+' bewerteten Messstellen')+(b<n?' ('+(n-b)+' ohne Bewertung)':'')+'.';
  else text=[z.rot?z.rot+'× akute Schimmelgefahr':'',z.gelb?z.gelb+'× mögliches Schimmelrisiko':'',z.gruen?z.gruen+'× unauffällig':''].filter(Boolean).join(' · ')+(b<n?' · '+(n-b)+' ohne Bewertung':'')+'.';
  if(hinweise)text+=' '+hinweise+(hinweise===1?' Hinweis':' Hinweise')+' beachten.';
  const reserven=bew.map(x=>x.reserve).filter(r=>r!==null&&r!==undefined);
  return {n,bewertet:b,gruen:z.gruen,gelb:z.gelb,rot:z.rot,hinweise,stufe,text,kleinsteReserve:reserven.length?Math.min.apply(null,reserven):null};
}
// Checkliste benutzt? – mindestens ein Punkt nicht mehr „offen" oder eine Notiz
function _fsSektionGenutzt(sek){
  return ((sek&&sek.items)||[]).some(it=>it&&((it.status&&it.status!=='offen')||String(it.notiz||'').trim()||(Array.isArray(it.fotoRefs)&&it.fotoRefs.length>0))); // v296: Foto zählt als geprüft
}

/* ══ v296: FOTOS DIREKT AN DER ZEILE (Messstelle, Checklisten-Punkt) – wie am Dach-Pin ═══════════════════════
   Formular: Miniaturen unter der Notiz, ✕ löst nur die Verknüpfung, Antippen = groß, Knopf öffnet die Foto-Auswahl
   (aufnehmen / Galerie / vorhandenes antippen). PDF: Foto direkt unter der Tabellenzeile (bis 6 cm) UND hinten groß.
   Ins PDF kommen nur Fotos mit ✓ (inReport) – dieselbe Nummer wie im Fotoabschnitt. */
function _fsRefPasst(f,ref){return !!(f&&ref&&(f.driveId===ref||f.localKey===ref||f.localUrl===ref));}
// Fotos einer Zeile, die ins PDF kommen – Nummer wie im Fotoabschnitt, jedes nur einmal
function _fsZeilenFotos(fotoList,refs){
  const out=[];
  (Array.isArray(refs)?refs:[]).forEach(r=>{
    const i=(fotoList||[]).findIndex(f=>_fsRefPasst(f,r));
    if(i>=0&&!out.some(o=>o.nr===i+1))out.push({f:fotoList[i],nr:i+1});
  });
  return out;
}
// Bildunterschrift im Fotoabschnitt: zu welchen Stellen und Prüfpunkten gehört das Foto
function _fsFotoZuordnung(bericht,f){
  const teile=[];
  const st=((bericht&&bericht.stellen)||[]).map((s,i)=>((s&&s.fotoRefs)||[]).some(r=>_fsRefPasst(f,r))?i+1:0).filter(Boolean);
  if(st.length)teile.push('Stelle '+st.join(', '));
  ((bericht&&bericht.sektionen)||[]).forEach(sek=>((sek&&sek.items)||[]).forEach(it=>{
    if(it&&it.text&&(it.fotoRefs||[]).some(r=>_fsRefPasst(f,r)))teile.push(it.text);
  }));
  return teile.join(' · ');
}
function _fsMiniaturQuelle(f,img){
  try{
    const u=String(f.localUrl||'');
    if(u.startsWith('data:')||u.startsWith('blob:')){img.src=u;return;}
    if(f.localKey&&!f.driveId&&typeof _mobPhotoGet==='function'){Promise.resolve(_mobPhotoGet(f.localKey)).then(d=>{if(d){f.localUrl=d;img.src=d;}}).catch(()=>{});return;}
    if(f.driveId){
      const ts=_thumbGespeichert(f);if(ts){img.src=ts;return;}
      Promise.resolve(_mobFetchThumb(f.driveId)).then(d=>{if(d){img.src=d;if(_thumbMerken(f,d))scheduleSave();}}).catch(()=>{});
    }
  }catch(e){console.warn('[Feuchte] Miniatur:',e);}
}
function _fsFotoLeiste(bericht,it,label,kompakt){ // kompakt: nur 📷 (+Zahl) neben der Notiz – die Checkliste bleibt kurz
  if(!Array.isArray(it.fotoRefs))it.fotoRefs=[];
  const w=document.createElement('div');w.setAttribute('data-fs-fotoleiste','1');
  w.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;';
  const neu=()=>{
    w.innerHTML='';
    const fotos=bericht.fotos||[];
    let anz=0;
    it.fotoRefs.forEach((ref,ri)=>{
      const fi=fotos.findIndex(f=>_fsRefPasst(f,ref));
      if(fi<0)return; // Foto unten bei „Fotos" entfernt – der Verweis bleibt stumm
      anz++;
      const f=fotos[fi];
      const th=document.createElement('div');th.setAttribute('data-fs-miniatur',String(ri));
      th.title=f.inReport?'Kommt ins PDF':'Nicht im PDF – unten bei „Fotos" antippen';
      th.style.cssText='position:relative;width:64px;height:64px;border-radius:8px;overflow:hidden;cursor:pointer;flex-shrink:0;background:var(--bg3);border:2px solid '+(f.inReport?'#1a7a3c':'var(--border)')+';';
      const img=document.createElement('img');img.alt='';img.style.cssText='width:100%;height:100%;object-fit:cover;pointer-events:none;';
      _fsMiniaturQuelle(f,img);
      th.onclick=()=>_wpMobOpenFoto(bericht,fi);
      const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Verknüpfung lösen – das Foto bleibt im Protokoll';
      x.style.cssText='position:absolute;top:2px;right:2px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,.65);color:#fff;font-size:12px;line-height:24px;padding:0;cursor:pointer;';
      x.onclick=e=>{e.stopPropagation();it.fotoRefs.splice(ri,1);scheduleSave();neu();};
      th.append(img,x);w.appendChild(th);
    });
    const b=document.createElement('button');b.type='button';b.setAttribute('data-fs-fotoknopf','1');
    b.textContent=kompakt?'📷'+(anz?' '+anz:''):'📷 '+label+(anz?' ('+anz+')':'');
    b.title=label;b.setAttribute('aria-label',label+(anz?' ('+anz+')':''));
    b.style.cssText=(kompakt?'flex:0 0 auto;min-width:52px;':'flex:1 1 160px;')+'min-height:44px;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);background:transparent;color:var(--text);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;';
    b.onclick=()=>_wpMobFotoPickerForItem(bericht,it,neu);
    w.appendChild(b);
  };
  neu();
  return w;
}

// Open-Meteo-Antwort auswerten (reine Funktion). Niederschlag ab 0,2 mm zählt als Regen.
function _fsWetterAuswerten(d){
  const c=(d&&d.current)||{};
  const temp=(typeof c.temperature_2m==='number'&&isFinite(c.temperature_2m))?c.temperature_2m:null;
  const rh=(typeof c.relative_humidity_2m==='number'&&isFinite(c.relative_humidity_2m))?c.relative_humidity_2m:null;
  let wetter='';
  if(typeof c.weather_code==='number'&&typeof _wmoToWetter==='function'){try{wetter=_wmoToWetter(c.weather_code,temp).lbl||'';}catch(e){wetter='';}}
  const tage=(d&&d.daily&&Array.isArray(d.daily.time))?d.daily.time:[];
  const mm=(d&&d.daily&&Array.isArray(d.daily.precipitation_sum))?d.daily.precipitation_sum:[];
  let hi=tage.indexOf(String(c.time||'').slice(0,10));
  if(hi<0)hi=tage.length-1;
  let letzterRegen='';
  if(hi>=0){
    for(let i=hi;i>=0;i--){
      const v=Number(mm[i]);
      if(isFinite(v)&&v>=0.2){const ab=hi-i;letzterRegen=(ab===0?'heute':ab===1?'gestern':'vor '+ab+' Tagen')+', '+_fsEins(v)+' mm';break;}
    }
    if(!letzterRegen)letzterRegen='in den letzten '+hi+' Tagen kein Regen';
  }
  return {wetter,aussenT:temp===null?'':_fsEins(temp),aussenRf:rh===null?'':_fsEins(rh),letzterRegen};
}
// F2a: Wert der Stunde, in der der Termin begann (Open-Meteo „hourly") – reine Funktion. datum „30.09.2026", beginn „08:14" (ab :30 zählt die nächste volle Stunde).
// Gibt ein Objekt in der Form von „current" zurück (passt für _fsWetterAuswerten) oder null, wenn die Stunde nicht in den Daten steht.
function _fsWetterStunde(d,datum,beginn){
  const h=d&&d.hourly;
  if(!h||!Array.isArray(h.time))return null;
  const dm=/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(datum||'').trim()),bm=/^(\d{1,2}):(\d{2})$/.exec(String(beginn||'').trim());
  if(!dm||!bm)return null;
  const p=n=>('0'+n).slice(-2);
  let std=+bm[1]+(+bm[2]>=30?1:0);
  const tag=new Date(+dm[3],+dm[2]-1,+dm[1]);
  if(std>=24){std-=24;tag.setDate(tag.getDate()+1);}
  const key=tag.getFullYear()+'-'+p(tag.getMonth()+1)+'-'+p(tag.getDate())+'T'+p(std)+':00';
  const i=h.time.indexOf(key);
  if(i<0)return null;
  const wert=a=>(Array.isArray(a)&&typeof a[i]==='number'&&isFinite(a[i]))?a[i]:undefined;
  return {time:key,temperature_2m:wert(h.temperature_2m),relative_humidity_2m:wert(h.relative_humidity_2m),weather_code:wert(h.weather_code),stunde:p(std)+':00'};
}
function _fsWetterHolen(bericht,neuBauen){
  if(!navigator.geolocation){toast('📍 Standort nicht verfügbar','error');return;}
  toast('🌤 Standort und Wetter werden geholt …','info',3000);
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const lat=pos.coords.latitude.toFixed(4),lon=pos.coords.longitude.toFixed(4);
      const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon
        +'&current=temperature_2m,relative_humidity_2m,weather_code&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=auto');
      if(!r.ok)throw new Error('HTTP '+r.status);
      let daten=await r.json();
      let stunde=null; // F2a: Begehungsprotokoll mit Beginn-Uhrzeit: Wert der Stunde des Termins statt „jetzt" (passt zu den Messungen)
      if(bericht.fassung==='begehung'&&typeof _fsWetterStunde==='function'&&/^\d{1,2}:\d{2}$/.test(String(bericht.kopf.beginn||'').trim())){
        try{
          const rs=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&hourly=temperature_2m,relative_humidity_2m,weather_code&past_days=7&forecast_days=1&timezone=auto');
          if(rs.ok)stunde=_fsWetterStunde(await rs.json(),bericht.datum,bericht.kopf.beginn);
        }catch(e){console.warn('[Feuchte] Wetter zur Beginn-Zeit:',e);}
        if(stunde)daten=Object.assign({},daten,{current:stunde});
      }
      const w=_fsWetterAuswerten(daten);
      if(w.wetter)bericht.kopf.wetter=w.wetter;
      if(w.aussenT)bericht.kopf.aussenT=w.aussenT;
      if(w.aussenRf)bericht.kopf.aussenRf=w.aussenRf;
      if(w.letzterRegen)bericht.kopf.letzterRegen=w.letzterRegen;
      bericht.kopf.wetterQuelle='Open-Meteo '+new Date().toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
      bericht.kopf.wetterAbruf=new Date().toISOString(); // F2a: Abrufzeit für die Quellenangabe im PDF
      bericht.kopf.wetterStunde=stunde?stunde.stunde:''; // F2a: „08:00" = Stundenwert zur Beginn-Zeit, leer = aktueller Wert zum Abruf
      scheduleSave();
      try{neuBauen();}catch(e){console.warn('[Feuchte] neu aufbauen:',e);}
      toast('✓ '+[w.wetter,w.aussenT?w.aussenT+' °C':'',w.aussenRf?w.aussenRf+' %':''].filter(Boolean).join(' · '),'success',4000);
    }catch(e){console.warn('[Feuchte] Wetter:',e);toast('Wetter nicht abrufbar: '+(e.message||e),'error',5000);}
  },err=>{
    const m={1:'Standort-Zugriff verweigert – bitte in den Einstellungen erlauben.',2:'Standort nicht verfügbar – bitte nochmal versuchen.',3:'Zeitüberschreitung – bitte nochmal versuchen.'};
    toast('📍 '+(m[err&&err.code]||'Standort-Fehler'),'error',5000);
  },{timeout:15000,maximumAge:300000,enableHighAccuracy:false});
}

// Ergebnis-Kasten oben im Formular – Farbe nur im Rand, Schrift bleibt lesbar
function _fsErgebnisZeigen(el,bericht){
  const e=_fsErgebnis(bericht);
  const farbe=e.stufe==='gruen'?'var(--green)':e.stufe==='gelb'?'var(--orange)':e.stufe==='rot'?'var(--red)':'var(--border)';
  el.style.borderLeftColor=farbe;
  el.setAttribute('data-fs-stufe',e.stufe||'keine');
  el.innerHTML='';
  const k=document.createElement('div');k.style.cssText='font-size:17px;font-weight:700;color:var(--text);';
  k.textContent=e.stufe==='gruen'?'✅ Keine Schimmelgefahr':e.stufe==='gelb'?'⚠ Mögliches Schimmelrisiko':e.stufe==='rot'?'⛔ Akute Schimmelgefahr':'ℹ Ergebnis';
  const tx=document.createElement('div');tx.style.cssText='font-size:14px;color:var(--text);margin-top:4px;line-height:1.45;';tx.textContent=e.text;
  el.append(k,tx);
}

// PDF öffnen: das eben erstellte vom Gerät, sonst das in Drive abgelegte
function _fsPdfOeffnen(bericht){
  const blob=_fsPdfBlobs[bericht.id];
  if(blob&&typeof _dateiBlobOeffnen==='function'){_dateiBlobOeffnen(blob,bericht.pdfName||_fsPdfName(bericht));return 'geraet';}
  if(bericht.pdfDriveId){window.open('https://drive.google.com/file/d/'+encodeURIComponent(bericht.pdfDriveId)+'/view','_blank');return 'drive';}
  toast('Noch kein PDF – bitte zuerst „📄 PDF erstellen"','info',3500);
  return '';
}
// PDF als Dokument an der Karte vermerken – dieselbe Datei nie zweimal
function _fsAnhangEintragen(t,id,name){
  if(!t||!id)return null;
  if(!Array.isArray(t.attachments))t.attachments=[];
  const h=new Date();const d=h.getDate()+'.'+(h.getMonth()+1)+'.'+h.getFullYear();
  const da=t.attachments.find(a=>a&&(a.fileId===id||a.driveId===id));
  if(da){da.name=name;da.uploadedAt=d;return da;}
  const e={name,fileId:id,url:'https://drive.google.com/file/d/'+id+'/view',uploadedAt:d};
  t.attachments.push(e);
  return e;
}
// Dokumente-Ordner zuerst (wie PC b624). Gibt es das PDF schon in Drive, wird es ERSETZT statt verdoppelt.
async function _fsPdfNachDrive(blob,name,bericht,t){
  try{
    if(!(typeof tokenValid==='function'&&tokenValid())){toast('ℹ Drive nicht verbunden – PDF nur auf dem Gerät','info',4000);return false;}
    const fid=_extractFolderIdMob((t&&t.dokOrdner)||'')||_extractFolderIdMob((t&&t.gdrive)||'')||_extractFolderIdMob((t&&t.gdriveOrdner)||'');
    if(!fid){toast('ℹ Kein Drive-Ordner an der Karte – PDF nur auf dem Gerät','info',4000);return false;}
    let id=null;
    if(bericht.pdfDriveId){
      const r=await fetch('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(bericht.pdfDriveId)+'?uploadType=media',
        {method:'PATCH',headers:{Authorization:'Bearer '+gdriveToken,'Content-Type':'application/pdf'},body:blob});
      if(r.ok){
        id=bericht.pdfDriveId;
        if(bericht.pdfName&&bericht.pdfName!==name){ // v294: Name mit Uhrzeit nachziehen
          try{await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id),{method:'PATCH',headers:{Authorization:'Bearer '+gdriveToken,'Content-Type':'application/json'},body:JSON.stringify({name:name})});}catch(e){console.warn('[Feuchte] PDF umbenennen:',e);}
        }
      }
    }
    if(!id){
      const form=new FormData();
      form.append('metadata',new Blob([JSON.stringify({name:name,parents:[fid],mimeType:'application/pdf'})],{type:'application/json'}));
      form.append('file',blob);
      const r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {method:'POST',headers:{Authorization:'Bearer '+gdriveToken},body:form});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      id=j.id;
    }
    bericht.pdfDriveId=id;
    bericht.pdfName=name; // v294
    bericht.driveFileId=id; // PC-Menü „In Google Drive öffnen" liest driveFileId
    _fsAnhangEintragen(t,id,name);
    scheduleSave();
    toast('✓ PDF im Dokumente-Ordner der Karte','success',3500);
    return true;
  }catch(e){
    console.warn('[Feuchte] Drive:',e);
    toast('⚠ PDF-Ablage in Drive fehlgeschlagen – liegt auf dem Gerät','error',5000);
    return false;
  }
}

function _openFeuchteprotokollMobil(existingIdx,art){
  const t=currentTask();if(!t)return;
  if(!t.pruefberichte)t.pruefberichte=[];
  let bericht;
  if(typeof existingIdx==='number'&&t.pruefberichte[existingIdx]&&t.pruefberichte[existingIdx].vorlage==='feuchte'){
    bericht=t.pruefberichte[existingIdx];
  }else{
    bericht=_fsNeuerBericht(t,art);
    if(typeof _fsBgUmstellen==='function')_fsBgUmstellen(bericht); // F2a: neue Protokolle starten als Begehungsprotokoll
    t.pruefberichte.push(bericht);
    scheduleSave();
  }
  _fsVervollstaendigen(bericht);

  const GID='_fsMobOverlay';const old=document.getElementById(GID);if(old)old.remove();
  if(typeof _pbOffenMerken==='function')_pbOffenMerken(t,bericht,GID,function(){_neuBauen();}); // v306: nach Neuladen/Zusammenführen an den frischen Stand hängen, bei jüngerer Fassung von drüben neu zeichnen
  const ov=document.createElement('div');ov.id=GID;
  ov.style.cssText='position:fixed;inset:0;z-index:99998;display:flex;flex-direction:column;background:var(--bg);';
  ov._fsBericht=bericht; // F2a: „📘 So geht's" liest daraus, welches Protokoll offen ist

  const S_INP='width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px;font-size:16px;color:var(--text);font-family:inherit;min-width:0;';
  const S_HDR='padding:10px 14px;font-size:13px;font-weight:700;color:var(--text);background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);border-left:4px solid '+FS_FARBE+';';
  const S_RAUMGRID='display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,.9fr) 40px;gap:6px;';
  const S_KNOPF='padding:9px 12px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;font-family:inherit;';

  /* Kopfleiste */
  const hdr=document.createElement('div');
  hdr.style.cssText='background:'+FS_FARBE+';padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.textContent='←';
  closeBtn.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:18px;cursor:pointer;flex-shrink:0;';
  closeBtn.onclick=()=>{ov.remove();try{const ct=currentTask();if(ct)renderDetail(ct);}catch(e){console.warn('[Feuchte] zurück:',e);}};
  const hdrMeta=document.createElement('div');hdrMeta.style.cssText='flex:1;min-width:0;';
  const hdrT=document.createElement('div');hdrT.style.cssText='font-size:15px;font-weight:700;color:#fff;';hdrT.textContent='💧 '+_fsTitel(bericht);
  const hdrS=document.createElement('div');hdrS.style.cssText='font-size:12px;color:rgba(255,255,255,.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  hdrS.textContent=(bericht.kopf.objektAdresse||t.adresse||t.title||'')+' · '+(bericht.datum||'');
  hdrMeta.append(hdrT,hdrS);
  const statsEl=document.createElement('div');statsEl.id='_fsMobStats';
  statsEl.style.cssText='background:rgba(255,255,255,.18);border-radius:6px;padding:3px 8px;font-size:12px;color:#fff;white-space:nowrap;flex-shrink:0;';
  const hilfeBtn=document.createElement('button');hilfeBtn.type='button';hilfeBtn.textContent='📘';hilfeBtn.title="So geht's";hilfeBtn.setAttribute('aria-label',"So geht's – Anleitung"); // v304
  hilfeBtn.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:18px;cursor:pointer;flex-shrink:0;';
  hilfeBtn.onclick=()=>_fsHilfeZeigen();
  hdr.append(closeBtn,hdrMeta,hilfeBtn,statsEl);

  const body=document.createElement('div');
  body.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 0 96px;';

  function _kopfZeile(text){const h=document.createElement('div');h.style.cssText=S_HDR;h.textContent=text;return h;}
  function _inp(wert,ph,onIn,zahl){
    const i=document.createElement('input');i.type='text';i.autocomplete='off';
    i.value=(wert===null||wert===undefined)?'':String(wert);i.placeholder=ph||'';
    if(zahl)i.inputMode='decimal';
    i.style.cssText=S_INP;
    i.oninput=()=>{onIn(i.value);scheduleSave();};
    return i;
  }
  function _feld(label,key,ph,zahl){
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:10px;padding:6px 14px;border-top:1px solid var(--border);';
    const l=document.createElement('span');l.style.cssText='font-size:13px;color:var(--text2);width:112px;flex-shrink:0;';l.textContent=label;
    const i=_inp(bericht.kopf[key],ph,v=>{bericht.kopf[key]=v;if(key==='aussenT'||key==='aussenRf')_fsWerteNeu();if(key==='pruefer'&&bericht.fassung==='begehung'&&typeof _fsBgMerkName==='function')_fsBgMerkName(v);},zahl);
    row.append(l,i);return row;
  }
  function _chip(label,an,fn){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText='padding:8px 14px;border-radius:16px;font-size:14px;cursor:pointer;font-family:inherit;min-height:40px;'
      +'border:2px solid '+(an?FS_FARBE:'var(--border)')+';background:'+(an?'rgba(31,95,139,.18)':'transparent')+';color:var(--text);font-weight:'+(an?'700':'400')+';';
    b.onclick=fn;return b;
  }
  function _neuBauen(){
    const sc=body.scrollTop;
    body.innerHTML='';
    if(bericht.fassung==='begehung'&&typeof _teilKopfBg==='function')body.append(_teilLeiste(),_teilKopfBg(),_bgBlock('raeume',_teilRaeumeBg,'Raumklima'),_bgBlock('stellen',_teilStellenBg,'Messstellen'),_bgBlock('fest',_teilChecklistenBg,'Feststellungen vor Ort'),_bgBlock('angaben',_teilAngabenBg,'Angaben der Nutzer (nicht selbst festgestellt)'),_bgBlock('fazit',_teilZusammenfassungBg,'Zusammenfassung der Feststellungen'),_bgBlock('fotos',_teilFotos,'Fotos')); // F2b: zuklappbar, Leiste oben
    else{
      body.append(_teilErgebnis(),_teilKopf(),_teilRaeume(),_teilStellen(),_teilChecklisten(),_teilBewertung(),_teilFotos()); // v294: Ergebnis oben
      if(typeof _teilUmwandeln==='function'&&body.firstChild&&typeof body.insertBefore==='function')body.insertBefore(_teilUmwandeln(),body.firstChild); // F2a: Hinweis zum Umwandeln ganz oben
    }
    body.scrollTop=sc;
    _fsWerteNeu();
  }
  function _fsStats(){
    const w=bericht.stellen.map(st=>_fsStelleWerte(bericht,st));
    const rot=w.filter(x=>x.ampel==='rot').length;
    statsEl.textContent=bericht.stellen.length+(bericht.stellen.length===1?' Stelle':' Stellen')+((rot&&bericht.fassung!=='begehung')?' · '+rot+' rot':''); // F2a: keine Ampelzählung im Begehungsprotokoll
  }
  function _fsWerteNeu(){
    const a=body.querySelector('[data-fs-aussen]');
    if(a){const td=_fsTaupunkt(bericht.kopf.aussenT,bericht.kopf.aussenRf);a.textContent=td===null?'':'Taupunkt außen '+_fsEins(td)+' °C';}
    body.querySelectorAll('[data-fs-raum]').forEach(el=>{
      const r=bericht.raeume[+el.getAttribute('data-fs-raum')];
      const td=r?_fsTaupunkt(r.t,r.rf):null;
      el.textContent=td===null?'–':_fsEins(td)+' °C';
    });
    body.querySelectorAll('[data-fs-stelle]').forEach(el=>{
      const st=bericht.stellen[+el.getAttribute('data-fs-stelle')];
      if(st&&bericht.fassung==='begehung'&&typeof _fsWerteZeileBg==='function'){_fsWerteZeileBg(el,_fsStelleWerte(bericht,st),st);return;} // F2a
      if(st)_fsWerteZeile(el,_fsStelleWerte(bericht,st),st);
    });
    const eg=body.querySelector('[data-fs-ergebnis]');if(eg)_fsErgebnisZeigen(eg,bericht); // v294
    _fsStats();
  }

  function _teilErgebnis(){ // v294
    const e=document.createElement('div');e.setAttribute('data-fs-ergebnis','1');
    e.style.cssText='margin:10px;padding:12px 14px;border-radius:10px;background:var(--bg2);border:1px solid var(--border);border-left:6px solid var(--border);';
    return e;
  }

  function _teilKopf(){
    const w=document.createElement('div');
    const hilfen=document.createElement('div');hilfen.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;'; // v294
    const hk=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText=S_KNOPF+'min-height:44px;border:1.5px solid '+FS_FARBE+';background:transparent;color:var(--text);';b.onclick=fn;return b;};
    hilfen.append(
      hk('↻ aus Karte',()=>{const n=_fsKopfErgaenzen(bericht,t);scheduleSave();_neuBauen();toast(n?'✓ '+n+(n===1?' Feld':' Felder')+' aus der Karte übernommen':'ℹ Nichts zu übernehmen – Felder schon gefüllt oder keine Angaben an der Karte','info',3500);}),
      hk('🌤 Wetter holen',()=>_fsWetterHolen(bericht,_neuBauen)));
    w.append(_kopfZeile('Auftrag und Termin'),hilfen,
      _feld('Auftraggeber','auftraggeber','aus der Karte'),
      _feld('Objekt','objektAdresse','aus der Karte'),
      _feld('Auftrag-Nr.','auftragNr',''),
      _feld('Nutzer / Mieter','nutzer',''),
      _feld('Anwesend','anwesend',''),
      _feld('Uhrzeit','uhrzeit','hh:mm'),
      _feld('Wetter','wetter','z. B. bewölkt'),
      _feld('Letzter Regen','letzterRegen','Tag, wie stark'),
      _feld('Außen °C','aussenT','z. B. 12,5',true),
      _feld('Außen % rF','aussenRf','z. B. 80',true));
    const td=document.createElement('div');td.setAttribute('data-fs-aussen','1');
    td.style.cssText='padding:0 14px 6px 136px;font-size:13px;color:var(--text2);';
    w.append(td,_feld('Messgeräte','messgeraete','z. B. testo 605i / 805i'),_feld('Prüfer','pruefer',''));
    return w;
  }

  function _teilRaeume(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Raumklima'));
    if(bericht.raeume.length){
      const kz=document.createElement('div');kz.style.cssText=S_RAUMGRID+'padding:6px 14px 0;font-size:12px;color:var(--text2);';
      ['Raum','°C','% rF','Taupunkt',''].forEach(x=>{const s=document.createElement('span');s.textContent=x;kz.appendChild(s);});
      w.appendChild(kz);
    }
    bericht.raeume.forEach((r,ri)=>{
      const row=document.createElement('div');row.style.cssText=S_RAUMGRID+'padding:6px 14px;align-items:center;';
      const nameI=_inp(r.name,'Raum',v=>{r.name=v;},false);
      let altName=r.name;
      nameI.onfocus=()=>{altName=r.name;};
      nameI.onchange=()=>{
        const neu=r.name;
        if(altName&&neu!==altName)bericht.stellen.forEach(st=>{if(st.raum===altName)st.raum=neu;});
        scheduleSave();_neuBauen();
      };
      const tI=_inp(r.t,'°C',v=>{r.t=v;_fsWerteNeu();},true);
      const fI=_inp(r.rf,'%',v=>{r.rf=v;_fsWerteNeu();},true);
      const td=document.createElement('span');td.setAttribute('data-fs-raum',String(ri));
      td.style.cssText='font-size:14px;color:var(--text);text-align:center;';
      const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Raum entfernen';
      x.style.cssText='width:40px;height:40px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:15px;cursor:pointer;';
      x.onclick=()=>{if(!confirm('Raum „'+(r.name||'ohne Namen')+'" entfernen?'))return;bericht.raeume.splice(ri,1);scheduleSave();_neuBauen();};
      row.append(nameI,tI,fI,td,x);
      w.appendChild(row);
    });
    const chips=document.createElement('div');chips.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px 12px;';
    const vorhanden=bericht.raeume.map(r=>r.name);
    const fehlendeWohnung=FS_WOHNUNG.filter(n=>vorhanden.indexOf(n)<0); // v294
    if(!_fsIstKeller(bericht)&&fehlendeWohnung.length>1)chips.appendChild(_chip('＋ Wohnung ('+fehlendeWohnung.length+' Räume)',false,()=>{fehlendeWohnung.forEach(n=>bericht.raeume.push({name:n,t:'',rf:''}));scheduleSave();_neuBauen();}));
    _fsRaumVorschlaege(bericht).filter(n=>vorhanden.indexOf(n)<0).forEach(n=>{
      chips.appendChild(_chip('＋ '+n,false,()=>{bericht.raeume.push({name:n,t:'',rf:''});scheduleSave();_neuBauen();}));
    });
    chips.appendChild(_chip('＋ anderer Raum',false,()=>{
      const n=prompt('Name des Raums:');
      if(n&&n.trim()){bericht.raeume.push({name:n.trim(),t:'',rf:''});scheduleSave();_neuBauen();}
    }));
    w.appendChild(chips);
    return w;
  }

  function _teilStellen(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Messstellen'));
    const info=document.createElement('div');info.style.cssText='padding:6px 14px 2px;font-size:12px;color:var(--text2);';
    info.textContent='Oberfläche mit dem Infrarot-Thermometer. Bauteilfeuchte in Digits – immer eine trockene Stelle zum Vergleich messen.'
      +(_fsIstKeller(bericht)?' Im Keller an derselben Wand in mehreren Höhen messen (z. B. 10, 50, 100 cm) – jede Höhe eine eigene Stelle.':'');
    w.appendChild(info);
    const raumNamen=bericht.raeume.map(r=>r.name).filter(Boolean);
    bericht.stellen.forEach((st,si)=>{
      const card=document.createElement('div');
      card.style.cssText='margin:8px 10px;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--bg2);';
      const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;gap:8px;';
      const nr=document.createElement('span');nr.textContent=String(si+1);
      nr.style.cssText='width:30px;height:30px;border-radius:50%;background:'+FS_FARBE+';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;';
      const txtI=_inp(st.text,_fsIstKeller(bericht)?'Stelle, z. B. Außenwand 10 cm':'Stelle, z. B. Außenecke oben',v=>{st.text=v;},false);
      txtI.setAttribute('data-fs-stellentext',String(si));
      const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Messstelle entfernen';
      x.style.cssText='width:40px;height:40px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:15px;cursor:pointer;flex-shrink:0;';
      x.onclick=()=>{if(!confirm('Messstelle '+(si+1)+' entfernen?'))return;bericht.stellen.splice(si,1);scheduleSave();_neuBauen();};
      top.append(nr,txtI,x);

      const sel=document.createElement('select');
      sel.style.cssText=S_INP+'margin-top:8px;';
      const opt0=document.createElement('option');opt0.value='';opt0.textContent='– Raum wählen (für Taupunkt) –';sel.appendChild(opt0);
      const namen=raumNamen.slice();
      if(st.raum&&namen.indexOf(st.raum)<0)namen.push(st.raum);
      namen.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n+(raumNamen.indexOf(n)<0?' (nicht im Raumklima)':'');sel.appendChild(o);});
      sel.value=st.raum||'';
      sel.onchange=()=>{st.raum=sel.value;scheduleSave();_fsWerteNeu();};

      const gr=document.createElement('div');gr.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px;';
      [['Oberfläche °C','ts'],['Bauteil (Digits)','mf'],['Vergleich trocken','mfVergleich']].forEach(([lab,key])=>{
        const z=document.createElement('label');z.style.cssText='display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--text2);min-width:0;';
        const s=document.createElement('span');s.textContent=lab;
        z.append(s,_inp(st[key],'',v=>{st[key]=v;_fsWerteNeu();},true));
        gr.appendChild(z);
      });

      let luftGr=null; // v294: Luft der testo-Messung änderbar (leer = Raumklima)
      if(st.testo||_fsZahl(st.luftT)!==null||_fsZahl(st.luftRf)!==null){
        luftGr=document.createElement('div');luftGr.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px;';
        [['Luft °C (Messung)','luftT'],['Luft % rF (Messung)','luftRf']].forEach(([lab,key])=>{
          const z=document.createElement('label');z.style.cssText='display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--text2);min-width:0;';
          const s=document.createElement('span');s.textContent=lab;
          const li=_inp(st[key],'leer = Raumklima',v=>{st[key]=v;_fsWerteNeu();},true);li.setAttribute('data-fs-luft',key);
          z.append(s,li);luftGr.appendChild(z);
        });
      }
      const bf=document.createElement('div');bf.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;';
      FS_BEFUNDE.forEach(b=>{
        bf.appendChild(_chip(b,st.befund.indexOf(b)>=0,()=>{
          const ix=st.befund.indexOf(b);
          if(ix>=0)st.befund.splice(ix,1);
          else{
            if(b!=='Schimmel')st.befund=st.befund.filter(x=>x==='Schimmel'); // trocken/feucht/nass schließen sich aus
            st.befund.push(b);
          }
          scheduleSave();_neuBauen();
        }));
      });

      const werte=document.createElement('div');werte.setAttribute('data-fs-stelle',String(si));
      werte.style.cssText='margin-top:8px;padding:8px;border-radius:8px;background:var(--bg3);';

      const notiz=_inp(st.notiz,'Notiz …',v=>{st.notiz=v;},false);
      notiz.style.marginTop='8px';

      const fotoLeiste=_fsFotoLeiste(bericht,st,'Fotos zu dieser Stelle'); // v296: Miniaturen direkt an der Stelle

      card.append(top,sel,gr);
      if(luftGr)card.appendChild(luftGr);
      card.append(bf,werte,notiz,fotoLeiste);
      w.appendChild(card);
    });
    const add=document.createElement('button');add.type='button';add.textContent='＋ Messstelle';
    add.style.cssText=S_KNOPF+'display:block;width:calc(100% - 20px);margin:8px 10px 14px;border:1.5px dashed '+FS_FARBE+';background:rgba(31,95,139,.08);color:var(--text);';
    add.onclick=()=>{
      const letzte=bericht.stellen[bericht.stellen.length-1];
      bericht.stellen.push({text:'',raum:letzte?letzte.raum:'',ts:'',mf:'',mfVergleich:'',befund:[],notiz:'',fotoRefs:[]});
      scheduleSave();_neuBauen();
      const neu=body.querySelector('[data-fs-stellentext="'+(bericht.stellen.length-1)+'"]');
      if(neu){try{neu.scrollIntoView({block:'center'});}catch(e){}neu.focus();}
    };
    w.appendChild(add);
    const testoBtn=document.createElement('button');testoBtn.type='button';testoBtn.textContent='📥 testo-Messung einlesen'; // v292
    testoBtn.style.cssText=S_KNOPF+'display:block;width:calc(100% - 20px);margin:0 10px 14px;border:1.5px solid '+FS_FARBE+';background:transparent;color:var(--text);';
    testoBtn.onclick=()=>_fsTestoEinlesen(bericht,t,_neuBauen);
    w.appendChild(testoBtn);
    return w;
  }

  function _teilChecklisten(){
    const w=document.createElement('div');
    const stufen=[{k:'ok',t:'✓ unauffällig',c:'var(--green)'},{k:'mangel',t:'⚠ auffällig',c:'var(--red)'},{k:'offen',t:'○ offen',c:'var(--text2)'}];
    const zuListe=_fsZuLesen(bericht.id); // v304: eingeklappte Abschnitte (nur auf diesem Gerät)
    const umschalten=(si,zu)=>{
      _fsZuSetzen(bericht.id,si,zu);_neuBauen();
      if(zu){const k=body.querySelector('[data-fs-sek="'+si+'"]');if(k){try{k.scrollIntoView({block:'start'});}catch(e){}}}
    };
    bericht.sektionen.forEach((sek,si)=>{
      if(!Array.isArray(sek.items))sek.items=[];
      const zu=zuListe.indexOf(si)>=0;
      const kopf=document.createElement('button');kopf.type='button';kopf.setAttribute('data-fs-sek',String(si));
      kopf.setAttribute('aria-expanded',zu?'false':'true');
      kopf.style.cssText=S_HDR+'display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;font-family:inherit;border-right:none;';
      const pfeil=document.createElement('span');pfeil.textContent=zu?'▸':'▾';pfeil.style.cssText='width:16px;flex-shrink:0;';
      const kt=document.createElement('span');kt.textContent=sek.titel||'';kt.style.cssText='flex:1;min-width:0;';
      kopf.append(pfeil,kt);
      if(zu){const kurz=document.createElement('span');kurz.setAttribute('data-fs-sekkurz',String(si));kurz.textContent=_fsSektionKurz(sek);
        kurz.style.cssText='font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap;flex-shrink:0;';kopf.appendChild(kurz);}
      kopf.onclick=()=>umschalten(si,!zu);
      w.appendChild(kopf);
      if(zu)return;
      sek.items.forEach(it=>{
        const row=document.createElement('div');row.style.cssText='padding:10px 14px;border-bottom:1px solid var(--border);';
        const txt=document.createElement('div');txt.style.cssText='font-size:14px;color:var(--text);margin-bottom:6px;';txt.textContent=it.text||'';
        const knr=document.createElement('div');knr.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;';
        stufen.forEach(s=>{
          const an=(it.status||'offen')===s.k;
          const b=document.createElement('button');b.type='button';b.textContent=s.t;
          b.style.cssText='padding:8px 4px;min-height:40px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;'
            +'border:2px solid '+(an?s.c:'var(--border)')+';background:'+(an?'var(--bg3)':'transparent')+';color:'+(an?s.c:'var(--text2)')+';';
          b.onclick=()=>{it.status=s.k;scheduleSave();_neuBauen();};
          knr.appendChild(b);
        });
        const n=_inp(it.notiz,'Notiz …',v=>{it.notiz=v;},false);n.style.marginTop='6px';
        const nz=document.createElement('div');nz.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;'; // v296: Notiz und Foto in einer Zeile
        n.style.marginTop='0';n.style.flex='1 1 180px';n.style.minWidth='0';
        const fl=_fsFotoLeiste(bericht,it,'Foto zu diesem Punkt',true);fl.style.marginTop='0';fl.style.flex='0 1 auto';
        nz.append(n,fl);
        row.append(txt,knr,nz);
        w.appendChild(row);
      });
      const frei=document.createElement('button');frei.type='button';frei.textContent='＋ Freier Eintrag';
      frei.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:8px 14px;border:1px dashed var(--border);background:transparent;color:var(--text2);';
      frei.onclick=()=>{const tx=prompt('Prüfpunkt:');if(tx&&tx.trim()){sek.items.push({text:tx.trim(),status:'offen',notiz:''});scheduleSave();_neuBauen();}};
      w.appendChild(frei);
      const ein=document.createElement('button');ein.type='button';ein.textContent='▲ Abschnitt einklappen';ein.setAttribute('data-fs-einklappen',String(si)); // v304
      ein.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:0 14px 12px;border:1.5px solid '+FS_FARBE+';background:transparent;color:var(--text);';
      ein.onclick=()=>umschalten(si,true);
      w.appendChild(ein);
    });
    return w;
  }

  function _teilBewertung(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Bewertung'));
    const wahl=document.createElement('div');wahl.style.cssText='display:flex;flex-direction:column;gap:6px;padding:8px 14px;';
    _fsBewertungenFuer(bericht).forEach(bw=>{
      const c=_chip(bw.k+' · '+bw.text,bericht.bewertung===bw.k,()=>{bericht.bewertung=(bericht.bewertung===bw.k)?'':bw.k;scheduleSave();_neuBauen();});
      c.style.textAlign='left';c.style.borderRadius='10px';
      wahl.appendChild(c);
    });
    const ta=(wert,ph,fn)=>{const a=document.createElement('textarea');a.rows=4;a.value=wert||'';a.placeholder=ph;
      a.style.cssText=S_INP+'resize:vertical;margin-top:6px;';a.oninput=()=>{fn(a.value);scheduleSave();};return a;};
    const box=document.createElement('div');box.style.cssText='padding:0 14px 14px;';
    box.append(ta(bericht.bemerkung,'Begründung / Gesamtbeurteilung …',v=>{bericht.bemerkung=v;}),
      ta(bericht.empfehlungen,'Empfehlungen …',v=>{bericht.empfehlungen=v;}));
    w.append(wahl,box);
    return w;
  }

  function _teilFotos(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Fotos'));
    const info=document.createElement('div');info.style.cssText='padding:6px 14px;font-size:12px;color:var(--text2);';
    info.textContent='Antippen = im PDF ✓ · zweimal antippen = groß ansehen';
    const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:0 14px 8px;';
    grid.id='_wpMobFotoGrid'; // derselbe Name wie im Wartungsprotokoll: der Foto-Dialog zieht die Miniaturen hierüber nach
    _wpMobRenderFotos(bericht,grid);
    const kr=document.createElement('div');kr.style.cssText='display:flex;gap:8px;padding:0 14px 16px;';
    const mk=(txt,stil,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText=S_KNOPF+'flex:1;'+stil;b.onclick=fn;return b;};
    kr.append(
      mk('📷 Kamera','border:1.5px dashed var(--accent2);background:transparent;color:var(--text);',()=>_wpMobFotoAufnehmen(bericht,grid,true)),
      mk('🖼 Galerie','border:1.5px solid var(--border);background:var(--bg3);color:var(--text);',()=>_wpMobFotoAufnehmen(bericht,grid,false)),
      mk('☁ Drive','border:1.5px dashed var(--green);background:transparent;color:var(--text);',()=>_wpMobLadeDriveFotos(bericht,grid)));
    w.append(info,grid,kr);
    return w;
  }

  /* ── F2a: Begehungsprotokoll – Formularteile ─────────────────────────────────────────────────────
     Neutral gehalten: Die Knöpfe zeigen die Sätze, die später im PDF stehen – ohne Ampelfarbe, ohne „auffällig". */
  function _bgTextFeld(wert,ph,onIn,zeilen){
    const a=document.createElement('textarea');a.rows=zeilen||3;a.value=wert||'';a.placeholder=ph||'';
    a.style.cssText=S_INP+'resize:vertical;';
    a.oninput=()=>{onIn(a.value);scheduleSave();};
    return a;
  }
  function _bgXKnopf(titel,fn){
    const x=document.createElement('button');x.type='button';x.textContent='✕';x.title=titel;x.setAttribute('aria-label',titel);
    x.style.cssText='width:40px;height:40px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:15px;cursor:pointer;flex-shrink:0;';
    x.onclick=fn;return x;
  }
  function _bgInfo(text){
    const d=document.createElement('div');d.style.cssText='padding:6px 14px;font-size:12px;color:var(--text2);line-height:1.45;';d.textContent=text;return d;
  }
  function _bgNamenListe(){ // „Name (Rolle)" aller eingetragenen Anwesenden
    return (bericht.anwesende||[]).filter(p=>p&&String(p.name||'').trim())
      .map(p=>String(p.name).trim()+(String(p.rolle||'').trim()?' ('+String(p.rolle).trim()+')':''));
  }

  // Altes Protokoll: Hinweis mit Knopf zum Umwandeln (nichts geschieht ohne Rückfrage)
  function _teilUmwandeln(){
    const w=document.createElement('div');w.setAttribute('data-fs-umwandeln','1');
    w.style.cssText='margin:10px;padding:10px 12px;border-radius:10px;background:var(--bg2);border:1px solid var(--border);border-left:6px solid var(--orange);font-size:13px;color:var(--text);line-height:1.45;';
    const tx=document.createElement('div');
    tx.textContent='Das ist noch das alte Feuchte- und Schimmelprotokoll. Das neue Begehungsprotokoll hält nur Feststellungen fest: keine Ampel, keine Ursache, keine Empfehlung.';
    const b=document.createElement('button');b.type='button';b.textContent='🔄 In Begehungsprotokoll umwandeln';b.setAttribute('data-fs-umwandeln-knopf','1');
    b.style.cssText=S_KNOPF+'margin-top:8px;min-height:44px;border:1.5px solid '+FS_FARBE+';background:transparent;color:var(--text);';
    b.onclick=()=>{
      if(!confirm('In Begehungsprotokoll umwandeln?\n\nAlle Eingaben, Fotos und Messwerte bleiben erhalten. Im PDF stehen künftig nur Feststellungen: Ampel, Ergebnis, Taupunkt-Werte, Ursache und Empfehlungen entfallen (sie bleiben in den Daten). Einige Punkte müssen neu beantwortet werden.'))return;
      const r=_fsZuBegehung(bericht);
      scheduleSave();
      hdrT.textContent='💧 '+_fsTitel(bericht);
      _neuBauen();
      toast(r.gewandelt?'✓ Umgewandelt'+(r.neu.length?' – '+r.neu.length+(r.neu.length===1?' Punkt':' Punkte')+' bitte neu beantworten':''):'ℹ Schon ein Begehungsprotokoll','success',5000);
    };
    w.append(tx,b);return w;
  }

  function _geraetFeld(label,key,vorschlag,chipText){
    const w=document.createElement('div');
    w.appendChild(_feld(label,key,'z. B. '+chipText));
    if(!String(bericht.kopf[key]||'').trim()){
      const c=document.createElement('div');c.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px 136px;';
      c.appendChild(_chip('＋ '+chipText,false,()=>{bericht.kopf[key]=vorschlag;scheduleSave();_neuBauen();}));
      w.appendChild(c);
    }
    return w;
  }

  function _teilAnwesende(){
    const w=document.createElement('div');w.setAttribute('data-fs-anwesende','1');
    w.style.cssText='padding:6px 14px 8px;border-top:1px solid var(--border);';
    const kopf=document.createElement('div');kopf.style.cssText='font-size:13px;color:var(--text2);margin-bottom:6px;';kopf.textContent='Anwesend – Name und Rolle';
    w.appendChild(kopf);
    const altText=String(bericht.kopf.anwesend||'').trim();
    if(!bericht.anwesende.length&&altText){
      const h=document.createElement('div');h.style.cssText='font-size:12px;color:var(--text2);margin-bottom:6px;padding-left:8px;border-left:3px solid var(--orange);line-height:1.45;';
      h.textContent='Bisher als Text eingetragen: '+altText+' – bitte unten als Personen anlegen.';
      w.appendChild(h);
    }
    bericht.anwesende.forEach((p,pi)=>{
      const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 40px;gap:6px;margin-bottom:6px;align-items:center;';
      const n=_inp(p.name,'Name',v=>{p.name=v;},false);n.setAttribute('data-fs-person',String(pi));
      const sel=document.createElement('select');sel.style.cssText=S_INP;
      const o0=document.createElement('option');o0.value='';o0.textContent='– Rolle –';sel.appendChild(o0);
      const rollen=FS_BG_ROLLEN.slice();if(p.rolle&&rollen.indexOf(p.rolle)<0)rollen.push(p.rolle);
      rollen.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;sel.appendChild(o);});
      sel.value=p.rolle||'';
      sel.onchange=()=>{p.rolle=sel.value;scheduleSave();_neuBauen();};
      const x=_bgXKnopf('Person entfernen',()=>{if(String(p.name||'').trim()&&!confirm('„'+String(p.name).trim()+'" entfernen?'))return;bericht.anwesende.splice(pi,1);scheduleSave();_neuBauen();});
      row.append(n,sel,x);w.appendChild(row);
    });
    const chips=document.createElement('div');chips.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding-top:2px;';
    chips.appendChild(_chip('＋ Person',false,()=>{
      bericht.anwesende.push({name:'',rolle:''});scheduleSave();_neuBauen();
      const neu=body.querySelector('[data-fs-person="'+(bericht.anwesende.length-1)+'"]');
      if(neu){try{neu.scrollIntoView({block:'center'});}catch(e){}neu.focus();}
    }));
    const schon=new Set(bericht.anwesende.map(p=>String(p.name||'').trim().toLowerCase()));
    const ich=String(bericht.kopf.pruefer||'').trim();
    if(ich&&!schon.has(ich.toLowerCase()))chips.appendChild(_chip('＋ '+ich+' (Aufgenommen von)',false,()=>{bericht.anwesende.push({name:ich,rolle:'Aufgenommen von'});scheduleSave();_neuBauen();}));
    let n=0;
    (Array.isArray(t.kontakte)?t.kontakte:[]).forEach(kx=>{
      const nm=_fsKontaktName(kx);
      if(!nm||schon.has(nm.toLowerCase())||n>=8)return;
      n++;
      const rolle=kx.rolle==='mieter'?'Nutzer':(['ag','privatkunde','eigentuemer','hausverwaltung'].indexOf(kx.rolle)>=0?'Vertreter Auftraggeber':'');
      chips.appendChild(_chip('＋ '+nm,false,()=>{bericht.anwesende.push({name:nm,rolle});scheduleSave();_neuBauen();}));
    });
    w.appendChild(chips);
    return w;
  }

  /* ── F2b: Bedienung – jeder Abschnitt lässt sich zuklappen, oben eine Leiste zum Springen ──────────────
     Gemerkt wird je GERÄT im Browser-Speicher (wie bei den Feststellungs-Abschnitten), NICHT am Protokoll – sonst käme es
     aufs andere Gerät mit. Das PDF zeigt immer alles. Standard: alles aufgeklappt. */
  function _bgZu(k){return _fsZuLesen(bericht.id).indexOf('b:'+k)>=0;}
  function _bgNurDieser(){try{return localStorage.getItem('pam_fs_nurDieser')==='1';}catch(e){return false;}}
  // Kurzfassung, die neben einem zugeklappten Abschnitt steht – nur Zahlen und Stichworte, keine Wertung
  function _bgKurz(k){
    const kf=bericht.kopf||{};
    const gef=arr=>arr.filter(x=>String(kf[x]||'').trim()).length;
    const plural=(n,e,m)=>n+' '+(n===1?e:m);
    if(k==='auftrag')return gef(['auftraggeber','objektAdresse','auftragNr','nutzer','anlass'])+' von 5 ausgefüllt';
    if(k==='termin'){
      const n=(bericht.anwesende||[]).filter(p=>p&&String(p.name||'').trim()).length;
      return [_fsBgZeitText(kf),n?plural(n,'Person','Personen'):''].filter(Boolean).join(' · ')||'noch leer';
    }
    if(k==='geraete'){const n=gef(['geraetLuft','geraetOberflaeche','geraetBauteil']);return n?plural(n,'Gerät','Geräte'):'noch leer';}
    if(k==='raeume'){const n=(bericht.raeume||[]).length,nw=(bericht.raeume||[]).reduce((s,r)=>s+((r&&r.waende)||[]).length,0);return n?plural(n,'Raum','Räume')+(nw?' · '+plural(nw,'Wand','Wände'):''):'noch kein Raum';}
    if(k==='stellen'){const n=(bericht.stellen||[]).length;return n?plural(n,'Stelle','Stellen'):'noch keine Stelle';}
    if(k==='fest'){
      let da=0,offen=0;
      (bericht.sektionen||[]).forEach(s=>((s&&s.items)||[]).forEach(i=>{if(i.typ==='notiz')return;if(i.frei||i.status==='ok'||i.status==='mangel')da++;else offen++;}));
      return [da?da+' erfasst':'',offen?offen+' offen':''].filter(Boolean).join(' · ')||'keine Punkte';
    }
    if(k==='angaben'){const a=bericht.angaben||[];return a.filter(x=>x&&String(x.text||'').trim()).length+' von '+a.length+' beantwortet';}
    if(k==='fazit')return String(bericht.bemerkung||'').trim()?'ausgefüllt':'noch leer';
    if(k==='fotos'){const f=bericht.fotos||[];return f.length?plural(f.length,'Foto','Fotos')+' ('+f.filter(x=>x&&x.inReport).length+' im PDF)':'noch kein Foto';}
    return '';
  }
  // Ein Abschnitt mit Pfeil in der Überschrift. bauFn baut den Inhalt (erst wenn aufgeklappt); hat der Inhalt schon eine eigene
  // Überschrift (kopfText), wird sie entfernt – die Überschrift ist jetzt der Pfeil-Knopf.
  function _bgBlock(k,bauFn,kopfText){
    const def=FS_BG_BLOECKE.find(b=>b.k===k)||{t:k};
    const zu=_bgZu(k);
    const w=document.createElement('div');w.setAttribute('data-fs-block',k);w.style.scrollMarginTop='56px';
    const kopf=document.createElement('button');kopf.type='button';kopf.setAttribute('data-fs-blockkopf',k);kopf.setAttribute('aria-expanded',zu?'false':'true');
    kopf.style.cssText=S_HDR+'display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;font-family:inherit;border-right:none;';
    const pfeil=document.createElement('span');pfeil.textContent=zu?'▸':'▾';pfeil.style.cssText='width:16px;flex-shrink:0;';
    const kt=document.createElement('span');kt.textContent=def.t;kt.style.cssText='flex:1;min-width:0;';
    kopf.append(pfeil,kt);
    if(zu){const kurz=document.createElement('span');kurz.setAttribute('data-fs-blockkurz',k);kurz.textContent=_bgKurz(k);
      kurz.style.cssText='font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap;flex-shrink:0;';kopf.appendChild(kurz);}
    kopf.onclick=()=>{
      _fsZuSetzen(bericht.id,'b:'+k,!zu);_neuBauen();
      const el=body.querySelector('[data-fs-block="'+k+'"]');if(el){try{el.scrollIntoView({block:'nearest'});}catch(e){}}
    };
    w.appendChild(kopf);
    if(!zu){
      const inhalt=bauFn();
      if(kopfText&&inhalt.firstChild&&inhalt.firstChild.textContent===kopfText)inhalt.removeChild(inhalt.firstChild);
      w.appendChild(inhalt);
    }
    return w;
  }
  function _bgSpringe(k){ // Leiste: Abschnitt aufklappen und hinscrollen; mit „Nur dieser" gehen alle anderen zu
    const alle=FS_BG_BLOECKE.map(b=>'b:'+b.k);
    if(_bgNurDieser())_fsZuMehrere(bericht.id,alle.filter(x=>x!=='b:'+k),true);
    _fsZuMehrere(bericht.id,['b:'+k],false);
    _neuBauen();
    const el=body.querySelector('[data-fs-block="'+k+'"]');if(el){try{el.scrollIntoView({block:'start'});}catch(e){}}
  }
  function _teilLeiste(){
    const w=document.createElement('div');w.setAttribute('data-fs-leiste','1');
    w.style.cssText='position:sticky;top:0;z-index:6;background:var(--bg);border-bottom:1px solid var(--border);padding:6px 10px;display:flex;gap:6px;align-items:center;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;';
    const alle=FS_BG_BLOECKE.map(b=>b.k);
    const offene=alle.filter(k=>!_bgZu(k)).length;
    const nur=_bgNurDieser();
    const mk=(txt,an,fn,attr)=>{
      const b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute(attr[0],attr[1]);
      b.style.cssText='flex:0 0 auto;padding:6px 12px;min-height:40px;border-radius:18px;font-size:13px;cursor:pointer;font-family:inherit;'
        +'border:2px solid '+(an?FS_FARBE:'var(--border)')+';background:'+(an?'rgba(31,95,139,.18)':'transparent')+';color:var(--text);font-weight:'+(an?'700':'600')+';';
      b.onclick=fn;return b;
    };
    w.appendChild(mk(offene?'▸ Alles zu':'▾ Alles auf',false,()=>{_fsZuMehrere(bericht.id,alle.map(k=>'b:'+k),!!offene);_neuBauen();},['data-fs-alles','1']));
    w.appendChild(mk(nur?'✓ Nur dieser':'Nur dieser',nur,()=>{try{localStorage.setItem('pam_fs_nurDieser',nur?'0':'1');}catch(e){}_neuBauen();},['data-fs-nur','1']));
    FS_BG_BLOECKE.forEach(b=>w.appendChild(mk(b.c,false,()=>_bgSpringe(b.k),['data-fs-sprung',b.k])));
    return w;
  }

  // Inhalt „Auftrag und Umfang" (ohne eigene Überschrift – die ist der Pfeil-Knopf)
  function _teilAuftragBg(){
    const w=document.createElement('div');
    const hilfen=document.createElement('div');hilfen.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;';
    const hk=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText=S_KNOPF+'min-height:44px;border:1.5px solid '+FS_FARBE+';background:transparent;color:var(--text);';b.onclick=fn;return b;};
    hilfen.append(hk('↻ aus Karte',()=>{const n=_fsKopfErgaenzen(bericht,t);scheduleSave();_neuBauen();toast(n?'✓ '+n+(n===1?' Feld':' Felder')+' aus der Karte übernommen':'ℹ Nichts zu übernehmen – Felder schon gefüllt oder keine Angaben an der Karte','info',3500);}));
    w.append(hilfen,
      _feld('Auftraggeber','auftraggeber','aus der Karte'),
      _feld('Objekt','objektAdresse','aus der Karte'),
      _feld('Auftrag-Nr.','auftragNr',''),
      _feld('Nutzer / Mieter','nutzer',''),
      _feld('Anlass','anlass','z. B. Meldung des Mieters über …'));
    return w;
  }
  // Inhalt „Ortstermin": Beginn/Ende, Anwesende, Wetter, Aufgenommen von
  function _teilTerminBg(){
    const holeWetter=_fsWetterHolen; // gleicher Ablauf wie im alten Kopf – Knopf, kein automatisches Holen
    const w=document.createElement('div');
    const hilfen=document.createElement('div');hilfen.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;';
    const wb=document.createElement('button');wb.type='button';wb.textContent='🌤 Wetter holen';
    wb.style.cssText=S_KNOPF+'min-height:44px;border:1.5px solid '+FS_FARBE+';background:transparent;color:var(--text);';
    wb.onclick=()=>holeWetter(bericht,_neuBauen);
    hilfen.appendChild(wb);
    w.append(
      _feld('Beginn','beginn','hh:mm'),
      _feld('Ende','ende','hh:mm'),
      _teilAnwesende(),
      hilfen,
      _feld('Wetter','wetter','z. B. bewölkt'),
      _feld('Letzter Regen','letzterRegen','Tag, wie stark'),
      _feld('Außen °C','aussenT','z. B. 12,5',true),
      _feld('Außen % rF','aussenRf','z. B. 80',true));
    const td=document.createElement('div');td.setAttribute('data-fs-aussen','1');
    td.style.cssText='padding:0 14px 6px 136px;font-size:13px;color:var(--text2);';
    w.appendChild(td);
    const q=_fsBgWetterQuelle(bericht.kopf);
    if(q)w.appendChild(_bgInfo(q.replace(/^Angabe des Wetterdienstes /,'Quelle: ')));
    const prRow=_feld('Aufgenommen von','pruefer','Name – das Gerät merkt ihn sich');
    const prIn=prRow.querySelector?prRow.querySelector('input'):null;
    if(prIn)prIn.onchange=()=>_neuBauen(); // nach dem Tippen: Schnellwahl „＋ Name (Aufgenommen von)" bei den Anwesenden anbieten
    w.appendChild(prRow);
    return w;
  }
  function _teilGeraeteBg(){
    const w=document.createElement('div');
    w.append(
      _geraetFeld('Luft','geraetLuft',FS_BG_GERAETE.luft,'testo 605i'),
      _geraetFeld('Oberfläche','geraetOberflaeche',FS_BG_GERAETE.oberflaeche,'testo 805i'),
      _geraetFeld('Bauteil','geraetBauteil',FS_BG_GERAETE.bauteil,'Trotec BM31WP'));
    if(String(bericht.kopf.messgeraete||'').trim())w.appendChild(_bgInfo('Bisher als Text eingetragen: '+String(bericht.kopf.messgeraete).trim()));
    return w;
  }
  // Kopf des Begehungsprotokolls = drei Abschnitte (Auftrag und Umfang · Ortstermin · Messgeräte)
  function _teilKopfBg(){
    const w=document.createElement('div');
    w.append(_bgBlock('auftrag',_teilAuftragBg),_bgBlock('termin',_teilTerminBg),_bgBlock('geraete',_teilGeraeteBg));
    return w;
  }

  /* ── F2c: Raumklima mit Uhrzeit, Bedingungen, Wänden und Fotos · Messstellen mit Wand, Höhe, Uhrzeit, Vergleichsstelle ───────
     Eigene Fassungen der Teile (die alten _teilRaeume/_teilStellen bleiben für das alte Protokoll unverändert). */
  function _bgLabelFeld(text,el){
    const z=document.createElement('label');z.style.cssText='display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--text2);min-width:0;';
    const s=document.createElement('span');s.textContent=text;z.append(s,el);return z;
  }
  function _teilRaeumeBg(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Raumklima'));
    w.appendChild(_bgInfo('Je Raum: Temperatur, Luftfeuchte, Uhrzeit und Bedingungen (z. B. Heizlüfter in Betrieb). Darunter die Wände W1, W2 … – bei der Messstelle wählst du die Wand aus.'));
    if(bericht.raeume.length){
      const kz=document.createElement('div');kz.style.cssText=S_RAUMGRID+'padding:6px 14px 0;font-size:12px;color:var(--text2);';
      ['Raum','°C','% rF','Taupunkt',''].forEach(x=>{const s=document.createElement('span');s.textContent=x;kz.appendChild(s);});
      w.appendChild(kz);
    }
    bericht.raeume.forEach((r,ri)=>{
      if(!Array.isArray(r.waende))r.waende=[];
      if(!Array.isArray(r.fotoRefs))r.fotoRefs=[];
      const card=document.createElement('div');card.setAttribute('data-fs-raumkarte',String(ri));
      card.style.cssText='margin:6px 10px;padding:2px 0 8px;border:1px solid var(--border);border-radius:10px;background:var(--bg2);';
      const row=document.createElement('div');row.style.cssText=S_RAUMGRID+'padding:6px 14px;align-items:center;';
      const nameI=_inp(r.name,'Raum',v=>{r.name=v;},false);
      let altName=r.name;
      nameI.onfocus=()=>{altName=r.name;};
      nameI.onchange=()=>{
        const neu=r.name;
        if(altName&&neu!==altName)bericht.stellen.forEach(st=>{if(st.raum===altName)st.raum=neu;});
        scheduleSave();_neuBauen();
      };
      const tI=_inp(r.t,'°C',v=>{r.t=v;_fsWerteNeu();},true);
      const fI=_inp(r.rf,'%',v=>{r.rf=v;_fsWerteNeu();},true);
      const td=document.createElement('span');td.setAttribute('data-fs-raum',String(ri));
      td.style.cssText='font-size:14px;color:var(--text);text-align:center;';
      const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Raum entfernen';
      x.style.cssText='width:40px;height:40px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:15px;cursor:pointer;';
      x.onclick=()=>{if(!confirm('Raum „'+(r.name||'ohne Namen')+'" mit allen Wänden entfernen?'))return;bericht.raeume.splice(ri,1);scheduleSave();_neuBauen();};
      row.append(nameI,tI,fI,td,x);
      const r2=document.createElement('div');r2.style.cssText='display:grid;grid-template-columns:96px minmax(0,1fr);gap:6px;padding:0 14px 6px;align-items:center;';
      r2.append(_inp(r.zeit,'hh:mm',v=>{r.zeit=v;},false),_inp(r.bedingung,'Bedingungen, z. B. Heizlüfter in Betrieb',v=>{r.bedingung=v;},false));
      card.append(row,r2);
      const wt=document.createElement('div');wt.style.cssText='padding:2px 14px;font-size:12px;font-weight:700;color:var(--text2);';wt.textContent='Wände';card.appendChild(wt);
      r.waende.forEach((wd,wi)=>{
        if(!Array.isArray(wd.fotoRefs))wd.fotoRefs=[];
        const wr=document.createElement('div');wr.setAttribute('data-fs-wand',(r.name||'')+'|'+wd.k);
        wr.style.cssText='display:grid;grid-template-columns:54px minmax(0,1fr) 40px;gap:6px;align-items:center;padding:3px 14px;';
        const kk=document.createElement('span');kk.textContent=wd.k;kk.style.cssText='font-size:14px;font-weight:700;color:var(--text);';
        const aI=_inp(wd.art,'Art, z. B. Außenwand',v=>{wd.art=v;},false);aI.onchange=()=>{scheduleSave();_neuBauen();};
        const fl=_fsFotoLeiste(bericht,{text:(r.name||'Raum')+', '+wd.k,fotoRefs:wd.fotoRefs},'Fotos zu '+wd.k,true);fl.style.marginTop='0';
        const wx=_bgXKnopf(wd.k+' entfernen',()=>{
          if(!confirm(wd.k+' entfernen? Die Zuordnung der Messstellen und Fotos zu dieser Wand geht verloren (die Fotos selbst bleiben).'))return;
          r.waende.splice(wi,1);
          bericht.stellen.forEach(st=>{if(st.raum===r.name&&st.wand===wd.k)st.wand='';});
          scheduleSave();_neuBauen();
        });
        fl.style.gridColumn='2 / 4'; // Fotos in einer eigenen Zeile unter der Art – sonst bleibt neben den Vorschaubildern kaum Platz für den Text
        wr.append(kk,aI,wx,fl);card.appendChild(wr);
      });
      const wc=document.createElement('div');wc.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px;';
      if(r.waende.filter(q=>q&&/^W\d+$/.test(q.k)).length<4)wc.appendChild(_chip('＋ Wände W1–W4',false,()=>{_fsBgWaendeVier(r);scheduleSave();_neuBauen();}));
      wc.appendChild(_chip('＋ Wand',false,()=>{_fsBgWandNeu(r);scheduleSave();_neuBauen();}));
      if(!r.waende.some(q=>q&&q.k==='Boden'))wc.appendChild(_chip('＋ Boden',false,()=>{_fsBgFlaeche(r,'Boden');scheduleSave();_neuBauen();}));
      if(!r.waende.some(q=>q&&q.k==='Decke'))wc.appendChild(_chip('＋ Decke',false,()=>{_fsBgFlaeche(r,'Decke');scheduleSave();_neuBauen();}));
      card.appendChild(wc);
      const rf=_fsFotoLeiste(bericht,{text:'Raum '+(r.name||''),fotoRefs:r.fotoRefs},'Fotos zum Raum');rf.style.padding='0 14px';rf.style.marginTop='4px';rf.style.boxSizing='border-box';
      card.appendChild(rf);
      w.appendChild(card);
    });
    const chips=document.createElement('div');chips.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px 12px;';
    const vorhanden=bericht.raeume.map(r=>r.name);
    const fehlendeWohnung=FS_WOHNUNG.filter(n=>vorhanden.indexOf(n)<0);
    if(!_fsIstKeller(bericht)&&fehlendeWohnung.length>1)chips.appendChild(_chip('＋ Wohnung ('+fehlendeWohnung.length+' Räume)',false,()=>{fehlendeWohnung.forEach(n=>bericht.raeume.push(_fsBgRaumNeu(n)));scheduleSave();_neuBauen();}));
    _fsRaumVorschlaege(bericht).filter(n=>vorhanden.indexOf(n)<0).forEach(n=>{
      chips.appendChild(_chip('＋ '+n,false,()=>{bericht.raeume.push(_fsBgRaumNeu(n));scheduleSave();_neuBauen();}));
    });
    chips.appendChild(_chip('＋ anderer Raum',false,()=>{
      const n=prompt('Name des Raums:');
      if(n&&n.trim()){bericht.raeume.push(_fsBgRaumNeu(n.trim()));scheduleSave();_neuBauen();}
    }));
    w.appendChild(chips);
    return w;
  }

  function _teilStellenBg(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Messstellen'));
    const info=document.createElement('div');info.style.cssText='padding:6px 14px 2px;font-size:12px;color:var(--text2);';
    info.textContent='Raum und Wand wählen, Höhe in cm, Uhrzeit. Oberfläche mit dem Infrarot-Thermometer, Bauteilfeuchte in Digits. Jede Höhe an einer Wand ist eine eigene Stelle.';
    w.appendChild(info);
    const raumNamen=bericht.raeume.map(r=>r.name).filter(Boolean);
    const druck=_fsBgStellenSortiert(bericht);
    bericht.stellen.forEach((st,si)=>{
      const card=document.createElement('div');
      card.style.cssText='margin:8px 10px;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--bg2);';
      const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;gap:8px;';
      const nr=document.createElement('span');nr.textContent=String(si+1);
      nr.style.cssText='width:30px;height:30px;border-radius:50%;background:'+FS_FARBE+';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;';
      const txtI=_inp(st.text,'Ort im Raum, z. B. Ecke oben',v=>{st.text=v;},false);
      txtI.setAttribute('data-fs-stellentext',String(si));
      const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Messstelle entfernen';
      x.style.cssText='width:40px;height:40px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:15px;cursor:pointer;flex-shrink:0;';
      x.onclick=()=>{if(!confirm('Messstelle '+(si+1)+' entfernen?'))return;bericht.stellen.splice(si,1);scheduleSave();_neuBauen();};
      top.append(nr,txtI,x);

      const sel=document.createElement('select');
      sel.style.cssText=S_INP+'margin-top:8px;';
      const opt0=document.createElement('option');opt0.value='';opt0.textContent='– Raum wählen –';sel.appendChild(opt0);
      const namen=raumNamen.slice();
      if(st.raum&&namen.indexOf(st.raum)<0)namen.push(st.raum);
      namen.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n+(raumNamen.indexOf(n)<0?' (nicht im Raumklima)':'');sel.appendChild(o);});
      sel.value=st.raum||'';
      sel.onchange=()=>{ // neuer Raum: die Wand passt nur, wenn es sie dort gibt
        st.raum=sel.value;
        const rr=_fsBgRaum(bericht,st.raum);
        if(st.wand&&!(rr&&(rr.waende||[]).some(q=>q&&q.k===st.wand)))st.wand='';
        scheduleSave();_neuBauen();
      };

      const rr=_fsBgRaum(bericht,st.raum),ws=(rr&&Array.isArray(rr.waende))?rr.waende.filter(q=>q&&q.k):[];
      const wandSel=document.createElement('select');wandSel.style.cssText=S_INP;wandSel.setAttribute('data-fs-wandwahl',String(si));
      const w0=document.createElement('option');w0.value='';w0.textContent=ws.length?'– Wand –':(st.raum?'erst Wände anlegen':'erst Raum wählen');wandSel.appendChild(w0);
      ws.forEach(q=>{const o=document.createElement('option');o.value=q.k;o.textContent=q.k+(String(q.art||'').trim()?' – '+String(q.art).trim():'');wandSel.appendChild(o);});
      if(st.wand&&!ws.some(q=>q.k===st.wand)){const o=document.createElement('option');o.value=st.wand;o.textContent=st.wand+' (nicht angelegt)';wandSel.appendChild(o);}
      wandSel.value=st.wand||'';wandSel.disabled=!ws.length&&!st.wand;
      wandSel.onchange=()=>{st.wand=wandSel.value;scheduleSave();_neuBauen();};
      const ortRow=document.createElement('div');ortRow.style.cssText='display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,.75fr) minmax(0,.9fr);gap:6px;margin-top:8px;';
      ortRow.append(_bgLabelFeld('Wand',wandSel),_bgLabelFeld('Höhe cm',_inp(st.hoehe,'10',v=>{st.hoehe=v;},true)),_bgLabelFeld('Uhrzeit',_inp(st.zeit,'hh:mm',v=>{st.zeit=v;},false)));

      const gr=document.createElement('div');gr.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px;';
      const felder=[['Oberfläche °C','ts'],['Bauteil (Digits)','mf']];
      if(_fsZahl(st.mfVergleich)!==null)felder.push(['Vergleich trocken (alt)','mfVergleich']); // nur wenn aus früheren Eingaben vorhanden
      felder.forEach(([lab,key])=>gr.appendChild(_bgLabelFeld(lab,_inp(st[key],'',v=>{st[key]=v;_fsWerteNeu();},true))));

      const luftGr=document.createElement('div');luftGr.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px;';
      [['Luft °C (Messung)','luftT'],['Luft % rF (Messung)','luftRf']].forEach(([lab,key])=>{
        const li=_inp(st[key],'leer = Raumklima',v=>{st[key]=v;_fsWerteNeu();},true);li.setAttribute('data-fs-luft',key);
        luftGr.appendChild(_bgLabelFeld(lab,li));
      });

      const bf=document.createElement('div');bf.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;';
      FS_BEFUNDE.forEach(b=>{
        bf.appendChild(_chip(b,st.befund.indexOf(b)>=0,()=>{
          const ix=st.befund.indexOf(b);
          if(ix>=0)st.befund.splice(ix,1);
          else{
            if(b!=='Schimmel')st.befund=st.befund.filter(q=>q==='Schimmel'); // trocken/feucht/nass schließen sich aus
            st.befund.push(b);
          }
          scheduleSave();_neuBauen();
        }));
      });
      const vgl=_chip('Vergleichsstelle (trocken)',!!st.referenz,()=>{st.referenz=!st.referenz;scheduleSave();_neuBauen();});vgl.setAttribute('data-fs-referenz',String(si));
      bf.appendChild(vgl);

      const werte=document.createElement('div');werte.setAttribute('data-fs-stelle',String(si));
      werte.style.cssText='margin-top:8px;padding:8px;border-radius:8px;background:var(--bg3);';

      let zusammen=null; // testo-Messung mit einer anderen Stelle zusammenführen: eine Zeile je Ort
      if(st.testo){
        zusammen=document.createElement('div');zusammen.style.cssText='margin-top:8px;';
        const mb=document.createElement('button');mb.type='button';mb.textContent='⇢ Zu anderer Stelle';mb.setAttribute('data-fs-zusammen',String(si));
        mb.style.cssText=S_KNOPF+'min-height:40px;border:1.5px solid var(--border);background:transparent;color:var(--text);';
        mb.onclick=()=>{
          const alt=zusammen.querySelector('select');if(alt){alt.remove();return;}
          const ziele=bericht.stellen.map((z,zi)=>({z,zi})).filter(q=>q.zi!==si&&!q.z.testo);
          if(!ziele.length){toast('Keine andere Stelle ohne testo-Messung – erst die Stelle (z. B. Trotec) anlegen','info',4500);return;}
          const s2=document.createElement('select');s2.style.cssText=S_INP+'margin-top:6px;';
          const o0=document.createElement('option');o0.value='';o0.textContent='– in welche Stelle übernehmen? –';s2.appendChild(o0);
          ziele.forEach(q=>{const o=document.createElement('option');o.value=String(q.zi);const ort=_fsBgOrt(bericht,q.z);o.textContent='Stelle '+(q.zi+1)+(ort?' – '+ort:' (noch leer)');s2.appendChild(o);});
          s2.onchange=()=>{
            if(s2.value==='')return;
            const zi=+s2.value;
            if(!confirm('Die testo-Messung in Stelle '+(zi+1)+' übernehmen? Diese Zeile entfällt, leere Felder der Stelle werden gefüllt, als Uhrzeit gilt die der testo-Messung.')){s2.value='';return;}
            if(_fsBgZusammenfuehren(bericht,si,zi)){scheduleSave();_neuBauen();toast('✓ Zusammengeführt','success',3000);}
          };
          zusammen.appendChild(s2);
        };
        zusammen.appendChild(mb);
      }

      const notiz=_inp(st.notiz,'Notiz …',v=>{st.notiz=v;},false);
      notiz.style.marginTop='8px';
      const fotoLeiste=_fsFotoLeiste(bericht,st,'Fotos zu dieser Stelle');
      const pdfNr=(druck.find(q=>q.i===si)||{}).nr;
      const pl=document.createElement('div');pl.setAttribute('data-fs-impdf',String(si));pl.style.cssText='margin-top:6px;font-size:12px;color:var(--text2);';
      pl.textContent=pdfNr?'Im PDF: '+(st.referenz?'Vergleichsstelle ':'Nr ')+pdfNr:'Kommt ins PDF, sobald etwas eingetragen ist.';

      card.append(top,sel,ortRow,gr,luftGr,bf,werte);
      if(zusammen)card.appendChild(zusammen);
      card.append(notiz,fotoLeiste,pl);
      w.appendChild(card);
    });
    const add=document.createElement('button');add.type='button';add.textContent='＋ Messstelle';
    add.style.cssText=S_KNOPF+'display:block;width:calc(100% - 20px);margin:8px 10px 14px;border:1.5px dashed '+FS_FARBE+';background:rgba(31,95,139,.08);color:var(--text);';
    add.onclick=()=>{
      const letzte=bericht.stellen[bericht.stellen.length-1];
      const neu0={text:'',raum:letzte?letzte.raum:'',ts:'',mf:'',mfVergleich:'',befund:[],notiz:'',fotoRefs:[]};
      _fsBgStelleNeu(neu0,letzte);
      bericht.stellen.push(neu0);
      scheduleSave();_neuBauen();
      const neu=body.querySelector('[data-fs-stellentext="'+(bericht.stellen.length-1)+'"]');
      if(neu){try{neu.scrollIntoView({block:'center'});}catch(e){}neu.focus();}
    };
    w.appendChild(add);
    const testoBtn=document.createElement('button');testoBtn.type='button';testoBtn.textContent='📥 testo-Messung einlesen';
    testoBtn.style.cssText=S_KNOPF+'display:block;width:calc(100% - 20px);margin:0 10px 14px;border:1.5px solid '+FS_FARBE+';background:transparent;color:var(--text);';
    testoBtn.onclick=()=>_fsTestoEinlesen(bericht,t,_neuBauen);
    w.appendChild(testoBtn);
    return w;
  }

  // Eine Zeile der Feststellungen: Frage als Überschrift, darunter die zwei Sätze als Knöpfe
  function _bgPunktZeile(sek,it){
    const row=document.createElement('div');row.style.cssText='padding:10px 14px;border-bottom:1px solid var(--border);';
    row.setAttribute('data-fs-punkt',it.k||'frei');
    if(it.frei){ // eigener Satz
      const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;gap:8px;';
      const tx=_inp(it.text,'Feststellung als Satz',v=>{it.text=v;},false);
      top.append(tx,_bgXKnopf('Eintrag entfernen',()=>{if(String(it.text||'').trim()&&!confirm('Eintrag entfernen?'))return;const ix=sek.items.indexOf(it);if(ix>=0)sek.items.splice(ix,1);scheduleSave();_neuBauen();}));
      const nz=document.createElement('div');nz.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;';
      const n=_inp(it.notiz,'Anmerkung …',v=>{it.notiz=v;},false);n.style.flex='1 1 180px';n.style.minWidth='0';
      const fl=_fsFotoLeiste(bericht,it,'Foto zu diesem Punkt',true);fl.style.marginTop='0';fl.style.flex='0 1 auto';
      nz.append(n,fl);row.append(top,nz);
      return row;
    }
    if(it.typ==='notiz'){ // nur ein Textfeld, erscheint erst, wenn der Punkt davor „festgestellt" ist
      const ab=sek.items.find(x=>x&&x.k===it.abh);
      if(!ab||ab.status!=='mangel'){row.style.display='none';return row;}
      const l=document.createElement('div');l.style.cssText='font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px;';l.textContent=it.text||'';
      row.append(l,_inp(it.notiz,it.h||'Angabe …',v=>{it.notiz=v;},false));
      return row;
    }
    const st=it.status||'offen';
    const q=document.createElement('div');q.style.cssText='font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px;';q.textContent=it.text||'';
    if(it.neuAnsehen&&st==='offen'){
      const hw=document.createElement('span');hw.setAttribute('data-fs-neuansehen','1');hw.textContent='  · bitte neu beantworten';hw.style.cssText='font-weight:600;font-size:12px;color:var(--orange);';q.appendChild(hw);
    }
    const knr=document.createElement('div');knr.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;';
    const kurz=it.mo||String(it.m||'').split(': {}').join('').split(' {}').join('');
    [['ok',it.ok],['mangel',kurz]].forEach(([k,text])=>{
      if(!text)return;
      const an=st===k;
      const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('data-fs-satz',k);
      b.style.cssText='padding:8px 8px;min-height:44px;border-radius:8px;font-size:13px;line-height:1.35;text-align:left;cursor:pointer;font-family:inherit;'
        +'border:2px solid '+(an?FS_FARBE:'var(--border)')+';background:'+(an?'rgba(31,95,139,.18)':'transparent')+';color:var(--text);font-weight:'+(an?'700':'400')+';';
      b.onclick=()=>{it.status=an?'offen':k;scheduleSave();_neuBauen();};
      knr.appendChild(b);
    });
    row.append(q,knr);
    if(st!=='offen'||String(it.notiz||'').trim()||(Array.isArray(it.fotoRefs)&&it.fotoRefs.length)){
      const nz=document.createElement('div');nz.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;';
      const n=_inp(it.notiz,(st==='mangel'&&it.h)?it.h+' …':'Anmerkung …',v=>{it.notiz=v;},false);n.style.flex='1 1 180px';n.style.minWidth='0';
      const fl=_fsFotoLeiste(bericht,it,'Foto zu diesem Punkt',true);fl.style.marginTop='0';fl.style.flex='0 1 auto';
      nz.append(n,fl);row.appendChild(nz);
    }
    return row;
  }

  function _teilChecklistenBg(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Feststellungen vor Ort'));
    w.appendChild(_bgInfo('Tippe den Satz an, der stimmt. Was du offen lässt, steht nicht im PDF.'));
    const zuListe=_fsZuLesen(bericht.id);
    const umschalten=(si,zu)=>{
      _fsZuSetzen(bericht.id,si,zu);_neuBauen();
      if(zu){const kk=body.querySelector('[data-fs-sek="'+si+'"]');if(kk){try{kk.scrollIntoView({block:'start'});}catch(e){}}}
    };
    bericht.sektionen.forEach((sek,si)=>{
      if(!Array.isArray(sek.items))sek.items=[];
      const zu=zuListe.indexOf(si)>=0;
      const kopf=document.createElement('button');kopf.type='button';kopf.setAttribute('data-fs-sek',String(si));
      kopf.setAttribute('aria-expanded',zu?'false':'true');
      kopf.style.cssText=S_HDR+'display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;font-family:inherit;border-right:none;';
      const pfeil=document.createElement('span');pfeil.textContent=zu?'▸':'▾';pfeil.style.cssText='width:16px;flex-shrink:0;';
      const kt=document.createElement('span');kt.textContent=sek.titel||'';kt.style.cssText='flex:1;min-width:0;';
      kopf.append(pfeil,kt);
      if(zu){const kurz=document.createElement('span');kurz.setAttribute('data-fs-sekkurz',String(si));kurz.textContent=_fsBgSektionKurz(sek);
        kurz.style.cssText='font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap;flex-shrink:0;';kopf.appendChild(kurz);}
      kopf.onclick=()=>umschalten(si,!zu);
      w.appendChild(kopf);
      if(zu)return;
      sek.items.forEach(it=>w.appendChild(_bgPunktZeile(sek,it)));
      const frei=document.createElement('button');frei.type='button';frei.textContent='＋ Freier Eintrag';
      frei.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:8px 14px;border:1px dashed var(--border);background:transparent;color:var(--text2);';
      frei.onclick=()=>{const tx=prompt('Feststellung als ganzer Satz:');if(tx&&tx.trim()){sek.items.push({frei:true,text:tx.trim(),notiz:'',status:'mangel',fotoRefs:[]});scheduleSave();_neuBauen();}};
      w.appendChild(frei);
      const ein=document.createElement('button');ein.type='button';ein.textContent='▲ Abschnitt einklappen';ein.setAttribute('data-fs-einklappen',String(si));
      ein.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:0 14px 12px;border:1.5px solid '+FS_FARBE+';background:transparent;color:var(--text);';
      ein.onclick=()=>umschalten(si,true);
      w.appendChild(ein);
    });
    return w;
  }

  function _teilAngabenBg(){
    const w=document.createElement('div');w.setAttribute('data-fs-angaben','1');
    w.appendChild(_kopfZeile('Angaben der Nutzer (nicht selbst festgestellt)'));
    w.appendChild(_bgInfo('Was Mieter oder Nutzer gesagt haben. Im PDF steht „Laut …". Fragen ohne Eintrag erscheinen nicht.'));
    const namen=_bgNamenListe();
    bericht.angaben.forEach((a,ai)=>{
      const row=document.createElement('div');row.style.cssText='padding:10px 14px;border-bottom:1px solid var(--border);';
      row.setAttribute('data-fs-angabe',a.k||String(ai));
      const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:6px;';
      const q=document.createElement('div');q.style.cssText='flex:1;min-width:0;font-size:14px;font-weight:600;color:var(--text);';q.textContent=a.q||'';
      top.appendChild(q);
      if(a.frei)top.appendChild(_bgXKnopf('Angabe entfernen',()=>{if(String(a.text||'').trim()&&!confirm('Angabe entfernen?'))return;bericht.angaben.splice(ai,1);scheduleSave();_neuBauen();}));
      row.append(top,_bgTextFeld(a.text,'Was wurde gesagt …',v=>{a.text=v;},2));
      const opts=namen.slice();if(a.von&&opts.indexOf(a.von)<0)opts.push(a.von);
      if(opts.length){
        const c=document.createElement('div');c.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;align-items:center;';
        const l=document.createElement('span');l.style.cssText='font-size:12px;color:var(--text2);';l.textContent='Laut:';c.appendChild(l);
        opts.forEach(nm=>c.appendChild(_chip(nm,a.von===nm,()=>{a.von=(a.von===nm)?'':nm;scheduleSave();_neuBauen();})));
        row.appendChild(c);
      }
      w.appendChild(row);
    });
    const add=document.createElement('button');add.type='button';add.textContent='＋ Weitere Angabe';
    add.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:8px 14px 12px;border:1px dashed var(--border);background:transparent;color:var(--text2);';
    add.onclick=()=>{const q=prompt('Wozu? (Frage oder Thema der Angabe)');if(q&&q.trim()){bericht.angaben.push({k:'frei'+Date.now(),q:q.trim(),text:'',von:'',frei:true});scheduleSave();_neuBauen();}};
    w.appendChild(add);
    return w;
  }

  function _teilZusammenfassungBg(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Zusammenfassung der Feststellungen'));
    w.appendChild(_bgInfo('Nur das Festgestellte, in eigenen Worten – eine Momentaufnahme. Keine Ursache, keine Empfehlung.'));
    const box=document.createElement('div');box.style.cssText='padding:0 14px 14px;';
    box.appendChild(_bgTextFeld(bericht.bemerkung,'Zum Zeitpunkt der Begehung …',v=>{bericht.bemerkung=v;},5));
    w.appendChild(box);
    return w;
  }

  _neuBauen();

  /* Fußleiste */
  const footer=document.createElement('div');
  footer.style.cssText='position:fixed;bottom:0;left:0;right:0;padding:12px 14px;background:var(--bg2);border-top:1px solid var(--border);display:flex;gap:10px;z-index:99999;';
  const pdfBtn=document.createElement('button');pdfBtn.type='button';pdfBtn.textContent='📄 PDF erstellen';
  pdfBtn.style.cssText='flex:1;padding:12px;background:'+FS_FARBE+';color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;';
  pdfBtn.onclick=async()=>{
    pdfBtn.disabled=true;const alt=pdfBtn.textContent;pdfBtn.textContent='⏳ PDF wird erstellt …';
    try{await _fsMobPdf(bericht,t);}finally{pdfBtn.disabled=false;pdfBtn.textContent=alt;}
  };
  const shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.textContent='📤';
  shareBtn.style.cssText='padding:12px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:18px;cursor:pointer;color:var(--text);';
  shareBtn.onclick=async()=>{
    const blob=_fsPdfBlobs[bericht.id];
    if(navigator.share&&blob){
      const file=new File([blob],bericht.pdfName||_fsPdfName(bericht),{type:'application/pdf'});
      try{await navigator.share({title:_fsTitel(bericht),files:[file]});}
      catch(e){if(e.name!=='AbortError')toast('Teilen fehlgeschlagen','error');}
    }else{toast('Bitte zuerst PDF erstellen','info');}
  };
  const openBtn=document.createElement('button');openBtn.type='button';openBtn.textContent='📂 Öffnen'; // v294
  openBtn.style.cssText='padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;color:var(--text);';
  openBtn.onclick=()=>_fsPdfOeffnen(bericht);
  footer.append(pdfBtn,openBtn,shareBtn);
  ov.append(hdr,body,footer);
  document.body.appendChild(ov);
}

// Rechenzeile unter einer Messstelle – nur Zahlen und feste Texte, deshalb textContent
function _fsWerteZeile(el,w,st){
  el.innerHTML='';
  const z=document.createElement('div');z.style.cssText='font-size:14px;color:var(--text);line-height:1.6;';
  if(!w.raumGefunden){
    z.style.color='var(--text2)';
    z.textContent='Raum wählen und dort Temperatur und Luftfeuchte eintragen – dann rechnet PAM.';
    el.appendChild(z);return;
  }
  const teile=['Taupunkt '+_fsEins(w.td)+' °C'];
  if(w.abstand!==null)teile.push('Abstand '+_fsEins(w.abstand)+' K');
  z.appendChild(document.createTextNode(teile.join(' · ')));
  if(w.ofRf!==null){
    // Farbe nur in Rand und Punkt – die Schrift bleibt dunkel/hell (orange/rot auf Grau war im Hell-Modus zu blass)
    const farbe=w.ampel==='gruen'?'var(--green)':w.ampel==='gelb'?'var(--orange)':'var(--red)';
    const amp=document.createElement('span');amp.setAttribute('data-fs-ampel',w.ampel);
    amp.style.cssText='display:inline-block;margin-left:8px;padding:1px 10px;border-radius:12px;font-weight:700;border:2px solid '+farbe+';color:var(--text);';
    const punkt=document.createElement('span');punkt.textContent='● ';punkt.style.color=farbe;
    amp.append(punkt,document.createTextNode('Oberfläche '+Math.round(w.ofRf)+' % · '+(w.ampel==='gruen'?'grün':w.ampel)));
    z.appendChild(amp);
  }
  el.appendChild(z);
  {const kl=_fsKlartext(w);if(kl.text){const d=document.createElement('div');d.setAttribute('data-fs-klartext',kl.stufe);d.style.cssText='font-size:14px;font-weight:600;color:var(--text);margin-top:3px;line-height:1.45;';d.textContent=(kl.stufe==='gruen'?'✅ ':kl.stufe==='gelb'?'⚠ ':'⛔ ')+kl.text;el.appendChild(d);}} // v294
  const z2=[];
  if(w.frsi!==null)z2.push('Temperaturfaktor '+(Math.round(w.frsi*100)/100).toFixed(2).replace('.',','));
  if(w.faktor!==null)z2.push('Bauteil ×'+_fsEins(w.faktor)+' gegenüber Vergleich');
  if(z2.length){const d=document.createElement('div');d.style.cssText='font-size:13px;color:var(--text2);';d.textContent=z2.join(' · ');el.appendChild(d);}
  if(st&&st.testo){ // v292
    const d=document.createElement('div');d.style.cssText='font-size:13px;color:var(--text2);';
    d.textContent=_fsTestoInfoText(st,w);el.appendChild(d);
  }
  w.hinweise.forEach(h=>{
    const d=document.createElement('div');d.style.cssText='font-size:13px;font-weight:700;color:var(--text);margin-top:4px;padding-left:8px;border-left:4px solid var(--orange);';
    d.textContent='⚠ '+h;el.appendChild(d);
  });
}

// F2a: Rechenzeile unter einer Messstelle im Begehungsprotokoll – nur kleine graue Zahlen zur Anzeige am Gerät, nie im PDF.
// Keine Ampelfarbe, kein Klartext, keine Schlussfolgerung. Orange nur als Merkhilfe für Fehlendes aus der testo-Messung.
function _fsWerteZeileBg(el,w,st){
  el.innerHTML='';
  const z=document.createElement('div');z.style.cssText='font-size:12px;color:var(--text2);line-height:1.5;';
  if(!w.raumGefunden){
    z.textContent='Sobald ein Raum mit Temperatur und Luftfeuchte gewählt ist, steht hier Taupunkt und Oberflächenfeuchte (nur Anzeige, nicht im PDF).';
  }else{
    const teile=['Taupunkt '+_fsEins(w.td)+' °C'];
    if(w.abstand!==null)teile.push('Abstand '+_fsEins(w.abstand)+' K');
    if(w.ofRf!==null)teile.push('Oberflächenfeuchte '+Math.round(w.ofRf)+' %');
    z.textContent=teile.join(' · ')+' (nur Anzeige, nicht im PDF)';
  }
  el.appendChild(z);
  if(st&&st.testo){
    const d=document.createElement('div');d.style.cssText='font-size:12px;color:var(--text2);';
    d.textContent=_fsTestoInfoText(st,w);el.appendChild(d);
    (Array.isArray(st.testo.warnungen)?st.testo.warnungen:[]).forEach(h=>{
      if(typeof h!=='string'||!h)return;
      const m=document.createElement('div');m.setAttribute('data-fs-merkhilfe','1');
      m.style.cssText='font-size:12px;font-weight:600;color:var(--text);margin-top:4px;padding-left:8px;border-left:4px solid var(--orange);';
      m.textContent='Merkhilfe: '+h;el.appendChild(m);
    });
  }
}

// Foto fürs PDF, verkleinert und ohne Aufnahmedaten (_shrNeuKodieren).
// ⛔ Eine data:-Adresse NICHT per fetch lesen – das scheiterte in der Browser-Gegenprobe („Failed to fetch").
//   Sonst derselbe EINE Weg wie beim Teilen (_shrBytes: Gerätespeicher, blob:, Drive mit Zwischenspeicher).
async function _fsFotoFuerPdf(f){
  try{
    let blob=null;
    if(f&&typeof f.localUrl==='string'&&f.localUrl.startsWith('data:')){try{blob=_dataUrlToBlob(f.localUrl);}catch(e){blob=null;}}
    if(!blob)blob=await _shrBytes(f);
    if(!blob)return null;
    return await _shrNeuKodieren(blob,1600);
  }catch(e){console.warn('[Feuchte] Foto fürs PDF:',e);return null;}
}

async function _fsMobPdf(bericht,task){
  if(bericht&&bericht.fassung==='begehung'&&typeof _fsMobPdfBg==='function')return _fsMobPdfBg(bericht,task); // F2a: Begehungsprotokoll hat ein eigenes PDF
  if(!window.jspdf){toast('PDF-Bibliothek lädt noch …','error');return null;}
  try{
    _fsVervollstaendigen(bericht);
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=210,M=14,farbe=[31,95,139];let y=M;
    const k=bericht.kopf;
    const leer=v=>(v===null||v===undefined||String(v).trim()==='')?'–':String(v);
    const zahlText=(v,einheit)=>{const n=_fsZahl(v);return n===null?'–':_fsEins(n)+(einheit?' '+einheit:'');};
    const abschnitt=titel=>{
      if(y>262){doc.addPage();y=M;}
      doc.setFillColor(227,237,245);doc.rect(M,y,W-2*M,7,'F');
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(...farbe);
      doc.text(titel,M+2,y+5);y+=9;
    };

    doc.setFillColor(...farbe);doc.rect(0,0,W,30,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');
    doc.text(_fsTitel(bericht),M,12);
    doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text(doc.splitTextToSize('Objekt: '+leer(k.objektAdresse||task.adresse),W-2*M)[0],M,19);
    doc.text('Datum: '+leer(bericht.datum)+(k.uhrzeit?' · '+k.uhrzeit+' Uhr':'')+(k.auftragNr?' · Auftrag: '+k.auftragNr:''),M,25);
    y=36;

    { // v294: Ergebnis oben
      const e=_fsErgebnis(bericht);
      abschnitt('Ergebnis');
      const kopfText=e.stufe==='gruen'?'Keine Schimmelgefahr':e.stufe==='gelb'?'Mögliches Schimmelrisiko':e.stufe==='rot'?'Akute Schimmelgefahr':'Noch keine Bewertung';
      const fb=e.stufe==='gruen'?[26,122,60]:e.stufe==='gelb'?[201,106,0]:e.stufe==='rot'?[192,57,43]:[90,90,90];
      doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...fb);doc.text(kopfText,M,y+4);y+=7;
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(0,0,0);
      const et=e.text;
      const el=doc.splitTextToSize(et,W-2*M);doc.text(el,M,y+2);y+=el.length*4.3+5;
    }
    const tdA=_fsTaupunkt(k.aussenT,k.aussenRf);
    abschnitt('Auftrag und Termin');
    doc.autoTable({startY:y,theme:'grid',margin:{left:M,right:M},
      bodyStyles:{fontSize:8,minCellHeight:6},
      columnStyles:{0:{fontStyle:'bold',cellWidth:32,fillColor:[245,245,245]},1:{cellWidth:59},2:{fontStyle:'bold',cellWidth:32,fillColor:[245,245,245]},3:{cellWidth:59}},
      body:[
        ['Auftraggeber',leer(k.auftraggeber),'Nutzer / Mieter',leer(k.nutzer)],
        ['Anwesend',leer(k.anwesend),'Prüfer',leer(k.pruefer)],
        ['Wetter',leer(k.wetter),'Letzter Regen',leer(k.letzterRegen)],
        ['Außen',zahlText(k.aussenT,'°C')+' / '+zahlText(k.aussenRf,'%'),'Taupunkt außen',tdA===null?'–':_fsEins(tdA)+' °C'],
        ['Messgeräte',{content:leer(k.messgeraete),colSpan:3}]
      ]});
    y=doc.lastAutoTable.finalY+5;

    if(bericht.raeume.length){
      abschnitt('Raumklima');
      doc.autoTable({startY:y,theme:'grid',margin:{left:M,right:M},
        head:[['Raum','Temperatur °C','Luftfeuchte %','Taupunkt °C']],
        body:bericht.raeume.map(r=>{const td=_fsTaupunkt(r.t,r.rf);return [leer(r.name),zahlText(r.t),zahlText(r.rf),td===null?'–':_fsEins(td)];}),
        headStyles:{fillColor:farbe,fontSize:8},bodyStyles:{fontSize:8,minCellHeight:6},
        columnStyles:{0:{cellWidth:70},1:{cellWidth:37,halign:'right'},2:{cellWidth:37,halign:'right'},3:{cellWidth:38,halign:'right'}}});
      y=doc.lastAutoTable.finalY+5;
    }

    const fotoList=(bericht.fotos||[]).filter(f=>f&&f.inReport);
    const fotoNr=ref=>{const i=fotoList.findIndex(f=>f.driveId===ref||f.localKey===ref||f.localUrl===ref);return i<0?0:i+1;};
    const bildCache=new Map(); // v296: jedes Foto nur einmal laden (an der Zeile UND hinten)
    const bildLaden=async f=>{if(!bildCache.has(f))bildCache.set(f,await _fsFotoFuerPdf(f));return bildCache.get(f);};
    // v296: Fotos direkt unter der Tabellenzeile – bis 6 cm hoch, zwei nebeneinander
    const zeilenBilder=async(liste,text)=>{
      const bW=(W-2*M-6)/2,bH=60;let col=0,zeileH=0;
      for(const o of liste){
        const d=await bildLaden(o.f);if(!d)continue;
        let w=bW,h=bW*d.h/d.w;if(h>bH){h=bH;w=bH*d.w/d.h;}
        if(col===0){if(y+bH+10>285){doc.addPage();y=M;}zeileH=0;}
        const x=col===0?M:M+bW+6;
        try{doc.addImage(d.dataUrl,'JPEG',x,y+2,w,h);}catch(e){console.warn('[Feuchte] Bild an der Zeile:',e);}
        doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(90,90,90);
        const cap=doc.splitTextToSize('Foto '+o.nr+(text?' – '+text:''),bW).slice(0,2);
        doc.text(cap,x,y+2+h+3.5);
        zeileH=Math.max(zeileH,h+(cap.length-1)*3);
        if(col===1)y+=zeileH+9;
        col=(col+1)%2;
      }
      if(col===1)y+=zeileH+9;
    };
    // v296: Tabelle an jeder Zeile mit Foto teilen – Bild darunter, dann ohne neuen Kopf weiter
    const tabelleMitBildern=async(opt,body,bilder)=>{
      let a=0,erste=true;
      for(let i=0;i<=body.length;i++){
        const hatBilder=i<body.length&&!!bilder[i]&&bilder[i].liste.length>0;
        if(i<body.length&&!hatBilder)continue;
        const b=i<body.length?i+1:body.length;
        if(b>a){doc.autoTable(Object.assign({},opt,{startY:y,body:body.slice(a,b),showHead:erste?'firstPage':'never'}));y=doc.lastAutoTable.finalY;erste=false;}
        if(hatBilder)await zeilenBilder(bilder[i].liste,bilder[i].text);
        a=b;
      }
    };

    if(bericht.stellen.length){
      abschnitt('Messstellen');
      const werte=bericht.stellen.map(st=>_fsStelleWerte(bericht,st));
      doc.autoTable({startY:y,theme:'grid',margin:{left:M,right:M},
        head:[['Nr','Stelle','Raum','Oberfl.\n°C','Abstand\nTaupunkt K','Oberfl.-\nFeuchte %','Bauteil /\nVergleich','Befund','Foto']],
        body:bericht.stellen.map((st,i)=>{
          const w=werte[i];
          const nrn=(st.fotoRefs||[]).map(fotoNr).filter(Boolean);
          return [String(i+1),leer(st.text),leer(st.raum),w.ts===null?'–':_fsEins(w.ts),w.abstand===null?'–':_fsEins(w.abstand),
            w.ofRf===null?'–':String(Math.round(w.ofRf)),(w.mf===null?'–':_fsEins(w.mf))+' / '+(w.mv===null?'–':_fsEins(w.mv)),
            (st.befund||[]).join(', ')||'–',nrn.join(', ')||'–'];
        }),
        headStyles:{fillColor:farbe,fontSize:7,fontStyle:'bold'},bodyStyles:{fontSize:7.5,minCellHeight:6},
        columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:42},2:{cellWidth:24},3:{cellWidth:15,halign:'right'},4:{cellWidth:18,halign:'right'},
          5:{cellWidth:18,halign:'center'},6:{cellWidth:21,halign:'center'},7:{cellWidth:24},8:{cellWidth:12,halign:'center'}},
        didParseCell:d=>{
          if(d.section!=='body'||d.column.index!==5)return;
          const a=werte[d.row.index]&&werte[d.row.index].ampel;
          if(a==='gruen')d.cell.styles.textColor=[26,122,60];
          else if(a==='gelb')d.cell.styles.textColor=[201,106,0];
          else if(a==='rot')d.cell.styles.textColor=[192,57,43];
          if(a)d.cell.styles.fontStyle='bold';
        }});
      y=doc.lastAutoTable.finalY+3;
      const zeilen=[],zeilenFotos=[]; // v296
      bericht.stellen.forEach((st,i)=>{
        const w=werte[i];const txt=[];
        {const kl=_fsKlartext(w);if(kl.text)txt.push(kl.text);} // v294
        if(w.frsi!==null)txt.push('Temperaturfaktor '+(Math.round(w.frsi*100)/100).toFixed(2).replace('.',','));
        if(w.faktor!==null)txt.push('Bauteil '+_fsEins(w.faktor)+'-fach gegenüber Vergleich');
        w.hinweise.forEach(h=>txt.push(h));
        if(st.testo)txt.push(_fsTestoInfoText(st,w)); // v292
        if(st.notiz)txt.push('Notiz: '+st.notiz);
        const bl=_fsZeilenFotos(fotoList,st.fotoRefs); // v296
        if(txt.length||bl.length){zeilen.push([String(i+1),txt.length?txt.join('\n'):'Fotos zur Stelle']);zeilenFotos.push({liste:bl,text:'Stelle '+(i+1)+(st.text?': '+st.text:'')});}
      });
      if(zeilen.length){
        await tabelleMitBildern({theme:'grid',margin:{left:M,right:M},head:[['Nr','Hinweise und Notizen']],
          headStyles:{fillColor:[90,90,90],fontSize:7.5},bodyStyles:{fontSize:7.5},
          columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:174}}},zeilen,zeilenFotos); // v296: Fotos direkt unter der Stelle
        y+=3;
      }
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100,100,100);
      const leg=doc.splitTextToSize(FS_LEGENDE,W-2*M);
      if(y+leg.length*3.2+4>285){doc.addPage();y=M;}
      doc.text(leg,M,y+3);y+=leg.length*3.2+6;
    }

    const nichtGeprueft=[]; // v294
    for(const sek of bericht.sektionen){ // v296: for statt forEach – Fotos an den Zeilen werden abgewartet
      if(!(sek.items||[]).length)continue;
      if(!_fsSektionGenutzt(sek)){nichtGeprueft.push(sek.titel||'');continue;}
      abschnitt(sek.titel||'');
      const sekFotos=sek.items.map(it=>({liste:_fsZeilenFotos(fotoList,it.fotoRefs),text:(it.text||'')+(it.notiz?': '+it.notiz:'')}));
      const sekBody=sek.items.map((it,ii)=>{const nrn=sekFotos[ii].liste.map(o=>o.nr);
        return [it.status==='ok'?'unauffällig':it.status==='mangel'?'auffällig':'offen',it.text||'',(it.notiz||'')+(nrn.length?(it.notiz?'\n':'')+'Foto '+nrn.join(', '):'')];});
      await tabelleMitBildern({theme:'grid',margin:{left:M,right:M},head:[['Status','Prüfpunkt','Notiz']],
        headStyles:{fillColor:farbe,fontSize:8},bodyStyles:{fontSize:8,minCellHeight:6},
        columnStyles:{0:{cellWidth:22,fontStyle:'bold'},1:{cellWidth:95},2:{cellWidth:65}},
        didParseCell:d=>{
          if(d.section!=='body'||d.column.index!==0)return;
          if(d.cell.raw==='unauffällig')d.cell.styles.textColor=[26,122,60];
          else if(d.cell.raw==='auffällig')d.cell.styles.textColor=[192,57,43];
          else d.cell.styles.textColor=[130,130,130];
        }},sekBody,sekFotos);
      y+=4;
    }

    if(nichtGeprueft.length){ // v294
      if(y>275){doc.addPage();y=M;}
      doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(110,110,110);
      const ng=doc.splitTextToSize('Nicht geprüft: '+nichtGeprueft.join(' · '),W-2*M);
      doc.text(ng,M,y+3);y+=ng.length*3.6+5;
    }
    const bw=_fsBewertungenFuer(bericht).find(b=>b.k===bericht.bewertung);
    if(bw||bericht.bemerkung||bericht.empfehlungen){
      abschnitt('Bewertung');
      doc.setTextColor(0,0,0);doc.setFontSize(9);
      const block=(label,text)=>{
        if(!text)return;
        const lines=doc.splitTextToSize(text,W-2*M);
        if(y+6+lines.length*4.3>285){doc.addPage();y=M;}
        doc.setFont('helvetica','bold');doc.text(label,M,y+4);y+=6;
        doc.setFont('helvetica','normal');doc.text(lines,M,y+3);y+=lines.length*4.3+4;
      };
      if(bw)block('Einschätzung',bw.k+' – '+bw.text);
      block('Begründung',bericht.bemerkung);
      block('Empfehlungen',bericht.empfehlungen);
    }

    if(fotoList.length){
      // v292: Hochformat (Handy, Messbild) bis 115 mm hoch – bei 62 mm waren die Werte im Messbild nicht mehr lesbar
      const iW=85,iH=115;let col=0,erste=true,zeileH=0;
      for(let fi=0;fi<fotoList.length;fi++){
        const f=fotoList[fi];
        setSaveInd('saving','PDF: Foto '+(fi+1)+'/'+fotoList.length+' …');
        const d=await bildLaden(f); // v296: schon an der Zeile geladen
        if(!d)continue;
        if(col===0){
          if(erste){if(y+9+iH+10>285){doc.addPage();y=M;}abschnitt('Fotos');erste=false;} // v296: Überschrift nie allein unten auf der Seite
          if(y+iH+10>285){doc.addPage();y=M;}
          zeileH=0;
        }
        const x=col===0?M:M+iW+12;
        let w=iW,h=iW*d.h/d.w;if(h>iH){h=iH;w=iH*d.w/d.h;}
        try{doc.addImage(d.dataUrl,'JPEG',x,y,w,h);}catch(e){console.warn('[Feuchte] Bild:',e);}
        const zu=_fsFotoZuordnung(bericht,f); // v296: Stellen UND Prüfpunkte
        doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(90,90,90);
        doc.text(doc.splitTextToSize('Foto '+(fi+1)+(zu?' – '+zu:''),iW)[0],x,y+h+3.5);
        zeileH=Math.max(zeileH,h);
        if(col===1)y+=zeileH+9;
        col=(col+1)%2;
      }
      if(col===1)y+=zeileH+9;
      setSaveInd('saved','');
    }

    if(y+24>285){doc.addPage();y=M;}
    y+=12;
    doc.setDrawColor(120,120,120);doc.line(M,y+8,M+70,y+8);doc.line(W-M-70,y+8,W-M,y+8);
    doc.setFontSize(7.5);doc.setTextColor(90,90,90);doc.setFont('helvetica','normal');
    doc.text('Ort, Datum',M,y+12);doc.text('Unterschrift'+(k.pruefer?' ('+k.pruefer+')':''),W-M-70,y+12);

    const pages=doc.internal.getNumberOfPages();
    for(let p=1;p<=pages;p++){
      doc.setPage(p);doc.setFontSize(8);doc.setTextColor(150,150,150);
      doc.text('Seite '+p+' von '+pages,W/2,292,{align:'center'});
      doc.text('sv-fb.de',W-M,292,{align:'right'});
    }

    const blob=doc.output('blob');
    _fsPdfBlobs[bericht.id]=blob;
    const name=_fsPdfName(bericht,new Date()); // v294: mit Uhrzeit – kein gleichnamiges PDF, keine Rückfrage beim Herunterladen
    toast('✓ PDF erstellt – mit „📂 Öffnen" ansehen','success',4000);
    const inDrive=await _fsPdfNachDrive(blob,name,bericht,task);
    if(!inDrive){ // ohne Drive bleibt nur das Gerät: dann wie bisher herunterladen
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=name;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }
    return blob;
  }catch(e){
    console.error('[Feuchte] PDF:',e);
    try{setSaveInd('','');}catch(_e){}
    toast('PDF-Fehler: '+e.message,'error');
    return null;
  }
}

/* ══ F2a: BEGEHUNGSPROTOKOLL – nur Feststellungen (Frank 30.09.2026) ═══════════════════════════════════════
   Neue Fassung des Formulars: fassung:'begehung'. Das Protokoll hält NUR fest, was vor Ort gesehen, gemessen und gesagt
   wurde – keine Ampel, keine Ursache, keine Empfehlung. Das alte Feuchte- und Schimmelprotokoll (ohne „fassung") bleibt
   unverändert; umgewandelt wird es nur auf Knopfdruck im Protokoll selbst (_fsZuBegehung), nichts wird still umgeschrieben.
   · Abhakpunkte: links der Satz „nicht festgestellt" (bisher ✓ = status 'ok'), rechts der Satz „festgestellt" (bisher ⚠ = 'mangel').
     Was angetippt wird, steht wörtlich im PDF. m = Vorlage mit {} für die Notiz, mo = Satz ohne Notiz, h = Hinweis im Notizfeld.
   · Die Sätze werden beim Anlegen ins Protokoll KOPIERT – spätere Änderungen hier gelten nur für neue Protokolle.
   · alt = Wortlaut des bisherigen Punktes (zum Umwandeln), neu = ein altes ✓/⚠ lässt sich hier NICHT übertragen (neu beantworten),
     zuAngabe = die alte Notiz wandert in diese Nutzerangabe. typ 'notiz' = nur ein Textfeld, erscheint, wenn der Punkt abh rechts gewählt ist.
   · Was nicht angetippt oder ausgefüllt ist, steht nicht im PDF – auch keine Sammelzeile „nicht erfasst".
   ⛔ Datei ist öffentlich: nur Sätze und Programm, nie Namen. Texte, die ins PDF gehen: nur Zeichen der PDF-Schrift (kein ⚠ ● ≥ ²). */
const FS_BG_TITEL='Begehungsprotokoll';
const FS_BG_UMFANG='Dieses Protokoll hält den vorgefundenen Zustand und die Messwerte zum Zeitpunkt der Begehung fest. Eine Bewertung der Ursachen und Empfehlungen zur Beseitigung sind nicht Gegenstand dieses Protokolls.';
const FS_BG_ROLLEN=['Nutzer','Mieter Nachbarkeller','Vertreter Auftraggeber','Aufgenommen von','Sonstige'];
// F2b: die zuklappbaren Abschnitte des Begehungsprotokolls (k = Schlüssel, t = Überschrift, c = Kurzname in der Sprungleiste)
const FS_BG_BLOECKE=[{k:'auftrag',t:'Auftrag und Umfang',c:'Auftrag'},{k:'termin',t:'Ortstermin',c:'Termin'},{k:'geraete',t:'Messgeräte',c:'Geräte'},{k:'raeume',t:'Raumklima',c:'Raumklima'},{k:'stellen',t:'Messstellen',c:'Messstellen'},{k:'fest',t:'Feststellungen vor Ort',c:'Feststellungen'},{k:'angaben',t:'Angaben der Nutzer (nicht selbst festgestellt)',c:'Angaben'},{k:'fazit',t:'Zusammenfassung der Feststellungen',c:'Zusammenfassung'},{k:'fotos',t:'Fotos',c:'Fotos'}];
const FS_BG_GERAETE={
  luft:'testo 605i – Lufttemperatur und relative Luftfeuchte',
  oberflaeche:'testo 805i – Oberflächentemperatur, berührungslos (Infrarot)',
  bauteil:'Trotec BM31WP – kapazitive Messung, Anzeige in Digits (Vergleichswerte des Geräts, keine Masse-%)'
};
const FS_BG_KELLER=[
  {titel:'Befund im Keller',items:[
    {k:'K1.1',q:'Zugang zum Keller',ok:'Der Zugang zum Keller führt nicht durch einen Wohnraum.',m:'Der Zugang zum Keller führt durch einen Wohnraum.',alt:'Zugang zum Keller nur über Treppenhaus oder Hof (kein Wohnraum)'},
    {k:'K1.2',q:'Schimmel an Gegenständen oder Wänden',ok:'An Wänden und Gegenständen war kein Schimmel sichtbar.',m:'Schimmel sichtbar an: {}.',mo:'Schimmel sichtbar.',h:'Ort',alt:'Schimmel an Gegenständen oder Wänden (wo?)'},
    {k:'K1.3',typ:'notiz',abh:'K1.2',q:'Fläche der Schimmelstelle',m:'Ungefähre Fläche der Schimmelstelle: {}.',h:'Zahl und Einheit, z. B. 400 cm²',alt:'Schimmelfläche: unter 20 cm² / bis 0,5 m² / über 0,5 m²'},
    {k:'K1.4',q:'Bereiche hinter Regalen, Schränken und Verkleidungen',ok:'Die Bereiche hinter Regalen, Schränken und Verkleidungen wurden eingesehen.',m:'Die Bereiche hinter Regalen, Schränken und Verkleidungen waren nicht einsehbar: {}.',mo:'Die Bereiche hinter Regalen, Schränken und Verkleidungen waren nicht einsehbar.',h:'was',alt:'Hinter Regalen, Schränken und Verkleidungen nachgesehen'},
    {k:'K1.5',q:'Wasser oder Pfützen am Boden',ok:'Kein Wasser und keine Pfützen am Boden.',m:'Wasser oder Pfützen am Boden: {}.',mo:'Wasser oder Pfützen am Boden.',h:'wo',alt:'Wasser oder Pfützen am Boden'},
    {k:'K1.6',q:'Salzausblühungen, abplatzender Putz oder Farbe',ok:'Keine Salzausblühungen, kein abplatzender Putz und keine abplatzende Farbe.',m:'Festgestellt: {}.',mo:'Salzausblühungen, abplatzender Putz oder abplatzende Farbe festgestellt.',h:'Salzausblühungen / Putz / Farbe – wo',alt:'Salzausblühungen, abplatzender Putz oder Farbe'},
    {k:'K1.7',q:'Feuchterand an der Wand',ok:'Kein Feuchterand an den Wänden erkennbar.',m:'Feuchterand an der Wand: {}.',mo:'Feuchterand an der Wand erkennbar.',h:'wo, Höhe über Boden in cm',alt:'Feuchterand an der Wand (Höhe über Boden notieren)'},
    {k:'K1.8',q:'Geruch',ok:'Kein muffiger Geruch wahrgenommen.',m:'Muffiger Geruch wahrgenommen.',alt:'Muffiger Geruch'}
  ]},
  {titel:'Wand und Boden innen',items:[
    {k:'K2.1',q:'Wand grenzt an Erdreich',ok:'Die Wand grenzt nicht an Erdreich.',m:'Die Wand grenzt an Erdreich.',alt:'Wand grenzt an Erdreich (Außenwand)',neu:true},
    {k:'K2.2',q:'Innendämmung, Vorsatzschale oder Verkleidung',ok:'Keine Innendämmung, Vorsatzschale oder Verkleidung an der Wand.',m:'An der Wand ist vorhanden: {}.',mo:'An der Wand ist eine Innendämmung, Vorsatzschale oder Verkleidung vorhanden.',h:'Art',alt:'Innendämmung, Vorsatzschale oder Verkleidung an der Wand',neu:true},
    {k:'K2.3',q:'Rohr- und Leitungsdurchführungen',ok:'Rohr- und Leitungsdurchführungen waren trocken.',m:'Rohr- und Leitungsdurchführungen waren feucht oder nass: {}.',mo:'Rohr- und Leitungsdurchführungen waren feucht oder nass.',h:'wo',alt:'Rohr- und Leitungsdurchführungen trocken'},
    {k:'K2.4',q:'Übergang Wand / Boden',ok:'Am Übergang Wand/Boden waren keine Feuchte, Risse oder offenen Fugen erkennbar.',m:'Am Übergang Wand/Boden festgestellt: {}.',mo:'Am Übergang Wand/Boden wurden Feuchte, Risse oder offene Fugen festgestellt.',h:'Feuchte / Risse / Fugen – wo',alt:'Übergang Wand / Boden: Feuchte, Risse, Fugen'},
    {k:'K2.5',q:'Wasser- und Abwasserleitungen im Raum',ok:'Wasser- und Abwasserleitungen im Raum waren trocken.',m:'An Wasser- oder Abwasserleitungen festgestellt: {}.',mo:'An Wasser- oder Abwasserleitungen wurde Feuchte festgestellt.',h:'Feuchte / Tropfwasser – wo',alt:'Wasser- und Abwasserleitungen im Raum trocken'},
    {k:'K2.6',q:'Bodenablauf, Rückstauklappe, Hebeanlage',ok:'Im Raum ist kein Bodenablauf, keine Rückstauklappe und keine Hebeanlage vorhanden.',m:'Im Raum ist vorhanden: {}.',mo:'Im Raum ist ein Bodenablauf, eine Rückstauklappe oder eine Hebeanlage vorhanden.',h:'Bodenablauf / Rückstauklappe / Hebeanlage',alt:'Bodenablauf, Rückstauklappe oder Hebeanlage vorhanden und gewartet',neu:true,zuAngabe:'K5.5'}
  ]},
  {titel:'Außen am Haus',items:[
    {k:'K3.1',q:'Fallrohre und Regenwasseranschluss',ok:'An Fallrohren und Regenwasseranschluss waren keine Schäden erkennbar.',m:'An Fallrohren oder Regenwasseranschluss festgestellt: {}.',mo:'An Fallrohren oder Regenwasseranschluss wurde ein Schaden festgestellt.',h:'Schaden – wo',alt:'Fallrohre und Regenwasseranschluss in Ordnung'},
    {k:'K3.2',q:'Gelände und Pflaster',ok:'Gelände und Pflaster fallen vom Haus weg ab.',m:'Gelände oder Pflaster fällt zum Haus hin ab oder liegt eben: {}.',mo:'Gelände oder Pflaster fällt zum Haus hin ab oder liegt eben.',h:'wo',alt:'Gelände / Pflaster fällt vom Haus weg ab'},
    {k:'K3.3',q:'Kellerfenster und Lichtschacht',ok:'Am Kellerfenster und am Lichtschacht war keine Undichtigkeit erkennbar.',m:'Am Kellerfenster oder Lichtschacht festgestellt: {}.',mo:'Am Kellerfenster oder Lichtschacht wurde eine Undichtigkeit festgestellt.',h:'Undichtigkeit / Wasserstand – wo',alt:'Kellerfenster / Lichtschacht dicht, Lichtschacht entwässert'},
    {k:'K3.4',q:'Sockel',ok:'Am Sockel waren keine Risse, Putzschäden oder Feuchteflecken erkennbar.',m:'Am Sockel festgestellt: {}.',mo:'Am Sockel wurden Risse, Putzschäden oder Feuchteflecken festgestellt.',h:'Risse / Putzschäden / Feuchteflecken – wo',alt:'Sockel: Risse, Putzschäden oder Feuchteflecken'},
    {k:'K3.5',q:'Erde, Bewuchs und Spritzwasser an der Hauswand',ok:'Es lagen keine Erde und kein Bewuchs direkt an der Hauswand.',m:'An der Hauswand vorgefunden: {}.',mo:'An der Hauswand wurden Erde, Bewuchs oder ein Spritzwasserbereich vorgefunden.',h:'Erde / Bewuchs / Spritzwasser – wo',alt:'Spritzwasser, Bewuchs oder Erde direkt an der Hauswand'},
    {k:'K3.6',q:'Drainage / Kontrollschacht',ok:'Ein Drainage- oder Kontrollschacht war nicht erkennbar.',m:'Kontrollschacht vorhanden, Wasserstand: {}.',mo:'Ein Kontrollschacht ist vorhanden.',h:'Wasserstand',alt:'Drainage / Kontrollschacht vorhanden, Wasserstand',neu:true}
  ]},
  {titel:'Lüftung und Nutzung',items:[
    {k:'K4.1',q:'Kellerfenster',ok:'Das Kellerfenster war zum Zeitpunkt der Begehung geschlossen.',m:'Das Kellerfenster war zum Zeitpunkt der Begehung geöffnet.',alt:'Kellerfenster im Sommer offen (warme Luft schlägt sich an kalten Wänden nieder)',neu:true,zuAngabe:'K5.4'},
    {k:'K4.2',q:'Gegenstände an der Außenwand, Kartons auf dem Boden',ok:'Keine Gegenstände standen direkt an der Außenwand, und es standen keine Kartons auf dem Boden.',m:'Es stehen Gegenstände direkt an der Außenwand bzw. Kartons auf dem Boden: {}.',mo:'Es stehen Gegenstände direkt an der Außenwand bzw. Kartons auf dem Boden.',h:'was, wo',alt:'Gegenstände direkt an der Außenwand oder in Kartons auf dem Boden'},
    {k:'K4.3',q:'Weitere Feuchtequellen',ok:'Keine weiteren Feuchtequellen vorgefunden (Luftentfeuchter, Pflanzen, Brennholz).',m:'Vorgefunden: {}.',mo:'Weitere Feuchtequellen vorgefunden.',h:'Luftentfeuchter / Pflanzen / Brennholz / …',alt:'Weitere Feuchtequellen (Luftentfeuchter, Pflanzen, Brennholz)'},
    {k:'K4.4',q:'Angrenzende Keller',ok:'Die angrenzenden Keller wurden besichtigt. Dort waren optisch keine Auffälligkeiten zu sehen.',m:'In den angrenzenden Kellern war Gleiches festzustellen: {}.',mo:'In den angrenzenden Kellern war Gleiches festzustellen.',h:'was',alt:'Nachbarkeller ebenso betroffen'},
    {k:'K4.5',q:'Wäsche im Keller',ok:'Zum Zeitpunkt der Begehung hing keine Wäsche zum Trocknen im Keller.',m:'Zum Zeitpunkt der Begehung hing Wäsche zum Trocknen im Keller.',alt:'Wäsche wird im Keller getrocknet',neu:true,zuAngabe:'K5.6'}
  ]}
];
const FS_BG_KELLER_ANGABEN=[
  {k:'K5.1',q:'Seit wann? Nur nach Regen, nur im Sommer oder immer?',alt:'Seit wann? Nur nach Regen, nur im Sommer oder immer?'},
  {k:'K5.2',q:'Frühere Wasserschäden, Hochwasser, bisherige Maßnahmen',alt:'Frühere Wasserschäden, Hochwasser, bisherige Maßnahmen'},
  {k:'K5.3',q:'Was hat sich zuletzt geändert?',alt:'Was hat sich zuletzt geändert?'},
  {k:'K5.4',q:'Kellerfenster: wann ist es offen oder geschlossen?'},
  {k:'K5.5',q:'Bodenablauf, Rückstauklappe, Hebeanlage: Wartung?'},
  {k:'K5.6',q:'Wird im Keller gewöhnlich Wäsche getrocknet?'}
];
const FS_BG_WOHNUNG=[
  {titel:'Befund in den Räumen',items:[
    {k:'W1.1',q:'Schimmel',ok:'In den besichtigten Räumen war kein Schimmel sichtbar.',m:'Schimmel sichtbar: {}.',mo:'Schimmel sichtbar.',h:'Raum, Lage, ungefähre Fläche',alt:'Schimmel sichtbar (Lage und Größe notieren)'},
    {k:'W1.2',q:'Fenster und Dichtungen',ok:'Die Fenster waren nicht beschlagen, die Dichtungen ohne Verfärbung.',m:'Fenster beschlagen bzw. Dichtungen verfärbt: {}.',mo:'Fenster beschlagen bzw. Dichtungen verfärbt.',h:'welche',alt:'Fenster beschlagen / Dichtungen verfärbt'},
    {k:'W1.3',q:'Möbel an Außenwänden',ok:'Möbel standen nicht dicht an Außenwänden.',m:'Möbel stehen dicht an Außenwänden: {}.',mo:'Möbel stehen dicht an Außenwänden.',h:'Raum, Wand, Abstand',alt:'Möbel dicht an Außenwänden'},
    {k:'W1.4',q:'Abluft Küche und Bad',ok:'An der Abluft in Küche und Bad war ein Luftzug wahrnehmbar.',m:'An der Abluft in {} war kein Luftzug wahrnehmbar.',mo:'An der Abluft in Küche oder Bad war kein Luftzug wahrnehmbar.',h:'Küche / Bad',alt:'Abluft Küche und Bad zieht'},
    {k:'W1.5',q:'Wäsche in der Wohnung',ok:'Zum Zeitpunkt der Begehung hing keine Wäsche zum Trocknen in der Wohnung.',m:'Zum Zeitpunkt der Begehung hing Wäsche zum Trocknen in der Wohnung: {}.',mo:'Zum Zeitpunkt der Begehung hing Wäsche zum Trocknen in der Wohnung.',h:'Raum',alt:'Wäsche wird in der Wohnung getrocknet',neu:true,zuAngabe:'W3.4'}
  ]},
  {titel:'Dach, Dachboden, Hohlraum',items:[
    {k:'W2.1',q:'Dämmung bis an den Rand',ok:'Die Dämmung reichte bis an den Rand.',m:'Die Dämmung reichte nicht bis an den Rand: {}.',mo:'Die Dämmung reichte nicht bis an den Rand.',h:'wo',alt:'Dämmung vollständig bis an den Rand'},
    {k:'W2.2',q:'Dämmung',ok:'Die Dämmung war trocken.',m:'Die Dämmung war feucht oder nass: {}.',mo:'Die Dämmung war feucht oder nass.',h:'wo',alt:'Dämmung trocken'},
    {k:'W2.3',q:'Unterseite von Dach bzw. Decke',ok:'An der Unterseite von Dach bzw. Decke waren keine Wasserspuren erkennbar.',m:'An der Unterseite von Dach bzw. Decke erkennbar: {}.',mo:'An der Unterseite von Dach bzw. Decke waren Wasserspuren erkennbar.',h:'Wasserspuren – wo',alt:'Unterseite Dach bzw. Decke ohne Wasserspuren'},
    {k:'W2.4',q:'Abdichtung und Eindeckung',ok:'An Abdichtung und Eindeckung waren keine Schäden erkennbar.',m:'An Abdichtung oder Eindeckung festgestellt: {}.',mo:'An Abdichtung oder Eindeckung wurde ein Schaden festgestellt.',h:'Schaden – wo',alt:'Abdichtung / Eindeckung ohne Schäden'},
    {k:'W2.5',q:'Anschlüsse, Durchdringungen, Dachrand',ok:'An Anschlüssen, Durchdringungen und Dachrand waren keine Undichtigkeiten erkennbar.',m:'Festgestellt an Anschlüssen, Durchdringungen oder Dachrand: {}.',mo:'An Anschlüssen, Durchdringungen oder Dachrand wurde eine Undichtigkeit festgestellt.',h:'was, wo',alt:'Anschlüsse, Durchdringungen, Dachrand dicht'},
    {k:'W2.6',q:'Entwässerung',ok:'An der Entwässerung war keine Verstopfung erkennbar.',m:'An der Entwässerung festgestellt: {}.',mo:'An der Entwässerung wurde eine Einschränkung festgestellt.',h:'Laub / Verstopfung / Stauwasser – wo',alt:'Entwässerung frei'}
  ]}
];
const FS_BG_WOHNUNG_ANGABEN=[
  {k:'W3.1',q:'Seit wann? Nur nach Regen oder immer?',alt:'Seit wann? Nur nach Regen oder immer?'},
  {k:'W3.2',q:'Was hat sich zuletzt geändert (Personen, Sanierung, Heizung)?',alt:'Was hat sich zuletzt geändert (Personen, Sanierung, Heizung)?'},
  {k:'W3.3',q:'Wie wird gelüftet und geheizt?',alt:'Wie wird gelüftet und geheizt?'},
  {k:'W3.4',q:'Wird in der Wohnung gewöhnlich Wäsche getrocknet?'}
];
const FS_BG_MERK_KEY='pam_fs_aufgenommen';
function _fsIstBegehung(b){return !!b&&b.fassung==='begehung';}
// „Aufgenommen von": einmal getippt, das Gerät merkt es sich (NICHT in dieser öffentlichen Datei)
function _fsBgMerkName(neu){
  try{
    if(typeof neu==='string'){const v=neu.trim();if(v)localStorage.setItem(FS_BG_MERK_KEY,v);return v;}
    return String(localStorage.getItem(FS_BG_MERK_KEY)||'');
  }catch(e){return '';}
}
function _fsBgItem(d){
  const it={k:d.k,text:d.q,ok:d.ok||'',m:d.m||'',mo:d.mo||'',h:d.h||'',status:'offen',notiz:'',fotoRefs:[]};
  if(d.typ){it.typ=d.typ;it.abh=d.abh||'';}
  return it;
}
function _fsBgAngabe(d){return {k:d.k,q:d.q,text:'',von:''};}
function _fsBgNeuerBericht(t,art){return _fsBgUmstellen(_fsNeuerBericht(t,art));}
// Ein frisch angelegtes (leeres) Protokoll auf die Fassung „Begehungsprotokoll" umstellen
function _fsBgUmstellen(b){
  const keller=b.art==='keller';
  b.fassung='begehung';
  b.titel=FS_BG_TITEL+(keller?' Keller':' Wohnung');
  Object.assign(b.kopf,{anlass:'',beginn:'',ende:'',geraetLuft:'',geraetOberflaeche:'',geraetBauteil:'',pruefer:_fsBgMerkName()});
  b.anwesende=[];
  b.sektionen=(keller?FS_BG_KELLER:FS_BG_WOHNUNG).map(s=>({titel:s.titel,items:s.items.map(_fsBgItem)}));
  b.angaben=(keller?FS_BG_KELLER_ANGABEN:FS_BG_WOHNUNG_ANGABEN).map(_fsBgAngabe);
  return b;
}
// Satz am Ende sauber schließen
function _fsBgPunkt(s){
  s=String(s||'').trim();
  if(!s)return '';
  return /[.!?:]$/.test(s)?s:s+'.';
}
// Der Satz, der für einen Punkt ins PDF kommt – leer, wenn nichts angetippt/ausgefüllt wurde.
// sek = Abschnitt des Punktes (für typ 'notiz': der Punkt abh muss rechts gewählt sein)
function _fsBgSatz(it,sek){
  if(!it)return '';
  const nz=String(it.notiz||'').trim().replace(/[.\s]+$/,'');
  if(it.frei){
    const tx=String(it.text||'').trim().replace(/[.\s]+$/,'');
    if(!tx)return '';
    return _fsBgPunkt(tx+(nz?': '+nz:''));
  }
  if(it.typ==='notiz'){
    const ab=((sek&&sek.items)||[]).find(x=>x&&x.k===it.abh);
    if(!ab||ab.status!=='mangel'||!nz)return '';
    return (it.m||'{}').split('{}').join(nz);
  }
  const mitNotiz=(satz)=>{const s=String(satz||'').trim();if(!s)return '';return nz?s+' '+_fsBgPunkt(nz):s;};
  if(it.status==='ok')return mitNotiz(it.ok);
  if(it.status==='mangel'){
    const m=String(it.m||'');
    if(m.indexOf('{}')>=0)return nz?m.split('{}').join(nz):String(it.mo||m.split(': {}').join('').split(' {}').join('')).trim();
    return mitNotiz(m);
  }
  return '';
}
// Anwesende als Text: „Name (Rolle) · Name (Rolle)"; ohne Liste der alte Freitext
function _fsBgAnwesendText(b){
  const l=(b&&Array.isArray(b.anwesende))?b.anwesende.filter(p=>p&&String(p.name||'').trim()):[];
  if(l.length)return l.map(p=>String(p.name).trim()+(String(p.rolle||'').trim()?' ('+String(p.rolle).trim()+')':'')).join(' · ');
  return String((b&&b.kopf&&b.kopf.anwesend)||'').trim();
}
function _fsBgZeitText(k){
  const a=String((k&&k.beginn)||'').trim(),e=String((k&&k.ende)||'').trim();
  if(a&&e)return a+' bis '+e+' Uhr';
  if(a)return 'ab '+a+' Uhr';
  if(e)return 'bis '+e+' Uhr';
  return '';
}
/* ── F2c: Räume mit Wänden, Ort der Messstellen, Fotos an Raum und Wand ─────────────────────────────────────
   Neue, freiwillige Felder (Altbestand bleibt lesbar): Raum {zeit, bedingung, waende:[{k:'W1',art,fotoRefs}], fotoRefs},
   Messstelle {wand:'W2', hoehe:'10', zeit:'08:14', referenz:true}. „Boden" und „Decke" sind Flächen mit k 'Boden' / 'Decke'.
   ⛔ Nur Bezeichnungen und Programm in dieser öffentlichen Datei. Texte fürs PDF: nur Zeichen der PDF-Schrift. */
function _fsBgRaumNeu(name){return {name:String(name||''),t:'',rf:'',zeit:'',bedingung:'',waende:[],fotoRefs:[]};}
function _fsBgRaum(b,name){return ((b&&b.raeume)||[]).find(r=>r&&r.name&&r.name===name)||null;}
// W1…W4 anlegen (nur fehlende)
function _fsBgWaendeVier(r){
  if(!r)return r;
  if(!Array.isArray(r.waende))r.waende=[];
  for(let i=1;i<=4;i++){const k='W'+i;if(!r.waende.some(w=>w&&w.k===k))r.waende.push({k,art:'',fotoRefs:[]});}
  return r;
}
// nächste freie Wand-Nummer
function _fsBgWandNeu(r){
  if(!Array.isArray(r.waende))r.waende=[];
  let n=1;while(r.waende.some(w=>w&&w.k==='W'+n))n++;
  const w={k:'W'+n,art:'',fotoRefs:[]};r.waende.push(w);return w;
}
// Boden oder Decke (nur einmal je Raum)
function _fsBgFlaeche(r,k){
  if(!Array.isArray(r.waende))r.waende=[];
  if(!r.waende.some(w=>w&&w.k===k))r.waende.push({k,art:'',fotoRefs:[]});
  return r;
}
// „W2 (Außenwand)" – leer, wenn keine Wand gewählt ist
function _fsBgWandLabel(b,st){
  const k=String((st&&st.wand)||'').trim();
  if(!k)return '';
  const r=_fsBgRaum(b,st&&st.raum),w=(r&&Array.isArray(r.waende))?r.waende.find(x=>x&&x.k===k):null;
  const art=w?String(w.art||'').trim():'';
  return k+(art?' ('+art+')':'');
}
// „Kellerraum – W2 (Außenwand), 10 cm – Ecke oben"
function _fsBgOrt(b,st){
  const wand=_fsBgWandLabel(b,st),h=String((st&&st.hoehe)||'').trim().replace(/\s*cm\s*$/i,'');
  const mitte=wand?(h?wand+', '+h+' cm':wand):(h?h+' cm':'');
  return [String((st&&st.raum)||'').trim(),mitte,String((st&&st.text)||'').trim()].filter(Boolean).join(' – ');
}
// Uhrzeit „8:5" / „08:14" → „08:14"; sonst leer
function _fsBgZeitNorm(z){
  const m=/^(\d{1,2}):(\d{2})$/.exec(String(z||'').trim());
  if(!m||+m[1]>23||+m[2]>59)return '';
  return ('0'+m[1]).slice(-2)+':'+m[2];
}
// Uhrzeit einer Messstelle: von Hand eingetragen, sonst aus der testo-Messung, sonst leer
function _fsBgStellenZeit(st){
  const hand=_fsBgZeitNorm(st&&st.zeit);
  if(hand)return hand;
  const z=st&&st.testo&&st.testo.zeit;
  if(!z)return '';
  const t=_fsZeitText(z);
  return t?t.slice(11,16):'';
}
function _fsBgStelleGefuellt(st){
  if(!st)return false;
  return !!(String(st.text||'').trim()||_fsZahl(st.ts)!==null||_fsZahl(st.mf)!==null||_fsZahl(st.luftT)!==null||_fsZahl(st.luftRf)!==null
    ||String(st.notiz||'').trim()||(Array.isArray(st.befund)&&st.befund.length)||(Array.isArray(st.fotoRefs)&&st.fotoRefs.length));
}
// Messstellen für das PDF: nur ausgefüllte; reguläre nach Uhrzeit (ohne Uhrzeit hinten, dort bleibt die Reihenfolge), Vergleichsstellen
// ans Ende. nr = gedruckte Nummer: 1…n, Vergleichsstellen „R" (bei mehreren R1, R2 …). i = Platz im Formular.
function _fsBgStellenSortiert(b){
  const alle=((b&&b.stellen)||[]).map((st,i)=>({st,i,z:_fsBgStellenZeit(st)})).filter(x=>_fsBgStelleGefuellt(x.st));
  const vgl=(a,c)=>{
    if(a.z&&c.z)return a.z<c.z?-1:a.z>c.z?1:a.i-c.i;
    if(a.z)return -1;
    if(c.z)return 1;
    return a.i-c.i;
  };
  const reg=alle.filter(x=>!x.st.referenz).sort(vgl),ref=alle.filter(x=>x.st.referenz).sort(vgl);
  reg.forEach((x,n)=>{x.nr=String(n+1);});
  ref.forEach((x,n)=>{x.nr=ref.length>1?'R'+(n+1):'R';});
  return reg.concat(ref);
}
// Frische Messstelle im Begehungsprotokoll: Uhrzeit „jetzt", Wand wie bei der letzten Stelle (gleiche Wand, andere Höhe), keine Vergleichsstelle
function _fsBgStelleNeu(st,letzte){
  const d=new Date(),p=n=>('0'+n).slice(-2);
  st.zeit=p(d.getHours())+':'+p(d.getMinutes());
  st.wand=(letzte&&letzte.wand)?letzte.wand:'';
  st.hoehe='';
  st.referenz=false;
  return st;
}
// testo-Messung (Zeile q) mit einer anderen Stelle (Zeile z, ohne eigene testo-Messung) zusammenführen: „eine Zeile je Ort".
// Es werden nur LEERE Felder der Zielstelle gefüllt; die Quellzeile entfällt. Gibt true zurück, wenn zusammengeführt wurde.
function _fsBgZusammenfuehren(b,quelleIdx,zielIdx){
  const q=b&&b.stellen&&b.stellen[quelleIdx],z=b&&b.stellen&&b.stellen[zielIdx];
  if(!q||!z||q===z||!q.testo||z.testo)return false;
  if(_fsZahl(z.ts)===null&&_fsZahl(q.ts)!==null)z.ts=q.ts;
  if(_fsZahl(z.luftT)===null&&_fsZahl(z.luftRf)===null&&_fsZahl(q.luftT)!==null&&_fsZahl(q.luftRf)!==null){z.luftT=q.luftT;z.luftRf=q.luftRf;}
  const zq=_fsBgStellenZeit(q);
  if(zq)z.zeit=zq; // als Uhrzeit gilt die der testo-Messung (die vorbelegte „jetzt"-Zeit der Zielstelle ist nur der Anlegezeitpunkt)
  z.testo=q.testo;
  if(!Array.isArray(z.fotoRefs))z.fotoRefs=[];
  (Array.isArray(q.fotoRefs)?q.fotoRefs:[]).forEach(r=>{if(z.fotoRefs.indexOf(r)<0)z.fotoRefs.push(r);});
  if(!Array.isArray(z.befund))z.befund=[];
  (Array.isArray(q.befund)?q.befund:[]).forEach(x=>{if(z.befund.indexOf(x)<0)z.befund.push(x);});
  const nq=String(q.notiz||'').trim();
  if(nq&&String(z.notiz||'').indexOf(nq)<0)z.notiz=(String(z.notiz||'').trim()?String(z.notiz).trim()+'\n':'')+nq;
  b.stellen.splice(quelleIdx,1);
  return true;
}
// Bildunterschrift im PDF: wozu gehört das Foto – Raum, Wand, Messstelle (mit der gedruckten Nummer), Feststellung
function _fsBgFotoZuordnung(b,f){
  const teile=[];
  ((b&&b.raeume)||[]).forEach(r=>{
    if(!r)return;
    const name=String(r.name||'').trim()||'Raum';
    if((r.fotoRefs||[]).some(x=>_fsRefPasst(f,x)))teile.push(name);
    (r.waende||[]).forEach(w=>{
      if(w&&(w.fotoRefs||[]).some(x=>_fsRefPasst(f,x))){
        const art=String(w.art||'').trim();
        teile.push(name+', '+w.k+(art?' ('+art+')':''));
      }
    });
  });
  _fsBgStellenSortiert(b).forEach(x=>{
    if((x.st.fotoRefs||[]).some(r=>_fsRefPasst(f,r))){
      const ort=_fsBgOrt(b,x.st);
      teile.push((x.st.referenz?'Vergleichsstelle ':'Messstelle ')+x.nr+(ort?' ('+ort+')':''));
    }
  });
  ((b&&b.sektionen)||[]).forEach(sek=>((sek&&sek.items)||[]).forEach(it=>{
    if(it&&it.text&&(it.fotoRefs||[]).some(r=>_fsRefPasst(f,r)))teile.push(it.text);
  }));
  return teile.join(' · ');
}
function _fsBgSektionKurz(sek){
  let da=0,offen=0;
  ((sek&&sek.items)||[]).forEach(it=>{
    if(it.typ==='notiz')return;
    if(it.frei||it.status==='ok'||it.status==='mangel')da++;else offen++;
  });
  return [da?da+' erfasst':'',offen?offen+' offen':''].filter(Boolean).join(' · ')||'keine Punkte';
}
// Altes Protokoll → Begehungsprotokoll. Nichts geht verloren: Eingaben, Fotos, Messwerte bleiben, Ursache und Empfehlungen bleiben in den
// Daten (stehen nur nicht mehr im PDF). Punkte, bei denen ein altes ✓/⚠ nicht übertragbar ist, bekommen „neuAnsehen".
// Gibt {gewandelt, neu:[Kennungen]} zurück. Wiederholen ist harmlos (zweiter Aufruf tut nichts).
function _fsZuBegehung(b){
  if(!b||b.fassung==='begehung')return {gewandelt:false,neu:[]};
  _fsVervollstaendigen(b);
  const keller=_fsIstKeller(b);
  const defs=keller?FS_BG_KELLER:FS_BG_WOHNUNG,angDefs=keller?FS_BG_KELLER_ANGABEN:FS_BG_WOHNUNG_ANGABEN;
  const alt=[];
  (b.sektionen||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{if(it)alt.push(it);}));
  const benutzt=new Set();
  const finde=text=>{const it=alt.find(x=>x.text===text&&!benutzt.has(x));if(it)benutzt.add(it);return it||null;};
  const neu=[],angaben=angDefs.map(_fsBgAngabe);
  const angabe=k=>angaben.find(a=>a.k===k);
  const sektionen=defs.map(s=>({titel:s.titel,items:s.items.map(d=>{
    const n=_fsBgItem(d);
    const a=d.alt?finde(d.alt):null;
    if(!a)return n;
    const nz=String(a.notiz||'');
    const fr=Array.isArray(a.fotoRefs)?a.fotoRefs.slice():[];
    n.fotoRefs=fr;
    if(d.zuAngabe&&angabe(d.zuAngabe)){angabe(d.zuAngabe).text=nz;} // die alte Notiz war eine Angabe des Nutzers
    else n.notiz=nz;
    if(d.typ)return n;
    if(a.status!=='ok'&&a.status!=='mangel')return n;
    if(d.neu){n.neuAnsehen=true;neu.push(d.k);}
    else n.status=a.status;
    return n;
  })}));
  angDefs.forEach(d=>{
    const a=d.alt?finde(d.alt):null;
    if(a&&String(a.notiz||'').trim())angabe(d.k).text=String(a.notiz);
  });
  const uebrig=alt.filter(x=>!benutzt.has(x)&&(x.status==='ok'||x.status==='mangel'||String(x.notiz||'').trim()||(Array.isArray(x.fotoRefs)&&x.fotoRefs.length)));
  if(uebrig.length){
    sektionen.push({titel:'Weitere Feststellungen',items:uebrig.map(x=>({frei:true,text:String(x.text||''),notiz:String(x.notiz||''),status:'mangel',fotoRefs:Array.isArray(x.fotoRefs)?x.fotoRefs.slice():[],neuAnsehen:true}))});
    neu.push('frei');
  }
  b.sektionen=sektionen;
  b.angaben=angaben;
  b.fassung='begehung';
  b.titel=FS_BG_TITEL+(keller?' Keller':' Wohnung');
  b.umgewandeltAm=new Date().toISOString();
  _fsVervollstaendigen(b);
  return {gewandelt:true,neu};
}

// Quelle der Wetterangabe fürs PDF – ohne Quelle (von Hand eingetragen) bleibt die Zeile leer
function _fsBgWetterQuelle(k){
  const q=String((k&&k.wetterQuelle)||'').trim();
  if(!q)return '';
  const d=new Date((k&&k.wetterAbruf)||'');
  if(isFinite(d.getTime())){
    const p=n=>('0'+n).slice(-2);
    const stunde=String((k&&k.wetterStunde)||'').trim();
    return 'Angabe des Wetterdienstes Open-Meteo'+(stunde?' (Wert der Stunde '+stunde+' Uhr)':'')+', abgerufen am '+p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()+' um '+p(d.getHours())+':'+p(d.getMinutes())+' Uhr – nicht vor Ort gemessen.';
  }
  return 'Angabe des Wetterdienstes ('+q+') – nicht vor Ort gemessen.';
}

// PDF des Begehungsprotokolls: nur Ausgefülltes, nur Feststellungen. Kein Ergebnis-Kasten, keine Ampel, keine Rechenwerte,
// keine Ursache, keine Empfehlung, keine Sammelzeile „nicht erfasst". Abschnitte ohne Inhalt fehlen, die Nummern laufen durch.
async function _fsMobPdfBg(bericht,task){
  if(!window.jspdf){toast('PDF-Bibliothek lädt noch …','error');return null;}
  try{
    _fsVervollstaendigen(bericht);
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=210,M=14,farbe=[31,95,139];let y=M;
    const k=bericht.kopf;
    const keller=_fsIstKeller(bericht);
    const hat=v=>!(v===null||v===undefined||String(v).trim()==='');
    const zahlText=(v,einheit)=>{const n=_fsZahl(v);return n===null?'–':_fsEins(n)+(einheit?' '+einheit:'');};
    let nr=0;
    const abschnitt=titel=>{
      if(y>262){doc.addPage();y=M;}
      nr++;
      doc.setFillColor(227,237,245);doc.rect(M,y,W-2*M,7,'F');
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(...farbe);
      doc.text(nr+' · '+titel,M+2,y+5);y+=9;
    };
    const unterTitel=text=>{
      if(y>268){doc.addPage();y=M;}
      doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(40,40,40);
      doc.text(text,M,y+3);y+=6;
    };
    const absatz=(text,opt)=>{
      opt=opt||{};
      const gr=opt.groesse||9,ein=opt.einzug||0,c=opt.farbe||[0,0,0],lh=4.3*gr/9;
      doc.setFont('helvetica',opt.fett?'bold':'normal');doc.setFontSize(gr);doc.setTextColor(c[0],c[1],c[2]);
      const zeilen=doc.splitTextToSize(String(text),W-2*M-ein);
      if(y+zeilen.length*lh+2>285){doc.addPage();y=M;}
      doc.text(zeilen,M+ein,y+3);
      y+=zeilen.length*lh+(opt.abstand===undefined?2:opt.abstand);
    };
    const tabelle2=rows=>{
      if(!rows.length)return;
      doc.autoTable({startY:y,theme:'grid',margin:{left:M,right:M},bodyStyles:{fontSize:8.5,minCellHeight:6},
        columnStyles:{0:{fontStyle:'bold',cellWidth:34,fillColor:[245,245,245]},1:{cellWidth:148}},body:rows});
      y=doc.lastAutoTable.finalY+4;
    };

    // Kopf
    doc.setFillColor(...farbe);doc.rect(0,0,W,32,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');
    doc.text(FS_BG_TITEL,M,12);
    doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text('Feststellungen vor Ort – Feuchte '+(keller?'im Keller':'in der Wohnung'),M,18);
    const objekt=String(k.objektAdresse||(task&&task.adresse)||'').trim();
    if(objekt)doc.text(doc.splitTextToSize('Objekt: '+objekt,W-2*M)[0],M,24);
    doc.text('Datum: '+(hat(bericht.datum)?bericht.datum:'–')+(k.auftragNr?' · Auftrag: '+k.auftragNr:''),M,29.5);
    y=38;

    const fotoList=(bericht.fotos||[]).filter(f=>f&&f.inReport);
    const fotoNr=ref=>{const i=fotoList.findIndex(f=>_fsRefPasst(f,ref));return i<0?0:i+1;};
    const fotoHinweis=refs=>{const n=(Array.isArray(refs)?refs:[]).map(fotoNr).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);return n.length?' (Foto '+n.join(', ')+')':'';};

    // 1 · Auftrag und Umfang
    abschnitt('Auftrag und Umfang');
    {
      const rows=[];
      if(hat(k.auftraggeber))rows.push(['Auftraggeber',String(k.auftraggeber).trim()]);
      if(objekt)rows.push(['Objekt',objekt]);
      if(hat(k.nutzer))rows.push(['Nutzer',String(k.nutzer).trim()]);
      if(hat(k.anlass))rows.push(['Anlass',String(k.anlass).trim()]);
      tabelle2(rows);
      absatz('Umfang: '+FS_BG_UMFANG,{groesse:8.5,farbe:[70,70,70],abstand:5});
    }

    // 2 · Ortstermin
    {
      const rows=[];
      if(hat(bericht.datum))rows.push(['Datum',String(bericht.datum)]);
      const zt=_fsBgZeitText(k);if(zt)rows.push(['Beginn / Ende',zt]);
      const aw=_fsBgAnwesendText(bericht);if(aw)rows.push(['Anwesend',aw]);
      const wt=[];
      if(hat(k.wetter))wt.push(String(k.wetter).trim());
      const aT=_fsZahl(k.aussenT),aF=_fsZahl(k.aussenRf);
      if(aT!==null||aF!==null)wt.push('außen '+(aT!==null?_fsEins(aT)+' °C':'–')+(aF!==null?' / '+_fsEins(aF)+' % r. F.':''));
      if(hat(k.letzterRegen))wt.push('letzter Regen '+String(k.letzterRegen).trim());
      if(wt.length){
        const q=_fsBgWetterQuelle(k);
        rows.push(['Wetter',wt.join(', ')+(q?'\n'+q:'')]);
      }
      if(rows.length){abschnitt('Ortstermin');tabelle2(rows);}
    }

    // 3 · Messgeräte
    {
      const rows=[];
      if(hat(k.geraetLuft))rows.push(['Luft',String(k.geraetLuft).trim()]);
      if(hat(k.geraetOberflaeche))rows.push(['Oberfläche',String(k.geraetOberflaeche).trim()]);
      if(hat(k.geraetBauteil))rows.push(['Bauteil',String(k.geraetBauteil).trim()]);
      if(!rows.length&&hat(k.messgeraete))rows.push(['Messgeräte',String(k.messgeraete).trim()]); // altes Freitext-Feld
      if(rows.length){abschnitt('Messgeräte');tabelle2(rows);}
    }

    // 4 · Messwerte
    {
      const luft=(bericht.raeume||[]).filter(r=>r&&(_fsZahl(r.t)!==null||_fsZahl(r.rf)!==null||String(r.bedingung||'').trim()));
      const stellen=_fsBgStellenSortiert(bericht);
      const hatWaende=(bericht.raeume||[]).some(r=>r&&(((r.waende||[]).length)||((r.fotoRefs||[]).length)));
      if(luft.length||stellen.length||hatWaende){
        abschnitt('Messwerte');
        if(luft.length){
          unterTitel('Raumluft');
          doc.autoTable({startY:y,theme:'grid',margin:{left:M,right:M},
            head:[['Raum','Uhrzeit','Lufttemperatur','Luftfeuchte','Bedingungen']],
            body:luft.map(r=>[hat(r.name)?String(r.name).trim():'–',_fsBgZeitNorm(r.zeit)||'–',zahlText(r.t,'°C'),zahlText(r.rf,'% r. F.'),hat(r.bedingung)?String(r.bedingung).trim():'–']),
            headStyles:{fillColor:farbe,fontSize:8},bodyStyles:{fontSize:8.5,minCellHeight:6},
            columnStyles:{0:{cellWidth:44},1:{cellWidth:20,halign:'center'},2:{cellWidth:32,halign:'right'},3:{cellWidth:32,halign:'right'},4:{cellWidth:54}}});
          y=doc.lastAutoTable.finalY+5;
        }
        { // F2c: Wände und Fotos je Raum
          let n=0;
          (bericht.raeume||[]).forEach(r=>{
            if(!r)return;
            const ws=(Array.isArray(r.waende)?r.waende:[]).filter(q=>q&&q.k);
            const rf=fotoHinweis(r.fotoRefs);
            if(!ws.length&&!rf)return;
            const liste=ws.map(q=>q.k+(hat(q.art)?' '+String(q.art).trim():'')+fotoHinweis(q.fotoRefs)).join(', ');
            absatz((hat(r.name)?String(r.name).trim():'Raum')+rf+(liste?' – Wände: '+liste:''),{groesse:8,farbe:[70,70,70],abstand:1});
            n++;
          });
          if(n)y+=3;
        }
        if(stellen.length){
          unterTitel('Messstellen');
          doc.autoTable({startY:y,theme:'grid',margin:{left:M,right:M},
            head:[['Nr','Messstelle (Raum – Wand, Höhe – Ort)','Uhrzeit','Luft\n°C','Luft\n% r. F.','Oberfläche\n°C','Bauteil\nDigits','Beobachtung','Foto']],
            body:stellen.map(x=>{
              const st=x.st;
              const ort=_fsBgOrt(bericht,st);
              const bef=(Array.isArray(st.befund)&&st.befund.length)?'Befund: '+st.befund.join(', '):'';
              const beob=[st.referenz?'Vergleichsstelle (trockene Stelle)':'',bef,String(st.notiz||'').trim()].filter(Boolean).join('\n');
              const fn=(Array.isArray(st.fotoRefs)?st.fotoRefs:[]).map(fotoNr).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
              return [x.nr,ort||'–',x.z||'–',_fsZahl(st.luftT)===null?'–':_fsEins(_fsZahl(st.luftT)),_fsZahl(st.luftRf)===null?'–':_fsEins(_fsZahl(st.luftRf)),
                _fsZahl(st.ts)===null?'–':_fsEins(_fsZahl(st.ts)),_fsZahl(st.mf)===null?'–':_fsEins(_fsZahl(st.mf)),beob||'–',fn.join(', ')||'–'];
            }),
            headStyles:{fillColor:farbe,fontSize:7,fontStyle:'bold'},bodyStyles:{fontSize:7.5,minCellHeight:6},
            columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:46},2:{cellWidth:13,halign:'center'},3:{cellWidth:13,halign:'right'},4:{cellWidth:15,halign:'right'},
              5:{cellWidth:19,halign:'right'},6:{cellWidth:16,halign:'right'},7:{cellWidth:40},8:{cellWidth:12,halign:'center'}}});
          y=doc.lastAutoTable.finalY+3;
          const vgl=[];
          if(!stellen.some(x=>x.st.referenz))(bericht.stellen||[]).forEach(st=>{const v=_fsZahl(st&&st.mfVergleich);if(v!==null){const s=_fsEins(v);if(vgl.indexOf(s)<0)vgl.push(s);}});
          if(vgl.length)absatz('Vergleichsstelle (trockene Stelle): '+vgl.join(' / ')+' Digits.',{groesse:8,farbe:[70,70,70],abstand:1});
          absatz('Einzelmessungen zum Zeitpunkt der Begehung (Momentaufnahme). Bauteilfeuchte in Digits: Vergleichswerte des Geräts, keine Masse-%.',{groesse:7.5,farbe:[100,100,100],abstand:5});
        }
      }
    }

    // 5 · Feststellungen vor Ort
    {
      const gruppen=[];
      (bericht.sektionen||[]).forEach(sek=>{
        const zeilen=[];
        ((sek&&sek.items)||[]).forEach(it=>{const s=_fsBgSatz(it,sek);if(s)zeilen.push(s+fotoHinweis(it.fotoRefs));});
        if(zeilen.length)gruppen.push({titel:String(sek.titel||'').replace(/^\d+\s*·\s*/,''),zeilen});
      });
      if(gruppen.length){
        abschnitt('Feststellungen vor Ort');
        gruppen.forEach(g=>{
          unterTitel(g.titel);
          g.zeilen.forEach(z=>absatz('- '+z,{einzug:3,abstand:1.5}));
          y+=2;
        });
        y+=2;
      }
    }

    // 6 · Angaben der Nutzer
    {
      const an=(bericht.angaben||[]).filter(a=>a&&hat(a.text));
      if(an.length){
        abschnitt('Angaben der Nutzer (nicht selbst festgestellt)');
        an.forEach(a=>{
          if(hat(a.q))absatz(String(a.q).trim(),{groesse:8,farbe:[100,100,100],abstand:0.5});
          absatz('Laut '+(hat(a.von)?String(a.von).trim():'Nutzer')+': '+String(a.text).trim(),{einzug:3,abstand:3});
        });
        y+=2;
      }
    }

    // 7 · Zusammenfassung der Feststellungen
    if(hat(bericht.bemerkung)){
      abschnitt('Zusammenfassung der Feststellungen');
      absatz(String(bericht.bemerkung).trim(),{abstand:5});
    }

    // 8 · Fotos
    if(fotoList.length){
      const iW=85,iH=115;let col=0,erste=true,zeileH=0;
      for(let fi=0;fi<fotoList.length;fi++){
        const f=fotoList[fi];
        setSaveInd('saving','PDF: Foto '+(fi+1)+'/'+fotoList.length+' …');
        const d=await _fsFotoFuerPdf(f);
        if(!d)continue;
        if(col===0){
          if(erste){if(y+9+iH+10>285){doc.addPage();y=M;}abschnitt('Fotos');erste=false;}
          if(y+iH+10>285){doc.addPage();y=M;}
          zeileH=0;
        }
        const x=col===0?M:M+iW+12;
        let w=iW,h=iW*d.h/d.w;if(h>iH){h=iH;w=iH*d.w/d.h;}
        try{doc.addImage(d.dataUrl,'JPEG',x,y,w,h);}catch(e){console.warn('[Feuchte] Bild:',e);}
        const zu=_fsBgFotoZuordnung(bericht,f);
        doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(90,90,90);
        const cap=doc.splitTextToSize('Foto '+(fi+1)+(zu?' – '+zu:''),iW).slice(0,3); // F2c: die Unterschrift nennt Raum, Wand und Messstelle – bis zu drei Zeilen statt nur der ersten
        doc.text(cap,x,y+h+3.5);
        zeileH=Math.max(zeileH,h+(cap.length-1)*3);
        if(col===1)y+=zeileH+9;
        col=(col+1)%2;
      }
      if(col===1)y+=zeileH+9;
      setSaveInd('saved','');
    }

    // Unterschrift
    if(y+24>285){doc.addPage();y=M;}
    y+=12;
    doc.setDrawColor(120,120,120);doc.line(M,y+8,M+70,y+8);doc.line(W-M-70,y+8,W-M,y+8);
    doc.setFontSize(7.5);doc.setTextColor(90,90,90);doc.setFont('helvetica','normal');
    doc.text('Ort, Datum',M,y+12);doc.text('Unterschrift'+(hat(k.pruefer)?' ('+String(k.pruefer).trim()+')':''),W-M-70,y+12);

    const pages=doc.internal.getNumberOfPages();
    for(let p=1;p<=pages;p++){
      doc.setPage(p);doc.setFontSize(8);doc.setTextColor(150,150,150);
      doc.text('Seite '+p+' von '+pages,W/2,292,{align:'center'});
      doc.text('sv-fb.de',W-M,292,{align:'right'});
    }

    const blob=doc.output('blob');
    _fsPdfBlobs[bericht.id]=blob;
    const name=_fsPdfName(bericht,new Date());
    toast('✓ PDF erstellt – mit „📂 Öffnen" ansehen','success',4000);
    const inDrive=await _fsPdfNachDrive(blob,name,bericht,task);
    if(!inDrive){
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=name;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }
    return blob;
  }catch(e){
    console.error('[Feuchte] PDF:',e);
    try{setSaveInd('','');}catch(_e){}
    toast('PDF-Fehler: '+e.message,'error');
    return null;
  }
}

/* ══ v292: TESTO-MESSUNG EINLESEN (Feuchte- und Schimmelprotokoll) ══════════════════════
   Wunsch Frank 14.09.2026: die Messung der testo-App (605i Luft, 805i Thermometer) nicht abtippen.
   Die App speichert Werte (JSON, .tjf – öffentliches testo-Format) und Foto GETRENNT; das Foto zeigt
   weder Werte noch Laserpunkt. Deshalb: aus dem festen Drive-Ordner „testo-Eingang" lesen, je Datei
   eine Messstelle anlegen, die Werte ins Foto zeichnen (Messbild), den Messpunkt antippen lassen und
   Kopien der Rohdateien in den Auftragsordner legen (v293 – Verschieben verweigerte Google).
   ⛔ Geprüft an echten Dateien: Thermometer beim Speichern aus (kein SurfaceTemperature-Kanal),
     fest eingestellte Luftwerte (MoldManualAirTemp/MoldManualHumidity), Foto nicht mitgeteilt.
     Alle drei Fälle werden als Hinweis an der Messstelle gezeigt, nie still übergangen.
   ⛔ Die Oberflächenfeuchte rechnet PAM selbst (Luft aus derselben Messung); testos Wert steht nur daneben.
   ⛔ Kopiert wird erst NACH dem Anlegen der Stelle. Die Originale bleiben im Eingang und sind als
     „schon eingelesen" markiert – über alle Karten (v293). */
const FS_TESTO_ORDNER='testo-Eingang';

function _fsZeitText(ms){
  const d=new Date(Number(ms));
  if(!isFinite(d.getTime()))return '';
  const p=n=>('0'+n).slice(-2);
  return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
}
function _fsTestoKanal(tjf,name){
  const k=((tjf&&tjf.channels)||[]).find(c=>c&&c.type&&c.type.name===name);
  const w=(k&&Array.isArray(k.values)&&k.values.length)?Number(k.values[k.values.length-1].value):NaN;
  return isFinite(w)?w:null;
}
function _fsTestoEigenschaft(tjf,name){
  const p=((tjf&&tjf.properties)||[]).find(x=>x&&x.name===name);
  const v=(p&&Array.isArray(p.values)&&p.values[0])?p.values[0].value:undefined;
  return (v===undefined||v===null)?null:v;
}
// testo-JSON lesen – reine Funktion, bildNamenImOrdner = Dateinamen der Fotos im Eingangsordner
function _fsTestoLesen(text,bildNamenImOrdner){
  let tjf;
  try{tjf=(typeof text==='string')?JSON.parse(text):text;}catch(e){return {ok:false,fehler:'keine testo-JSON-Datei'};}
  if(!tjf||!Array.isArray(tjf.channels))return {ok:false,fehler:'keine testo-JSON-Datei (keine Messkanäle)'};
  const r={ok:true,warnungen:[]};
  const ts=Number(tjf.timeStamp);
  r.zeit=(isFinite(ts)&&ts>0)?ts*1000:null;
  r.luftT=_fsTestoKanal(tjf,'AirTemperature');
  r.luftRf=_fsTestoKanal(tjf,'Humidity');
  r.ts=_fsTestoKanal(tjf,'SurfaceTemperature');
  r.ofTesto=_fsTestoKanal(tjf,'SurfaceMoisture');
  r.tdTesto=_fsTestoKanal(tjf,'DewPointTemperature');
  r.geraete=(Array.isArray(tjf.device)?tjf.device:[]).map(d=>d&&d.name).filter(Boolean);
  r.bild=(Array.isArray(tjf.images)&&tjf.images[0])?String(tjf.images[0]):'';
  const mT=_fsTestoEigenschaft(tjf,'MoldManualAirTemp'),mF=_fsTestoEigenschaft(tjf,'MoldManualHumidity');
  const luftDa=r.luftT!==null&&r.luftRf!==null;
  if(r.ts===null)r.warnungen.push('Oberflächentemperatur fehlt – das Thermometer (805i) war beim Speichern nicht aktiv');
  if(!luftDa)r.warnungen.push('Luftwerte fehlen in der testo-Datei – gerechnet wird mit dem Raumklima');
  if(mT!==null||mF!==null)r.warnungen.push('testo hat mit fest eingestellten Luftwerten gerechnet'
    +((mT!==null&&mF!==null)?' ('+_fsEins(Number(mT))+' °C / '+_fsEins(Number(mF))+' %)':'')
    +' – PAM rechnet mit '+(luftDa?'den gemessenen Werten':'dem Raumklima'));
  if(r.bild&&Array.isArray(bildNamenImOrdner)&&bildNamenImOrdner.indexOf(r.bild)<0)r.warnungen.push('Foto '+r.bild+' war nicht dabei');
  return r;
}
function _fsStelleAusTesto(m,raumName){
  const z=m.zeit?_fsZeitText(m.zeit):'';
  return {
    text:'testo'+(z?' '+z.slice(11,16):''),raum:raumName||'',
    ts:m.ts===null?'':_fsEins(m.ts),luftT:m.luftT===null?'':_fsEins(m.luftT),luftRf:m.luftRf===null?'':_fsEins(m.luftRf),
    mf:'',mfVergleich:'',befund:[],notiz:'',fotoRefs:[],
    testo:{datei:m.datei||'',zeit:m.zeit||null,ofRf:m.ofTesto,td:m.tdTesto,bild:m.bild||'',punkt:null,warnungen:(m.warnungen||[]).slice()}
  };
}
// Leeres Raumklima mit den Luftwerten der Messung füllen – vorhandene Werte bleiben unangetastet
function _fsRaumAuffuellen(bericht,raumName,m){
  if(!bericht||!raumName||!m)return false;
  const r=(bericht.raeume||[]).find(x=>x&&x.name===raumName);
  if(!r)return false;
  if(_fsZahl(r.t)!==null||_fsZahl(r.rf)!==null)return false;
  if(m.luftT===null||m.luftRf===null)return false;
  r.t=_fsEins(m.luftT);r.rf=_fsEins(m.luftRf);
  return true;
}
function _fsTestoSchonDa(bericht,dateiName){
  return !!dateiName&&((bericht&&bericht.stellen)||[]).some(st=>st&&st.testo&&st.testo.datei===dateiName);
}
function _fsTestoInfoText(st,w){
  const te=(st&&st.testo)||{};
  const teile=['testo-Messung'+(te.zeit?' '+_fsZeitText(te.zeit):'')];
  if(w&&w.luftQuelle==='testo')teile.push('Luft '+_fsEins(w.T)+' °C / '+_fsEins(w.rf)+' %');
  if(typeof te.ofRf==='number'&&isFinite(te.ofRf))teile.push('testo-Oberflächenfeuchte '+_fsEins(te.ofRf)+' %');
  return teile.join(' · ');
}
// Fingertipp auf ein Bild mit object-fit:contain -> Anteil 0…1 im Bild (Ränder zählen nicht)
function _fsTippZuPunkt(cx,cy,rect,nw,nh){
  if(!rect||!nw||!nh)return null;
  const s=Math.min(rect.width/nw,rect.height/nh);
  const bw=nw*s,bh=nh*s;
  const ox=(rect.width-bw)/2,oy=(rect.height-bh)/2;
  const x=(cx-rect.left-ox)/bw,y=(cy-rect.top-oy)/bh;
  if(!(x>=0&&x<=1&&y>=0&&y<=1))return null;
  return {x:Math.round(x*1000)/1000,y:Math.round(y*1000)/1000};
}

async function _fsDriveGet(url){
  const r=await fetch(url,{headers:{Authorization:'Bearer '+gdriveToken}});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r;
}
async function _fsTestoOrdnerId(){
  const q="name='"+FS_TESTO_ORDNER+"' and mimeType='application/vnd.google-apps.folder' and trashed=false";
  const r=await _fsDriveGet('https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent(q)+'&fields=files(id,name)&pageSize=10');
  const d=await r.json();
  const f=(d&&d.files)||[];
  return f.length?f[0].id:null;
}
async function _fsTestoListe(ordnerId){
  const q="'"+ordnerId+"' in parents and trashed=false";
  const r=await _fsDriveGet('https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent(q)+'&fields=files(id,name,mimeType,size,createdTime)&orderBy=createdTime%20desc&pageSize=200');
  const d=await r.json();
  return (d&&d.files)||[];
}
async function _fsDriveText(id){return await (await _fsDriveGet('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media')).text();}
async function _fsDriveBlob(id){return await (await _fsDriveGet('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media')).blob();}
// v293: KOPIE als neue Datei hochladen. Verschieben ging nicht – PAM Mobil darf Dateien, die die Drive-App angelegt hat,
//   nur LESEN (Befund 14.09.2026 an einer echten Messung, Anmelde-Rechte drive.file + drive.readonly). Eigene Dateien sind erlaubt.
async function _fsDriveKopieHochladen(inhalt,name,mime,ordnerId){
  if(inhalt===null||inhalt===undefined||!name||!ordnerId)return null;
  const blob=(inhalt instanceof Blob)?inhalt:new Blob([String(inhalt)],{type:mime||'application/octet-stream'});
  const r=await _uploadMitGeduld(signal=>{
    const form=new FormData();
    form.append('metadata',new Blob([JSON.stringify({name:name,parents:[ordnerId],mimeType:mime||blob.type||'application/octet-stream'})],{type:'application/json'}));
    form.append('file',blob);
    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+gdriveToken},body:form,signal:signal});
  },{bytes:blob.size,name:name,folderId:ordnerId});
  const j=await r.json();
  return (j&&j.id)||null;
}
// v293: Wurde die testo-Datei schon an IRGENDEINER Karte eingelesen? (Originale bleiben im Eingang liegen)
function _fsTestoEingelesenIn(listen,dateiName){
  if(!dateiName)return null;
  for(const arr of (listen||[])){
    for(const k of (arr||[])){
      if(!k||!Array.isArray(k.pruefberichte))continue;
      for(const pb of k.pruefberichte){
        if(pb&&pb.vorlage==='feuchte'&&_fsTestoSchonDa(pb,dateiName))return {id:k.id,titel:k.title||''};
      }
    }
  }
  return null;
}
// v293: noch nicht eingelesene zuerst, jeweils nach Messzeit
function _fsTestoSortieren(liste){
  return liste.sort((a,b)=>((a.schonDa?1:0)-(b.schonDa?1:0))||((a.zeit||0)-(b.zeit||0)));
}

// Messbild: Werte wie in der Kamera-Ansicht der testo-App ins Foto zeichnen, dazu der angetippte Messpunkt
function _fsMessbildErstellen(blob,w,punkt,unterzeile){
  return new Promise(res=>{
    const url=URL.createObjectURL(blob);
    const img=new Image();
    img.onload=()=>{
      try{
        let W=img.naturalWidth,H=img.naturalHeight;
        if(Math.max(W,H)>1600){const s=1600/Math.max(W,H);W=Math.round(W*s);H=Math.round(H*s);}
        const cv=document.createElement('canvas');cv.width=W;cv.height=H;
        const g=cv.getContext('2d');
        g.drawImage(img,0,0,W,H);
        const b=Math.min(W,H),rand=Math.round(b*0.03),kw=Math.round((W-3*rand)/2),lh=Math.round(b*0.05),vh=Math.round(b*0.09);
        const ampelFarbe=w.ampel==='gruen'?'#2e9e4f':w.ampel==='gelb'?'#d99a00':w.ampel==='rot'?'#d0342c':'#8a8a8a';
        const kaesten=[
          ['Oberflächenfeuchtigkeit',w.ofRf===null?'–':_fsEins(w.ofRf)+' %rF',ampelFarbe,'#ffffff'],
          ['Oberflächentemperatur',w.ts===null?'–':_fsEins(w.ts)+' °C','rgba(255,255,255,.88)','#1c1c1e'],
          ['Umgebungsfeuchtigkeit',w.rf===null?'–':_fsEins(w.rf)+' %rF','rgba(255,255,255,.88)','#1c1c1e'],
          ['Umgebungstemperatur',w.T===null?'–':_fsEins(w.T)+' °C','rgba(255,255,255,.88)','#1c1c1e']
        ];
        kaesten.forEach((k,i)=>{
          const x=rand+(i%2)*(kw+rand),y=rand+Math.floor(i/2)*(lh+vh+rand);
          g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x,y,kw,lh+vh);
          g.fillStyle=k[2];g.fillRect(x,y,kw,lh);
          g.textBaseline='middle';g.textAlign='left';
          g.fillStyle=k[3];g.font='600 '+Math.round(lh*0.6)+'px sans-serif';
          g.fillText(k[0],x+Math.round(lh*0.3),y+lh/2,kw-Math.round(lh*0.6));
          g.fillStyle='#ffffff';g.font='700 '+Math.round(vh*0.62)+'px sans-serif';g.textAlign='right';
          g.fillText(k[1],x+kw-Math.round(lh*0.3),y+lh+vh/2,kw-Math.round(lh*0.6));
        });
        if(punkt&&typeof punkt.x==='number'&&typeof punkt.y==='number'){
          const px=punkt.x*W,py=punkt.y*H,r=Math.round(b*0.045);
          g.lineWidth=Math.max(3,Math.round(b*0.008));g.strokeStyle='#ff2a2a';
          g.beginPath();g.arc(px,py,r,0,Math.PI*2);g.stroke();
          g.beginPath();
          g.moveTo(px-r*1.7,py);g.lineTo(px-r*0.45,py);g.moveTo(px+r*0.45,py);g.lineTo(px+r*1.7,py);
          g.moveTo(px,py-r*1.7);g.lineTo(px,py-r*0.45);g.moveTo(px,py+r*0.45);g.lineTo(px,py+r*1.7);
          g.stroke();
          g.fillStyle='#ff2a2a';g.beginPath();g.arc(px,py,Math.max(3,r*0.14),0,Math.PI*2);g.fill();
        }
        if(unterzeile){
          const sh=Math.round(b*0.055);
          g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,H-sh,W,sh);
          g.fillStyle='#ffffff';g.font='600 '+Math.round(sh*0.48)+'px sans-serif';g.textBaseline='middle';g.textAlign='left';
          g.fillText(unterzeile,rand,H-sh/2,W-2*rand);
        }
        URL.revokeObjectURL(url);
        res(cv.toDataURL('image/jpeg',0.88));
      }catch(e){console.warn('[testo] Messbild:',e);URL.revokeObjectURL(url);res(null);}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);res(null);};
    img.src=url;
  });
}

// Messpunkt antippen – liefert {x,y} (Anteil im Bild) oder null („Ohne Punkt")
function _fsMesspunktWaehlen(bildUrl,titel){
  return new Promise(res=>{
    const alt=document.getElementById('_fsMesspunktOverlay');if(alt)alt.remove();
    const ov=document.createElement('div');ov.id='_fsMesspunktOverlay';
    ov.style.cssText='position:fixed;inset:0;z-index:100001;background:#000;display:flex;flex-direction:column;';
    const kopf=document.createElement('div');
    kopf.style.cssText='padding:14px;color:#fff;font-size:16px;font-weight:700;line-height:1.35;';
    kopf.textContent='🎯 '+(titel||'Messpunkt')+': Tippe auf die Stelle, an der du gemessen hast';
    const feld=document.createElement('div');feld.style.cssText='flex:1;position:relative;overflow:hidden;touch-action:manipulation;';
    const img=document.createElement('img');img.src=bildUrl;img.alt='';
    img.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;pointer-events:none;';
    const marke=document.createElement('div');
    marke.style.cssText='position:absolute;width:48px;height:48px;margin:-24px 0 0 -24px;border:4px solid #ff2a2a;border-radius:50%;display:none;pointer-events:none;box-shadow:0 0 0 2px rgba(0,0,0,.6);';
    feld.append(img,marke);
    const fuss=document.createElement('div');fuss.style.cssText='display:flex;gap:10px;padding:12px 14px 16px;';
    const ohne=document.createElement('button');ohne.type='button';ohne.textContent='Ohne Punkt';
    ohne.style.cssText='flex:1;min-height:52px;border-radius:10px;border:1px solid #888;background:transparent;color:#fff;font-size:16px;font-family:inherit;';
    const ok=document.createElement('button');ok.type='button';ok.textContent='✓ Punkt übernehmen';ok.disabled=true;
    ok.style.cssText='flex:2;min-height:52px;border-radius:10px;border:none;background:'+FS_FARBE+';color:#fff;font-size:16px;font-weight:700;font-family:inherit;opacity:.45;';
    let punkt=null;
    feld.onclick=ev=>{
      const r=feld.getBoundingClientRect();
      const p=_fsTippZuPunkt(ev.clientX,ev.clientY,r,img.naturalWidth,img.naturalHeight);
      if(!p)return;
      punkt=p;
      const s=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight);
      const bw=img.naturalWidth*s,bh=img.naturalHeight*s;
      marke.style.left=((r.width-bw)/2+p.x*bw)+'px';marke.style.top=((r.height-bh)/2+p.y*bh)+'px';marke.style.display='block';
      ok.disabled=false;ok.style.opacity='1';
    };
    const fertig=wert=>{ov.remove();res(wert);};
    ohne.onclick=()=>fertig(null);
    ok.onclick=()=>{if(punkt)fertig(punkt);};
    fuss.append(ohne,ok);
    ov.append(kopf,feld,fuss);
    document.body.appendChild(ov);
  });
}

/* v305: Messungen, die NUR als CSV im Eingang liegen (kein .tjf/.json mit gleichem Namen). PAM liest nur JSON –
   solche Messungen fehlten sonst still in der Liste (Befund 30.09.2026: Export zuerst als CSV). Reine Funktion. */
function _fsTestoNurCsv(dateien){
  const namen=(dateien||[]).map(f=>String((f&&f.name)||''));
  const basis=n=>n.replace(/\.[^.]+$/,'').toLowerCase();
  const mitJson=new Set(namen.filter(n=>/\.(tjf|json)$/i.test(n)).map(basis));
  return namen.filter(n=>/\.csv$/i.test(n)&&!mitJson.has(basis(n))).map(n=>{
    const m=/(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/.exec(n);
    return {datei:n,text:m?m[3]+'.'+m[2]+'.'+m[1]+', '+m[4]+':'+m[5]+' Uhr':n};
  });
}
const FS_TESTO_JSON_WEG='In der testo-App: Menü ☰ → Messdaten → Messung öffnen → Export → Bilder anhaken → JSON (nicht CSV) → Google Drive → „'+FS_TESTO_ORDNER+'".';

async function _fsTestoEinlesen(bericht,t,neuBauen){
  if(!(typeof tokenValid==='function'&&tokenValid())){toast('Drive nicht verbunden – zum Einlesen bitte mit Empfang anmelden','error',5000);return;}
  const GID='_fsTestoSheet';const alt=document.getElementById(GID);if(alt)alt.remove();
  const ov=document.createElement('div');ov.id=GID;
  ov.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;';
  const box=document.createElement('div');
  box.style.cssText='background:var(--bg);color:var(--text);border-radius:16px 16px 0 0;width:100%;max-height:90vh;display:flex;flex-direction:column;';
  box.onclick=e=>e.stopPropagation();
  const kopf=document.createElement('div');kopf.style.cssText='display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border);';
  const ti=document.createElement('div');ti.style.cssText='flex:1;font-size:17px;font-weight:700;';ti.textContent='📥 testo-Messungen';
  const zu=document.createElement('button');zu.type='button';zu.textContent='✕';
  zu.style.cssText='width:44px;height:44px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text);font-size:18px;cursor:pointer;';
  zu.onclick=()=>ov.remove();
  kopf.append(ti,zu);
  const inhalt=document.createElement('div');inhalt.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 14px;';
  const fuss=document.createElement('div');fuss.style.cssText='padding:10px 14px 14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;';
  box.append(kopf,inhalt,fuss);ov.appendChild(box);document.body.appendChild(ov);
  const info=txt=>{inhalt.innerHTML='';const d=document.createElement('div');d.style.cssText='font-size:15px;color:var(--text);padding:12px 0;line-height:1.5;';d.textContent=txt;inhalt.appendChild(d);};

  info('Suche den Ordner „'+FS_TESTO_ORDNER+'" in Google Drive …');
  let ordnerId=null,dateien=[];
  try{
    ordnerId=await _fsTestoOrdnerId();
    if(!ordnerId){info('Ordner „'+FS_TESTO_ORDNER+'" nicht gefunden. Bitte in Google Drive unter 00_App-Daten anlegen und die testo-Dateien dorthin teilen.');return;}
    dateien=await _fsTestoListe(ordnerId);
  }catch(e){console.warn('[testo] Liste:',e);info('Google Drive nicht erreichbar ('+(e.message||e)+'). Bitte mit Empfang erneut versuchen.');return;}
  const jsons=dateien.filter(f=>/\.(tjf|json)$/i.test(f.name||''));
  const bilder=dateien.filter(f=>/\.(jpe?g|png)$/i.test(f.name||''));
  const nurCsv=_fsTestoNurCsv(dateien); // v305: nur Messungen OHNE JSON-Zwilling melden
  const csvText=nurCsv.length?'⚠ '+(nurCsv.length===1?'1 Messung liegt':nurCsv.length+' Messungen liegen')+' nur als CSV vor und '+(nurCsv.length===1?'fehlt':'fehlen')+' deshalb in der Liste: '
    +nurCsv.slice(0,6).map(c=>c.text).join(' · ')+(nurCsv.length>6?' …':'')+'. '+FS_TESTO_JSON_WEG:'';
  if(!jsons.length){info('Keine testo-Messungen als JSON im Ordner. '+(csvText||FS_TESTO_JSON_WEG));return;}
  info('Lese '+jsons.length+' Messung'+(jsons.length===1?'':'en')+' …');

  const bildNamen=bilder.map(b=>b.name);
  const messungen=[];
  for(const f of jsons.slice(0,40)){
    try{
      const text=await _fsDriveText(f.id);
      const m=_fsTestoLesen(text,bildNamen);
      if(!m.ok){messungen.push({fehler:m.fehler,datei:f.name});continue;}
      m.datei=f.name;m.dateiId=f.id;m.text=text;
      m.bildDatei=bilder.find(b=>b.name===m.bild)||null;
      m.schonDa=_fsTestoSchonDa(bericht,f.name);
      if(!m.schonDa){const woanders=_fsTestoEingelesenIn(typeof _alleTaskListen==='function'?_alleTaskListen():[],f.name);if(woanders){m.schonDa=true;m.schonDaKarte=(t&&woanders.id===t.id)?'':woanders.titel;}} // v293
      messungen.push(m);
    }catch(e){messungen.push({fehler:String((e&&e.message)||e),datei:f.name});}
  }
  _fsTestoSortieren(messungen); // v293: noch nicht eingelesene zuerst

  const gewaehlt=new Set();
  const raumLab=document.createElement('label');raumLab.style.cssText='font-size:13px;color:var(--text2);';raumLab.textContent='Raum für die neuen Messstellen';
  const raumSel=document.createElement('select');
  raumSel.style.cssText='width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:16px;color:var(--text);font-family:inherit;';
  const raumOptionen=wahl=>{
    raumSel.innerHTML='';
    const o0=document.createElement('option');o0.value='';o0.textContent='– ohne Raum (Luft aus der testo-Messung) –';raumSel.appendChild(o0);
    bericht.raeume.map(r=>r.name).filter(Boolean).forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;raumSel.appendChild(o);});
    const on=document.createElement('option');on.value='__neu';on.textContent='＋ neuer Raum …';raumSel.appendChild(on);
    raumSel.value=wahl||'';
  };
  const letzterRaum=(bericht.stellen.slice().reverse().find(s=>s&&s.raum)||{}).raum||'';
  raumOptionen(letzterRaum);
  raumSel.onchange=()=>{
    if(raumSel.value!=='__neu')return;
    const n=prompt('Name des Raums:');
    if(n&&n.trim()){const name=n.trim();if(!bericht.raeume.some(r=>r.name===name)){bericht.raeume.push({name,t:'',rf:''});scheduleSave();}raumOptionen(name);}
    else raumOptionen(letzterRaum);
  };
  const knopf=document.createElement('button');knopf.type='button';
  knopf.style.cssText='min-height:52px;border-radius:10px;border:none;background:'+FS_FARBE+';color:#fff;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer;';
  const knopfText=()=>{knopf.disabled=!gewaehlt.size;knopf.style.opacity=gewaehlt.size?'1':'.45';knopf.textContent=gewaehlt.size?'Einlesen ('+gewaehlt.size+')':'Messungen antippen';};
  knopfText();
  fuss.append(raumLab,raumSel,knopf);

  inhalt.innerHTML='';
  const hinweis=document.createElement('div');hinweis.style.cssText='font-size:13px;color:var(--text2);margin:0 0 8px;line-height:1.45;';
  hinweis.textContent='Ordner „'+FS_TESTO_ORDNER+'" · Messungen antippen. PAM legt beim Einlesen eine Kopie in den Ordner des Auftrags – die Originale hier kannst du später in Drive löschen.';
  inhalt.appendChild(hinweis);
  if(csvText){ // v305: gut sichtbar statt im Kleingedruckten
    const cw=document.createElement('div');cw.setAttribute('data-fs-nurcsv',String(nurCsv.length));
    cw.style.cssText='font-size:14px;font-weight:600;color:var(--text);margin:0 0 10px;padding:10px 12px;border-radius:8px;background:var(--bg2);border-left:5px solid var(--orange);line-height:1.45;';
    cw.textContent=csvText;inhalt.appendChild(cw);
  }
  messungen.forEach((m,i)=>{
    const row=document.createElement('button');row.type='button';row.setAttribute('data-fs-testo',String(i));
    row.style.cssText='display:block;width:100%;text-align:left;margin:0 0 8px;padding:12px;border-radius:10px;border:2px solid var(--border);background:var(--bg2);color:var(--text);font-family:inherit;cursor:pointer;';
    if(m.fehler){row.disabled=true;row.textContent='⛔ '+m.datei+': '+m.fehler;inhalt.appendChild(row);return;}
    const z1=document.createElement('div');z1.style.cssText='font-size:16px;font-weight:700;';
    z1.textContent=(m.zeit?_fsZeitText(m.zeit):m.datei)+(m.schonDa?' · schon eingelesen'+(m.schonDaKarte?' ('+m.schonDaKarte+')':''):'');
    const z2=document.createElement('div');z2.style.cssText='font-size:14px;margin-top:3px;';
    z2.textContent='Luft '+(m.luftT===null?'–':_fsEins(m.luftT)+' °C')+' · '+(m.luftRf===null?'–':_fsEins(m.luftRf)+' %')
      +' · Oberfläche '+(m.ts===null?'–':_fsEins(m.ts)+' °C')+' · '+(m.bildDatei?'📷 Foto':'ohne Foto');
    row.append(z1,z2);
    m.warnungen.forEach(h=>{
      const d=document.createElement('div');d.style.cssText='font-size:13px;font-weight:700;color:var(--text);margin-top:4px;padding-left:8px;border-left:4px solid var(--orange);';
      d.textContent='⚠ '+h;row.appendChild(d);
    });
    if(m.schonDa)row.style.opacity='.6';
    row.onclick=()=>{
      if(gewaehlt.has(i))gewaehlt.delete(i);else gewaehlt.add(i);
      const an=gewaehlt.has(i);
      row.style.borderColor=an?FS_FARBE:'var(--border)';row.style.background=an?'rgba(31,95,139,.18)':'var(--bg2)';
      knopfText();
    };
    inhalt.appendChild(row);
  });

  knopf.onclick=async()=>{
    if(!gewaehlt.size)return;
    knopf.disabled=true;
    const ziel=_extractFolderIdMob((t&&t.dokOrdner)||'')||_extractFolderIdMob((t&&t.gdrive)||'')||_extractFolderIdMob((t&&t.gdriveOrdner)||'');
    const raumName=raumSel.value==='__neu'?'':raumSel.value;
    const liste=[...gewaehlt].sort((a,b)=>a-b);
    let n=0,bildN=0,kopiert=0,fehler=0;
    for(const i of liste){
      const m=messungen[i];
      knopf.textContent='⏳ '+(n+fehler+1)+' von '+liste.length+' …';
      try{
        const st=_fsStelleAusTesto(m,raumName);
        bericht.stellen.push(st);
        _fsRaumAuffuellen(bericht,raumName,m);
        scheduleSave();
        n++;
        const nr=bericht.stellen.length;
        if(m.bildDatei){
          try{
            const blob=await _fsDriveBlob(m.bildDatei.id);
            m.bildBlob=blob;
            const bu=URL.createObjectURL(blob);
            ov.style.display='none';
            const punkt=await _fsMesspunktWaehlen(bu,'Stelle '+nr);
            ov.style.display='flex';
            URL.revokeObjectURL(bu);
            const du=await _fsMessbildErstellen(blob,_fsStelleWerte(bericht,st),punkt,(m.zeit?_fsZeitText(m.zeit)+' · ':'')+'Stelle '+nr);
            if(du){
              const localKey='photo_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
              const name='Messbild_'+(m.zeit?_fsZeitText(m.zeit).slice(11).split(':').join(''):String(Date.now()))+'.jpg';
              const fo={name:name,inReport:true,localUrl:du,localKey:localKey,driveId:null,_uploading:false};
              // ⛔ Gerätespeicher NICHT abwarten – in der Browser-Gegenprobe kam er nie zurück und das Einlesen stand still.
              //   Er ist nur die Reserve, falls der Upload unten scheitert (dann holt der Nachhol-Upload das Bild von dort).
              _mobPhotoSave(localKey,du,{taskId:t.id,name:name}).catch(e=>console.warn('[testo] Gerätespeicher:',e));
              bericht.fotos.push(fo);
              st.fotoRefs.push(localKey);
              st.testo.punkt=punkt||null;
              bildN++;
              scheduleSave();
              // Gleich hochladen – derselbe Fotoordner wie beim Wartungsprotokoll, mit Zeitlimit und Wiederholung
              const fotoOrdner=_extractFolderIdMob((t&&t.gdrive)||'')||_extractFolderIdMob((t&&t.gdriveOrdner)||'');
              if(fotoOrdner){
                try{
                  const bb=_dataUrlToBlob(du);
                  const r=await _uploadMitGeduld(signal=>{
                    const form=new FormData();
                    form.append('metadata',new Blob([JSON.stringify({name:name,parents:[fotoOrdner],mimeType:'image/jpeg'})],{type:'application/json'}));
                    form.append('file',bb);
                    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+gdriveToken},body:form,signal:signal});
                  },{bytes:bb.size,name:name,folderId:fotoOrdner});
                  const j=await r.json();
                  if(j&&j.id){fo.driveId=j.id;scheduleSave();}
                }catch(e){console.warn('[testo] Messbild-Upload:',e);}
              }
            }else st.testo.warnungen.push('Messbild konnte nicht erstellt werden');
          }catch(e){console.warn('[testo] Messbild:',e);ov.style.display='flex';st.testo.warnungen.push('Messbild konnte nicht erstellt werden');}
        }
        // v293: KOPIE in den Auftragsordner – das Umhängen fremder Dateien verweigerte Google
        if(ziel){
          try{const kid=await _fsDriveKopieHochladen(m.text,m.datei,'application/json',ziel);if(kid){st.testo.kopieId=kid;kopiert++;}}catch(e){console.warn('[testo] Kopie Datei:',e);}
          if(m.bildDatei){
            try{const bb=m.bildBlob||await _fsDriveBlob(m.bildDatei.id);const fid=await _fsDriveKopieHochladen(bb,m.bildDatei.name,'image/jpeg',ziel);if(fid){st.testo.fotoKopieId=fid;kopiert++;}}catch(e){console.warn('[testo] Kopie Foto:',e);}
          }
          scheduleSave();
        }
      }catch(e){fehler++;console.warn('[testo] Einlesen:',e);}
    }
    scheduleSave();
    ov.remove();
    try{neuBauen();}catch(e){console.warn('[testo] neu aufbauen:',e);}
    // Nachhol-Upload nur, wenn ein Messbild den direkten Upload nicht geschafft hat
    if(bericht.fotos.some(f=>f&&f.localKey&&!f.driveId)&&typeof _mobRetryPendingUploads==='function'){try{_mobRetryPendingUploads();}catch(e){console.warn('[testo] Upload:',e);}}
    toast('✓ '+n+' Messung'+(n===1?'':'en')+' eingelesen'
      +(bildN?' · '+bildN+' Messbild'+(bildN===1?'':'er'):'')
      +(ziel?(kopiert?' · Kopie im Auftragsordner':''):' · ⚠ kein Drive-Ordner an der Karte – keine Kopie beim Auftrag')
      +(fehler?' · '+fehler+' Fehler':''),fehler?'error':'success',6000);
  };
}
