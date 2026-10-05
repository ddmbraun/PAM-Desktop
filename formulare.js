// PAM – Formulare: gemeinsame Datei für PAM Mobil und PAM Desktop.
// ⛔ Nicht in einer App-Kopie ändern – beim Bau wird diese Datei in die Apps kopiert und muss dort gleich sein.
// Inhalt: Feuchte- und Schimmelprotokoll (auch Keller). Wird von index.html VOR dem Hauptprogramm geladen.
const PAM_FORMULARE_VERSION='F41';
// F9: Handy und Tablet erfassen, der PC prüft und erstellt das PDF. PAM Desktop setzt window._FS_AM_PC=true (Block „FORMULAR-UMGEBUNG PC").
function _fsAmPc(){return typeof window!=='undefined'&&window._FS_AM_PC===true;}
/* ── F38: SICHTBARKEIT ──────────────────────────────────────────────────────────────────────────────────────────────
   Rückmeldung vom Tablet (04.10.2026): Schrift und Knöpfe zu klein, Knöpfe im Dunkeln nur dünne Umrisse, Hinweistexte in leeren Feldern zu blass.
   Lösung ohne Umbau der vielen Einzel-Stile: das Protokoll-Fenster und seine Unterfenster (Skizze einzeichnen, Foto markieren, Luftbild, Auswahl
   Innen/Außen) bekommen die Klasse fs-sicht. Darin gelten kräftigere Farbwerte (Flächen, Ränder, Knopf-Füllung) und – nur an Handy/Tablet (fs-touch) –
   größere Schrift und höhere Knöpfe. Die Einzel-Stile fragen diese Werte mit Rückfall auf den alten Wert ab (z. B. font-size:var(--fs12,12px)):
   ohne die Klasse bleibt alles wie vorher. Das Fenster „Messliste und Ablauf“ und die Messpunkt-Wahl bekommen die Klasse NICHT.
   Farben nur Blau und Orange (keine Unterscheidung über Rot/Grün). */
function _fsSichtCss(){
  return '.fs-sicht{--bg2:#1e2029;--bg3:#3a3d4c;--border:#6a6e86;--fs-kfl:#17395c;--fs-krd:#5aa9e6;--fs-cfl:#2a2d3a;--fs-can:#1f5f8b;--fs-ph:#b9bccb;--fs-hdr:#243247;--fs-hfa:#5aa9e6;--fs-karte:#16171d;--fs-kante:6px;--fs-lbfl:rgba(217,72,15,.34);--fs-frb:2px;}'
    +'.fs-sicht.fs-hell{--bg:#e9ecf2;--bg2:#ffffff;--bg3:#ffffff;--border:#7d8198;--fs-kfl:#d6e7f7;--fs-krd:#1f5f8b;--fs-cfl:#ffffff;--fs-can:#b9d7f2;--fs-ph:#5d6074;--fs-hdr:#cfdcea;--fs-hfa:#1f5f8b;--fs-karte:#ffffff;--fs-schatten:0 2px 6px rgba(0,0,0,.18);--fs-lbfl:#ffd9c4;}'
    +'.fs-sicht input::placeholder,.fs-sicht textarea::placeholder{color:var(--fs-ph)!important;opacity:1!important;}'
    +'.fs-sicht.fs-touch{--fs11:13px;--fs12:14px;--fs13:14px;--fsh:44px;--fs-mini:84px;}'
    +'@media (min-width:700px) and (min-height:600px){.fs-sicht.fs-touch{--fs11:14px;--fs12:15px;--fs13:16px;--fs14:17px;--fs15:18px;--fs16:19px;--fs17:20px;--fs18:21px;--fsh:48px;--fsh44:50px;--fs-fpad:12px;--fs-mini:120px;}}';
}
/* Ist die Schriftfarbe dunkel, läuft die App im hellen Modus. farbe = berechnete Farbe „rgb(r, g, b)“; Unlesbares zählt als dunkler Modus. */
function _fsSichtIstHell(farbe){
  const m=String(farbe||'').match(/[0-9.]+/g);
  if(!m||m.length<3)return false;
  const f=v=>{v=Math.max(0,Math.min(255,+v))/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
  return (0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]))<0.4;
}
function _fsSichtStil(){
  if(typeof document==='undefined'||typeof document.getElementById!=='function'||typeof document.createElement!=='function')return;
  if(document.getElementById('_fsSichtStil'))return;
  const st=document.createElement('style');st.id='_fsSichtStil';st.textContent=_fsSichtCss();
  const ziel=document.head||document.body;if(ziel&&typeof ziel.appendChild==='function')ziel.appendChild(st);
}
function _fsSichtHell(){
  try{
    if(typeof getComputedStyle!=='function'||typeof document==='undefined'||!document.body)return false;
    const p=document.createElement('span');p.style.cssText='position:absolute;visibility:hidden;color:var(--text);';
    document.body.appendChild(p);const c=getComputedStyle(p).color;p.remove();
    return _fsSichtIstHell(c);
  }catch(e){return false;}
}
/* Hängt die Klassen an ein Fenster. Fehlt etwas (Prüfumgebung ohne Klassenliste), bleibt das Fenster wie früher. */
function _fsSichtAn(el){
  try{
    if(!el||!el.classList||typeof el.classList.add!=='function')return false;
    _fsSichtStil();
    el.classList.add('fs-sicht');
    if(!_fsAmPc())el.classList.add('fs-touch');
    if(_fsSichtHell())el.classList.add('fs-hell');
    return true;
  }catch(e){console.warn('[Sichtbarkeit]',e);return false;}
}
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
  if(b&&b.fassung==='begehung'&&b.art==='vorab')return b.schlank?_fsB2Name(b):'Vorabbesichtigung'; // F16, F23, F26: Besichtigung 2 trägt den Namen, den Frank vergeben hat
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
  if(art==='vorab'||art==='besichtigung2'){b.art='vorab';b.titel='Vorabbesichtigung';if(art==='besichtigung2'){b.schlank=true;b.titel='Besichtigung';b.protName='';}} // F16: Inhalte setzt _fsBgUmstellen · F23: „Besichtigung 2“ = dieselbe Art, aber schlank (Kennzeichen schlank)
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
    if(b.art==='vorab'&&typeof b.schadenbild!=='string')b.schadenbild=''; // F19: freie Beschreibung des Schadenbildes
    if(b.art==='vorab'&&typeof b.vorgeschichte!=='string')b.vorgeschichte=''; // F20
    if(b.art==='vorab'){if(!Array.isArray(b.vbStellen))b.vbStellen=[];b.vbStellen.forEach(s=>{if(!s)return;if(!Array.isArray(s.merkmale))s.merkmale=[];if(!Array.isArray(s.fotoRefs))s.fotoRefs=[];if(typeof s.ort!=='string')s.ort='';if(typeof s.text!=='string')s.text='';['raum','messwert','geraet'].forEach(k=>{if(typeof s[k]!=='string')s[k]='';});}); // F21, F22
      if(!Array.isArray(b.vbUmgebung))b.vbUmgebung=[];b.vbUmgebung.forEach(r=>{if(!r)return;if(typeof r.text!=='string')r.text='';if(typeof r.status!=='string')r.status='';if(typeof r.grund!=='string')r.grund='';});
      if(typeof b.meldungStatus!=='string')b.meldungStatus='';if(typeof b.meldungAbw!=='string')b.meldungAbw='';
      if(typeof b.luftbildEbene!=='string')b.luftbildEbene='';if(b.schlank&&typeof b.protName!=='string')b.protName='';
      if(b.luftbildAnsicht!==undefined&&b.luftbildAnsicht!==null&&!_fsLbAnsichtOk(b.luftbildAnsicht))b.luftbildAnsicht=null; /* F27: zuletzt gesehener Kartenausschnitt */
      (b.fotos||[]).forEach(f=>{if(f&&f.blick!==undefined&&!(typeof f.blick==='number'&&isFinite(f.blick)))delete f.blick;}); /* F29 */
      (b.fotos||[]).forEach(f=>{if(f&&f.pins!==undefined){f.pins=_fsFpListe(f).slice(0,FS_FP_MAX);f.pins.forEach(p=>{if(typeof p.t!=='string')p.t=String(p.t===null||p.t===undefined?'':p.t);});}}); /* F37: Foto-Pins – Unbrauchbares fällt heraus */
      if(b.schlank){ /* F33: Außenskizzen (Liste am Protokoll) und die Marke je Stelle (s.skz = {k: Kennung der Skizze, x, y}); eine Marke ohne ihre Skizze entfällt */
        if(!Array.isArray(b.aussenSkizzen))b.aussenSkizzen=[];
        b.aussenSkizzen=b.aussenSkizzen.filter(k=>k&&typeof k.id==='string'&&k.id);
        b.aussenSkizzen.forEach(k=>{k.an=true;k.typ=_fsAsTyp(k);if(!_fsAsFlaechen(k).some(f=>f.k===k.aussen))k.aussen=_fsAsFlaechen(k)[0].k;['bereich','name','oben'].forEach(f=>{if(typeof k[f]!=='string')k[f]='';});if(!Array.isArray(k.striche))k.striche=[];if(!Array.isArray(k.stempel))k.stempel=[];});
        b.vbStellen.forEach(s=>{if(s&&s.skz!==undefined&&s.skz!==null&&!(_fsAsMarkeOk(s)&&b.aussenSkizzen.some(k=>k.id===s.skz.k)))s.skz=null;});
      }
      if(b.schlank){ /* F28: Innen/Außen – welche Teile sichtbar sind, je Stelle Typ + Seite, je Umgebungszeile der Bereich */
        if(typeof b.zeigeInnen!=='boolean')b.zeigeInnen=true;if(typeof b.zeigeAussen!=='boolean')b.zeigeAussen=true;
        b.vbStellen.forEach(s=>{if(!s)return;if(s.typ!=='innen'&&s.typ!=='aussen')s.typ=(String(s.raum||'').trim()==='Außen')?'aussen':'innen';if(typeof s.seite!=='string')s.seite='';if(typeof s.seiteGrad!=='number'||!isFinite(s.seiteGrad))s.seiteGrad=null;});
        b.vbUmgebung.forEach(r=>{if(r&&r.bereich!=='aussen')r.bereich='innen';});
      }
      b.vbStellen.forEach(s=>{if(s&&s.pin!==undefined&&s.pin!==null&&!(isFinite(+s.pin.lat)&&isFinite(+s.pin.lon)))s.pin=null;});} // F22: Eingrenzen · F24: Luftbild-Pin je Stelle
    if(b.art==='vorab')['versicherung','schadennr','zugang','ansprechpartner','besuchBei','lage'].forEach(k=>{if(b.kopf[k]===undefined||b.kopf[k]===null)b.kopf[k]='';}); // F16
  }
  return b;
}
function _fsPdfName(bericht,zeit){
  const d=String((bericht&&bericht.datum)||'').split('.');
  const datum=(d.length===3&&d[2])?(('0'+d[0]).slice(-2)+'-'+('0'+d[1]).slice(-2)+'-'+d[2]):'';
  const uhr=(zeit instanceof Date&&isFinite(zeit.getTime()))?'_'+('0'+zeit.getHours()).slice(-2)+('0'+zeit.getMinutes()).slice(-2):''; // v294
  if(bericht&&bericht.vorlage==='flachdach'){ // F13: Prüfbericht – Titel (gekürzt) + Datum + Uhrzeit
    const slug=String(bericht.titel||'Pruefbericht').replace(/[^a-zA-Z0-9-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,30)||'Pruefbericht';
    return slug+(datum?'_'+datum:'')+uhr+'.pdf';
  }
  if(bericht&&bericht.vorlage==='wartungsprotokoll'){ // F10: Name wie am PC bisher (Adresse gekürzt wegen der Pfadlänge) + Uhrzeit
    const slug=String((bericht.kopf&&bericht.kopf.objektAdresse)||'').split(',')[0].replace(/[^a-zA-Z0-9]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'').slice(0,30);
    return 'Wartungsprotokoll'+(slug?'_'+slug:'')+(datum?'_'+datum:'')+uhr+'.pdf';
  }
  if(bericht&&bericht.fassung==='begehung'&&bericht.art==='vorab'){ // F16, F17: mit der Rolle, bei wem es war (Eigentuemer, Mieter, …)
    const rolle=String((bericht.kopf&&bericht.kopf.besuchBei)||'').split(':')[0].replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue').replace(/ß/g,'ss').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,16);
    return (bericht.schlank?(_fsDateiSlug(bericht.protName,30)||'Besichtigung'):'Vorabbesichtigung')+(rolle?'_'+rolle:'')+(datum?'_'+datum:'')+uhr+'.pdf'; // F23, F26
  }
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
    'Das PDF erstellst du am PC (Karte → Formulare → ⋯ → „PDF neu erstellen"). Es landet im Ordner der Karte.'
  ]]
];
// F2a: im Begehungsprotokoll gelten andere Hinweise zum Abhaken und zum Abschluss (keine Ursache, keine Empfehlung)
const FS_HILFE_BG={
  'Vorbereitung':[ // F6: Räume statt Raumklima
    'Messgeräte 10 Minuten im Keller liegen lassen – kalt/warm verfälscht die Werte.',
    'Das Protokoll darf vorher angelegt sein. Am Termin „🌤 Wetter holen“ antippen (Standort nötig) oder Wetter, letzten Regen, Außen °C und % rF selbst eintragen.',
    'Bei „Räume“ den Raum anlegen (z. B. „＋ Kellerraum“), antippen und bei „Klima“ Temperatur und Luftfeuchte eintragen – der Taupunkt steht dann daneben.'
  ],
  'Messstellen benennen':[ // F4: Messplan statt Namen vergeben
    'Erst Räume, Wände (Art) und Wandfotos anlegen: bei „Räume“ antippst du einen Raum, im Raum stehen Klima, Wände, Skizze und Messplan. Beim „Messplan“ schaltest du je Wand „wird gemessen“ oder „wird nicht gemessen“ und trägst die Höhen ein (Standard 10, 50, 100 cm).',
    'Dann in der Reihenfolge des Messplans messen: Raum für Raum, W1 bis W4, an jeder Wand von der ersten bis zur letzten Höhe – jedes Mal gleich. Jede Messung einzeln in testo speichern und exportieren (siehe oben).',
    'Danach „📋 Messungen nach Messplan zuordnen“: PAM legt die Messungen nach ihrer Uhrzeit der Reihe nach auf die Plan-Zeilen. Du prüfst mit dem Wandfoto, nimmst mit „✕ Messung weglassen“ eine überzählige heraus, markierst eine ausgelassene Stelle mit „↷ Hier nicht gemessen“ und übernimmst.',
    'Trotec-Werte trägst du bei der Messstelle von Hand unter „Bauteil (Digits)“ ein.',
    'An jeder Wand „📷 Fotos zu W…“ bei Raumklima: ganze Wand mit Zollstock.'
  ],
  'Abhaken':[
    'Tippe den Satz an, der stimmt. Er steht später wörtlich im PDF. Was du offen lässt, steht nicht im PDF.',
    'Bei Bedarf eine Anmerkung dazu (Ort, Größe …): Sie wird in den Satz eingebaut.',
    'Überschrift eines Abschnitts antippen oder „▲ Abschnitt einklappen" am Ende – dann bleibt nur eine Zeile mit der Kurzfassung.',
    'Etwas, das nicht in der Liste steht: „＋ Freier Eintrag" – dein eigener Satz kommt ins PDF.'
  ],
  'Abschluss':[
    'Was Mieter oder Nutzer gesagt haben, gehört unter „Angaben der Nutzer" – mit dem Namen, von wem es stammt.',
    'Zusammenfassung: nur das Festgestellte, eine Momentaufnahme. Keine Ursache, keine Empfehlung.',
    'Das PDF erstellst du am PC (Karte → Formulare → ⋯ → „PDF neu erstellen"). Es landet im Ordner der Karte. Nur Fotos mit grünem Haken kommen hinein.'
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
  zu.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:var(--fs18,18px);cursor:pointer;flex-shrink:0;';
  zu.onclick=()=>ov.remove();
  const t=document.createElement('div');t.style.cssText='font-size:var(--fs15,15px);font-weight:700;color:#fff;';t.textContent="📘 So geht's – Feuchte messen";
  kopf.append(zu,t);
  const inhalt=document.createElement('div');
  inhalt.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 16px 40px;';
  FS_HILFE.forEach(([titel,zeilen0])=>{
    const zeilen=(bg&&FS_HILFE_BG[titel])?FS_HILFE_BG[titel]:zeilen0; // F2a
    const h=document.createElement('div');h.textContent=titel;
    h.style.cssText='font-size:var(--fs15,15px);font-weight:700;color:var(--text);margin:16px 0 6px;padding-left:8px;border-left:4px solid '+FS_FARBE+';';
    const ol=document.createElement('ol');ol.style.cssText='margin:0;padding-left:22px;';
    zeilen.forEach(z=>{const li=document.createElement('li');li.textContent=z;li.style.cssText='font-size:var(--fs15,15px);line-height:1.5;color:var(--text);margin-bottom:6px;';ol.appendChild(li);});
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
  if(bericht.art==='vorab'&&typeof _fsVbAnlassAusKarte==='function'){const a=_fsVbAnlassAusKarte(t);if(a)v.anlass=a;delete v.nutzer;} // F17: Nutzer nur über „Besichtigung bei“ // F16: Anlass = Beschreibung der Karte (Vorschlag)
  Object.keys(v).forEach(key=>{if(v[key]&&!String(bericht.kopf[key]||'').trim()){bericht.kopf[key]=v[key];n++;}});
  return n;
}

// F20: Felder, die im Protokoll ANDERS stehen als in der Karte (beide nicht leer). Anlass zählt nicht – den schreibt Frank meist selbst um.
// Vorabbesichtigung: Nutzer zählt nicht (kommt aus „Besichtigung bei“). Reine Funktion; Rückgabe [{key,name,alt,neu}].
const FS_KOPF_NAMEN={auftraggeber:'Auftraggeber',objektAdresse:'Objekt',auftragNr:'Auftrag-Nr.',nutzer:'Nutzer / Mieter'};
function _fsKopfAbweichungen(bericht,t){
  if(!bericht||!bericht.kopf)return [];
  const v=_fsKopfAusKarte(t);
  if(bericht.art==='vorab')delete v.nutzer;
  return Object.keys(FS_KOPF_NAMEN).filter(k=>k in v).filter(k=>{const alt=String(bericht.kopf[k]||'').trim(),neu=String(v[k]||'').trim();return alt&&neu&&alt!==neu;})
    .map(k=>({key:k,name:FS_KOPF_NAMEN[k],alt:String(bericht.kopf[k]).trim(),neu:String(v[k]).trim()}));
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
      /* F40: die gemerkte Vorschau-Adresse von Drive läuft nach Stunden ab (Antwort 403) – lädt sie nicht, EINMAL frisch holen statt ein leeres Kästchen zu zeigen */
      const frisch=()=>Promise.resolve(_mobFetchThumb(f.driveId)).then(d=>{if(d){img.src=d;if(_thumbMerken(f,d))scheduleSave();}}).catch(()=>{});
      const ts=_thumbGespeichert(f);
      if(ts){const vorher=img.onerror;img.onerror=()=>{img.onerror=vorher||null;frisch();};img.src=ts;return;}
      frisch();
    }
  }catch(e){console.warn('[Feuchte] Miniatur:',e);}
}
/* F32: frisch aufgenommen = der Geräteschlüssel des Fotos („photo_<Zeit>_…“) ist nicht älter als der Moment seit (Antippen des Foto-Knopfs). Ein angehaktes älteres Foto ist nicht frisch. */
function _fsFotoFrisch(f,seit){const m=/^photo_([0-9]+)_/.exec(String((f&&f.localKey)||''));return !!m&&+m[1]>=+seit;}
/* ── F37: FOTO-PINS (Besichtigung 2) ─────────────────────────────────────────────────────────────────────────────────
   Frank 04.10.2026: „Wenn das Foto geöffnet ist – kann ich da mehrere Stellen markieren, mit einem Pin, und diesen Pin beschriften, z. B. Schaden, undicht?
   Das müsste ich am PC noch bearbeiten können … die Pins muss ich vor Ort machen, damit ich das noch weiß, wenn ich im Büro bin.“
   Am Foto: foto.pins = [{x, y (Anteile 0…1 des Bildes), t (Beschriftung), ang, len}] – Nummer = Platz in der Liste + 1. Form wie im Luftbild und in der Skizze:
   Kreis mit Nummer NEBEN der Stelle, Strich, Pfeilspitze auf die Stelle. Das Foto selbst bleibt unverändert (nichts wird eingebrannt); gezeichnet wird für
   die Anzeige und fürs PDF. Größen beziehen sich auf eine 900 Bildpunkte breite Fläche und wachsen mit dem Bild. */
const FS_FP_MAX=20,FS_FP_ANG=225,FS_FP_LEN=90,FS_FP_R=26,FS_FP_BREITE=900;
function _fsFpOk(p){return !!p&&typeof p==='object'&&isFinite(+p.x)&&isFinite(+p.y)&&p.x!==null&&p.y!==null&&p.x!==''&&p.y!=='';}
function _fsFpListe(f){return (f&&Array.isArray(f.pins))?f.pins.filter(_fsFpOk):[];}
function _fsFpKlemme(v){return Math.round(Math.max(0.02,Math.min(0.98,+v))*1000)/1000;}
/* Neuer Pin an der Stelle x/y (Anteile); gibt seinen Platz zurück, -1 bei Unbrauchbarem oder voller Liste */
function _fsFpNeu(f,x,y,text){
  if(!f||typeof f!=='object'||!isFinite(+x)||!isFinite(+y))return -1;
  f.pins=_fsFpListe(f);
  if(f.pins.length>=FS_FP_MAX)return -1;
  f.pins.push({x:_fsFpKlemme(x),y:_fsFpKlemme(y),t:String(text||'').trim()});
  return f.pins.length-1;
}
function _fsFpBewegen(p,x,y){if(!_fsFpOk(p)||!isFinite(+x)||!isFinite(+y))return false;p.x=_fsFpKlemme(x);p.y=_fsFpKlemme(y);return true;}
function _fsFpRing(p){
  const a=(p&&isFinite(+p.ang)&&p.ang!==null)?((+p.ang%360)+360)%360:FS_FP_ANG;
  const l=(p&&isFinite(+p.len)&&p.len!==null)?Math.max(50,Math.min(220,+p.len)):FS_FP_LEN;
  return {ang:a,len:l};
}
function _fsFpRingSetzen(p,ang,len){if(!_fsFpOk(p)||!isFinite(+ang)||!isFinite(+len))return false;p.ang=Math.round(((+ang%360)+360)%360)%360;p.len=Math.round(Math.max(50,Math.min(220,+len)));return true;}
function _fsFpText(p,t){if(!_fsFpOk(p))return false;p.t=String(t===null||t===undefined?'':t).trim();return true;}
/* Pin entfernen – die folgenden rücken auf (Nummer = Platz in der Liste) */
function _fsFpWeg(f,i){const l=_fsFpListe(f);if(!l[i])return false;f.pins=l.filter((p,k)=>k!==i);return true;}
/* Lage in Bildpunkten eines W×H großen Bildes: px/py = die Stelle (Pfeilspitze), x/y = Mitte des Kreises, R = Radius, s = Maßstab; liefe der Kreis aus dem Bild, zeigt er zur anderen Seite */
function _fsFpMass(W,H){return Math.max(+W||0,+H||0)/FS_FP_BREITE;} /* F38: die lange Seite zählt */
function _fsFpLage(p,W,H){
  const s=_fsFpMass(W,H),R=FS_FP_R*s,px=p.x*W,py=p.y*H,r=_fsFpRing(p);
  let ang=r.ang,rp=_fsLbRingPos(px,py,ang,r.len*s);
  if(rp.x<R+4||rp.x>W-R-4||rp.y<R+4||rp.y>H-R-4){ang=(ang+180)%360;rp=_fsLbRingPos(px,py,ang,r.len*s);}
  return {px:px,py:py,x:rp.x,y:rp.y,ang:ang,R:R,s:s};
}
/* Was liegt an dieser Stelle des Bildes? {i, teil:'ring'|'ziel'} – der Kreis geht vor, der zuletzt gesetzte Pin gewinnt; null = nichts */
function _fsFpTreffer(f,px,py,W,H){
  const l=_fsFpListe(f);
  for(let i=l.length-1;i>=0;i--){
    const L=_fsFpLage(l[i],W,H);
    if(Math.hypot(L.x-px,L.y-py)<=L.R+12*L.s)return {i:i,teil:'ring'};
    if(Math.hypot(L.px-px,L.py-py)<=32*L.s)return {i:i,teil:'ziel'};
  }
  return null;
}
/* „1 = Schaden · 2 = undicht“ – für die Liste unter dem Foto und die Bildunterschrift im PDF; '' ohne Pins */
function _fsFpLegende(f){return _fsFpListe(f).map((p,i)=>(i+1)+' = '+(String(p.t||'').trim()||'ohne Text')).join(' · ');}
/* Zeichnet die Pins auf ein W×H großes Bild. sel = gewählter Pin (blauer Ring), lose = er lässt sich gerade verschieben (gestrichelter Griff) – beides nur im Fenster */
function _fsFpZeichnen(g,f,W,H,sel,lose){
  _fsFpListe(f).forEach((p,i)=>{
    const L=_fsFpLage(p,W,H),s=L.s,R=L.R,dx=Math.cos(L.ang*Math.PI/180),dy=-Math.sin(L.ang*Math.PI/180),nx=-dy,ny=dx;
    const sx=L.x-dx*R,sy=L.y-dy*R,ex=L.px+dx*22*s,ey=L.py+dy*22*s;
    g.lineCap='round';g.lineJoin='round';
    g.lineWidth=13*s;g.strokeStyle='#ffffff';g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke(); /* F38: Pfeil dicker, heller Rand breiter */
    g.lineWidth=7*s;g.strokeStyle='#d9480f';g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke();
    g.beginPath();g.moveTo(L.px,L.py);g.lineTo(L.px+(dx*32+nx*14)*s,L.py+(dy*32+ny*14)*s);g.lineTo(L.px+(dx*32-nx*14)*s,L.py+(dy*32-ny*14)*s);g.closePath();g.fillStyle='#d9480f';g.fill();g.lineWidth=3*s;g.strokeStyle='#ffffff';g.stroke();
    if(sel===i){
      g.strokeStyle='#1f5f8b';g.lineWidth=4*s;g.beginPath();g.arc(L.x,L.y,R+10*s,0,Math.PI*2);g.stroke();
      if(lose){g.lineWidth=3*s;if(typeof g.setLineDash==='function')g.setLineDash([8*s,6*s]);g.beginPath();g.arc(L.px,L.py,30*s,0,Math.PI*2);g.stroke();if(typeof g.setLineDash==='function')g.setLineDash([]);}
    }
    g.fillStyle='#d9480f';g.beginPath();g.arc(L.x,L.y,R,0,Math.PI*2);g.fill();
    g.strokeStyle='#ffffff';g.lineWidth=4*s;g.beginPath();g.arc(L.x,L.y,R,0,Math.PI*2);g.stroke();
    g.fillStyle='#ffffff';g.font='bold '+Math.round(28*s)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';
    g.fillText(String(i+1),L.x,L.y+1*s);
  });
}
/* Fürs PDF: Pins auf das (schon verkleinerte) Foto zeichnen. d = {dataUrl,w,h} von _fsFotoFuerPdf. Ohne Pins oder ohne Zeichenbereich kommt d unverändert zurück – das Original wird nie angefasst. */
async function _fsFpEinbrennen(d,f){
  try{
    if(!d||!d.dataUrl||!_fsFpListe(f).length||typeof Image==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return d;
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Bild lädt nicht'));i.src=d.dataUrl;});
    const c=document.createElement('canvas');c.width=img.naturalWidth||d.w;c.height=img.naturalHeight||d.h;
    const g=c.getContext&&c.getContext('2d');if(!g)return d;
    g.drawImage(img,0,0,c.width,c.height);
    _fsFpZeichnen(g,f,c.width,c.height,-1,false);
    return {dataUrl:c.toDataURL('image/jpeg',0.9),w:c.width,h:c.height};
  }catch(e){console.warn('[Foto-Pins] PDF:',e);return d;}
}
/* Das Fenster „Foto markieren“: Foto groß, „📌 Pin setzen“ → ins Foto tippen → Beschriftung. Ein gesetzter Pin ist fest; „✥ Verschieben“ macht den gewählten lose
   (Pfeilspitze oder Kreis ziehen, oder an die richtige Stelle tippen). Darunter die Liste „1 = Schaden …“. Dasselbe Fenster am Tablet und am PC. fertig() beim Schließen. */
function _fsFotoPinsFenster(bericht,f,fertig){
  const alt=document.getElementById('_fsFotoPins');if(alt)alt.remove();
  if(!f)return;
  const ov=document.createElement('div');ov.id='_fsFotoPins';_fsSichtAn(ov);
  ov.style.cssText='position:fixed;inset:0;z-index:100060;background:var(--bg);color:var(--text);display:flex;flex-direction:column;';
  const kopf=document.createElement('div');kopf.style.cssText='background:'+FS_FARBE+';padding:10px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  const zu=document.createElement('button');zu.type='button';zu.textContent='←';zu.setAttribute('aria-label','Markieren beenden');zu.setAttribute('data-fs-fp-zu','1');
  zu.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:44px;height:44px;border-radius:8px;font-size:20px;cursor:pointer;flex-shrink:0;';
  const ti=document.createElement('div');ti.style.cssText='font-size:var(--fs16,16px);font-weight:700;color:#fff;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  const zuT=_fsBgFotoZuordnung(bericht,f);ti.textContent='📌 Foto markieren'+(zuT?' – '+zuT:'');
  kopf.append(zu,ti);
  const leiste=document.createElement('div');leiste.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--border);flex-shrink:0;';
  const feld=document.createElement('div');feld.style.cssText='flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px;background:var(--bg3);';
  const cv=document.createElement('canvas');cv.width=900;cv.height=640;cv.setAttribute('data-fs-fp-flaeche','1');
  cv.style.cssText='display:block;max-width:100%;max-height:100%;width:auto;height:auto;background:#fff;border:1px solid var(--border);touch-action:none;cursor:crosshair;';
  feld.appendChild(cv);
  const liste=document.createElement('div');liste.setAttribute('data-fs-fp-liste','1');liste.style.cssText='flex-shrink:0;max-height:24vh;overflow:auto;padding:6px 12px;border-top:1px solid var(--border);';
  const fuss=document.createElement('div');fuss.style.cssText='flex-shrink:0;padding:10px 14px 14px;border-top:1px solid var(--border);';
  const fb=document.createElement('button');fb.type='button';fb.textContent='✓ Fertig';fb.setAttribute('data-fs-fp-fertig','1');
  fb.style.cssText='width:100%;min-height:54px;border-radius:12px;border:none;background:'+FS_FARBE+';color:#fff;font-size:var(--fs18,18px);font-weight:700;font-family:inherit;cursor:pointer;';
  fuss.appendChild(fb);
  ov.append(kopf,leiste,feld,liste,fuss);
  const g=cv.getContext('2d');
  let W=900,H=640,bild=null,geladen=false,sel=-1,lose=false,setzen=false,zieh=null,festGesagt=false;
  const pins=()=>_fsFpListe(f);
  const zeichne=()=>{
    g.fillStyle='#ffffff';g.fillRect(0,0,W,H);
    if(bild)g.drawImage(bild,0,0,W,H);
    else{g.fillStyle='#666666';g.font='28px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(geladen?'Foto nicht verfügbar':'Lade Foto …',W/2,H/2);}
    _fsFpZeichnen(g,f,W,H,sel,lose);
  };
  const knopf=(txt,stil,fn,attr)=>{
    const x=document.createElement('button');x.type='button';x.textContent=txt;x.style.cssText='font-family:inherit;cursor:pointer;border-radius:10px;min-height:48px;padding:6px 12px;font-size:var(--fs15,15px);font-weight:700;color:var(--text);'+stil;
    if(attr)x.setAttribute(attr[0],attr[1]);
    x.onclick=fn;return x;
  };
  const RAND='border:2px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);';
  const beschriften=i=>{const p=pins()[i];if(!p)return;const tx=prompt('Beschriftung für Pin '+(i+1)+'\n(z. B. Schaden, undicht)',String(p.t||''));if(tx===null)return;_fsFpText(p,tx);scheduleSave();alles();};
  const leisteBauen=()=>{
    leiste.innerHTML='';
    leiste.appendChild(knopf('📌 Pin setzen','border:3px solid '+(setzen?'#d9480f':'var(--border)')+';background:'+(setzen?'rgba(217,72,15,.16)':'var(--fs-cfl,transparent)')+';',()=>{setzen=!setzen;if(setzen){sel=-1;lose=false;}alles();},['data-fs-fp-setzen','1']));
    const p=sel>=0?pins()[sel]:null;
    if(p){
      leiste.appendChild(knopf('Beschriftung ändern',RAND,()=>beschriften(sel),['data-fs-fp-text','1']));
      leiste.appendChild(knopf(lose?'✓ Fest':'✥ Verschieben','border:3px solid '+(lose?'#2e7d4f':'var(--border)')+';background:'+(lose?'rgba(46,125,79,.16)':'var(--fs-cfl,transparent)')+';',()=>{lose=!lose;alles();},['data-fs-fp-lose','1']));
      leiste.appendChild(knopf('Entfernen',RAND+'color:var(--red);',()=>{if(String(p.t||'').trim()&&!confirm('Pin '+(sel+1)+' („'+String(p.t).trim()+'“) entfernen?'))return;if(_fsFpWeg(f,sel)){sel=-1;lose=false;scheduleSave();alles();}},['data-fs-fp-weg','1']));
    }
    const z=document.createElement('span');z.setAttribute('data-fs-fp-hinweis','1');z.style.cssText='font-size:var(--fs13,13px);color:var(--text2);flex:1 1 200px;';
    z.textContent=setzen?'Jetzt ins Foto tippen, wo der Pin hin soll'
      :!p?(pins().length?'Pin antippen zum Ändern – oder „📌 Pin setzen“ für einen weiteren':'„📌 Pin setzen“ antippen, dann ins Foto tippen')
      :lose?'Pin '+(sel+1)+' ist lose: Pfeilspitze oder Kreis ziehen oder an die richtige Stelle tippen – dann „✓ Fest“'
      :'Pin '+(sel+1)+' ist fest (🔒) – „✥ Verschieben“ macht ihn lose';
    leiste.appendChild(z);
  };
  const listeBauen=()=>{
    liste.innerHTML='';
    pins().forEach((p,i)=>{
      const r=document.createElement('button');r.type='button';r.setAttribute('data-fs-fp-zeile',String(i));
      r.style.cssText='display:block;width:100%;text-align:left;min-height:var(--fsh,40px);margin:3px 0;padding:6px 10px;border-radius:8px;font-family:inherit;font-size:var(--fs15,15px);cursor:pointer;color:var(--text);border:2px solid '+(sel===i?'#d9480f':'transparent')+';background:'+(sel===i?'rgba(217,72,15,.12)':'var(--bg2)')+';';
      r.textContent=(i+1)+' = '+(String(p.t||'').trim()||'ohne Text');
      r.onclick=()=>{sel=i;lose=false;setzen=false;alles();};
      liste.appendChild(r);
    });
    liste.style.display=pins().length?'':'none';
  };
  const alles=()=>{zeichne();leisteBauen();listeBauen();};
  const pos=e=>{const rc=cv.getBoundingClientRect();return [(e.clientX-rc.left)/rc.width*W,(e.clientY-rc.top)/rc.height*H];};
  cv.addEventListener('pointerdown',e=>{
    e.preventDefault();
    try{cv.setPointerCapture(e.pointerId);}catch(x){}
    const p=pos(e);
    if(setzen){ /* neuer Pin: erst die Stelle, dann die Beschriftung */
      const i=_fsFpNeu(f,p[0]/W,p[1]/H,'');
      if(i<0){toast('Genug Pins auf diesem Foto – bitte einen entfernen','info',3500);return;}
      setzen=false;sel=i;lose=false;scheduleSave();alles();
      setTimeout(()=>{if(document.getElementById('_fsFotoPins')===ov)beschriften(i);},80);
      return;
    }
    const tr=_fsFpTreffer(f,p[0],p[1],W,H);
    if(tr&&tr.i!==sel){sel=tr.i;lose=false;alles();return;} /* anderen Pin angetippt = auswählen, nichts bewegen */
    const pin=sel>=0?pins()[sel]:null;
    if(!pin)return;
    if(!lose){if(!festGesagt){festGesagt=true;toast('Der Pin ist fest – zum Ändern „✥ Verschieben“ antippen','info',3500);}return;} /* fest = Tippen verrückt nichts */
    zieh={id:e.pointerId,teil:(tr&&tr.teil==='ring')?'ring':'ziel'};
    if(!tr)_fsFpBewegen(pin,p[0]/W,p[1]/H);
    zeichne();
  });
  cv.addEventListener('pointermove',e=>{
    if(!zieh||e.pointerId!==zieh.id)return;
    e.preventDefault();
    const p=pos(e),pin=pins()[sel];if(!pin)return;
    if(zieh.teil==='ring'){const tx=pin.x*W,ty=pin.y*H,s=_fsFpMass(W,H);_fsFpRingSetzen(pin,Math.atan2(-(p[1]-ty),p[0]-tx)*180/Math.PI,Math.hypot(p[0]-tx,p[1]-ty)/s);}
    else _fsFpBewegen(pin,p[0]/W,p[1]/H);
    zeichne();
  });
  const ende=e=>{if(!zieh||e.pointerId!==zieh.id)return;zieh=null;scheduleSave();alles();};
  cv.addEventListener('pointerup',ende);
  cv.addEventListener('pointercancel',ende);
  const schliessen=()=>{ov.remove();if(typeof fertig==='function'){try{fertig();}catch(x){console.warn('[Foto-Pins]',x);}}};
  zu.onclick=schliessen;fb.onclick=schliessen;
  alles();
  document.body.appendChild(ov);
  /* Das Foto in guter Auflösung holen (derselbe Weg wie fürs PDF: Gerätespeicher, sonst Drive); klappt das nicht, die Miniatur */
  (async()=>{
    let d=null;try{d=await _fsFotoFuerPdf(f);}catch(e){d=null;}
    if(document.getElementById('_fsFotoPins')!==ov)return;
    const im=new Image();
    im.onload=()=>{if(document.getElementById('_fsFotoPins')!==ov)return;const nw=im.naturalWidth||900,nh=im.naturalHeight||640,k=Math.min(1,1600/nw);W=Math.max(1,Math.round(nw*k));H=Math.max(1,Math.round(nh*k));cv.width=W;cv.height=H;bild=im;geladen=true;zeichne();};
    im.onerror=()=>{geladen=true;zeichne();};
    if(d&&d.dataUrl)im.src=d.dataUrl;else{geladen=true;zeichne();_fsMiniaturQuelle(f,im);}
  })();
}
function _fsFotoLeiste(bericht,it,label,kompakt,vorne){ // kompakt: nur 📷 (+Zahl) neben der Notiz – die Checkliste bleibt kurz
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
      const unten=!!bericht.schlank; /* F38: Besichtigung 2 – größeres Vorschaubild, „📌“ und „✕“ stehen darunter statt über dem Bild */
      th.style.cssText='position:relative;width:'+(unten?'var(--fs-mini,76px)':'64px')+';height:'+(unten?'var(--fs-mini,76px)':'64px')+';border-radius:8px;overflow:hidden;cursor:pointer;flex-shrink:0;background:var(--bg3);border:2px solid '+(f.inReport?'#1a7a3c':'var(--border)')+';';
      const img=document.createElement('img');img.alt='';img.style.cssText='width:100%;height:100%;object-fit:cover;pointer-events:none;';
      _fsMiniaturQuelle(f,img);
      th.onclick=()=>_wpMobOpenFoto(bericht,fi);
      const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Verknüpfung lösen – das Foto bleibt im Protokoll';
      x.style.cssText='position:absolute;top:2px;right:2px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,.65);color:#fff;font-size:var(--fs12,12px);line-height:24px;padding:0;cursor:pointer;';
      x.onclick=e=>{e.stopPropagation();it.fotoRefs.splice(ri,1);scheduleSave();neu();};
      if(unten){x.style.cssText='flex:0 0 auto;min-width:28px;height:var(--fsh,30px);border-radius:8px;border:none;background:#4a5568;color:#fff;font-size:var(--fs14,14px);padding:0 6px;cursor:pointer;';th.append(img);}
      else th.append(img,x);
      if(typeof f.blick==='number'&&isFinite(f.blick)){ /* F29: Kennzeichen „Blick nach …“ am Foto; antippen entfernt es */
        const bk=document.createElement('button');bk.type='button';bk.setAttribute('data-fs-blick','1');bk.textContent='↗ '+FS_B2_SEITEN[Math.round((((f.blick%360)+360)%360)/45)%8];bk.title='Blick nach '+_fsBlickWort(f.blick)+' ('+Math.round(f.blick)+'°) – antippen zum Entfernen';
        bk.style.cssText='position:absolute;left:2px;bottom:2px;min-width:30px;height:20px;border-radius:10px;border:none;background:rgba(31,95,139,.9);color:#fff;font-size:var(--fs11,11px);font-weight:700;line-height:20px;padding:0 6px;cursor:pointer;';
        bk.onclick=e=>{e.stopPropagation();if(confirm('Blickrichtung (Blick nach '+_fsBlickWort(f.blick)+') am Foto entfernen?')){delete f.blick;scheduleSave();neu();}};
        th.appendChild(bk);
      }
      if(bericht.schlank){ /* F37: „📌“ an der Miniatur öffnet das Foto zum Markieren; mit Pins steht ihre Anzahl dabei */
        const np=_fsFpListe(f).length;
        const pk=document.createElement('button');pk.type='button';pk.setAttribute('data-fs-fotopin','1');pk.textContent='📌'+(np?' '+np:'');pk.title='Im Foto markieren – Pins mit Beschriftung'+(np?' ('+_fsFpLegende(f)+')':'');pk.setAttribute('aria-label',pk.title);
        pk.style.cssText='position:absolute;left:2px;top:2px;min-width:30px;height:24px;border-radius:12px;border:none;background:'+(np?'rgba(217,72,15,.95)':'rgba(0,0,0,.65)')+';color:#fff;font-size:var(--fs12,12px);font-weight:700;line-height:24px;padding:0 6px;cursor:pointer;';
        pk.onclick=e=>{e.stopPropagation();_fsFotoPinsFenster(bericht,f,()=>neu());};
        pk.style.cssText='flex:1 1 auto;min-width:0;white-space:nowrap;height:var(--fsh,30px);border-radius:8px;border:none;background:'+(np?'rgba(217,72,15,.95)':'#4a5568')+';color:#fff;font-size:var(--fs14,14px);font-weight:700;padding:0 6px;cursor:pointer;';
        const hu=document.createElement('div');hu.setAttribute('data-fs-miniaturbox','1');hu.style.cssText='display:flex;flex-direction:column;gap:4px;flex-shrink:0;width:var(--fs-mini,76px);';
        const zl=document.createElement('div');zl.setAttribute('data-fs-miniaturknoepfe','1');zl.style.cssText='display:flex;gap:4px;';
        zl.append(pk,x);hu.append(th,zl);w.appendChild(hu);
      }
      else w.appendChild(th);
    });
    const b=document.createElement('button');b.type='button';b.setAttribute('data-fs-fotoknopf','1');
    b.textContent=vorne?'📷 Foto'+(anz?' ('+anz+')':''):kompakt?'📷'+(anz?' '+anz:''):'📷 '+label+(anz?' ('+anz+')':''); /* F31: neben dem Luftbild-Knopf kurz */
    b.title=label;b.setAttribute('aria-label',label+(anz?' ('+anz+')':''));
    b.style.cssText=(kompakt?'flex:0 0 auto;min-width:52px;':'flex:1 1 160px;')+'min-height:var(--fsh44,44px);padding:8px 12px;border-radius:8px;border:1.5px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);font-size:var(--fs14,14px);font-weight:600;cursor:pointer;font-family:inherit;';
    b.onclick=()=>{
      /* F29: Besichtigung 2 – die Blickrichtung des Geräts im Moment des Antippens geht mit dem neuen Foto (richte das Gerät vorher auf die Wand) */
      const g=bericht.schlank?_fsKompassLetzte(6000):null,vor=it.fotoRefs.slice(),t0=Date.now();let blickDa=false; /* F32: die Blickrichtung gilt nur für das ERSTE frisch aufgenommene Foto nach dem Antippen – bei „Weiteres“ hat man sich vielleicht schon gedreht, ein angehaktes älteres Foto wurde woanders gemacht */
      if(g!==null)toast('🧭 Blick nach '+_fsBlickWort(g)+' – wird am Foto gespeichert','info',2500);
      _wpMobFotoPickerForItem(bericht,it,()=>{
        if(g!==null&&!blickDa){let neuDa=false;it.fotoRefs.forEach(ref=>{if(vor.indexOf(ref)>=0)return;const f=(bericht.fotos||[]).find(x=>_fsRefPasst(x,ref));if(f&&typeof f.blick!=='number'&&_fsFotoFrisch(f,t0)){f.blick=g;neuDa=true;}});if(neuDa){blickDa=true;scheduleSave();}}
        neu();
      });
    };
    if(vorne){const kn=document.createElement('div');kn.setAttribute('data-fs-knopfreihe','1');kn.style.cssText='display:flex;gap:8px;flex:1 1 100%;order:-1;';b.style.flex='1 1 120px';b.style.minWidth='0';kn.append(vorne,b);w.appendChild(kn);} /* F31: Luftbild-Knopf und Foto-Knopf in EINER Reihe, Miniaturen darunter */
    else w.appendChild(b);
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
  const k=document.createElement('div');k.style.cssText='font-size:var(--fs17,17px);font-weight:700;color:var(--text);';
  k.textContent=e.stufe==='gruen'?'✅ Keine Schimmelgefahr':e.stufe==='gelb'?'⚠ Mögliches Schimmelrisiko':e.stufe==='rot'?'⛔ Akute Schimmelgefahr':'ℹ Ergebnis';
  const tx=document.createElement('div');tx.style.cssText='font-size:var(--fs14,14px);color:var(--text);margin-top:4px;line-height:1.45;';tx.textContent=e.text;
  el.append(k,tx);
}

// PDF öffnen: das eben erstellte vom Gerät, sonst das in Drive abgelegte
/* ── F39: BESICHTIGUNG 2 ALS WORD – der INHALT (reine Rechnung, ohne Bildschirm) ─────────────────────────────────────
   Das PDF bleibt der unveränderte Nachweis; daneben gibt es am PC ein bearbeitbares Word-Dokument. Diese Funktion legt fest, WAS drinsteht
   und in welcher Reihenfolge – wie im Muster vom 04.10.2026: Vor Ort · Gemeldet und vorgefunden · Feststellungen innen · Feststellungen außen
   (je Stelle eine kleine Tabelle „Wo / Seite / Festgestellt“, darunter ihre Fotos; danach die Skizzen des Teils) · Lage von außen (Luftbild) ·
   Umgebung · weitere Fotos. Nur Ausgefülltes, nur Feststellungen – keine Ursache, keine Empfehlung. WIE es aussieht (Schrift, Tabellen,
   Briefkopf), macht PAM Desktop. Blöcke: {a:'kapitel'|'unter'|'text', t} · {a:'tabelle', z:[[Bezeichnung, Inhalt]]} ·
   {a:'fotos', l:[{foto, text}]} · {a:'skizze', sk, t, ersatz} · {a:'luftbild', t, ersatz}. */
/* Das Bild einer Skizze fürs Word (JPEG als data-URL, '' wenn es nicht geht) – hier, damit PAM Desktop keinen Skizzen-Code braucht */
function _fsWordSkizzeBild(b,sk){try{return _fsBgSkizzeBild(b,_fsAsPseudoRaum(sk))||'';}catch(e){console.warn('[Word] Skizze:',e);return '';}}
function _fsWordAufbau(b,task){
  const k=(b&&b.kopf)||{},hat=v=>!(v===null||v===undefined||String(v).trim()==='');
  const out={titel:_fsB2Name(b),objekt:String(k.objektAdresse||(task&&task.adresse)||'').trim(),auftraggeber:String((task&&task.rechnungsanschrift)||k.auftraggeber||'').trim(),
    auftragNr:String(k.auftragNr||'').trim(),datum:String((b&&b.datum)||'').trim(),pruefer:String(k.pruefer||'').trim(),bloecke:[]};
  if(!b)return out;
  const B=out.bloecke,alle=(Array.isArray(b.fotos)?b.fotos:[]).filter(f=>f&&f.inReport),drin=[];
  const fotoText=f=>{const zu=_fsBgFotoZuordnung(b,f),fpl=_fsFpLegende(f);return (zu||'')+(fpl?(zu?'. ':'')+'Markiert: '+fpl:'');};
  const fotosVon=refs=>{const l=[];(Array.isArray(refs)?refs:[]).forEach(r=>{const f=alle.find(x=>_fsRefPasst(x,r));if(f&&l.indexOf(f)<0)l.push(f);});return l;};
  { /* Vor Ort */
    const z=[],zt=_fsBgZeitText(k),aw=_fsBgAnwesendText(b);
    if(hat(b.datum)||zt)z.push(['Datum, Zeit',[hat(b.datum)?String(b.datum).trim():'',zt].filter(Boolean).join(', ')]);
    if(hat(k.besuchBei))z.push(['Besichtigung bei',String(k.besuchBei).trim()]);
    if(aw)z.push(['Anwesend',aw]);
    if(hat(k.pruefer))z.push(['Aufgenommen von',String(k.pruefer).trim()]);
    if(z.length){B.push({a:'kapitel',t:'Vor Ort'});B.push({a:'tabelle',z:z});}
  }
  { /* Gemeldet und vorgefunden */
    const z=[];
    if(hat(k.anlass))z.push(['Gemeldet',String(k.anlass).trim().replace(/\s+/g,' ')]);
    if(z.length&&b.meldungStatus==='wie')z.push(['Vorgefunden','wie gemeldet']);
    if(z.length&&b.meldungStatus==='abw'){const w=String(b.meldungAbw||'').trim().replace(/\s+/g,' ');z.push(['Vorgefunden','abweichend'+(w?': '+w:'')]);}
    if(z.length){B.push({a:'kapitel',t:'Gemeldet und vorgefunden'});B.push({a:'tabelle',z:z});}
  }
  const vbs=_fsVbStellenGefuellt(b);
  ['innen','aussen'].forEach(typ=>{
    if(!_fsB2Sichtbar(b,typ))return;
    const teil=[];
    _fsVbRaumGruppen(b,typ).forEach(g=>g.stellen.forEach(({s})=>{
      const x=vbs.find(v=>v.s===s);if(!x)return;
      teil.push({a:'unter',t:_fsVbBezeichnung(b,s,x.nr)});
      const z=[],se=_fsSeiteText(s.seite);
      if(hat(s.ort))z.push(['Wo',String(s.ort).trim()]);
      if(se)z.push(['Seite',se]);
      if(hat(s.text))z.push(['Festgestellt',String(s.text).trim()]);
      if(z.length)teil.push({a:'tabelle',z:z});
      const fl=fotosVon(s.fotoRefs);
      if(fl.length){fl.forEach(f=>{if(drin.indexOf(f)<0)drin.push(f);});teil.push({a:'fotos',l:fl.map(f=>({foto:f,text:fotoText(f)}))});}
    }));
    _fsAsListe(b).forEach(sk=>{ /* Skizzen des Teils – nur, wenn etwas eingezeichnet ist */
      if(_fsAsTyp(sk)!==typ||!_fsAsBenutzt(b,sk))return;
      const mk=_fsAsMarken(b,sk),nm=hat(sk.name)?String(sk.name).trim():(typ==='innen'?'Raum':'Außen');
      const tx='Skizze '+nm+', Ansicht '+_fsAsAnsicht(sk)+' (nicht maßstäblich).'+(mk.length?' '+mk.map(q=>q.n+' = '+q.label+(hat(q.s.ort)?' ('+String(q.s.ort).trim()+')':'')).join(' · '):'');
      teil.push({a:'unter',t:'Skizze '+(typ==='innen'?'innen':'außen')+' – '+nm});
      teil.push({a:'skizze',sk:sk,t:tx,ersatz:'Die Skizze „'+nm+'“ konnte nicht als Bild eingefügt werden.'});
    });
    if(teil.length){B.push({a:'kapitel',t:typ==='innen'?'Feststellungen innen':'Feststellungen außen'});teil.forEach(x=>B.push(x));}
  });
  { /* Lage von außen */
    const lbp=_fsLbPunkte(b);
    if(lbp.length){
      B.push({a:'kapitel',t:'Lage von außen (Luftbild)'});
      B.push({a:'luftbild',t:'Luftbild mit Markierung. '+lbp.map(q=>q.n+' = '+q.label).join(' · ')+'.',
        ersatz:'Von außen markiert (Luftbild nicht abgebildet): '+lbp.map(q=>q.n+' = '+q.label+' ('+q.lat.toFixed(5)+' N, '+q.lon.toFixed(5)+' O)').join(' · ')+'.'});
    }
  }
  { /* Umgebung */
    const erg=_fsVbErgebnisZeilen(b);
    if(erg.length){B.push({a:'kapitel',t:'Umgebung'});erg.forEach(z=>B.push({a:'text',t:z}));}
  }
  { /* Fotos im Protokoll, die an keiner Stelle hängen */
    const rest=alle.filter(f=>drin.indexOf(f)<0);
    if(rest.length){B.push({a:'kapitel',t:'Weitere Fotos'});B.push({a:'fotos',l:rest.map(f=>({foto:f,text:fotoText(f)}))});}
  }
  return out;
}
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

function _openFeuchteprotokollMobil(existingIdx,art,teil){
  const t=currentTask();if(!t)return;
  if(!t.pruefberichte)t.pruefberichte=[];
  if(art==='besichtigung2'&&typeof existingIdx!=='number'&&!teil){_fsB2Teilwahl(w=>{if(w)_openFeuchteprotokollMobil(undefined,art,w);});return;} // F28: erst fragen: Innen · Außen · Beides
  let bericht;
  if(typeof existingIdx==='number'&&t.pruefberichte[existingIdx]&&t.pruefberichte[existingIdx].vorlage==='feuchte'){
    bericht=t.pruefberichte[existingIdx];
  }else{
    bericht=_fsNeuerBericht(t,art);
    if(typeof _fsBgUmstellen==='function')_fsBgUmstellen(bericht); // F2a: neue Protokolle starten als Begehungsprotokoll
    if(art==='besichtigung2'){bericht.zeigeInnen=teil!=='aussen';bericht.zeigeAussen=teil!=='innen';} // F28: nur der gewählte Teil ist sichtbar
    if(art==='vorab'||art==='besichtigung2'){ // F16 (F23: auch Besichtigung 2): Anlass aus der Karte vorschlagen; die Bei-Bedarf-Abschnitte (Feststellungen 2–4, Termin, Räume) starten zugeklappt – nur Anzeige, nicht im Protokoll
      try{
        _fsKopfErgaenzen(bericht,t);
        [1,2,3].forEach(si=>_fsZuSetzen(bericht.id,si,true));
        _fsZuMehrere(bericht.id,['b:termin','b:raeume'],true);
      }catch(e){console.warn('[Vorabbesichtigung] Start:',e);}
    }
    t.pruefberichte.push(bericht);
    scheduleSave();
  }
  _fsVervollstaendigen(bericht);

  const GID='_fsMobOverlay';const old=document.getElementById(GID);if(old)old.remove();
  if(typeof _pbOffenMerken==='function')_pbOffenMerken(t,bericht,GID,function(){_neuBauen();}); // v306: nach Neuladen/Zusammenführen an den frischen Stand hängen, bei jüngerer Fassung von drüben neu zeichnen
  const ov=document.createElement('div');ov.id=GID;
  ov.style.cssText='position:fixed;inset:0;z-index:99998;display:flex;flex-direction:column;background:var(--bg);';
  _fsSichtAn(ov); /* F38 */
  ov._fsBericht=bericht; // F2a: „📘 So geht's" liest daraus, welches Protokoll offen ist

  const S_INP='width:100%;box-sizing:border-box;background:var(--bg3);border:var(--fs-frb,1px) solid var(--border);border-radius:6px;padding:var(--fs-fpad,8px);font-size:var(--fs16,16px);color:var(--text);font-family:inherit;min-width:0;';
  const S_HDR='padding:10px 14px;font-size:var(--fs13,13px);font-weight:700;color:var(--text);background:var(--fs-hdr,var(--bg2));border-top:1px solid var(--border);border-bottom:1px solid var(--border);border-left:var(--fs-kante,4px) solid var(--fs-hfa,'+FS_FARBE+');';
  const S_RAUMGRID='display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,.8fr) minmax(0,.8fr) minmax(0,.9fr) var(--fsh,40px);gap:6px;';
  const S_KNOPF='padding:9px 12px;border-radius:8px;font-size:var(--fs14,14px);cursor:pointer;font-weight:600;font-family:inherit;';

  /* Kopfleiste */
  const hdr=document.createElement('div');
  hdr.style.cssText='background:'+FS_FARBE+';padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.textContent='←';
  closeBtn.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:var(--fs18,18px);cursor:pointer;flex-shrink:0;';
  closeBtn.onclick=()=>{ov.remove();try{const ct=currentTask();if(ct)renderDetail(ct);}catch(e){console.warn('[Feuchte] zurück:',e);}};
  const hdrMeta=document.createElement('div');hdrMeta.style.cssText='flex:1;min-width:0;';
  const hdrT=document.createElement('div');hdrT.style.cssText='font-size:var(--fs15,15px);font-weight:700;color:#fff;';hdrT.textContent='💧 '+_fsTitel(bericht);
  const hdrS=document.createElement('div');hdrS.style.cssText='font-size:var(--fs12,12px);color:rgba(255,255,255,.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  hdrS.textContent=(bericht.kopf.objektAdresse||t.adresse||t.title||'')+' · '+(bericht.datum||'');
  hdrMeta.append(hdrT,hdrS);
  const statsEl=document.createElement('div');statsEl.id='_fsMobStats';
  statsEl.style.cssText='background:rgba(255,255,255,.18);border-radius:6px;padding:3px 8px;font-size:var(--fs12,12px);color:#fff;white-space:nowrap;flex-shrink:0;';
  const hilfeBtn=document.createElement('button');hilfeBtn.type='button';hilfeBtn.textContent='📘';hilfeBtn.title="So geht's";hilfeBtn.setAttribute('aria-label',"So geht's – Anleitung"); // v304
  hilfeBtn.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:var(--fs18,18px);cursor:pointer;flex-shrink:0;';
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
    const l=document.createElement('span');l.style.cssText='font-size:var(--fs13,13px);color:var(--text2);width:112px;flex-shrink:0;';l.textContent=label;
    const i=_inp(bericht.kopf[key],ph,v=>{bericht.kopf[key]=v;if(key==='aussenT'||key==='aussenRf')_fsWerteNeu();if(key==='pruefer'&&bericht.fassung==='begehung'&&typeof _fsBgMerkName==='function')_fsBgMerkName(v);},zahl);
    row.append(l,i);return row;
  }
  function _chip(label,an,fn){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText='padding:8px 14px;border-radius:16px;font-size:var(--fs14,14px);cursor:pointer;font-family:inherit;min-height:var(--fsh,40px);'
      +'border:2px solid '+(an?'var(--fs-krd,'+FS_FARBE+')':'var(--border)')+';background:'+(an?'var(--fs-can,rgba(31,95,139,.18))':'var(--fs-cfl,transparent)')+';color:var(--text);font-weight:'+(an?'700':'400')+';';
    b.onclick=fn;return b;
  }
  function _neuBauen(){
    const sc=body.scrollTop;
    body.innerHTML='';_vbUmgFuellen=null; // F23
    if(_fsIstVorab(bericht)&&bericht.schlank&&typeof _teilKopfBg==='function')body.append(_teilLeiste(),_bgBlock('vorort',_teilVorOrtVb),_bgBlock('gemeldet',_teilGemeldetVb),_bgBlock('stellen',_teilFeststellungenB2),_bgBlock('fotos',_teilFotos,'Fotos')); // F23: Besichtigung 2 · F38: ohne den Abschnitt „Räume“ (seit F36 sitzt die Skizze beim Raum; der Balken stand noch da und hieß „raeume“)
    else if(_fsIstVorab(bericht)&&typeof _teilKopfBg==='function')body.append(_teilLeiste(),_bgBlock('vorort',_teilVorOrtVb),_bgBlock('gemeldet',_teilGemeldetVb),_bgBlock('stellen',_teilStellenBlockVb),_bgBlock('umgebung',_teilUmgebungVb),_bgBlock('ergebnis',_teilErgebnisVb),_bgBlock('fotos',_teilFotos,'Fotos'),_bgBlock('vorgeschichte',_teilVorgeschichteVb),_bgBlock('karte',_teilKarteVb),_bgBlock('versich',_teilVersichVb),_bgBlock('fest',_teilChecklistenBg,'Feststellungen vor Ort'),...(_vbAltAngaben()?[_bgBlock('angaben',_teilAngabenBg,'Angaben der Nutzer (nicht selbst festgestellt)')]:[]),_bgBlock('termin',_teilTerminBg),_bgBlock('raeume',_teilRaeumeBg,'Räume')); // F20: „Vor Ort“ offen, der Rest zugeklappt
    else if(bericht.fassung==='begehung'&&typeof _teilKopfBg==='function')body.append(_teilLeiste(),_teilKopfBg(),_bgBlock('raeume',_teilRaeumeBg,'Räume'),_bgBlock('fest',_teilChecklistenBg,'Feststellungen vor Ort'),_bgBlock('angaben',_teilAngabenBg,'Angaben der Nutzer (nicht selbst festgestellt)'),_bgBlock('fazit',_teilZusammenfassungBg,'Zusammenfassung der Feststellungen'),_bgBlock('fotos',_teilFotos,'Fotos')); // F2b: zuklappbar, Leiste oben
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

  // F20: „↻ aus Karte“ – leere Felder füllen (wie bisher), ABWEICHENDE Felder nach Rückfrage übernehmen (Frank: Adresse an der Karte korrigiert, Protokoll behielt die alte)
  function _ausKarteKlick(){
    const n=_fsKopfErgaenzen(bericht,t);
    const ab=(typeof _fsKopfAbweichungen==='function')?_fsKopfAbweichungen(bericht,t):[];
    let m=0;
    if(ab.length&&confirm('Diese Angaben weichen von der Karte ab:\n\n'+ab.map(x=>x.name+'\n   im Protokoll: '+x.alt+'\n   in der Karte: '+x.neu).join('\n\n')+'\n\nOK = aus der Karte übernehmen\nAbbrechen = so lassen')){ab.forEach(x=>{bericht.kopf[x.key]=x.neu;});m=ab.length;}
    scheduleSave();_neuBauen();
    const teile=[n?n+(n===1?' Feld':' Felder')+' ergänzt':'',m?m+(m===1?' Feld':' Felder')+' aus der Karte übernommen':''].filter(Boolean);
    toast(teile.length?'✓ '+teile.join(', '):(ab.length?'ℹ Nichts geändert – das Protokoll behält seine Angaben':'ℹ Nichts zu übernehmen – alles wie in der Karte'),'info',3500);
  }
  function _teilErgebnis(){ // v294
    const e=document.createElement('div');e.setAttribute('data-fs-ergebnis','1');
    e.style.cssText='margin:10px;padding:12px 14px;border-radius:10px;background:var(--bg2);border:1px solid var(--border);border-left:6px solid var(--border);';
    return e;
  }

  function _teilKopf(){
    const w=document.createElement('div');
    const hilfen=document.createElement('div');hilfen.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;'; // v294
    const hk=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';b.onclick=fn;return b;};
    hilfen.append(
      hk('↻ aus Karte',()=>_ausKarteKlick()),
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
    td.style.cssText='padding:0 14px 6px 136px;font-size:var(--fs13,13px);color:var(--text2);';
    w.append(td,_feld('Messgeräte','messgeraete','z. B. testo 605i / 805i'),_feld('Prüfer','pruefer',''));
    return w;
  }

  function _teilRaeume(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Raumklima'));
    if(bericht.raeume.length){
      const kz=document.createElement('div');kz.style.cssText=S_RAUMGRID+'padding:6px 14px 0;font-size:var(--fs12,12px);color:var(--text2);';
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
      td.style.cssText='font-size:var(--fs14,14px);color:var(--text);text-align:center;';
      const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Raum entfernen';
      x.style.cssText='width:var(--fsh,40px);height:var(--fsh,40px);border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:var(--fs15,15px);cursor:pointer;';
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
    const info=document.createElement('div');info.style.cssText='padding:6px 14px 2px;font-size:var(--fs12,12px);color:var(--text2);';
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
      x.style.cssText='width:var(--fsh,40px);height:var(--fsh,40px);border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:var(--fs15,15px);cursor:pointer;flex-shrink:0;';
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
        const z=document.createElement('label');z.style.cssText='display:flex;flex-direction:column;gap:3px;font-size:var(--fs12,12px);color:var(--text2);min-width:0;';
        const s=document.createElement('span');s.textContent=lab;
        z.append(s,_inp(st[key],'',v=>{st[key]=v;_fsWerteNeu();},true));
        gr.appendChild(z);
      });

      let luftGr=null; // v294: Luft der testo-Messung änderbar (leer = Raumklima)
      if(st.testo||_fsZahl(st.luftT)!==null||_fsZahl(st.luftRf)!==null){
        luftGr=document.createElement('div');luftGr.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px;';
        [['Luft °C (Messung)','luftT'],['Luft % rF (Messung)','luftRf']].forEach(([lab,key])=>{
          const z=document.createElement('label');z.style.cssText='display:flex;flex-direction:column;gap:3px;font-size:var(--fs12,12px);color:var(--text2);min-width:0;';
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
    testoBtn.style.cssText=S_KNOPF+'display:block;width:calc(100% - 20px);margin:0 10px 14px;border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';
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
        kurz.style.cssText='font-size:var(--fs12,12px);font-weight:600;color:var(--text2);white-space:nowrap;flex-shrink:0;';kopf.appendChild(kurz);}
      kopf.onclick=()=>umschalten(si,!zu);
      w.appendChild(kopf);
      if(zu)return;
      sek.items.forEach(it=>{
        const row=document.createElement('div');row.style.cssText='padding:10px 14px;border-bottom:1px solid var(--border);';
        const txt=document.createElement('div');txt.style.cssText='font-size:var(--fs14,14px);color:var(--text);margin-bottom:6px;';txt.textContent=it.text||'';
        const knr=document.createElement('div');knr.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;';
        stufen.forEach(s=>{
          const an=(it.status||'offen')===s.k;
          const b=document.createElement('button');b.type='button';b.textContent=s.t;
          b.style.cssText='padding:8px 4px;min-height:var(--fsh,40px);border-radius:8px;font-size:var(--fs13,13px);font-weight:700;cursor:pointer;font-family:inherit;'
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
      ein.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:0 14px 12px;border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';
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
    const info=document.createElement('div');info.style.cssText='padding:6px 14px;font-size:var(--fs12,12px);color:var(--text2);';
    info.textContent=_fsAmPc()
      ?'Klick = im PDF ✓ · Doppelklick oder 👁 = groß ansehen · ✏ = bemalen und beschriften (das Original bleibt) · ‹ › = Reihenfolge · ✕ = aus dem Protokoll entfernen (in Drive bleibt es)'
      :'Antippen = im PDF ✓ · zweimal antippen = groß ansehen';
    const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:0 14px 8px;';
    grid.id='_wpMobFotoGrid'; // derselbe Name wie im Wartungsprotokoll: der Foto-Dialog zieht die Miniaturen hierüber nach
    _wpMobRenderFotos(bericht,grid);
    const kr=document.createElement('div');kr.style.cssText='display:flex;gap:8px;padding:0 14px 16px;';
    const mk=(txt,stil,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText=S_KNOPF+'flex:1;'+stil;b.onclick=fn;return b;};
    if(_fsAmPc()){ // F9: am PC keine Kamera – Fotos von der Festplatte oder aus der Foto-Liste der Karte
      kr.append(
        mk('📁 Fotos vom PC','border:1.5px solid var(--border);background:var(--bg3);color:var(--text);',()=>_wpMobFotoAufnehmen(bericht,grid,false)),
        mk('🖼 Fotos der Karte','border:1.5px dashed var(--green);background:var(--fs-kfl,transparent);color:var(--text);',()=>_wpMobLadeDriveFotos(bericht,grid)));
    }else kr.append(
      mk('📷 Kamera','border:1.5px dashed var(--accent2);background:var(--fs-kfl,transparent);color:var(--text);',()=>_wpMobFotoAufnehmen(bericht,grid,true)),
      mk('🖼 Galerie','border:1.5px solid var(--border);background:var(--bg3);color:var(--text);',()=>_wpMobFotoAufnehmen(bericht,grid,false)),
      mk('☁ Drive','border:1.5px dashed var(--green);background:var(--fs-kfl,transparent);color:var(--text);',()=>_wpMobLadeDriveFotos(bericht,grid)));
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
    x.style.cssText='width:var(--fsh,40px);height:var(--fsh,40px);border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:var(--fs15,15px);cursor:pointer;flex-shrink:0;';
    x.onclick=fn;return x;
  }
  function _bgInfo(text){
    const d=document.createElement('div');d.style.cssText='padding:6px 14px;font-size:var(--fs12,12px);color:var(--text2);line-height:1.45;';d.textContent=text;return d;
  }
  function _bgNamenListe(){ // „Name (Rolle)" aller eingetragenen Anwesenden
    return (bericht.anwesende||[]).filter(p=>p&&String(p.name||'').trim())
      .map(p=>String(p.name).trim()+(String(p.rolle||'').trim()?' ('+String(p.rolle).trim()+')':''));
  }

  // Altes Protokoll: Hinweis mit Knopf zum Umwandeln (nichts geschieht ohne Rückfrage)
  function _teilUmwandeln(){
    const w=document.createElement('div');w.setAttribute('data-fs-umwandeln','1');
    w.style.cssText='margin:10px;padding:10px 12px;border-radius:10px;background:var(--bg2);border:1px solid var(--border);border-left:6px solid var(--orange);font-size:var(--fs13,13px);color:var(--text);line-height:1.45;';
    const tx=document.createElement('div');
    tx.textContent='Das ist noch das alte Feuchte- und Schimmelprotokoll. Das neue Begehungsprotokoll hält nur Feststellungen fest: keine Ampel, keine Ursache, keine Empfehlung.';
    const b=document.createElement('button');b.type='button';b.textContent='🔄 In Begehungsprotokoll umwandeln';b.setAttribute('data-fs-umwandeln-knopf','1');
    b.style.cssText=S_KNOPF+'margin-top:8px;min-height:var(--fsh44,44px);border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';
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
    const kopf=document.createElement('div');kopf.style.cssText='font-size:var(--fs13,13px);color:var(--text2);margin-bottom:6px;';kopf.textContent='Anwesend – Name und Rolle';
    w.appendChild(kopf);
    const altText=String(bericht.kopf.anwesend||'').trim();
    if(!bericht.anwesende.length&&altText){
      const h=document.createElement('div');h.style.cssText='font-size:var(--fs12,12px);color:var(--text2);margin-bottom:6px;padding-left:8px;border-left:3px solid var(--orange);line-height:1.45;';
      h.textContent='Bisher als Text eingetragen: '+altText+' – bitte unten als Personen anlegen.';
      w.appendChild(h);
    }
    bericht.anwesende.forEach((p,pi)=>{
      const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) var(--fsh,40px);gap:6px;margin-bottom:6px;align-items:center;';
      const n=_inp(p.name,'Name',v=>{p.name=v;},false);n.setAttribute('data-fs-person',String(pi));
      const sel=document.createElement('select');sel.style.cssText=S_INP;
      const o0=document.createElement('option');o0.value='';o0.textContent='– Rolle –';sel.appendChild(o0);
      const rollen=(bericht.schlank?FS_B2_ROLLEN:FS_BG_ROLLEN).slice();if(p.rolle&&rollen.indexOf(p.rolle)<0)rollen.push(p.rolle); // F25: Besichtigung 2 hat eigene Rollen; eine schon eingetragene fremde Rolle bleibt auswählbar
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
      const rolle=bericht.schlank?(FS_B2_KONTAKTROLLEN[kx.rolle]||''):(kx.rolle==='mieter'?'Nutzer':(['ag','privatkunde','eigentuemer','hausverwaltung'].indexOf(kx.rolle)>=0?'Vertreter Auftraggeber':'')); // F25
      chips.appendChild(_chip('＋ '+nm,false,()=>{bericht.anwesende.push({name:nm,rolle});scheduleSave();_neuBauen();}));
    });
    w.appendChild(chips);
    return w;
  }

  /* ── F2b: Bedienung – jeder Abschnitt lässt sich zuklappen, oben eine Leiste zum Springen ──────────────
     Gemerkt wird je GERÄT im Browser-Speicher (wie bei den Feststellungs-Abschnitten), NICHT am Protokoll – sonst käme es
     aufs andere Gerät mit. Das PDF zeigt immer alles. Standard: alles aufgeklappt. */
  function _bgStdZu(k){return k==='skizze'||(_fsIstVorab(bericht)&&(bericht.schlank?FS_B2_STANDARD_ZU:FS_VB_STANDARD_ZU).indexOf(k)>=0);} // F20: Standard zu – wie die Raumskizze
  function _bgZu(k){const l=_fsZuLesen(bericht.id);return _bgStdZu(k)?l.indexOf('a:'+k)<0:l.indexOf('b:'+k)>=0;}
  function _bgZuMehrere(keys,zu){ // Schlüssel: „b:…“ = zu; nur die Raumskizze ist Standard zu und merkt sich das Aufklappen als „a:skizze“
    const norm=keys.filter(k=>!_bgStdZu(k)).map(k=>'b:'+k);
    if(norm.length)_fsZuMehrere(bericht.id,norm,zu);
    const std=keys.filter(_bgStdZu).map(k=>'a:'+k); // F20: auch die Standard-zu-Abschnitte der Vorabbesichtigung
    if(std.length)_fsZuMehrere(bericht.id,std,!zu);
  }
  function _bgBloecke(){return _fsIstVorab(bericht)?(bericht.schlank?_fsB2Bloecke(bericht):FS_VB_BLOECKE.filter(b=>b.k!=='angaben'||_vbAltAngaben())):FS_BG_BLOECKE;} // F16: Vorabbesichtigung hat eigene Abschnittsliste
  function _bgNurDieser(){try{return localStorage.getItem('pam_fs_nurDieser')==='1';}catch(e){return false;}}
  // Kurzfassung, die neben einem zugeklappten Abschnitt steht – nur Zahlen und Stichworte, keine Wertung
  function _bgKurz(k){
    const kf=bericht.kopf||{};
    const gef=arr=>arr.filter(x=>String(kf[x]||'').trim()).length;
    const plural=(n,e,m)=>n+' '+(n===1?e:m);
    if(k==='vorort')return [String(bericht.datum||'').trim(),_fsBgZeitText(kf),String(kf.besuchBei||'').trim()].filter(Boolean).join(' · ')||'noch leer'; // F20, F22: Stellen und Fotos haben eigene Abschnitte
    if(k==='gemeldet')return bericht.meldungStatus==='wie'?'wie gemeldet':bericht.meldungStatus==='abw'?'abweichend':(String(kf.anlass||'').trim()?'noch nicht bestätigt':'noch leer'); // F22
    if(k==='stellen'){const n=_fsVbStellenGefuellt(bericht).length;return n?plural(n,'Stelle','Stellen'):'noch keine Stelle';} // F22
    if(k==='umgebung'){const z=(bericht.vbUmgebung||[]).filter(r=>r&&String(r.text||'').trim()),g=_fsVbUmgebungZeilen(bericht).length;return z.length?g+' von '+z.length+' abgegangen':'noch leer';} // F22
    if(k==='ergebnis'){const n=_fsVbErgebnisZeilen(bericht).length;return n?'entsteht aus Stellen und Umgebung':'noch leer';} // F22
    if(k==='vorgeschichte')return String(bericht.vorgeschichte||'').trim()?'ausgefüllt':'noch leer'; // F22
    if(k==='karte')return gef(['auftraggeber','objektAdresse','auftragNr','nutzer'])+' von 4 ausgefüllt'; // F20
    if(k==='versich')return gef(['versicherung','schadennr','zugang','ansprechpartner'])+' von 4 ausgefüllt'; // F20
    if(k==='auftrag')return _fsIstVorab(bericht)?gef(['auftraggeber','objektAdresse','auftragNr','nutzer','anlass','versicherung','schadennr','zugang','ansprechpartner','besuchBei','lage'])+' von 11 ausgefüllt':gef(['auftraggeber','objektAdresse','auftragNr','nutzer','anlass'])+' von 5 ausgefüllt';
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
      return [String(bericht.schadenbild||'').trim()?'Beschreibung':'',da?da+' erfasst':'',offen?offen+' offen':''].filter(Boolean).join(' · ')||'keine Punkte'; // F19
    }
    if(k==='skizze'){const n=(bericht.raeume||[]).filter(q=>q&&q.skizze&&q.skizze.an).length;return n?plural(n,'Skizze','Skizzen'):'noch keine Skizze';}
    if(k==='angaben'){const a=bericht.angaben||[];return a.filter(x=>x&&String(x.text||'').trim()).length+' von '+a.length+' beantwortet';}
    if(k==='fazit')return String(bericht.bemerkung||'').trim()?'ausgefüllt':'noch leer';
    if(k==='fotos'){const f=bericht.fotos||[];return f.length?plural(f.length,'Foto','Fotos')+' ('+f.filter(x=>x&&x.inReport).length+' im PDF)':'noch kein Foto';}
    return '';
  }
  // Ein Abschnitt mit Pfeil in der Überschrift. bauFn baut den Inhalt (erst wenn aufgeklappt); hat der Inhalt schon eine eigene
  // Überschrift (kopfText), wird sie entfernt – die Überschrift ist jetzt der Pfeil-Knopf.
  function _bgBlock(k,bauFn,kopfText){
    const def=_bgBloecke().find(b=>b.k===k)||{t:k};
    const zu=_bgZu(k);
    const w=document.createElement('div');w.setAttribute('data-fs-block',k);w.style.scrollMarginTop='56px';
    const kopf=document.createElement('button');kopf.type='button';kopf.setAttribute('data-fs-blockkopf',k);kopf.setAttribute('aria-expanded',zu?'false':'true');
    kopf.style.cssText=S_HDR+'display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;font-family:inherit;border-right:none;';
    const pfeil=document.createElement('span');pfeil.textContent=zu?'▸':'▾';pfeil.style.cssText='width:16px;flex-shrink:0;';
    const kt=document.createElement('span');kt.textContent=def.t;kt.style.cssText='flex:1;min-width:0;';
    kopf.append(pfeil,kt);
    if(zu){const kurz=document.createElement('span');kurz.setAttribute('data-fs-blockkurz',k);kurz.textContent=_bgKurz(k);
      kurz.style.cssText='font-size:var(--fs12,12px);font-weight:600;color:var(--text2);white-space:nowrap;flex-shrink:0;';kopf.appendChild(kurz);}
    kopf.onclick=()=>{
      _bgZuMehrere([k],!zu);_neuBauen();
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
    const alle=_bgBloecke().map(b=>b.k);
    if(_bgNurDieser())_bgZuMehrere(alle.filter(x=>x!==k),true);
    _bgZuMehrere([k],false);
    _neuBauen();
    const el=body.querySelector('[data-fs-block="'+k+'"]');if(el){try{el.scrollIntoView({block:'start'});}catch(e){}}
  }
  function _teilLeiste(){
    const w=document.createElement('div');w.setAttribute('data-fs-leiste','1');
    w.style.cssText='position:sticky;top:0;z-index:6;background:var(--bg);border-bottom:1px solid var(--border);padding:6px 10px;display:flex;gap:6px;align-items:center;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;';
    const alle=_bgBloecke().map(b=>b.k);
    const offene=alle.filter(k=>!_bgZu(k)).length;
    const nur=_bgNurDieser();
    const mk=(txt,an,fn,attr)=>{
      const b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute(attr[0],attr[1]);
      b.style.cssText='flex:0 0 auto;padding:6px 12px;min-height:var(--fsh,40px);border-radius:18px;font-size:var(--fs13,13px);cursor:pointer;font-family:inherit;'
        +'border:2px solid '+(an?'var(--fs-krd,'+FS_FARBE+')':'var(--border)')+';background:'+(an?'var(--fs-can,rgba(31,95,139,.18))':'var(--fs-cfl,transparent)')+';color:var(--text);font-weight:'+(an?'700':'600')+';';
      b.onclick=fn;return b;
    };
    if(!_fsIstVorab(bericht))w.appendChild(mk('📋 Messliste',false,()=>_fsBgMessfensterZeigen(bericht,'liste'),['data-fs-messliste','1'])); // F4a: ganz vorn, auch am Handy (F16: nicht bei der Vorabbesichtigung)
    w.appendChild(mk(offene?'▸ Alles zu':'▾ Alles auf',false,()=>{_bgZuMehrere(alle,!!offene);_neuBauen();},['data-fs-alles','1']));
    w.appendChild(mk(nur?'✓ Nur dieser':'Nur dieser',nur,()=>{try{localStorage.setItem('pam_fs_nurDieser',nur?'0':'1');}catch(e){}_neuBauen();},['data-fs-nur','1']));
    _bgBloecke().forEach(b=>w.appendChild(mk(b.c,false,()=>_bgSpringe(b.k),['data-fs-sprung',b.k])));
    return w;
  }

  // Inhalt „Auftrag und Umfang" (ohne eigene Überschrift – die ist der Pfeil-Knopf)
  function _teilAuftragBg(){
    const w=document.createElement('div');
    const hilfen=document.createElement('div');hilfen.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;';
    const hk=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';b.onclick=fn;return b;};
    hilfen.append(hk('↻ aus Karte',()=>_ausKarteKlick()));
    w.append(hilfen,
      _feld('Auftraggeber','auftraggeber','aus der Karte'),
      _feld('Objekt','objektAdresse','aus der Karte'),
      _feld('Auftrag-Nr.','auftragNr',''),
      _feld('Nutzer / Mieter','nutzer',''),
      _feld('Anlass','anlass','z. B. Meldung des Mieters über …'));
    return w;
  }
  /* ── F20: Vorabbesichtigung schlank (Frank 02.10.2026: „zu viele Felder, die ich vielleicht gar nicht brauche oder nur später“) ──────
     Offen: „Vor Ort“ = Besichtigung bei, Lage, Zeit-Knöpfe mit einer Zeile Datum/Uhrzeit, Anlass, Beschreibung des Schadenbildes, Fotos, Vorgeschichte (ein Textfeld).
     Zugeklappt (Standard, aufklappbar): Kartendaten, Versicherung/Zugang, Einzelpunkte, Termin/Wetter, Raumskizze. Daten und PDF unverändert. */
  let _vbZeitAuf=false; // Datum/Beginn/Ende zum Ändern aufgeklappt (nur Anzeige)
  let _vbUmgFuellen=null; // F23: füllt die Umgebungs-Vorschläge neu (gesetzt von _teilUmgebungVb, solange der Abschnitt aufgebaut ist)
  function _vbAltAngaben(){return (bericht.angaben||[]).some(a=>a&&String(a.text||'').trim());} // Protokolle aus F16–F19 mit beantworteten Fragen
  function _teilVorOrtVb(){
    const w=document.createElement('div');w.setAttribute('data-fs-vorort','1');
      const bei=document.createElement('div');bei.setAttribute('data-fs-besuchbei','1');bei.style.cssText='padding:6px 14px 8px;border-top:1px solid var(--border);';
      const bl=document.createElement('div');bl.style.cssText='font-size:var(--fs13,13px);color:var(--text2);margin-bottom:6px;';bl.textContent='Besichtigung bei – wähle den Kontakt für diesen Besuch';bei.appendChild(bl);
      const chips=document.createElement('div');chips.style.cssText='display:flex;flex-wrap:wrap;gap:6px;';
      _fsVbKontakte(t).forEach(k=>{chips.appendChild(_chip(k.text,bericht.kopf.besuchBei===k.text,()=>{
        const an=bericht.kopf.besuchBei===k.text;
        bericht.kopf.besuchBei=an?'':k.text;bericht.kopf.nutzer=an?'':k.name;bericht.kopf.ansprechpartner=an?'':k.kontakt;
        scheduleSave();_neuBauen();}));});
      if(!chips.childNodes.length)chips.appendChild(_bgInfo('Die Karte hat keine Kontakte mit Namen – trage Nutzer und Ansprechpartner von Hand ein.'));
      bei.appendChild(chips);
      const zeitKn=document.createElement('div');zeitKn.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;';
      const zk=(txt,fn,attr)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute(attr,'1');b.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);border:1.5px solid '+FS_FARBE+';background:rgba(31,95,139,.12);color:var(--text);';b.onclick=fn;return b;};
      zeitKn.append(
        zk('📍 Ich bin jetzt hier (Datum + Uhrzeit)',()=>{const j=_fsVbJetzt();bericht.datum=j.datum;bericht.kopf.beginn=j.uhr;scheduleSave();hdrS.textContent=(bericht.kopf.objektAdresse||t.adresse||t.title||'')+' · '+(bericht.datum||'');const tm=(_fsAmPc()&&typeof _pamVbTermin==='function')?_pamVbTermin(bericht,'beginn'):'';_neuBauen();toast('✓ Datum '+j.datum+', Beginn '+j.uhr+' Uhr eingetragen'+(tm?' · '+tm:''),'success',tm?5000:3500);},'data-fs-jetzt-beginn'),
        zk('🏁 Fertig (Ende jetzt)',()=>{const j=_fsVbJetzt();bericht.kopf.ende=j.uhr;scheduleSave();const tm=(_fsAmPc()&&typeof _pamVbTermin==='function')?_pamVbTermin(bericht,'ende'):'';_neuBauen();toast('✓ Ende '+j.uhr+' Uhr eingetragen'+(tm?' · '+tm:''),'success',tm?5000:3500);},'data-fs-jetzt-ende'));
      const zz=document.createElement('div');zz.setAttribute('data-fs-zeitzeile','1');zz.style.cssText='display:flex;align-items:center;gap:10px;padding:2px 14px 8px;font-size:var(--fs14,14px);color:var(--text);';
      const zt=document.createElement('span');zt.style.cssText='flex:1;min-width:0;';const ztx=_fsBgZeitText(bericht.kopf);
      zt.textContent=(String(bericht.datum||'').trim()||'noch kein Datum')+' · '+(ztx||'noch kein Beginn');
      const zb=document.createElement('button');zb.type='button';zb.textContent=_vbZeitAuf?'▲ fertig':'✏ ändern';zb.setAttribute('data-fs-zeitaendern','1');
      zb.style.cssText=S_KNOPF+'min-height:var(--fsh,40px);border:1px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);';zb.onclick=()=>{_vbZeitAuf=!_vbZeitAuf;_neuBauen();};
      zz.append(zt,zb);
      const nameZeile=(()=>{ // F26: Name des Protokolls (Besichtigung 2) – erscheint in der Liste an der Karte, im PDF und im Dateinamen
      const row=document.createElement('div');row.setAttribute('data-fs-protname','1');row.style.cssText='display:flex;align-items:center;gap:10px;padding:6px 14px;';
      const l=document.createElement('span');l.style.cssText='font-size:var(--fs13,13px);color:var(--text2);width:112px;flex-shrink:0;';l.textContent='Name';
      row.append(l,_inp(bericht.protName,'Besichtigung – z. B. Besichtigung Wohnung 2. OG',v=>{bericht.protName=v;hdrT.textContent='💧 '+_fsTitel(bericht);},false));
      return row;
    })();
    w.append(...(bericht.schlank?[nameZeile]:[]).concat([bei],bericht.schlank?[]:[_feld('Lage','lage','z. B. Wohnung darüber, Keller')],[zeitKn,zz])); // F23: Besichtigung 2 ohne Lage · F26: mit Name
      if(_vbZeitAuf){
      const datRow=document.createElement('div');datRow.style.cssText='display:flex;align-items:center;gap:10px;padding:6px 14px;border-top:1px solid var(--border);';
      const dl=document.createElement('span');dl.style.cssText='font-size:var(--fs13,13px);color:var(--text2);width:112px;flex-shrink:0;';dl.textContent='Datum';
      datRow.append(dl,_inp(bericht.datum,'TT.MM.JJJJ',v=>{bericht.datum=v;},false));
      w.append(datRow,_feld('Beginn','beginn','hh:mm'),_feld('Ende','ende','hh:mm'));
      }
    if(bericht.schlank)w.appendChild(_teilAnwesende()); // F24: Besichtigung 2: wer ist noch vor Ort (Name und Rolle; Kontakte der Karte zum Antippen); steht im PDF unter „Anwesend“
    return w;
  }
  // F22: „Gemeldet und vorgefunden“ – der Satz aus der Meldung (Anlass) und ob es so vorgefunden wurde
  function _teilGemeldetVb(){
    const w=document.createElement('div');w.setAttribute('data-fs-gemeldet','1');
    w.appendChild(_feld('Anlass','anlass','z. B. Schaden an der Decke im Wohnzimmer'));
    const wi=_bgInfo('So wurde der Schaden gemeldet. Bestätige, ob du es so vorgefunden hast – nur Feststellung, keine Ursache.');w.appendChild(wi);
    const wahl=document.createElement('div');wahl.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 8px;';
    [['wie','✓ wie gemeldet vorgefunden'],['abw','≠ abweichend vorgefunden']].forEach(x=>{
      const c=_chip(x[1],bericht.meldungStatus===x[0],()=>{bericht.meldungStatus=bericht.meldungStatus===x[0]?'':x[0];scheduleSave();_neuBauen();});
      c.setAttribute('data-fs-meldung',x[0]);wahl.appendChild(c);});
    w.appendChild(wahl);
    if(bericht.meldungStatus==='abw'){
      const ab=document.createElement('div');ab.style.cssText='padding:0 14px 10px;';
      ab.appendChild(_bgTextFeld(bericht.meldungAbw,'Was war anders, z. B. nicht im Wohnzimmer, sondern im Flur …',v=>{bericht.meldungAbw=v;},2));
      w.appendChild(ab);
    }
    return w;
  }
  // F22: Abschnitt „Stelle für Stelle“ (früher Teil von „Vor Ort“); Beschreibung des Schadenbildes nur noch, wenn in einem älteren Protokoll schon Text steht
  function _teilStellenBlockVb(){
    const w=document.createElement('div');
    if(String(bericht.schadenbild||'').trim()){ // F19 (seit F21 nur noch, wenn schon Text da ist)
      const sbk=document.createElement('div');sbk.setAttribute('data-fs-schadenbild','1');sbk.style.cssText='padding:8px 14px 4px;';
      const sbl=document.createElement('div');sbl.style.cssText='font-size:var(--fs14,14px);font-weight:700;color:var(--text);margin-bottom:4px;';sbl.textContent='Beschreibung des Schadenbildes';
      sbk.append(sbl,_bgInfo('Schreibe in eigenen Worten, was du siehst und misst – nur Feststellungen, keine Ursache. Steht im PDF vor den Einzelpunkten.'),_bgTextFeld(bericht.schadenbild,'z. B. Am Balkon steht Wasser, der Ablauf ist mit Laub verstopft …',v=>{bericht.schadenbild=v;},6));
      w.appendChild(sbk);
    }
    w.appendChild(_teilVbStellen());
    return w;
  }
  function _teilVorgeschichteVb(){ // F20 (F22: eigener Abschnitt): Vorgeschichte als EIN Textfeld
    const vg=document.createElement('div');vg.setAttribute('data-fs-vorgeschichte','1');vg.style.cssText='padding:8px 14px 12px;';
    vg.append(_bgInfo('Was Auftraggeber oder Nutzer berichten – nicht selbst festgestellt: seit wann, was ist passiert, frühere Schäden, bisherige Maßnahmen.'),_bgTextFeld(bericht.vorgeschichte,'z. B. Seit zwei Wochen nach jedem Regen …',v=>{bericht.vorgeschichte=v;},4));
    return vg;
  }
  // F21: Feststellungen Stelle für Stelle – F22: Raum · Bauteil · was (Knöpfe) · Einzelheiten · Messwert · Fotos
  function _teilVbStellen(){
    if(!Array.isArray(bericht.vbStellen))bericht.vbStellen=[];
    const w=document.createElement('div');w.setAttribute('data-fs-vbstellen','1');w.style.cssText='padding:8px 14px 10px;';
    w.append(_bgInfo(bericht.schlank?'Für jede Stelle: wo · was siehst du · Foto. Einfach tippen. Nur Feststellungen, keine Ursache.':'Für jede Stelle: Raum · Bauteil · was siehst du (antippen) · Einzelheiten · Messwert · Foto. Nur Feststellungen, keine Ursache.'));
    const lab=t=>{const d=document.createElement('div');d.style.cssText='font-size:var(--fs12,12px);color:var(--text2);margin:6px 0 2px;';d.textContent=t;return d;};
    bericht.vbStellen.forEach((s,si)=>{
      if(!Array.isArray(s.merkmale))s.merkmale=[];if(!Array.isArray(s.fotoRefs))s.fotoRefs=[];
      const k=document.createElement('div');k.setAttribute('data-fs-vbstelle',String(si));
      k.style.cssText='margin:8px 0;padding:8px 10px 10px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg2);';
      const kz=document.createElement('div');kz.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:6px;';
      const nr=document.createElement('div');nr.style.cssText='flex:1;font-size:var(--fs14,14px);font-weight:700;color:var(--text);';nr.textContent='Stelle '+(si+1);
      kz.append(nr,_bgXKnopf('Stelle entfernen',()=>{if(_fsVbStelleGefuellt(s)&&!confirm('Stelle '+(si+1)+' entfernen? Die Fotos bleiben im Protokoll.'))return;bericht.vbStellen.splice(si,1);scheduleSave();_neuBauen();}));
      // Raum (aus der Standardliste und den Räumen der Raumskizze)
      const cur=String(s.raum||'').trim();
      const rn=FS_VB_RAEUME.slice();(bericht.raeume||[]).forEach(r=>{const n=String((r&&r.name)||'').trim();if(n&&rn.indexOf(n)<0)rn.push(n);});if(cur&&rn.indexOf(cur)<0)rn.push(cur);
      const rc=document.createElement('div');rc.setAttribute('data-fs-vbraeume',String(si));rc.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 4px;';
      rn.forEach(n=>{const c=_chip(n,cur===n,()=>{s.raum=cur===n?'':n;scheduleSave();_neuBauen();});c.setAttribute('data-fs-vbraum',n);rc.appendChild(c);});
      const eig=_chip('＋ anderer Raum',false,()=>{const n=prompt('Name des Raums');if(n&&n.trim()){s.raum=n.trim();scheduleSave();_neuBauen();}});eig.setAttribute('data-fs-vbraumneu','1');rc.appendChild(eig);
      // Bauteil
      const ortI=_inp(s.ort,bericht.schlank?'Wo? z. B. Wohnzimmer, Decke':'Bauteil / Ort, z. B. Decke, an der Kehle',v=>{s.ort=v;if(_vbUmgFuellen){try{_vbUmgFuellen();}catch(_e){}}},false);ortI.setAttribute('data-fs-vbort',String(si)); /* F23: Vorschläge der Umgebung laufen mit */
      const oc=document.createElement('div');oc.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 4px;';
      FS_VB_ORTE.forEach(o=>{const c=document.createElement('button');c.type='button';c.textContent='＋ '+o;c.setAttribute('data-fs-vbortvorschlag',o);
        c.style.cssText='padding:4px 9px;min-height:var(--fsh,34px);border-radius:14px;font-size:var(--fs12,12px);cursor:pointer;font-family:inherit;border:1px dashed var(--border);background:transparent;color:var(--text2);';
        c.onclick=()=>{const a=String(s.ort||'').trim();s.ort=a?a+', '+o:o;scheduleSave();_neuBauen();};oc.appendChild(c);});
      const mc=document.createElement('div');mc.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;';
      FS_VB_MERKMALE.forEach(m=>{const an=s.merkmale.indexOf(m)>=0;const c=_chip(m,an,()=>{const i=s.merkmale.indexOf(m);if(i>=0)s.merkmale.splice(i,1);else s.merkmale.push(m);scheduleSave();_neuBauen();});c.setAttribute('data-fs-vbmerkmal',m);mc.appendChild(c);});
      const tx=_bgTextFeld(s.text,bericht.schlank?'Was siehst du? (tippen)':'Einzelheiten, z. B. ca. 40 x 60 cm, Rand bräunlich …',v=>{s.text=v;},bericht.schlank?3:2);
      // Messwert (optional)
      const mg=document.createElement('div');mg.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;margin:6px 0;';
      const mwI=_inp(s.messwert,'Messwert, z. B. 62 Digits',v=>{s.messwert=v;},false);mwI.setAttribute('data-fs-vbmesswert',String(si));
      const geI=_inp(s.geraet,'Gerät, z. B. Trotec BM31WP',v=>{s.geraet=v;},false);geI.setAttribute('data-fs-vbgeraet',String(si));
      mg.append(mwI,geI);
      const fl=_fsFotoLeiste(bericht,{text:'Stelle '+(si+1)+(_fsVbOrtVoll(s)?', '+_fsVbOrtVoll(s):''),fotoRefs:s.fotoRefs},'Fotos zu dieser Stelle',false);
      if(bericht.schlank){tx.style.marginTop='6px';k.append(kz,ortI,tx,fl);}else k.append(kz,lab('Raum'),rc,lab('Bauteil / Ort'),ortI,oc,lab('Was siehst du?'),mc,tx,lab('Messwert (optional)'),mg,fl);w.appendChild(k); // F23: schlank = Wo + Text + Fotos
    });
    const add=document.createElement('button');add.type='button';add.textContent='＋ Stelle';add.setAttribute('data-fs-vbstelleneu','1');
    add.style.cssText=S_KNOPF+'display:block;width:100%;min-height:48px;margin-top:6px;border:1.5px dashed '+FS_FARBE+';background:rgba(31,95,139,.08);color:var(--text);';
    add.onclick=()=>{bericht.vbStellen.push(_fsVbStelleNeu());scheduleSave();_neuBauen();const e=body.querySelector('[data-fs-vbort="'+(bericht.vbStellen.length-1)+'"]');if(e){try{e.scrollIntoView({block:'center'});}catch(_e){}e.focus();}};
    w.appendChild(add);
    return w;
  }
  // F22: Umgebung abgehen – Vorschläge nach dem Bauteil der Stellen; je Zeile ✓ ohne Auffälligkeit · ⚠ auffällig (legt eine Stelle an) · ∅ nicht geprüft
  function _teilUmgebungVb(){
    if(!Array.isArray(bericht.vbUmgebung))bericht.vbUmgebung=[];
    const w=document.createElement('div');w.setAttribute('data-fs-umgebung','1');w.style.cssText='padding:8px 14px 10px;';
    w.appendChild(_bgInfo(bericht.schlank?'Tippe an, was du angesehen hast: ✓ nichts Auffälliges · ⚠ auffällig (legt eine neue Stelle an). Nicht angetippt = nicht angesehen, steht nicht im Bericht.':'Gehe die Umgebung der Stelle ab und halte fest, was du geprüft hast: ✓ ohne Auffälligkeit · ⚠ auffällig (legt eine neue Stelle an) · ∅ nicht geprüft. Nur Feststellungen, keine Ursache.'));
    // F23: die Vorschläge stehen in einem eigenen Behälter; er füllt sich neu, sobald im Feld „Wo?“ getippt wird (Frank: sonst erscheinen sie erst nach dem nächsten Neuaufbau)
    const vz=document.createElement('div');vz.setAttribute('data-fs-umgvorschlaege','1');
    const fuelleVorschlaege=function(){
      vz.innerHTML='';
      const beide=!!bericht.schlank&&_fsB2Sichtbar(bericht,'innen')&&_fsB2Sichtbar(bericht,'aussen');
      const vs=bericht.schlank?_fsVbUmgebungVorschlaegeB2(bericht):_fsVbUmgebungVorschlaege(bericht).map(v=>({text:v,bereich:'innen'})); // F28: Besichtigung 2 mit Innen/Außen
      if(vs.length){
        const vc=document.createElement('div');vc.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:6px 0;';
        const neuZeile=v=>{bericht.vbUmgebung.push({text:v.text,bereich:v.bereich,status:'',grund:'',stelle:false});};
        vs.forEach(v=>{const c=document.createElement('button');c.type='button';c.textContent='＋ '+(beide?(v.bereich==='aussen'?'Außen: ':'Innen: '):'')+v.text;c.setAttribute('data-fs-umgvorschlag',v.text);
          c.style.cssText='padding:4px 9px;min-height:var(--fsh,34px);border-radius:14px;font-size:var(--fs12,12px);cursor:pointer;font-family:inherit;border:1px dashed var(--border);background:transparent;color:var(--text2);';
          c.onclick=()=>{neuZeile(v);scheduleSave();_neuBauen();};vc.appendChild(c);});
        const alle=document.createElement('button');alle.type='button';alle.textContent='＋ alle '+vs.length+' übernehmen';alle.setAttribute('data-fs-umgalle','1');
        alle.style.cssText='padding:4px 10px;min-height:var(--fsh,34px);border-radius:14px;font-size:var(--fs12,12px);font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid '+FS_FARBE+';background:rgba(31,95,139,.1);color:var(--text);';
        alle.onclick=()=>{vs.forEach(neuZeile);scheduleSave();_neuBauen();};vc.appendChild(alle);
        vz.appendChild(vc);
      }else if(!bericht.vbUmgebung.length)vz.appendChild(_bgInfo('Vorschläge erscheinen, sobald bei einer Stelle ein Bauteil steht (z. B. Decke, Wand, Dach).'));
    };
    fuelleVorschlaege();_vbUmgFuellen=fuelleVorschlaege;w.appendChild(vz);
    bericht.vbUmgebung.forEach((r,ri)=>{
      if(bericht.schlank&&!_fsB2Sichtbar(bericht,r.bereich==='aussen'?'aussen':'innen'))return; /* F28: ausgeblendeter Teil */
      const k=document.createElement('div');k.setAttribute('data-fs-umgzeile',String(ri));
      k.style.cssText='margin:6px 0;padding:8px 10px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg2);';
      const kz=document.createElement('div');kz.style.cssText='display:flex;align-items:center;gap:8px;';
      const nm=document.createElement('div');nm.style.cssText='flex:1;min-width:0;font-size:var(--fs14,14px);font-weight:700;color:var(--text);';nm.textContent=(bericht.schlank?(r.bereich==='aussen'?'🌤 ':'🏠 '):'')+(r.text||'(ohne Text)');
      kz.append(nm,_bgXKnopf('Zeile entfernen',()=>{if(r.status&&!confirm('Zeile „'+(r.text||'')+'" entfernen?'))return;bericht.vbUmgebung.splice(ri,1);scheduleSave();_neuBauen();}));
      const wahl=document.createElement('div');wahl.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;';
      [['ok','✓ ohne Auffälligkeit'],['auff','⚠ auffällig']].concat(bericht.schlank?[]:[['nicht','∅ nicht geprüft']]).forEach(x=>{ // F23: Besichtigung 2 nur ✓ / ⚠
        const c=_chip(x[1],r.status===x[0],()=>{
          r.status=r.status===x[0]?'':x[0];
          let tm='';
          if(r.status==='auff'&&!r.stelle){r.stelle=true;const sn=_fsVbStelleNeu();sn.ort=String(r.text||'').trim();if(bericht.schlank){sn.typ=(r.bereich==='aussen')?'aussen':'innen';sn.raum=(sn.typ==='aussen')?_fsB2BereichFuerText(sn.ort):'Umgebung';}bericht.vbStellen.push(sn);tm='Neue Stelle angelegt: '+(bericht.schlank?(sn.typ==='aussen'?'Außen – '+sn.raum+' – ':'Umgebung – '):'')+sn.ort;} // F24, F28: Außen-Zeilen kommen nach „Außen“ (Bereich nach dem Text), Innen-Zeilen unter „Umgebung“
          scheduleSave();_neuBauen();if(tm)toast('⚠ '+tm,'info',4500);
        });c.setAttribute('data-fs-umgstatus',x[0]);wahl.appendChild(c);});
      k.append(kz,wahl);
      if(r.status==='nicht'){const g=_inp(r.grund,'Grund, z. B. Wohnung nicht zugänglich',v=>{r.grund=v;},false);g.setAttribute('data-fs-umggrund',String(ri));g.style.marginTop='6px';k.appendChild(g);}
      w.appendChild(k);
    });
    const eg=document.createElement('div');eg.style.cssText='display:flex;gap:6px;margin-top:8px;';
    const ei=_inp('','Eigene Zeile, z. B. Heizungsrohr im Flur',()=>{},false);ei.setAttribute('data-fs-umgeigen','1');
    const eb=document.createElement('button');eb.type='button';eb.textContent='＋ Zeile';eb.setAttribute('data-fs-umgeigenneu','1');
    eb.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);flex-shrink:0;border:1.5px dashed '+FS_FARBE+';background:rgba(31,95,139,.08);color:var(--text);';
    eb.onclick=()=>{const t=String(ei.value||'').trim();if(!t)return;bericht.vbUmgebung.push({text:t,bereich:(bericht.schlank&&!_fsB2Sichtbar(bericht,'innen'))?'aussen':'innen',status:'',grund:'',stelle:false});scheduleSave();_neuBauen();};
    eg.append(ei,eb);w.appendChild(eg);
    return w;
  }
  // F24, F28: Besichtigung 2 – Feststellungen INNEN (Raum als Überschrift) und AUSSEN (Bereich als Überschrift); Haken zum Ein-/Ausblenden; Innen zuerst.
  // Je Stelle: wo · Seite (freiwillig, mit Kompassnadel) · was siehst du · von außen markieren (Luftbild, groß – auch bei Innen: wo regnet es herein) · Fotos
  function _teilVbStellenB2(){
    if(!Array.isArray(bericht.vbStellen))bericht.vbStellen=[];
    const w=document.createElement('div');w.setAttribute('data-fs-vbstellen','1');w.style.cssText='padding:8px 14px 10px;';
    w.append(_bgInfo('Innen oder Außen – und darin die Stellen: wo · Seite (freiwillig) · was siehst du · von außen markieren · Foto. Nur Feststellungen, keine Ursache.'));
    const hk=document.createElement('div');hk.setAttribute('data-fs-b2haken','1');hk.style.cssText='display:flex;flex-wrap:wrap;gap:16px;padding:2px 0 6px;font-size:var(--fs15,15px);';
    [['innen','🏠 Innen besichtigen','data-fs-b2innen','zeigeInnen','zeigeAussen'],['aussen','🌤 Außen besichtigen','data-fs-b2aussen','zeigeAussen','zeigeInnen']].forEach(x=>{
      const l=document.createElement('label');l.style.cssText='display:flex;align-items:center;gap:8px;min-height:var(--fsh,40px);cursor:pointer;';
      const c=document.createElement('input');c.type='checkbox';c.checked=bericht[x[3]]!==false;c.setAttribute(x[2],'1');c.style.cssText='width:22px;height:22px;';
      c.onchange=()=>{if(!c.checked&&bericht[x[4]]===false){c.checked=true;toast('Innen oder Außen bleibt mindestens eins an','info',3500);return;}bericht[x[3]]=c.checked;scheduleSave();_neuBauen();};
      l.append(c,document.createTextNode(x[1]));hk.appendChild(l);
    });
    w.appendChild(hk);
    const neueStelle=(typ,gruppe)=>{bericht.vbStellen.forEach(x=>{if(x)_fsStelleSetzen(x,false);});const sn=_fsVbStelleNeu();sn.typ=typ;sn.raum=gruppe;sn.seite='';sn.seiteGrad=null;_fsStelleSetzen(sn,true);bericht.vbStellen.push(sn);scheduleSave();_neuBauen();const e=body.querySelector('[data-fs-vbort="'+(bericht.vbStellen.length-1)+'"]');if(e){try{e.scrollIntoView({block:'center'});}catch(_e){}e.focus();}};
    const stelleKarte=(s,si,typ)=>{
      if(!Array.isArray(s.merkmale))s.merkmale=[];if(!Array.isArray(s.fotoRefs))s.fotoRefs=[];
      const farbe=typ==='aussen'?'#d9480f':FS_FARBE;
      const k=document.createElement('div');k.setAttribute('data-fs-vbstelle',String(si));k.setAttribute('data-fs-typ',typ);
      k.style.cssText='margin:8px 0;padding:8px 10px 10px;border:1.5px solid var(--border);border-left:var(--fs-kante,4px) solid '+farbe+';border-radius:10px;background:var(--fs-karte,var(--bg2));box-shadow:var(--fs-schatten,none);'; /* F38: klar vom Hintergrund abgesetzt */ /* F35: ein ruhiger Rahmen, die Kante links zeigt innen (blau) / außen (orange) */
      const offen=_fsStelleOffen(bericht,s); /* F30 */
      const kz=document.createElement('div');kz.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:'+(offen?'6':'0')+'px;';
      const nr=document.createElement('button');nr.type='button';nr.setAttribute('data-fs-stellekopf',String(si));nr.setAttribute('aria-expanded',offen?'true':'false');
      nr.style.cssText='flex:1;min-width:0;min-height:var(--fsh,40px);text-align:left;font-size:var(--fs14,14px);font-weight:700;color:var(--text);background:transparent;border:none;padding:0;cursor:pointer;font-family:inherit;'+(offen?'':'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;');
      nr.textContent=(offen?'▾ ':'▸ ')+(offen?_fsStelleNrText(bericht,s):_fsStelleKurz(bericht,s,si+1,true)); /* F35: der Raum/Bereich steht in der Überschrift darüber – hier nur „Stelle n“ */
      nr.title=_fsVbBezeichnung(bericht,s,si+1);
      nr.onclick=()=>{_fsStelleSetzen(s,!offen);_neuBauen();};
      kz.append(nr,_bgXKnopf('Stelle entfernen',()=>{if(_fsVbStelleGefuelltS(s)&&!confirm(_fsVbBezeichnung(bericht,s,si+1)+' entfernen? Die Fotos bleiben im Protokoll.'))return;bericht.vbStellen.splice(si,1);scheduleSave();_neuBauen();}));
      if(!offen){k.append(kz);return k;} /* F30: zugeklappt = nur die Zeile */
      const ortI=_inp(s.ort,typ==='aussen'?'Wo? z. B. Kehle über dem Wohnzimmer, linke Ecke':'Wo? z. B. Decke, Eckbereich Wand 1 / Wand 2',v=>{s.ort=v;if(_vbUmgFuellen){try{_vbUmgFuellen();}catch(_e){}}},false);ortI.setAttribute('data-fs-vbort',String(si));
      // Seite (freiwillig): Himmelsrichtung oder Straßenseite/Hofseite/Giebel; Kompassnadel misst als Vorschlag
      const sb=document.createElement('div');sb.setAttribute('data-fs-seite',String(si));sb.style.cssText='margin:8px 0 2px;';
      const sl=document.createElement('div');sl.style.cssText='font-size:var(--fs12,12px);color:var(--text2);';sl.textContent='Seite (freiwillig) – '+(typ==='aussen'?'welche Richtung zeigt die Wand bzw. Fläche?':'von außen gesehen: wo kommt es herein?');
      const sc=document.createElement('div');sc.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:4px 0;';
      FS_B2_SEITEN.concat(FS_B2_SEITENEXTRA).forEach(kk=>{const c=_chip(kk,s.seite===kk,()=>{s.seite=s.seite===kk?'':kk;s.seiteGrad=null;_fsSeiteAuf.delete(s);scheduleSave();_neuBauen();});c.setAttribute('data-fs-seiteknopf',kk);c.style.minHeight='var(--fsh,38px)';c.style.padding='4px 12px';sc.appendChild(c);});
      /* F31: die Seite steht in EINER Zeile („Seite  Südost  [ändern] [🧭]“); die elf Knöpfe klappen erst auf „ändern/wählen“ auf und nach der Wahl wieder zu */
      const sw=document.createElement('div');sw.setAttribute('data-fs-seitewahlbox','1');sw.style.display=_fsSeiteAuf.has(s)?'':'none';sw.append(sl,sc);
      const sz=document.createElement('div');sz.setAttribute('data-fs-seitezeile','1');sz.style.cssText='display:flex;align-items:center;gap:8px;min-height:var(--fsh44,44px);padding:4px 10px;border:1.5px solid var(--border);border-radius:10px;';
      const szl=document.createElement('span');szl.style.cssText='font-size:var(--fs12,12px);color:var(--text2);flex-shrink:0;';szl.textContent='Seite';
      const szw=document.createElement('span');szw.setAttribute('data-fs-seitewert','1');szw.style.cssText='flex:1;min-width:0;font-size:var(--fs14,14px);'+(_fsSeiteText(s.seite)?'font-weight:700;color:var(--text);':'color:var(--text2);');szw.textContent=_fsSeiteZeile(s);
      const S_MINI='flex-shrink:0;min-height:var(--fsh,36px);padding:4px 12px;border-radius:10px;border:1.5px solid var(--fs-krd,#1f5f8b);background:var(--fs-kfl,transparent);color:var(--text);font-size:var(--fs14,14px);cursor:pointer;font-family:inherit;';
      const saText=()=>_fsSeiteAuf.has(s)?'▾ zu':(_fsSeiteText(s.seite)?'ändern':'wählen');
      const sa=document.createElement('button');sa.type='button';sa.setAttribute('data-fs-seiteaendern','1');sa.setAttribute('aria-expanded',_fsSeiteAuf.has(s)?'true':'false');sa.style.cssText=S_MINI;sa.textContent=saText();
      sa.onclick=()=>{if(_fsSeiteAuf.has(s))_fsSeiteAuf.delete(s);else _fsSeiteAuf.add(s);const a=_fsSeiteAuf.has(s);sw.style.display=a?'':'none';sa.setAttribute('aria-expanded',a?'true':'false');sa.textContent=saText();};
      const sk=document.createElement('button');sk.type='button';sk.setAttribute('data-fs-seitekompass','1');sk.title='Seite messen (Kompass)';sk.setAttribute('aria-label','Seite messen (Kompass)');sk.style.cssText=S_MINI+(_fsNadelAuf.has(s)?'background:rgba(31,95,139,.22);':'');sk.textContent='🧭';
      sz.append(szl,szw,sa,sk);sb.append(sz,sw);
      if(s.seite&&typeof s.seiteGrad==='number')sw.appendChild(_bgInfo('Gemessen mit dem Kompass: '+Math.round(s.seiteGrad)+'° ('+_fsSeiteText(s.seite)+').'));
      const nb=_fsNadelBox(s,()=>_neuBauen(),typ);sb.appendChild(nb); /* F29: zugeklappt; drinnen/draußen rechnet verschieden */
      const nk=typeof nb.querySelector==='function'?nb.querySelector('[data-fs-nadelkopf]'):null; /* F31: der 🧭-Knopf in der Seiten-Zeile klappt den Kompass auf und zu, die eigene Kopfzeile des Kompasses entfällt */
      if(nk){nk.style.display='none';sk.onclick=()=>{nk.click();sk.style.background=_fsNadelAuf.has(s)?'rgba(31,95,139,.22)':'var(--fs-kfl,transparent)';};}else sk.style.display='none';
      const tx=_bgTextFeld(s.text,'Was siehst du? (tippen)',v=>{s.text=v;},3);tx.style.marginTop='6px';
      const pin=_fsVbPinOk(s);
      const lb=document.createElement('button');lb.type='button';lb.setAttribute('data-fs-lbknopf',String(si));
      const lbLang=pin?'📍 Von außen markiert – Luftbild öffnen':'🛰 Von außen markieren'+(typ==='innen'?' – wo kommt es herein? (Luftbild)':' (Luftbild)');
      lb.textContent=pin?'📍 markiert':'🛰 Luftbild';lb.title=lbLang;lb.setAttribute('aria-label',lbLang); /* F31: kurzer Knopf neben „Foto“, der lange Text bleibt als Hinweis */
      lb.style.cssText=S_KNOPF+'flex:1 1 120px;min-width:0;min-height:var(--fsh44,44px);border:1.5px solid '+farbe+';background:'+(pin?'rgba(46,125,79,.15)':'var(--fs-lbfl,rgba(217,72,15,.08))')+';color:var(--text);font-weight:700;';
      lb.onclick=()=>_fsLuftbildFenster(bericht,t,s,()=>_neuBauen());
      const se=_fsSeiteText(s.seite);
      const fl=_fsFotoLeiste(bericht,{text:_fsVbBezeichnung(bericht,s,si+1)+(se?' – Seite '+se:'')+(String(s.ort||'').trim()?' – '+String(s.ort).trim():''),fotoRefs:s.fotoRefs},'Fotos zu dieser Stelle',false,lb);
      k.append(kz,ortI,sb,tx,fl);
      return k;
    };
    /* F33: AUSSENSKIZZE je Bereich (Frank 03.10.2026: „bei Raumskizze kann ich nur Räume auswählen, wenn ich aber draußen die Skizze machen will …“ → Entwurf → „bau“).
       Zugeklappt eine Zeile je Skizze; offen: Name, Fläche (Wand von vorn / Dachfläche von oben), Vorschau, „Einzeichnen“ (Stellen als Nummern, Stempel, Striche), Legende. */
    const asBlock=(bereich,mitKnopf,typ)=>{ /* F36: typ innen/außen */
      const wr=document.createElement('div');wr.setAttribute('data-fs-asblock',bereich);
      _fsAsFuerBereich(bericht,bereich,typ).forEach(sk=>{
        const auf=_fsAsAuf.has(sk);
        const k=document.createElement('div');k.setAttribute('data-fs-as',sk.id);k.style.cssText='margin:6px 0;padding:6px 10px '+(auf?'10':'6')+'px;border:1.5px solid '+(auf?'var(--border)':'transparent')+';border-radius:10px;background:var(--bg2);'; /* F35: kein gestrichelter Rahmen */
        const kopf=document.createElement('button');kopf.type='button';kopf.setAttribute('data-fs-askopf',sk.id);kopf.setAttribute('aria-expanded',auf?'true':'false');
        kopf.style.cssText='display:block;width:100%;min-height:var(--fsh,40px);text-align:left;font-size:var(--fs14,14px);font-weight:700;color:var(--text);background:transparent;border:none;padding:0;cursor:pointer;font-family:inherit;'+(auf?'':'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;');
        if(auf)kopf.textContent='▾ ✏ '+_fsAsKurz(bericht,sk);
        else{ /* F35: zugeklappt = Mini-Bild + Text, damit eine Skizze nicht wie eine Stelle aussieht */
          kopf.style.display='flex';kopf.style.alignItems='center';kopf.style.gap='10px';
          const mu=_fsAsMini(bericht,sk);
          if(mu){const mi=document.createElement('img');mi.alt='';mi.src=mu;mi.setAttribute('data-fs-asmini',sk.id);mi.style.cssText='width:56px;height:40px;object-fit:cover;border-radius:5px;border:1px solid var(--border);background:#fff;flex-shrink:0;pointer-events:none;';kopf.appendChild(mi);}
          const kt=document.createElement('span');kt.style.cssText='flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';kt.textContent=_fsAsKurz(bericht,sk);
          const kp=document.createElement('span');kp.textContent='▸';kp.style.cssText='color:var(--text2);flex-shrink:0;';
          kopf.append(kt,kp);
        }
        kopf.onclick=()=>{if(auf)_fsAsAuf.delete(sk);else _fsAsAuf.add(sk);_neuBauen();};
        k.appendChild(kopf);
        if(!auf){wr.appendChild(k);return;}
        const bild=document.createElement('img');bild.setAttribute('data-fs-asbild',sk.id);bild.alt='Skizze außen';
        bild.style.cssText='display:block;width:100%;max-width:560px;margin:8px 0 4px;border:1px solid var(--border);border-radius:8px;background:#fff;cursor:pointer;';
        const zeichne=()=>{const u=_fsBgSkizzeBild(bericht,_fsAsPseudoRaum(sk));if(u)bild.src=u;};
        const oeffnen=()=>_fsBgEinzeichnenZeigen(bericht,_fsAsPseudoRaum(sk),()=>{_neuBauen();});
        const nm=_inp(sk.name,'Name der Skizze, z. B. Wand Straßenseite',v=>{sk.name=v;zeichne();},false);nm.setAttribute('data-fs-asname',sk.id);
        const fz=document.createElement('div');fz.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 2px;';
        _fsAsFlaechen(sk).forEach(f=>{const c=_chip(f.t,sk.aussen===f.k,()=>{if(sk.aussen===f.k)return;if(_fsBgStempelAnzahl(sk)&&!confirm('Die gesetzten Stempel bleiben stehen, passen aber zur anderen Ansicht. Trotzdem wechseln?'))return;sk.aussen=f.k;scheduleSave();_neuBauen();});c.setAttribute('data-fs-asflaeche',f.k);c.style.minHeight='var(--fsh,38px)';fz.appendChild(c);});
        k.append(nm,fz);
        if(sk.aussen==='dach'){
          const ol=document.createElement('div');ol.style.cssText='font-size:var(--fs12,12px);color:var(--text2);margin-top:6px;';ol.textContent='Oben in der Skizze ist (freiwillig):';
          const oc=document.createElement('div');oc.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:4px 0;';
          FS_B2_SEITEN.forEach(kk=>{const c=_chip(kk,sk.oben===kk,()=>{sk.oben=sk.oben===kk?'':kk;scheduleSave();_neuBauen();});c.setAttribute('data-fs-asoben',kk);c.style.minHeight='var(--fsh,38px)';c.style.padding='4px 12px';oc.appendChild(c);});
          k.append(ol,oc);
        }
        bild.onclick=oeffnen;zeichne();k.appendChild(bild);
        const ez=document.createElement('button');ez.type='button';ez.setAttribute('data-fs-aszeichnen',sk.id);ez.textContent='✏ Einzeichnen – Stellen als Nummern, Stempel, Striche';
        ez.style.cssText=S_KNOPF+'display:block;width:100%;min-height:48px;margin:4px 0;border:1.5px solid #d9480f;background:rgba(217,72,15,.08);color:var(--text);text-align:left;';
        ez.onclick=oeffnen;k.appendChild(ez);
        const mk=_fsAsMarken(bericht,sk);
        if(mk.length){const lg=document.createElement('div');lg.setAttribute('data-fs-aslegende',sk.id);lg.style.cssText='font-size:var(--fs14,14px);color:var(--text);margin:6px 0 2px;';mk.forEach(q=>{const z=document.createElement('div');z.style.cssText='padding:2px 0;';const nf=(Array.isArray(q.s.fotoRefs)?q.s.fotoRefs:[]).filter(r=>(bericht.fotos||[]).some(f=>_fsRefPasst(f,r))).length;z.textContent=q.n+' = '+q.label+(String(q.s.ort||'').trim()?' · '+String(q.s.ort).trim():'')+(nf?' · 📷 '+nf:'');lg.appendChild(z);});k.appendChild(lg);}
        else{const hi=document.createElement('div');hi.style.cssText='font-size:var(--fs12,12px);color:var(--text2);margin:4px 0;';hi.textContent='Noch keine Stelle in der Skizze – „Einzeichnen“ antippen, oben eine Stelle wählen und in die Skizze tippen.';k.appendChild(hi);}
        const nh=document.createElement('div');nh.style.cssText='font-size:var(--fs12,12px);color:var(--text2);margin:4px 0;line-height:1.4;';nh.textContent='Nicht maßstäblich. Die Nummern sind die Stellen dieses Bereichs – ihre Fotos hängen an der Stelle. Im PDF steht die Skizze nur, wenn etwas eingezeichnet ist.';k.appendChild(nh);
        const weg=document.createElement('button');weg.type='button';weg.setAttribute('data-fs-asweg',sk.id);weg.textContent='✕ Skizze entfernen';
        weg.style.cssText=S_KNOPF+'display:block;width:100%;margin-top:6px;border:1px solid var(--border);background:transparent;color:var(--text2);';
        weg.onclick=()=>{if(_fsAsBenutzt(bericht,sk)&&!confirm('Skizze „'+(String(sk.name||'').trim()||'Außen')+'“ entfernen? Stempel, Striche und die Nummern in der Skizze gehen verloren. Die Stellen und ihre Fotos bleiben.'))return;_fsAsWeg(bericht,sk);scheduleSave();_neuBauen();};
        k.appendChild(weg);wr.appendChild(k);
      });
      const neuK=document.createElement('button');neuK.type='button';neuK.setAttribute('data-fs-asneu',bereich);neuK.textContent='＋ Skizze für '+(bereich||(typ==='innen'?'diesen Raum':'Außen'));
      neuK.style.cssText=S_KNOPF+'display:block;width:100%;min-height:var(--fsh,42px);margin:4px 0;border:1.5px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);';
      neuK.onclick=()=>{const sk=_fsAsNeu(bericht,bereich,typ);if(!sk){toast('Genug Skizzen in diesem Protokoll – bitte eine entfernen','info',3500);return;}_fsAsAuf.add(sk);scheduleSave();_neuBauen();};
      wr._fsNeuKnopf=neuK;if(mitKnopf!==false)wr.appendChild(neuK); /* F35: im Bereich mit Stellen wandert der Knopf in die Knopf-Zeile */
      return wr;
    };
    ['innen','aussen'].forEach(typ=>{
      if(!_fsB2Sichtbar(bericht,typ))return;
      const farbe=typ==='aussen'?'#d9480f':FS_FARBE;
      const sek=document.createElement('div');sek.setAttribute('data-fs-b2teil',typ);
      const th=document.createElement('div');th.style.cssText='font-size:var(--fs17,17px);font-weight:700;color:var(--text);margin:14px 0 4px;padding-bottom:3px;border-bottom:3px solid '+farbe+';';th.textContent=typ==='innen'?'🏠 Innen':'🌤 Außen';
      sek.appendChild(th);
      _fsVbRaumGruppen(bericht,typ).forEach(gr=>{
        const box=document.createElement('div');box.setAttribute('data-fs-raumgruppe',gr.raum);box.setAttribute('data-fs-typ',typ);box.style.cssText='margin:10px 0 4px;';
        const rk=document.createElement('div');rk.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:2px 0 4px;border-bottom:2px solid '+farbe+';';
        const rn=document.createElement('div');rn.style.cssText='flex:1;min-width:0;font-size:var(--fs16,16px);font-weight:700;color:var(--text);';rn.textContent=gr.raum||(typ==='aussen'?'Außen':'Ohne Raum');
        const re=document.createElement('button');re.type='button';re.textContent='✎';re.title=typ==='aussen'?'Bereich umbenennen':'Raum umbenennen';re.setAttribute('aria-label',re.title);re.setAttribute('data-fs-raumumbenennen',gr.raum); /* F35: kleines Stift-Symbol statt großem Knopf */
        re.style.cssText=S_KNOPF+'min-height:var(--fsh,40px);min-width:var(--fsh,44px);padding:4px 8px;font-size:var(--fs17,17px);border:1.5px solid var(--fs-krd,transparent);background:var(--fs-kfl,transparent);color:var(--text);'; /* F38: ein richtiger Knopf mit Rahmen */
        re.onclick=()=>{const n=prompt('Neuer Name für „'+(gr.raum||'Ohne Raum')+'“',gr.raum);if(n===null)return;const nn=String(n).trim();_fsAsListe(bericht).forEach(k=>{if(_fsAsTyp(k)===typ&&k.bereich===gr.raum)k.bereich=nn;});gr.stellen.forEach(x=>{x.s.raum=nn;});scheduleSave();_neuBauen();}; /* F33: die Skizzen des Bereichs gehen mit */
        if(gr.stellen.length>1){ /* F30: alle zuklappen / aufklappen */
          const anyAuf=gr.stellen.some(x=>_fsStelleOffen(bericht,x.s));
          const ak=document.createElement('button');ak.type='button';ak.setAttribute('data-fs-gruppealle',gr.raum);ak.textContent=anyAuf?'▾ alle zu':'▸ alle auf';
          ak.style.cssText=S_KNOPF+'min-height:var(--fsh,36px);padding:4px 10px;font-size:var(--fs13,13px);border:1px solid var(--border);background:transparent;color:var(--text2);';
          ak.onclick=()=>{gr.stellen.forEach(x=>_fsStelleSetzen(x.s,!anyAuf));_neuBauen();};
          rk.append(rn,ak,re);
        }else rk.append(rn,re);
        box.appendChild(rk);sek.appendChild(box);
        gr.stellen.forEach(({s,si})=>box.appendChild(stelleKarte(s,si,typ)));
        const plus=document.createElement('button');plus.type='button';const plusLang='＋ Stelle in '+(gr.raum||(typ==='aussen'?'Außen':'diesem Raum'));plus.textContent='＋ Stelle';plus.title=plusLang;plus.setAttribute('aria-label',plusLang);plus.setAttribute('data-fs-stelleinraum',gr.raum); /* F35: kurz – der Name steht in der Überschrift */
        const S_AKT=S_KNOPF+'flex:1 1 120px;min-width:0;min-height:var(--fsh,42px);border:1.5px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);';
        plus.style.cssText=S_AKT;
        plus.onclick=()=>neueStelle(typ,gr.raum);
        const akt=document.createElement('div');akt.setAttribute('data-fs-gruppeakt',gr.raum);akt.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 2px;'; /* F35: EINE Zeile – „＋ Stelle“ und (außen) „＋ Skizze“ */
        akt.appendChild(plus);
        { /* F33: Skizzen des Bereichs; F35: ihr Anlege-Knopf steht in der Knopf-Zeile; F36: innen genauso (Skizzen des Raums) */
          const ab=asBlock(gr.raum,false,typ);box.appendChild(ab);
          const nk=ab._fsNeuKnopf;nk.title=nk.textContent;nk.setAttribute('aria-label',nk.textContent);nk.textContent='＋ Skizze';nk.style.cssText=S_AKT;
          akt.appendChild(nk);
        }
        box.appendChild(akt);
      });
      { /* F33: Skizzen, deren Bereich keine Stelle mehr hat, bleiben sichtbar (sonst ließen sie sich nicht mehr entfernen); F36: innen genauso */
        const da=_fsVbRaumGruppen(bericht,typ).map(g=>g.raum);
        _fsAsListe(bericht).filter(k=>_fsAsTyp(k)===typ).map(k=>k.bereich).filter((v,i,a)=>a.indexOf(v)===i&&da.indexOf(v)<0).forEach(bn=>{
          const box=document.createElement('div');box.setAttribute('data-fs-asohnestelle',bn);box.style.cssText='margin:10px 0 4px;';
          const rn=document.createElement('div');rn.style.cssText='font-size:var(--fs16,16px);font-weight:700;color:var(--text);padding:2px 0 4px;border-bottom:2px solid '+farbe+';';rn.textContent=(bn||(typ==='innen'?'Raum':'Außen'))+' (nur Skizze, keine Stelle)';
          box.append(rn,asBlock(bn,true,typ));sek.appendChild(box);
        });
      }
      const daNamen=_fsVbRaumGruppen(bericht,typ).map(g=>g.raum),vorhanden=daNamen.length>0;
      const lr=document.createElement('div');lr.style.cssText='font-size:var(--fs13,13px);color:var(--text2);margin:12px 0 4px;';
      lr.textContent=typ==='innen'?(vorhanden?'Weiterer Raum – antippen und eine Stelle darin anlegen:':'Raum wählen – dann legst du darin die erste Stelle an:'):(vorhanden?'Weiterer Bereich – antippen und eine Stelle darin anlegen:':'Bereich wählen – dann legst du darin die erste Stelle an:');
      const rc=document.createElement('div');rc.setAttribute(typ==='innen'?'data-fs-raumwahl':'data-fs-bereichwahl','1');rc.style.cssText='display:flex;flex-wrap:wrap;gap:6px;';
      const namen=(typ==='innen'?FS_B2_RAEUME:FS_B2_BEREICHE).slice();
      if(typ==='innen')(bericht.raeume||[]).forEach(r=>{const n=String((r&&r.name)||'').trim();if(n&&namen.indexOf(n)<0)namen.push(n);});
      _fsWeitereNamen(namen,daNamen).forEach(n=>{const c=_chip('＋ '+n,false,()=>{_fsWeiterSetzen(bericht,typ,false);neueStelle(typ,n);});c.setAttribute(typ==='innen'?'data-fs-raumneu':'data-fs-bereichneu',n);rc.appendChild(c);});
      const eig=_chip(typ==='innen'?'＋ anderer Raum':'＋ anderer Bereich',false,()=>{const n=prompt(typ==='innen'?'Name des Raums':'Name des Bereichs');if(n&&n.trim()){_fsWeiterSetzen(bericht,typ,false);neueStelle(typ,n.trim());}});eig.setAttribute('data-fs-raumneuname',typ);rc.appendChild(eig);
      if(vorhanden){ /* F35: gibt es schon einen Raum/Bereich, steht die Auswahl hinter EINEM Knopf; beim leeren Protokoll bleibt sie offen (kein zusätzlicher Tipp) */
        const wk=document.createElement('button');wk.type='button';wk.setAttribute('data-fs-weiter',typ);
        const wText=()=>'＋ weiterer '+(typ==='innen'?'Raum':'Bereich')+(_fsWeiterOffen(bericht,typ)?' ▾':' ▸');
        wk.style.cssText=S_KNOPF+'display:block;width:100%;min-height:var(--fsh,42px);margin:14px 0 4px;padding:0 12px;text-align:left;border:1.5px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);';
        wk.setAttribute('aria-expanded',_fsWeiterOffen(bericht,typ)?'true':'false');wk.textContent=wText();
        rc.style.display=_fsWeiterOffen(bericht,typ)?'flex':'none';
        wk.onclick=()=>{const a=!_fsWeiterOffen(bericht,typ);_fsWeiterSetzen(bericht,typ,a);rc.style.display=a?'flex':'none';wk.setAttribute('aria-expanded',a?'true':'false');wk.textContent=wText();};
        sek.append(wk,rc);
      }else sek.append(lr,rc);
      w.appendChild(sek);
    });
    return w;
  }
  // F23: Besichtigung 2 – ein Abschnitt „Feststellungen“: Stellen (wo · was · Fotos) und darunter „Umgebung abgehen“
  function _teilFeststellungenB2(){
    const w=document.createElement('div');
    w.appendChild(_teilVbStellenB2());
    const h=document.createElement('div');h.setAttribute('data-fs-b2umgebung','1');h.style.cssText='font-size:var(--fs14,14px);font-weight:700;color:var(--text);padding:8px 14px 0;border-top:1px solid var(--border);margin-top:6px;';h.textContent='Umgebung abgehen';
    w.append(h,_teilUmgebungVb());
    return w;
  }
  // F22: Ergebnis der Eingrenzung – entsteht von selbst, nichts auszufüllen; steht so im PDF
  function _teilErgebnisVb(){
    const w=document.createElement('div');w.setAttribute('data-fs-eingrenzung','1');w.style.cssText='padding:8px 14px 10px;';
    const mz=_fsVbMeldungZeile(bericht),ez=_fsVbErgebnisZeilen(bericht);
    if(!mz&&!ez.length){w.appendChild(_bgInfo('Noch nichts erfasst. Das Ergebnis entsteht von selbst aus „Gemeldet“, den Stellen und der Umgebung.'));return w;}
    w.appendChild(_bgInfo('Entsteht von selbst aus Stellen und Umgebung – so steht es im PDF.'));
    [mz].concat(ez).filter(Boolean).forEach(z=>{const d=document.createElement('div');d.style.cssText='font-size:var(--fs14,14px);color:var(--text);margin:4px 0;';d.textContent=z;w.appendChild(d);});
    return w;
  }
  function _teilKarteVb(){ // F20: kommt aus der Karte – nur zur Kontrolle
    const w=document.createElement('div');
    const hilfen=document.createElement('div');hilfen.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;';
    const b=document.createElement('button');b.type='button';b.textContent='↻ aus Karte';b.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';b.onclick=()=>_ausKarteKlick();
    hilfen.appendChild(b);
    w.append(hilfen,_feld('Auftraggeber','auftraggeber','aus der Karte'),_feld('Objekt','objektAdresse','aus der Karte'),_feld('Auftrag-Nr.','auftragNr',''),_feld('Nutzer / Mieter','nutzer',''));
    return w;
  }
  function _teilVersichVb(){ // F20
    const w=document.createElement('div');
    w.append( // F16: Objekt und Zugang, Versicherung
      _feld('Versicherung','versicherung',''),
      _feld('Schadennummer','schadennr',''),
      _feld('Zugang','zugang','z. B. Schlüssel beim Hausmeister'),
      _feld('Ansprechpartner','ansprechpartner','vor Ort, mit Telefon'));
    return w;
  }
  // Inhalt „Ortstermin": Beginn/Ende, Anwesende, Wetter, Aufgenommen von
  function _teilTerminBg(){
    const holeWetter=_fsWetterHolen; // gleicher Ablauf wie im alten Kopf – Knopf, kein automatisches Holen
    const w=document.createElement('div');
    const hilfen=document.createElement('div');hilfen.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px;';
    const wb=document.createElement('button');wb.type='button';wb.textContent='🌤 Wetter holen';
    wb.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';
    wb.onclick=()=>holeWetter(bericht,_neuBauen);
    hilfen.appendChild(wb);
    if(!_fsIstVorab(bericht))w.append(
      _feld('Beginn','beginn','hh:mm'),
      _feld('Ende','ende','hh:mm'));
    w.append(
      _teilAnwesende(),
      hilfen,
      _feld('Wetter','wetter','z. B. bewölkt'),
      _feld('Letzter Regen','letzterRegen','Tag, wie stark'),
      _feld('Außen °C','aussenT','z. B. 12,5',true),
      _feld('Außen % rF','aussenRf','z. B. 80',true));
    const td=document.createElement('div');td.setAttribute('data-fs-aussen','1');
    td.style.cssText='padding:0 14px 6px 136px;font-size:var(--fs13,13px);color:var(--text2);';
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
    const z=document.createElement('label');z.style.cssText='display:flex;flex-direction:column;gap:3px;font-size:var(--fs12,12px);color:var(--text2);min-width:0;';
    const s=document.createElement('span');s.textContent=text;z.append(s,el);return z;
  }
  /* ── F6: Raum-Seite – ein Abschnitt „Räume“: Raumliste, darin je Raum eine Seite mit den Reitern Klima · Wände · Skizze · Messplan ────────
     Frank (01.10.2026): „Ich bin doch in einem Raum“ – bisher musste er für EINEN Raum an drei Stellen suchen (Raumklima, Messstellen, Raumskizze).
     Die Daten bleiben, wie sie sind (raum.waende, raum.skizze, bericht.stellen mit raum/wand/hoehe); nur die Anordnung im Formular ändert sich.
     Welcher Raum und welcher Reiter gerade offen sind, ist nur Anzeige und steht nicht im Protokoll. */
  let _bgRaumSel=null; // null = Raumliste · Zahl = Platz des Raums in bericht.raeume · 'ohne' = Messstellen ohne Raum
  let _bgRaumTab='klima'; // klima · waende · skizze · messplan
  function _bgRaumWahl(sel,tab){
    _bgRaumSel=sel;if(tab)_bgRaumTab=tab;
    _neuBauen();
    const el=body.querySelector('[data-fs-block="raeume"]');if(el){try{el.scrollIntoView({block:'start'});}catch(e){}}
  }
  // gehört die Messstelle zu diesem Raum? raumName null = Messstellen ohne (gültigen) Raum
  function _bgStelleGehoertZu(st,raumName){
    if(!st)return false;
    if(raumName===null||raumName===undefined)return !st.raum||!bericht.raeume.some(r=>r&&r.name===st.raum);
    return st.raum===raumName;
  }
  // Eine Zeile Kurzfassung für die Kachel in der Raumliste
  function _bgRaumKurz(r,plan){
    const t0=_fsZahl(r.t),rf=_fsZahl(r.rf);
    const teile=[(t0!==null&&rf!==null)?_fsEins(t0)+' °C / '+_fsEins(rf)+' %':'Klima offen'];
    const nw=(Array.isArray(r.waende)?r.waende:[]).filter(q=>q&&/^W\d+$/.test(String(q.k||''))).length;
    teile.push(nw+(nw===1?' Wand':' Wände'));
    if(r.skizze&&r.skizze.an)teile.push('Skizze ✓'+(((r.skizze.striche||[]).length||(r.skizze.stempel||[]).length)?' mit Einzeichnungen':''));
    const mine=plan.filter(p=>p.raum===r.name);
    if(mine.length){
      const erl=mine.filter(p=>_fsBgPlanErledigt(bericht,p)).length;
      teile.push('Messplan Nr '+mine[0].nr+(mine.length>1?'–'+mine[mine.length-1].nr:'')+(erl?' · '+erl+'/'+mine.length+' ✓':''));
    }else if(nw)teile.push('wird nicht gemessen');
    const ms=r.name?bericht.stellen.filter(s=>s&&s.raum===r.name).length:0;
    if(ms)teile.push(ms+(ms===1?' Messstelle':' Messstellen'));
    return teile.join(' · ');
  }
  // Reiter „Klima“: Name, Temperatur, Feuchte (mit Taupunkt), Uhrzeit, Bedingungen
  function _bgRaumKlima(r,ri){
    const card=document.createElement('div');card.setAttribute('data-fs-raumkarte',String(ri));
    card.style.cssText='margin:6px 10px;padding:2px 0 8px;border:1px solid var(--border);border-radius:10px;background:var(--bg2);';
    const kz=document.createElement('div');kz.style.cssText=S_RAUMGRID+'padding:6px 14px 0;font-size:var(--fs12,12px);color:var(--text2);';
    ['Raum','°C','% rF','Taupunkt',''].forEach(x=>{const s=document.createElement('span');s.textContent=x;kz.appendChild(s);});
    card.appendChild(kz);
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
    td.style.cssText='font-size:var(--fs14,14px);color:var(--text);text-align:center;';
    const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Raum entfernen';
    x.style.cssText='width:var(--fsh,40px);height:var(--fsh,40px);border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:var(--fs15,15px);cursor:pointer;';
    x.onclick=()=>{if(!confirm('Raum „'+(r.name||'ohne Namen')+'" mit allen Wänden entfernen?'))return;bericht.raeume.splice(ri,1);_bgRaumSel=null;scheduleSave();_neuBauen();};
    row.append(nameI,tI,fI,td,x);
    const r2=document.createElement('div');r2.style.cssText='display:grid;grid-template-columns:96px minmax(0,1fr);gap:6px;padding:0 14px 6px;align-items:center;';
    r2.append(_inp(r.zeit,'hh:mm',v=>{r.zeit=v;},false),_inp(r.bedingung,'Bedingungen, z. B. Heizlüfter in Betrieb',v=>{r.bedingung=v;},false));
    card.append(row,r2);
    return card;
  }
  // Reiter „Wände“: Art (Auswahl), Fotos je Wand, Wände anlegen, Fotos zum Raum
  function _bgRaumWaende(r,ri){
    const card=document.createElement('div');card.setAttribute('data-fs-raumwaende',String(ri));
    card.style.cssText='margin:6px 10px;padding:2px 0 8px;border:1px solid var(--border);border-radius:10px;background:var(--bg2);';
    const wt=document.createElement('div');wt.style.cssText='padding:6px 14px 2px;font-size:var(--fs12,12px);font-weight:700;color:var(--text2);';wt.textContent='Wände';card.appendChild(wt);
    r.waende.forEach((wd,wi)=>{
      if(!Array.isArray(wd.fotoRefs))wd.fotoRefs=[];
      const wr=document.createElement('div');wr.setAttribute('data-fs-wand',(r.name||'')+'|'+wd.k);
      wr.style.cssText='display:grid;grid-template-columns:54px minmax(0,1fr) var(--fsh,40px);gap:6px;align-items:center;padding:3px 14px;';
      const kk=document.createElement('span');kk.textContent=wd.k;kk.style.cssText='font-size:var(--fs14,14px);font-weight:700;color:var(--text);';
      let aI;
      if(/^W\d+$/.test(wd.k)){ // F3a: Art als Auswahl; unbekannte (frühere Freitext-)Werte bleiben als eigener Eintrag stehen
        const cur=String(wd.art||'').trim();
        aI=document.createElement('select');aI.style.cssText=S_INP;aI.setAttribute('data-fs-wandart',(r.name||'')+'|'+wd.k);
        const arten=FS_BG_WANDARTEN.slice();if(cur&&arten.indexOf(cur)<0)arten.push(cur);
        const o0=document.createElement('option');o0.value='';o0.textContent='– Art –';aI.appendChild(o0);
        arten.forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;aI.appendChild(o);});
        const oa=document.createElement('option');oa.value='__andere';oa.textContent='Andere …';aI.appendChild(oa);
        aI.value=cur;
        aI.onchange=()=>{
          if(aI.value==='__andere'){
            const n=prompt('Art der Wand:',(cur&&FS_BG_WANDARTEN.indexOf(cur)<0)?cur:'');
            if(n===null||!n.trim()){aI.value=cur;return;}
            wd.art=n.trim();
          }else wd.art=aI.value;
          scheduleSave();_neuBauen();
        };
      }else{ // Boden / Decke: Material frei
        aI=_inp(wd.art,wd.k==='Boden'?'Material, z. B. Estrich':'Material, z. B. Betondecke',v=>{wd.art=v;},false);aI.onchange=()=>{scheduleSave();_neuBauen();};
      }
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
    return card;
  }
  // Raumliste: oben die Knöpfe für das Messen (Messliste am Handy, Zuordnen am Tablet), darunter eine Kachel je Raum
  function _bgRaumListe(){
    const w=document.createElement('div');
    w.appendChild(_bgInfo('Tippe einen Raum an: darin findest du Klima, Wände mit Fotos, Skizze und Messplan. Neue Räume legst du hier an, wenn du im Raum stehst. Ein neuer Raum hat gleich W1 (Außenwand) und W2–W4 (Innenwand).'));
    w.appendChild(_bgSchrittHinweis('Am Tablet zuerst – Raum für Raum vorbereiten','Zu jedem Raum: Klima, Wände mit Fotos, Skizze, Messplan (Höhen je Wand). Danach misst du am Handy mit der „Messliste“. Zurück am Tablet ordnest du die Messungen zu.'));
    const plan=_fsBgMessplan(bericht);
    const erl=plan.filter(p=>_fsBgPlanErledigt(bericht,p)).length;
    const kn=document.createElement('div');kn.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:2px 10px 8px;';
    const mk=(txt,stil,fn,attr)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText=S_KNOPF+'flex:1 1 200px;min-height:48px;'+stil;if(attr)b.setAttribute(attr[0],attr[1]);b.onclick=fn;return b;};
    kn.append(
      mk('📋 Messliste (am Handy)','border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);',()=>_fsBgMessfensterZeigen(bericht,'liste'),['data-fs-messlistenknopf','1']),
      mk('📋 Messungen nach Messplan zuordnen','border:1.5px solid '+FS_FARBE+';background:rgba(31,95,139,.12);color:var(--text);',()=>{if(typeof _fsTestoPlanZuordnen==='function')_fsTestoPlanZuordnen(bericht,t,_neuBauen);},['data-fs-planzuordnen','1']),
      mk('📥 testo-Messung einlesen (einzeln)','border:1.5px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);',()=>_fsTestoEinlesen(bericht,t,_neuBauen)));
    w.appendChild(kn);
    const stand=document.createElement('div');stand.setAttribute('data-fs-planstand','1');stand.style.cssText='padding:0 14px 6px;font-size:var(--fs13,13px);font-weight:600;color:var(--text2);';
    stand.textContent=plan.length?'Messplan: '+erl+' von '+plan.length+' zugeordnet':'Noch kein Messplan – lege einen Raum mit Wänden an (ein Raum braucht einen Namen).';
    w.appendChild(stand);
    bericht.raeume.forEach((r,ri)=>{
      if(!Array.isArray(r.waende))r.waende=[];
      if(!Array.isArray(r.fotoRefs))r.fotoRefs=[];
      const k=document.createElement('button');k.type='button';k.setAttribute('data-fs-raumkachel',String(ri));
      k.style.cssText='display:block;width:calc(100% - 20px);margin:0 10px 8px;padding:12px 14px;border-radius:12px;border:1.5px solid var(--border);background:var(--bg2);color:var(--text);text-align:left;font-family:inherit;cursor:pointer;min-height:64px;';
      const n=document.createElement('div');n.textContent=(String(r.name||'').trim()||'Raum '+(ri+1));n.style.cssText='font-size:var(--fs17,17px);font-weight:700;';
      const s=document.createElement('div');s.textContent=_bgRaumKurz(r,plan);s.style.cssText='font-size:var(--fs13,13px);color:var(--text2);margin-top:3px;line-height:1.4;';
      k.append(n,s);k.onclick=()=>_bgRaumWahl(ri,'klima');
      w.appendChild(k);
    });
    const ohne=bericht.stellen.filter(s=>_bgStelleGehoertZu(s,null)).length;
    if(ohne){
      const k=document.createElement('button');k.type='button';k.setAttribute('data-fs-raumkachel','ohne');
      k.style.cssText='display:block;width:calc(100% - 20px);margin:0 10px 8px;padding:12px 14px;border-radius:12px;border:1.5px dashed var(--border);background:var(--fs-kfl,transparent);color:var(--text);text-align:left;font-family:inherit;cursor:pointer;min-height:56px;';
      const n=document.createElement('div');n.textContent='Messstellen ohne Raum';n.style.cssText='font-size:var(--fs16,16px);font-weight:700;';
      const s=document.createElement('div');s.textContent=ohne+(ohne===1?' Messstelle':' Messstellen')+' – hier einem Raum zuordnen';s.style.cssText='font-size:var(--fs13,13px);color:var(--text2);margin-top:3px;';
      k.append(n,s);k.onclick=()=>_bgRaumWahl('ohne');
      w.appendChild(k);
    }
    const chips=document.createElement('div');chips.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:6px 14px 12px;';
    const vorhanden=bericht.raeume.map(r=>r.name);
    const fehlendeWohnung=FS_WOHNUNG.filter(n=>vorhanden.indexOf(n)<0);
    if(!_fsIstKeller(bericht)&&fehlendeWohnung.length>1)chips.appendChild(_chip('＋ Wohnung ('+fehlendeWohnung.length+' Räume)',false,()=>{fehlendeWohnung.forEach(n=>bericht.raeume.push(_fsBgRaumMitWaenden(n)));scheduleSave();_neuBauen();}));
    _fsRaumVorschlaege(bericht).filter(n=>vorhanden.indexOf(n)<0).forEach(n=>{
      chips.appendChild(_chip('＋ '+n,false,()=>{bericht.raeume.push(_fsBgRaumMitWaenden(n));_bgRaumSel=bericht.raeume.length-1;_bgRaumTab='klima';scheduleSave();_neuBauen();}));
    });
    chips.appendChild(_chip('＋ anderer Raum',false,()=>{
      const n=prompt('Name des Raums:');
      if(n&&n.trim()){bericht.raeume.push(_fsBgRaumMitWaenden(n.trim()));_bgRaumSel=bericht.raeume.length-1;_bgRaumTab='klima';scheduleSave();_neuBauen();}
    }));
    w.appendChild(chips);
    return w;
  }
  // Raum-Seite: oben zurück/nächster Raum, darunter die vier Reiter, darunter der Inhalt des gewählten Reiters
  function _bgRaumSeite(){
    const w=document.createElement('div');w.setAttribute('data-fs-raumseite',String(_bgRaumSel));
    const ohne=_bgRaumSel==='ohne',n=bericht.raeume.length;
    const r=ohne?null:bericht.raeume[_bgRaumSel];
    if(r){if(!Array.isArray(r.waende))r.waende=[];if(!Array.isArray(r.fotoRefs))r.fotoRefs=[];}
    const kz=document.createElement('div');kz.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--border);';
    const zurueck=document.createElement('button');zurueck.type='button';zurueck.textContent='‹ Räume';zurueck.setAttribute('data-fs-raumzurueck','1');
    zurueck.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);border:1.5px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);';zurueck.onclick=()=>_bgRaumWahl(null);
    const ti=document.createElement('div');ti.style.cssText='flex:1;min-width:0;text-align:center;font-size:var(--fs16,16px);font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    ti.textContent=ohne?'Messstellen ohne Raum':(String(r.name||'').trim()||'Raum '+(_bgRaumSel+1));
    kz.append(zurueck,ti);
    if(!ohne){
      const weiter=document.createElement('button');weiter.type='button';weiter.setAttribute('data-fs-raumweiter','1');
      const naechster=_bgRaumSel+1<n?_bgRaumSel+1:null;
      weiter.textContent=naechster===null?'Raumliste ›':'Nächster Raum ›';
      weiter.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);border:1.5px solid '+FS_FARBE+';background:rgba(31,95,139,.10);color:var(--text);';
      weiter.onclick=()=>_bgRaumWahl(naechster,'klima');
      kz.appendChild(weiter);
    }
    w.appendChild(kz);
    if(ohne){
      w.appendChild(_bgInfo('Diese Messstellen haben keinen (gültigen) Raum. Wähle bei jeder den Raum aus; danach erscheint sie im Messplan des Raums.'));
      w.appendChild(_teilStellenBg(null));
      return w;
    }
    const tabs=document.createElement('div');tabs.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px 10px;';
    [['klima','Klima'],['waende','Wände'],['skizze','Skizze'],['messplan','Messplan']].forEach(([k,txt])=>{
      const an=_bgRaumTab===k;
      const b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute('data-fs-raumreiter',k);
      b.style.cssText='min-height:48px;padding:6px 2px;border-radius:10px;font-size:var(--fs15,15px);font-weight:'+(an?'700':'600')+';font-family:inherit;cursor:pointer;color:var(--text);border:2px solid '+(an?FS_FARBE:'var(--border)')+';background:'+(an?'rgba(31,95,139,.18)':'transparent')+';';
      b.onclick=()=>{_bgRaumTab=k;_neuBauen();};
      tabs.appendChild(b);
    });
    w.appendChild(tabs);
    if(_bgRaumTab==='waende')w.appendChild(_bgRaumWaende(r,_bgRaumSel));
    else if(_bgRaumTab==='skizze')w.appendChild(_teilSkizzeBg(_bgRaumSel));
    else if(_bgRaumTab==='messplan')w.appendChild(_teilMessplanBg(_bgRaumSel));
    else w.appendChild(_bgRaumKlima(r,_bgRaumSel));
    const loe=document.createElement('button');loe.type='button';loe.textContent='🗑 Raum löschen';loe.setAttribute('data-fs-raumloeschen','1'); // F22: beschriftet statt nur ✕ in der Klima-Zeile
    loe.style.cssText=S_KNOPF+'display:block;margin:12px 14px;min-height:var(--fsh44,44px);border:1.5px solid var(--red);background:transparent;color:var(--red);';
    loe.onclick=()=>{if(!confirm('Raum „'+(String(r.name||'').trim()||'ohne Namen')+'" mit allen Wänden entfernen?'))return;bericht.raeume.splice(_bgRaumSel,1);_bgRaumSel=null;scheduleSave();_neuBauen();};
    w.appendChild(loe);
    return w;
  }
  // Der Abschnitt „Räume“: Raumliste oder Raum-Seite
  function _teilRaeumeBg(){
    const w=document.createElement('div');
    w.appendChild(_kopfZeile('Räume'));
    if(_bgRaumSel==='ohne'){if(!bericht.stellen.some(s=>_bgStelleGehoertZu(s,null)))_bgRaumSel=null;}
    else if(_bgRaumSel!==null&&!bericht.raeume[_bgRaumSel])_bgRaumSel=null;
    w.appendChild(_bgRaumSel===null?_bgRaumListe():_bgRaumSeite());
    return w;
  }

  /* ── F4: Messplan – Höhen je Wand, feste Reihenfolge, Merkzettel „So misst du“, Knopf zum Zuordnen ──────────────────── */
  // F4a: kurzer Hinweis, in welchem Schritt man gerade ist (Ablauf: Tablet vorbereiten · Handy messen · Tablet zuordnen) mit Knopf zum großen Fenster
  function _bgSchrittHinweis(titel,text){
    const d=document.createElement('div');d.setAttribute('data-fs-schritthinweis',titel);
    d.style.cssText='margin:8px 10px;padding:10px 12px;border-radius:10px;border-left:5px solid '+FS_FARBE+';background:rgba(31,95,139,.10);';
    const t1=document.createElement('div');t1.textContent=titel;t1.style.cssText='font-size:var(--fs14,14px);font-weight:700;color:var(--text);';
    const t2=document.createElement('div');t2.textContent=text;t2.style.cssText='font-size:var(--fs14,14px);line-height:1.5;color:var(--text);margin-top:2px;';
    const kb=document.createElement('button');kb.type='button';kb.textContent='ℹ So misst du';kb.setAttribute('data-fs-hinweisknopf','1');
    kb.style.cssText=S_KNOPF+'margin-top:8px;min-height:var(--fsh44,44px);border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';
    kb.onclick=()=>_fsBgMessfensterZeigen(bericht,'ablauf');
    d.append(t1,t2,kb);return d;
  }
  // F6: Reiter „Messplan“ eines Raums: Höhen je Wand, „Raum nicht messen“, darunter die Messstellen dieses Raums
  function _teilMessplanBg(ri){
    const w=document.createElement('div');w.setAttribute('data-fs-messplan','1');
    const r=bericht.raeume[ri];
    if(!r){w.appendChild(_bgInfo('Raum nicht gefunden.'));return w;}
    const name=String(r.name||'').trim();
    const box=document.createElement('div');
    box.style.cssText='margin:8px 10px;padding:10px;border:1px solid var(--border);border-left:5px solid '+FS_FARBE+';border-radius:10px;background:var(--bg2);';
    const plan=_fsBgMessplan(bericht).filter(p=>p.raum===name);
    const erl=plan.filter(p=>_fsBgPlanErledigt(bericht,p)).length;
    const kopf=document.createElement('div');kopf.style.cssText='display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;';
    const kt=document.createElement('span');kt.textContent='📋 Messplan dieses Raums';kt.style.cssText='font-size:var(--fs15,15px);font-weight:700;color:var(--text);flex:1;';
    const ks=document.createElement('span');ks.setAttribute('data-fs-planstand','1');ks.textContent=plan.length?erl+' von '+plan.length+' zugeordnet':'';
    ks.style.cssText='font-size:var(--fs12,12px);font-weight:600;color:var(--text2);';
    kopf.append(kt,ks);box.appendChild(kopf);
    const info=_bgInfo('Miss immer in dieser Reihenfolge: Raum für Raum, W1 bis W4, an jeder Wand von der ersten bis zur letzten Höhe. Eine Wand, die du nicht misst, schaltest du ab – sie fehlt dann in der Messliste, ihre Höhen bleiben gespeichert. Höhen ändern: Zahlen eintragen (z. B. 10, 50, 100). Die Reihenfolge über alle Räume steht in der „Messliste“.');
    info.style.padding='6px 0';box.appendChild(info);
    if(!name){
      const leer=_bgInfo('Dieser Raum braucht einen Namen (Reiter „Klima“), sonst steht er nicht im Messplan.');
      leer.style.padding='6px 0';box.appendChild(leer);
    }
    const ws=(Array.isArray(r.waende)?r.waende:[]).filter(q=>q&&/^W\d+$/.test(String(q.k||''))).sort((a,c)=>(+String(a.k).slice(1))-(+String(c.k).slice(1)));
    const bereich={};
    plan.forEach(p=>{const k=p.wand;const z=bereich[k]||(bereich[k]={von:p.nr,bis:p.nr,n:0,erl:0});z.bis=p.nr;z.n++;if(_fsBgPlanErledigt(bericht,p))z.erl++;});
    if(name&&ws.length){ // ganzen Raum in einem Zug aus dem Plan nehmen oder mit den Standardhöhen zurückholen
      const raumAus=ws.every(q=>!_fsBgWandHoehen(q).length);
      const rb=_chip(raumAus?'↺ Raum messen':'Raum nicht messen',false,()=>{_fsBgRaumMessenSetzen(r,raumAus);scheduleSave();_neuBauen();});
      rb.setAttribute('data-fs-planraumschalter',name);
      const rz=document.createElement('div');rz.style.cssText='margin:2px 0 4px;';rz.appendChild(rb);box.appendChild(rz);
    }
    ws.forEach(wd=>{
      const z=bereich[wd.k],an=_fsBgWandHoehen(wd).length>0; // F8: an = die Wand steht im Messplan
      const row=document.createElement('div');row.setAttribute('data-fs-planwand',name+'|'+wd.k);row.setAttribute('data-fs-planan',an?'1':'0');
      row.style.cssText='display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin:6px 0;padding:6px 8px;border-radius:10px;border:1.5px solid '+(an?'var(--border)':'transparent')+';'+(an?'':'opacity:.65;');
      const lab=document.createElement('span');lab.style.cssText='flex:1 1 130px;min-width:0;font-size:var(--fs14,14px);font-weight:700;color:var(--text);';
      lab.textContent=wd.k+(String(wd.art||'').trim()?' – '+String(wd.art).trim():'');
      const sw=document.createElement('button');sw.type='button';sw.setAttribute('data-fs-wandschalter',name+'|'+wd.k);
      sw.textContent=an?'✓ wird gemessen':'✕ wird nicht gemessen';
      sw.style.cssText=S_KNOPF+'flex:0 0 auto;min-height:var(--fsh44,44px);border:2px solid '+(an?FS_FARBE:'var(--border)')+';background:'+(an?'rgba(31,95,139,.18)':'transparent')+';color:var(--text);';
      sw.onclick=()=>{_fsBgWandMessenSetzen(wd,!an);scheduleSave();_neuBauen();};
      row.append(lab,sw);
      if(an){
        const hi=_inp(typeof wd.hoehen==='string'?wd.hoehen:FS_BG_HOEHEN_STANDARD,'z. B. 10, 50, 100',v=>{wd.hoehen=v;},false);
        hi.setAttribute('data-fs-planhoehe',name+'|'+wd.k);hi.setAttribute('aria-label','Höhen in cm an '+wd.k);
        hi.style.flex='1 1 150px';hi.style.width='auto';hi.style.minHeight='44px';
        hi.onchange=()=>{scheduleSave();_neuBauen();};
        const st=document.createElement('span');st.style.cssText='flex:0 0 auto;min-width:88px;font-size:var(--fs12,12px);font-weight:600;color:var(--text2);text-align:right;';
        st.textContent=z?('Nr '+z.von+(z.bis>z.von?'–'+z.bis:'')+(z.erl?' · '+z.erl+'/'+z.n+' ✓':'')):'';
        row.append(hi,st);
      }else{ // abgeschaltet: grau und eingeklappt, die Höhen bleiben gespeichert
        const gesp=_fsBgHoehenListe(typeof wd.hoehen==='string'?wd.hoehen:FS_BG_HOEHEN_STANDARD).join(', ');
        const g=document.createElement('span');g.style.cssText='flex:1 1 100%;font-size:var(--fs12,12px);color:var(--text2);';
        g.textContent=gesp?('Höhen '+gesp+' cm bleiben gespeichert – beim Einschalten gelten sie wieder.'):('Beim Einschalten gelten wieder '+FS_BG_HOEHEN_STANDARD+' cm.');
        row.appendChild(g);
      }
      box.appendChild(row);
    });
    w.appendChild(box);
    if(name){ // Messstellen gehören über den Raumnamen zum Raum – ohne Namen gibt es keine
      const mt=document.createElement('div');mt.style.cssText='padding:8px 14px 0;font-size:var(--fs13,13px);font-weight:700;color:var(--text);';mt.textContent='Messstellen dieses Raums';
      w.appendChild(mt);
      w.appendChild(_teilStellenBg(name));
    }
    return w;
  }

  // F6: die Messstellen EINES Raums (raumName) bzw. die ohne gültigen Raum (null) – im Reiter „Messplan“ der Raum-Seite
  function _teilStellenBg(raumName){
    const w=document.createElement('div');
    w.appendChild(_bgInfo('Raum und Wand wählen, Höhe in cm, Uhrzeit. Oberfläche mit dem Infrarot-Thermometer, Bauteilfeuchte in Digits. Jede Höhe an einer Wand ist eine eigene Stelle.'));
    const raumNamen=bericht.raeume.map(r=>r.name).filter(Boolean);
    const druck=_fsBgStellenSortiert(bericht);
    bericht.stellen.forEach((st,si)=>{
      if(!_bgStelleGehoertZu(st,raumName))return; // F6: nur die Stellen dieses Raums
      const card=document.createElement('div');
      card.style.cssText='margin:8px 10px;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--bg2);';
      const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;gap:8px;';
      const nr=document.createElement('span');nr.textContent=String(si+1);
      nr.style.cssText='width:30px;height:30px;border-radius:50%;background:'+FS_FARBE+';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;';
      const txtI=_inp(st.text,'Ort im Raum, z. B. Ecke oben',v=>{st.text=v;},false);
      txtI.setAttribute('data-fs-stellentext',String(si));
      const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Messstelle entfernen';
      x.style.cssText='width:var(--fsh,40px);height:var(--fsh,40px);border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--red);font-size:var(--fs15,15px);cursor:pointer;flex-shrink:0;';
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
        mb.style.cssText=S_KNOPF+'min-height:var(--fsh,40px);border:1.5px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);';
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
      const pl=document.createElement('div');pl.setAttribute('data-fs-impdf',String(si));pl.style.cssText='margin-top:6px;font-size:var(--fs12,12px);color:var(--text2);';
      pl.textContent=pdfNr?'Im PDF: '+(st.referenz?'Vergleichsstelle ':'Nr ')+pdfNr:'Kommt ins PDF, sobald etwas eingetragen ist.';

      card.append(top,sel,ortRow,gr,luftGr,bf,werte);
      if(zusammen)card.appendChild(zusammen);
      card.append(notiz,fotoLeiste,pl);
      w.appendChild(card);
    });
    const add=document.createElement('button');add.type='button';add.textContent='＋ Messstelle';
    add.style.cssText=S_KNOPF+'display:block;width:calc(100% - 20px);margin:8px 10px 14px;border:1.5px dashed '+FS_FARBE+';background:rgba(31,95,139,.08);color:var(--text);';
    add.onclick=()=>{
      const gleiche=bericht.stellen.filter(q=>_bgStelleGehoertZu(q,raumName)),letzte=gleiche[gleiche.length-1]; // F6: Wand wie bei der letzten Stelle DIESES Raums
      const neu0={text:'',raum:raumName||'',ts:'',mf:'',mfVergleich:'',befund:[],notiz:'',fotoRefs:[]};
      _fsBgStelleNeu(neu0,letzte);
      bericht.stellen.push(neu0);
      scheduleSave();_neuBauen();
      const neu=body.querySelector('[data-fs-stellentext="'+(bericht.stellen.length-1)+'"]');
      if(neu){try{neu.scrollIntoView({block:'center'});}catch(e){}neu.focus();}
    };
    w.appendChild(add);
    return w;
  }

  /* ── F3/F6: Raumskizze – seit F6 der Reiter „Skizze“ in der Raum-Seite (ri = Platz des Raums in bericht.raeume) ─────────── */
  function _teilSkizzeBg(ri){
    const w=document.createElement('div');
    const r=bericht.raeume[ri];
    if(!r){w.appendChild(_bgInfo('Raum nicht gefunden.'));return w;}
    w.appendChild(_bgInfo('PAM zeichnet den Raum von oben mit den Wänden W1–W4, Tür, Fenster und deinen Messstellen. Nicht maßstäblich. Im PDF steht die Skizze nur, wenn du sie für den Raum anlegst.'));
    if(!r.skizze||!r.skizze.an){
      const neu=document.createElement('button');neu.type='button';neu.setAttribute('data-fs-skizze-neu','1');
      neu.textContent='＋ Skizze für '+(String(r.name||'').trim()||'diesen Raum')+' anlegen';
      neu.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:6px 14px 12px;min-height:var(--fsh44,44px);border:1.5px dashed '+FS_FARBE+';background:rgba(31,95,139,.08);color:var(--text);';
      neu.onclick=()=>{r.skizze={an:true,l:'',b:'',dreh:0};_fsBgWaendeVier(r);scheduleSave();_neuBauen();};
      w.appendChild(neu);
      return w;
    }
    const sk=r.skizze;
    const vorschau=document.createElement('img');vorschau.setAttribute('data-fs-skizze-bild','1');vorschau.alt='Raumskizze';
    vorschau.style.cssText='display:block;width:calc(100% - 28px);max-width:560px;margin:6px 14px;border:1px solid var(--border);border-radius:8px;background:#fff;';
    const neuZeichnen=()=>{const u=_fsBgSkizzeBild(bericht,r);if(u)vorschau.src=u;};
    const masse=document.createElement('div');masse.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:6px;padding:0 14px;align-items:end;';
    const dreh=document.createElement('button');dreh.type='button';dreh.setAttribute('data-fs-skizze-dreh','1');dreh.textContent='↻ Drehen';
    dreh.style.cssText=S_KNOPF+'min-height:var(--fsh44,44px);border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';
    dreh.onclick=()=>{
      if((_fsBgStricheAnzahl(sk)||_fsBgStempelAnzahl(sk))&&!confirm('Die eingezeichneten Striche und Stempel drehen nicht mit. Trotzdem drehen?'))return; // F5/F7
      sk.dreh=((parseInt(sk.dreh,10)||0)+1)%4;scheduleSave();neuZeichnen();
    };
    masse.append(_bgLabelFeld('Länge W1/W3 (m)',_inp(sk.l,'z. B. 4,5',v=>{sk.l=v;neuZeichnen();},true)),_bgLabelFeld('Breite W2/W4 (m)',_inp(sk.b,'z. B. 3,2',v=>{sk.b=v;neuZeichnen();},true)),dreh);
    w.appendChild(masse);
    w.appendChild(vorschau);
    neuZeichnen();
    const ez=document.createElement('button');ez.type='button';ez.setAttribute('data-fs-skizze-zeichnen','1');
    const nStr=(sk.striche||[]).length,nSt=_fsBgStempelAnzahl(sk);
    ez.textContent='✏ Einzeichnen – Stempel (Tür, Fenster, Schrank, Heizkörper) und Freihand'+((nStr||nSt)?' ('+[nSt?nSt+' Stempel':'',nStr?nStr+' Strich'+(nStr===1?'':'e'):''].filter(Boolean).join(', ')+')':'');
    ez.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:6px 14px 2px;min-height:48px;border:1.5px solid '+FS_FARBE+';background:rgba(31,95,139,.10);color:var(--text);text-align:left;';
    ez.onclick=()=>_fsBgEinzeichnenZeigen(bericht,r,()=>{_neuBauen();}); // F5: danach neu aufbauen, damit Bild und Strichzahl stimmen
    w.appendChild(ez);
    w.appendChild(_bgInfo('Stempel setzt du in die Mitte, ziehst sie an die richtige Stelle und drehst sie; Striche zeichnest du frei. Beides dreht NICHT mit, wenn du die Skizze später drehst – stelle erst Länge, Breite und Drehung ein. Beides kommt auch ins PDF.'));
    w.appendChild(_bgInfo('Blau = Fenster, Bogen = Tür. Die Punkte sind deine Messstellen (Nummern wie im PDF); sie zeigen die Wand, nicht die genaue Stelle und Höhe. „Drehen" legt fest, welche Wand unten liegt.'));
    const zeilen=document.createElement('div');zeilen.style.cssText='padding:2px 14px;';
    for(let i=1;i<=4;i++){
      const wd=(r.waende||[]).find(q=>q&&q.k==='W'+i);
      if(!wd)continue;
      const row=document.createElement('div');row.setAttribute('data-fs-skizze-wand','W'+i);row.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0;';
      const l=document.createElement('span');l.style.cssText='flex:1 1 120px;min-width:0;font-size:var(--fs14,14px);font-weight:700;color:var(--text);';l.textContent='W'+i+(String(wd.art||'').trim()?' – '+String(wd.art).trim():'');
      row.append(l,_chip('Tür',!!wd.tuer,()=>{wd.tuer=!wd.tuer;scheduleSave();_neuBauen();}),_chip('Fenster',!!wd.fenster,()=>{wd.fenster=!wd.fenster;scheduleSave();_neuBauen();}));
      zeilen.appendChild(row);
    }
    w.appendChild(zeilen);
    const weg=document.createElement('button');weg.type='button';weg.textContent='✕ Skizze für diesen Raum entfernen';
    weg.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:8px 14px 12px;border:1px solid var(--border);background:transparent;color:var(--text2);';
    weg.onclick=()=>{
      if(!confirm('Skizze für „'+(String(r.name||'').trim()||'diesen Raum')+'" entfernen? Wände, Türen und Fenster bleiben erhalten, sie steht dann nicht mehr im PDF.'+((_fsBgStricheAnzahl(sk)||_fsBgStempelAnzahl(sk))?' Die eingezeichneten Striche und Stempel gehen verloren.':'')))return;
      r.skizze=null;scheduleSave();_neuBauen();
    };
    w.appendChild(weg);
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
      const l=document.createElement('div');l.style.cssText='font-size:var(--fs14,14px);font-weight:600;color:var(--text);margin-bottom:6px;';l.textContent=it.text||'';
      row.append(l,_inp(it.notiz,it.h||'Angabe …',v=>{it.notiz=v;},false));
      return row;
    }
    const st=it.status||'offen';
    const q=document.createElement('div');q.style.cssText='font-size:var(--fs14,14px);font-weight:600;color:var(--text);margin-bottom:6px;';q.textContent=it.text||'';
    if(it.neuAnsehen&&st==='offen'){
      const hw=document.createElement('span');hw.setAttribute('data-fs-neuansehen','1');hw.textContent='  · bitte neu beantworten';hw.style.cssText='font-weight:600;font-size:var(--fs12,12px);color:var(--orange);';q.appendChild(hw);
    }
    const knr=document.createElement('div');knr.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;';
    const kurz=it.mo||String(it.m||'').split(': {}').join('').split(' {}').join('');
    [['ok',it.ok],['mangel',kurz]].forEach(([k,text])=>{
      if(!text)return;
      const an=st===k;
      const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('data-fs-satz',k);
      b.style.cssText='padding:8px 8px;min-height:var(--fsh44,44px);border-radius:8px;font-size:var(--fs13,13px);line-height:1.35;text-align:left;cursor:pointer;font-family:inherit;'
        +'border:2px solid '+(an?'var(--fs-krd,'+FS_FARBE+')':'var(--border)')+';background:'+(an?'var(--fs-can,rgba(31,95,139,.18))':'var(--fs-cfl,transparent)')+';color:var(--text);font-weight:'+(an?'700':'400')+';';
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
    if(_fsIstVorab(bericht))w.appendChild(_bgInfo('Einzelpunkte: Tippe den Satz an, der stimmt. Rechts öffnet sich ein Eingabefeld für Einzelheiten. Was du offen lässt, steht nicht im PDF. Die freie Beschreibung steht oben unter „Vor Ort“.')); // F20
    else w.appendChild(_bgInfo('Tippe den Satz an, der stimmt. Was du offen lässt, steht nicht im PDF.'));
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
        kurz.style.cssText='font-size:var(--fs12,12px);font-weight:600;color:var(--text2);white-space:nowrap;flex-shrink:0;';kopf.appendChild(kurz);}
      kopf.onclick=()=>umschalten(si,!zu);
      w.appendChild(kopf);
      if(zu)return;
      sek.items.forEach(it=>w.appendChild(_bgPunktZeile(sek,it)));
      const frei=document.createElement('button');frei.type='button';frei.textContent='＋ Freier Eintrag';
      frei.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:8px 14px;border:1px dashed var(--border);background:transparent;color:var(--text2);';
      frei.onclick=()=>{const tx=prompt('Feststellung als ganzer Satz:');if(tx&&tx.trim()){sek.items.push({frei:true,text:tx.trim(),notiz:'',status:'mangel',fotoRefs:[]});scheduleSave();_neuBauen();}};
      w.appendChild(frei);
      const ein=document.createElement('button');ein.type='button';ein.textContent='▲ Abschnitt einklappen';ein.setAttribute('data-fs-einklappen',String(si));
      ein.style.cssText=S_KNOPF+'display:block;width:calc(100% - 28px);margin:0 14px 12px;border:1.5px solid var(--fs-krd,'+FS_FARBE+');background:var(--fs-kfl,transparent);color:var(--text);';
      ein.onclick=()=>umschalten(si,true);
      w.appendChild(ein);
    });
    return w;
  }

  function _teilAngabenBg(){
    const w=document.createElement('div');w.setAttribute('data-fs-angaben','1');
    w.appendChild(_kopfZeile('Angaben der Nutzer (nicht selbst festgestellt)'));
    w.appendChild(_bgInfo(_fsIstVorab(bericht)?'Was der Auftraggeber oder Nutzer berichtet hat – nicht selbst festgestellt. Im PDF steht „Laut …". Fragen ohne Eintrag erscheinen nicht.':'Was Mieter oder Nutzer gesagt haben. Im PDF steht „Laut …". Fragen ohne Eintrag erscheinen nicht.')); // F16
    const namen=_bgNamenListe();
    bericht.angaben.forEach((a,ai)=>{
      const row=document.createElement('div');row.style.cssText='padding:10px 14px;border-bottom:1px solid var(--border);';
      row.setAttribute('data-fs-angabe',a.k||String(ai));
      const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:6px;';
      const q=document.createElement('div');q.style.cssText='flex:1;min-width:0;font-size:var(--fs14,14px);font-weight:600;color:var(--text);';q.textContent=a.q||'';
      top.appendChild(q);
      if(a.frei)top.appendChild(_bgXKnopf('Angabe entfernen',()=>{if(String(a.text||'').trim()&&!confirm('Angabe entfernen?'))return;bericht.angaben.splice(ai,1);scheduleSave();_neuBauen();}));
      row.append(top,_bgTextFeld(a.text,'Was wurde gesagt …',v=>{a.text=v;},2));
      const opts=namen.slice();if(a.von&&opts.indexOf(a.von)<0)opts.push(a.von);
      if(opts.length){
        const c=document.createElement('div');c.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;align-items:center;';
        const l=document.createElement('span');l.style.cssText='font-size:var(--fs12,12px);color:var(--text2);';l.textContent='Laut:';c.appendChild(l);
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

  /* Fußleiste – F9: nur am PC. Handy und Tablet erstellen kein PDF (Frank 02.10.2026: Prüfen und Weiterbearbeiten am Rechner). */
  if(!_fsAmPc()){
    body.style.paddingBottom='24px';
    ov.append(hdr,body);
    document.body.appendChild(ov);
    return;
  }
  const footer=document.createElement('div');
  footer.style.cssText='position:fixed;bottom:0;left:0;right:0;padding:12px 14px;background:var(--bg2);border-top:1px solid var(--border);display:flex;gap:10px;z-index:99999;';
  const pdfBtn=document.createElement('button');pdfBtn.type='button';pdfBtn.textContent='📄 PDF erstellen';
  pdfBtn.style.cssText='flex:1;padding:12px;background:'+FS_FARBE+';color:#fff;border:none;border-radius:8px;font-size:var(--fs15,15px);font-weight:700;cursor:pointer;';
  pdfBtn.onclick=async()=>{
    pdfBtn.disabled=true;const alt=pdfBtn.textContent;pdfBtn.textContent='⏳ PDF wird erstellt …';
    try{await _fsMobPdf(bericht,t);}finally{pdfBtn.disabled=false;pdfBtn.textContent=alt;}
  };
  const shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.textContent='📤';
  shareBtn.style.cssText='padding:12px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:var(--fs18,18px);cursor:pointer;color:var(--text);';
  shareBtn.onclick=async()=>{
    const blob=_fsPdfBlobs[bericht.id];
    if(navigator.share&&blob){
      const file=new File([blob],bericht.pdfName||_fsPdfName(bericht),{type:'application/pdf'});
      try{await navigator.share({title:_fsTitel(bericht),files:[file]});}
      catch(e){if(e.name!=='AbortError')toast('Teilen fehlgeschlagen','error');}
    }else{toast('Bitte zuerst PDF erstellen','info');}
  };
  const openBtn=document.createElement('button');openBtn.type='button';openBtn.textContent='📂 Öffnen'; // v294
  openBtn.style.cssText='padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:var(--fs15,15px);font-weight:600;cursor:pointer;color:var(--text);';
  openBtn.onclick=()=>_fsPdfOeffnen(bericht);
  if(bericht.schlank&&typeof window!=='undefined'&&typeof window._pamBesichtigungWord==='function'){ /* F39: Besichtigung 2 zusätzlich als bearbeitbares Word-Dokument – nur am PC, den Bau übernimmt PAM Desktop */
    const wordBtn=document.createElement('button');wordBtn.type='button';wordBtn.textContent='📝 Word';wordBtn.setAttribute('data-fs-word','1');wordBtn.title='Word-Dokument zum Bearbeiten erstellen (das PDF bleibt der unveränderte Nachweis)';
    wordBtn.style.cssText='padding:12px;background:var(--fs-kfl,var(--bg3));border:1px solid var(--fs-krd,var(--border));border-radius:8px;font-size:var(--fs15,15px);font-weight:600;cursor:pointer;color:var(--text);';
    wordBtn.onclick=async()=>{wordBtn.disabled=true;const alt=wordBtn.textContent;wordBtn.textContent='⏳ Word …';try{await window._pamBesichtigungWord(bericht,t);}finally{wordBtn.disabled=false;wordBtn.textContent=alt;}};
    footer.append(pdfBtn,wordBtn,openBtn,shareBtn);
  }else footer.append(pdfBtn,openBtn,shareBtn);
  ov.append(hdr,body,footer);
  document.body.appendChild(ov);
  /* F28: die Frage „Innen · Außen · Beides“ kommt VOR dem Anlegen; am PC das Fenster schweben lassen und die Liste auffrischen, weil der Aufrufer schon fertig ist */
  try{if(art==='besichtigung2'&&typeof existingIdx!=='number'){if(typeof _pamFormUeberlagerungPc==='function'&&typeof _fsAmPc==='function'&&_fsAmPc())_pamFormUeberlagerungPc(ov);if(typeof renderPruefberichteDesktop==='function')renderPruefberichteDesktop();}}catch(e){console.warn('[Besichtigung] Start:',e);}
  try{if(bericht.schlank&&!(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'))_fsKompassStart();}catch(e){} /* F29: Android merkt die Blickrichtung für Fotos von selbst */
}

// Rechenzeile unter einer Messstelle – nur Zahlen und feste Texte, deshalb textContent
function _fsWerteZeile(el,w,st){
  el.innerHTML='';
  const z=document.createElement('div');z.style.cssText='font-size:var(--fs14,14px);color:var(--text);line-height:1.6;';
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
  {const kl=_fsKlartext(w);if(kl.text){const d=document.createElement('div');d.setAttribute('data-fs-klartext',kl.stufe);d.style.cssText='font-size:var(--fs14,14px);font-weight:600;color:var(--text);margin-top:3px;line-height:1.45;';d.textContent=(kl.stufe==='gruen'?'✅ ':kl.stufe==='gelb'?'⚠ ':'⛔ ')+kl.text;el.appendChild(d);}} // v294
  const z2=[];
  if(w.frsi!==null)z2.push('Temperaturfaktor '+(Math.round(w.frsi*100)/100).toFixed(2).replace('.',','));
  if(w.faktor!==null)z2.push('Bauteil ×'+_fsEins(w.faktor)+' gegenüber Vergleich');
  if(z2.length){const d=document.createElement('div');d.style.cssText='font-size:var(--fs13,13px);color:var(--text2);';d.textContent=z2.join(' · ');el.appendChild(d);}
  if(st&&st.testo){ // v292
    const d=document.createElement('div');d.style.cssText='font-size:var(--fs13,13px);color:var(--text2);';
    d.textContent=_fsTestoInfoText(st,w);el.appendChild(d);
  }
  w.hinweise.forEach(h=>{
    const d=document.createElement('div');d.style.cssText='font-size:var(--fs13,13px);font-weight:700;color:var(--text);margin-top:4px;padding-left:8px;border-left:4px solid var(--orange);';
    d.textContent='⚠ '+h;el.appendChild(d);
  });
}

// F2a: Rechenzeile unter einer Messstelle im Begehungsprotokoll – nur kleine graue Zahlen zur Anzeige am Gerät, nie im PDF.
// Keine Ampelfarbe, kein Klartext, keine Schlussfolgerung. Orange nur als Merkhilfe für Fehlendes aus der testo-Messung.
function _fsWerteZeileBg(el,w,st){
  el.innerHTML='';
  const z=document.createElement('div');z.style.cssText='font-size:var(--fs12,12px);color:var(--text2);line-height:1.5;';
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
    const d=document.createElement('div');d.style.cssText='font-size:var(--fs12,12px);color:var(--text2);';
    d.textContent=_fsTestoInfoText(st,w);el.appendChild(d);
    (Array.isArray(st.testo.warnungen)?st.testo.warnungen:[]).forEach(h=>{
      if(typeof h!=='string'||!h)return;
      const m=document.createElement('div');m.setAttribute('data-fs-merkhilfe','1');
      m.style.cssText='font-size:var(--fs12,12px);font-weight:600;color:var(--text);margin-top:4px;padding-left:8px;border-left:4px solid var(--orange);';
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
  if(bericht&&bericht.vorlage==='flachdach'&&typeof _fsPbPdf==='function')return _fsPbPdf(bericht,task); // F13: Prüfbericht Flachdach hat sein eigenes PDF
  if(bericht&&bericht.vorlage==='wartungsprotokoll'&&typeof _fsWpPdf==='function')return _fsWpPdf(bericht,task); // F10: Wartungsprotokoll hat sein eigenes PDF
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
// F25 (Frank 03.10.2026): Rollen bei „Anwesend“ in Besichtigung 2 – ohne „Nutzer“ und „Mieter Nachbarkeller“, „Vertreter“ statt „Vertreter Auftraggeber"; die Begehungsprotokolle behalten FS_BG_ROLLEN
const FS_B2_ROLLEN=['Eigentümer','Eigentümer (wohnt vor Ort)','Mieter','Mieterin','Handwerker','Vertreter','Aufgenommen von','Sonstige'];
const FS_B2_KONTAKTROLLEN={mieter:'Mieter',eigentuemer:'Eigentümer',hausverwaltung:'Vertreter',ag:'Vertreter',privatkunde:'Vertreter',handwerker:'Handwerker'};
// F2b: die zuklappbaren Abschnitte des Begehungsprotokolls (k = Schlüssel, t = Überschrift, c = Kurzname in der Sprungleiste)
const FS_BG_BLOECKE=[{k:'auftrag',t:'Auftrag und Umfang',c:'Auftrag'},{k:'termin',t:'Ortstermin',c:'Termin'},{k:'geraete',t:'Messgeräte',c:'Geräte'},{k:'raeume',t:'Räume',c:'Räume'},{k:'fest',t:'Feststellungen vor Ort',c:'Feststellungen'},{k:'angaben',t:'Angaben der Nutzer (nicht selbst festgestellt)',c:'Angaben'},{k:'fazit',t:'Zusammenfassung der Feststellungen',c:'Zusammenfassung'},{k:'fotos',t:'Fotos',c:'Fotos'}];
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
/* ══ F16: VORABBESICHTIGUNG – dritte Art des Begehungsprotokolls (art:'vorab', Frank 02.10.2026) ═══════════════════
   Besichtigung VOR der Schadenaufnahme. Gleiche Bausteine wie das Begehungsprotokoll (Fotos, Kopf aus der Karte, Sätze zum Antippen, PDF), eigene Inhalte.
   Muss: Anlass und Auftraggeber · Objekt und Zugang · Schadenbild (nur Feststellungen) · Vorgeschichte laut Auftraggeber.
   Kann (zuklappbar, was leer bleibt, steht nicht im PDF): Nicht einsehbar · Dringlichkeit und Gefahr · Vorhandene Unterlagen · Raumskizze · Wetter und Klima.
   Weggelassen (Franks Wahl): Umfang der Schadenaufnahme · Aufwandsschätzung · Hinweistext „unverbindlich". Keine Ampel, keine Ursache, keine Empfehlung.
   ⛔ Datei ist öffentlich: nur Sätze und Programm, nie Namen. Texte, die ins PDF gehen: nur Zeichen der PDF-Schrift. */
const FS_VB_TITEL='Vorabbesichtigung';
/* F23: „BESICHTIGUNG 2“ (Frank 03.10.2026: „zu viele Auswahlfelder … wir müssen das verschlanken“, nach Entwurf vorab2_entwurf.html: „ja bau so“).
   Dieselbe Art wie die Vorabbesichtigung (art:'vorab'), aber mit Kennzeichen b.schlank=true: Vor Ort · Gemeldet / vorgefunden · Feststellungen mit Umgebung ·
   Fotos (der Stelle zugeordnet) · Raumskizze. Keine Vorgeschichte, keine Karte/Versicherung/Einzelpunkte/Wetter-Abschnitte, keine Raum-/Merkmal-Knöpfe, kein Messwert-Feld,
   Umgebung nur ✓ / ⚠. Daten und PDF teilen sich mit der Vorabbesichtigung (vbStellen, vbUmgebung, meldungStatus). Die Vorabbesichtigung selbst bleibt unverändert. */
const FS_B2_TITEL='Besichtigung';
/* F26: Besichtigung 2 hat einen NAMEN (b.protName, Frank 03.10.2026: „kann ich den Namen des Protokolls ändern – auch PDF und Namen“): Liste an der Karte, PDF-Titel, Dateiname.
   Leer = „Besichtigung“ (in der Liste dann wie bisher der Kartenname). Der Dateiname wird auf Buchstaben/Ziffern/Unterstrich gekürzt (Pfadlänge, ⛔ 218-Wächter). */
function _fsB2Name(b){const n=String((b&&b.protName)||'').replace(/\s+/g,' ').trim();return n||FS_B2_TITEL;}
function _fsDateiSlug(text,max){
  return String(text||'').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue').replace(/ß/g,'ss')
    .replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,max||30).replace(/_+$/g,'');
}
// Umbenennen aus der Liste an der Karte („⋯ → ✏ Umbenennen“ am PC, „✏“ am Handy): nur Besichtigung 2
function _fsProtokollUmbenennen(bi){
  try{
    const t=currentTask();const b=t&&Array.isArray(t.pruefberichte)?t.pruefberichte[bi]:null;
    if(!b||!b.schlank){toast('Nur die Besichtigung 2 lässt sich umbenennen','info',3500);return;}
    const neu=prompt('Name des Protokolls (leer = „Besichtigung“)',String(b.protName||'').trim());
    if(neu===null)return;
    b.protName=String(neu).replace(/\s+/g,' ').trim();
    scheduleSave();
    if(typeof renderPruefberichteDesktop==='function')renderPruefberichteDesktop();
    else if(typeof renderDetail==='function')renderDetail(t);
    toast('✓ Name: '+_fsB2Name(b),'success',3000);
  }catch(e){console.warn('[Besichtigung] Umbenennen:',e);}
}
const FS_B2_BLOECKE=[{k:'vorort',t:'Vor Ort',c:'Vor Ort'},{k:'gemeldet',t:'Gemeldet / vorgefunden',c:'Gemeldet'},{k:'stellen',t:'Feststellungen',c:'Feststellungen'},{k:'fotos',t:'Fotos',c:'Fotos'},{k:'raeume',t:'Raumskizze (innen)',c:'Skizze innen'}]; /* F35: der Abschnitt gehört zu „Innen“ */
const FS_B2_STANDARD_ZU=['raeume']; // alles andere offen (wie im Entwurf), nur die Raumskizze startet zugeklappt
const FS_VB_BLOECKE=[{k:'vorort',t:'Vor Ort',c:'Vor Ort'},{k:'gemeldet',t:'Gemeldet und vorgefunden',c:'Gemeldet'},{k:'stellen',t:'Feststellungen – Stelle für Stelle',c:'Stellen'},{k:'umgebung',t:'Umgebung abgehen (Eingrenzen)',c:'Umgebung'},{k:'ergebnis',t:'Ergebnis der Eingrenzung',c:'Ergebnis'},{k:'fotos',t:'Fotos',c:'Fotos'},{k:'vorgeschichte',t:'Vorgeschichte laut Auftraggeber',c:'Vorgeschichte'},{k:'karte',t:'Kartendaten (aus der Karte)',c:'Karte'},{k:'versich',t:'Versicherung, Zugang, Ansprechpartner',c:'Versicherung'},{k:'fest',t:'Einzelpunkte zum Antippen',c:'Einzelpunkte'},{k:'angaben',t:'Vorgeschichte – Fragen (frühere Fassung)',c:'Fragen'},{k:'termin',t:'Termin und Wetter',c:'Wetter'},{k:'raeume',t:'Raumskizze',c:'Skizze'}]; // F20
const FS_VB_STANDARD_ZU=['vorort','gemeldet','stellen','umgebung','ergebnis','fotos','vorgeschichte','karte','versich','fest','angaben','termin','raeume']; // F20, F22 (Frank: „alle immer zugeklappt“): alle Abschnitte starten zugeklappt, Aufklappen merkt sich das Gerät je Protokoll („a:…“)
const FS_VB_SEKTIONEN=[
  {titel:'Schadenbild',items:[
    {k:'V1.1',q:'Sichtbarer Schaden',ok:'Zum Zeitpunkt der Besichtigung war kein Schaden sichtbar.',m:'Sichtbarer Schaden: {}.',mo:'Ein Schaden war sichtbar.',h:'Art des Schadens'},
    {k:'V1.2',typ:'notiz',abh:'V1.1',q:'Lage des Schadens',m:'Lage des Schadens: {}.',h:'Raum, Bauteil, Höhe über Boden'},
    {k:'V1.3',typ:'notiz',abh:'V1.1',q:'Ausdehnung',m:'Ungefähre Ausdehnung: {}.',h:'Zahl und Einheit, z. B. 40 x 60 cm'},
    {k:'V1.4',q:'Nässe oder Wasser',ok:'Es war keine Nässe sichtbar.',m:'Nässe sichtbar: {}.',mo:'Nässe war sichtbar.',h:'wo'},
    {k:'V1.5',q:'Schimmel',ok:'Es war kein Schimmel sichtbar.',m:'Schimmel sichtbar: {}.',mo:'Schimmel war sichtbar.',h:'wo, ungefähre Fläche'},
    {k:'V1.6',q:'Verfärbungen, Risse, abplatzender Putz oder Farbe',ok:'Keine Verfärbungen, Risse, kein abplatzender Putz und keine abplatzende Farbe sichtbar.',m:'Festgestellt: {}.',mo:'Verfärbungen, Risse oder abplatzender Putz bzw. Farbe waren sichtbar.',h:'was, wo'},
    {k:'V1.7',q:'Beschädigte Bauteile',ok:'Es waren keine beschädigten Bauteile sichtbar.',m:'Beschädigte Bauteile: {}.',mo:'Beschädigte Bauteile waren sichtbar.',h:'welche, wo'},
    {k:'V1.8',q:'Geruch',ok:'Es wurde kein auffälliger Geruch wahrgenommen.',m:'Geruch wahrgenommen: {}.',mo:'Ein auffälliger Geruch wurde wahrgenommen.',h:'muffig, modrig, …'}
  ]},
  {titel:'Nicht einsehbar',items:[
    {k:'V2.1',q:'Verdeckte Bauteile',ok:'Alle betroffenen Bauteile waren einsehbar.',m:'Nicht einsehbar waren: {}.',mo:'Betroffene Bauteile waren nicht einsehbar.',h:'was, z. B. hinter Verkleidung oder Möbeln'},
    {k:'V2.2',q:'Räume ohne Zugang',ok:'Alle betroffenen Räume waren zugänglich.',m:'Nicht zugänglich waren: {}.',mo:'Betroffene Räume waren nicht zugänglich.',h:'welche'}
  ]},
  {titel:'Dringlichkeit und Gefahr',items:[
    {k:'V3.1',q:'Austretendes Wasser',ok:'Zum Zeitpunkt der Besichtigung trat kein Wasser aus.',m:'Zum Zeitpunkt der Besichtigung trat Wasser aus: {}.',mo:'Zum Zeitpunkt der Besichtigung trat Wasser aus.',h:'wo'},
    {k:'V3.2',q:'Elektrische Anlagen im Schadenbereich',ok:'Im Schadenbereich waren keine nassen oder beschädigten elektrischen Anlagen erkennbar.',m:'Im Schadenbereich waren elektrische Anlagen nass oder beschädigt: {}.',mo:'Im Schadenbereich waren elektrische Anlagen nass oder beschädigt.',h:'was'},
    {k:'V3.3',q:'Lose oder herabhängende Bauteile',ok:'Es waren keine losen oder herabhängenden Bauteile sichtbar.',m:'Lose oder herabhängende Bauteile: {}.',mo:'Lose oder herabhängende Bauteile waren sichtbar.',h:'was, wo'}
  ]},
  {titel:'Vorhandene Unterlagen',items:[
    {k:'V4.1',q:'Pläne',ok:'Pläne wurden nicht vorgelegt.',m:'Pläne wurden vorgelegt: {}.',mo:'Pläne wurden vorgelegt.',h:'welche'},
    {k:'V4.2',q:'Rechnungen und Reparaturbelege',ok:'Rechnungen und Reparaturbelege wurden nicht vorgelegt.',m:'Rechnungen oder Reparaturbelege wurden vorgelegt: {}.',mo:'Rechnungen oder Reparaturbelege wurden vorgelegt.',h:'welche'},
    {k:'V4.3',q:'Schreiben der Versicherung',ok:'Schreiben der Versicherung wurden nicht vorgelegt.',m:'Schreiben der Versicherung wurden vorgelegt: {}.',mo:'Schreiben der Versicherung wurden vorgelegt.',h:'welche'},
    {k:'V4.4',q:'Frühere Gutachten',ok:'Frühere Gutachten wurden nicht vorgelegt.',m:'Frühere Gutachten wurden vorgelegt: {}.',mo:'Frühere Gutachten wurden vorgelegt.',h:'welche'}
  ]}
];
const FS_VB_ANGABEN=[
  {k:'V5.1',q:'Wann wurde der Schaden bemerkt?'},
  {k:'V5.2',q:'Was ist nach Angabe passiert?'},
  {k:'V5.3',q:'Frühere Schäden, Reparaturen oder Gutachten'},
  {k:'V5.4',q:'Bisherige Maßnahmen, z. B. Trocknung oder Abdichtung'},
  {k:'V5.5',q:'Was hat sich zuletzt geändert?'}
];
function _fsIstVorab(b){return !!b&&b.fassung==='begehung'&&b.art==='vorab';}
/* F21: Feststellungen „Stelle für Stelle“ (Frank 02.10.2026: ein Schaden hält sich nicht an Schubladen – innen die feuchte Decke, außen die Kehle).
   bericht.vbStellen=[{ort, merkmale:[…], text, fotoRefs:[…]}]. Merkmale sind kurze Feststellungen zum Antippen, keine Ursache. PDF: „1 · Ort: Merkmale – Text (Foto 1, 2)“. */
const FS_VB_MERKMALE=['nass','feucht','Schimmel','Verfärbung / Fleck','Riss','Putz / Farbe abgeplatzt','Laub / verstopft','undicht / offen','Geruch'];
const FS_VB_ORTE=['Decke','Wand','Boden','Fenster','Dach','Kehle','Dachrand','Balkon','Ablauf','Fassade','Keller'];
function _fsVbStelleNeu(){return {raum:'',ort:'',merkmale:[],text:'',messwert:'',geraet:'',fotoRefs:[]};} // F22: Raum, Messwert, Gerät
function _fsVbStelleGefuellt(s){return !!s&&(!!String(s.raum||'').trim()||!!String(s.messwert||'').trim()||!!String(s.ort||'').trim()||(Array.isArray(s.merkmale)&&s.merkmale.length>0)||!!String(s.text||'').trim()||(Array.isArray(s.fotoRefs)&&s.fotoRefs.length>0));}
// Nur ausgefüllte Stellen, fortlaufend nummeriert (so stehen sie im PDF und in der Foto-Unterschrift)
// F24: Besichtigung 2 – eine Stelle, die nur einen Raum trägt (gerade angelegt), zählt nicht als ausgefüllt
function _fsVbPinOk(s){return !!s&&!!s.pin&&isFinite(+s.pin.lat)&&isFinite(+s.pin.lon);}
function _fsVbStelleGefuelltS(s){return !!s&&(!!String(s.ort||'').trim()||!!String(s.text||'').trim()||(Array.isArray(s.merkmale)&&s.merkmale.length>0)||(Array.isArray(s.fotoRefs)&&s.fotoRefs.length>0)||_fsVbPinOk(s)||_fsAsMarkeOk(s));}
function _fsVbStellenGefuellt(b){const f=(b&&b.schlank)?_fsVbStelleGefuelltS:_fsVbStelleGefuellt;const out=[];((b&&Array.isArray(b.vbStellen))?b.vbStellen:[]).forEach(s=>{if(f(s)&&_fsB2Sichtbar(b,_fsVbTyp(s)))out.push({s,nr:out.length+1});});return out;} // F28: ausgeblendeter Teil zählt nicht
// F22: Raum und Bauteil zusammen – „Wohnzimmer, Decke“; steht der Raum schon im Bauteil-Feld (ältere Protokolle), wird er nicht doppelt gesetzt
function _fsVbOrtVoll(s){
  if(!s)return '';
  const r=String(s.raum||'').trim(),o=String(s.ort||'').trim();
  if(!r)return o;
  if(o&&o.toLowerCase().indexOf(r.toLowerCase())===0)return o;
  return o?r+', '+o:r;
}
// Satz einer Stelle ohne Nummer und ohne Foto-Hinweis: „Wohnzimmer, Decke: nass, Verfärbung / Fleck – ca. 40 x 60 cm“
function _fsVbStelleSatz(s){
  if(!s)return '';
  const ort=_fsVbOrtVoll(s),mm=(Array.isArray(s.merkmale)?s.merkmale:[]).map(x=>String(x||'').trim()).filter(Boolean).join(', '),tx=String(s.text||'').trim().replace(/\s+/g,' ');
  const mw=String(s.messwert||'').trim(),ge=String(s.geraet||'').trim(),mwTxt=mw?'Messwert '+mw+(ge?' ('+ge+')':''):''; // F22
  const was=[mm,tx,mwTxt].filter(Boolean).join(' – ');
  return ort?(was?ort+': '+was:ort):was;
}
/* F22: EINGRENZEN (Frank 03.10.2026: aus der Meldung „Schaden an der Decke im Wohnzimmer“ den Schaden aufnehmen, eingrenzen und nachvollziehbar machen).
   Ablauf: Meldung (kopf.anlass) → wie gemeldet / abweichend (meldungStatus, meldungAbw) → Stellen (mit Raum, Bauteil, Messwert) → Umgebung abgehen
   (vbUmgebung=[{text, status:'ok'|'auff'|'nicht', grund, stelle}]) → Ergebnis der Eingrenzung (entsteht von selbst). Nur Feststellungen: gesehen, geprüft, nicht geprüft. */
const FS_VB_RAEUME=['Wohnzimmer','Schlafzimmer','Kinderzimmer','Küche','Bad','Flur','Treppenhaus','Keller','Außen'];
const FS_VB_UMGEBUNG={
  Decke:['Wände im Raum','Fenster im Raum','Raum bzw. Wohnung darüber','Dach bzw. Dachboden darüber','Leitungen und Heizkörper in der Nähe','Nachbarräume'],
  Wand:['Nachbarwand','Raum dahinter','Fassade außen','Fenster in der Nähe','Sockel und Boden','Leitungen in der Nähe'],
  Boden:['Wände am Rand','Raum darunter','Anschluss Bad bzw. Küche','Leitungen in der Nähe','Außentür bzw. Schwelle'],
  Fenster:['Laibung','Fensterbank innen und außen','Anschluss an die Fassade','Rollladenkasten'],
  Dach:['Kehle','Dachrand','Durchdringungen','Entwässerung','Dämmung','Raum darunter'],
  Balkon:['Ablauf','Anschluss an die Wand','Brüstung','Raum darunter','Tür und Schwelle'],
  Keller:['Wände innen','Sockel außen','Fallrohr und Entwässerung','Leitungen in der Nähe','Geländeanschluss']
};
const FS_VB_UMGEBUNG_ALIAS={kehle:'Dach',dachrand:'Dach',ablauf:'Dach',fassade:'Wand'};
const FS_VB_STATUS={ok:'geprüft, ohne Auffälligkeit',auff:'geprüft, auffällig',nicht:'nicht geprüft'};
// Bauteile, die in den ausgefüllten Stellen vorkommen (Raum + Bauteil-Feld), als Schlüssel von FS_VB_UMGEBUNG
function _fsVbUmgebungSchluessel(b){
  const out=[];
  _fsVbStellenGefuellt(b).forEach(x=>{
    const t=_fsVbOrtVoll(x.s).toLowerCase();
    Object.keys(FS_VB_UMGEBUNG).forEach(k=>{if(t.indexOf(k.toLowerCase())>=0&&out.indexOf(k)<0)out.push(k);});
    Object.keys(FS_VB_UMGEBUNG_ALIAS).forEach(a=>{const k=FS_VB_UMGEBUNG_ALIAS[a];if(t.indexOf(a)>=0&&out.indexOf(k)<0)out.push(k);});
  });
  return out;
}
// Vorschläge zum Abgehen: nur was noch nicht in der Liste steht
function _fsVbUmgebungVorschlaege(b){
  const da=((b&&Array.isArray(b.vbUmgebung))?b.vbUmgebung:[]).map(r=>String((r&&r.text)||'').trim().toLowerCase());
  const out=[];
  _fsVbUmgebungSchluessel(b).forEach(k=>FS_VB_UMGEBUNG[k].forEach(v=>{if(da.indexOf(v.toLowerCase())<0&&out.indexOf(v)<0)out.push(v);}));
  return out;
}
function _fsVbUmgebungZeilen(b){return ((b&&Array.isArray(b.vbUmgebung))?b.vbUmgebung:[]).filter(r=>r&&FS_VB_STATUS[r.status]&&String(r.text||'').trim()&&_fsB2Sichtbar(b,r.bereich==='aussen'?'aussen':'innen'));} // F28
// F28: Vorschläge für Besichtigung 2 – INNEN aus den Innen-Stellen (Bauteil), AUSSEN aus den Außen-Stellen (Bereich/Wo); nur sichtbare Teile; Rückgabe [{text,bereich}]
function _fsVbUmgebungVorschlaegeB2(b){
  const da=((b&&Array.isArray(b.vbUmgebung))?b.vbUmgebung:[]).map(r=>((r&&r.bereich==='aussen')?'a|':'i|')+String((r&&r.text)||'').trim().toLowerCase());
  const out=[],add=(text,bereich)=>{const k=(bereich==='aussen'?'a|':'i|')+text.toLowerCase();if(da.indexOf(k)<0&&!out.some(o=>o.bereich===bereich&&o.text===text))out.push({text,bereich});};
  ((b&&Array.isArray(b.vbStellen))?b.vbStellen:[]).forEach(s=>{
    if(!_fsVbStelleGefuelltS(s)||!_fsB2Sichtbar(b,_fsVbTyp(s)))return;
    if(_fsVbTyp(s)==='aussen'){
      const t=(_fsVbRaumName(s)+' '+String(s.ort||'')).toLowerCase();
      Object.keys(FS_B2_UMGEBUNG_AUSSEN).forEach(k=>{if(t.indexOf(k.toLowerCase())>=0)FS_B2_UMGEBUNG_AUSSEN[k].forEach(v=>add(v,'aussen'));});
      if(/kehle|dachrand/.test(t))FS_B2_UMGEBUNG_AUSSEN.Dach.forEach(v=>add(v,'aussen'));
    }else{
      const t=_fsVbOrtVoll(s).toLowerCase();
      Object.keys(FS_VB_UMGEBUNG).forEach(k=>{if(t.indexOf(k.toLowerCase())>=0)FS_VB_UMGEBUNG[k].forEach(v=>add(v,'innen'));});
      Object.keys(FS_VB_UMGEBUNG_ALIAS).forEach(a=>{if(t.indexOf(a)>=0)FS_VB_UMGEBUNG[FS_VB_UMGEBUNG_ALIAS[a]].forEach(v=>add(v,'innen'));});
    }
  });
  return out;
}
// Ergebnis der Eingrenzung als Zeilen (Ansicht UND PDF): leer, wenn nichts erfasst ist
function _fsVbErgebnisZeilen(b){
  const out=[];
  const st=_fsVbStellenGefuellt(b).map(x=>'Stelle '+x.nr+' ('+(_fsVbOrtVoll(x.s)||'ohne Ort')+')');
  const z=_fsVbUmgebungZeilen(b);
  const tx=r=>((b&&b.schlank&&r.bereich==='aussen')?'Außen: ':'')+String(r.text).trim(); // F28
  const ok=z.filter(r=>r.status==='ok').map(tx),auff=z.filter(r=>r.status==='auff').map(tx),nicht=z.filter(r=>r.status==='nicht').map(r=>tx(r)+(String(r.grund||'').trim()?' ('+String(r.grund).trim()+')':''));
  if(st.length&&!(b&&b.schlank))out.push('Schaden zeigt sich an: '+st.join('; ')+'.'); // F23: bei Besichtigung 2 stehen die Stellen gleich darunter
  if(ok.length)out.push('Geprüft, ohne Auffälligkeit: '+ok.join(', ')+'.');
  if(auff.length)out.push('Geprüft, auffällig: '+auff.join(', ')+'.');
  if(nicht.length)out.push('Nicht geprüft: '+nicht.join(', ')+'.');
  return out;
}
// Meldung (Anlass) und was vorgefunden wurde – nur wenn „wie gemeldet“ oder „abweichend“ gewählt ist
function _fsVbMeldungZeile(b){
  const a=String((b&&b.kopf&&b.kopf.anlass)||'').trim().replace(/\s+/g,' ');
  if(!b||!a)return '';
  if(b.meldungStatus==='wie')return 'Gemeldet: '+a+(/[.!?]$/.test(a)?'':'.')+' Vorgefunden wie gemeldet.';
  if(b.meldungStatus==='abw'){const w=String(b.meldungAbw||'').trim().replace(/\s+/g,' ');return 'Gemeldet: '+a+(/[.!?]$/.test(a)?'':'.')+' Abweichend vorgefunden'+(w?': '+w:'.');}
  return '';
}
/* F24: BESICHTIGUNG 2 – Raum als Überschrift, Luftbild-Markierung je Stelle (Frank 03.10.2026: „Wohnzimmer, dann Stelle 1, Stelle 2“; „von außen die Stelle kennzeichnen … ich muss das richtige Luftbild auswählen können, mal ist Google besser, mal die anderen“).
   Daten: vbStellen[].raum (wie bisher), vbStellen[].pin={lat,lon}, bericht.luftbildEbene ('th'|'esri'|'google'|'osm' oder ''). Das Luftbild ist Leaflet (steckt in beiden Apps) mit denselben vier Ebenen wie der Dachplan. */
function _fsVbRaumName(s){return String((s&&s.raum)||'').trim();}
/* F28: BESICHTIGUNG 2 – INNEN und AUSSEN (Frank 03.10.2026: „bei Feststellungen müssen wir zwischen innen und außen unterscheiden“; „auch eine Stelle im Wohnzimmer von außen markieren, wenn es hereinregnet“;
   „wenn ich nur eine Außenansicht mache, kann ich Innen ausblenden“; „Seite freiwillig“; „Innen zuerst“; „beim Anlegen fragen“; „Kompassnadel“).
   Je Stelle: typ 'innen'|'aussen' (Gruppe = Raum bzw. Bereich in s.raum), seite (N…NW oder Straßenseite/Hofseite/Giebel, freiwillig), seiteGrad (nur wenn mit dem Kompass gemessen).
   Je Protokoll: zeigeInnen / zeigeAussen (Haken). Ein ausgeblendeter Teil bleibt gespeichert, steht aber nicht im PDF und nicht im Luftbild. */
const FS_B2_RAEUME=['Wohnzimmer','Schlafzimmer','Kinderzimmer','Küche','Bad','Flur','Treppenhaus','Keller'];
const FS_B2_BEREICHE=['Dach','Wand','Fassade','Balkon','Terrasse','Hof / Außenanlage','Sockel'];
const FS_B2_SEITEN=['N','NO','O','SO','S','SW','W','NW'];
const FS_B2_SEITENTEXT={N:'Nord',NO:'Nordost',O:'Ost',SO:'Südost',S:'Süd',SW:'Südwest',W:'West',NW:'Nordwest'};
const FS_B2_SEITENEXTRA=['Straßenseite','Hofseite','Giebel'];
const FS_B2_UMGEBUNG_AUSSEN={
  Dach:['Kehle','Dachrand','Durchdringungen','Entwässerung','Dämmung'],
  Wand:['Fassade','Sockel','Fallrohr','Fenster in der Nähe'],
  Fassade:['Fenster in der Nähe','Fallrohr','Sockel'],
  Balkon:['Ablauf','Anschluss an die Wand','Brüstung'],
  Terrasse:['Ablauf','Anschluss an die Wand'],
  Sockel:['Fallrohr','Geländeanschluss']
};
function _fsSeiteText(k){k=String(k||'').trim();return FS_B2_SEITENTEXT[k]||(FS_B2_SEITENEXTRA.indexOf(k)>=0?k:'');}
// Typ einer Stelle; ältere Besichtigungen (F23–F27) hatten „Außen“ als Raum
function _fsVbTyp(s){return (s&&s.typ==='aussen')?'aussen':(s&&s.typ==='innen')?'innen':(_fsVbRaumName(s)==='Außen'?'aussen':'innen');}
function _fsB2Sichtbar(b,typ){return !(b&&b.schlank)||(typ==='aussen'?b.zeigeAussen!==false:b.zeigeInnen!==false);}
// Draußen zeigt die Wand in die Gegenrichtung der Blickrichtung (du schaust nach Norden → Südseite); drinnen gilt die Blickrichtung selbst (du schaust nach Süden → Südseite)
function _fsWandRichtung(grad,drinnen){const g=((+grad%360)+360)%360,w=drinnen?g:(g+180)%360;return {blick:g,wand:w,seite:FS_B2_SEITEN[Math.round(w/45)%8]};} // F29: DRINNEN schaust du zur Außenwand hinaus → Blickrichtung = Seite; DRAUSSEN schaust du auf die Wand zurück → Gegenrichtung
function _fsBlickWort(grad){const g=((+grad%360)+360)%360;return FS_B2_SEITENTEXT[FS_B2_SEITEN[Math.round(g/45)%8]];}
// Kompass aus den Sensorwinkeln (W3C: alpha, beta, gamma): steht das Gerät aufrecht (über etwa 45°), zeigt die Rückseite (Kamera) die Blickrichtung, liegt es flach, die Oberkante.
function _fsKompassRichtung(alpha,beta,gamma){
  if(![alpha,beta,gamma].every(v=>typeof v==='number'&&isFinite(v)))return null;
  const r=Math.PI/180,a=alpha*r,b=beta*r,g=gamma*r,cA=Math.cos(a),sA=Math.sin(a),cB=Math.cos(b),sB=Math.sin(b),cG=Math.cos(g),sG=Math.sin(g);
  const aufrecht=Math.abs(sB)>0.7;
  const x=aufrecht?-(cG*sA*sB+cA*sG):-cB*sA,y=aufrecht?-(sA*sG-cA*cG*sB):cA*cB;
  let grad=Math.atan2(x,y)/r;if(grad<0)grad+=360;
  return {grad:Math.round(grad)%360,art:aufrecht?'rueck':'oben'};
}
// Bereich außen zu einem Umgebungstext: „Kehle“ → Dach, „Fallrohr“ → Sockel, sonst „Außen“
function _fsB2BereichFuerText(text){
  const t=String(text||'').toLowerCase();
  if(/dach|kehle|durchdring|entwässer|dämm/.test(t))return 'Dach';
  if(/balkon|brüstung/.test(t))return 'Balkon';
  if(/terrasse/.test(t))return 'Terrasse';
  if(/sockel|fallrohr|gelände/.test(t))return 'Sockel';
  if(/wand|fassade|fenster/.test(t))return 'Wand';
  return 'Außen';
}
// Stellen nach Raum gruppiert, in der Reihenfolge des ersten Auftretens; '' = ohne Raum; mit typ nur die Stellen dieses Typs (Besichtigung 2)
function _fsVbRaumGruppen(b,typ){
  const out=[],idx={};
  ((b&&Array.isArray(b.vbStellen))?b.vbStellen:[]).forEach((s,si)=>{
    if(!s)return;
    if(typ&&_fsVbTyp(s)!==typ)return;
    const r=_fsVbRaumName(s);
    if(!Object.prototype.hasOwnProperty.call(idx,r)){idx[r]=out.length;out.push({raum:r,stellen:[]});}
    out[idx[r]].stellen.push({s,si});
  });
  return out;
}
// Bezeichnung: Besichtigung 2 → „Wohnzimmer, Stelle 2“ (gezählt je Raum, nur ausgefüllte davor); sonst „Stelle n“
function _fsVbBezeichnung(b,s,nrGlobal){
  if(!(b&&b.schlank))return 'Stelle '+nrGlobal;
  const r=_fsVbRaumName(s),ty=_fsVbTyp(s);let k=1;
  for(const x of (Array.isArray(b.vbStellen)?b.vbStellen:[])){if(x===s)break;if(x&&_fsVbTyp(x)===ty&&_fsVbRaumName(x)===r&&_fsVbStelleGefuelltS(x))k++;}
  if(ty==='aussen')return 'Außen'+(r&&r!=='Außen'?' – '+r:'')+', Stelle '+k; // F28
  return (r?r+', ':'')+'Stelle '+k;
}
const FS_LB_BREITE=960,FS_LB_HOEHE=640;
const FS_LB_EBENEN=[
  {k:'th',t:'Amtlich (TH)',quelle:'Luftbild © GDI-Th (dl-de/by-2-0)'},
  {k:'esri',t:'Esri',quelle:'Luftbild © Esri, Maxar'},
  {k:'google',t:'Google',quelle:'Luftbild © Google'},
  {k:'osm',t:'Karte',quelle:'Karte © OpenStreetMap-Mitwirkende'}
];
function _fsLbInTH(la,lo){return la>=50.15&&la<=51.75&&lo>=9.80&&lo<=12.75;} // wie beim Dachplan: außerhalb Thüringens Esri
function _fsLbStartEbene(la,lo){return (isFinite(la)&&isFinite(lo)&&_fsLbInTH(la,lo))?'th':'esri';}
function _fsLbKachelUrl(k,z,x,y){
  if(k==='th'){const sz=40075016.68557849/Math.pow(2,z),minx=-20037508.342789244+x*sz,maxy=20037508.342789244-y*sz;return 'https://www.geoproxy.geoportal-th.de/geoproxy/services/DOP?service=WMS&request=GetMap&version=1.3.0&layers=th_dop&styles=&format=image/png&transparent=false&crs=EPSG:3857&bbox='+minx+','+(maxy-sz)+','+(minx+sz)+','+maxy+'&width=256&height=256';}
  if(k==='google')return 'https://mt'+((x+y)%4)+'.google.com/vt/lyrs=s&x='+x+'&y='+y+'&z='+z;
  if(k==='osm')return 'https://'+['a','b','c'][(x+y)%3]+'.tile.openstreetmap.org/'+z+'/'+x+'/'+y+'.png';
  return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/'+z+'/'+y+'/'+x;
}
// Position in „Weltpixeln“ (Web-Mercator, 256-px-Kacheln) bei Zoom z
function _fsLbWeltPx(lat,lon,z){const n=256*Math.pow(2,z),sn=Math.sin(lat*Math.PI/180);return {x:(lon+180)/360*n,y:(0.5-Math.log((1+sn)/(1-sn))/(4*Math.PI))*n};}
/* F29: PIN-FORM (Frank 03.10.2026, Variante A): ein Kreis mit der Nummer NEBEN der Stelle, ein Strich und eine Pfeilspitze, deren Spitze genau auf die Stelle zeigt – die Stelle bleibt frei.
   Der Kreis lässt sich ziehen (Richtung ang in Grad, 0 = rechts, gegen den Uhrzeigersinn; Länge len in Bildpunkten), die Stelle (lat/lon) bleibt. */
const FS_LB_PIN_ANG=225,FS_LB_PIN_LEN=62,FS_LB_PIN_R=18;
function _fsLbPinRing(pin){
  const a=pin&&isFinite(+pin.ang)?((+pin.ang%360)+360)%360:FS_LB_PIN_ANG;
  const l=pin&&isFinite(+pin.len)?Math.max(30,Math.min(160,+pin.len)):FS_LB_PIN_LEN;
  return {ang:a,len:l};
}
// Mitte des Kreises: von der Stelle (px,py) aus in Richtung ang (Grad, 0 = rechts, gegen den Uhrzeigersinn; Bildschirm-y zeigt nach unten) im Abstand len
function _fsLbRingPos(px,py,ang,len){const r=ang*Math.PI/180;return {x:px+Math.cos(r)*len,y:py-Math.sin(r)*len};}
// Alle gesetzten Pins, nummeriert in der Reihenfolge des PDFs (Raum-Gruppen)
function _fsLbPunkte(b){
  const out=[];
  _fsVbRaumGruppen(b).forEach(g=>g.stellen.forEach(x=>{if(_fsVbPinOk(x.s)&&_fsB2Sichtbar(b,_fsVbTyp(x.s))){const r=_fsLbPinRing(x.s.pin);out.push({n:out.length+1,lat:+x.s.pin.lat,lon:+x.s.pin.lon,ang:r.ang,len:r.len,s:x.s,label:_fsVbBezeichnung(b,x.s,x.si+1)});}}));
  return out;
}
// Kacheln, die nur flaches Grau zeigen (Esri „Map data not yet available“), erkennt man an den Bildpunkten d (RGBA): fast alle gleich und grau
function _fsLbKachelLeer(d){
  if(!d||!d.length)return false;
  const zaehl={};let n=0,best=0,bestK='';
  for(let i=0;i+2<d.length;i+=52){
    const r=d[i],g=d[i+1],bl=d[i+2],k=(r>>3)+','+(g>>3)+','+(bl>>3);
    zaehl[k]=(zaehl[k]||0)+1;n++;
    if(zaehl[k]>best){best=zaehl[k];bestK=k;}
  }
  if(!n||best/n<0.8)return false;
  const p=bestK.split(',').map(x=>(+x)*8+4);
  return Math.abs(p[0]-p[1])<=10&&Math.abs(p[1]-p[2])<=10&&p[0]>=110&&p[0]<=245;
}
// Ausschnitt, in dem alle Pins mit Rand liegen: höchster Zoom (höchstens zMax), bei dem es passt
function _fsLbAnsicht(punkte,W,H,zMax){
  if(!punkte||!punkte.length)return null;
  zMax=zMax||19;
  for(let z=zMax;z>=12;z--){
    const q=punkte.map(a=>_fsLbWeltPx(a.lat,a.lon,z)),xs=q.map(a=>a.x),ys=q.map(a=>a.y);
    const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    if(z===12||((x1-x0)<=W-160&&(y1-y0)<=H-160))return {z,cx:(x0+x1)/2,cy:(y0+y1)/2,W,H};
  }
  return null;
}
// Kacheln, die den Ausschnitt decken, mit Versatz im Bild
function _fsLbKacheln(a){
  const out=[],n=Math.pow(2,a.z),ox=a.cx-a.W/2,oy=a.cy-a.H/2;
  for(let ty=Math.floor(oy/256);ty<=Math.floor((oy+a.H)/256);ty++){
    if(ty<0||ty>=n)continue;
    for(let tx=Math.floor(ox/256);tx<=Math.floor((ox+a.W)/256);tx++)out.push({x:((tx%n)+n)%n,y:ty,dx:tx*256-ox,dy:ty*256-oy});
  }
  return out;
}
// Luftbild fürs PDF: Kacheln der gewählten Ebene zusammensetzen und die Pins als nummerierte Kreise einzeichnen.
// Geht nur im Browser; kommt weniger als 60 % der Kacheln an (kein Netz, gesperrt), gibt es null – das PDF nennt dann nur die Lage als Text.
// Kacheln der Ebene k laden und in die Leinwand zeichnen; Rückgabe: wie viele da sind (ok), wie viele nur flaches Grau zeigen (leer)
async function _fsLbKachelnZeichnen(g,a,k){
  const kl=_fsLbKacheln(a);let ok=0,leer=0;
  g.fillStyle='#8a8a8a';g.fillRect(0,0,a.W,a.H);
  await Promise.all(kl.map(t=>new Promise(res=>{
    const i=new Image();i.crossOrigin='anonymous';
    const to=setTimeout(()=>res(),12000);
    i.onload=()=>{
      clearTimeout(to);
      try{
        const dx=Math.round(t.dx),dy=Math.round(t.dy);g.drawImage(i,dx,dy);
        let lr=false;
        if(typeof g.getImageData==='function'){try{const x0=Math.max(0,dx),y0=Math.max(0,dy),w=Math.min(a.W,dx+256)-x0,h=Math.min(a.H,dy+256)-y0;if(w>8&&h>8)lr=_fsLbKachelLeer(g.getImageData(x0,y0,w,h).data);}catch(e){}}
        if(lr)leer++;else ok++;
      }catch(e){}
      res();
    };
    i.onerror=()=>{clearTimeout(to);res();};
    i.src=_fsLbKachelUrl(k,a.z,t.x,t.y);
  })));
  return {n:kl.length,ok,leer};
}
// Pin auf die Leinwand: Kreis mit Nummer, Strich, Pfeilspitze AUF die Stelle (px,py); der Kreis weicht aus, wenn er aus dem Bild liefe
function _fsLbPinZeichnen(g,px,py,n,pin,W,H){
  const r=_fsLbPinRing(pin),R=FS_LB_PIN_R;let ang=r.ang;
  let rp=_fsLbRingPos(px,py,ang,r.len);
  if(rp.x<R+4||rp.x>W-R-4||rp.y<R+4||rp.y>H-R-24){ang=(ang+180)%360;rp=_fsLbRingPos(px,py,ang,r.len);}
  const dx=Math.cos(ang*Math.PI/180),dy=-Math.sin(ang*Math.PI/180),nx=-dy,ny=dx;
  const sx=rp.x-dx*R,sy=rp.y-dy*R,ex=px+dx*16,ey=py+dy*16;
  g.lineCap='round';g.lineJoin='round';
  g.lineWidth=9;g.strokeStyle='#ffffff';g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke(); /* F38: Pfeil dicker */
  g.lineWidth=5;g.strokeStyle='#d9480f';g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke();
  g.beginPath();g.moveTo(px,py);g.lineTo(px+dx*22+nx*10,py+dy*22+ny*10);g.lineTo(px+dx*22-nx*10,py+dy*22-ny*10);g.closePath();g.fillStyle='#d9480f';g.fill();g.lineWidth=2;g.strokeStyle='#ffffff';g.stroke();
  g.beginPath();g.arc(rp.x,rp.y,R,0,2*Math.PI);g.fillStyle='#d9480f';g.fill();g.lineWidth=3;g.strokeStyle='#ffffff';g.stroke();
  g.fillStyle='#ffffff';g.font='bold '+R+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),rp.x,rp.y+1);
}
// Luftbild fürs PDF: Kacheln der gewählten Ebene zusammensetzen und die Pins einzeichnen (F29: Kreis + Strich + Pfeilspitze).
// Geht nur im Browser; kommt weniger als 60 % der Kacheln an (kein Netz, gesperrt) oder zeigen mehr als 20 % nur flaches Grau (Esri „Map data not yet available“), geht es bis zu drei Zoomstufen tiefer;
// klappt es nie, gibt es null – das PDF nennt dann nur die Lage als Text.
async function _fsLuftbildBild(b,ebeneK){
  try{
    if(typeof Image==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return null;
    const pk=_fsLbPunkte(b);if(!pk.length)return null;
    const k=(FS_LB_EBENEN.some(e=>e.k===ebeneK)?ebeneK:_fsLbStartEbene(pk[0].lat,pk[0].lon));
    const a0=_fsLbAnsicht(pk,FS_LB_BREITE,FS_LB_HOEHE,19);if(!a0)return null;
    const c=document.createElement('canvas');c.width=a0.W;c.height=a0.H;
    const g=c.getContext&&c.getContext('2d');if(!g)return null;
    let a=null,gut=false;
    const zMin=Math.max(12,a0.z-3);
    for(let z=a0.z;z>=zMin;z--){
      a=_fsLbAnsicht(pk,FS_LB_BREITE,FS_LB_HOEHE,z);if(!a)return null;
      const r=await _fsLbKachelnZeichnen(g,a,k);
      if(r.ok>=r.n*0.6&&r.leer<=r.n*0.2){gut=true;break;}
    }
    if(!gut)return null;
    pk.forEach(q=>{const w=_fsLbWeltPx(q.lat,q.lon,a.z);_fsLbPinZeichnen(g,w.x-(a.cx-a.W/2),w.y-(a.cy-a.H/2),q.n,q.s.pin,a.W,a.H);});
    const eb=FS_LB_EBENEN.find(e=>e.k===k)||FS_LB_EBENEN[1];
    g.fillStyle='rgba(255,255,255,0.82)';g.fillRect(0,a.H-20,a.W,20);g.fillStyle='#222222';g.font='12px sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText(eb.quelle,6,a.H-10);
    return {dataUrl:c.toDataURL('image/jpeg',0.86),w:a.W,h:a.H,quelle:eb.quelle,ebene:k};
  }catch(e){console.warn('[Luftbild] PDF-Bild:',e);return null;}
}
// F27: zuletzt gesehener Ausschnitt des Luftbilds (gilt für das ganze Protokoll) und wo das Fenster beim Öffnen anfängt
/* F34: Pin im Luftbild FEST oder LOSE (Frank 04.10.2026: „der Pin muss gesperrt werden, dass ich ihn nicht aus Versehen verrücke“).
   'leer' = noch kein Pin (Tippen setzt ihn) · 'fest' = Tippen auf die Karte ändert nichts · 'lose' = nach „✥ Pin verschieben“: Pfeilspitze ziehen, Kreuz oder Tippen */
function _fsLbPinZustand(pinDa,lose){return !pinDa?'leer':(lose?'lose':'fest');}
/* F34: Standort – eine Messung dauert bis FS_LB_GPS_MS; eine neue Ortung wird nur genommen, wenn sie genauer ist als die bisher beste dieser Messung */
const FS_LB_GPS_MS=8000,FS_LB_GPS_GUT=6,FS_LB_GPS_PIN=15;
function _fsLbGpsBesser(alt,neu){if(!neu||!isFinite(+neu.la)||!isFinite(+neu.lo))return false;if(!alt)return true;if(!isFinite(+neu.acc))return false;return !isFinite(+alt.acc)||+neu.acc<+alt.acc;}
function _fsLbGpsUngenau(acc){return !isFinite(+acc)||+acc>FS_LB_GPS_PIN;}
function _fsLbAnsichtGleich(a,b){return _fsLbAnsichtOk(a)&&_fsLbAnsichtOk(b)&&Math.abs(+a.lat-+b.lat)<=2e-6&&Math.abs(+a.lon-+b.lon)<=2e-6&&+a.zoom===+b.zoom;} /* F31: derselbe Ausschnitt (Rundung auf 6 Stellen darf um eine Stelle wackeln) */
function _fsLbAnsichtOk(a){return !!a&&isFinite(+a.lat)&&isFinite(+a.lon)&&isFinite(+a.zoom)&&+a.zoom>=3&&+a.zoom<=22&&Math.abs(+a.lat)<=90&&Math.abs(+a.lon)<=180;}
// Reihenfolge: eigener Pin → zuletzt gesehener Ausschnitt → Pin einer anderen Stelle → Standort der Karte (sonst null: dann wird die Adresse gesucht)
function _fsLbStart(eigene,ansicht,andere,karte){
  if(eigene)return {lat:+eigene.lat,lon:+eigene.lon,zoom:19,quelle:'pin'};
  if(_fsLbAnsichtOk(ansicht))return {lat:+ansicht.lat,lon:+ansicht.lon,zoom:+ansicht.zoom,quelle:'ansicht'};
  if(andere)return {lat:+andere.lat,lon:+andere.lon,zoom:19,quelle:'andere'};
  if(karte)return {lat:+karte.lat,lon:+karte.lon,zoom:19,quelle:'karte'};
  return null;
}
// Adresse → Koordinaten (Photon; in beiden Apps erlaubt); null, wenn nichts gefunden
async function _fsLbGeocode(adresse){
  try{
    const q=String(adresse||'').trim();if(!q)return null;
    const r=await fetch('https://photon.komoot.io/api/?limit=1&lang=de&q='+encodeURIComponent(q));
    const j=await r.json();const c=j&&j.features&&j.features[0]&&j.features[0].geometry&&j.features[0].geometry.coordinates;
    return (c&&isFinite(+c[1])&&isFinite(+c[0]))?{lat:+c[1],lon:+c[0]}:null;
  }catch(e){return null;}
}
// Das Luftbild-Fenster: füllt den Bildschirm, über dem Protokoll. Tippen setzt den Pin der Stelle s; vier Ebenen zum Umschalten.
function _fsLuftbildFenster(bericht,t,s,beiAenderung){
  if(typeof L==='undefined'||!L||typeof L.map!=='function'){toast('Das Luftbild braucht einmal Internet zum Laden','error');return;}
  const old=document.getElementById('_fsLbOverlay');if(old)old.remove();
  const ov=document.createElement('div');ov.id='_fsLbOverlay';_fsSichtAn(ov);
  ov.style.cssText='position:fixed;inset:0;z-index:100001;display:flex;flex-direction:column;background:var(--bg);';
  const kopf=document.createElement('div');kopf.style.cssText='background:#1f5f8b;color:#fff;padding:8px 10px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;flex-shrink:0;';
  const ti=document.createElement('div');ti.style.cssText='flex:1 1 200px;min-width:0;font-size:var(--fs15,15px);font-weight:700;';
  const fertig=document.createElement('button');fertig.type='button';fertig.textContent='✓ Fertig';fertig.setAttribute('data-fs-lbfertig','1');
  fertig.style.cssText='padding:8px 16px;min-height:var(--fsh,42px);border-radius:10px;border:none;background:#fff;color:#1f5f8b;font-size:var(--fs15,15px);font-weight:700;cursor:pointer;font-family:inherit;';
  const weg=document.createElement('button');weg.type='button';weg.textContent='✕ Pin entfernen';weg.setAttribute('data-fs-lbweg','1');
  weg.style.cssText='padding:8px 12px;min-height:var(--fsh,42px);border-radius:10px;border:1.5px solid rgba(255,255,255,.7);background:transparent;color:#fff;font-size:var(--fs14,14px);cursor:pointer;font-family:inherit;';
  const eb=document.createElement('div');eb.style.cssText='display:flex;flex-wrap:wrap;gap:6px;width:100%;';
  const info=document.createElement('div');info.style.cssText='width:100%;font-size:var(--fs12,12px);color:rgba(255,255,255,.85);';
  info.textContent='Auf die Stelle tippen setzt den Pin – danach ist er fest (🔒) und verrutscht nicht mehr. „✥ Pin verschieben“ macht ihn lose: dann die Pfeilspitze mit dem Finger ziehen oder das Kreuz benutzen. Zoomen: Mausrad oder zwei Finger.';
  const akt=document.createElement('div');akt.style.cssText='display:flex;flex-wrap:wrap;gap:6px;width:100%;';
  const aknopf=(txt,attr)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute(attr,'1');b.style.cssText='padding:6px 14px;min-height:var(--fsh,38px);border-radius:10px;border:1.5px dashed rgba(255,255,255,.85);background:transparent;color:#fff;font-size:var(--fs14,14px);cursor:pointer;font-family:inherit;';return b;};
  const gps=aknopf('📍 Mein Standort','data-fs-lbgps'),suche=aknopf('🔎 Adresse suchen','data-fs-lbadresse');
  const pinGps=aknopf('📌 Pin an meinem Standort','data-fs-lbpingps');pinGps.style.display='none';pinGps.style.background='rgba(217,72,15,.9)';pinGps.style.borderStyle='solid'; // F27: erscheint, sobald der Standort gefunden ist
  const zumPin=aknopf('🎯 Zum Pin','data-fs-lbzumpin');zumPin.style.display='none'; /* F34: stellt die Karte wieder auf den Pin */
  akt.append(gps,suche,zumPin,pinGps);
  kopf.append(ti,weg,fertig,eb,akt,info);
  // F27: Karte in einem Rahmen mit Fadenkreuz (Bildmitte), Hinweis „Noch kein Pin“ und dem großen Knopf „📌 Pin hier setzen“
  const mapWrap=document.createElement('div');mapWrap.style.cssText='position:relative;flex:1;min-height:0;';
  const mapEl=document.createElement('div');mapEl.style.cssText='position:absolute;inset:0;';
  const kreuz=document.createElement('div');kreuz.setAttribute('data-fs-lbkreuz','1');kreuz.style.cssText='position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;pointer-events:none;z-index:1100;';
  kreuz.innerHTML='<svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="9" fill="none" stroke="#fff" stroke-width="4"/><circle cx="23" cy="23" r="9" fill="none" stroke="#d9480f" stroke-width="2"/><path d="M23 0v13M23 33v13M0 23h13M33 23h13" stroke="#fff" stroke-width="4"/><path d="M23 0v13M23 33v13M0 23h13M33 23h13" stroke="#d9480f" stroke-width="2"/></svg>';
  const hinweis=document.createElement('div');hinweis.setAttribute('data-fs-lbhinweis','1');hinweis.style.cssText='position:absolute;left:8px;right:8px;top:8px;z-index:1100;background:#d9480f;color:#fff;border-radius:10px;padding:8px 12px;font-size:var(--fs14,14px);font-weight:700;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.4);';
  hinweis.textContent='Noch kein Pin – tippe auf die Karte oder schiebe das Kreuz auf die Stelle und tippe auf 📌.';
  const pinKnopf=document.createElement('button');pinKnopf.type='button';pinKnopf.setAttribute('data-fs-lbpinhier','1');
  const pinLeiste=document.createElement('div');pinLeiste.setAttribute('data-fs-lbpinleiste','1');pinLeiste.style.cssText='position:absolute;left:8px;right:8px;bottom:30px;z-index:1100;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;pointer-events:none;'; /* F34: zwei Knöpfe nebeneinander */
  const PIN_KNOPF='pointer-events:auto;padding:12px 22px;min-height:50px;border-radius:26px;border:3px solid #fff;color:#fff;font-size:var(--fs16,16px);font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 10px rgba(0,0,0,.5);white-space:nowrap;';
  pinKnopf.style.cssText=PIN_KNOPF+'background:#d9480f;';
  const festKnopf=document.createElement('button');festKnopf.type='button';festKnopf.setAttribute('data-fs-lbfest','1');festKnopf.textContent='✓ Pin fest';festKnopf.style.cssText=PIN_KNOPF+'background:#2e7d4f;display:none;';
  pinLeiste.append(pinKnopf,festKnopf);
  mapWrap.append(mapEl,kreuz,hinweis,pinLeiste);
  ov.append(kopf,mapWrap);document.body.appendChild(ov);
  const bez=()=>_fsVbBezeichnung(bericht,s,(bericht.vbStellen||[]).indexOf(s)+1);
  let lose=false,festGesagt=false; /* F34: ein gesetzter Pin ist fest, bis „✥ Pin verschieben“ ihn lose macht */
  const titel=()=>{
    const pin=_fsVbPinOk(s),z=_fsLbPinZustand(pin,lose);
    ti.textContent='Von außen markieren: '+bez()+(z==='leer'?' · noch kein Pin':z==='fest'?' · 🔒 Pin fest':' · Pin lose – verschieben');
    weg.style.display=pin?'':'none';hinweis.style.display=pin?'none':'';
    pinKnopf.textContent=z==='leer'?'📌 Pin hier setzen':z==='fest'?'✥ Pin verschieben':'📌 Pin ans Kreuz';
    festKnopf.style.display=z==='lose'?'':'none';kreuz.style.display=z==='fest'?'none':'';zumPin.style.display=pin?'':'none';
  };
  const adr=String((bericht.kopf&&bericht.kopf.objektAdresse)||(t&&t.adresse)||'').trim(); // F25: die Adresse im Protokoll zuerst, dann die der Karte
  const eigene=_fsVbPinOk(s)?{lat:+s.pin.lat,lon:+s.pin.lon}:null;
  const andere=_fsLbPunkte(bericht).filter(q=>q.s!==s)[0]||null;
  const karte=(t&&isFinite(+t.lat)&&isFinite(+t.lon)&&(+t.lat||+t.lon))?{lat:+t.lat,lon:+t.lon}:null;
  const start=_fsLbStart(eigene,bericht.luftbildAnsicht,andere,karte); // F27: eigener Pin → zuletzt gesehener Ausschnitt → anderer Pin → Standort der Karte
  const map=L.map(mapEl,{zoomControl:true,zoomSnap:0.25,zoomDelta:0.5,wheelPxPerZoomLevel:120});
  map.setView(start?[start.lat,start.lon]:[51.1,10.4],start?start.zoom:6);
  let lay=null,ebK='';
  let gespeichert='';try{gespeichert=localStorage.getItem('pam_fs_luftbild')||'';}catch(e){}
  const wahlEbene=k=>{
    if(!FS_LB_EBENEN.some(e=>e.k===k))k='esri';
    if(lay){try{map.removeLayer(lay);}catch(e){}}
    lay=_fsLbLeafletEbene(k);lay.addTo(map);ebK=k;const ebNeu=bericht.luftbildEbene!==k;bericht.luftbildEbene=k; /* F31: nur speichern, wenn sich die Ebene ändert */
    try{localStorage.setItem('pam_fs_luftbild',k);}catch(e){}
    [...eb.children].forEach(b=>{const an=b.getAttribute('data-fs-lbebene')===k;b.style.background=an?'#fff':'transparent';b.style.color=an?'#1f5f8b':'#fff';b.style.fontWeight=an?'700':'400';});
    if(ebNeu)scheduleSave();
  };
  FS_LB_EBENEN.forEach(e=>{
    const b=document.createElement('button');b.type='button';b.textContent=e.t;b.setAttribute('data-fs-lbebene',e.k);
    b.style.cssText='padding:6px 14px;min-height:var(--fsh,38px);border-radius:18px;border:1.5px solid rgba(255,255,255,.8);background:transparent;color:#fff;font-size:var(--fs14,14px);cursor:pointer;font-family:inherit;';
    b.onclick=()=>wahlEbene(e.k);eb.appendChild(b);
  });
  wahlEbene(bericht.luftbildEbene||gespeichert||_fsLbStartEbene(start&&start.lat,start&&start.lon));
  const gruppe=L.layerGroup().addTo(map);
  // F29: Kreis mit Nummer + Strich + Pfeilspitze AUF die Stelle (Spitze am Ziel, die Stelle bleibt frei); der Kreis des gewählten Pins lässt sich ziehen (Richtung/Länge), die Stelle bleibt
  const pinSvg=(q,aktiv,los)=>{
    const r=_fsLbPinRing(q.s.pin),R=FS_LB_PIN_R,rp=_fsLbRingPos(0,0,r.ang,r.len);
    const dx=Math.cos(r.ang*Math.PI/180),dy=-Math.sin(r.ang*Math.PI/180),nx=-dy,ny=dx,farbe=aktiv?'#d9480f':'#1f5f8b';
    const sx=rp.x-dx*R,sy=rp.y-dy*R,ex=dx*16,ey=dy*16; /* F38: Pfeil dicker, Spitze größer */
    const pts=[[0,0],[dx*22+nx*10,dy*22+ny*10],[dx*22-nx*10,dy*22-ny*10]].map(p=>p.join(',')).join(' ');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="-180 -180 360 360" style="overflow:visible;pointer-events:none">'
      +'<line x1="'+sx+'" y1="'+sy+'" x2="'+ex+'" y2="'+ey+'" stroke="#fff" stroke-width="9" stroke-linecap="round"/><line x1="'+sx+'" y1="'+sy+'" x2="'+ex+'" y2="'+ey+'" stroke="'+farbe+'" stroke-width="5" stroke-linecap="round"/>'
      +'<polygon points="'+pts+'" fill="'+farbe+'" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>'
      +'<g data-ring="1" style="pointer-events:all;cursor:'+((aktiv&&los)?'grab':'default')+';touch-action:none"><circle cx="'+rp.x+'" cy="'+rp.y+'" r="'+R+'" fill="'+farbe+'" stroke="#fff" stroke-width="3"/><text x="'+rp.x+'" y="'+(rp.y+R*0.35)+'" text-anchor="middle" font-size="'+R+'" font-weight="700" fill="#fff" style="pointer-events:none">'+q.n+'</text></g>'
      +((aktiv&&los)?'<g data-ziel="1" style="pointer-events:all;cursor:move;touch-action:none"><circle cx="0" cy="0" r="26" fill="rgba(217,72,15,.2)" stroke="#d9480f" stroke-width="2.5" stroke-dasharray="6 4"/></g>':'')+'</svg>'; /* F34: lose → Griff an der Pfeilspitze (Zielpunkt) */
  };
  const marker=(q,aktiv)=>L.marker([q.lat,q.lon],{interactive:false,keyboard:false,icon:L.divIcon({className:'',iconSize:[360,360],iconAnchor:[180,180],html:pinSvg(q,aktiv,lose)})});
  const zeichneMarker=()=>{
    gruppe.clearLayers();
    _fsLbPunkte(bericht).forEach(q=>{
      const aktiv=q.s===s,m=marker(q,aktiv);
      gruppe.addLayer(m);
      if(aktiv&&lose){ /* F34: Kreis und Pfeilspitze lassen sich nur im losen Zustand ziehen */
        const el=m.getElement(),ring=el&&el.querySelector('[data-ring]');
        const ziel=el&&el.querySelector('[data-ziel]');
        if(ziel)L.DomEvent.on(ziel,'pointerdown',ev=>{ /* Pfeilspitze ziehen: die Stelle (lat/lon) wandert mit dem Finger, die Karte bleibt stehen */
          L.DomEvent.stop(ev);
          const p0=map.latLngToContainerPoint([+s.pin.lat,+s.pin.lon]),m0=map.mouseEventToContainerPoint(ev),ox=p0.x-m0.x,oy=p0.y-m0.y;
          const bewegeZ=e2=>{const mp=map.mouseEventToContainerPoint(e2),ll=map.containerPointToLatLng([mp.x+ox,mp.y+oy]);s.pin.lat=Math.round(ll.lat*1e6)/1e6;s.pin.lon=Math.round(ll.lng*1e6)/1e6;m.setLatLng([s.pin.lat,s.pin.lon]);};
          const endeZ=()=>{document.removeEventListener('pointermove',bewegeZ,true);document.removeEventListener('pointerup',endeZ,true);document.removeEventListener('pointercancel',endeZ,true);scheduleSave();zeichneMarker();};
          document.addEventListener('pointermove',bewegeZ,true);document.addEventListener('pointerup',endeZ,true);document.addEventListener('pointercancel',endeZ,true);
        });
        if(ring)L.DomEvent.on(ring,'pointerdown',ev=>{
          L.DomEvent.stop(ev);
          const rc=el.getBoundingClientRect(),cx=rc.left+rc.width/2,cy=rc.top+rc.height/2;
          const bewege=e2=>{const dx=e2.clientX-cx,dy=e2.clientY-cy;s.pin.len=Math.round(Math.max(30,Math.min(160,Math.hypot(dx,dy))));s.pin.ang=Math.round((Math.atan2(-dy,dx)*180/Math.PI+360)%360);el.innerHTML=pinSvg(Object.assign({},q,{s:s}),true,true);};
          const ende=()=>{document.removeEventListener('pointermove',bewege,true);document.removeEventListener('pointerup',ende,true);document.removeEventListener('pointercancel',ende,true);scheduleSave();zeichneMarker();}; /* F31: auch bei abgebrochener Berührung (pointercancel) */
          document.addEventListener('pointermove',bewege,true);document.addEventListener('pointerup',ende,true);document.addEventListener('pointercancel',ende,true);
        });
      }
    });
    titel();
  };
  const setzePin=(la,lo)=>{const alt=_fsVbPinOk(s)?s.pin:null;s.pin={lat:Math.round(la*1e6)/1e6,lon:Math.round(lo*1e6)/1e6};if(alt){if(isFinite(+alt.ang))s.pin.ang=+alt.ang;if(isFinite(+alt.len))s.pin.len=+alt.len;}if(!alt)lose=false;scheduleSave();zeichneMarker();}; // F29: Kreis-Lage bleibt beim Verschieben der Stelle
  map.on('click',e=>{if(_fsLbPinZustand(_fsVbPinOk(s),lose)==='fest'){if(!festGesagt){festGesagt=true;toast('Der Pin ist fest – zum Ändern „✥ Pin verschieben“ antippen','info',3500);}return;}setzePin(e.latlng.lat,e.latlng.lng);}); /* F34: ein fester Pin verrutscht beim Tippen nicht */
  pinKnopf.onclick=()=>{if(_fsLbPinZustand(_fsVbPinOk(s),lose)==='fest'){lose=true;zeichneMarker();return;}const c=map.getCenter();setzePin(c.lat,c.lng);};
  festKnopf.onclick=()=>{lose=false;zeichneMarker();};
  zumPin.onclick=()=>{if(_fsVbPinOk(s)){try{map.setView([+s.pin.lat,+s.pin.lon],Math.max(map.getZoom(),18));}catch(e){}}}; // F27: Pin in die Bildmitte (Fadenkreuz)
  weg.onclick=()=>{s.pin=null;lose=false;scheduleSave();zeichneMarker();};
  // F25: „Mein Standort“ springt zum GPS-Standort des Geräts (blauer Punkt; am PC ungenau), „Adresse suchen“ zur Adresse im Protokoll
  let gpsMarker=null,gpsKreis=null,gpsPos=null,gpsWatch=null,gpsUhr=null,gpsLauf=null; /* F34: gpsLauf = beste Ortung der laufenden Messung */
  const gpsStopp=()=>{
    if(gpsWatch!==null){try{navigator.geolocation.clearWatch(gpsWatch);}catch(e){}gpsWatch=null;}
    if(gpsUhr){clearTimeout(gpsUhr);gpsUhr=null;}
    gps.disabled=false;gps.textContent='📍 Mein Standort'+((gpsPos&&isFinite(gpsPos.acc))?' (± '+Math.round(gpsPos.acc)+' m)':'');
  };
  gps.onclick=()=>{
    if(!navigator.geolocation){toast('Dieses Gerät kann den Standort nicht bestimmen','error',4500);return;}
    gpsStopp();gpsLauf=null;gps.disabled=true;gps.textContent='📍 messe …';
    gpsUhr=setTimeout(()=>{gpsUhr=null;const l=gpsLauf;gpsStopp();if(!l)toast('Standort nicht verfügbar – bitte den Zugriff auf den Standort erlauben','error',5000);else if(!isFinite(l.acc)||l.acc>50)toast('Standort nur auf etwa '+Math.round(l.acc)+' m genau','info',4500);},FS_LB_GPS_MS);
    gpsWatch=navigator.geolocation.watchPosition(pos=>{ /* F34: einige Sekunden nachmessen statt die erste (oft grobe) Antwort zu nehmen */
      const la=pos.coords.latitude,lo=pos.coords.longitude,acc=+pos.coords.accuracy,neuP={la:la,lo:lo,acc:acc};
      if(!_fsLbGpsBesser(gpsLauf,neuP))return;
      const erste=!gpsLauf;gpsLauf=neuP;
      gpsPos=neuP;pinGps.style.display='';gps.textContent='📍 messe … ± '+(isFinite(acc)?Math.round(acc):'?')+' m';
      try{if(erste)map.setView([la,lo],19);if(gpsMarker)map.removeLayer(gpsMarker);if(gpsKreis)map.removeLayer(gpsKreis);gpsKreis=L.circle([la,lo],{radius:isFinite(acc)?acc:0,color:'#1a73e8',weight:1,fillColor:'#1a73e8',fillOpacity:0.12,interactive:false}).addTo(map);gpsMarker=L.circleMarker([la,lo],{radius:8,color:'#ffffff',weight:3,fillColor:'#1a73e8',fillOpacity:1,interactive:false}).addTo(map);}catch(e){} /* F34: heller Kreis = so ungenau ist die Ortung */
      if(isFinite(acc)&&acc<=FS_LB_GPS_GUT)gpsStopp(); /* genau genug – nicht weiter messen */
    },()=>{if(gpsLauf)return;gpsStopp();toast('Standort nicht verfügbar – bitte den Zugriff auf den Standort erlauben','error',5000);},{enableHighAccuracy:true,timeout:15000,maximumAge:0}); /* F34: maximumAge 0 = immer frisch messen */
  };
  pinGps.onclick=()=>{
    if(!gpsPos)return;
    if(_fsLbPinZustand(_fsVbPinOk(s),lose)==='fest'){toast('Der Pin ist fest – erst „✥ Pin verschieben“ antippen','info',3500);return;}
    if(_fsLbGpsUngenau(gpsPos.acc)&&!confirm('Der Standort ist nur auf etwa ± '+(isFinite(gpsPos.acc)?Math.round(gpsPos.acc):'?')+' m genau.\n\nTrotzdem den Pin dorthin setzen?\n\nGenauer geht es mit dem Kreuz: Karte schieben, bis es auf der Stelle liegt.'))return;
    setzePin(gpsPos.la,gpsPos.lo);
  }; // F27: Pin genau an den Standort des Geräts
  suche.onclick=async()=>{
    if(!adr){toast('Im Protokoll und an der Karte steht keine Adresse','info',4000);return;}
    suche.disabled=true;suche.textContent='🔎 suche …';
    const r=await _fsLbGeocode(adr);
    suche.disabled=false;suche.textContent='🔎 Adresse suchen';
    if(r&&document.getElementById('_fsLbOverlay')===ov)map.setView([r.lat,r.lon],19);
    else if(!r)toast('Adresse „'+adr+'“ nicht gefunden','info',5000);
  };
  const zu=()=>{
    try{const c=map.getCenter(),neuA={lat:Math.round(c.lat*1e6)/1e6,lon:Math.round(c.lng*1e6)/1e6,zoom:map.getZoom()};if(!_fsLbAnsichtGleich(bericht.luftbildAnsicht,neuA)){bericht.luftbildAnsicht=neuA;scheduleSave();}}catch(e){} /* F31: nur wenn der Ausschnitt sich geändert hat */ // F27: Ausschnitt merken (auch ohne Pin)
    gpsStopp();try{map.remove();}catch(e){}ov.remove();document.removeEventListener('keydown',taste,true);if(typeof beiAenderung==='function')beiAenderung();
  };
  const schliessen=()=>{if(!_fsVbPinOk(s)&&!confirm('Es ist noch kein Pin gesetzt – wirklich schließen?\n\nOhne Pin wird nur der Kartenausschnitt gemerkt.'))return;zu();}; // F27
  const taste=e=>{if(e.key==='Escape'){e.stopPropagation();schliessen();}};
  document.addEventListener('keydown',taste,true);
  fertig.onclick=schliessen;
  zeichneMarker();
  setTimeout(()=>{try{map.invalidateSize();}catch(e){}},60);
  if(!start){ // kein Standort an der Karte: Adresse suchen
    _fsLbGeocode(adr).then(r=>{if(r&&document.getElementById('_fsLbOverlay')===ov){map.setView([r.lat,r.lon],19);if(!bericht.luftbildEbene||bericht.luftbildEbene===ebK)wahlEbene(_fsLbStartEbene(r.lat,r.lon));}else if(!r)toast('Adresse nicht gefunden – bitte auf der Karte zur Stelle zoomen','info',5000);});
  }
}
/* F30: STELLEN ZUKLAPPEN (Frank 03.10.2026: „das nimmt ganz schön viel Platz weg“ → „bau 1–3 und 6“). Besichtigung 2: jede Stelle lässt sich auf EINE Zeile zuklappen
   („▸ Außen – Dach, Stelle 1 · Kehle über dem Wohnzimmer · Seite Süd · 📍 · 📷 2“). Standard: ZU – nur die gerade angelegte/geöffnete Stelle ist offen; „＋ Stelle“ klappt alle anderen zu;
   je Raum/Bereich „alle zu / alle auf“. Hat das Protokoll nur EINE Stelle, ist sie offen. Nur Anzeige (nicht im Protokoll, geht nicht auf andere Geräte), Eingaben bleiben erhalten. */
/* F35: AUFRÄUMEN (Frank 04.10.2026, Foto vom Tablet: „Würdest du das als übersichtlich bezeichnen?“ → Entwurf besichtigung2_aufraeumen_entwurf.html → „bau alles“). */
/* „Stelle n“ – die Nummer wie in der vollen Bezeichnung („Außen – Dach, Stelle 2“ → „Stelle 2“); PDF, Foto-Unterschrift und Legende behalten die volle Bezeichnung */
function _fsStelleNrText(b,s){return 'Stelle '+(_fsAsNummer(b,s)||1);}
/* Abschnitte der Besichtigung 2: die Raumskizze gehört zu „Innen“ – ist Innen ausgeblendet, entfällt der Abschnitt (die Außenskizze sitzt beim Bereich) */
function _fsB2Bloecke(b){return FS_B2_BLOECKE.filter(x=>x.k!=='raeume');} /* F36: die Skizze sitzt innen wie außen beim Raum/Bereich – der eigene Abschnitt entfällt in Besichtigung 2 */
/* Auswahl „weiterer Raum/Bereich“: Namen, die es schon gibt, stehen nicht mehr in der Liste (dafür gibt es dort „＋ Stelle“) */
function _fsWeitereNamen(namen,da){const d=Array.isArray(da)?da:[];return (Array.isArray(namen)?namen:[]).filter(n=>d.indexOf(n)<0);}
/* ob die Auswahl gerade aufgeklappt ist – nur Anzeige, je Protokoll und Teil (innen/außen), nicht im Protokoll */
const _fsWeiterMerk=new WeakMap();
function _fsWeiterOffen(b,typ){const m=b&&_fsWeiterMerk.get(b);return !!(m&&m[typ]);}
function _fsWeiterSetzen(b,typ,auf){if(!b||typeof b!=='object')return;const m=_fsWeiterMerk.get(b)||{};m[typ]=!!auf;_fsWeiterMerk.set(b,m);}
/* Mini-Bild einer Außenskizze für die zugeklappte Zeile; nur neu gezeichnet, wenn sich die Skizze geändert hat */
const _fsAsMiniMerk=new WeakMap();
function _fsAsMini(b,sk){
  try{
    const sig=JSON.stringify([sk,_fsAsMarken(b,sk).map(q=>[q.n,q.x,q.y,q.ang,q.len])]),m=_fsAsMiniMerk.get(sk);
    if(m&&m.sig===sig)return m.url;
    const url=_fsBgSkizzeBild(b,_fsAsPseudoRaum(sk));
    _fsAsMiniMerk.set(sk,{sig:sig,url:url});
    return url;
  }catch(e){return null;}
}
const _fsStelleAuf=new WeakSet(),_fsStelleZu=new WeakSet();
/* F31: bei welchen Stellen die Seiten-Auswahl (elf Knöpfe) gerade aufgeklappt ist – nur Anzeige, nicht im Protokoll */
const _fsSeiteAuf=new WeakSet();
/* F31: Text der Seiten-Zeile: „Südost“, mit Kompass „Südost · gemessen 135°“, ohne Seite „keine gewählt (freiwillig)“ */
function _fsSeiteZeile(s){const t=_fsSeiteText(s&&s.seite);if(!t)return 'keine gewählt (freiwillig)';return t+((s&&typeof s.seiteGrad==='number'&&isFinite(s.seiteGrad))?' · gemessen '+Math.round(s.seiteGrad)+'°':'');}
function _fsStelleOffen(b,s){const n=(b&&Array.isArray(b.vbStellen))?b.vbStellen.filter(x=>x).length:0;return _fsStelleAuf.has(s)||(n<=1&&!_fsStelleZu.has(s));}
function _fsStelleSetzen(s,auf){if(!s)return;if(auf){_fsStelleAuf.add(s);_fsStelleZu.delete(s);}else{_fsStelleAuf.delete(s);_fsStelleZu.add(s);}}
// Eine Zeile für die zugeklappte Stelle: Bezeichnung · Wo (oder Anfang des Textes) · Seite · 📍 (Pin) · 📷 Anzahl Fotos; ganz leer → „noch leer“
function _fsStelleKurz(b,s,nr,kurz){
  const kuerzen=(x,n)=>{x=String(x||'').trim().replace(/\s+/g,' ');return x.length>n?x.slice(0,n-1)+'…':x;};
  const t=[kurz?_fsStelleNrText(b,s):_fsVbBezeichnung(b,s,nr)]; /* F35: kurz = nur „Stelle n“ (im Formular unter der Überschrift des Raums/Bereichs) */
  const wo=kuerzen(s&&s.ort,38),tx=kuerzen(s&&s.text,38);
  if(wo)t.push(wo);else if(tx)t.push(tx);
  const se=_fsSeiteText(s&&s.seite);if(se)t.push('Seite '+se);
  if(_fsVbPinOk(s))t.push('📍');
  if(_fsAsMarkeOk(s))t.push('✏'); /* F33: steht in einer Außenskizze */
  const nf=((s&&Array.isArray(s.fotoRefs))?s.fotoRefs:[]).filter(r=>((b&&b.fotos)||[]).some(f=>_fsRefPasst(f,r))).length;
  if(nf)t.push('📷 '+nf);
  if(t.length===1)t.push('noch leer');
  return t.join(' · ');
}
/* F29: Kompass-Verfolger – merkt sich die letzte Blickrichtung (nur Handy/Tablet), damit ein Foto sie mitnehmen kann. Läuft, solange das Protokoll offen ist.
   Android startet ohne Nachfrage; das iPhone erst, wenn in der Nadel einmal „Kompass einschalten“ erlaubt wurde. */
/* ── F33: AUSSENSKIZZE (Besichtigung 2) ──────────────────────────────────────────────────────────────────────────────
   Am Protokoll: aussenSkizzen = [{id, an:true, aussen:'wand'|'dach', bereich (Name des Außen-Bereichs), name, oben ('' oder N…NW, nur Dach), striche, stempel}].
   Striche und Stempel sind dieselben Daten wie in der Raumskizze (Anteile 0…1 der 900×640-Fläche) – derselbe Zeichner, dasselbe Zeichenfenster.
   Eine Stelle steht höchstens in EINER Skizze: stelle.skz = {k: Kennung der Skizze, x, y}. Die Nummer ist die der Stelle („Außen – Wand, Stelle 2“ → 2);
   Fotos hängen weiter an der Stelle. Nicht maßstäblich. */
const FS_AS_FLAECHEN=[{k:'wand',t:'Wand (von vorn)'},{k:'dach',t:'Dachfläche (von oben)'}];
/* F36: dieselbe Skizze auch INNEN beim Raum (Frank 04.10.2026, Entwurf besichtigung2_raumskizze_entwurf.html → „baue“): skizze.typ='innen', Ansichten Raum von oben / Wand von vorn / Decke von unten.
   Die Ansicht steht weiter im Feld „aussen“ (raum · iwand · decke bzw. wand · dach) – es ist zugleich das Kennzeichen „neue Skizze“ für den Zeichner. Keine Maße, keine Wand-Arten. */
const FS_AS_FLAECHEN_INNEN=[{k:'raum',t:'Raum (von oben)'},{k:'iwand',t:'Wand (von vorn)'},{k:'decke',t:'Decke (von unten)'}];
function _fsAsTyp(sk){return (sk&&sk.typ==='innen')?'innen':'aussen';}
function _fsAsFlaechen(sk){return _fsAsTyp(sk)==='innen'?FS_AS_FLAECHEN_INNEN:FS_AS_FLAECHEN;}
function _fsAsAnsicht(sk){const k=sk&&sk.aussen;return (k==='dach'||k==='raum')?'von oben':k==='decke'?'von unten':'von vorn';}
function _fsAsFarbe(sk){const k=sk&&sk.aussen;return k==='dach'?'#f1f1ee':k==='raum'?'#eef4f9':k==='decke'?'#f4f4f4':'#faf7f0';}
const FS_AS_STEMPEL={wand:[{t:'afenster',n:'Fenster'},{t:'atuer',n:'Tür'},{t:'fbank',n:'Fensterbank'},{t:'rohr',n:'Fallrohr'},{t:'rinne',n:'Dachrinne'},{t:'text',n:'Text'}],dach:[{t:'dfenster',n:'Dachfenster'},{t:'schorn',n:'Schornstein'},{t:'gully',n:'Ablauf'},{t:'kuppel',n:'Lichtkuppel'},{t:'rinne',n:'Dachrinne'},{t:'wandan',n:'Wandanschluss'},{t:'pult',n:'Pult'},{t:'text',n:'Text'}],
  raum:[{t:'tuer',n:'Tür'},{t:'fenster',n:'Fenster'},{t:'schrank',n:'Schrank'},{t:'heiz',n:'Heizkörper'},{t:'text',n:'Text'}],iwand:[{t:'afenster',n:'Fenster'},{t:'atuer',n:'Tür'},{t:'heiz',n:'Heizkörper'},{t:'steck',n:'Steckdose'},{t:'text',n:'Text'}],decke:[{t:'lampe',n:'Lampe'},{t:'dfenster',n:'Dachfenster'},{t:'text',n:'Text'}]}; /* F36: zweite Zeile = innen */
const FS_AS_MAX=12;
const _fsAsAuf=new WeakSet(); /* welche Skizzen im Formular aufgeklappt sind – nur Anzeige */
function _fsAsListe(b){return (b&&Array.isArray(b.aussenSkizzen))?b.aussenSkizzen.filter(k=>k&&k.id):[];}
function _fsAsFuerBereich(b,bereich,typ){return _fsAsListe(b).filter(k=>k.bereich===bereich&&(!typ||_fsAsTyp(k)===typ));} /* F36: mit typ nur die Skizzen dieses Teils (ein Raum und ein Außen-Bereich können gleich heißen) */
/* Neue Skizze für einen Bereich; „Dach“ im Namen → Dachfläche, sonst Wand. null, wenn die Obergrenze erreicht ist */
function _fsAsNeu(b,bereich,typ){
  if(!b)return null;
  if(!Array.isArray(b.aussenSkizzen))b.aussenSkizzen=[];
  if(_fsAsListe(b).length>=FS_AS_MAX)return null;
  const br=String(bereich||''),ty=typ==='innen'?'innen':'aussen',n=_fsAsFuerBereich(b,br,ty).length;
  const k={id:'as'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),an:true,typ:ty,aussen:ty==='innen'?'raum':(/dach/i.test(br)?'dach':'wand'),bereich:br,name:(br.trim()||(ty==='innen'?'Raum':'Außen'))+(n?' '+(n+1):''),oben:'',striche:[],stempel:[]};
  b.aussenSkizzen.push(k);return k;
}
function _fsAsMarkeOk(s){return !!s&&!!s.skz&&typeof s.skz.k==='string'&&!!s.skz.k&&isFinite(+s.skz.x)&&isFinite(+s.skz.y);}
/* Stellen, die in dieser Skizze stehen können: außen, im selben Bereich */
function _fsAsStellen(b,sk){return ((b&&Array.isArray(b.vbStellen))?b.vbStellen:[]).filter(s=>s&&sk&&_fsVbTyp(s)===_fsAsTyp(sk)&&_fsVbRaumName(s)===sk.bereich);}
function _fsAsNummer(b,s){const m=/Stelle ([0-9]+)$/.exec(_fsVbBezeichnung(b,s,0));return m?+m[1]:0;}
function _fsAsMarken(b,sk){return _fsAsStellen(b,sk).filter(s=>_fsAsMarkeOk(s)&&s.skz.k===sk.id).map(s=>({s:s,n:_fsAsNummer(b,s),x:+s.skz.x,y:+s.skz.y,ang:_fsAsRing(s.skz).ang,len:_fsAsRing(s.skz).len,label:_fsVbBezeichnung(b,s,0)}));}
/* Marke setzen oder verschieben (Anteile 0…1, 3 Stellen, bleibt auf der Fläche); eine Stelle steht damit nur noch in DIESER Skizze */
function _fsAsMarkeSetzen(sk,s,x,y){
  if(!sk||!sk.id||!s||!isFinite(+x)||!isFinite(+y))return false;
  const alt=(_fsAsMarkeOk(s)&&s.skz.k===sk.id)?s.skz:null; /* F34: die Lage des Kreises (Richtung/Länge) bleibt beim Verschieben der Stelle */
  s.skz={k:sk.id,x:Math.round(Math.max(0.03,Math.min(0.97,+x))*1000)/1000,y:Math.round(Math.max(0.04,Math.min(0.96,+y))*1000)/1000};
  if(alt){if(isFinite(+alt.ang))s.skz.ang=+alt.ang;if(isFinite(+alt.len))s.skz.len=+alt.len;}
  return true;
}
function _fsAsMarkeWeg(s){if(s&&s.skz){s.skz=null;return true;}return false;}
/* Skizze entfernen: aus der Liste, und die Marken der Stellen, die in ihr standen */
function _fsAsWeg(b,sk){
  if(!b||!sk||!Array.isArray(b.aussenSkizzen))return false;
  const i=b.aussenSkizzen.indexOf(sk);if(i<0)return false;
  b.aussenSkizzen.splice(i,1);
  (Array.isArray(b.vbStellen)?b.vbStellen:[]).forEach(s=>{if(_fsAsMarkeOk(s)&&s.skz.k===sk.id)s.skz=null;});
  return true;
}
function _fsAsBenutzt(b,sk){return _fsBgStempelAnzahl(sk)>0||_fsBgStricheAnzahl(sk)>0||_fsAsMarken(b,sk).length>0;}
/* Beschriftung der vier Ränder [oben, rechts, unten, links]: Wand fest; Dach nur, wenn „oben ist …“ gewählt wurde (dann im Uhrzeigersinn weiter) */
function _fsAsRaender(sk){
  if(sk&&(sk.aussen==='raum'||sk.aussen==='decke'))return ['Wand 3','Wand 4','Wand 1','Wand 2']; /* F36: Raum von oben / Decke von unten – Wand 1 liegt unten */
  if(sk&&sk.aussen==='iwand')return ['Decke','rechts','Boden','links'];
  if(!sk||sk.aussen!=='dach')return ['oben','rechts','unten','links'];
  const i=FS_B2_SEITEN.indexOf(sk.oben);
  if(i<0)return ['','','',''];
  return [0,2,4,6].map(d=>FS_B2_SEITENTEXT[FS_B2_SEITEN[(i+d)%8]]);
}
/* Eine Zeile für die zugeklappte Skizze */
function _fsAsKurz(b,sk){
  const t=['Skizze: '+(String((sk&&sk.name)||'').trim()||'Außen')];
  const nm=_fsAsMarken(b,sk).length,ns=_fsBgStempelAnzahl(sk),nl=(sk&&Array.isArray(sk.striche))?sk.striche.length:0;
  if(nm)t.push(nm+' Stelle'+(nm===1?'':'n'));
  if(ns)t.push(ns+' Stempel');
  if(nl)t.push(nl+' Strich'+(nl===1?'':'e'));
  if(t.length===1)t.push('noch leer');
  return t.join(' · ');
}
/* Die Zeichen- und Stempelfunktionen der Raumskizze erwarten einen „Raum“ mit .name und .skizze – die Außenskizze reicht sich so hinein */
function _fsAsPseudoRaum(sk){return {name:(String((sk&&sk.name)||'').trim()||'Außen'),skizze:sk};}
function _fsStempelListe(sk){return (sk&&sk.aussen&&FS_AS_STEMPEL[sk.aussen])||FS_BG_STEMPEL;}
/* Marken: orangefarbener Kreis mit der Nummer der Stelle; sel = im Zeichenfenster gewählte Stelle (blauer Ring, nie im gespeicherten Bild) */
/* F34: Die Nummer steht NEBEN der Stelle (Frank 04.10.2026: „den Punkt musst du mir auch mit so einem Pfeil machen“): Kreis mit Nummer, Strich, Pfeilspitze AUF die Stelle – wie der Pin im Luftbild.
   stelle.skz bekommt dazu ang (Grad, 0 = rechts, gegen den Uhrzeigersinn) und len (Bildpunkte der 900×640-Fläche, 50…220); ohne Angabe 225° / 90. */
const FS_AS_PIN_ANG=225,FS_AS_PIN_LEN=90,FS_AS_PIN_R=26;
function _fsAsRing(z){
  const a=(z&&isFinite(+z.ang))?((+z.ang%360)+360)%360:FS_AS_PIN_ANG;
  const l=(z&&isFinite(+z.len))?Math.max(50,Math.min(220,+z.len)):FS_AS_PIN_LEN;
  return {ang:a,len:l};
}
function _fsAsRingSetzen(s,ang,len){
  if(!_fsAsMarkeOk(s)||!isFinite(+ang)||!isFinite(+len))return false;
  s.skz.ang=Math.round(((+ang%360)+360)%360)%360;s.skz.len=Math.round(Math.max(50,Math.min(220,+len)));
  return true;
}
/* Lage in Bildpunkten: px/py = die Stelle (Pfeilspitze), x/y = Mitte des Kreises; liefe der Kreis aus der Fläche, zeigt er zur anderen Seite */
function _fsAsRingLage(q,W,H){
  const px=q.x*W,py=q.y*H,R=FS_AS_PIN_R;let ang=q.ang,rp=_fsLbRingPos(px,py,ang,q.len);
  if(rp.x<R+4||rp.x>W-R-4||rp.y<R+4||rp.y>H-R-4){ang=(ang+180)%360;rp=_fsLbRingPos(px,py,ang,q.len);}
  return {px:px,py:py,x:rp.x,y:rp.y,ang:ang};
}
/* Was liegt an dieser Stelle der Fläche (Bildpunkte)? {s, teil:'ring'|'ziel'} – der Kreis geht vor, die oberste Marke gewinnt; null = nichts. Großzügig, damit der Finger trifft. */
function _fsAsTreffer(b,sk,px,py){
  const W=FS_BG_SKIZZE_W,H=FS_BG_SKIZZE_H,l=_fsAsMarken(b,sk);
  for(let i=l.length-1;i>=0;i--){
    const L=_fsAsRingLage(l[i],W,H);
    if(Math.hypot(L.x-px,L.y-py)<=FS_AS_PIN_R+12)return {s:l[i].s,teil:'ring'};
    if(Math.hypot(L.px-px,L.py-py)<=32)return {s:l[i].s,teil:'ziel'};
  }
  return null;
}
/* F34: neue Stelle direkt aus dem Zeichenfenster – außen, im Bereich der Skizze, mit kurzer Beschreibung (Wo?) */
function _fsAsStelleNeu(b,sk,ort){
  if(!b||!sk)return null;
  if(!Array.isArray(b.vbStellen))b.vbStellen=[];
  const sn=_fsVbStelleNeu();sn.typ=_fsAsTyp(sk);sn.raum=String(sk.bereich||'');sn.seite='';sn.seiteGrad=null;sn.ort=String(ort||'').trim();
  b.vbStellen.push(sn);return sn;
}
/* sel = im Zeichenfenster gewählte Stelle (blauer Ring um den Kreis), lose = sie lässt sich gerade verschieben (gestrichelter Griff an der Pfeilspitze) – beides nie im gespeicherten Bild */
function _fsAsMarkenZeichnen(g,b,sk,sel,lose){
  const W=FS_BG_SKIZZE_W,H=FS_BG_SKIZZE_H,R=FS_AS_PIN_R;
  _fsAsMarken(b,sk).forEach(q=>{
    const L=_fsAsRingLage(q,W,H),dx=Math.cos(L.ang*Math.PI/180),dy=-Math.sin(L.ang*Math.PI/180),nx=-dy,ny=dx;
    const sx=L.x-dx*R,sy=L.y-dy*R,ex=L.px+dx*20,ey=L.py+dy*20;
    g.lineCap='round';g.lineJoin='round';
    g.lineWidth=12;g.strokeStyle='#ffffff';g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke(); /* F38: Pfeil dicker */
    g.lineWidth=6;g.strokeStyle='#d9480f';g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke();
    g.beginPath();g.moveTo(L.px,L.py);g.lineTo(L.px+dx*30+nx*13,L.py+dy*30+ny*13);g.lineTo(L.px+dx*30-nx*13,L.py+dy*30-ny*13);g.closePath();g.fillStyle='#d9480f';g.fill();g.lineWidth=2;g.strokeStyle='#ffffff';g.stroke();
    if(sel&&q.s===sel){
      g.strokeStyle='#1f5f8b';g.lineWidth=4;g.beginPath();g.arc(L.x,L.y,R+10,0,Math.PI*2);g.stroke();
      if(lose){g.lineWidth=3;if(typeof g.setLineDash==='function')g.setLineDash([8,6]);g.beginPath();g.arc(L.px,L.py,30,0,Math.PI*2);g.stroke();if(typeof g.setLineDash==='function')g.setLineDash([]);}
    }
    g.fillStyle='#d9480f';g.beginPath();g.arc(L.x,L.y,R,0,Math.PI*2);g.fill();
    g.strokeStyle='#ffffff';g.lineWidth=4;g.beginPath();g.arc(L.x,L.y,R,0,Math.PI*2);g.stroke();
    g.fillStyle='#ffffff';g.font='bold 28px sans-serif';g.textAlign='center';g.textBaseline='middle';
    g.fillText(String(q.n),L.x,L.y+1);
  });
}
/* Zeichnet die Außenskizze auf die 900×640-Fläche: Viereck, Name, Ränder, Stempel, Striche, Marken (opt.ohneMarken: ohne – das Zeichenfenster legt sie live darüber) */
function _fsAsZeichnen(g,b,sk,opt){
  const W=FS_BG_SKIZZE_W,H=FS_BG_SKIZZE_H,x0=130,y0=100,w=640,h=440,dach=!!sk&&sk.aussen==='dach';
  g.fillStyle='#ffffff';g.fillRect(0,0,W,H);
  g.fillStyle=_fsAsFarbe(sk);g.fillRect(x0,y0,w,h);
  g.strokeStyle='#222222';g.lineWidth=6;g.lineCap='square';
  g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+w,y0);g.lineTo(x0+w,y0+h);g.lineTo(x0,y0+h);g.lineTo(x0,y0);g.stroke();
  g.textBaseline='middle';g.fillStyle='#1c1c1e';g.font='bold 30px sans-serif';g.textAlign='left';
  g.fillText(_fsBgSkizzeKuerzen((sk&&sk.name)||(_fsAsTyp(sk)==='innen'?'Raum':'Außen'),36)+' – '+_fsAsAnsicht(sk),24,32);
  const rd=_fsAsRaender(sk);
  g.font='24px sans-serif';g.fillStyle='#555555';
  g.textAlign='center';if(rd[0])g.fillText(rd[0],x0+w/2,y0-24);if(rd[2])g.fillText(rd[2],x0+w/2,y0+h+28);
  g.textAlign='right';if(rd[3])g.fillText(rd[3],x0-14,y0+h/2);
  g.textAlign='left';if(rd[1])g.fillText(rd[1],x0+w+14,y0+h/2);
  const r=_fsAsPseudoRaum(sk);
  _fsBgStempelZeichnen(g,r);
  _fsBgStricheZeichnen(g,r);
  if(!(opt&&opt.ohneMarken))_fsAsMarkenZeichnen(g,b,sk,null);
}
const _fsKompass={grad:null,zeit:0,laeuft:false,h:null};
function _fsKompassStart(){
  if(_fsKompass.laeuft||typeof window==='undefined'||typeof window.addEventListener!=='function')return false;
  const h=ev=>{
    if(typeof document!=='undefined'&&typeof document.getElementById==='function'&&!document.getElementById('_fsMobOverlay')){_fsKompassStop();return;}
    let g=null;
    if(typeof ev.webkitCompassHeading==='number'&&isFinite(ev.webkitCompassHeading))g=Math.round(ev.webkitCompassHeading)%360;
    else if(ev.absolute===true){const k=_fsKompassRichtung(ev.alpha,ev.beta,ev.gamma);if(k)g=k.grad;}
    if(g===null)return;
    _fsKompass.grad=g;_fsKompass.zeit=Date.now();
  };
  window.addEventListener('deviceorientationabsolute',h,true);window.addEventListener('deviceorientation',h,true);
  _fsKompass.h=h;_fsKompass.laeuft=true;return true;
}
function _fsKompassStop(){
  if(_fsKompass.h&&typeof window!=='undefined'){window.removeEventListener('deviceorientationabsolute',_fsKompass.h,true);window.removeEventListener('deviceorientation',_fsKompass.h,true);}
  _fsKompass.h=null;_fsKompass.laeuft=false;
}
// letzte Blickrichtung, wenn sie höchstens maxMs alt ist; sonst null
function _fsKompassLetzte(maxMs){return (_fsKompass.grad!==null&&Date.now()-_fsKompass.zeit<=(maxMs||5000))?_fsKompass.grad:null;}
/* F28/F29: Kompassnadel für die Seite (freiwillig, standardmäßig ZUGEKLAPPT – „🧭 Seite messen“). Läuft nur am Handy/Tablet (am PC gibt es keinen Kompass); iPhone fragt einmal nach der Erlaubnis.
   Gemessen wird, wohin das Gerät zeigt. Draußen zeigt die Wand in die Gegenrichtung (du schaust auf sie zurück), drinnen gilt die Blickrichtung (du schaust zur Außenwand hinaus) – siehe _fsWandRichtung.
   Drinnen weicht der Kompass oft um 20–45° ab – darum nur ein Vorschlag. */
const _fsNadelAuf=new WeakSet(); // welche Stellen die Nadel aufgeklappt haben (bleibt beim Neuaufbau des Fensters)
function _fsNadelBox(s,beiAenderung,typ){
  const drinnen=(typ!=='aussen');
  const hulle=document.createElement('div');hulle.setAttribute('data-fs-nadelhuelle','1');
  const kopfK=document.createElement('button');kopfK.type='button';kopfK.setAttribute('data-fs-nadelkopf','1');
  kopfK.style.cssText='display:block;width:100%;min-height:var(--fsh,40px);margin-top:6px;padding:6px 12px;border-radius:10px;border:1.5px dashed var(--fs-krd,#1f5f8b);background:var(--fs-kfl,transparent);color:var(--text);font-size:var(--fs14,14px);cursor:pointer;font-family:inherit;text-align:left;';
  const box=document.createElement('div');box.setAttribute('data-fs-nadel','1');
  box.style.cssText='display:flex;gap:12px;align-items:center;margin-top:6px;border:1.5px dashed #1f5f8b;border-radius:10px;padding:8px 10px;background:rgba(31,95,139,.08);';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width','84');svg.setAttribute('height','84');svg.setAttribute('viewBox','-42 -42 84 84');svg.style.flexShrink='0';
  svg.innerHTML='<circle r="38" fill="#fff" stroke="#1f5f8b" stroke-width="3"/><g data-fs-rose="1"><text y="-22" text-anchor="middle" font-size="13" font-weight="700" fill="#d9480f">N</text><text x="26" y="5" text-anchor="middle" font-size="11" fill="#555">O</text><text y="31" text-anchor="middle" font-size="11" fill="#555">S</text><text x="-26" y="5" text-anchor="middle" font-size="11" fill="#555">W</text><polygon points="0,-30 5,0 -5,0" fill="#d9480f"/><polygon points="0,30 5,0 -5,0" fill="#999"/></g><path d="M0 -42 L7 -33 L-7 -33Z" fill="#1f5f8b"/>';
  const rechts=document.createElement('div');rechts.style.cssText='flex:1;min-width:0;font-size:var(--fs14,14px);color:var(--text);';
  const nt=document.createElement('div');nt.setAttribute('data-fs-nadeltext','1');nt.style.marginBottom='6px';nt.textContent='Kompass aus – zum Messen einschalten und das Gerät auf die Wand richten.';
  const bst='padding:6px 12px;min-height:var(--fsh,38px);border-radius:10px;border:1.5px solid var(--fs-krd,#1f5f8b);background:var(--fs-kfl,transparent);color:var(--text);font-size:var(--fs14,14px);cursor:pointer;font-family:inherit;margin:0 6px 4px 0;';
  const bAn=document.createElement('button');bAn.type='button';bAn.setAttribute('data-fs-nadelan','1');bAn.textContent='🧭 Kompass einschalten';bAn.style.cssText=bst;
  const bUe=document.createElement('button');bUe.type='button';bUe.setAttribute('data-fs-nadelubernehmen','1');bUe.textContent='Seite übernehmen';bUe.disabled=true;bUe.style.cssText=bst+'opacity:.5;';
  const hinweis=document.createElement('div');hinweis.style.cssText='font-size:var(--fs12,12px);color:var(--text2);line-height:1.4;';hinweis.textContent='Drinnen kann der Kompass 20–45° falsch zeigen (Stahl, Heizkörper), draußen vor der Wand ist er brauchbarer. Die Seite lässt sich immer von Hand ändern.';
  rechts.append(nt,bAn,bUe,hinweis);box.append(svg,rechts);
  const zeigeKopf=()=>{const auf=_fsNadelAuf.has(s);kopfK.textContent=(auf?'▾ ':'▸ ')+'🧭 Seite messen (Kompass)';box.style.display=auf?'flex':'none';};
  kopfK.onclick=()=>{if(_fsNadelAuf.has(s))_fsNadelAuf.delete(s);else _fsNadelAuf.add(s);zeigeKopf();};
  let letzte=null,laeuft=false,kam=false;
  const rose=svg.querySelector('[data-fs-rose]');
  const zeige=g=>{
    letzte=g;rose.setAttribute('transform','rotate('+(-g)+')');const r=_fsWandRichtung(g,drinnen);
    nt.innerHTML=drinnen
      ?'Du schaust nach <b>'+g+'°</b> ('+_fsBlickWort(g)+'). Die Wand liegt im <b>'+FS_B2_SEITENTEXT[r.seite]+'en</b> → <b>'+FS_B2_SEITENTEXT[r.seite]+'seite</b>.'
      :'Du schaust nach <b>'+g+'°</b> ('+_fsBlickWort(g)+'). Die Wand zeigt nach <b>'+Math.round(r.wand)+'°</b> → <b>'+FS_B2_SEITENTEXT[r.seite]+'seite</b>.';
    bUe.disabled=false;bUe.style.opacity='1';
  };
  const h=ev=>{
    if(!box.isConnected){stopp();return;}
    let g=null;
    if(typeof ev.webkitCompassHeading==='number'&&isFinite(ev.webkitCompassHeading))g=Math.round(ev.webkitCompassHeading)%360;
    else if(ev.absolute===true){const k=_fsKompassRichtung(ev.alpha,ev.beta,ev.gamma);if(k)g=k.grad;}
    if(g===null)return;
    kam=true;zeige(g);
  };
  const stopp=()=>{window.removeEventListener('deviceorientationabsolute',h,true);window.removeEventListener('deviceorientation',h,true);laeuft=false;bAn.textContent='🧭 Kompass einschalten';};
  bAn.onclick=async()=>{
    if(laeuft){stopp();return;}
    try{
      if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
        const r=await DeviceOrientationEvent.requestPermission();
        if(r!=='granted'){nt.textContent='Der Zugriff auf die Bewegungssensoren wurde nicht erlaubt (iPhone: Einstellungen → Safari).';return;}
      }
    }catch(e){nt.textContent='Der Kompass lässt sich nicht einschalten.';return;}
    laeuft=true;kam=false;bAn.textContent='🧭 Kompass ausschalten';nt.textContent='Kompass sucht …';
    window.addEventListener('deviceorientationabsolute',h,true);window.addEventListener('deviceorientation',h,true);
    try{_fsKompassStart();}catch(e){} /* F29: derselbe Kompass merkt die Blickrichtung auch für Fotos */
    setTimeout(()=>{if(laeuft&&!kam)nt.textContent='Dieses Gerät meldet keinen Kompass (am PC gibt es keinen). Wähle die Seite von Hand.';},2500);
  };
  bUe.onclick=()=>{if(letzte===null)return;const r=_fsWandRichtung(letzte,drinnen);s.seite=r.seite;s.seiteGrad=Math.round(r.wand);scheduleSave();stopp();if(typeof beiAenderung==='function')beiAenderung();};
  hulle.append(kopfK,box);zeigeKopf();
  return hulle;
}
// Frage beim Anlegen einer Besichtigung 2: Innen · Außen · Beides (merkt die letzte Wahl nur als Vorauswahl)
function _fsB2Teilwahl(cb){
  const old=document.getElementById('_fsB2Wahl');if(old)old.remove();
  let letzte='';try{letzte=localStorage.getItem('pam_fs_b2teil')||'';}catch(e){}
  const ov=document.createElement('div');ov.id='_fsB2Wahl';_fsSichtAn(ov);ov.style.cssText='position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
  const box=document.createElement('div');box.style.cssText='background:var(--bg);color:var(--text);border-radius:14px;padding:18px;max-width:420px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.5);';
  const ti=document.createElement('div');ti.style.cssText='font-size:var(--fs18,18px);font-weight:700;margin-bottom:4px;';ti.textContent='Was besichtigst du?';
  const info=document.createElement('div');info.style.cssText='font-size:var(--fs13,13px);color:var(--text2);margin-bottom:12px;line-height:1.4;';info.textContent='Nur der gewählte Teil erscheint, damit das Protokoll kurz bleibt. Im Protokoll lässt er sich jederzeit mit den Haken zu- oder abschalten.';
  const zu=w=>{try{localStorage.setItem('pam_fs_b2teil',w||letzte);}catch(e){}document.removeEventListener('keydown',taste,true);ov.remove();cb(w);};
  const taste=e=>{if(e.key==='Escape'){e.stopPropagation();document.removeEventListener('keydown',taste,true);ov.remove();cb(null);}};
  document.addEventListener('keydown',taste,true);
  box.append(ti,info);
  [['innen','🏠 Innen'],['aussen','🌤 Außen'],['beides','🏠 🌤 Beides']].forEach(([k,txt])=>{
    const b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute('data-fs-b2wahl',k);
    b.style.cssText='display:block;width:100%;min-height:54px;margin:8px 0;border-radius:12px;font-size:var(--fs18,18px);font-weight:700;cursor:pointer;font-family:inherit;color:var(--text);border:2px solid #1f5f8b;background:'+(letzte===k?'rgba(31,95,139,.22)':'transparent')+';';
    b.onclick=()=>zu(k);box.appendChild(b);
  });
  const ab=document.createElement('button');ab.type='button';ab.textContent='Abbrechen';ab.setAttribute('data-fs-b2wahl','abbruch');ab.style.cssText='display:block;width:100%;min-height:var(--fsh44,44px);margin-top:6px;border-radius:10px;font-size:var(--fs15,15px);cursor:pointer;font-family:inherit;color:var(--text2);border:1px solid var(--border);background:transparent;';
  ab.onclick=()=>{document.removeEventListener('keydown',taste,true);ov.remove();cb(null);};
  box.appendChild(ab);ov.appendChild(box);document.body.appendChild(ov);
}
function _fsLbLeafletEbene(k){
  const e=FS_LB_EBENEN.find(x=>x.k===k)||FS_LB_EBENEN[1];
  if(k==='th')return L.tileLayer.wms('https://www.geoproxy.geoportal-th.de/geoproxy/services/DOP',{layers:'th_dop',format:'image/png',version:'1.3.0',maxZoom:21,attribution:e.quelle});
  if(k==='google')return L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{maxZoom:21,maxNativeZoom:20,subdomains:['mt0','mt1','mt2','mt3'],attribution:e.quelle});
  if(k==='osm')return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:21,maxNativeZoom:19,attribution:e.quelle});
  return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:21,maxNativeZoom:19,attribution:e.quelle});
}
// F17: Kontakte der Karte als Auswahl „Besichtigung bei“: text = „Rolle: Name“, name, kontakt = „Name, Telefon“. Nur Kontakte mit Namen.
const FS_VB_ROLLEN={mieter:'Mieter',eigentuemer:'Eigentümer',hausverwaltung:'Hausverwaltung',ag:'Auftraggeber',privatkunde:'Privatkunde'};
function _fsVbKontakte(t){
  return ((t&&Array.isArray(t.kontakte))?t.kontakte:[]).filter(k=>k&&String(k.name||k.firma||'').trim()).map(k=>{
    const name=String(k.name||k.firma).trim(),rolle=FS_VB_ROLLEN[k.rolle]||String(k.rolle||'').trim()||'Kontakt',tel=String(k.tel||k.tel2||'').trim();
    return {text:rolle+': '+name,name,kontakt:name+(tel?', '+tel:'')};
  });
}
// F18: Datum TT.MM.JJJJ → JJJJ-MM-TT (Format der Termine in der Karte); ungültig → ''
function _fsVbIso(datum){
  const m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(datum||'').trim());
  if(!m)return '';
  const d=+m[1],mo=+m[2],y=+m[3];
  if(mo<1||mo>12||d<1||d>31)return '';
  return y+'-'+('0'+mo).slice(-2)+'-'+('0'+d).slice(-2);
}
// F18: Beschreibung des Termins in der Karte (und damit des Outlook-Betreffs): „Vorabbesichtigung – Eigentümer“
function _fsVbTerminText(bericht){
  const rolle=String((bericht&&bericht.kopf&&bericht.kopf.besuchBei)||'').split(':')[0].trim();
  return (bericht&&bericht.schlank?'Besichtigung':'Vorabbesichtigung')+(rolle?' – '+rolle:''); // F23
}
// Datum (TT.MM.JJJJ) und Uhrzeit (hh:mm) von jetzt – für die „Ich bin jetzt hier“-Knöpfe
function _fsVbJetzt(){
  const d=new Date(),p=n=>('0'+n).slice(-2);
  return {datum:p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear(),uhr:p(d.getHours())+':'+p(d.getMinutes())};
}
// F19: Rückfall, wenn die Karte weder „schadensbild“ noch eine Beschreibung hat: der Anliegen-Text im Betreff der Mail „Neue Anfrage „Verstopfter Ablauf am Balkon“ wurde Ihnen zugewiesen“.
// Bewusst NUR dieses Muster (kein „AW:“, kein beliebiger Betreff) – sonst stünde Unsinn im Anlass. Die erste passende Mail der Karte zählt.
function _fsVbAnlassAusMail(t){
  const quellen=((t&&Array.isArray(t.msThreadMessages))?t.msThreadMessages.map(m=>m&&m.subject):[]).concat([t&&t.msEmailSubject]);
  for(const sb of quellen){
    const m=/Neue Anfrage\s*[„"“”]([^„"“”]{3,150})[“”"]/.exec(String(sb||''));
    if(m)return m[1].replace(/\s+/g,' ').trim();
  }
  return '';
}
// Anlass aus der Beschreibung der Karte: nur ein VORSCHLAG zum Überschreiben (Tags raus, Leerzeichen zusammen, höchstens 300 Zeichen)
function _fsVbAnlassAusKarte(t){
  let q=String((t&&t.schadensbild)||'').trim(); // F17: das saubere Feld der Karte zuerst
  if(!q)q=String((t&&t.desc)||'').split('[E-Mail-Import')[0]; // F17: Anhang „[E-Mail-Import …]: Von: …“ gehört nicht ins Protokoll
  let s=q.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(!s)s=_fsVbAnlassAusMail(t); // F19
  return s.length>300?s.slice(0,297)+'...':s;
}
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
  const keller=b.art==='keller',vorab=b.art==='vorab'; // F16: vorab = Vorabbesichtigung
  b.fassung='begehung';
  b.titel=vorab?(b.schlank?FS_B2_TITEL:FS_VB_TITEL):FS_BG_TITEL+(keller?' Keller':' Wohnung');
  Object.assign(b.kopf,{anlass:'',beginn:'',ende:'',geraetLuft:'',geraetOberflaeche:'',geraetBauteil:'',pruefer:_fsBgMerkName()});
  if(vorab)Object.assign(b.kopf,{versicherung:'',schadennr:'',zugang:'',ansprechpartner:'',besuchBei:'',lage:'',nutzer:''}); // F17: Nutzer wählt Frank je Besuch („Besichtigung bei“), nicht alle Mieter der Karte
  b.anwesende=[];
  if(vorab){b.schadenbild='';b.vorgeschichte='';b.vbStellen=[];b.vbUmgebung=[];b.meldungStatus='';b.meldungAbw='';b.luftbildEbene='';b.luftbildAnsicht=null;} // F19, F20, F21, F22, F24, F27
  b.sektionen=(vorab?FS_VB_SEKTIONEN:keller?FS_BG_KELLER:FS_BG_WOHNUNG).map(s=>({titel:s.titel,items:s.items.map(_fsBgItem)}));
  b.angaben=(vorab?[]:keller?FS_BG_KELLER_ANGABEN:FS_BG_WOHNUNG_ANGABEN).map(_fsBgAngabe); // F20: Vorabbesichtigung hat ein Textfeld „Vorgeschichte“ statt Fragen
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
/* F3a: Wandart als Auswahl (letzter Punkt „Andere …" = Freitext, bestehende Freitexte bleiben stehen).
   Neue Wände sind vorbelegt: W1 Außenwand, W2–W4 Innenwand – Frank ändert nur noch die Abweichung. */
const FS_BG_WANDARTEN=['Außenwand','Innenwand','Nachbarwand','Treppenhauswand'];
function _fsBgWandStandard(k){return k==='W1'?'Außenwand':((k==='W2'||k==='W3'||k==='W4')?'Innenwand':'');}
// W1…W4 anlegen (nur fehlende, mit Vorbelegung der Art)
function _fsBgWaendeVier(r){
  if(!r)return r;
  if(!Array.isArray(r.waende))r.waende=[];
  for(let i=1;i<=4;i++){const k='W'+i;if(!r.waende.some(w=>w&&w.k===k))r.waende.push({k,art:_fsBgWandStandard(k),fotoRefs:[]});}
  return r;
}
// neuer Raum gleich mit seinen vier Wänden
function _fsBgRaumMitWaenden(name){return _fsBgWaendeVier(_fsBgRaumNeu(name));}
// Raum „benutzt": eigene Werte, Fotos, Skizze oder eine Messstelle – nur dann steht er (mit seinen Wänden) im PDF
function _fsBgRaumBenutzt(b,r){
  if(!r)return false;
  if(_fsZahl(r.t)!==null||_fsZahl(r.rf)!==null||String(r.bedingung||'').trim())return true;
  if((Array.isArray(r.fotoRefs)&&r.fotoRefs.length)||(Array.isArray(r.waende)&&r.waende.some(q=>q&&Array.isArray(q.fotoRefs)&&q.fotoRefs.length)))return true;
  if(r.skizze&&r.skizze.an)return true;
  return !!(r.name&&((b&&b.stellen)||[]).some(s=>s&&s.raum===r.name&&_fsBgStelleGefuellt(s)));
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
/* ══ F4: MESSPLAN – feste Reihenfolge der Messungen; danach ordnet PAM die testo-Messungen zu ═══════════════════════
   Ablauf: Räume, Wände und Wandfotos werden am Tablet VORHER angelegt, gemessen wird danach mit dem Handy (testo, Trotec). Damit Messung und
   Wand wieder zusammenfinden, wird in einer festen Reihenfolge gemessen: Räume wie im Protokoll, je Raum W1…Wn, je Wand die Höhen von der
   ersten bis zur letzten. Der Messplan wird aus Räumen, Wänden und Höhen BERECHNET – es gibt keine eigenen Plan-Zeilen im Protokoll, und
   nichts davon kommt ins PDF. Gespeichert ist nur die Höhenliste je Wand: wand.hoehen (Text, z. B. „10, 50, 100“); fehlt sie, gilt der
   Standard, leer = diese Wand wird nicht gemessen. Zugeordnet wird nach der Uhrzeit der testo-Messung: die n-te Messung gehört zur n-ten
   offenen Plan-Zeile – als VORSCHLAG, Frank kontrolliert und bestätigt (Uhren von Tablet und Handy müssen nicht übereinstimmen).
   ⛔ Nur Programm und Bezeichnungen in dieser öffentlichen Datei. */
const FS_BG_HOEHEN_STANDARD='10, 50, 100';
// „10, 50 / 100 cm“ → ['10','50','100'] – Reihenfolge wie eingetragen, doppelte entfallen; Komma, Semikolon, Schrägstrich und Leerzeichen trennen
function _fsBgHoehenListe(s){
  const out=[];
  String(s===undefined||s===null?'':s).replace(/cm/gi,' ').split(/[\s;,\/]+/).forEach(x=>{
    if(!/^\d+(\.\d+)?$/.test(x))return;
    const n=String(parseFloat(x));
    if(out.indexOf(n)<0)out.push(n);
  });
  return out;
}
// Höhen einer Wand: die eingetragene Liste; fehlt sie ganz, gilt der Standard; leer = diese Wand wird nicht gemessen
function _fsBgWandHoehen(wd){
  if(wd&&wd.nichtMessen)return []; // F8: abgeschaltete Wand – ihre Höhen bleiben gespeichert, sie steht aber nicht im Messplan
  return _fsBgHoehenListe((wd&&typeof wd.hoehen==='string')?wd.hoehen:FS_BG_HOEHEN_STANDARD);
}
// F8: Wand ein- oder ausschalten. Aus = Kennzeichen nichtMessen (die Höhen bleiben); an = Kennzeichen weg, und eine früher leer gemachte Höhenliste bekommt wieder den Standard
function _fsBgWandMessenSetzen(wd,messen){
  if(!wd)return false;
  if(messen){
    delete wd.nichtMessen;
    if(typeof wd.hoehen==='string'&&!_fsBgHoehenListe(wd.hoehen).length)delete wd.hoehen;
  }else wd.nichtMessen=true;
  return true;
}
// Messplan: Räume in der Reihenfolge des Protokolls, je Raum W1…Wn (nach Zahl, also W2 vor W10), je Wand die Höhen. Boden, Decke und Räume ohne Namen gehören nicht dazu.
function _fsBgMessplan(b){
  const plan=[];
  ((b&&b.raeume)||[]).forEach(r=>{
    if(!r||!String(r.name||'').trim())return;
    const ws=(Array.isArray(r.waende)?r.waende:[]).filter(w=>w&&/^W\d+$/.test(String(w.k||''))).sort((a,c)=>(+String(a.k).slice(1))-(+String(c.k).slice(1)));
    ws.forEach(w=>_fsBgWandHoehen(w).forEach(h=>plan.push({nr:0,raum:r.name,wand:w.k,hoehe:h,art:String(w.art||'').trim(),fotoRefs:Array.isArray(w.fotoRefs)?w.fotoRefs:[]})));
  });
  plan.forEach((p,i)=>{p.nr=i+1;});
  return plan;
}
// Ganzen Raum aus dem Messplan nehmen (messen=false: alle Wände W… werden abgeschaltet) oder zurückholen (messen=true: alle wieder an; die eigenen Höhen bleiben in beiden Fällen)
function _fsBgRaumMessenSetzen(r,messen){
  ((r&&Array.isArray(r.waende))?r.waende:[]).forEach(w=>{if(w&&/^W\d+$/.test(String(w.k||'')))_fsBgWandMessenSetzen(w,!!messen);});
  return r;
}
// Plan-Zeile „erledigt“: es gibt schon eine Messstelle mit diesem Raum, dieser Wand und dieser Höhe (testo-Messung oder ausgefüllt) – Vergleichsstellen zählen nicht
function _fsBgPlanErledigt(b,p){
  const h=parseFloat(p&&p.hoehe);
  if(!p||!isFinite(h))return false;
  return ((b&&b.stellen)||[]).some(s=>s&&!s.referenz&&s.raum===p.raum&&s.wand===p.wand&&parseFloat(String(s.hoehe||'').replace(',','.'))===h&&(s.testo||_fsBgStelleGefuellt(s)));
}
// Eine testo-Messung mit dieser Messzeit (Millisekunden) ist im Protokoll schon eingelesen – fängt doppelt geteilte Dateien („… (1).tjf“), die unter anderem Namen liegen
function _fsTestoZeitSchonDa(b,zeit){
  return !!zeit&&((b&&b.stellen)||[]).some(s=>s&&s.testo&&s.testo.zeit===zeit);
}
// Vorschlag nach Reihenfolge: die n-te Messung (nach Zeit sortiert) gehört zur n-ten offenen Plan-Zeile. Reine Funktion.
function _fsBgPlanVorschlag(planOffen,messungen){
  const p=Array.isArray(planOffen)?planOffen:[],m=Array.isArray(messungen)?messungen:[],n=Math.min(p.length,m.length);
  const paare=[];for(let i=0;i<n;i++)paare.push({plan:p[i],m:m[i]});
  return {paare:paare,ohnePlan:m.slice(n),ohneMessung:p.slice(n)};
}
// Doppelt geteilte Dateien heißen „… (1).tjf“: beim Zusammenfassen gleicher Messzeiten soll die Datei ohne Nummer gewinnen (sie landet als Kopie im Auftragsordner). Reihenfolge sonst unverändert.
function _fsTestoOriginaleZuerst(liste){
  const kopie=f=>/ \(\d+\)\.\w+$/.test(String((f&&f.name)||''))?1:0;
  return (Array.isArray(liste)?liste:[]).slice().sort((a,b)=>kopie(a)-kopie(b));
}
// Messstelle aus einer zugeordneten testo-Messung: Raum, Wand und Höhe aus dem Messplan, Uhrzeit = Messzeit, kein „Ort im Raum“-Text
function _fsBgStelleAusPlan(m,p){
  const st=_fsStelleAusTesto(m,p.raum),z=m.zeit?_fsZeitText(m.zeit):'';
  st.text='';st.wand=p.wand;st.hoehe=p.hoehe;st.referenz=false;st.zeit=z?z.slice(11,16):'';
  return st;
}
// Merkzettel „So misst du“ – steht im Formular beim Messplan (Text erst beim Aufruf gebaut, weil er den testo-Exportweg nennt)
function _fsBgMessregeln(){
  return [
    'Immer in der Reihenfolge des Messplans messen: Raum für Raum, W1 bis W4, an jeder Wand von der ersten bis zur letzten Höhe – jedes Mal gleich.',
    'Erst am Tablet Räume, Wände, Höhen und Wandfotos anlegen, dann am Handy messen. Ändert sich der Plan nach dem Messen, stimmt die Zuordnung nicht mehr.',
    'Jede Messung einzeln speichern. '+(typeof FS_TESTO_JSON_WEG==='string'?FS_TESTO_JSON_WEG:''),
    'Nichts überspringen. Hast du eine Stelle ausgelassen oder eine Messung doppelt gespeichert, merk dir die Nummer – du korrigierst es später in der Kontrollliste („Hier nicht gemessen“ oder „Messung weglassen“).',
    'Trotec-Werte trägst du bei der Messstelle von Hand ein (Bauteil, Digits). Ein Trotec-Import kommt später.',
    'Danach am Tablet bei „Räume“ „📋 Messungen nach Messplan zuordnen“ antippen: PAM schlägt die Wände der Reihe nach vor, du prüfst mit dem Wandfoto und übernimmst.'
  ];
}
/* ══ F4a: GROSSES FENSTER „Messliste und Ablauf“ ═══════════════════════════════════════════════════════════════════
   Frank (01.10.2026): Alles am Tablet kommt ZUERST, gemessen wird NUR am Handy (testo, Trotec), danach zurück ans Tablet. Am Handy öffnet er
   dasselbe Protokoll und sieht die Messliste in großer Schrift: oben „Als Nächstes“, darunter alle Nummern. „Gemessen bis hier“ ist nur eine
   Gedächtnisstütze, gilt nur auf DIESEM Gerät (localStorage) und steht NICHT im Protokoll – Handy und Tablet kommen sich nicht in die Quere.
   ⛔ Nur Programm und Bezeichnungen in dieser öffentlichen Datei. */
const FS_BG_MESSSTAND_KEY='pam_fs_messstand';
// Der Ablauf in drei Blöcken: am Tablet vorbereiten · am Handy messen · zurück am Tablet zuordnen
function _fsBgAblauf(){
  return [
    {k:'tablet',titel:'AM TABLET – zuerst, alles Vorbereitende',zeilen:[
      '1 · Räume anlegen (bei „Räume“ mit „＋ Raum“).',
      '2 · Im Raum bei „Wände“ prüfen (Außenwand oder Innenwand) und Wandfotos anhängen.',
      '3 · Im Raum bei „Messplan“ prüfen: Höhen je Wand; Wände, die du nicht misst, abschalten („wird nicht gemessen“), ganze Räume mit „Raum nicht messen“.',
      'Danach das Tablet weglegen – am Plan ändert sich nichts mehr.']},
    {k:'handy',titel:'AM HANDY – nur messen',zeilen:[
      '4 · Mit testo und Trotec in der Reihenfolge der Messliste messen. Jede testo-Messung einzeln speichern und teilen. Die „📋 Messliste“ zeigt dir, was als Nächstes dran ist.']},
    {k:'zurueck',titel:'ZURÜCK AM TABLET',zeilen:[
      '5 · „📋 Messungen nach Messplan zuordnen“ antippen, kontrollieren, übernehmen. Die Trotec-Werte trägst du dabei von Hand bei den Messstellen ein.']}
  ];
}
// zuletzt gemessene Nummer auf DIESEM Gerät (je Protokoll); 0 = noch nichts
function _fsBgMessstandLesen(id){
  try{const m=JSON.parse(localStorage.getItem(FS_BG_MESSSTAND_KEY)||'{}');const n=parseInt(m&&m[id],10);return isFinite(n)&&n>0?n:0;}catch(e){return 0;}
}
function _fsBgMessstandSetzen(id,n){
  let m={};
  try{m=JSON.parse(localStorage.getItem(FS_BG_MESSSTAND_KEY)||'{}')||{};}catch(e){m={};} // kaputter Speicher: neu anfangen statt für immer zu klemmen
  if(typeof m!=='object')m={};
  try{if(n>0)m[id]=n;else delete m[id];localStorage.setItem(FS_BG_MESSSTAND_KEY,JSON.stringify(m));return true;}catch(e){return false;}
}
// Stand der Messliste: je Zeile „fertig“ (bis zur Markierung gemessen ODER schon einer Messstelle zugeordnet) und die nächste offene Zeile. Reine Funktion.
function _fsBgMessStand(b,marker){
  const plan=_fsBgMessplan(b),m=parseInt(marker,10)||0;
  const zeilen=plan.map(p=>({p:p,fertig:p.nr<=m||_fsBgPlanErledigt(b,p)}));
  const naechste=zeilen.find(z=>!z.fertig)||null;
  return {zeilen:zeilen,naechste:naechste?naechste.p:null,gesamt:plan.length,fertig:zeilen.filter(z=>z.fertig).length};
}
/* ── F5: Räume einzeln zuklappen (Messliste und Messplan) – gemerkt je GERÄT, nicht im Protokoll ───────────────────
   Je Protokoll eine Tabelle {Raumname: 1 = zu, 0 = ausdrücklich auf}; ohne Eintrag gilt der Standard (Messliste: nur der Raum mit „Als Nächstes“
   ist offen, Messplan: alles offen). */
const FS_BG_RAUMZU_KEY='pam_fs_raumzu';  // Messliste
const FS_BG_PLANZU_KEY='pam_fs_planzu';  // Messplan im Formular
function _fsBgRaumZuLesen(key,id){
  try{const m=JSON.parse(localStorage.getItem(key)||'{}');const r=m&&m[id];return (r&&typeof r==='object')?r:{};}catch(e){return {};}
}
// wert: 1 = zu, 0 = ausdrücklich auf, null = zurück auf den Standard
function _fsBgRaumZuSetzen(key,id,raum,wert){
  let m={};
  try{m=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){m={};}
  if(typeof m!=='object')m={};
  const r=(m[id]&&typeof m[id]==='object')?m[id]:{};
  if(wert===null||wert===undefined)delete r[raum];else r[raum]=wert?1:0;
  if(Object.keys(r).length)m[id]=r;else delete m[id];
  try{localStorage.setItem(key,JSON.stringify(m));return true;}catch(e){return false;}
}
function _fsBgRaumOffen(map,raum,standard){const v=map&&map[raum];return v===1?false:(v===0?true:!!standard);}
// Das Fenster. tab0: 'liste' (Messliste, auch am Handy) oder 'ablauf' (So misst du). Zweiter Aufruf schließt es wieder.
function _fsBgMessfensterZeigen(b,tab0){
  const alt=document.getElementById('_fsMessfenster');if(alt){alt.remove();return;}
  let tab=(tab0==='ablauf')?'ablauf':'liste';
  const ov=document.createElement('div');ov.id='_fsMessfenster';
  ov.style.cssText='position:fixed;inset:0;z-index:99999;background:var(--bg);color:var(--text);display:flex;flex-direction:column;';
  const kopf=document.createElement('div');kopf.style.cssText='background:'+FS_FARBE+';padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  const zu=document.createElement('button');zu.type='button';zu.textContent='←';zu.setAttribute('aria-label','Fenster schließen');zu.setAttribute('data-fs-mf-zu','1');
  zu.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:44px;height:44px;border-radius:8px;font-size:20px;cursor:pointer;flex-shrink:0;';
  zu.onclick=()=>ov.remove();
  const ti=document.createElement('div');ti.style.cssText='font-size:17px;font-weight:700;color:#fff;';ti.textContent='📋 Messliste und Ablauf';
  kopf.append(zu,ti);
  const reiter=document.createElement('div');reiter.style.cssText='display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border);flex-shrink:0;';
  const inhalt=document.createElement('div');inhalt.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 16px 24px;';
  const fuss=document.createElement('div');fuss.style.cssText='flex-shrink:0;display:flex;gap:10px;padding:10px 14px 14px;border-top:1px solid var(--border);';
  ov.append(kopf,reiter,inhalt,fuss);
  const knopf=(txt,stil,fn,attr)=>{
    const x=document.createElement('button');x.type='button';x.textContent=txt;x.style.cssText='font-family:inherit;cursor:pointer;border-radius:12px;'+stil;
    if(attr)x.setAttribute(attr[0],attr[1]);
    x.onclick=fn;return x;
  };
  const zeige=()=>{
    reiter.innerHTML='';inhalt.innerHTML='';fuss.innerHTML='';
    [['liste','📋 Messliste'],['ablauf','ℹ So misst du']].forEach(([k,txt])=>{
      const an=tab===k;
      reiter.appendChild(knopf(txt,'flex:1;min-height:52px;font-size:17px;font-weight:700;color:var(--text);border:2px solid '+(an?FS_FARBE:'var(--border)')+';background:'+(an?'rgba(31,95,139,.22)':'transparent')+';',()=>{tab=k;zeige();},['data-fs-mf-reiter',k]));
    });
    if(tab==='ablauf'){
      _fsBgAblauf().forEach(bl=>{
        const h=document.createElement('div');h.setAttribute('data-fs-mf-block',bl.k);h.textContent=bl.titel;
        h.style.cssText='font-size:19px;font-weight:700;margin:20px 0 8px;padding-left:10px;border-left:6px solid '+FS_FARBE+';';
        inhalt.appendChild(h);
        bl.zeilen.forEach(z=>{const d=document.createElement('div');d.textContent=z;d.style.cssText='font-size:18px;line-height:1.5;margin:0 0 8px;';inhalt.appendChild(d);});
      });
      const mh=document.createElement('div');mh.textContent='Merkpunkte';mh.style.cssText='font-size:19px;font-weight:700;margin:24px 0 8px;padding-left:10px;border-left:6px solid '+FS_FARBE+';';
      inhalt.appendChild(mh);
      const ol=document.createElement('ol');ol.style.cssText='margin:0;padding-left:26px;';
      _fsBgMessregeln().forEach(x=>{const li=document.createElement('li');li.textContent=x;li.style.cssText='font-size:17px;line-height:1.5;margin:0 0 10px;';ol.appendChild(li);});
      inhalt.appendChild(ol);
      return;
    }
    const st=_fsBgMessStand(b,_fsBgMessstandLesen(b.id));
    const karte=document.createElement('div');karte.setAttribute('data-fs-mf-naechste','1');
    karte.style.cssText='margin:8px 0 16px;padding:16px;border-radius:14px;border:3px solid '+FS_FARBE+';background:rgba(31,95,139,.14);';
    const kl=(txt,css)=>{const d=document.createElement('div');d.textContent=txt;d.style.cssText=css;karte.appendChild(d);};
    if(!st.gesamt){
      kl('Noch kein Messplan','font-size:22px;font-weight:700;');
      kl('Am Tablet bei „Räume“ Räume mit Wänden anlegen, dann im Raum bei „Messplan“ die Höhen prüfen.','font-size:17px;line-height:1.5;margin-top:6px;');
    }else if(st.naechste){
      const p=st.naechste;
      kl('Als Nächstes','font-size:16px;color:var(--text2);');
      kl('Nr '+p.nr,'font-size:40px;font-weight:700;line-height:1.1;');
      kl(p.raum,'font-size:26px;font-weight:700;margin-top:4px;');
      kl(p.wand+(p.art?' '+p.art:'')+' · '+p.hoehe+' cm','font-size:24px;font-weight:700;');
      kl(st.fertig+' von '+st.gesamt+' gemessen','font-size:16px;color:var(--text2);margin-top:8px;');
    }else{
      kl('Alles gemessen ✓','font-size:26px;font-weight:700;');
      kl('Zurück am Tablet: „📋 Messungen nach Messplan zuordnen“ antippen.','font-size:18px;line-height:1.5;margin-top:6px;');
    }
    inhalt.appendChild(karte);
    // F5: Räume einzeln zuklappen (Standard: nur der Raum mit „Als Nächstes“ ist offen; gemerkt je Gerät); im offenen Raum die Skizze mit der nächsten Wand
    const raumNamen=[];st.zeilen.forEach(z=>{if(raumNamen.indexOf(z.p.raum)<0)raumNamen.push(z.p.raum);});
    const zuMap=_fsBgRaumZuLesen(FS_BG_RAUMZU_KEY,b.id);
    const KLEIN='flex:1;min-height:48px;font-size:16px;font-weight:700;border:2px solid var(--border);background:transparent;color:var(--text);';
    if(raumNamen.length>1){
      const ak=document.createElement('div');ak.style.cssText='display:flex;gap:8px;margin:0 0 4px;';
      ak.append(
        knopf('▸ Alle zu',KLEIN,()=>{raumNamen.forEach(n=>_fsBgRaumZuSetzen(FS_BG_RAUMZU_KEY,b.id,n,1));zeige();},['data-fs-mf-allezu','1']),
        knopf('▾ Alle auf',KLEIN,()=>{raumNamen.forEach(n=>_fsBgRaumZuSetzen(FS_BG_RAUMZU_KEY,b.id,n,0));zeige();},['data-fs-mf-alleauf','1']));
      inhalt.appendChild(ak);
    }
    raumNamen.forEach(rn=>{
      const zl=st.zeilen.filter(z=>z.p.raum===rn);
      const offen=_fsBgRaumOffen(zuMap,rn,!!st.naechste&&st.naechste.raum===rn);
      const rh=knopf('','display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;min-height:56px;padding:8px 12px;margin:12px 0 6px;font-size:20px;font-weight:700;text-align:left;color:var(--text);border:2px solid var(--border);background:var(--bg2);',
        ()=>{_fsBgRaumZuSetzen(FS_BG_RAUMZU_KEY,b.id,rn,offen?1:0);zeige();},['data-fs-mf-raum',rn]);
      rh.setAttribute('aria-expanded',offen?'true':'false');
      const pf=document.createElement('span');pf.textContent=offen?'▾':'▸';pf.style.cssText='width:20px;flex-shrink:0;';
      const nm=document.createElement('span');nm.textContent=rn;nm.style.cssText='flex:1;min-width:0;';
      const zn=document.createElement('span');zn.textContent=zl.filter(z=>z.fertig).length+' von '+zl.length;zn.style.cssText='font-size:16px;font-weight:600;color:var(--text2);flex-shrink:0;';
      rh.append(pf,nm,zn);inhalt.appendChild(rh);
      if(!offen)return;
      const ro=(b.raeume||[]).find(q=>q&&q.name===rn);
      if(ro){ // Skizze des Raums; hat er keine angelegt, eine einfache Vorlage (nur Rechteck mit W1–W4, kommt nicht ins PDF)
        const hat=!!(ro.skizze&&ro.skizze.an);
        const rz=hat?ro:Object.assign({},ro,{skizze:{an:true,l:'',b:'',dreh:0}});
        const url=_fsBgSkizzeBild(b,rz,{hl:(st.naechste&&st.naechste.raum===rn)?st.naechste.wand:''});
        if(url){
          const im=document.createElement('img');im.alt='Skizze '+rn;im.setAttribute('data-fs-mf-skizze',rn);im.src=url;
          im.style.cssText='display:block;width:100%;max-width:560px;margin:0 0 6px;border:1px solid var(--border);border-radius:10px;background:#fff;';
          inhalt.appendChild(im);
          const nt=document.createElement('div');nt.style.cssText='font-size:14px;line-height:1.4;color:var(--text2);margin:0 0 10px;';
          nt.textContent=hat?'Orange = die nächste Wand.':'Vorlage – für diesen Raum ist keine Skizze angelegt (kommt nicht ins PDF). Orange = die nächste Wand.';
          inhalt.appendChild(nt);
        }
      }
      zl.forEach(z=>{
        const istNaechste=st.naechste&&st.naechste.nr===z.p.nr;
        const row=knopf('', 'display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;min-height:60px;padding:10px 14px;margin:0 0 8px;font-size:20px;text-align:left;color:var(--text);'
          +'border:'+(istNaechste?'3px':'2px')+' solid '+(istNaechste?FS_FARBE:'var(--border)')+';background:'+(istNaechste?'rgba(31,95,139,.18)':'var(--bg2)')+';'+(z.fertig?'opacity:.55;':''),
          ()=>{const jetzt=_fsBgMessstandLesen(b.id);_fsBgMessstandSetzen(b.id,jetzt===z.p.nr?z.p.nr-1:z.p.nr);zeige();},['data-fs-mf-zeile',String(z.p.nr)]);
        const nr=document.createElement('span');nr.textContent=String(z.p.nr);nr.style.cssText='min-width:40px;font-weight:700;';
        const tx=document.createElement('span');tx.textContent=z.p.wand+(z.p.art?' '+z.p.art:'')+' · '+z.p.hoehe+' cm';tx.style.cssText='flex:1;min-width:0;';
        const hk=document.createElement('span');hk.textContent=z.fertig?'✓':'';hk.style.cssText='font-weight:700;font-size:24px;';
        row.append(nr,tx,hk);inhalt.appendChild(row);
      });
    });
    const weiter=knopf('✓ Gemessen, weiter','flex:2;min-height:64px;font-size:20px;font-weight:700;border:none;background:'+FS_FARBE+';color:#fff;'+(st.naechste?'':'opacity:.45;'),
      ()=>{
        if(!st.naechste)return;
        const vorher=st.naechste.raum;
        _fsBgMessstandSetzen(b.id,st.naechste.nr);
        const nach=_fsBgMessStand(b,_fsBgMessstandLesen(b.id)).naechste;
        if(nach&&nach.raum!==vorher){ // in den nächsten Raum gewechselt: der neue geht auf, der alte zu (Standard)
          _fsBgRaumZuSetzen(FS_BG_RAUMZU_KEY,b.id,vorher,null);_fsBgRaumZuSetzen(FS_BG_RAUMZU_KEY,b.id,nach.raum,null);
        }
        zeige();
      },['data-fs-mf-weiter','1']);
    weiter.disabled=!st.naechste;
    const vonVorn=knopf('↺ von vorn','flex:1;min-height:64px;font-size:17px;font-weight:700;border:2px solid var(--border);background:transparent;color:var(--text);',
      ()=>{if(confirm('Die Markierung „gemessen“ auf diesem Gerät zurücksetzen?')){_fsBgMessstandSetzen(b.id,0);zeige();}},['data-fs-mf-vonvorn','1']);
    fuss.append(weiter,vonVorn);
  };
  zeige();
  document.body.appendChild(ov);
}
// Bildunterschrift im PDF: wozu gehört das Foto – Raum, Wand, Messstelle (mit der gedruckten Nummer), Feststellung
function _fsBgFotoZuordnung(b,f){
  const teile=[];
  if(typeof _fsVbStellenGefuellt==='function')_fsVbStellenGefuellt(b).forEach(x=>{if((x.s.fotoRefs||[]).some(r=>_fsRefPasst(f,r))){const o=b.schlank?String(x.s.ort||'').trim():_fsVbOrtVoll(x.s);teile.push(_fsVbBezeichnung(b,x.s,x.nr)+((b.schlank&&_fsSeiteText(x.s.seite))?' – Seite '+_fsSeiteText(x.s.seite):'')+(o?' – '+o:''));}}); // F21, F22, F24, F28
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
  const bl=(teile.length&&f&&typeof f.blick==='number'&&isFinite(f.blick))?' – Blick nach '+_fsBlickWort(f.blick):''; // F29: Blickrichtung des Fotos
  return teile.join(' · ')+bl;
}
/* ══ F3: RAUMSKIZZE – PAM zeichnet den Raum von oben ═══════════════════════════════════════════════════════
   Rechteck-Raum mit den Wänden W1–W4 (Art steht dabei), Tür und Fenster je Wand und den Messstellen als nummerierte Punkte an ihrer Wand
   (Variante „von selbst": die Punkte sitzen gruppiert in der Mitte der Wand – von oben sieht man keine Höhe, die Skizze zeigt nur die WAND).
   Nicht maßstäblich. Ein Zeichner (_fsBgSkizzeZeichnen) für die Vorschau am Gerät UND das Bild im PDF – beide sehen gleich aus.
   Daten: raum.skizze {an:true, l:'4,5' (Länge = Wände W1/W3, m), b:'3,2' (Breite = Wände W2/W4, m), dreh:0…3}, Wand {tuer:true, fenster:true}.
   Drehung 0: W1 liegt unten, dann im Uhrzeigersinn W2 links, W3 oben, W4 rechts; jede Drehung schiebt alle um eine Seite im Uhrzeigersinn weiter.
   ⛔ Nur Bezeichnungen und Programm in dieser öffentlichen Datei. */
const FS_BG_SKIZZE_W=900,FS_BG_SKIZZE_H=640;
const FS_BG_SEITEN=['unten','links','oben','rechts'];
function _fsBgSkizzeMasse(r){
  const zahl=v=>{const n=_fsZahl(v);return (n!==null&&n>0)?n:null;};
  const sk=(r&&r.skizze)||{};
  return {l:zahl(sk.l),b:zahl(sk.b),dreh:(((parseInt(sk.dreh,10)||0)%4)+4)%4};
}
function _fsBgSkizzeKuerzen(s,n){s=String(s||'').trim();return s.length>n?s.slice(0,n-1)+'…':s;}
// Lage des Raums auf der Zeichenfläche: Seitenverhältnis aus Länge × Breite (ohne Maße 4 : 3), bei ungerader Drehung vertauscht
function _fsBgSkizzeGeometrie(r){
  const W=FS_BG_SKIZZE_W,H=FS_BG_SKIZZE_H,m=_fsBgSkizzeMasse(r);
  const L=m.l||4,B=m.b||3,quer=m.dreh%2===0;
  const rw=quer?L:B,rh=quer?B:L;
  const ratio=Math.max(0.4,Math.min(2.5,rw/rh));
  const maxW=W-340,maxH=H-240;
  let w=maxW,h=w/ratio;
  if(h>maxH){h=maxH;w=h*ratio;}
  return {W,H,x0:(W-w)/2,y0:(H-h)/2,w,h,m};
}
// Strecke auf einer Seite (t0…t1 = Anteil entlang der Wand) samt Richtung nach innen
function _fsBgSkizzeSeite(geo,seite,t0,t1){
  const x0=geo.x0,y0=geo.y0,w=geo.w,h=geo.h;
  if(seite==='unten')return {ax:x0+t0*w,ay:y0+h,bx:x0+t1*w,by:y0+h,nx:0,ny:-1};
  if(seite==='oben')return {ax:x0+t0*w,ay:y0,bx:x0+t1*w,by:y0,nx:0,ny:1};
  if(seite==='links')return {ax:x0,ay:y0+h-t0*h,bx:x0,by:y0+h-t1*h,nx:1,ny:0};
  return {ax:x0+w,ay:y0+t0*h,bx:x0+w,by:y0+t1*h,nx:-1,ny:0};
}
// Zeichnet die Skizze auf einen 2D-Zeichenbereich g (Canvas oder Nachbau). Nutzt nur einfache Aufrufe.
function _fsBgSkizzeZeichnen(g,b,r,opt){
  if(r&&r.skizze&&r.skizze.aussen){_fsAsZeichnen(g,b,r.skizze,opt);return;} /* F33: Außenskizze (Wand von vorn / Dachfläche von oben) */
  const geo=_fsBgSkizzeGeometrie(r),W=geo.W,H=geo.H,x0=geo.x0,y0=geo.y0,w=geo.w,h=geo.h,m=geo.m;
  g.fillStyle='#ffffff';g.fillRect(0,0,W,H);
  g.fillStyle='#eef4f9';g.fillRect(x0,y0,w,h);
  g.textBaseline='middle';g.lineCap='square';
  g.fillStyle='#1c1c1e';g.font='bold 30px sans-serif';g.textAlign='left';
  g.fillText(String((r&&r.name)||'Raum'),24,32);
  const waende=(r&&Array.isArray(r.waende))?r.waende:[];
  for(let i=0;i<4;i++){
    const k='W'+(i+1),wd=waende.find(q=>q&&q.k===k)||null,seite=FS_BG_SEITEN[(i+m.dreh)%4];
    const art=wd?String(wd.art||'').trim():'';
    const aussen=/au(ß|ss)en/i.test(art),dick=aussen?18:10;
    const s=_fsBgSkizzeSeite(geo,seite,0,1);
    g.strokeStyle=aussen?'#1f5f8b':'#555555';g.lineWidth=dick;
    g.beginPath();g.moveTo(s.ax,s.ay);g.lineTo(s.bx,s.by);g.stroke();
    if(wd&&wd.fenster){ // Fenster: heller Streifen mit dunkler Mittellinie
      const f=_fsBgSkizzeSeite(geo,seite,0.15,0.45);
      g.strokeStyle='#9fd6ff';g.lineWidth=dick+2;g.beginPath();g.moveTo(f.ax,f.ay);g.lineTo(f.bx,f.by);g.stroke();
      g.strokeStyle='#1f5f8b';g.lineWidth=3;g.beginPath();g.moveTo(f.ax,f.ay);g.lineTo(f.bx,f.by);g.stroke();
    }
    if(wd&&wd.tuer){ // Tür: Lücke in der Wand, Türblatt und Schwenkbogen nach innen
      const d=_fsBgSkizzeSeite(geo,seite,0.6,0.85);
      g.strokeStyle='#ffffff';g.lineWidth=dick+2;g.beginPath();g.moveTo(d.ax,d.ay);g.lineTo(d.bx,d.by);g.stroke();
      const len=Math.hypot(d.bx-d.ax,d.by-d.ay);
      g.strokeStyle='#8a5a2b';g.lineWidth=3;
      g.beginPath();g.moveTo(d.ax,d.ay);g.lineTo(d.ax+d.nx*len,d.ay+d.ny*len);g.stroke();
      const angD=Math.atan2(d.by-d.ay,d.bx-d.ax),angN=Math.atan2(d.ny,d.nx),kreuz=(d.bx-d.ax)*d.ny-(d.by-d.ay)*d.nx;
      g.beginPath();g.arc(d.ax,d.ay,len,angD,angN,kreuz<0);g.stroke();
    }
    // Beschriftung außen: Name der Wand, Art, Länge
    const lm=(i%2===0)?m.l:m.b,mtxt=lm?String(Math.round(lm*100)/100).replace('.',',')+' m':'';
    g.fillStyle='#1c1c1e';
    if(seite==='unten'||seite==='oben'){
      g.textAlign='center';g.font='bold 28px sans-serif';
      g.fillText(k+(art?' '+_fsBgSkizzeKuerzen(art,24):'')+(mtxt?' · '+mtxt:''),x0+w/2,seite==='unten'?y0+h+40:y0-40);
    }else{
      const links=seite==='links',tx=links?x0-22:x0+w+22,my=y0+h/2;
      g.textAlign=links?'right':'left';
      g.font='bold 32px sans-serif';g.fillText(k,tx,my-32);
      g.font='24px sans-serif';
      if(art)g.fillText(_fsBgSkizzeKuerzen(art,12),tx,my);
      if(mtxt)g.fillText(mtxt,tx,my+(art?30:0));
    }
  }
  if(opt&&/^W[1-4]$/.test(String(opt.hl||''))){ // F5: nächste Wand der Messliste – orangefarbenes Band an der INNENSEITE der Wand (nur Anzeige am Gerät, nie im PDF)
    const hi=+String(opt.hl).slice(1)-1,sh=_fsBgSkizzeSeite(geo,FS_BG_SEITEN[(hi+m.dreh)%4],0,1);
    g.strokeStyle='#f59e0b';g.lineWidth=16;
    g.beginPath();g.moveTo(sh.ax+sh.nx*20,sh.ay+sh.ny*20);g.lineTo(sh.bx+sh.nx*20,sh.by+sh.ny*20);g.stroke();
  }
  // Messstellen als nummerierte Punkte an ihrer Wand (Nummern wie in der PDF-Tabelle; Vergleichsstelle R grau)
  const gruppen={};
  _fsBgStellenSortiert(b).forEach(x=>{
    const st=x.st;
    if(st&&r&&st.raum===r.name&&/^W[1-4]$/.test(String(st.wand||'')))(gruppen[st.wand]=gruppen[st.wand]||[]).push(x);
  });
  Object.keys(gruppen).forEach(k=>{
    const i=+k.slice(1)-1,seite=FS_BG_SEITEN[(i+m.dreh)%4],liste=gruppen[k];
    const rr=26,abst=2*rr+8,s=_fsBgSkizzeSeite(geo,seite,0,1);
    const len=Math.hypot(s.bx-s.ax,s.by-s.ay),proZeile=Math.max(1,Math.floor((len*0.8)/abst));
    const mx=(s.ax+s.bx)/2,my=(s.ay+s.by)/2,dx=(s.bx-s.ax)/len,dy=(s.by-s.ay)/len;
    liste.forEach((x,n)=>{
      const zeile=Math.floor(n/proZeile),anz=Math.min(proZeile,liste.length-zeile*proZeile),pos=n-zeile*proZeile;
      const off=(pos-(anz-1)/2)*abst,tief=rr+22+zeile*abst;
      const px=mx+dx*off+s.nx*tief,py=my+dy*off+s.ny*tief;
      g.fillStyle=x.st.referenz?'#6b6b6b':'#1f5f8b';
      g.beginPath();g.arc(px,py,rr,0,Math.PI*2);g.fill();
      g.fillStyle='#ffffff';g.font='bold 28px sans-serif';g.textAlign='center';
      g.fillText(String(x.nr),px,py+1);
    });
  });
  _fsBgStempelZeichnen(g,r); // F7: Stempel (Tür, Fenster, Schrank, Heizkörper) – unter den Strichen
  _fsBgStricheZeichnen(g,r); // F5: von Hand Eingezeichnetes ganz obenauf
}
/* ── F5: Freihand einzeichnen (Tür, Fenster, Möbel … mit Finger oder Stift) ──────────────────────────────────────────
   Frank (01.10.2026): „Ich zeichne das einfach per Hand ein.“ Die Striche liegen beim Raum: raum.skizze.striche = [{f:Farbe, p:[[x,y],…]}], x/y als
   Anteil (0…1) der Zeichenfläche 900×640; sie erscheinen in der Skizze im Formular, in der Messliste und im PDF (derselbe Zeichner), drehen aber NICHT
   mit, wenn die Skizze gedreht wird. ⛔ Obergrenze an Punkten, damit das Protokoll nicht wächst. */
const FS_BG_STRICH_FARBEN=['#1c1c1e','#d62828','#1a7a3c'];
const FS_BG_STRICH_NAMEN=['schwarz','rot','grün'];
const FS_BG_STRICHE_MAX=4000;
function _fsBgStricheAnzahl(sk){return ((sk&&Array.isArray(sk.striche))?sk.striche:[]).reduce((a,s)=>a+((s&&Array.isArray(s.p))?s.p.length:0),0);}
// Pixel-Punkte der 900×640-Fläche → Anteile 0…1 (3 Stellen), Punkte näher als 3 px am vorigen entfallen, Unbrauchbares entfällt
function _fsBgStrichVereinfachen(pts){
  const out=[];let lx=null,ly=null;
  (Array.isArray(pts)?pts:[]).forEach(p=>{
    if(!Array.isArray(p))return;
    const x=+p[0],y=+p[1];
    if(!isFinite(x)||!isFinite(y))return;
    if(lx!==null&&Math.hypot(x-lx,y-ly)<3)return;
    lx=x;ly=y;
    out.push([Math.round(Math.max(0,Math.min(1,x/FS_BG_SKIZZE_W))*1000)/1000,Math.round(Math.max(0,Math.min(1,y/FS_BG_SKIZZE_H))*1000)/1000]);
  });
  return out;
}
// Strich anfügen; false, wenn nichts übrig bleibt oder die Obergrenze überschritten würde
function _fsBgStrichDazu(sk,farbe,pts){
  if(!sk)return false;
  const p=_fsBgStrichVereinfachen(pts);
  if(!p.length)return false;
  if(!Array.isArray(sk.striche))sk.striche=[];
  if(_fsBgStricheAnzahl(sk)+p.length>FS_BG_STRICHE_MAX)return false;
  sk.striche.push({f:FS_BG_STRICH_FARBEN.indexOf(farbe)>=0?farbe:FS_BG_STRICH_FARBEN[0],p:p});
  return true;
}
function _fsBgStrichZurueck(sk){if(sk&&Array.isArray(sk.striche)&&sk.striche.length){sk.striche.pop();return true;}return false;}
function _fsBgStricheLoeschen(sk){if(sk)sk.striche=[];return sk;}
// Striche auf den Zeichenbereich g (gleiche Fläche wie die Skizze); ein einzelner Punkt wird ein Tupfer
function _fsBgStricheZeichnen(g,r){
  const sk=(r&&r.skizze)||{},W=FS_BG_SKIZZE_W,H=FS_BG_SKIZZE_H;
  (Array.isArray(sk.striche)?sk.striche:[]).forEach(s=>{
    const p=((s&&Array.isArray(s.p))?s.p:[]).filter(q=>Array.isArray(q)&&isFinite(+q[0])&&isFinite(+q[1]));
    if(!p.length)return;
    g.strokeStyle=FS_BG_STRICH_FARBEN.indexOf(s.f)>=0?s.f:FS_BG_STRICH_FARBEN[0];g.lineWidth=5;g.lineCap='round';g.lineJoin='round';
    g.beginPath();g.moveTo(p[0][0]*W,p[0][1]*H);
    if(p.length===1)g.lineTo(p[0][0]*W+0.1,p[0][1]*H);
    else for(let i=1;i<p.length;i++)g.lineTo(p[i][0]*W,p[i][1]*H);
    g.stroke();
  });
}
/* ── F7: Stempel (Tür, Fenster, Schrank, Heizkörper) in der Raumskizze ─────────────────────────────────────────────────
   Frank (01.10.2026): „Stempel für Tür oder Fenster, die ich dahin klicken kann – und verschieben.“ Ein Stempel ist ein GEGENSTAND, kein gemalter Strich:
   raum.skizze.stempel = [{t:'tuer'|'fenster'|'schrank'|'heiz', x, y (Mitte, Anteil 0…1 der 900×640-Fläche), r (0/90/180/270 Grad), s (Größe 0,5…2)}].
   F41: Leisten und Text drehen in 45-Grad-Schritten; der Text-Stempel trägt zusätzlich txt (höchstens 30 Zeichen) und steht nie auf dem Kopf (0 · 315 · 270 · 45).
   Deshalb bleibt er jederzeit verschiebbar, drehbar und in der Größe änderbar. Er erscheint in der Skizze im Formular, in der Messliste und im PDF
   (derselbe Zeichner), unter den Freihand-Strichen. Wie die Striche dreht er NICHT mit, wenn die ganze Skizze gedreht wird. Die festen Schalter
   „Tür“ und „Fenster“ an den Wänden bleiben daneben bestehen. ⛔ Obergrenze: 60 Stempel je Raum. */
const FS_BG_STEMPEL=[{t:'tuer',n:'Tür'},{t:'fenster',n:'Fenster'},{t:'schrank',n:'Schrank'},{t:'heiz',n:'Heizkörper'},{t:'text',n:'Text'}];
// Größe bei Maßstab 1 auf der 900×640-Fläche (w × h) und Versatz der Trefferfläche (oy): die Tür liegt mit ihrer Lücke auf der Wand, der Schwenkbogen oberhalb
const FS_BG_STEMPEL_MASSE={tuer:{w:110,h:110,oy:-55},fenster:{w:120,h:18,oy:0},schrank:{w:110,h:56,oy:0},heiz:{w:100,h:22,oy:0},
  afenster:{w:90,h:110,oy:0},atuer:{w:80,h:150,oy:0},fbank:{w:120,h:14,oy:0},rohr:{w:16,h:200,oy:0},dfenster:{w:100,h:80,oy:0},schorn:{w:60,h:60,oy:0},gully:{w:44,h:44,oy:0},kuppel:{w:90,h:90,oy:0},steck:{w:36,h:36,oy:0},lampe:{w:60,h:60,oy:0},
  rinne:{w:320,h:16,oy:0,leiste:1},wandan:{w:320,h:22,oy:0,leiste:1},pult:{w:320,h:18,oy:0,leiste:1},text:{w:120,h:40,oy:0}}; /* F41: dritte Zeile = Dachkanten als Leisten (Dachrinne, Wandanschluss, Pult – „Größe“ ändert nur die LÄNGE, 160…640) und Text · F33: zweite Zeile = Außenskizze (Wand von vorn, Dachfläche von oben) */
const FS_BG_STEMPEL_MAX=60;
function _fsBgStempelAnzahl(sk){return (sk&&Array.isArray(sk.stempel))?sk.stempel.length:0;}
// Neuen Stempel in die Mitte der Skizze setzen; gibt seinen Platz zurück, -1 bei unbekannter Art oder voller Skizze
function _fsBgStempelNeu(sk,art,txt){
  if(!sk||!FS_BG_STEMPEL_MASSE[art]||_fsBgStempelAnzahl(sk)>=FS_BG_STEMPEL_MAX)return -1;
  const neu={t:art,x:0.5,y:0.5,r:0,s:1};
  if(art==='text'&&!_fsBgStempelTextSetzen(neu,txt))return -1; /* F41: ein Text-Stempel ohne Text entsteht nicht */
  if(!Array.isArray(sk.stempel))sk.stempel=[];
  sk.stempel.push(neu);
  return sk.stempel.length-1;
}
/* F41: Text-Stempel (Frank 05.10.2026: „ein Feld, wo ich zum Beispiel die Meterzahl eintrage … wie eine Art Textfeld“) – eine Zeile, höchstens 30 Zeichen; leer = false, nichts geändert */
const FS_BG_STEMPEL_TEXT_MAX=30;
function _fsBgStempelTextSetzen(st,txt){
  const tx=String(txt==null?'':txt).replace(/\s+/g,' ').trim().slice(0,FS_BG_STEMPEL_TEXT_MAX);
  if(!st||!tx)return false;
  st.txt=tx;return true;
}
function _fsBgStempelTextBreite(txt){return Math.max(44,String(txt||'').length*15+20);}
/* F41: Fläche eines Stempels in Bildpunkten der 900×640-Fläche {w,h,oy} – für Treffer und Auswahlrahmen. Leisten wachsen nur in der Länge, der Text richtet sich nach seiner Länge. null bei unbekannter Art */
function _fsBgStempelBox(st){
  const m=FS_BG_STEMPEL_MASSE[st&&st.t];
  if(!m)return null;
  const s=Math.max(0.5,Math.min(2,(+st.s)||1));
  if(m.leiste)return {w:m.w*s,h:m.h,oy:0};
  if(st.t==='text')return {w:_fsBgStempelTextBreite(st.txt)*s,h:m.h*s,oy:0};
  return {w:m.w*s,h:m.h*s,oy:(m.oy||0)*s};
}
// Mitte verschieben (Anteile 0…1, 3 Stellen); der Stempel bleibt auf der Fläche
function _fsBgStempelBewegen(st,x,y){
  if(!st||!isFinite(+x)||!isFinite(+y))return false;
  st.x=Math.round(Math.max(0.02,Math.min(0.98,+x))*1000)/1000;
  st.y=Math.round(Math.max(0.02,Math.min(0.98,+y))*1000)/1000;
  return true;
}
function _fsBgStempelDrehen(st){
  if(!st)return false;
  const r=(((parseInt(st.r,10)||0)%360)+360)%360,m=FS_BG_STEMPEL_MASSE[st.t];
  if(st.t==='text'){const f=[0,315,270,45];st.r=f[(f.indexOf(r)+1)%4];return true;} /* F41: waagerecht · schräg steigend · senkrecht (von unten nach oben) · schräg fallend – nie auf dem Kopf */
  st.r=(r+((m&&m.leiste)?45:90))%360; /* F41: Leisten in 45-Grad-Schritten, alles andere wie bisher 90 */
  return true;
}
// Größe um einen Schritt ändern (z. B. 0,25 oder −0,25), zwischen 0,5 und 2
function _fsBgStempelGroesse(st,schritt){
  if(!st||!isFinite(+schritt))return false;
  const s=Math.round(((+st.s||1)+(+schritt))*100)/100;
  st.s=Math.max(0.5,Math.min(2,s));
  return true;
}
function _fsBgStempelWeg(sk,i){
  if(!sk||!Array.isArray(sk.stempel)||!sk.stempel[i])return false;
  sk.stempel.splice(i,1);return true;
}
// Welcher Stempel liegt an dieser Stelle (Pixel der 900×640-Fläche)? Der oberste (zuletzt gesetzte) gewinnt, −1 = keiner. 14 px Rand, damit man mit dem Finger trifft.
function _fsBgStempelTreffer(sk,px,py){
  const l=(sk&&Array.isArray(sk.stempel))?sk.stempel:[];
  for(let i=l.length-1;i>=0;i--){
    const st=l[i],m=_fsBgStempelBox(st); /* F41 */
    if(!m)continue;
    const a=-((+st.r)||0)*Math.PI/180;
    const dx=px-st.x*FS_BG_SKIZZE_W,dy=py-st.y*FS_BG_SKIZZE_H;
    const lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
    if(Math.abs(lx)<=m.w/2+14&&Math.abs(ly-m.oy)<=m.h/2+14)return i;
  }
  return -1;
}
// Zeichnet die Stempel auf den Zeichenbereich g (gleiche Fläche wie die Skizze). Ohne Stempel: keine Aufrufe.
function _fsBgStempelZeichnen(g,r){
  const sk=(r&&r.skizze)||{},W=FS_BG_SKIZZE_W,H=FS_BG_SKIZZE_H;
  (Array.isArray(sk.stempel)?sk.stempel:[]).forEach(st=>{
    if(!st||!FS_BG_STEMPEL_MASSE[st.t]||!isFinite(+st.x)||!isFinite(+st.y))return;
    if(st.t==='text'&&!String(st.txt||'').trim())return;
    const s=Math.max(0.5,Math.min(2,(+st.s)||1)),leiste=!!FS_BG_STEMPEL_MASSE[st.t].leiste,L=FS_BG_STEMPEL_MASSE[st.t].w*s; /* F41: L = Länge einer Leiste */
    g.save();
    g.translate(st.x*W,st.y*H);g.rotate(((+st.r)||0)*Math.PI/180);if(!leiste)g.scale(s,s);
    g.lineCap='butt';g.lineJoin='miter';
    if(st.t==='tuer'){ // Lücke in der Wand, Türblatt und Schwenkbogen (nach oben, bei Drehung 0)
      g.strokeStyle='#ffffff';g.lineWidth=24;g.beginPath();g.moveTo(-55,0);g.lineTo(55,0);g.stroke();
      g.strokeStyle='#8a5a2b';g.lineWidth=4;g.beginPath();g.moveTo(-55,0);g.lineTo(-55,-110);g.stroke();
      g.lineWidth=3;g.beginPath();g.arc(-55,0,110,-Math.PI/2,0,false);g.stroke();
    }else if(st.t==='fenster'){
      g.fillStyle='#9fd6ff';g.fillRect(-60,-9,120,18);
      g.strokeStyle='#1f5f8b';g.lineWidth=3;g.strokeRect(-60,-9,120,18);
      g.beginPath();g.moveTo(-60,0);g.lineTo(60,0);g.stroke();
    }else if(st.t==='schrank'){
      g.fillStyle='#fdf0d5';g.fillRect(-55,-28,110,56);
      g.strokeStyle='#8a5a2b';g.lineWidth=4;g.strokeRect(-55,-28,110,56);
      g.lineWidth=2;g.beginPath();g.moveTo(-55,-28);g.lineTo(55,28);g.moveTo(55,-28);g.lineTo(-55,28);g.stroke();
    }else if(st.t==='afenster'){ /* F33: Fenster von vorn */
      g.fillStyle='#dff1ff';g.fillRect(-45,-55,90,110);
      g.strokeStyle='#1f5f8b';g.lineWidth=4;g.strokeRect(-45,-55,90,110);
      g.lineWidth=2;g.beginPath();g.moveTo(0,-55);g.lineTo(0,55);g.moveTo(-45,0);g.lineTo(45,0);g.stroke();
    }else if(st.t==='atuer'){ /* Tür von vorn */
      g.fillStyle='#f1e3d0';g.fillRect(-40,-75,80,150);
      g.strokeStyle='#8a5a2b';g.lineWidth=4;g.strokeRect(-40,-75,80,150);
      g.fillStyle='#8a5a2b';g.beginPath();g.arc(24,6,5,0,Math.PI*2);g.fill();
    }else if(st.t==='fbank'){ /* Fensterbank */
      g.fillStyle='#bdbdbd';g.fillRect(-60,-7,120,14);
      g.strokeStyle='#444444';g.lineWidth=2;g.strokeRect(-60,-7,120,14);
    }else if(st.t==='rohr'){ /* Fallrohr */
      g.fillStyle='#d9d9d9';g.fillRect(-8,-100,16,200);
      g.strokeStyle='#444444';g.lineWidth=2;g.strokeRect(-8,-100,16,200);
    }else if(st.t==='dfenster'){ /* Dachfenster von oben */
      g.fillStyle='#dff1ff';g.fillRect(-50,-40,100,80);
      g.strokeStyle='#1f5f8b';g.lineWidth=4;g.strokeRect(-50,-40,100,80);
      g.lineWidth=2;g.beginPath();g.moveTo(-50,-40);g.lineTo(50,40);g.stroke();
    }else if(st.t==='schorn'){ /* Schornstein */
      g.fillStyle='#8f8f8f';g.fillRect(-30,-30,60,60);
      g.strokeStyle='#333333';g.lineWidth=4;g.strokeRect(-30,-30,60,60);
      g.lineWidth=2;g.beginPath();g.moveTo(-30,-30);g.lineTo(30,30);g.moveTo(30,-30);g.lineTo(-30,30);g.stroke();
    }else if(st.t==='gully'){ /* Ablauf */
      g.fillStyle='#ffffff';g.beginPath();g.arc(0,0,22,0,Math.PI*2);g.fill();
      g.strokeStyle='#333333';g.lineWidth=4;g.beginPath();g.arc(0,0,22,0,Math.PI*2);g.stroke();
      g.lineWidth=2;g.beginPath();g.moveTo(-14,0);g.lineTo(14,0);g.moveTo(0,-14);g.lineTo(0,14);g.stroke();
    }else if(st.t==='kuppel'){ /* Lichtkuppel */
      g.fillStyle='#eef0ff';g.beginPath();g.arc(0,0,45,0,Math.PI*2);g.fill();
      g.strokeStyle='#333333';g.lineWidth=4;g.beginPath();g.arc(0,0,45,0,Math.PI*2);g.stroke();
      g.lineWidth=2;g.beginPath();g.arc(0,0,26,0,Math.PI*2);g.stroke();
    }else if(st.t==='steck'){ /* F36: Steckdose (Wand von vorn) */
      g.fillStyle='#ffffff';g.beginPath();g.arc(0,0,18,0,Math.PI*2);g.fill();
      g.strokeStyle='#333333';g.lineWidth=3;g.beginPath();g.arc(0,0,18,0,Math.PI*2);g.stroke();
      g.fillStyle='#333333';g.beginPath();g.arc(-6,0,3,0,Math.PI*2);g.fill();g.beginPath();g.arc(6,0,3,0,Math.PI*2);g.fill();
    }else if(st.t==='lampe'){ /* Lampe (Decke von unten) */
      g.fillStyle='#fff7c2';g.beginPath();g.arc(0,0,30,0,Math.PI*2);g.fill();
      g.strokeStyle='#333333';g.lineWidth=3;g.beginPath();g.arc(0,0,30,0,Math.PI*2);g.stroke();
      g.lineWidth=2;g.beginPath();g.moveTo(-21,-21);g.lineTo(21,21);g.moveTo(21,-21);g.lineTo(-21,21);g.stroke();
    }else if(st.t==='rinne'){ /* F41: Dachrinne – Doppellinie. Die drei Leisten unterscheiden sich am MUSTER, nicht an der Farbe */
      g.fillStyle='#e3e3e3';g.fillRect(-L/2,-8,L,16);
      g.strokeStyle='#333333';g.lineWidth=3;g.beginPath();g.moveTo(-L/2,-8);g.lineTo(L/2,-8);g.moveTo(-L/2,8);g.lineTo(L/2,8);g.stroke();
      g.lineWidth=2;g.beginPath();g.moveTo(-L/2,-8);g.lineTo(-L/2,8);g.moveTo(L/2,-8);g.lineTo(L/2,8);g.stroke();
    }else if(st.t==='wandan'){ /* Wandanschluss – schraffiert */
      g.fillStyle='#ffffff';g.fillRect(-L/2,-11,L,22);
      g.strokeStyle='#333333';g.lineWidth=2;g.beginPath();
      for(let x=-L/2;x<=L/2-22;x+=14){g.moveTo(x,11);g.lineTo(x+22,-11);}
      g.stroke();
      g.strokeRect(-L/2,-11,L,22);
    }else if(st.t==='pult'){ /* Pult (obere Kante des Pultdachs) – dicke Außenkante */
      g.fillStyle='#f3f3f3';g.fillRect(-L/2,-9,L,18);
      g.strokeStyle='#333333';g.lineWidth=2;g.strokeRect(-L/2,-9,L,18);
      g.lineWidth=7;g.beginPath();g.moveTo(-L/2,-6);g.lineTo(L/2,-6);g.stroke();
    }else if(st.t==='text'){ /* Text – schwarz auf weißem Grund, damit er über Linien lesbar bleibt */
      const tx=String(st.txt||''),bw=_fsBgStempelTextBreite(tx);
      g.fillStyle='#ffffff';g.fillRect(-bw/2,-20,bw,40);
      g.strokeStyle='#333333';g.lineWidth=1.5;g.strokeRect(-bw/2,-20,bw,40);
      g.fillStyle='#111111';g.font='bold 26px sans-serif';g.textAlign='center';g.textBaseline='middle';
      g.fillText(tx,0,1,bw-12);
    }else{ // Heizkörper
      g.fillStyle='#fde2e2';g.fillRect(-50,-11,100,22);
      g.strokeStyle='#b3261e';g.lineWidth=3;g.strokeRect(-50,-11,100,22);
      g.lineWidth=2;g.beginPath();
      [-30,-10,10,30].forEach(x=>{g.moveTo(x,-11);g.lineTo(x,11);});
      g.stroke();
    }
    g.restore();
  });
}
// Bild der Skizze als data:-Adresse (JPEG) – null, wenn kein Zeichenbereich verfügbar ist. opt.hl = Wand, die orange hervorgehoben wird (nur Anzeige)
function _fsBgSkizzeBild(b,r,opt){
  try{
    const cv=document.createElement('canvas');cv.width=FS_BG_SKIZZE_W;cv.height=FS_BG_SKIZZE_H;
    const g=cv.getContext('2d');
    if(!g)return null;
    _fsBgSkizzeZeichnen(g,b,r,opt);
    return cv.toDataURL('image/jpeg',0.92); // JPEG: ein PNG läge in jsPDF unkomprimiert im PDF (mehrere MB je Skizze)
  }catch(e){console.warn('[Feuchte] Skizze:',e);return null;}
}
// Das Zeichenfenster: die Skizze groß, zwei Arten zu arbeiten – „Zeichnen“ (Freihand mit Finger oder Stift) und „Stempel“ (Tür, Fenster, Schrank, Heizkörper
// setzen, mit dem Finger ziehen, drehen, größer/kleiner, löschen). Zweiter Aufruf schließt es. fertig() wird beim Schließen gerufen.
function _fsBgEinzeichnenZeigen(b,r,fertig){
  const sk=r&&r.skizze;
  if(!sk||!sk.an)return;
  const alt=document.getElementById('_fsEinzeichnen');if(alt){alt.remove();return;}
  const W=FS_BG_SKIZZE_W,H=FS_BG_SKIZZE_H;
  const unterlage=_fsBgSkizzeBild(b,Object.assign({},r,{skizze:Object.assign({},sk,{striche:[],stempel:[]})}),{ohneMarken:true}); // die Zeichnung ohne Striche und Stempel (F33: und ohne Stellen-Nummern), die kommen live darüber
  if(!unterlage){toast('Einzeichnen geht hier nicht (kein Zeichenbereich)','error',4000);return;}
  const ov=document.createElement('div');ov.id='_fsEinzeichnen';_fsSichtAn(ov);
  ov.style.cssText='position:fixed;inset:0;z-index:99999;background:var(--bg);color:var(--text);display:flex;flex-direction:column;';
  const kopf=document.createElement('div');kopf.style.cssText='background:'+FS_FARBE+';padding:10px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  const zu=document.createElement('button');zu.type='button';zu.textContent='←';zu.setAttribute('aria-label','Einzeichnen beenden');zu.setAttribute('data-fs-ez-zu','1');
  zu.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:44px;height:44px;border-radius:8px;font-size:20px;cursor:pointer;flex-shrink:0;';
  const ti=document.createElement('div');ti.style.cssText='font-size:var(--fs16,16px);font-weight:700;color:#fff;flex:1;min-width:0;';ti.textContent='✏ Einzeichnen – '+(String(r.name||'').trim()||'Raum');
  kopf.append(zu,ti);
  const leiste=document.createElement('div');leiste.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--border);flex-shrink:0;';
  const feld=document.createElement('div');feld.style.cssText='flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px;background:var(--bg3);';
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.setAttribute('data-fs-ez-flaeche','1');
  cv.style.cssText='display:block;max-width:100%;max-height:100%;width:auto;height:auto;background:#fff;border:1px solid var(--border);touch-action:none;cursor:crosshair;';
  feld.appendChild(cv);
  const fuss=document.createElement('div');fuss.style.cssText='flex-shrink:0;padding:10px 14px 14px;border-top:1px solid var(--border);';
  const fb=document.createElement('button');fb.type='button';fb.textContent='✓ Fertig';fb.setAttribute('data-fs-ez-fertig','1');
  fb.style.cssText='width:100%;min-height:56px;border-radius:12px;border:none;background:'+FS_FARBE+';color:#fff;font-size:var(--fs18,18px);font-weight:700;font-family:inherit;cursor:pointer;';
  fuss.appendChild(fb);
  ov.append(kopf,leiste,feld,fuss);
  const g=cv.getContext('2d');
  const bild=new Image();let bildDa=false;
  let modus=sk.aussen?'stelle':'zeichnen',farbe=FS_BG_STRICH_FARBEN[0],aktiv=null,zieh=null,sel=-1,stiftGesehen=false,selS=null,ziehS=null,loseS=false,festGesagtS=false,neuText=null; /* F34: loseS = gewählte Nummer lässt sich verschieben; neuText = Beschreibung einer neuen Stelle, die auf den Tipp in die Skizze wartet */ /* F33: Außenskizze beginnt bei „Stellen“; selS = gewählte Stelle, ziehS = Marke wird gezogen */
  const neu=()=>{
    g.fillStyle='#ffffff';g.fillRect(0,0,W,H);
    if(bildDa)g.drawImage(bild,0,0,W,H);
    _fsBgStempelZeichnen(g,r);
    _fsBgStricheZeichnen(g,r);
    if(sk.aussen)_fsAsMarkenZeichnen(g,b,sk,modus==='stelle'?selS:null,modus==='stelle'&&loseS); /* F33, F34 */
    const st=(modus==='stempel'&&sel>=0&&Array.isArray(sk.stempel))?sk.stempel[sel]:null,m=st?_fsBgStempelBox(st):null; /* F41 */
    if(st&&m){ // Auswahlrahmen – nur hier im Fenster, nicht im gespeicherten Bild
      g.save();g.translate(st.x*W,st.y*H);g.rotate(((+st.r)||0)*Math.PI/180);
      g.strokeStyle='#1f5f8b';g.lineWidth=3;g.setLineDash([10,7]);
      g.strokeRect(-m.w/2-8,m.oy-m.h/2-8,m.w+16,m.h+16);
      g.setLineDash([]);g.restore();
    }
  };
  bild.onload=()=>{bildDa=true;neu();};
  bild.src=unterlage;
  const knopf=(txt,stil,fn,attr)=>{
    const x=document.createElement('button');x.type='button';x.textContent=txt;x.style.cssText='font-family:inherit;cursor:pointer;border-radius:10px;min-height:48px;padding:6px 12px;font-size:var(--fs15,15px);font-weight:700;color:var(--text);'+stil;
    if(attr)x.setAttribute(attr[0],attr[1]);
    x.onclick=fn;return x;
  };
  const RAND='border:2px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);';
  const leisteBauen=()=>{
    leiste.innerHTML='';
    (sk.aussen?[['stelle','① Stellen'],['stempel','▣ Stempel'],['zeichnen','✏ Zeichnen']]:[['zeichnen','✏ Zeichnen'],['stempel','▣ Stempel']]).forEach(([k,txt])=>{
      const an=modus===k;
      leiste.appendChild(knopf(txt,'border:3px solid '+(an?'var(--fs-krd,'+FS_FARBE+')':'var(--border)')+';background:'+(an?'var(--fs-can,rgba(31,95,139,.18))':'var(--fs-cfl,transparent)')+';',()=>{modus=k;sel=-1;loseS=false;neuText=null;neu();leisteBauen();},['data-fs-ez-modus',k]));
    });
    const trenn=document.createElement('span');trenn.style.cssText='width:1px;align-self:stretch;background:var(--border);';leiste.appendChild(trenn);
    if(modus==='stelle'){ /* F33: Stellen des Bereichs als Nummern in die Skizze setzen */
      const ls=_fsAsStellen(b,sk);
      if(selS&&ls.indexOf(selS)<0)selS=null;
      if(!selS&&neuText===null)selS=ls.find(s=>!_fsAsMarkeOk(s))||null;
      ls.forEach(s=>{
        const hier=_fsAsMarkeOk(s)&&s.skz.k===sk.id,woanders=_fsAsMarkeOk(s)&&s.skz.k!==sk.id,an=selS===s,nr=_fsAsNummer(b,s);
        leiste.appendChild(knopf('Stelle '+nr+(hier?' ✓':woanders?' (andere Skizze)':''),'border:3px solid '+(an?'#d9480f':'var(--border)')+';background:'+(an?'rgba(217,72,15,.16)':'var(--fs-cfl,transparent)')+';',()=>{selS=s;loseS=false;neuText=null;neu();leisteBauen();},['data-fs-ez-stelle',String(nr)]));
      });
      /* F34: neue Stelle gleich hier anlegen – erst die kurze Beschreibung, dann in die Skizze tippen */
      leiste.appendChild(knopf('＋ neue Stelle','border:2px dashed #d9480f;background:'+(neuText!==null?'rgba(217,72,15,.16)':'var(--fs-cfl,transparent)')+';',()=>{const tx=prompt('Neue Stelle in „'+(sk.bereich||'Außen')+'“ – wo ist sie?\n(kurze Beschreibung, z. B. Riss unter der Traufe)','');if(tx===null)return;neuText=String(tx);selS=null;loseS=false;neu();leisteBauen();},['data-fs-ez-stelleneu','1']));
      const selHier=!!selS&&_fsAsMarkeOk(selS)&&selS.skz.k===sk.id;
      if(selHier){
        leiste.appendChild(knopf(loseS?'✓ Fest':'✥ Verschieben','border:3px solid '+(loseS?'#2e7d4f':'var(--border)')+';background:'+(loseS?'rgba(46,125,79,.16)':'var(--fs-cfl,transparent)')+';',()=>{loseS=!loseS;neu();leisteBauen();},['data-fs-ez-stellelose','1']));
        leiste.appendChild(knopf('Aus Skizze nehmen',RAND+'color:var(--red);',()=>{if(_fsAsMarkeWeg(selS)){loseS=false;scheduleSave();neu();leisteBauen();}},['data-fs-ez-stelleweg','1']));
      }
      if(selS)leiste.appendChild(knopf('Beschreibung ändern',RAND,()=>{const tx=prompt('Beschreibung der Stelle '+_fsAsNummer(b,selS)+' (Wo?)',String(selS.ort||''));if(tx===null)return;selS.ort=String(tx).trim();scheduleSave();neu();leisteBauen();},['data-fs-ez-stelletext','1']));
      const z=document.createElement('span');z.setAttribute('data-fs-ez-zaehler','1');z.style.cssText='font-size:var(--fs13,13px);color:var(--text2);';
      const selName=selS?'Stelle '+_fsAsNummer(b,selS)+(String(selS.ort||'').trim()?' („'+_fsBgSkizzeKuerzen(selS.ort,30)+'“)':''):'';
      z.textContent=neuText!==null?'Neue Stelle'+(neuText.trim()?' („'+_fsBgSkizzeKuerzen(neuText,30)+'“)':'')+': jetzt in die Skizze tippen, wo sie ist'
        :!ls.length?'Noch keine Stelle in diesem Bereich – „＋ neue Stelle“ antippen.'
        :!selS?'Oben eine Stelle wählen oder „＋ neue Stelle“ antippen'
        :!selHier?selName+': in die Skizze tippen, wo sie ist'
        :loseS?selName+' ist lose: Pfeilspitze oder Kreis ziehen oder an die richtige Stelle tippen – dann „✓ Fest“'
        :selName+' ist fest (🔒) – „✥ Verschieben“ macht sie lose';
      leiste.appendChild(z);
    }else if(modus==='zeichnen'){
      FS_BG_STRICH_FARBEN.forEach((f,i)=>{
        const an=f===farbe;
        leiste.appendChild(knopf(FS_BG_STRICH_NAMEN[i],'border:3px solid '+(an?'var(--fs-krd,'+FS_FARBE+')':'var(--border)')+';background:var(--fs-cfl,transparent);border-left:14px solid '+f+';',()=>{farbe=f;leisteBauen();},['data-fs-ez-farbe',String(i)]));
      });
      leiste.appendChild(knopf('↶ Rückgängig',RAND,()=>{if(_fsBgStrichZurueck(sk)){scheduleSave();neu();leisteBauen();}},['data-fs-ez-zurueck','1']));
      leiste.appendChild(knopf('Alle Striche löschen',RAND+'color:var(--red);',()=>{
        if(!_fsBgStricheAnzahl(sk))return;
        if(!confirm('Alle von Hand gezeichneten Striche in diesem Raum löschen? Die Stempel bleiben.'))return;
        _fsBgStricheLoeschen(sk);scheduleSave();neu();leisteBauen();
      },['data-fs-ez-loeschen','1']));
      const z=document.createElement('span');z.setAttribute('data-fs-ez-zaehler','1');z.style.cssText='font-size:var(--fs13,13px);color:var(--text2);';
      const n=(sk.striche||[]).length;z.textContent=n+' Strich'+(n===1?'':'e');
      leiste.appendChild(z);
    }else{
      _fsStempelListe(sk).forEach(x=>{ /* F33: die Außenskizze hat eigene Stempel */
        leiste.appendChild(knopf('+ '+x.n,'border:2px solid '+FS_FARBE+';background:rgba(31,95,139,.10);',()=>{
          let tx; /* F41: der Text-Stempel fragt zuerst nach dem Text */
          if(x.t==='text'){tx=prompt('Text in der Skizze – z. B. eine Länge „12,50 m“ (höchstens '+FS_BG_STEMPEL_TEXT_MAX+' Zeichen)','');if(tx===null||!String(tx).trim())return;}
          if(_fsBgStempelAnzahl(sk)>=FS_BG_STEMPEL_MAX){toast('Genug Stempel in diesem Raum – bitte einen löschen','info',3500);return;}
          const i=_fsBgStempelNeu(sk,x.t,tx);
          if(i<0){toast('Genug Stempel in diesem Raum – bitte einen löschen','info',3500);return;}
          sel=i;scheduleSave();neu();leisteBauen();
        },['data-fs-ez-neu',x.t]));
      });
      const st=(sel>=0&&Array.isArray(sk.stempel))?sk.stempel[sel]:null;
      if(st){
        leiste.appendChild(knopf('↻ Drehen',RAND,()=>{if(_fsBgStempelDrehen(st)){scheduleSave();neu();}},['data-fs-ez-dreh','1']));
        const lst=!!(FS_BG_STEMPEL_MASSE[st.t]||{}).leiste; /* F41: bei einer Leiste ändert sich nur die Länge */
        leiste.appendChild(knopf(lst?'Länger':'Größer',RAND,()=>{if(_fsBgStempelGroesse(st,0.25)){scheduleSave();neu();}},['data-fs-ez-gross','1']));
        leiste.appendChild(knopf(lst?'Kürzer':'Kleiner',RAND,()=>{if(_fsBgStempelGroesse(st,-0.25)){scheduleSave();neu();}},['data-fs-ez-klein','1']));
        if(st.t==='text')leiste.appendChild(knopf('Text ändern',RAND,()=>{const tx=prompt('Text in der Skizze (höchstens '+FS_BG_STEMPEL_TEXT_MAX+' Zeichen)',String(st.txt||''));if(tx===null)return;if(_fsBgStempelTextSetzen(st,tx)){scheduleSave();neu();}else toast('Der Text ist leer – zum Entfernen „Löschen“ antippen','info',3500);},['data-fs-ez-sttext','1']));
        leiste.appendChild(knopf('Löschen',RAND+'color:var(--red);',()=>{if(_fsBgStempelWeg(sk,sel)){sel=-1;scheduleSave();neu();leisteBauen();}},['data-fs-ez-stweg','1']));
      }
      const z=document.createElement('span');z.setAttribute('data-fs-ez-zaehler','1');z.style.cssText='font-size:var(--fs13,13px);color:var(--text2);';
      const n=_fsBgStempelAnzahl(sk);
      z.textContent=n+' Stempel'+(st?' – ziehen zum Verschieben':' – antippen oder oben einen setzen');
      leiste.appendChild(z);
    }
  };
  const pos=e=>{const rc=cv.getBoundingClientRect();return [(e.clientX-rc.left)/rc.width*W,(e.clientY-rc.top)/rc.height*H];};
  cv.addEventListener('pointerdown',e=>{
    if(e.pointerType==='pen')stiftGesehen=true;
    if(e.pointerType==='touch'&&stiftGesehen)return; // mit Stift: Handballen und Finger zählen nicht
    e.preventDefault();
    try{cv.setPointerCapture(e.pointerId);}catch(x){}
    const p=pos(e);
    if(modus==='stelle'){ /* F33: auf eine Nummer tippen = diese Stelle wählen und ziehen; sonst die gewählte Stelle hierher setzen */
      if(neuText!==null){ /* F34: „＋ neue Stelle“ – hier anlegen und setzen */
        const sn=_fsAsStelleNeu(b,sk,neuText);neuText=null;
        if(sn){_fsAsMarkeSetzen(sk,sn,p[0]/W,p[1]/H);selS=sn;loseS=false;scheduleSave();}
        neu();leisteBauen();return;
      }
      const tr=_fsAsTreffer(b,sk,p[0],p[1]);
      if(tr&&tr.s!==selS){selS=tr.s;loseS=false;neu();leisteBauen();return;} /* andere Nummer angetippt = auswählen, nichts bewegen */
      if(!selS){toast('Erst oben eine Stelle wählen oder „＋ neue Stelle“ antippen','info',3000);return;}
      if(!(_fsAsMarkeOk(selS)&&selS.skz.k===sk.id)){_fsAsMarkeSetzen(sk,selS,p[0]/W,p[1]/H);loseS=false;scheduleSave();neu();leisteBauen();return;} /* erstes Setzen – danach fest */
      if(!loseS){if(!festGesagtS){festGesagtS=true;toast('Die Nummer ist fest – zum Ändern „✥ Verschieben“ antippen','info',3500);}return;} /* F34: fest = Tippen verrückt nichts */
      ziehS={id:e.pointerId,s:selS,teil:(tr&&tr.teil==='ring')?'ring':'ziel'};
      if(!tr)_fsAsMarkeSetzen(sk,selS,p[0]/W,p[1]/H);
      neu();
      return;
    }
    if(modus==='stempel'){ // Stempel antippen = auswählen, ziehen = verschieben; daneben tippen = nichts mehr ausgewählt
      const i=_fsBgStempelTreffer(sk,p[0],p[1]);
      sel=i;
      if(i>=0){const st=sk.stempel[i];zieh={id:e.pointerId,dx:st.x*W-p[0],dy:st.y*H-p[1],bewegt:false};}
      neu();leisteBauen();
      return;
    }
    aktiv={id:e.pointerId,pts:[p]};
  });
  cv.addEventListener('pointermove',e=>{
    if(ziehS&&e.pointerId===ziehS.id){e.preventDefault();const p=pos(e),zs=ziehS.s;if(ziehS.teil==='ring'){const tx=zs.skz.x*W,ty=zs.skz.y*H;if(_fsAsRingSetzen(zs,Math.atan2(-(p[1]-ty),p[0]-tx)*180/Math.PI,Math.hypot(p[0]-tx,p[1]-ty)))neu();}else if(_fsAsMarkeSetzen(sk,zs,p[0]/W,p[1]/H))neu();return;} /* F33, F34: Kreis ziehen = Richtung/Länge, sonst die Stelle */
    if(zieh&&e.pointerId===zieh.id){
      e.preventDefault();
      const p=pos(e),st=sk.stempel[sel];
      if(st&&_fsBgStempelBewegen(st,(p[0]+zieh.dx)/W,(p[1]+zieh.dy)/H)){zieh.bewegt=true;neu();}
      return;
    }
    if(!aktiv||e.pointerId!==aktiv.id)return;
    e.preventDefault();
    const p=pos(e),q=aktiv.pts[aktiv.pts.length-1];
    aktiv.pts.push(p);
    g.strokeStyle=farbe;g.lineWidth=5;g.lineCap='round';g.lineJoin='round';
    g.beginPath();g.moveTo(q[0],q[1]);g.lineTo(p[0],p[1]);g.stroke(); // Livespur; das gespeicherte Bild entsteht beim Loslassen
  });
  const ende=e=>{
    if(ziehS&&e.pointerId===ziehS.id){ziehS=null;scheduleSave();neu();leisteBauen();return;} /* F33 */
    if(zieh&&e.pointerId===zieh.id){const z=zieh;zieh=null;if(z.bewegt)scheduleSave();neu();return;}
    if(!aktiv||e.pointerId!==aktiv.id)return;
    const a=aktiv;aktiv=null;
    const ok=_fsBgStrichDazu(sk,farbe,a.pts);
    if(ok)scheduleSave();
    else if(a.pts.length)toast('Genug eingezeichnet – bitte einen Strich zurücknehmen oder alle Striche löschen','info',3500);
    neu();leisteBauen();
  };
  cv.addEventListener('pointerup',ende);
  cv.addEventListener('pointercancel',ende);
  const schliessen=()=>{ov.remove();if(typeof fertig==='function'){try{fertig();}catch(x){console.warn('[Feuchte] Einzeichnen:',x);}}};
  zu.onclick=schliessen;fb.onclick=schliessen;
  leisteBauen();
  document.body.appendChild(ov);
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
    const vorab=_fsIstVorab(bericht); // F16
    doc.text(vorab?(bericht.schlank?String(doc.splitTextToSize(_fsB2Name(bericht),W-2*M)[0]||FS_B2_TITEL):FS_VB_TITEL):FS_BG_TITEL,M,12); // F23, F26
    doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text(vorab?(bericht.schlank?'Feststellungen vor Ort':'Feststellungen vor der Schadenaufnahme'):'Feststellungen vor Ort – Feuchte '+(keller?'im Keller':'in der Wohnung'),M,18);
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
      if(vorab){ // F16: Versicherung, Zugang, Ansprechpartner; kein Umfangstext (Franks Wahl)
        if(hat(k.besuchBei))rows.push(['Besichtigung bei',String(k.besuchBei).trim()]); // F17
        if(hat(k.lage))rows.push(['Lage',String(k.lage).trim()]); // F17
        if(hat(k.versicherung))rows.push(['Versicherung',String(k.versicherung).trim()]);
        if(hat(k.schadennr))rows.push(['Schadennummer',String(k.schadennr).trim()]);
        if(hat(k.zugang))rows.push(['Zugang',String(k.zugang).trim()]);
        if(hat(k.ansprechpartner))rows.push(['Ansprechpartner',String(k.ansprechpartner).trim()]);
      }
      tabelle2(rows);
      if(!vorab)absatz('Umfang: '+FS_BG_UMFANG,{groesse:8.5,farbe:[70,70,70],abstand:5});
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
      const hatWaende=(bericht.raeume||[]).some(r=>_fsBgRaumBenutzt(bericht,r)); // F3a: vorbelegte Wände allein zählen nicht
      const hatSkizze=(bericht.raeume||[]).some(r=>r&&r.skizze&&r.skizze.an);
      if(luft.length||stellen.length||hatWaende||hatSkizze){
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
            if(!r||!_fsBgRaumBenutzt(bericht,r))return;
            const ws=(Array.isArray(r.waende)?r.waende:[]).filter(q=>q&&q.k);
            const rf=fotoHinweis(r.fotoRefs);
            if(!ws.length&&!rf)return;
            const liste=ws.map(q=>q.k+(hat(q.art)?' '+String(q.art).trim():'')+fotoHinweis(q.fotoRefs)).join(', ');
            absatz((hat(r.name)?String(r.name).trim():'Raum')+rf+(liste?' – Wände: '+liste:''),{groesse:8,farbe:[70,70,70],abstand:1});
            n++;
          });
          if(n)y+=3;
        }
        { // F3: Skizze je Raum – nur wenn für den Raum angelegt
          for(const r of (bericht.raeume||[])){
            if(!r||!r.skizze||!r.skizze.an)continue;
            const url=_fsBgSkizzeBild(bericht,r);
            if(!url)continue;
            const sw=120,sh=sw*FS_BG_SKIZZE_H/FS_BG_SKIZZE_W;
            if(y+sh+16>285){doc.addPage();y=M;}
            unterTitel('Skizze '+(hat(r.name)?String(r.name).trim():'Raum'));
            try{doc.addImage(url,'JPEG',M,y,sw,sh);}catch(e){console.warn('[Feuchte] Skizze:',e);}
            y+=sh+2;
            absatz('Nicht maßstäblich. Blau = Fenster, Bogen = Tür. Die Nummern sind die der Messstellen-Tabelle; ein Punkt zeigt die Wand, nicht die genaue Stelle und Höhe.',{groesse:7.5,farbe:[100,100,100],abstand:4});
          }
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
      const sbText=(vorab&&hat(bericht.schadenbild))?String(bericht.schadenbild).trim():''; // F19
      const vbs=(vorab&&typeof _fsVbStellenGefuellt==='function')?_fsVbStellenGefuellt(bericht):[]; // F21
      const mzl=vorab?_fsVbMeldungZeile(bericht):'',erg=vorab?_fsVbErgebnisZeilen(bericht):[]; // F22
      if(gruppen.length||sbText||vbs.length||mzl||erg.length){
        abschnitt('Feststellungen vor Ort');
        if(mzl){absatz(mzl,{abstand:3});y+=1;} // F22
        if(erg.length&&!bericht.schlank){unterTitel('Eingrenzung');erg.forEach(z=>absatz(z,{einzug:3,abstand:1.5}));y+=3;} // F22
        if(sbText){unterTitel('Beschreibung des Schadenbildes');absatz(sbText,{einzug:3,abstand:3});y+=2;}
        if(vbs.length){
          const lbp=bericht.schlank?_fsLbPunkte(bericht):[]; // F24
          if(!bericht.schlank)unterTitel('Stelle für Stelle');
          if(bericht.schlank){ // F24, F28: Besichtigung 2 – „Feststellungen innen“ (je Raum „Wohnzimmer, Stelle 1 · Decke: …“) und „Feststellungen außen“ („Außen – Dach, Stelle 1 · …“); Seite nur, wenn gesetzt
            ['innen','aussen'].forEach(typ=>{
              const zeilen=[];
              _fsVbRaumGruppen(bericht,typ).forEach(g=>g.stellen.forEach(({s})=>{
                const x=vbs.find(v=>v.s===s);if(!x)return;
                const st=_fsVbStelleSatz(Object.assign({},s,{raum:''})),pk=lbp.find(q=>q.s===s),se=_fsSeiteText(s.seite);
                zeilen.push(_fsVbBezeichnung(bericht,s,x.nr)+' · '+(st||'Stelle')+(se?' – Seite '+se:'')+fotoHinweis(s.fotoRefs)+(pk?' – Luftbild Nr. '+pk.n:'')+((_fsAsMarkeOk(s)&&_fsAsListe(bericht).some(k=>k.id===s.skz.k))?' – Skizze „'+(String((_fsAsListe(bericht).find(k=>k.id===s.skz.k)||{}).name||'').trim()||'Außen')+'“':'')); /* F33 */
              }));
              if(zeilen.length){unterTitel(typ==='innen'?'Feststellungen innen':'Feststellungen außen');zeilen.forEach(z=>absatz(z,{einzug:3,abstand:1.5}));y+=3;}
            });
          }else{vbs.forEach(x=>{const st=_fsVbStelleSatz(x.s);absatz(x.nr+' · '+(st||'Stelle')+fotoHinweis(x.s.fotoRefs),{einzug:3,abstand:1.5});});y+=3;}
          if(lbp.length){ // F24: Lage von außen – Luftbild mit den Markierungen (oder, wenn das Bild nicht zu laden ist, die Lage als Text)
            const bild=await _fsLuftbildBild(bericht,bericht.luftbildEbene||'');
            const iw=W-2*M,ih=bild?iw*bild.h/bild.w:0;
            if(y+(bild?ih+22:30)>285){doc.addPage();y=M;}
            unterTitel('Lage von außen (Luftbild)');
            if(bild){
              try{doc.addImage(bild.dataUrl,'JPEG',M,y,iw,ih);}catch(e){console.warn('[Luftbild] addImage:',e);}
              y+=ih+2;
              absatz('Markierungen: '+lbp.map(q=>q.n+' = '+q.label).join(' · ')+'. '+bild.quelle+'.',{groesse:7.5,farbe:[100,100,100],abstand:4});
            }else{
              absatz('Von außen markiert (Luftbild, im PDF nicht abgebildet): '+lbp.map(q=>q.n+' = '+q.label+' ('+q.lat.toFixed(5)+' N, '+q.lon.toFixed(5)+' O)').join(' · ')+'.',{groesse:8,farbe:[70,70,70],abstand:4});
            }
          }
          if(bericht.schlank){ /* F33: Skizzen – nur, wenn etwas eingezeichnet ist; F36: innen zuerst, dann außen; ein ausgeblendeter Teil fehlt */
            for(const sk of _fsAsListe(bericht).slice().sort((p,q)=>(_fsAsTyp(p)==='innen'?0:1)-(_fsAsTyp(q)==='innen'?0:1))){
              if(!_fsAsBenutzt(bericht,sk)||!_fsB2Sichtbar(bericht,_fsAsTyp(sk)))continue;
              const url=_fsBgSkizzeBild(bericht,_fsAsPseudoRaum(sk));
              if(!url)continue;
              const sw=120,sh=sw*FS_BG_SKIZZE_H/FS_BG_SKIZZE_W;
              if(y+sh+18>285){doc.addPage();y=M;}
              unterTitel('Skizze '+(_fsAsTyp(sk)==='innen'?'innen':'außen')+' – '+(hat(sk.name)?String(sk.name).trim():(_fsAsTyp(sk)==='innen'?'Raum':'Außen')));
              try{doc.addImage(url,'JPEG',M,y,sw,sh);}catch(e){console.warn('[Skizze außen]',e);}
              y+=sh+2;
              const mk=_fsAsMarken(bericht,sk);
              absatz('Nicht maßstäblich, Ansicht '+_fsAsAnsicht(sk)+'.'+(mk.length?' Nummern: '+mk.map(q=>q.n+' = '+q.label+(hat(q.s.ort)?' ('+String(q.s.ort).trim()+')':'')).join(' · ')+'.':''),{groesse:7.5,farbe:[100,100,100],abstand:4});
            }
          }
        } // F21, F24
        if(erg.length&&bericht.schlank){unterTitel('Umgebung');erg.forEach(z=>absatz(z,{einzug:3,abstand:1.5}));y+=3;} // F23: Besichtigung 2: erst die Stellen, dann die Umgebung
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
      const vgText=(vorab&&hat(bericht.vorgeschichte))?String(bericht.vorgeschichte).trim():''; // F20
      if(an.length||vgText){
        abschnitt(vorab?'Vorgeschichte laut Auftraggeber (nicht selbst festgestellt)':'Angaben der Nutzer (nicht selbst festgestellt)');
        if(vgText)absatz(vgText,{abstand:3}); // F20
        an.forEach(a=>{
          if(hat(a.q))absatz(String(a.q).trim(),{groesse:8,farbe:[100,100,100],abstand:0.5});
          absatz('Laut '+(hat(a.von)?String(a.von).trim():(vorab?'Auftraggeber':'Nutzer'))+': '+String(a.text).trim(),{einzug:3,abstand:3});
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
        const d=await _fsFpEinbrennen(await _fsFotoFuerPdf(f),f); /* F37: Foto-Pins fürs PDF daraufgezeichnet (das Original bleibt unverändert) */
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
        const fpl=_fsFpLegende(f); /* F37: „Markiert: 1 = Schaden · 2 = undicht“ */
        const cap=doc.splitTextToSize('Foto '+(fi+1)+(zu?' – '+zu:'')+(fpl?' – Markiert: '+fpl:''),iW).slice(0,fpl?7:3); // F2c: die Unterschrift nennt Raum, Wand und Messstelle – bis zu drei Zeilen statt nur der ersten
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
  const ti=document.createElement('div');ti.style.cssText='flex:1;font-size:var(--fs17,17px);font-weight:700;';ti.textContent='📥 testo-Messungen';
  const zu=document.createElement('button');zu.type='button';zu.textContent='✕';
  zu.style.cssText='width:44px;height:44px;border-radius:8px;border:1px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);font-size:var(--fs18,18px);cursor:pointer;';
  zu.onclick=()=>ov.remove();
  kopf.append(ti,zu);
  const inhalt=document.createElement('div');inhalt.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 14px;';
  const fuss=document.createElement('div');fuss.style.cssText='padding:10px 14px 14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;';
  box.append(kopf,inhalt,fuss);ov.appendChild(box);document.body.appendChild(ov);
  const info=txt=>{inhalt.innerHTML='';const d=document.createElement('div');d.style.cssText='font-size:var(--fs15,15px);color:var(--text);padding:12px 0;line-height:1.5;';d.textContent=txt;inhalt.appendChild(d);};

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
  const raumLab=document.createElement('label');raumLab.style.cssText='font-size:var(--fs13,13px);color:var(--text2);';raumLab.textContent='Raum für die neuen Messstellen';
  const raumSel=document.createElement('select');
  raumSel.style.cssText='width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:var(--fs16,16px);color:var(--text);font-family:inherit;';
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
  knopf.style.cssText='min-height:52px;border-radius:10px;border:none;background:'+FS_FARBE+';color:#fff;font-size:var(--fs16,16px);font-weight:700;font-family:inherit;cursor:pointer;';
  const knopfText=()=>{knopf.disabled=!gewaehlt.size;knopf.style.opacity=gewaehlt.size?'1':'.45';knopf.textContent=gewaehlt.size?'Einlesen ('+gewaehlt.size+')':'Messungen antippen';};
  knopfText();
  fuss.append(raumLab,raumSel,knopf);

  inhalt.innerHTML='';
  const hinweis=document.createElement('div');hinweis.style.cssText='font-size:var(--fs13,13px);color:var(--text2);margin:0 0 8px;line-height:1.45;';
  hinweis.textContent='Ordner „'+FS_TESTO_ORDNER+'" · Messungen antippen. PAM legt beim Einlesen eine Kopie in den Ordner des Auftrags – die Originale hier kannst du später in Drive löschen.';
  inhalt.appendChild(hinweis);
  if(csvText){ // v305: gut sichtbar statt im Kleingedruckten
    const cw=document.createElement('div');cw.setAttribute('data-fs-nurcsv',String(nurCsv.length));
    cw.style.cssText='font-size:var(--fs14,14px);font-weight:600;color:var(--text);margin:0 0 10px;padding:10px 12px;border-radius:8px;background:var(--bg2);border-left:5px solid var(--orange);line-height:1.45;';
    cw.textContent=csvText;inhalt.appendChild(cw);
  }
  messungen.forEach((m,i)=>{
    const row=document.createElement('button');row.type='button';row.setAttribute('data-fs-testo',String(i));
    row.style.cssText='display:block;width:100%;text-align:left;margin:0 0 8px;padding:12px;border-radius:10px;border:2px solid var(--border);background:var(--bg2);color:var(--text);font-family:inherit;cursor:pointer;';
    if(m.fehler){row.disabled=true;row.textContent='⛔ '+m.datei+': '+m.fehler;inhalt.appendChild(row);return;}
    const z1=document.createElement('div');z1.style.cssText='font-size:var(--fs16,16px);font-weight:700;';
    z1.textContent=(m.zeit?_fsZeitText(m.zeit):m.datei)+(m.schonDa?' · schon eingelesen'+(m.schonDaKarte?' ('+m.schonDaKarte+')':''):'');
    const z2=document.createElement('div');z2.style.cssText='font-size:var(--fs14,14px);margin-top:3px;';
    z2.textContent='Luft '+(m.luftT===null?'–':_fsEins(m.luftT)+' °C')+' · '+(m.luftRf===null?'–':_fsEins(m.luftRf)+' %')
      +' · Oberfläche '+(m.ts===null?'–':_fsEins(m.ts)+' °C')+' · '+(m.bildDatei?'📷 Foto':'ohne Foto');
    row.append(z1,z2);
    m.warnungen.forEach(h=>{
      const d=document.createElement('div');d.style.cssText='font-size:var(--fs13,13px);font-weight:700;color:var(--text);margin-top:4px;padding-left:8px;border-left:4px solid var(--orange);';
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

/* ── F4: Messungen nach Messplan zuordnen – Kontrollliste ─────────────────────────────────────────────────────────
   Liest die testo-Messungen aus „testo-Eingang“ (nur die noch nicht eingelesenen, die seit dem Anlegen des Protokolls ins Drive kamen –
   „Ältere laden“ holt auch die davor; doppelt geteilte Dateien mit gleicher Messzeit zählen einmal), sortiert sie nach Messzeit und legt sie der
   Reihe nach auf die offenen Plan-Zeilen. ⛔ Nichts wird eingetragen, bevor Frank in der Kontrollliste bestätigt. „Messung weglassen“ und
   „Hier nicht gemessen“ rücken die Reihenfolge zurecht. Ablauf je Messung wie beim Einlesen (Messbild mit Messpunkt, Kopie in den Auftragsordner);
   das Raumklima des Raums wird dabei NICHT aus der ersten Wandmessung gefüllt. Nur am Tablet (braucht Gerätespeicher und Upload-Warteschlange). */
async function _fsTestoPlanZuordnen(bericht,t,neuBauen){
  if(typeof _mobPhotoSave!=='function'||typeof _uploadMitGeduld!=='function'){toast('📋 Messungen bitte am Tablet zuordnen','info',5000);return;}
  if(!(typeof tokenValid==='function'&&tokenValid())){toast('Drive nicht verbunden – zum Einlesen bitte mit Empfang anmelden','error',5000);return;}
  if(!_fsBgMessplan(bericht).length){toast('Erst den Messplan anlegen: Räume mit Wänden anlegen (bei „Räume“), Höhen je Wand im Raum bei „Messplan“','info',6000);return;}
  const KNOPF='padding:9px 12px;border-radius:8px;font-size:var(--fs14,14px);cursor:pointer;font-weight:600;font-family:inherit;';
  const GID='_fsTestoPlanSheet';const alt=document.getElementById(GID);if(alt)alt.remove();
  const ov=document.createElement('div');ov.id=GID;
  ov.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;';
  const box=document.createElement('div');
  box.style.cssText='background:var(--bg);color:var(--text);border-radius:16px 16px 0 0;width:100%;max-height:92vh;display:flex;flex-direction:column;';
  box.onclick=e=>e.stopPropagation();
  const kopf=document.createElement('div');kopf.style.cssText='display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border);';
  const ti=document.createElement('div');ti.style.cssText='flex:1;font-size:var(--fs17,17px);font-weight:700;';ti.textContent='📋 Messungen nach Messplan';
  const zu=document.createElement('button');zu.type='button';zu.textContent='✕';
  zu.style.cssText='width:44px;height:44px;border-radius:8px;border:1px solid var(--fs-krd,var(--border));background:var(--fs-kfl,transparent);color:var(--text);font-size:var(--fs18,18px);cursor:pointer;';
  zu.onclick=()=>ov.remove();
  kopf.append(ti,zu);
  const inhalt=document.createElement('div');inhalt.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 14px;';
  const fuss=document.createElement('div');fuss.style.cssText='padding:10px 14px 14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;';
  box.append(kopf,inhalt,fuss);ov.appendChild(box);document.body.appendChild(ov);
  const info=txt=>{inhalt.innerHTML='';const d=document.createElement('div');d.style.cssText='font-size:var(--fs15,15px);color:var(--text);padding:12px 0;line-height:1.5;';d.textContent=txt;inhalt.appendChild(d);fuss.innerHTML='';};

  let messungen=[],nurCsv=[],doppelt=0,unlesbar=[],abgeschnitten=false,aeltere=false,mitBild=true;
  const weg=new Set(),aus=new Set(); // weg: Messungen (Nummer in messungen), die nicht verwendet werden; aus: Plan-Zeilen, an denen nicht gemessen wurde
  const schluessel=p=>p.raum+'|'+p.wand+'|'+p.hoehe;
  const zeitHMS=ms=>{const s=ms?_fsZeitText(ms):'';return s?s.slice(11):'';};
  const fmt=(x,e)=>x===null||x===undefined?'–':_fsEins(x)+e;

  const laden=async alle=>{
    info('Suche den Ordner „'+FS_TESTO_ORDNER+'“ in Google Drive …');
    let ordnerId=null,dateien=[];
    try{
      ordnerId=await _fsTestoOrdnerId();
      if(!ordnerId){info('Ordner „'+FS_TESTO_ORDNER+'“ nicht gefunden. Bitte in Google Drive unter 00_App-Daten anlegen und die testo-Dateien dorthin teilen.');return false;}
      dateien=await _fsTestoListe(ordnerId);
    }catch(e){console.warn('[testo] Liste:',e);info('Google Drive nicht erreichbar ('+(e.message||e)+'). Bitte mit Empfang erneut versuchen.');return false;}
    const start=Date.parse(bericht.createdAt||'');
    const seit=(!alle&&isFinite(start))?start:0;
    const jsons=dateien.filter(f=>/\.(tjf|json)$/i.test(f.name||'')&&(!seit||!f.createdTime||Date.parse(f.createdTime)>=seit));
    const bilder=dateien.filter(f=>/\.(jpe?g|png)$/i.test(f.name||''));
    nurCsv=_fsTestoNurCsv(dateien).filter(c=>{ // nur testo-Namen mit Datum (Trotec-Dateien heißen anders); mit Zeitgrenze wie oben
      const d=/(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/.exec(c.datei);
      if(!d)return false;
      return !seit||new Date(+d[1],+d[2]-1,+d[3],+d[4],+d[5]).getTime()>=seit-60000;
    });
    info('Lese '+jsons.length+' Messung'+(jsons.length===1?'':'en')+' …');
    const bildNamen=bilder.map(b=>b.name),gelesen=[],gesehen=new Set();
    doppelt=0;unlesbar=[];abgeschnitten=jsons.length>80;
    for(const f of _fsTestoOriginaleZuerst(jsons.slice(0,80))){
      try{
        const text=await _fsDriveText(f.id);
        const m=_fsTestoLesen(text,bildNamen);
        if(!m.ok){unlesbar.push(f.name);continue;}
        m.datei=f.name;m.dateiId=f.id;m.text=text;
        m.bildDatei=bilder.find(b=>b.name===m.bild)||null;
        if(_fsTestoSchonDa(bericht,f.name)||_fsTestoZeitSchonDa(bericht,m.zeit))continue; // schon in diesem Protokoll
        if(_fsTestoEingelesenIn(typeof _alleTaskListen==='function'?_alleTaskListen():[],f.name))continue; // schon an einer Karte eingelesen
        if(m.zeit){if(gesehen.has(m.zeit)){doppelt++;continue;}gesehen.add(m.zeit);}
        gelesen.push(m);
      }catch(e){unlesbar.push(f.name);}
    }
    gelesen.sort((a,b)=>(a.zeit||0)-(b.zeit||0));
    gelesen.forEach((m,i)=>{m._i=i;});
    messungen=gelesen;weg.clear();
    return true;
  };

  const warnung=(txt,stark)=>{
    const d=document.createElement('div');
    d.style.cssText='font-size:var(--fs14,14px);font-weight:600;color:var(--text);margin:0 0 10px;padding:10px 12px;border-radius:8px;background:var(--bg2);border-left:5px solid '+(stark?'var(--orange)':FS_FARBE)+';line-height:1.45;';
    d.textContent=txt;inhalt.appendChild(d);return d;
  };
  const knopfStil=(rand)=>KNOPF+'flex:1 1 140px;min-height:var(--fsh44,44px);border:1.5px solid '+rand+';background:var(--fs-kfl,transparent);color:var(--text);';
  const messText=m=>zeitHMS(m.zeit)+' · Luft '+fmt(m.luftT,' °C')+' / '+fmt(m.luftRf,' %')+' · Oberfläche '+fmt(m.ts,' °C')+' · '+(m.bildDatei?'📷 Foto':'ohne Foto');

  const zeige=()=>{
    inhalt.innerHTML='';fuss.innerHTML='';
    const plan=_fsBgMessplan(bericht).filter(p=>!_fsBgPlanErledigt(bericht,p));
    const aktiv=plan.filter(p=>!aus.has(schluessel(p)));
    const ms=messungen.filter(m=>!weg.has(m._i));
    const v=_fsBgPlanVorschlag(aktiv,ms);
    const paarVon=new Map();v.paare.forEach(pr=>paarVon.set(schluessel(pr.plan),pr.m));

    const h=document.createElement('div');h.style.cssText='font-size:var(--fs14,14px);color:var(--text);margin:0 0 10px;line-height:1.5;';
    h.textContent=ms.length+' Messung'+(ms.length===1?'':'en')+' (nach Uhrzeit sortiert) · '+plan.length+' offene Plan-Zeile'+(plan.length===1?'':'n')
      +'. Die Messungen liegen der Reihe nach auf den Plan-Zeilen. Prüfe jede Zeile – eingetragen wird erst, wenn du unten „Übernehmen“ antippst.';
    inhalt.appendChild(h);
    if(nurCsv.length)warnung('⚠ '+(nurCsv.length===1?'1 Messung liegt':nurCsv.length+' Messungen liegen')+' nur als CSV vor und '+(nurCsv.length===1?'fehlt':'fehlen')+' deshalb hier – die Reihenfolge stimmt dann nicht: '
      +nurCsv.slice(0,6).map(c=>c.text).join(' · ')+(nurCsv.length>6?' …':'')+'. '+FS_TESTO_JSON_WEG,true);
    if(unlesbar.length)warnung('⚠ '+(unlesbar.length===1?'1 Datei':unlesbar.length+' Dateien')+' im Ordner '+(unlesbar.length===1?'ist':'sind')+' keine lesbare testo-Messung und '+(unlesbar.length===1?'fehlt':'fehlen')+' hier: '+unlesbar.slice(0,4).join(' · ')+(unlesbar.length>4?' …':''),true);
    if(abgeschnitten)warnung('⚠ Im Ordner liegen mehr als 80 Messungen – gezeigt werden nur die neuesten 80.',true);
    if(doppelt)warnung('ℹ '+doppelt+' doppelt geteilte Datei'+(doppelt===1?'':'en')+' (gleiche Messzeit) zählt'+(doppelt===1?'':'en')+' nur einmal.',false);
    if(!plan.length)warnung('Alle Plan-Zeilen sind schon zugeordnet. Neue Wände oder Höhen legst du oben im Messplan an.',false);
    if(v.ohnePlan.length)warnung('⚠ '+v.ohnePlan.length+' Messung'+(v.ohnePlan.length===1?'':'en')+' mehr als Plan-Zeilen (unten grau) – sie werden nicht übernommen. Hast du eine Messung doppelt gespeichert, lass sie oben bei der Zeile weg.',true);
    if(v.ohneMessung.length&&ms.length)warnung('ℹ '+v.ohneMessung.length+' Plan-Zeile'+(v.ohneMessung.length===1?'':'n')+' noch ohne Messung – weiter messen und später noch einmal zuordnen.',false);
    if(!ms.length&&plan.length)warnung('Keine neuen testo-Messungen im Ordner'+(aeltere?'.':' seit dem Anlegen dieses Protokolls. Liegen sie schon länger dort, unten „Ältere Messungen laden“ antippen.'),false);

    plan.forEach(p=>{
      const k=schluessel(p),istAus=aus.has(k),m=paarVon.get(k)||null;
      const row=document.createElement('div');row.setAttribute('data-fs-planzeile',String(p.nr));
      row.style.cssText='margin:0 0 8px;padding:10px 12px;border-radius:10px;border:2px solid '+(m?FS_FARBE:'var(--border)')+';background:'+(m?'rgba(31,95,139,.10)':'var(--bg2)')+';'+((istAus||!m)?'opacity:.75;':'');
      const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;gap:10px;';
      const nr=document.createElement('span');nr.textContent=String(p.nr);
      nr.style.cssText='min-width:30px;height:30px;border-radius:15px;background:'+FS_FARBE+';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--fs14,14px);flex-shrink:0;padding:0 4px;box-sizing:border-box;';
      const ort=document.createElement('div');ort.style.cssText='flex:1;min-width:0;font-size:var(--fs16,16px);font-weight:700;line-height:1.3;';
      ort.textContent=p.raum+' – '+p.wand+(p.art?' ('+p.art+')':'')+', '+p.hoehe+' cm';
      top.append(nr,ort);
      const fi=(bericht.fotos||[]).findIndex(f=>(p.fotoRefs||[]).some(r=>_fsRefPasst(f,r)));
      if(fi>=0){const img=document.createElement('img');img.alt='Foto dieser Wand';img.style.cssText='width:56px;height:56px;object-fit:cover;border-radius:8px;flex-shrink:0;background:var(--bg3);';_fsMiniaturQuelle(bericht.fotos[fi],img);top.appendChild(img);}
      row.appendChild(top);
      if(m){
        const z=document.createElement('div');z.setAttribute('data-fs-planmessung',String(p.nr));z.style.cssText='font-size:var(--fs14,14px);margin-top:6px;line-height:1.4;';z.textContent=messText(m);row.appendChild(z);
        (m.warnungen||[]).forEach(hw=>{const d=document.createElement('div');d.style.cssText='font-size:var(--fs13,13px);font-weight:700;margin-top:4px;padding-left:8px;border-left:4px solid var(--orange);';d.textContent='⚠ '+hw;row.appendChild(d);});
        const br=document.createElement('div');br.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;';
        const bw=document.createElement('button');bw.type='button';bw.textContent='✕ Messung weglassen';bw.setAttribute('data-fs-planweg',String(p.nr));bw.style.cssText=knopfStil('var(--border)');
        bw.onclick=()=>{weg.add(m._i);zeige();};
        const bn=document.createElement('button');bn.type='button';bn.textContent='↷ Hier nicht gemessen';bn.setAttribute('data-fs-planaus',String(p.nr));bn.style.cssText=knopfStil('var(--border)');
        bn.onclick=()=>{aus.add(k);zeige();};
        br.append(bw,bn);row.appendChild(br);
      }else if(istAus){
        const z=document.createElement('div');z.style.cssText='font-size:var(--fs14,14px);margin-top:6px;';z.textContent='Hier nicht gemessen – übersprungen';row.appendChild(z);
        const bz=document.createElement('button');bz.type='button';bz.textContent='↶ Doch gemessen';bz.setAttribute('data-fs-planzurueck',String(p.nr));bz.style.cssText=knopfStil('var(--border)')+'margin-top:8px;';
        bz.onclick=()=>{aus.delete(k);zeige();};
        row.appendChild(bz);
      }else{
        const z=document.createElement('div');z.style.cssText='font-size:var(--fs14,14px);margin-top:6px;';z.textContent='noch keine Messung';row.appendChild(z);
      }
      inhalt.appendChild(row);
    });
    v.ohnePlan.forEach(m=>{
      const row=document.createElement('div');row.style.cssText='margin:0 0 8px;padding:10px 12px;border-radius:10px;border:2px dashed var(--border);background:var(--bg2);opacity:.75;font-size:var(--fs14,14px);line-height:1.4;';
      row.textContent='Keine Plan-Zeile mehr, wird nicht übernommen: '+messText(m);inhalt.appendChild(row);
    });
    if(weg.size){
      const b=document.createElement('button');b.type='button';b.textContent='↶ '+weg.size+' weggelassene Messung'+(weg.size===1?'':'en')+' zurückholen';b.style.cssText=knopfStil('var(--border)')+'width:100%;margin:0 0 8px;';
      b.onclick=()=>{weg.clear();zeige();};inhalt.appendChild(b);
    }
    if(!aeltere&&isFinite(Date.parse(bericht.createdAt||''))){
      const b=document.createElement('button');b.type='button';b.textContent='Ältere Messungen laden (vor dem Anlegen dieses Protokolls)';b.setAttribute('data-fs-planaeltere','1');b.style.cssText=knopfStil('var(--border)')+'width:100%;margin:0 0 8px;';
      b.onclick=async()=>{aeltere=true;if(await laden(true))zeige();};inhalt.appendChild(b);
    }

    if(v.paare.some(pr=>pr.m.bildDatei)){
      const lab=document.createElement('label');lab.style.cssText='display:flex;align-items:center;gap:10px;font-size:var(--fs14,14px);min-height:var(--fsh44,44px);';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=mitBild;cb.style.cssText='width:22px;height:22px;flex-shrink:0;';
      cb.onchange=()=>{mitBild=cb.checked;};
      const tx=document.createElement('span');tx.textContent='Messbild mit Messpunkt erstellen (jedes Foto antippen)';
      lab.append(cb,tx);fuss.appendChild(lab);
    }
    const knopf=document.createElement('button');knopf.type='button';knopf.setAttribute('data-fs-planuebernehmen','1');
    knopf.style.cssText='min-height:52px;border-radius:10px;border:none;background:'+FS_FARBE+';color:#fff;font-size:var(--fs16,16px);font-weight:700;font-family:inherit;cursor:pointer;';
    knopf.disabled=!v.paare.length;knopf.style.opacity=v.paare.length?'1':'.45';
    knopf.textContent=v.paare.length?('✓ '+v.paare.length+' Messung'+(v.paare.length===1?'':'en')+' übernehmen'):'Nichts zu übernehmen';
    knopf.onclick=()=>uebernehmen(v.paare,knopf);
    fuss.appendChild(knopf);
  };

  const uebernehmen=async(paare,knopf)=>{
    if(!paare.length)return;
    knopf.disabled=true;
    const ziel=_extractFolderIdMob((t&&t.dokOrdner)||'')||_extractFolderIdMob((t&&t.gdrive)||'')||_extractFolderIdMob((t&&t.gdriveOrdner)||'');
    let n=0,bildN=0,kopiert=0,fehler=0;
    for(const pr of paare){
      const m=pr.m,p=pr.plan;
      knopf.textContent='⏳ '+(n+fehler+1)+' von '+paare.length+' …';
      try{
        const st=_fsBgStelleAusPlan(m,p);
        bericht.stellen.push(st);
        scheduleSave();
        n++;
        const nr=bericht.stellen.length;
        if(m.bildDatei&&mitBild){
          try{
            const blob=await _fsDriveBlob(m.bildDatei.id);
            m.bildBlob=blob;
            const bu=URL.createObjectURL(blob);
            ov.style.display='none';
            const punkt=await _fsMesspunktWaehlen(bu,'Stelle '+nr+' · '+_fsBgOrt(bericht,st));
            ov.style.display='flex';
            URL.revokeObjectURL(bu);
            const du=await _fsMessbildErstellen(blob,_fsStelleWerte(bericht,st),punkt,(m.zeit?_fsZeitText(m.zeit)+' · ':'')+'Stelle '+nr);
            if(du){
              const localKey='photo_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
              const name='Messbild_'+(m.zeit?_fsZeitText(m.zeit).slice(11).split(':').join(''):String(Date.now()))+'.jpg';
              const fo={name:name,inReport:true,localUrl:du,localKey:localKey,driveId:null,_uploading:false};
              // ⛔ Gerätespeicher NICHT abwarten (siehe _fsTestoEinlesen) – er ist nur die Reserve, falls der Upload unten scheitert.
              _mobPhotoSave(localKey,du,{taskId:t.id,name:name}).catch(e=>console.warn('[testo] Gerätespeicher:',e));
              bericht.fotos.push(fo);
              st.fotoRefs.push(localKey);
              st.testo.punkt=punkt||null;
              bildN++;
              scheduleSave();
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
        if(ziel){ // KOPIE in den Auftragsordner (Umhängen fremder Dateien verweigert Google)
          try{const kid=await _fsDriveKopieHochladen(m.text,m.datei,'application/json',ziel);if(kid){st.testo.kopieId=kid;kopiert++;}}catch(e){console.warn('[testo] Kopie Datei:',e);}
          if(m.bildDatei){
            try{const bb=m.bildBlob||await _fsDriveBlob(m.bildDatei.id);const fid=await _fsDriveKopieHochladen(bb,m.bildDatei.name,'image/jpeg',ziel);if(fid){st.testo.fotoKopieId=fid;kopiert++;}}catch(e){console.warn('[testo] Kopie Foto:',e);}
          }
          scheduleSave();
        }
      }catch(e){fehler++;console.warn('[testo] Zuordnen:',e);}
    }
    scheduleSave();
    ov.remove();
    try{neuBauen();}catch(e){console.warn('[testo] neu aufbauen:',e);}
    if(bericht.fotos.some(f=>f&&f.localKey&&!f.driveId)&&typeof _mobRetryPendingUploads==='function'){try{_mobRetryPendingUploads();}catch(e){console.warn('[testo] Upload:',e);}}
    toast('✓ '+n+' Messung'+(n===1?'':'en')+' nach Messplan zugeordnet'
      +(bildN?' · '+bildN+' Messbild'+(bildN===1?'':'er'):'')
      +(ziel?(kopiert?' · Kopie im Auftragsordner':''):' · ⚠ kein Drive-Ordner an der Karte – keine Kopie beim Auftrag')
      +(fehler?' · '+fehler+' Fehler':''),fehler?'error':'success',6000);
  };

  if(await laden(false))zeige();
}

/* ══ F10: WARTUNGSPROTOKOLL FLACHDACH – EINE Fassung für PC, Handy und Tablet ═══════════════════════════════
   Vorher gab es das Formular zweimal (PAM Desktop ~760 Zeilen, PAM Mobil ~1250 Zeilen), mit verschiedenem Code und leicht verschiedenem PDF.
   Seit F10 steht es nur noch hier. Daten unverändert: bericht.vorlage==='wartungsprotokoll', kopf{…}, sektionen[].items[]{text,status,massnahmen,fotoRefs},
   maengelEmpfehlungen, techniker, fotos[] – alte Protokolle öffnen unverändert.
   Die Funktion heißt weiter _openWartungsprotokollMobil (so rufen Handy-Liste und PC-Menü sie).
   Handy und Tablet: erfassen (Kamera, Fotos), KEIN PDF (wie beim Begehungsprotokoll, F9). PC: Fotos ändern (siehe PC-Block in PAM Desktop) und PDF erstellen.
   PDF = die Fassung des PC (mit „Zustandsprüfung:“, Mängel-Fotos je Prüfpunkt, bemalte Fassung der Fotos). */
const FS_WP_FARBE='#1a5c3a';
const FS_WP_SEKTIONEN=[
  {titel:'1. Sichtprüfung der Dachhaut',items:[
    'Risse oder Blasenbildung',
    'Mechanische Beschädigungen',
    'Zustand des Oberflächenschutzes (Kies, Begrünung)'
  ]},
  {titel:'2. Sicherheitseinrichtungen',items:[
    'Fest montierte Anschlusspunkte',
    'Geländer',
    'Sicherheitsseile'
  ]},
  {titel:'3. Entwässerung',items:[
    'Sichtprüfung der Dachgullys',
    'Sichtprüfung der Dachrinne',
    'Sichtprüfung der Einbauteile'
  ]},
  {titel:'4. Anschlüsse & Ränder',items:[
    'Wandanschlüsse',
    'Sichtprüfung aller Silikonfugen',
    'Sichtprüfung der Dachrandbleche',
    'Sichtprüfung Mauerabdeckungen',
    'Sichtprüfung Anschlüsse (Attika, Wand, Aufbauten)'
  ]},
  {titel:'5. Aufbauten / Sicherheitsausstattung',items:[
    'Lichtkuppeln / Dachausstieg',
    'Sichtprüfung Dunstrohre',
    'Anschluss an Schornsteine',
    'Anschluss an Dachdurchdringungen'
  ]}
];
function _fsWpNeuerBericht(t){
  const h=new Date(),dd=String(h.getDate()).padStart(2,'0'),mm=String(h.getMonth()+1).padStart(2,'0'),yyyy=h.getFullYear();
  return {
    id:'wp_'+Date.now(),vorlage:'wartungsprotokoll',
    titel:'Wartungsprotokoll Flachdach',
    datum:dd+'.'+mm+'.'+yyyy,
    createdAt:new Date().toISOString(),
    kopf:{
      auftraggeber:(t&&t.hausverwaltung)||'',
      kostenstelle:(t&&(t.repNr||t.kundenNr))||'',
      objektAdresse:(t&&(t.adresse||t.title))||'',
      abdichtung:[],oberflaechenschutz:[],entwaesserung:[],sicherheit:[]
    },
    sektionen:FS_WP_SEKTIONEN.map(s=>({titel:s.titel,items:s.items.map(text=>({text,status:'offen',massnahmen:''}))})),
    maengelEmpfehlungen:'',fotos:[],techniker:''
  };
}
// Alte oder halbleere Protokolle ergänzen, nichts überschreiben
function _fsWpVervollstaendigen(b){
  if(!b.kopf||typeof b.kopf!=='object')b.kopf={};
  ['abdichtung','oberflaechenschutz','entwaesserung','sicherheit'].forEach(k=>{if(!Array.isArray(b.kopf[k]))b.kopf[k]=[];});
  if(!Array.isArray(b.sektionen))b.sektionen=[];
  b.sektionen.forEach(s=>{if(!Array.isArray(s.items))s.items=[];s.items.forEach(it=>{if(!Array.isArray(it.fotoRefs))it.fotoRefs=[];});});
  if(!Array.isArray(b.fotos))b.fotos=[];
  if(!b.id)b.id='wp_'+Date.now();
  return b;
}
function _fsWpZaehlen(b){
  const z={ok:0,nv:0,mg:0,rep:0,of:0,tot:0};
  ((b&&b.sektionen)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{
    z.tot++;
    if(it.status==='ok')z.ok++;else if(it.status==='nv')z.nv++;else if(it.status==='mangel')z.mg++;else if(it.status==='repariert')z.rep++;else z.of++;
  }));
  return z;
}

function _openWartungsprotokollMobil(existingIdx){
  const t=currentTask();if(!t)return;
  if(!t.pruefberichte)t.pruefberichte=[];
  let bericht;
  if(typeof existingIdx==='number'&&t.pruefberichte[existingIdx]&&t.pruefberichte[existingIdx].vorlage==='wartungsprotokoll'){
    bericht=t.pruefberichte[existingIdx];
  }else{
    bericht=_fsWpNeuerBericht(t);
    t.pruefberichte.push(bericht);scheduleSave();
  }
  _fsWpVervollstaendigen(bericht);

  const GID='_wpMobOverlay';const old=document.getElementById(GID);if(old)old.remove();
  if(typeof _pbOffenMerken==='function')_pbOffenMerken(t,bericht,GID,function(){_wpMobRender();_wpMobStats();}); // v306: nach Neuladen/Zusammenführen wieder anhängen, bei jüngerer Fassung von drüben neu zeichnen
  const ov=document.createElement('div');ov.id=GID;
  ov.style.cssText='position:fixed;inset:0;z-index:99998;display:flex;flex-direction:column;background:var(--bg);';
  ov._wpBericht=bericht;

  /* Kopfleiste: ← · Titel + Adresse · Datum (änderbar) */
  const hdr=document.createElement('div');
  hdr.style.cssText='background:'+FS_WP_FARBE+';padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.textContent='←';
  closeBtn.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:var(--fs18,18px);cursor:pointer;flex-shrink:0;';
  closeBtn.onclick=()=>{ov.remove();try{const ct=currentTask();if(ct)renderDetail(ct);}catch(e){console.warn('[Wartung] zurück:',e);}};
  const hdrMeta=document.createElement('div');hdrMeta.style.cssText='flex:1;min-width:0;';
  const hdrT=document.createElement('div');hdrT.style.cssText='font-size:var(--fs15,15px);font-weight:700;color:#fff;';hdrT.textContent='🏠 Wartungsprotokoll Flachdach';
  const hdrS=document.createElement('div');hdrS.style.cssText='font-size:var(--fs11,11px);color:rgba(255,255,255,.75);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';hdrS.textContent=t.adresse||t.title||'Objektadresse';
  hdrMeta.append(hdrT,hdrS);
  const datumEl=document.createElement('input');datumEl.type='text';datumEl.value=bericht.datum||'';datumEl.placeholder='TT.MM.JJJJ';datumEl.autocomplete='off';datumEl.setAttribute('aria-label','Datum');
  datumEl.style.cssText='width:104px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:7px 8px;color:#fff;font-size:var(--fs14,14px);font-family:inherit;flex-shrink:0;';
  datumEl.oninput=()=>{bericht.datum=datumEl.value;scheduleSave();};
  hdr.append(closeBtn,hdrMeta,datumEl);

  /* Zählleiste */
  const statsEl=document.createElement('div');statsEl.id='_wpMobStats';
  statsEl.style.cssText='display:flex;flex-wrap:wrap;gap:6px 16px;padding:7px 14px;background:var(--bg3);border-bottom:1px solid var(--border);flex-shrink:0;font-size:var(--fs12,12px);font-weight:600;';
  function _wpMobStats(){
    const z=_fsWpZaehlen(bericht);
    statsEl.innerHTML='';
    [['✓ '+z.ok+' OK','#1a7a3c'],['– '+z.nv+' N/V','var(--text2)'],['⚠ '+z.mg+' Mängel','var(--red)'],['🔧 '+z.rep+' Rep.','#2980b9'],[z.of+' offen · '+z.tot+' gesamt','var(--text2)']].forEach(([txt,col])=>{
      const s=document.createElement('span');s.style.color=col;s.textContent=txt;statsEl.appendChild(s);
    });
  }

  const body=document.createElement('div');
  body.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 0 90px;';

  const statDef=[
    {v:'ok',   label:'OK',    sym:'✓ OK',   col:'#1a7a3c',bg:'#e6f5ec'},
    {v:'nv',   label:'N/V',   sym:'– N/V',  col:'#888',   bg:'var(--bg3)'},
    {v:'mangel',label:'Mängel',sym:'⚠ Mängel',col:'#c0392b',bg:'#fdecea'},
    {v:'repariert',label:'Rep.',sym:'✔ Rep.',col:'#2980b9',bg:'#e8f4fc'}
  ];
  const istMangel=it=>it.status==='mangel'||it.status==='repariert';

  function _wpMobRender(){
    body.innerHTML='';

    /* ── Auftragsdaten & Dachaufbau ── */
    const kopfSek=document.createElement('div');
    kopfSek.style.cssText='background:var(--bg2);border-bottom:1px solid var(--border);';
    const kopfHdr=document.createElement('div');
    kopfHdr.style.cssText='padding:10px 14px 6px;font-size:var(--fs11,11px);font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;';
    kopfHdr.textContent='Auftragsdaten & Dachaufbau';
    kopfSek.appendChild(kopfHdr);
    function _mf(label,key,placeholder){
      const row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;padding:8px 14px;border-top:1px solid var(--border);gap:10px;';
      const lbl=document.createElement('span');lbl.style.cssText='font-size:var(--fs12,12px);color:var(--text2);min-width:105px;flex-shrink:0;';lbl.textContent=label;
      const inp=document.createElement('input');inp.type='text';inp.value=bericht.kopf[key]||'';inp.placeholder=placeholder||'';inp.autocomplete='off';
      inp.style.cssText='flex:1;min-width:0;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:7px 8px;font-size:var(--fs14,14px);color:var(--text);font-family:inherit;';
      inp.oninput=()=>{bericht.kopf[key]=inp.value;scheduleSave();};
      row.append(lbl,inp);return row;
    }
    function _mcg(label,key,opts){
      const wrap=document.createElement('div');
      wrap.style.cssText='padding:8px 14px;border-top:1px solid var(--border);';
      const lbl=document.createElement('div');lbl.style.cssText='font-size:var(--fs11,11px);color:var(--text2);margin-bottom:6px;';lbl.textContent=label;
      const row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:6px;';
      if(!Array.isArray(bericht.kopf[key]))bericht.kopf[key]=[];
      opts.forEach(opt=>{
        const btn=document.createElement('button');btn.type='button';btn.textContent=opt;
        const on=bericht.kopf[key].includes(opt);
        btn.style.cssText='padding:6px 12px;border-radius:14px;font-size:var(--fs12,12px);cursor:pointer;font-family:inherit;border:1px solid '+(on?FS_WP_FARBE:'var(--border)')+';background:'+(on?'rgba(26,92,58,.12)':'transparent')+';color:'+(on?FS_WP_FARBE:'var(--text2)')+';';
        btn.onclick=()=>{
          const arr=bericht.kopf[key];const idx=arr.indexOf(opt);
          if(idx>=0)arr.splice(idx,1);else arr.push(opt);
          const on2=arr.includes(opt);
          btn.style.borderColor=on2?FS_WP_FARBE:'var(--border)';
          btn.style.background=on2?'rgba(26,92,58,.12)':'transparent';
          btn.style.color=on2?FS_WP_FARBE:'var(--text2)';
          scheduleSave();
        };
        row.appendChild(btn);
      });
      wrap.append(lbl,row);return wrap;
    }
    kopfSek.append(
      _mf('Auftraggeber','auftraggeber','aus Task'),
      _mf('Kostenstelle','kostenstelle','z.B. 250133'),
      _mf('Objektadresse','objektAdresse','aus Task'),
      _mcg('Art der Flachdachabdichtung','abdichtung',['Bitumen','Kunststoff','Flüssigkunststoff','EPDM']),
      _mcg('Oberflächenschutz','oberflaechenschutz',['Ohne','Kies','Gründach extensiv','Gründach intensiv']),
      _mcg('Dachentwässerung','entwaesserung',['Gully','Dachrinne','Notüberlauf']),
      _mcg('Sicherheitseinrichtungen','sicherheit',['Ohne','Fest montierte Anschlagpunkte','Geländer','Sicherheitsseile'])
    );
    body.appendChild(kopfSek);

    /* ── Zustandsprüfung ── */
    bericht.sektionen.forEach(sek=>{
      const sekDiv=document.createElement('div');
      const sekHdr=document.createElement('div');
      sekHdr.style.cssText='padding:8px 14px;font-size:var(--fs12,12px);font-weight:700;color:'+FS_WP_FARBE+';background:rgba(26,92,58,.08);border-bottom:1px solid var(--border);border-top:1px solid var(--border);border-left:3px solid '+FS_WP_FARBE+';';
      sekHdr.textContent=sek.titel;
      sekDiv.appendChild(sekHdr);
      sek.items.forEach(it=>{
        if(!Array.isArray(it.fotoRefs))it.fotoRefs=[];
        const rowBg=()=>it.status==='mangel'?'rgba(192,57,43,.06)':it.status==='repariert'?'rgba(41,128,185,.06)':it.status==='ok'?'rgba(26,122,60,.05)':'transparent';
        const row=document.createElement('div');row.setAttribute('data-wp-punkt','1');
        row.style.cssText='padding:10px 14px;border-bottom:1px solid var(--border);border-radius:6px;margin:2px 0;background:'+rowBg()+';transition:background .2s;';
        const txt=document.createElement('div');
        txt.style.cssText='font-size:var(--fs13,13px);color:var(--text);line-height:1.35;margin-bottom:8px;font-weight:500;';
        txt.textContent=it.text;
        const btnRow=document.createElement('div');
        btnRow.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
        const massnWrap=document.createElement('div');massnWrap.className='wpm-mw';
        const fotoRefArea=document.createElement('div');fotoRefArea.className='wpm-foto-refs';
        const mBtn=document.createElement('button');mBtn.type='button';mBtn.textContent='+ Maßnahmen';
        const zeigen=()=>{
          const m=istMangel(it);
          massnWrap.style.display=(m||it.massnahmen)?'block':'none';
          fotoRefArea.style.display=m?'block':'none';
          mBtn.style.display=(!m&&!it.massnahmen&&massnWrap.style.display==='none')?'':'none';
        };
        statDef.forEach(s=>{
          const btn=document.createElement('button');btn.type='button';btn.textContent=s.sym;btn.setAttribute('data-wp-status',s.v);
          const on=it.status===s.v;
          btn.style.cssText='padding:9px 4px;border-radius:8px;font-size:var(--fs11,11px);font-weight:700;cursor:pointer;font-family:inherit;border:2px solid '+(on?s.col:'var(--border)')+';background:'+(on?s.bg:'transparent')+';color:'+(on?s.col:'var(--text2)')+';box-shadow:'+(on?'0 1px 4px '+s.col+'44':'none')+';';
          btn.onclick=()=>{
            it.status=it.status===s.v?'offen':s.v;
            row.style.background=rowBg();
            scheduleSave();_wpMobStats();
            btnRow.querySelectorAll('button').forEach((b2,bi)=>{
              const s2=statDef[bi];const on2=it.status===s2.v;
              b2.style.borderColor=on2?s2.col:'var(--border)';
              b2.style.background=on2?s2.bg:'transparent';
              b2.style.color=on2?s2.col:'var(--text2)';
              b2.style.boxShadow=on2?'0 1px 4px '+s2.col+'44':'none';
            });
            zeigen();
          };
          btnRow.appendChild(btn);
        });
        massnWrap.style.cssText='margin-top:6px;';
        const massnIn=document.createElement('input');massnIn.type='text';
        massnIn.placeholder='Zusätzliche Maßnahmen…';massnIn.value=it.massnahmen||'';massnIn.autocomplete='off';
        massnIn.style.cssText='width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:7px;padding:8px 10px;font-size:var(--fs14,14px);color:var(--text);font-family:inherit;';
        massnIn.oninput=()=>{it.massnahmen=massnIn.value;scheduleSave();};
        massnWrap.appendChild(massnIn);
        fotoRefArea.style.cssText='margin-top:6px;';
        fotoRefArea.appendChild(_fsFotoLeiste(bericht,it,'Foto zu diesem Punkt'));
        mBtn.style.cssText='margin-top:5px;font-size:var(--fs11,11px);padding:4px 10px;border-radius:5px;border:1px solid var(--border);background:transparent;color:var(--text2);cursor:pointer;font-family:inherit;';
        mBtn.onclick=()=>{massnWrap.style.display='block';mBtn.style.display='none';massnIn.focus();};
        row.append(txt,btnRow,mBtn,massnWrap,fotoRefArea);
        zeigen();
        sekDiv.appendChild(row);
      });
      body.appendChild(sekDiv);
    });

    /* ── Festgestellte Mängel / Empfehlungen ── */
    const maengelSek=document.createElement('div');
    maengelSek.style.cssText='padding:14px;border-top:1px solid var(--border);';
    const mHdr=document.createElement('div');mHdr.style.cssText='font-size:var(--fs12,12px);font-weight:700;color:'+FS_WP_FARBE+';border-left:3px solid '+FS_WP_FARBE+';padding-left:8px;margin-bottom:8px;';
    mHdr.textContent='Festgestellte Mängel / Empfehlungen';
    const mTA=document.createElement('textarea');mTA.rows=3;
    mTA.placeholder='Nr., Beschreibung, Empfehlungen, nächste Wartung…';mTA.value=bericht.maengelEmpfehlungen||'';
    mTA.style.cssText='width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px;font-size:var(--fs14,14px);color:var(--text);resize:vertical;font-family:inherit;';
    mTA.oninput=()=>{bericht.maengelEmpfehlungen=mTA.value;scheduleSave();};
    maengelSek.append(mHdr,mTA);
    body.appendChild(maengelSek);

    /* ── Techniker ── */
    const techSek=document.createElement('div');techSek.style.cssText='padding:0 14px 14px;';
    const tl=document.createElement('div');tl.style.cssText='font-size:var(--fs12,12px);color:var(--text2);margin-bottom:4px;';tl.textContent='Techniker';
    const ti=document.createElement('input');ti.type='text';ti.value=bericht.techniker||'';ti.placeholder='Name Techniker';ti.autocomplete='off';
    ti.style.cssText='width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px;font-size:var(--fs14,14px);color:var(--text);font-family:inherit;';
    ti.oninput=()=>{bericht.techniker=ti.value;scheduleSave();};
    techSek.append(tl,ti);
    body.appendChild(techSek);

    /* ── Fotos (Raster und Knöpfe: am PC die PC-Werkzeuge, sonst Kamera · Galerie · Drive – dieselben Funktionsnamen wie beim Feuchteprotokoll) ── */
    const fotoSek=document.createElement('div');
    fotoSek.style.cssText='border-top:1px solid var(--border);';
    const fHdr=document.createElement('div');fHdr.style.cssText='padding:10px 14px 4px;font-size:var(--fs12,12px);font-weight:700;color:'+FS_WP_FARBE+';border-left:3px solid '+FS_WP_FARBE+';padding-left:17px;';
    fHdr.textContent='Fotos';
    const fInfo=document.createElement('div');fInfo.style.cssText='padding:0 14px 8px;font-size:var(--fs11,11px);color:var(--text2);';
    fInfo.textContent=_fsAmPc()
      ?'Klick = im PDF ✓ · Doppelklick oder 👁 = groß ansehen · ✏ = bemalen und beschriften (das Original bleibt) · ‹ › = Reihenfolge · ✕ = aus dem Protokoll entfernen (in Drive bleibt es). 360°-Fotos bitte als Flat-Export aus Insta360.'
      :'Antippen = im PDF ✓ · zweimal antippen = groß ansehen. 360°-Fotos bitte als Flat-Export aus Insta360.';
    const fotoGrid=document.createElement('div');fotoGrid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:0 14px 8px;';
    fotoGrid.id='_wpMobFotoGrid'; // derselbe Name wie im Feuchteprotokoll: Foto-Dialog und Maler ziehen die Miniaturen hierüber nach
    _wpMobRenderFotos(bericht,fotoGrid);
    const fotoBtnRow=document.createElement('div');fotoBtnRow.style.cssText='display:flex;gap:8px;padding:0 14px 14px;';
    const mkF=(txt,stil,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText='flex:1;padding:10px;border-radius:8px;font-size:var(--fs13,13px);cursor:pointer;font-weight:600;font-family:inherit;'+stil;b.onclick=fn;return b;};
    if(_fsAmPc()){
      fotoBtnRow.append(
        mkF('📁 Fotos vom PC','border:1.5px solid var(--border);background:var(--bg3);color:var(--text);',()=>_wpMobFotoAufnehmen(bericht,fotoGrid,false)),
        mkF('🖼 Fotos der Karte','border:1.5px dashed #34a853;background:rgba(52,168,83,.06);color:var(--text);',()=>_wpMobLadeDriveFotos(bericht,fotoGrid)));
    }else fotoBtnRow.append(
      mkF('📷 Kamera','border:1.5px dashed var(--accent);background:rgba(108,99,255,.06);color:var(--accent);',()=>_wpMobFotoAufnehmen(bericht,fotoGrid,true)),
      mkF('🖼 Galerie','border:1.5px solid var(--border);background:var(--bg3);color:var(--text);',()=>_wpMobFotoAufnehmen(bericht,fotoGrid,false)),
      mkF('☁ Drive','border:1.5px dashed #34a853;background:rgba(52,168,83,.06);color:#1a7a40;',()=>_wpMobLadeDriveFotos(bericht,fotoGrid)));
    fotoSek.append(fHdr,fInfo,fotoGrid,fotoBtnRow);
    body.appendChild(fotoSek);
  }
  _wpMobRender();_wpMobStats();

  /* Fußleiste – F10: nur am PC. Handy und Tablet erstellen kein PDF (wie beim Begehungsprotokoll). */
  if(!_fsAmPc()){
    body.style.paddingBottom='24px';
    ov.append(hdr,statsEl,body);
    document.body.appendChild(ov);
    return;
  }
  const footer=document.createElement('div');
  footer.style.cssText='position:fixed;bottom:0;left:0;right:0;padding:12px 14px;background:var(--bg2);border-top:1px solid var(--border);display:flex;gap:10px;z-index:99999;';
  const pdfBtn=document.createElement('button');pdfBtn.type='button';pdfBtn.textContent='📄 PDF erstellen';
  pdfBtn.style.cssText='flex:1;padding:12px;background:'+FS_WP_FARBE+';color:#fff;border:none;border-radius:8px;font-size:var(--fs15,15px);font-weight:700;cursor:pointer;';
  pdfBtn.onclick=async()=>{
    pdfBtn.disabled=true;const alt=pdfBtn.textContent;pdfBtn.textContent='⏳ PDF wird erstellt …';
    try{await _fsWpPdf(bericht,t);}finally{pdfBtn.disabled=false;pdfBtn.textContent=alt;}
  };
  const openBtn=document.createElement('button');openBtn.type='button';openBtn.textContent='📂 Öffnen';
  openBtn.style.cssText='padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:var(--fs15,15px);font-weight:600;cursor:pointer;color:var(--text);';
  openBtn.onclick=()=>_fsPdfOeffnen(bericht);
  const shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.textContent='📤';
  shareBtn.style.cssText='padding:12px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:var(--fs18,18px);cursor:pointer;color:var(--text);';
  shareBtn.onclick=async()=>{
    const blob=_fsPdfBlobs[bericht.id];
    if(navigator.share&&blob){
      const file=new File([blob],bericht.pdfName||_fsPdfName(bericht),{type:'application/pdf'});
      try{await navigator.share({title:'Wartungsprotokoll Flachdach',files:[file]});}
      catch(e){if(e.name!=='AbortError')toast('Teilen fehlgeschlagen','error');}
    }else{toast('Bitte zuerst PDF erstellen','info');}
  };
  footer.append(pdfBtn,openBtn,shareBtn);
  ov.append(hdr,statsEl,body,footer);
  document.body.appendChild(ov);
}

/* F12: ECHTES HÄKCHEN IM PDF. Das Zeichen ✓ fehlt in der PDF-Grundschrift (Helvetica) und kam als winziger Strich („’“) heraus – in allen bisherigen
   Wartungsprotokoll-PDFs (Frank 02.10.2026, mit Bild). Jetzt zeichnet didDrawCell zwei Linien mittig in die Zelle: OK grün, N/V grau, Mängel rot und dicker, Rep. blau.
   Spalten 1–4 der Tabelle; die Zelle bleibt textlos (didParseCell leert sie). */
const FS_WP_HAKEN={1:[26,122,60,0.45],2:[110,110,110,0.45],3:[192,57,43,0.7],4:[41,128,185,0.45]};
function _fsWpHakenZeichnen(doc,d){
  const f=d&&d.column?FS_WP_HAKEN[d.column.index]:null;
  if(!f||d.section!=='body'||!d.cell||d.cell.raw!=='✓')return;
  const x=d.cell.x+d.cell.width/2,y=d.cell.y+d.cell.height/2;
  doc.setDrawColor(f[0],f[1],f[2]);doc.setLineWidth(f[3]);
  doc.line(x-1.7,y+0.1,x-0.6,y+1.4);doc.line(x-0.6,y+1.4,x+1.9,y-1.5);
  doc.setDrawColor(0,0,0);doc.setLineWidth(0.2);
}
// PDF des Wartungsprotokolls – Fassung des PC (Kopf, Dachaufbau, „Zustandsprüfung“, Mängel-Fotos je Punkt, Mängel/Empfehlungen, Fotodokumentation).
// Fotos über _fsFotoFuerPdf: die bemalte Fassung zuerst (_shrBytes), auf 1600 px verkleinert.
async function _fsWpPdf(bericht,task){
  if(!window.jspdf){toast('PDF-Bibliothek lädt noch …','error');return null;}
  try{
    _fsWpVervollstaendigen(bericht);
    const t=task||{};
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=210,M=14,farbe=[26,92,58];let y=M;

    /* Kopfzeile */
    doc.setFillColor(...farbe);doc.rect(0,0,W,32,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(17);doc.setFont('helvetica','bold');
    doc.text('Wartungsprotokoll Flachdach',M,12);
    doc.setFontSize(9);doc.setFont('helvetica','normal');
    const k=bericht.kopf||{};
    doc.text('Auftraggeber: '+(k.auftraggeber||t.hausverwaltung||'–'),M,19);
    doc.text('Objekt: '+(k.objektAdresse||t.adresse||'–'),M,24);
    doc.text('Datum: '+bericht.datum+(bericht.techniker?' · Techniker: '+bericht.techniker:'')+(k.kostenstelle?' · Kostenstelle: '+k.kostenstelle:''),M,29);
    y=38;

    /* Dachaufbau */
    doc.setTextColor(0,0,0);doc.setFontSize(9);doc.setFont('helvetica','bold');
    doc.text('Dachaufbau:',M,y);y+=5;
    const dachRows=[
      ['Abdichtung',(k.abdichtung&&k.abdichtung.length?k.abdichtung.join(', '):'–')],
      ['Oberflächenschutz',(k.oberflaechenschutz&&k.oberflaechenschutz.length?k.oberflaechenschutz.join(', '):'–')],
      ['Entwässerung',(k.entwaesserung&&k.entwaesserung.length?k.entwaesserung.join(', '):'–')],
      ['Sicherheitseinrichtungen',(k.sicherheit&&k.sicherheit.length?k.sicherheit.join(', '):'–')]
    ];
    doc.autoTable({startY:y,body:dachRows,theme:'grid',margin:{left:M,right:M},
      bodyStyles:{fontSize:8,minCellHeight:6},
      columnStyles:{0:{fontStyle:'bold',cellWidth:55,fillColor:[245,245,245]},1:{cellWidth:127}}
    });
    y=doc.lastAutoTable.finalY+6;

    /* Zustandsprüfung */
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(0,0,0);
    doc.text('Zustandsprüfung:',M,y);y+=5;
    const fotos=bericht.fotos||[];
    const bildCache=new Map();
    const bildLaden=async f=>{if(!bildCache.has(f))bildCache.set(f,await _fsFotoFuerPdf(f));return bildCache.get(f);};
    for(const sek of bericht.sektionen){
      if(y>265){doc.addPage();y=M;}
      doc.setFillColor(230,244,235);doc.rect(M,y,W-2*M,7,'F');
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(26,92,58);
      doc.text(sek.titel,M+2,y+5);y+=9;
      doc.autoTable({startY:y,
        head:[['Prüfpunkt','OK','N/V','Mängel','Rep.','Zusätzliche Maßnahmen']],
        body:sek.items.map(it=>[
          it.text,
          it.status==='ok'?'✓':'',
          it.status==='nv'?'✓':'',
          it.status==='mangel'?'✓':'',
          it.status==='repariert'?'✓':'',
          it.massnahmen||''
        ]),
        theme:'grid',margin:{left:M,right:M},
        headStyles:{fillColor:farbe,fontSize:7.5,fontStyle:'bold'},
        bodyStyles:{fontSize:8,minCellHeight:7},
        columnStyles:{
          0:{cellWidth:82},1:{cellWidth:10,halign:'center'},2:{cellWidth:10,halign:'center'},
          3:{cellWidth:13,halign:'center'},4:{cellWidth:10,halign:'center'},5:{cellWidth:47}
        },
        didParseCell:(d)=>{ // F12: kein Zeichen ✓ im Text (die PDF-Grundschrift kennt es nicht) – das Häkchen wird in didDrawCell gezeichnet
          if(d.section==='body'&&d.column.index>=1&&d.column.index<=4&&d.cell.raw==='✓')d.cell.text=[''];
        },
        didDrawCell:(d)=>_fsWpHakenZeichnen(doc,d)
      });
      y=doc.lastAutoTable.finalY+4;
      // Mängel-Fotos (mit dem Prüfpunkt verknüpfte Fotos) direkt nach dem Abschnitt
      const mangelItems=sek.items.filter(it=>(it.status==='mangel'||it.status==='repariert')&&it.fotoRefs&&it.fotoRefs.length);
      for(const it of mangelItems){
        const liste=_fsZeilenFotos(fotos,it.fotoRefs).map(z=>z.f);
        if(!liste.length)continue;
        if(y>265){doc.addPage();y=M;}
        doc.setFontSize(8);doc.setFont('helvetica','italic');doc.setTextColor(100,100,100);
        doc.text('Fotos zu: '+it.text,M,y);y+=4;
        let col2=0;
        for(const f of liste){
          const pf=await bildLaden(f);
          if(!pf||!pf.dataUrl)continue;
          const iW=55,iH=42;
          if(y+iH+8>285){doc.addPage();y=M;}
          doc.addImage(pf.dataUrl,'JPEG',M+(col2*(iW+4)),y,iW,iH);
          col2++;
          if(col2>=3){y+=iH+6;col2=0;}
        }
        if(col2>0)y+=42+6;
      }
    }

    /* Mängel / Empfehlungen */
    if(bericht.maengelEmpfehlungen){
      if(y>255){doc.addPage();y=M;}
      doc.setFillColor(230,244,235);doc.rect(M,y,W-2*M,7,'F');
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(26,92,58);
      doc.text('Festgestellte Mängel / Empfehlungen',M+2,y+5);y+=10;
      doc.setFont('helvetica','normal');doc.setTextColor(0,0,0);doc.setFontSize(9);
      const lines=doc.splitTextToSize(bericht.maengelEmpfehlungen,W-2*M);
      doc.text(lines,M,y);y+=lines.length*4.5+4;
    }

    /* Fotodokumentation – nur Fotos mit ✓ (inReport) */
    const fotoList=fotos.filter(f=>f.inReport&&(f.editedDriveId||f.driveId||f.localUrl||f.localKey));
    if(fotoList.length){
      toast('📷 Lade '+fotoList.length+' Foto'+(fotoList.length>1?'s':'')+' …','info',5000);
      let col=0,erstes=true,links=null;
      for(let fi=0;fi<fotoList.length;fi++){
        const f=fotoList[fi];
        const pf=await bildLaden(f);
        if(!pf||!pf.dataUrl){console.warn('[Wartung] Foto übersprungen:',f.name);continue;}
        const iW=85,iH=62;
        if(col===0){
          if(y+iH+12>285){doc.addPage();y=M;}
          if(erstes){doc.setFillColor(230,244,235);doc.rect(M,y,W-2*M,7,'F');doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(26,92,58);doc.text('Fotodokumentation',M+2,y+5);y+=10;erstes=false;}
          doc.addImage(pf.dataUrl,'JPEG',M,y,iW,iH);
          links=f; // Beschriftung der linken Spalte wird beim rechten Bild gesetzt
        }else{
          doc.addImage(pf.dataUrl,'JPEG',M+iW+6,y,iW,iH);
          doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100,100,100);
          doc.text(doc.splitTextToSize((links&&links.name)||'',iW),M,y+iH+3);
          doc.text(doc.splitTextToSize(f.name||'',iW),M+iW+6,y+iH+3);
          y+=iH+10;
        }
        col=(col+1)%2;
      }
      if(col===1){doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100,100,100);doc.text(doc.splitTextToSize((links&&links.name)||'',85),M,y+62+3);y+=62+10;}
    }

    /* Seitenzahlen */
    const pages=doc.internal.getNumberOfPages();
    for(let p=1;p<=pages;p++){
      doc.setPage(p);doc.setFontSize(8);doc.setTextColor(150,150,150);
      doc.text('Seite '+p+' von '+pages,W/2,292,{align:'center'});
      doc.text('sv-fb.de',W-M,292,{align:'right'});
    }

    const blob=doc.output('blob');
    _fsPdfBlobs[bericht.id]=blob;
    const name=_fsPdfName(bericht,new Date());
    toast('✓ Wartungsprotokoll PDF erstellt','success',4000);
    const inDrive=await _fsPdfNachDrive(blob,name,bericht,task);
    if(!inDrive){ // ohne Drive bleibt nur das Gerät: dann herunterladen
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=name;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }
    return blob;
  }catch(e){
    console.error('[Wartung] PDF:',e);
    toast('PDF-Fehler: '+e.message,'error');
    return null;
  }
}

/* ══ F11: ZU WELCHEM PUNKT GEHÖRT DAS FOTO? ═══════════════════════════════════════════════════════════════
   Im Foto-Raster unten und in der Großansicht zeigen beide Apps (PC, Handy/Tablet) unter dem Foto, wo es verknüpft ist:
   Prüfpunkt (Wartungs-/Feuchteprotokoll), Messstelle, Wand, Raum (Begehungsprotokoll). Leer = nicht zugeordnet. */
function _fsFotoZuordnungText(bericht,f){
  try{
    const fn=(bericht&&bericht.fassung==='begehung'&&typeof _fsBgFotoZuordnung==='function')?_fsBgFotoZuordnung:_fsFotoZuordnung;
    return String(fn(bericht,f)||'');
  }catch(e){console.warn('[Formular] Foto-Zuordnung:',e);return '';}
}

/* ══ F13: PRÜFBERICHT FLACHDACH – EINE Fassung für PC, Handy und Tablet ═════════════════════════════════════
   Vorher gab es das Formular zweimal (PAM Desktop und PAM Mobil, verschiedener Code, leicht verschiedenes PDF). Seit F13 steht es nur noch hier.
   Daten unverändert: bericht.vorlage==='flachdach', titel, datum, bemerkung, sektionen[].items[]{text,status ok/mangel/offen,notiz}, driveFileId –
   alte Berichte öffnen unverändert. Die Funktion heißt weiter _openPruefformular (so ruft sie die Handy-Liste und das PC-Menü).
   Handy und Tablet: ausfüllen, KEIN PDF (wie bei den anderen Formularen). PC: PDF erstellen. PDF = die Fassung des PC („Ergebnis: 5/15 OK“). */
const FS_PB_FARBE='#1a5c3a';
const FS_PB_VORLAGE={
  titel:'Flachdach-Check',
  sektionen:[
    {titel:'1 · Abdichtung & Oberfläche',items:[
      'Dachabdichtung auf Risse / Blasen prüfen',
      'Versprödung oder Alterungsschäden sichtbar?',
      'Kiesschicht gleichmäßig verteilt (Kiesflachdach)',
      'Aufkantungen / Randabschlüsse dicht?',
      'Bewuchs (Moos, Pflanzen) entfernt?',
      'Dampfsperre / Wärmedämmung unauffällig?'
    ]},
    {titel:'2 · Entwässerung',items:[
      'Dachgullys / Abläufe frei und funktionsfähig?',
      'Notüberlauf vorhanden und frei?',
      'Gefälle zur Entwässerung ausreichend?',
      'Dachrinnen und Fallrohre gereinigt?'
    ]},
    {titel:'3 · Anschlüsse & Durchdringungen',items:[
      'Dachdurchdringungen (Rohre, Kabel) dicht?',
      'Lichtkuppeln / Oberlichter dicht und gängig?',
      'Wandanschlüsse und Attika in Ordnung?',
      'Türschwellen / Terrassen-Anschlüsse dicht?',
      'Dachrand-Abschlussprofile fest verankert?'
    ]}
  ]
};
function _fsPbNeuerBericht(){
  const h=new Date(),dd=String(h.getDate()).padStart(2,'0'),mm=String(h.getMonth()+1).padStart(2,'0'),yyyy=h.getFullYear();
  return {
    id:'pb_'+Date.now(),vorlage:'flachdach',titel:FS_PB_VORLAGE.titel,datum:dd+'.'+mm+'.'+yyyy,bemerkung:'',createdAt:new Date().toISOString(),
    sektionen:FS_PB_VORLAGE.sektionen.map(s=>({titel:s.titel,items:s.items.map(text=>({text,status:'offen',notiz:''}))}))
  };
}
// Alte oder halbleere Berichte ergänzen, nichts überschreiben
function _fsPbVervollstaendigen(b){
  if(!Array.isArray(b.sektionen))b.sektionen=[];
  b.sektionen.forEach(s=>{if(!Array.isArray(s.items))s.items=[];});
  if(!b.id)b.id='pb_'+Date.now();
  if(typeof b.bemerkung!=='string')b.bemerkung='';
  if(!b.titel)b.titel='Prüfbericht';
  return b;
}
function _fsPbZaehlen(b){
  const z={ok:0,mangel:0,offen:0,tot:0};
  ((b&&b.sektionen)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{z.tot++;if(it.status==='ok')z.ok++;else if(it.status==='mangel')z.mangel++;else z.offen++;}));
  return z;
}

function _openPruefformular(existingIdx){
  const t=currentTask();if(!t)return;
  if(!t.pruefberichte)t.pruefberichte=[];
  let bericht;
  if(typeof existingIdx==='number'&&t.pruefberichte[existingIdx]){
    bericht=t.pruefberichte[existingIdx];
  }else{
    bericht=_fsPbNeuerBericht();
    t.pruefberichte.push(bericht);scheduleSave();
  }
  _fsPbVervollstaendigen(bericht);

  const GID='_pruefformularOverlay';const old=document.getElementById(GID);if(old)old.remove();
  if(typeof _pbOffenMerken==='function')_pbOffenMerken(t,bericht,GID,function(){_pbRender();_pbStats();}); // v306: nach Neuladen/Zusammenführen wieder anhängen
  const ov=document.createElement('div');ov.id=GID;
  ov.style.cssText='position:fixed;inset:0;z-index:99998;display:flex;flex-direction:column;background:var(--bg);';
  ov._pbBericht=bericht;

  /* Kopfleiste: ← · Titel (änderbar) + Objekt · Datum (änderbar) */
  const hdr=document.createElement('div');
  hdr.style.cssText='background:'+FS_PB_FARBE+';padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
  const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.textContent='←';
  closeBtn.style.cssText='background:rgba(255,255,255,.2);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:var(--fs18,18px);cursor:pointer;flex-shrink:0;';
  closeBtn.onclick=()=>{ov.remove();try{const ct=currentTask();if(ct)renderDetail(ct);}catch(e){console.warn('[Prüfbericht] zurück:',e);}};
  const hdrMeta=document.createElement('div');hdrMeta.style.cssText='flex:1;min-width:0;';
  const titelEl=document.createElement('input');titelEl.type='text';titelEl.value=bericht.titel||'';titelEl.placeholder='Titel';titelEl.autocomplete='off';titelEl.setAttribute('aria-label','Titel');
  titelEl.style.cssText='width:100%;box-sizing:border-box;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:5px 8px;color:#fff;font-size:var(--fs15,15px);font-weight:700;font-family:inherit;';
  titelEl.oninput=()=>{bericht.titel=titelEl.value;scheduleSave();};
  const hdrS=document.createElement('div');hdrS.style.cssText='font-size:var(--fs11,11px);color:rgba(255,255,255,.75);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';hdrS.textContent=t.title||t.name||'Objektadresse';
  hdrMeta.append(titelEl,hdrS);
  const datumEl=document.createElement('input');datumEl.type='text';datumEl.value=bericht.datum||'';datumEl.placeholder='TT.MM.JJJJ';datumEl.autocomplete='off';datumEl.setAttribute('aria-label','Datum');
  datumEl.style.cssText='width:104px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:7px 8px;color:#fff;font-size:var(--fs14,14px);font-family:inherit;flex-shrink:0;';
  datumEl.oninput=()=>{bericht.datum=datumEl.value;scheduleSave();};
  hdr.append(closeBtn,hdrMeta,datumEl);

  /* Zählleiste */
  const statsEl=document.createElement('div');statsEl.id='_pbStats';
  statsEl.style.cssText='display:flex;flex-wrap:wrap;gap:6px 16px;padding:7px 14px;background:var(--bg3);border-bottom:1px solid var(--border);flex-shrink:0;font-size:var(--fs12,12px);font-weight:600;';
  function _pbStats(){
    const z=_fsPbZaehlen(bericht);
    statsEl.innerHTML='';
    [['✓ '+z.ok+' OK','#1a7a3c'],['⚠ '+z.mangel+' Mängel','var(--red)'],['○ '+z.offen+' offen','var(--text2)'],[z.ok+' / '+z.tot+' geprüft','var(--text2)']].forEach(([txt,col])=>{
      const s=document.createElement('span');s.style.color=col;s.textContent=txt;statsEl.appendChild(s);
    });
  }

  const body=document.createElement('div');
  body.style.cssText='flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 0 90px;';

  const statDef=[
    {v:'ok',sym:'✓ OK',col:'#1a7a3c',bg:'#e6f5ec'},
    {v:'mangel',sym:'⚠ Mangel',col:'#c0392b',bg:'#fdecea'}
  ];

  function _pbRender(){
    body.innerHTML='';
    bericht.sektionen.forEach(sek=>{
      const sekDiv=document.createElement('div');
      const sekHdr=document.createElement('div');
      sekHdr.style.cssText='padding:8px 14px;font-size:var(--fs12,12px);font-weight:700;color:'+FS_PB_FARBE+';background:rgba(26,92,58,.08);border-bottom:1px solid var(--border);border-top:1px solid var(--border);border-left:3px solid '+FS_PB_FARBE+';';
      sekHdr.textContent=sek.titel||'';
      sekDiv.appendChild(sekHdr);
      sek.items.forEach(it=>{
        const rowBg=()=>it.status==='mangel'?'rgba(192,57,43,.06)':it.status==='ok'?'rgba(26,122,60,.05)':'transparent';
        const row=document.createElement('div');row.setAttribute('data-pb-punkt','1');
        row.style.cssText='padding:10px 14px;border-bottom:1px solid var(--border);margin:2px 0;background:'+rowBg()+';transition:background .2s;';
        const txt=document.createElement('div');
        txt.style.cssText='font-size:var(--fs13,13px);color:var(--text);line-height:1.35;margin-bottom:8px;font-weight:500;';
        txt.textContent=it.text||'';
        const btnRow=document.createElement('div');
        btnRow.style.cssText='display:grid;grid-template-columns:repeat(2,1fr);gap:6px;';
        const notizWrap=document.createElement('div');notizWrap.className='pb-notiz';
        const nBtn=document.createElement('button');nBtn.type='button';nBtn.textContent='+ Notiz';
        const zeigen=()=>{
          const m=it.status==='mangel'||!!it.notiz;
          notizWrap.style.display=m?'block':'none';
          nBtn.style.display=(!m&&notizWrap.style.display==='none')?'':'none';
        };
        statDef.forEach(s=>{
          const btn=document.createElement('button');btn.type='button';btn.textContent=s.sym;btn.setAttribute('data-pb-status',s.v);
          const on=it.status===s.v;
          btn.style.cssText='padding:9px 4px;border-radius:8px;font-size:var(--fs12,12px);font-weight:700;cursor:pointer;font-family:inherit;border:2px solid '+(on?s.col:'var(--border)')+';background:'+(on?s.bg:'transparent')+';color:'+(on?s.col:'var(--text2)')+';box-shadow:'+(on?'0 1px 4px '+s.col+'44':'none')+';';
          btn.onclick=()=>{
            it.status=it.status===s.v?'offen':s.v;
            row.style.background=rowBg();
            scheduleSave();_pbStats();
            btnRow.querySelectorAll('button').forEach((b2,bi)=>{
              const s2=statDef[bi];const on2=it.status===s2.v;
              b2.style.borderColor=on2?s2.col:'var(--border)';
              b2.style.background=on2?s2.bg:'transparent';
              b2.style.color=on2?s2.col:'var(--text2)';
              b2.style.boxShadow=on2?'0 1px 4px '+s2.col+'44':'none';
            });
            zeigen();
          };
          btnRow.appendChild(btn);
        });
        notizWrap.style.cssText='margin-top:6px;';
        const nIn=document.createElement('textarea');nIn.placeholder='Notiz / Beschreibung…';nIn.value=it.notiz||'';nIn.rows=2;nIn.autocomplete='off';
        nIn.style.cssText='width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px;font-size:var(--fs14,14px);color:var(--text);resize:vertical;font-family:inherit;';
        nIn.oninput=()=>{it.notiz=nIn.value;scheduleSave();};
        notizWrap.appendChild(nIn);
        nBtn.style.cssText='margin-top:5px;font-size:var(--fs11,11px);padding:4px 10px;border-radius:5px;border:1px solid var(--border);background:transparent;color:var(--text2);cursor:pointer;font-family:inherit;';
        nBtn.onclick=()=>{notizWrap.style.display='block';nBtn.style.display='none';nIn.focus();};
        row.append(txt,btnRow,nBtn,notizWrap);
        zeigen();
        sekDiv.appendChild(row);
      });
      /* + Freier Eintrag */
      const add=document.createElement('div');add.style.cssText='padding:10px 14px;border-bottom:1px solid var(--border);';
      const addB=document.createElement('button');addB.type='button';addB.textContent='+ Freier Eintrag';addB.setAttribute('data-pb-frei','1');
      addB.style.cssText='font-size:var(--fs12,12px);padding:8px 14px;border-radius:6px;border:1px dashed var(--border);background:transparent;color:var(--text2);cursor:pointer;width:100%;font-family:inherit;';
      addB.onclick=()=>{
        const text=prompt('Neuer Prüfpunkt:');
        if(text&&text.trim()){sek.items.push({text:text.trim(),status:'offen',notiz:''});scheduleSave();_pbRender();_pbStats();}
      };
      add.appendChild(addB);sekDiv.appendChild(add);
      body.appendChild(sekDiv);
    });
    /* Allgemeine Bemerkungen */
    const bem=document.createElement('div');bem.style.cssText='padding:14px;';
    const bl=document.createElement('div');bl.style.cssText='font-size:var(--fs12,12px);font-weight:700;color:'+FS_PB_FARBE+';border-left:3px solid '+FS_PB_FARBE+';padding-left:8px;margin-bottom:8px;';bl.textContent='Bemerkungen';
    const bt=document.createElement('textarea');bt.rows=3;bt.placeholder='Gesamtbeurteilung, Empfehlungen…';bt.value=bericht.bemerkung||'';bt.autocomplete='off';
    bt.style.cssText='width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px;font-size:var(--fs14,14px);color:var(--text);resize:vertical;font-family:inherit;';
    bt.oninput=()=>{bericht.bemerkung=bt.value;scheduleSave();};
    bem.append(bl,bt);body.appendChild(bem);
  }
  _pbRender();_pbStats();

  /* Fußleiste – nur am PC. Handy und Tablet erstellen kein PDF. */
  if(!_fsAmPc()){
    body.style.paddingBottom='24px';
    ov.append(hdr,statsEl,body);
    document.body.appendChild(ov);
    return;
  }
  const footer=document.createElement('div');
  footer.style.cssText='position:fixed;bottom:0;left:0;right:0;padding:12px 14px;background:var(--bg2);border-top:1px solid var(--border);display:flex;gap:10px;z-index:99999;';
  const pdfBtn=document.createElement('button');pdfBtn.type='button';pdfBtn.textContent='📄 PDF erstellen';
  pdfBtn.style.cssText='flex:1;padding:12px;background:'+FS_PB_FARBE+';color:#fff;border:none;border-radius:8px;font-size:var(--fs15,15px);font-weight:700;cursor:pointer;';
  pdfBtn.onclick=async()=>{
    pdfBtn.disabled=true;const alt=pdfBtn.textContent;pdfBtn.textContent='⏳ PDF wird erstellt …';
    try{await _fsPbPdf(bericht,t);}finally{pdfBtn.disabled=false;pdfBtn.textContent=alt;}
  };
  const openBtn=document.createElement('button');openBtn.type='button';openBtn.textContent='📂 Öffnen';
  openBtn.style.cssText='padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:var(--fs15,15px);font-weight:600;cursor:pointer;color:var(--text);';
  openBtn.onclick=()=>_fsPdfOeffnen(bericht);
  const shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.textContent='📤';
  shareBtn.style.cssText='padding:12px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:var(--fs18,18px);cursor:pointer;color:var(--text);';
  shareBtn.onclick=async()=>{
    const blob=_fsPdfBlobs[bericht.id];
    if(navigator.share&&blob){
      const file=new File([blob],bericht.pdfName||_fsPdfName(bericht),{type:'application/pdf'});
      try{await navigator.share({title:bericht.titel||'Prüfbericht',files:[file]});}
      catch(e){if(e.name!=='AbortError')toast('Teilen fehlgeschlagen','error');}
    }else{toast('Bitte zuerst PDF erstellen','info');}
  };
  footer.append(pdfBtn,openBtn,shareBtn);
  ov.append(hdr,statsEl,body,footer);
  document.body.appendChild(ov);
}

// PDF des Prüfberichts – Fassung des PC (Kopf, „Ergebnis: n/m OK · n Mängel · n offen“, Tabellen Status · Prüfpunkt · Notiz, Bemerkungen, Seitenzahl)
async function _fsPbPdf(bericht,task){
  if(!window.jspdf){toast('PDF-Bibliothek lädt noch …','error');return null;}
  try{
    _fsPbVervollstaendigen(bericht);
    const t=task||{};
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=210,M=14;let y=M;
    const farbe=[26,92,58];
    doc.setFillColor(...farbe);doc.rect(0,0,W,28,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');
    doc.text(bericht.titel||'Prüfbericht',M,12);
    doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text((t.title||t.name||'')+(t.adresse?' · '+t.adresse:''),M,19);
    doc.text('Datum: '+(bericht.datum||''),M,25);
    y=36;
    const z=_fsPbZaehlen(bericht);
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(0,0,0);
    doc.text('Ergebnis: '+z.ok+'/'+z.tot+' OK'+(z.mangel?' · '+z.mangel+' Mängel':'')+(z.offen?' · '+z.offen+' offen':''),M,y);y+=8;
    (bericht.sektionen||[]).forEach(sek=>{
      if(y>265){doc.addPage();y=M;}
      doc.setFillColor(240,240,240);doc.rect(M,y,W-2*M,7,'F');
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(60,60,60);
      doc.text(sek.titel||'',M+2,y+5);y+=9;
      doc.autoTable({startY:y,head:[['Status','Prüfpunkt','Notiz']],
        body:(sek.items||[]).map(it=>[it.status==='ok'?'OK':it.status==='mangel'?'MANGEL':'OFFEN',it.text||'',it.notiz||'']),
        theme:'grid',margin:{left:M,right:M},
        headStyles:{fillColor:farbe,fontSize:8,fontStyle:'bold'},
        bodyStyles:{fontSize:8,minCellHeight:7},
        columnStyles:{0:{cellWidth:20,fontStyle:'bold'},1:{cellWidth:110},2:{cellWidth:52}},
        didParseCell:(d)=>{if(d.section==='body'&&d.column.index===0){if(d.cell.raw==='OK')d.cell.styles.textColor=[26,122,60];else if(d.cell.raw==='MANGEL'){d.cell.styles.textColor=[192,57,43];d.cell.styles.fontStyle='bold';}else d.cell.styles.textColor=[130,130,130];}}
      });
      y=doc.lastAutoTable.finalY+5;
    });
    if(bericht.bemerkung){if(y>255){doc.addPage();y=M;}doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(0,0,0);doc.text('Bemerkungen:',M,y);y+=5;doc.setFont('helvetica','normal');const lines=doc.splitTextToSize(bericht.bemerkung,W-2*M);doc.text(lines,M,y);}
    const pages=doc.internal.getNumberOfPages();
    for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor(150,150,150);doc.text('Seite '+p+' von '+pages,W/2,292,{align:'center'});}

    const blob=doc.output('blob');
    _fsPdfBlobs[bericht.id]=blob;
    const name=_fsPdfName(bericht,new Date());
    toast('✓ PDF erstellt','success',4000);
    const inDrive=await _fsPdfNachDrive(blob,name,bericht,task);
    if(!inDrive){ // ohne Drive bleibt nur das Gerät: dann herunterladen
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=name;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }
    return blob;
  }catch(e){
    console.error('[Prüfbericht] PDF:',e);
    toast('PDF-Fehler: '+e.message,'error');
    return null;
  }
}

/* ══ F14: LISTE – wie weit ist das Begehungsprotokoll, und welches ist es? ═══════════════════════════════
   Die Formular-Liste (PC und Handy/Tablet) zeigt beim Begehungsprotokoll NEUTRAL „beantwortet/gesamt“ (ohne ⚠ – das Protokoll bewertet nichts, Frank 30.09.2026)
   und die Raumnamen, damit zwei gleich heißende Protokolle (z. B. „Begehungsprotokoll Keller“) auseinanderzuhalten sind. Beantwortet = Satz links oder rechts gewählt. */
function _fsBgListeInfo(b){
  let beantwortet=0,tot=0;
  ((b&&b.sektionen)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{tot++;if(it&&(it.status==='ok'||it.status==='mangel'))beantwortet++;}));
  const namen=((b&&b.raeume)||[]).map(r=>String((r&&r.name)||'').trim()).filter(Boolean);
  const raeume=namen.length>2?namen.slice(0,2).join(', ')+' +'+(namen.length-2):namen.join(', ');
  return {beantwortet,tot,raeume};
}

/* ══ F15: LISTE – Kürzel, Tooltip, Kartenname ═══════════════════════════════════════════════════════
   Liefert für eine Zeile der Formular-Liste: kurz (Feldchen, z. B. WP-FLADA), lang (Tooltip, ausgeschrieben), name (fett: Name der Karte),
   sub (klein: Straße beim Wartungsprotokoll, Raumnamen beim Begehungsprotokoll). null = andere Formulare, Zeile bleibt wie bisher.
   Steildach: später über b.dachart==='steil'. Reine Funktion, keine Namen/Adressen in dieser Datei. */
function _fsListeZeile(b,t){
  if(!b)return null;
  const kartenname=String((t&&(t.title||t.name))||'').trim();
  if(b.vorlage==='wartungsprotokoll'){
    const steil=String(b.dachart||'').toLowerCase()==='steil';
    const adr=String((b.kopf&&(b.kopf.objektAdresse||b.kopf.adresse))||'').trim();
    const name=kartenname||adr||String(b.titel||'Wartungsprotokoll');
    return {kurz:steil?'WP-STEILDA':'WP-FLADA',lang:steil?'Wartungsprotokoll Steildach':'Wartungsprotokoll Flachdach',name,sub:(adr&&adr!==name)?adr:''};
  }
  if(b.vorlage==='feuchte'&&b.fassung==='begehung'&&b.art==='vorab'){ // F16
    const bei=String((b.kopf&&b.kopf.besuchBei)||'').trim(),lg=String((b.kopf&&b.kopf.lage)||'').trim(); // F17: bei wem – so sind zwei Besuche an einer Karte zu unterscheiden
    return {kurz:b.schlank?'BESICHT':'VORAB',lang:b.schlank?'Besichtigung':'Vorabbesichtigung vor der Schadenaufnahme',name:(b.schlank&&String(b.protName||'').trim())||kartenname||String(b.titel||(b.schlank?'Besichtigung':'Vorabbesichtigung')),sub:[bei,lg].filter(Boolean).join(' · ')};
  }
  if(b.vorlage==='feuchte'&&b.fassung==='begehung'){
    const keller=b.art==='keller';
    const info=(typeof _fsBgListeInfo==='function')?_fsBgListeInfo(b):{raeume:''};
    return {kurz:keller?'BEG-KELLER':'BEG-WHG',lang:keller?'Begehungsprotokoll Keller':'Begehungsprotokoll Wohnung',name:kartenname||String(b.titel||'Begehungsprotokoll'),sub:info.raeume||''};
  }
  return null;
}
