// =============================================================================
//  KI-Prognose · Lineare Regression
//  Aus Messdaten mit bekanntem Zielwert lernt das Programm eine Gerade
//  ŷ = a·x + b und sagt damit neue Werte voraus – drei Beispiele zur Auswahl:
//    - Skript 4.1: Wohnfläche → Verkaufspreis (feste Daten aus dem Skript)
//    - Förderband: Beladung → Motorstrom
//    - Fräswerkzeug: Einsatzzeit → Verschleiß (Wann tauschen?)
//    - Fertigungslinie: Stückzahl → Energieverbrauch (Grundlast)
// =============================================================================
//
//  Dateien
//    daten.js        Messdaten der drei Beispiele
//    regression.js   der Algorithmus (kleinste Quadrate, Gradientenabstieg)
//    ui.js           Knöpfe, Auswahllisten, Kästchen
//    sketch.js       Ablauf, Zeichnen, Erklärungen (diese Datei)
//
//  Drei Verfahren
//    ① per Hand      Griffe der Geraden ziehen, Fehlersumme beobachten
//    ② Formel        Methode der kleinsten Quadrate Schritt für Schritt
//    ③ Gradient      Gradientenabstieg – so lernt ein neuronales Netz
//
//  Bedienung
//    →         nächster Schritt
//    Leertaste automatisch ablaufen lassen / anhalten
//    R         neu starten
//    Klick     ins Diagramm: Prognose für diesen x-Wert (ziehbar) · Esc: weg
//
//  Läuft mit p5.js 1.x und 2.x.
//  Hinweis: Alle Schleifen haben geschweifte Klammern – der p5-Web-Editor
//  kommt mit Schleifen ohne Klammern nicht zurecht.
// =============================================================================

// -----------------------------------------------------------------------------
// Layout (logisches Raster 1600 × 900, wird auf die Fenstergröße skaliert)
// -----------------------------------------------------------------------------
const W = 1600;
// Kopfzeile (0 … 56) und Beispiel-Leiste (56 … 56 + LEISTE) liegen über dem Inhalt.
const LEISTE = 48;
const H_INHALT = 900;
const H = H_INHALT + LEISTE;
let S = 1;

// Schriften der Jakob-Preh-Schule (Google Fonts, siehe index.html).
// Ohne Internet wird automatisch auf Systemschriften ausgewichen.
const SCHRIFTEN = {
  titel: ["Quicksand", "Arial"],
  text: ["Inter", "Arial"],
  mono: ["JetBrains Mono", "monospace"],
};
const schriftGeladen = { titel: false, text: false, mono: false };
let TITEL = "Arial";
let SCHRIFT = "Arial";
let MONO = "monospace";

function ladeSchriften() {
  if (!document.fonts || !document.fonts.load) {
    return;
  }
  for (const art of Object.keys(SCHRIFTEN)) {
    const name = SCHRIFTEN[art][0];
    Promise.all([document.fonts.load(`400 16px "${name}"`), document.fonts.load(`700 16px "${name}"`)])
      .then((ergebnis) => {
        if (ergebnis[0].length > 0 && ergebnis[1].length > 0) {
          schriftGeladen[art] = true;
          TITEL = schriftGeladen.titel ? SCHRIFTEN.titel[0] : SCHRIFTEN.titel[1];
          SCHRIFT = schriftGeladen.text ? SCHRIFTEN.text[0] : SCHRIFTEN.text[1];
          MONO = schriftGeladen.mono ? SCHRIFTEN.mono[0] : SCHRIFTEN.mono[1];
        }
      })
      .catch(() => {});
  }
}

const P_DATEN = { x: 24, y: 84, w: 820, h: 800, titel: "" };
const P_ERKL = { x: 860, y: 84, w: 716, h: 244, titel: "" };
const P_EINST = { x: 860, y: 344, w: 716, h: 132, titel: "Einstellungen" };
const P_MODELL = { x: 860, y: 492, w: 716, h: 184, titel: "Modell & Güte" };
const P_KURVE = { x: 860, y: 692, w: 350, h: 192, titel: "" };
const P_RESID = { x: 1226, y: 692, w: 350, h: 192, titel: "Residuen  e = y − ŷ" };
const KOPF_H = 34; // Höhe der Panel-Überschrift

const PLOT = { x: 104, y: 134, w: 700, h: 612 };

// Farben (hell und dunkel) nach dem Corporate Design der Jakob-Preh-Schule (bsnes.de)
const FARBE_HELL = {
  papier: [251, 249, 245],
  flaeche: [255, 255, 255],
  flaeche2: [243, 238, 230],
  linie: [231, 225, 214],
  text: [29, 29, 28],
  grau: [91, 88, 82],
  blass: [125, 122, 114],
  akzent: [200, 30, 58],
  akzentHell: [228, 0, 43],
  senf: [184, 122, 28],
  blau: [44, 92, 150],
  gruen: [52, 128, 84],
  neutral: [160, 155, 146],
  // Flächen und Schrift auf Flächen (für das dunkle Schema nötig)
  textInvers: [255, 255, 255],
  dunkelFlaeche: [29, 29, 28],
  schatten: [29, 29, 28],
  akzentFlaeche: [253, 240, 242],
  akzentLinie: [240, 200, 208],
  rotFlaeche: [251, 225, 230],
  gruenFlaeche: [228, 241, 233],
};

const FARBE_DUNKEL = {
  papier: [22, 22, 21],
  flaeche: [32, 31, 30],
  flaeche2: [44, 42, 40],
  linie: [62, 59, 55],
  text: [236, 232, 224],
  grau: [184, 178, 168],
  blass: [140, 135, 126],
  akzent: [236, 76, 98],
  akzentHell: [255, 64, 92],
  senf: [222, 166, 72],
  blau: [104, 156, 222],
  gruen: [96, 186, 132],
  neutral: [120, 116, 108],
  textInvers: [22, 22, 21],
  dunkelFlaeche: [70, 67, 62],
  schatten: [0, 0, 0],
  akzentFlaeche: [52, 27, 32],
  akzentLinie: [104, 44, 56],
  rotFlaeche: [72, 32, 40],
  gruenFlaeche: [30, 54, 41],
};

const FARBE = {};

// --- Farbschema hell/dunkel ---------------------------------------------------
// FARBE enthält immer die aktive Palette. Beim Umschalten werden die Arrays
// in place überschrieben, damit Verweise wie [FARBE.blau, …] gültig bleiben.
// Die Wahl gilt für alle Lernsituationen (gleicher localStorage-Schlüssel).
const FARBSCHEMA_SCHLUESSEL = "jps-lernsituationen-farbschema";
let dunkelModus = false;

function setzeFarbschema(dunkel) {
  dunkelModus = !!dunkel;
  const quelle = dunkelModus ? FARBE_DUNKEL : FARBE_HELL;
  for (const k in quelle) {
    if (FARBE[k]) {
      FARBE[k].splice(0, FARBE[k].length, ...quelle[k]);
    } else {
      FARBE[k] = quelle[k].slice();
    }
  }
  document.documentElement.classList.toggle("dunkelmodus", dunkelModus);
}

function gespeichertesFarbschema() {
  try {
    const v = localStorage.getItem(FARBSCHEMA_SCHLUESSEL);
    if (v === "dunkel" || v === "hell") {
      return v === "dunkel";
    }
  } catch (e) {
    // kein Speicher verfügbar (z. B. privater Modus) – Systemeinstellung nehmen
  }
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

setzeFarbschema(gespeichertesFarbschema());


const TEMPO = {
  langsam: { anim: 450, pause: 650, proFrame: 1 },
  mittel: { anim: 0, pause: 0, proFrame: 1 },
  schnell: { anim: 0, pause: 0, proFrame: 12 },
};
const FORMEL_PAUSE = { langsam: 2600, mittel: 1600, schnell: 700 };
const MAX_SCHRITTE = 3000;

// -----------------------------------------------------------------------------
// Zustand
// -----------------------------------------------------------------------------
let szenario = "immobilien"; // "immobilien", "motor", "verschleiss" oder "energie" (siehe daten.js)
let startwert = SZ.startwert;
let basisDaten = [];
let daten = [];
let ols = null; // Ergebnis der kleinsten Quadrate (immer aktuell, für Vergleiche)

let verfahren = "formel"; // hand | formel | gd
let lernrate = 0.5;
let tempo = "mittel";

let gerade = null; // {a, b} – aktuelle Gerade oder null
let phase = "hand"; // hand · formel: leer|mittel|steigung|achse|fertig · gd: leer|lernen|fertig|divergiert
let gd = { w: 0, c: 0, gw: 0, gc: 0, mse: 0 };
let iteration = 0;
let verlauf = []; // {i, sse}

let anim = null; // {von, nach, t0, dauer}
let laufAuto = false;
let letzterSchritt = 0;

let residuenAn = true;
let quadrateAn = false;
let mitteAn = false;
let ausreisserAn = false;
let vergleichAn = false;

let ziehen = -1; // 0/1 = Griff der Geraden, 2 = Prognose-Marke
let prognoseX = null;

let hinweis = null;
let fehlerMeldung = null;
let cnv;

// =============================================================================
// Start
// =============================================================================
function setup() {
  ladeSchriften();
  const [cw, ch] = zeichenflaeche();
  cnv = createCanvas(cw, ch);
  S = width / W;

  setzeSzenario(szenario);
  basisDaten = erzeugeMessdaten(startwert);
  datenZusammenstellen();

  erstelleUi();
  cnv.parent(huelle);
  neuStarten();
  layoutUi();
}

function zeichenflaeche() {
  const cw = Math.max(800, Math.min(1600, windowWidth - 24, ((windowHeight - 24) * W) / H));
  return [Math.round(cw), Math.round((cw * H) / W)];
}

function windowResized() {
  const [cw, ch] = zeichenflaeche();
  resizeCanvas(cw, ch);
  S = width / W;
  layoutUi();
}

// =============================================================================
// Hauptschleife – Fehler werden abgefangen, damit nie alles einfriert
// =============================================================================
function draw() {
  try {
    logik();
    background(...FARBE.papier);
    push();
    scale(S);
    zeichneKopf();
    zeichneBeispielLeiste();
    push();
    translate(0, LEISTE);
    zeichneStatus();
    zeichneDatenPanel();
    zeichneErklaerung();
    zeichneEinstellungen();
    zeichneModellPanel();
    zeichneKurvenPanel();
    zeichneResiduenPanel();
    zeichneTooltip();
    zeichneFehlerMeldung();
    pop();
    pop();
    aktualisiereUi();
  } catch (err) {
    behandleFehler(err);
  }
}

function behandleFehler(err) {
  console.error(err);
  fehlerMeldung = { text: String((err && err.message) || err), t0: millis() };
  laufAuto = false;
  anim = null;
  ziehen = -1;
}

function logik() {
  if (anim && millis() - anim.t0 > anim.dauer) {
    anim = null;
  }
  if (!laufAuto) {
    return;
  }
  if (verfahren === "formel") {
    if (!anim && millis() - letzterSchritt > FORMEL_PAUSE[tempo]) {
      schritt();
    }
  } else if (verfahren === "gd") {
    const t = TEMPO[tempo];
    if (!anim && millis() - letzterSchritt > t.pause) {
      for (let i = 0; i < t.proFrame && laufAuto; i++) {
        schritt();
      }
    }
  }
  if (phase === "fertig" || phase === "divergiert") {
    laufAuto = false;
  }
}

// =============================================================================
// Daten
// =============================================================================
function datenZusammenstellen() {
  daten = ausreisserAn ? basisDaten.concat(ausreisserPunkte()) : basisDaten.slice();
  ols = kleinsteQuadrate(daten);
}

function szenarioWechseln(neu) {
  if (laufAuto || neu === szenario) {
    return;
  }
  szenario = neu;
  setzeSzenario(neu);
  startwert = SZ.startwert;
  basisDaten = erzeugeMessdaten(startwert);
  datenZusammenstellen();
  gerade = null;
  neuStarten();
}

function neueMessdaten() {
  if (SZ.fest) {
    zeigeHinweis("Das Skript-Beispiel hat feste Daten. Für zufällige Messdaten ein anderes Beispiel wählen.");
    return;
  }
  startwert = Math.floor(Math.random() * 1e9);
  basisDaten = erzeugeMessdaten(startwert);
  datenZusammenstellen();
  neuStarten();
}

// Ausreißer an/aus: die Gerade passt sich an (Formel sofort, KI lernt weiter)
function datenGeaendert(text) {
  datenZusammenstellen();
  if (verfahren === "formel" && phase !== "leer" && phase !== "mittel") {
    animiereZu(ols.g, 700);
  } else if (verfahren === "gd" && (phase === "fertig" || phase === "lernen")) {
    phase = "lernen";
  }
  zeigeHinweis(text + (verfahren === "gd" && phase === "lernen" ? " Die KI lernt mit → weiter." : ""));
}

// =============================================================================
// Ablauf der drei Verfahren
// =============================================================================
function verfahrenWechseln(neu) {
  if (laufAuto) {
    return;
  }
  const alteGerade = phase === "divergiert" ? null : zeigeGerade();
  verfahren = neu;
  neuStarten();
  // per Hand: mit der zuletzt gezeigten Geraden weitermachen
  if (neu === "hand" && alteGerade) {
    gerade = { a: alteGerade.a, b: alteGerade.b };
  }
}

function startGeradeHand() {
  const m2 = MERKMALE[1];
  // absichtlich schlecht: waagrecht im oberen Drittel
  return { a: 0, b: m2.min + 0.72 * (m2.max - m2.min) };
}

function neuStarten() {
  laufAuto = false;
  anim = null;
  ziehen = -1;
  iteration = 0;
  verlauf = [];
  if (verfahren === "hand") {
    phase = "hand";
    gerade = startGeradeHand();
  } else {
    phase = "leer";
    gerade = null;
  }
}

function schritt() {
  if (ziehen >= 0) {
    return;
  }
  anim = null;
  letzterSchritt = millis();
  if (verfahren === "formel") {
    formelSchritt();
  } else if (verfahren === "gd") {
    gdLernschritt();
  }
}

function formelSchritt() {
  if (phase === "leer") {
    phase = "mittel";
  } else if (phase === "mittel") {
    phase = "steigung";
    // Gerade dreht sich im Schwerpunkt von waagrecht auf die Steigung a
    gerade = { a: 0, b: ols.yq };
    animiereZu(ols.g, 1100);
  } else if (phase === "steigung") {
    phase = "achse";
  } else if (phase === "achse") {
    phase = "fertig";
  } else {
    zeigeHinweis("Fertig. Klicke ins Diagramm, um eine Prognose zu machen.");
    laufAuto = false;
  }
}

function gdLernschritt() {
  if (phase === "leer") {
    // zufällige Startgerade, die deutlich danebenliegt
    gd.w = random(-0.4, 0.4);
    gd.c = random() < 0.5 ? random(0.05, 0.2) : random(0.75, 0.95);
    gd.gw = 0;
    gd.gc = 0;
    gerade = ausNormiert(gd.w, gd.c);
    iteration = 0;
    verlauf = [{ i: 0, sse: fehlersumme(daten, gerade) }];
    phase = "lernen";
    return;
  }
  if (phase !== "lernen") {
    zeigeHinweis(phase === "divergiert" ? "Wähle eine kleinere Lernrate und starte neu." : "Die KI ist fertig. „Neu starten“ probiert eine andere Startgerade.");
    laufAuto = false;
    return;
  }
  const von = zeigeGerade();
  const r = gdSchritt(daten, gd.w, gd.c, lernrate);
  gd = { w: r.w, c: r.c, gw: r.gw, gc: r.gc, mse: r.mse };
  const neu = ausNormiert(gd.w, gd.c);
  iteration++;
  const sse = fehlersumme(daten, neu);
  verlauf.push({ i: iteration, sse });
  if (verlauf.length > 600) {
    verlauf.splice(1, 1); // Startwert behalten, Mitte ausdünnen
  }

  if (!isFinite(sse) || Math.abs(gd.w) > 60 || Math.abs(gd.c) > 60) {
    phase = "divergiert";
    gerade = neu;
    return;
  }
  const dauer = TEMPO[tempo].anim;
  gerade = neu;
  if (dauer > 0 && von) {
    anim = { von, nach: neu, t0: millis(), dauer };
  }
  if (Math.hypot(gd.gw, gd.gc) < 1e-4 || iteration >= MAX_SCHRITTE) {
    phase = "fertig";
  }
}

function autoUmschalten() {
  if (laufAuto) {
    laufAuto = false;
    return;
  }
  if (verfahren === "hand" || phase === "fertig" || phase === "divergiert") {
    return;
  }
  laufAuto = true;
  letzterSchritt = 0;
}

function animiereZu(ziel, dauer) {
  const von = zeigeGerade() || ziel;
  gerade = { a: ziel.a, b: ziel.b };
  anim = { von: { a: von.a, b: von.b }, nach: gerade, t0: millis(), dauer };
}

function zeigeHinweis(text) {
  hinweis = { text, t0: millis() };
}

function weich(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// angezeigte Gerade (gleitet während einer Animation)
function zeigeGerade() {
  if (!gerade) {
    return null;
  }
  if (anim) {
    const t = weich(constrain((millis() - anim.t0) / anim.dauer, 0, 1));
    return { a: lerp(anim.von.a, anim.nach.a, t), b: lerp(anim.von.b, anim.nach.b, t) };
  }
  return gerade;
}

// Gerade mit Gütemaßen erst ab dem Schritt "Achsenabschnitt" bewerten
function geradeFertig() {
  if (!gerade) {
    return false;
  }
  return verfahren !== "formel" || phase === "achse" || phase === "fertig" || phase === "steigung";
}

// x-Positionen der beiden Griffe (per Hand)
function griffX() {
  const m = MERKMALE[0];
  return [m.min + 0.12 * (m.max - m.min), m.min + 0.88 * (m.max - m.min)];
}

// =============================================================================
// Zahlen
// =============================================================================
function fSig(v, stellen) {
  if (!isFinite(v)) {
    return "∞";
  }
  if (v === 0) {
    return "0";
  }
  const s = Math.abs(v) >= 1e5 ? tausender(v) : Number(v.toPrecision(stellen || 3)).toString();
  return s.replace("-", "−");
}

function tausender(v) {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function fSSE(v) {
  if (!isFinite(v)) {
    return "∞";
  }
  if (v >= 1000) {
    return tausender(v);
  }
  if (v >= 10) {
    return v.toFixed(1);
  }
  return Number(v.toPrecision(3)).toString();
}

function fA(a) {
  return fSig(a, 3);
}

function fB(b) {
  const st = MERKMALE[1].stellen + 1;
  return b.toFixed(st).replace("-", "−");
}

function einheitA() {
  return `${MERKMALE[1].einheit}/${MERKMALE[0].einheit}`;
}

// z. B. "I = 0.0851 · m + 0.318"
function gleichung(g, mitEinheit) {
  const [m1, m2] = MERKMALE;
  const vz = g.b >= 0 ? "+" : "−";
  if (mitEinheit) {
    return `${m2.kurz} = ${fA(g.a)} ${einheitA()} · ${m1.kurz} ${vz} ${fB(Math.abs(g.b))} ${m2.einheit}`;
  }
  return `${m2.kurz} = ${fA(g.a)} · ${m1.kurz} ${vz} ${fB(Math.abs(g.b))}`;
}

// x-Wert, an dem die Gerade die Grenze erreicht (oder null)
function grenzX(g) {
  if (!SZ.grenze || !g || g.a <= 0) {
    return null;
  }
  return (SZ.grenze.y - g.b) / g.a;
}

function messbereich() {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of daten) {
    lo = Math.min(lo, p.x);
    hi = Math.max(hi, p.x);
  }
  return [lo, hi];
}

function umbrechen(txt, maxBreite) {
  const woerter = txt.split(" ");
  const zeilen = [];
  let akt = "";
  for (const wort of woerter) {
    const probe = akt ? akt + " " + wort : wort;
    if (textWidth(probe) > maxBreite && akt) {
      zeilen.push(akt);
      akt = wort;
    } else {
      akt = probe;
    }
  }
  if (akt) {
    zeilen.push(akt);
  }
  return zeilen;
}

// =============================================================================
// Zeichnen – Grundlagen
// =============================================================================
function mausX() {
  return mouseX / S;
}

function mausY() {
  return mouseY / S - LEISTE;
}

// Karte im Stil der Schule: weiße Fläche, feine Linie, Titel mit rotem Punkt
function panel(p) {
  noStroke();
  fill(...FARBE.schatten, 10);
  rect(p.x + 1, p.y + 3, p.w, p.h, 12);
  fill(...FARBE.flaeche);
  stroke(...FARBE.linie);
  strokeWeight(1);
  rect(p.x, p.y, p.w, p.h, 12);
  stroke(...FARBE.linie);
  line(p.x + 12, p.y + KOPF_H, p.x + p.w - 12, p.y + KOPF_H);
  if (p.titel) {
    noStroke();
    fill(...FARBE.akzentHell);
    circle(p.x + 19, p.y + KOPF_H / 2 + 1, 7);
    fill(...FARBE.text);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(16);
    textAlign(LEFT, CENTER);
    text(p.titel, p.x + 30, p.y + KOPF_H / 2 + 1);
    textStyle(NORMAL);
  }
}

function leerText(p, s) {
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(CENTER, CENTER);
  text(s, p.x + p.w / 2, p.y + KOPF_H + (p.h - KOPF_H) / 2);
}

// =============================================================================
// Kopfzeile
// =============================================================================
function zeichneKopf() {
  noStroke();
  fill(...FARBE.flaeche);
  rect(0, 0, W, 56);
  stroke(...FARBE.linie);
  strokeWeight(1);
  line(0, 56, W, 56);

  // Trenner zwischen Logo und Titel: Punkt und Strich wie im Logo
  noStroke();
  fill(...FARBE.akzentHell);
  circle(160, 28, 6);
  stroke(...FARBE.akzentHell);
  strokeWeight(3);
  line(170, 34, 180, 22);

  noStroke();
  fill(...FARBE.text);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(21);
  textAlign(LEFT, CENTER);
  text("KI-Prognose", 194, 21);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(13);
  fill(...FARBE.blass);
  text(SZ.untertitel, 194, 41);
}

// Beispiel-Leiste: hellrot hinterlegt, links „Beispiel“, daneben ein Reiter je
// Beispiel (HTML-Knöpfe, siehe ui.js). Gleiches Schema in allen PW-Programmen.
function zeichneBeispielLeiste() {
  noStroke();
  fill(...FARBE.akzentFlaeche);
  rect(0, 56, W, LEISTE);
  stroke(...FARBE.akzentLinie);
  strokeWeight(1);
  line(0, 56 + LEISTE, W, 56 + LEISTE);
  noStroke();
  fill(...FARBE.akzent);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(LEFT, CENTER);
  text("Beispiel", 26, 56 + LEISTE / 2);
  textStyle(NORMAL);
  stroke(...FARBE.akzent);
  strokeWeight(2);
  const px = 26 + textWidth("Beispiel") + 10;
  const py = 56 + LEISTE / 2;
  line(px, py - 5, px + 5, py);
  line(px + 5, py, px, py + 5);
  noStroke();
}

function zeichneStatus() {
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(LEFT, CENTER);
  text(statusText(), 26, 70);
}

function statusText() {
  const name = { hand: "per Hand", formel: "kleinste Quadrate", gd: `Gradientenabstieg (η = ${lernrate})` }[verfahren];
  let s = `${daten.length} ${SZ.wort.mehrzahl} mit bekanntem Zielwert${ausreisserAn ? " (davon ${SZ.ausreisser.length} Ausreißer)" : ""} · Verfahren: ${name}`;
  if (verfahren === "gd" && phase !== "leer") {
    s += ` · Lernschritt ${iteration}`;
  }
  const g = zeigeGerade();
  if (g && geradeFertig() && phase !== "divergiert") {
    const q = guete(daten, g);
    s += ` · SSE = ${fSSE(q.sse)} · R² = ${isFinite(q.r2) ? q.r2.toFixed(3) : "–"}`;
  }
  if (phase === "fertig") {
    s += " · fertig ✓";
  }
  return s;
}

// =============================================================================
// Messdaten
// =============================================================================
function zuPlot(x, y) {
  const [m1, m2] = MERKMALE;
  return [PLOT.x + ((x - m1.min) / (m1.max - m1.min)) * PLOT.w, PLOT.y + PLOT.h - ((y - m2.min) / (m2.max - m2.min)) * PLOT.h];
}

function ausPlot(px, py) {
  const [m1, m2] = MERKMALE;
  const x = m1.min + ((px - PLOT.x) / PLOT.w) * (m1.max - m1.min);
  const y = m2.min + ((PLOT.y + PLOT.h - py) / PLOT.h) * (m2.max - m2.min);
  return { x: constrain(x, m1.min, m1.max), y: constrain(y, m2.min, m2.max) };
}

function imPlot(px, py) {
  return px >= PLOT.x && px <= PLOT.x + PLOT.w && py >= PLOT.y && py <= PLOT.y + PLOT.h;
}

function griffUnterMaus() {
  if (verfahren !== "hand" || !gerade) {
    return -1;
  }
  const gx = griffX();
  for (let i = 0; i < 2; i++) {
    const [px, py] = zuPlot(gx[i], prognose(gerade, gx[i]));
    if (dist(mausX(), mausY(), px, py) < 16) {
      return i;
    }
  }
  return -1;
}

function prognoseUnterMaus() {
  if (prognoseX === null || !gerade) {
    return false;
  }
  const [px] = zuPlot(prognoseX, 0);
  return Math.abs(mausX() - px) < 8 && imPlot(mausX(), mausY());
}

function punktUnterMaus() {
  const mx = mausX();
  const my = mausY();
  if (!imPlot(mx, my)) {
    return -1;
  }
  let bester = -1;
  let besterAbstand = 9;
  for (let i = 0; i < daten.length; i++) {
    const [px, py] = zuPlot(daten[i].x, daten[i].y);
    const d = dist(mx, my, px, py);
    if (d < besterAbstand) {
      besterAbstand = d;
      bester = i;
    }
  }
  return bester;
}

function clipPlot() {
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  drawingContext.clip();
}

function clipEnde() {
  drawingContext.restore();
}

function gestrichelt(an) {
  drawingContext.setLineDash(an ? [6, 5] : []);
}

function zeichneGerade(g, farbe, dicke, strich) {
  const m1 = MERKMALE[0];
  const [x1, y1] = zuPlot(m1.min, prognose(g, m1.min));
  const [x2, y2] = zuPlot(m1.max, prognose(g, m1.max));
  stroke(...farbe);
  strokeWeight(dicke);
  gestrichelt(strich);
  line(x1, y1, x2, y2);
  gestrichelt(false);
}

function zeichneStern(x, y, r) {
  beginShape();
  for (let i = 0; i < 10; i++) {
    const a = -HALF_PI + (i * PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    vertex(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  endShape(CLOSE);
}

function achsenText(m) {
  return `${m.name} ${m.kurz} in ${m.einheit}`;
}

function marke(s, x, y, farbe, ausrichtung) {
  textFont(MONO);
  textSize(12);
  textStyle(BOLD);
  const w = textWidth(s) + 12;
  const lx = ausrichtung === RIGHT ? x - w : ausrichtung === CENTER ? x - w / 2 : x;
  noStroke();
  fill(...FARBE.flaeche, 240);
  stroke(...farbe);
  strokeWeight(1.2);
  rect(lx, y - 10, w, 20, 6);
  noStroke();
  fill(...farbe);
  textAlign(CENTER, CENTER);
  text(s, lx + w / 2, y);
  textStyle(NORMAL);
}

function zeichneDatenPanel() {
  P_DATEN.titel = SZ.titel;
  panel(P_DATEN);
  zeichneLegende();

  const [m1, m2] = MERKMALE;
  const g = zeigeGerade();

  // Diagrammfläche
  stroke(...FARBE.linie);
  strokeWeight(1);
  fill(...FARBE.papier);
  rect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);

  // Bereich außerhalb der Messdaten (Extrapolation) leicht getönt
  const [lo, hi] = messbereich();
  const [xlo] = zuPlot(lo, 0);
  const [xhi] = zuPlot(hi, 0);
  noStroke();
  fill(...FARBE.flaeche2, 150);
  rect(PLOT.x, PLOT.y, xlo - PLOT.x, PLOT.h);
  rect(xhi, PLOT.y, PLOT.x + PLOT.w - xhi, PLOT.h);
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(11);
  textAlign(CENTER, TOP);
  if (PLOT.x + PLOT.w - xhi > 80) {
    text("außerhalb der\nMessdaten",(xhi + PLOT.x + PLOT.w) / 2, PLOT.y + 56);
  }

  // Gitter und Achsen
  textFont(SCHRIFT);
  textSize(12);
  const anzX = Math.round((m1.max - m1.min) / m1.gitter);
  for (let i = 0; i <= anzX; i++) {
    const v = m1.min + i * m1.gitter;
    const [gx] = zuPlot(v, m2.min);
    stroke(...FARBE.text, 25);
    strokeWeight(1);
    line(gx, PLOT.y, gx, PLOT.y + PLOT.h);
    noStroke();
    fill(...FARBE.grau);
    textAlign(CENTER, TOP);
    text(Number(v.toFixed(3)).toString(), gx, PLOT.y + PLOT.h + 6);
  }
  const anzY = Math.round((m2.max - m2.min) / m2.gitter);
  for (let i = 0; i <= anzY; i++) {
    const v = m2.min + i * m2.gitter;
    const [, gy] = zuPlot(m1.min, v);
    stroke(...FARBE.text, 25);
    line(PLOT.x, gy, PLOT.x + PLOT.w, gy);
    noStroke();
    fill(...FARBE.grau);
    textAlign(RIGHT, CENTER);
    text(Number(v.toFixed(3)).toString(), PLOT.x - 6, gy);
  }
  fill(...FARBE.text);
  textStyle(BOLD);
  textSize(13);
  textAlign(CENTER, TOP);
  text(achsenText(m1), PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 26);
  push();
  translate(P_DATEN.x + 18, PLOT.y + PLOT.h / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  text(achsenText(m2), 0, 0);
  pop();
  textStyle(NORMAL);

  clipPlot();

  // Grenzwert (z. B. Verschleißgrenze)
  if (SZ.grenze) {
    const [, gy] = zuPlot(0, SZ.grenze.y);
    stroke(...FARBE.akzent);
    strokeWeight(1.8);
    gestrichelt(true);
    line(PLOT.x, gy, PLOT.x + PLOT.w, gy);
    gestrichelt(false);
    noStroke();
    fill(...FARBE.akzent);
    textFont(SCHRIFT);
    textStyle(BOLD);
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text(SZ.grenze.name, PLOT.x + 10, gy - 4);
    textStyle(NORMAL);
  }

  // Schwerpunkt (x̄ | ȳ)
  const zeigeMitte = mitteAn || (verfahren === "formel" && phase !== "leer");
  if (zeigeMitte) {
    const [mx, my] = zuPlot(ols.xq, ols.yq);
    stroke(...FARBE.senf);
    strokeWeight(1.5);
    gestrichelt(true);
    line(mx, PLOT.y, mx, PLOT.y + PLOT.h);
    line(PLOT.x, my, PLOT.x + PLOT.w, my);
    gestrichelt(false);
  }

  // beste Gerade zum Vergleich
  if (vergleichAn) {
    zeichneGerade(ols.g, FARBE.blass, 2, true);
  }

  // Fehlerquadrate und Residuen
  if (g && geradeFertig() && phase !== "divergiert") {
    for (const p of daten) {
      const [px, py] = zuPlot(p.x, p.y);
      const [, qy] = zuPlot(p.x, prognose(g, p.x));
      const seite = qy - py; // senkrechte Länge in Pixeln
      if (quadrateAn) {
        const nachLinks = px + Math.abs(seite) > PLOT.x + PLOT.w;
        noStroke();
        fill(...FARBE.akzent, 34);
        rect(nachLinks ? px - Math.abs(seite) : px, Math.min(py, qy), Math.abs(seite), Math.abs(seite));
      }
      if (residuenAn) {
        stroke(...FARBE.akzent, 190);
        strokeWeight(1.4);
        line(px, py, px, qy);
      }
    }
  }

  // Regressionsgerade
  if (g) {
    zeichneGerade(g, phase === "divergiert" ? FARBE.blass : FARBE.akzent, 3.2, false);
  }

  // Messpunkte (bei "Steigung a": eingefärbt nach dem Vorzeichen von (x − x̄)(y − ȳ))
  const vorzeichen = verfahren === "formel" && phase === "steigung";
  for (const p of daten) {
    const [px, py] = zuPlot(p.x, p.y);
    let f = FARBE.blau;
    if (vorzeichen) {
      f = (p.x - ols.xq) * (p.y - ols.yq) >= 0 ? FARBE.akzent : FARBE.blau;
    }
    if (p.ausreisser) {
      stroke(...FARBE.flaeche);
      strokeWeight(1.5);
      fill(...FARBE.senf);
      triangle(px, py - 8, px + 7.5, py + 5, px - 7.5, py + 5);
    } else {
      stroke(...FARBE.flaeche);
      strokeWeight(1.3);
      fill(f[0], f[1], f[2], 230);
      circle(px, py, 11);
    }
  }

  // Schwerpunkt-Marke obenauf
  if (zeigeMitte) {
    const [mx, my] = zuPlot(ols.xq, ols.yq);
    noStroke();
    fill(...FARBE.schatten, 40);
    circle(mx + 1, my + 2, 26);
    fill(...FARBE.flaeche);
    stroke(...FARBE.senf);
    strokeWeight(3.5);
    circle(mx, my, 22);
    line(mx - 6, my, mx + 6, my);
    line(mx, my - 6, mx, my + 6);
    marke("(x̄ | ȳ)", mx + 16, my - 22, FARBE.senf, LEFT);
  }

  // Achsenabschnitt b markieren
  if (g && verfahren === "formel" && (phase === "achse" || phase === "fertig") && m1.min === 0) {
    const [bx, by] = zuPlot(0, g.b);
    noStroke();
    fill(...FARBE.akzent);
    circle(bx, by, 14);
    marke(`b = ${fB(g.b)} ${m2.einheit}`, bx + 14, by - 20, FARBE.akzent, LEFT);
    // Steigungsdreieck
    const dx = m1.gitter * 2;
    const x0 = ols.xq;
    const [ax, ay] = zuPlot(x0, prognose(g, x0));
    const [cx, cy] = zuPlot(x0 + dx, prognose(g, x0));
    const [ex, ey] = zuPlot(x0 + dx, prognose(g, x0 + dx));
    stroke(...FARBE.text);
    strokeWeight(1.6);
    line(ax, ay, cx, cy);
    line(cx, cy, ex, ey);
    noStroke();
    fill(...FARBE.text);
    textFont(MONO);
    textSize(11);
    textAlign(CENTER, TOP);
    text(`+${Number(dx.toFixed(3))} ${m1.einheit}`, (ax + cx) / 2, cy + 4);
    textAlign(LEFT, CENTER);
    text(`+${fSig(g.a * dx)} ${m2.einheit}`, cx + 6, (cy + ey) / 2);
  }

  // Griffe (per Hand)
  if (verfahren === "hand" && gerade) {
    const gx = griffX();
    const aktiv = ziehen >= 0 ? ziehen : griffUnterMaus();
    for (let i = 0; i < 2; i++) {
      const [px, py] = zuPlot(gx[i], prognose(gerade, gx[i]));
      noStroke();
      fill(...FARBE.schatten, 40);
      circle(px + 1, py + 2, 28);
      fill(...FARBE.flaeche);
      stroke(...FARBE.akzent);
      strokeWeight(i === aktiv ? 4.5 : 3.5);
      circle(px, py, i === aktiv ? 28 : 24);
      noStroke();
      fill(...FARBE.akzent);
      triangle(px - 4, py - 3, px + 4, py - 3, px, py - 8);
      triangle(px - 4, py + 3, px + 4, py + 3, px, py + 8);
    }
  }

  // Grenze erreicht?
  const gxGrenze = g && geradeFertig() ? grenzX(g) : null;
  if (gxGrenze !== null && gxGrenze > m1.min && gxGrenze < m1.max) {
    const [px, py] = zuPlot(gxGrenze, SZ.grenze.y);
    stroke(...FARBE.akzent);
    strokeWeight(1.5);
    gestrichelt(true);
    line(px, py, px, PLOT.y + PLOT.h);
    gestrichelt(false);
    noStroke();
    fill(...FARBE.akzentHell);
    circle(px, py, 12);
    marke(`${m1.kurz} ≈ ${gxGrenze.toFixed(m1.stellen)} ${m1.einheit}`, px, PLOT.y + PLOT.h - 34, FARBE.akzent, CENTER);
  }

  // Prognose
  if (g && prognoseX !== null && geradeFertig()) {
    const yv = prognose(g, prognoseX);
    const [px, py] = zuPlot(prognoseX, yv);
    stroke(...FARBE.text);
    strokeWeight(1.6);
    gestrichelt(true);
    line(px, PLOT.y + PLOT.h, px, py);
    line(PLOT.x, py, px, py);
    gestrichelt(false);
    stroke(...FARBE.flaeche);
    strokeWeight(2);
    fill(...FARBE.text);
    zeichneStern(px, py, 13);
    const rechts = px < PLOT.x + PLOT.w - 230;
    marke(`${m2.kurz} ≈ ${wertText(yv, m2)}`, rechts ? px + 16 : px - 16, py - 18, FARBE.text, rechts ? LEFT : RIGHT);
    marke(`${m1.kurz} = ${wertText(prognoseX, m1)}`, px, PLOT.y + PLOT.h - 14, FARBE.text, CENTER);
  }

  clipEnde();

  zeichnePlotBanner();

  // Hinweis unter den Knöpfen
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, CENTER);
  if (verfahren === "hand") {
    text("Runde Griffe nach oben/unten ziehen", 540, 838);
  } else {
    text("Maus auf Punkt: Messwerte und Residuum", 540, 838);
  }
  text("Klick ins Diagramm: Prognose · Esc entfernt sie", 540, 856);

  // Mauszeiger
  if (ziehen >= 0 || griffUnterMaus() >= 0) {
    cursor("ns-resize");
  } else if (prognoseUnterMaus()) {
    cursor("ew-resize");
  } else if (imPlot(mausX(), mausY()) && !laufAuto && gerade) {
    cursor(CROSS);
  } else {
    cursor(ARROW);
  }
}

// Legende rechts in der Überschrift des Datenfelds
function zeichneLegende() {
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, CENTER);
  const y = P_DATEN.y + 17;
  let x = P_DATEN.x + P_DATEN.w - 16;
  const eintraege = [
    { name: SZ.wort.einzahl, art: "punkt" },
    { name: "Gerade ŷ", art: "gerade" },
  ];
  if (residuenAn) {
    eintraege.push({ name: "Residuum", art: "residuum" });
  }
  if (ausreisserAn) {
    eintraege.push({ name: "Ausreißer", art: "ausreisser" });
  }
  let breite = 0;
  for (const e of eintraege) {
    breite += textWidth(e.name) + 34;
  }
  x -= breite;
  for (const e of eintraege) {
    if (e.art === "punkt") {
      stroke(...FARBE.flaeche);
      strokeWeight(1.3);
      fill(...FARBE.blau);
      circle(x + 6, y, 11);
    } else if (e.art === "gerade") {
      stroke(...FARBE.akzent);
      strokeWeight(3);
      line(x - 2, y, x + 14, y);
    } else if (e.art === "residuum") {
      stroke(...FARBE.akzent);
      strokeWeight(1.5);
      line(x + 6, y - 7, x + 6, y + 7);
    } else {
      noStroke();
      fill(...FARBE.senf);
      triangle(x + 6, y - 7, x + 13, y + 5, x - 1, y + 5);
    }
    noStroke();
    fill(...FARBE.text);
    text(e.name, x + 18, y + 1);
    x += textWidth(e.name) + 34;
  }
}

function zeichnePlotBanner() {
  let s = "";
  if (verfahren === "formel" && phase === "leer") {
    s = `${SZ.wort.jede} ${SZ.wort.einzahl} hat einen bekannten Zielwert · mit → die beste Gerade berechnen`;
  } else if (verfahren === "gd" && phase === "leer") {
    s = "Mit → bekommt die KI eine zufällige Startgerade";
  } else if (phase === "divergiert") {
    s = "Lernrate zu groß – die Gerade schaukelt sich auf!";
  }
  if (!s) {
    return;
  }
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(14);
  const b = textWidth(s) + 28;
  noStroke();
  fill(...(phase === "divergiert" ? [...FARBE.akzent, 235] : [...FARBE.dunkelFlaeche, 225]));
  rect(PLOT.x + PLOT.w / 2 - b / 2, PLOT.y + 14, b, 32, 16);
  fill(255);
  textAlign(CENTER, CENTER);
  text(s, PLOT.x + PLOT.w / 2, PLOT.y + 30);
  textStyle(NORMAL);
}

// =============================================================================
// Erklärfeld
// =============================================================================
function erklaerung() {
  const [m1, m2] = MERKMALE;
  const n = daten.length;
  const wt = SZ.wort;
  const g = zeigeGerade();

  if (verfahren === "hand") {
    const q = guete(daten, gerade);
    const mehr = ols.sse > 0 ? ((q.sse - ols.sse) / ols.sse) * 100 : 0;
    return {
      titel: "① Gerade per Hand anpassen",
      text:
        "Ziehe die beiden runden Griffe, bis die Gerade möglichst gut durch die Punktwolke läuft. " +
        "Die roten senkrechten Striche sind die Residuen: So weit liegt jede Messung neben der Vorhersage ŷ. " +
        "Ziel: Die Summe der quadrierten Residuen soll so klein wie möglich werden.",
      formeln: [
        `ŷ = a·x + b    →    ${gleichung(gerade, true)}`,
        "Residuum      e = y − ŷ",
        `Fehlersumme   SSE = Σ e² = ${fSSE(q.sse)}`,
        mehr < 0.5 ? `Minimum: ${fSSE(ols.sse)}  →  perfekt getroffen! ✓` : `Minimum: ${fSSE(ols.sse)}  →  du liegst ${mehr < 1000 ? mehr.toFixed(0) : "> 1000"} % darüber`,
      ],
    };
  }

  if (verfahren === "formel") {
    const o = ols;
    if (phase === "leer") {
      return {
        titel: "② Kleinste Quadrate · die Formel",
        text:
          "Die Methode der kleinsten Quadrate (C. F. Gauß) berechnet die beste Gerade direkt – ganz ohne Probieren. " +
          "„Beste“ heißt: Die Summe der quadrierten Residuen ist minimal. Vier Schritte:",
        formeln: [
          "① Mittelwerte          x̄ und ȳ",
          "② Steigung             a = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²",
          "③ Achsenabschnitt      b = ȳ − a · x̄",
          "④ Güte                 R² = 1 − SSE / SST",
        ],
      };
    }
    if (phase === "mittel") {
      return {
        titel: "① Mittelwerte – der Schwerpunkt der Punktwolke",
        text: `Aus allen ${n} ${wt.mehrzahl} wird der Mittelwert von x und von y gebildet. Die beste Gerade läuft immer durch diesen Schwerpunkt (x̄ | ȳ) – jetzt fehlt nur noch ihre Steigung.`,
        formeln: [
          `x̄ = (${daten[0].x.toFixed(m1.stellen)} + ${daten[1].x.toFixed(m1.stellen)} + …) / ${n} = ${o.xq.toFixed(m1.stellen + 2)} ${m1.einheit}`,
          `ȳ = (${daten[0].y.toFixed(m2.stellen)} + ${daten[1].y.toFixed(m2.stellen)} + …) / ${n} = ${o.yq.toFixed(m2.stellen + 2)} ${m2.einheit}`,
        ],
      };
    }
    if (phase === "steigung") {
      let plus = 0;
      for (const p of daten) {
        if ((p.x - o.xq) * (p.y - o.yq) >= 0) {
          plus++;
        }
      }
      return {
        titel: "② Steigung a – wer zieht die Gerade wohin?",
        text: `Rote Punkte liegen rechts oben oder links unten vom Schwerpunkt: (x − x̄)·(y − ȳ) ist positiv und kippt die Gerade nach oben. Blaue Punkte kippen sie nach unten. Hier: ${plus} rot, ${n - plus} blau.`,
        formeln: [
          `Σ(x − x̄)(y − ȳ) = ${fSig(o.sxy, 4)}`,
          `Σ(x − x̄)²       = ${fSig(o.sxx, 4)}`,
          `a = ${fSig(o.sxy, 4)} / ${fSig(o.sxx, 4)} = ${fA(o.a)} ${einheitA()}`,
        ],
      };
    }
    if (phase === "achse") {
      return {
        titel: "③ Achsenabschnitt b – Wert bei x = 0",
        text: `Weil die Gerade durch den Schwerpunkt geht, gilt ȳ = a · x̄ + b. Umgestellt ergibt sich b. ${wt.deuteA(fA(o.a) + " " + m2.einheit)} ${wt.deuteB(fB(o.b) + " " + m2.einheit)}`,
        formeln: [
          `b = ȳ − a · x̄ = ${o.yq.toFixed(m2.stellen + 2)} − ${fA(o.a)} · ${o.xq.toFixed(m1.stellen + 2)} = ${fB(o.b)} ${m2.einheit}`,
          `Modell:  ${gleichung(o.g, true)}`,
        ],
      };
    }
    return {
      titel: "④ Güte · Bestimmtheitsmaß R²",
      text: `R² gibt an, welcher Anteil der Streuung von ${m2.name} durch ${m1.name} erklärt wird: 1 = alle Punkte liegen auf der Geraden, 0 = die Gerade sagt nicht mehr als der Mittelwert ȳ. Klicke jetzt ins Diagramm für eine Prognose.`,
      formeln: [
        `SST = Σ(y − ȳ)² = ${fSSE(o.sst)}      (Streuung ohne Modell)`,
        `SSE = Σ(y − ŷ)² = ${fSSE(o.sse)}      (Reststreuung mit Modell)`,
        `R²  = 1 − ${fSSE(o.sse)} / ${fSSE(o.sst)} = ${o.r2.toFixed(3)}`,
      ],
    };
  }

  // Gradientenabstieg
  if (phase === "leer") {
    return {
      titel: "③ Gradientenabstieg · so lernt eine KI",
      text:
        "Statt mit einer Formel zu rechnen, verbessert die KI ihre Gerade in vielen kleinen Schritten: Sie startet zufällig und dreht a und b immer ein Stück in die Richtung, " +
        "in der der Fehler am schnellsten sinkt (Gradient). Die Schrittweite heißt Lernrate η. Genauso lernen neuronale Netze.",
      formeln: [
        "Fehler     MSE = (1/n) · Σ (ŷ − y)²",
        "Gradient   ∂MSE/∂w , ∂MSE/∂c   zeigt bergauf",
        "Schritt    w ← w − η · ∂MSE/∂w     c ← c − η · ∂MSE/∂c",
        "(w, c: Steigung und Achsenabschnitt in normierten Werten 0 … 1)",
      ],
    };
  }
  const sse = verlauf.length > 0 ? verlauf[verlauf.length - 1].sse : 0;
  const vorher = verlauf.length > 1 ? verlauf[verlauf.length - 2].sse : sse;
  const formeln = [
    `w = ${fSig(gd.w, 4)}   c = ${fSig(gd.c, 4)}     →  ${g ? gleichung(g, false) : ""}`,
    `∂MSE/∂w = ${fSig(gd.gw, 3)}    ∂MSE/∂c = ${fSig(gd.gc, 3)}    η = ${lernrate}`,
    `SSE = ${fSSE(sse)}     (Formel-Minimum: ${fSSE(ols.sse)})`,
  ];
  if (phase === "divergiert") {
    return {
      titel: "Lernrate zu groß – die KI schaukelt sich auf",
      text: `Jeder Schritt springt über das Tal hinaus auf die andere Seite – und landet dabei höher als vorher. Der Fehler wächst immer weiter. Wähle eine kleinere Lernrate und starte neu.`,
      formeln,
    };
  }
  if (phase === "fertig") {
    const abw = ols.sse > 0 ? ((sse - ols.sse) / ols.sse) * 100 : 0;
    return {
      titel: iteration >= MAX_SCHRITTE ? `Abgebrochen nach ${iteration} Lernschritten` : `Gelernt nach ${iteration} Lernschritten ✓`,
      text:
        iteration >= MAX_SCHRITTE
          ? "Die Lernrate ist so klein, dass die KI kaum vorankommt. Probiere eine größere Lernrate."
          : `Der Gradient ist fast null – bergab geht es nicht mehr. Die KI liegt nur ${abw.toFixed(2)} % über dem Minimum der Formel. Vergleiche mit „Beste Gerade zum Vergleich“.`,
      formeln,
    };
  }
  let t;
  if (iteration === 0) {
    t = "Die KI startet mit einer zufälligen Geraden. Für jede Messung wird der Fehler berechnet, daraus der Gradient: Er sagt, wie a und b sich ändern müssen.";
  } else if (sse > vorher * 1.0001) {
    t = "Achtung: Der Fehler ist gestiegen! Der Schritt war zu groß und ist über das Minimum hinausgesprungen.";
  } else if (lernrate <= 0.01) {
    t = "Sehr kleine Lernrate: Die Gerade bewegt sich nur in winzigen Schritten. Das ist sicher, dauert aber sehr lange.";
  } else {
    t = `Lernschritt ${iteration}: Die Gerade ist ein Stück bergab gerutscht, der Fehler ist kleiner geworden. Je flacher es wird, desto kleiner werden die Schritte.`;
  }
  return { titel: `Lernschritt ${iteration}`, text: t, formeln };
}

function zeichneErklaerung() {
  const p = P_ERKL;
  const e = erklaerung();
  p.titel = e.titel;
  panel(p);

  let ty = p.y + KOPF_H + 10;
  const unten = p.y + p.h - 50;
  noStroke();
  textAlign(LEFT, TOP);
  textFont(SCHRIFT);
  textSize(14);
  if (hinweis && millis() - hinweis.t0 < 3500) {
    fill(...FARBE.akzent);
    textStyle(BOLD);
    for (const z of umbrechen(hinweis.text, p.w - 32)) {
      text(z, p.x + 16, ty);
      ty += 18;
    }
    textStyle(NORMAL);
  } else {
    fill(...FARBE.grau);
    for (const z of umbrechen(e.text, p.w - 32).slice(0, 4)) {
      text(z, p.x + 16, ty);
      ty += 18;
    }
  }

  ty += 6;
  textFont(MONO);
  textSize(13);
  fill(...FARBE.text);
  for (const f of e.formeln) {
    if (ty + 15 > unten) {
      break;
    }
    text(f, p.x + 16, ty);
    ty += 16;
  }
}

function zeichneEinstellungen() {
  const p = P_EINST;
  panel(p);
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, TOP);
  const t = {
    hand: "Per Hand: Du bist das Modell. Gelingt dir eine kleinere Fehlersumme als der Formel? (Tipp: unmöglich.)",
    formel: "Formel: liefert die beste Gerade in einem Rutsch – geht aber nur bei so einfachen Modellen wie der Geraden.",
    gd: "Gradientenabstieg: funktioniert auch bei Millionen Parametern (neuronale Netze). Probiere η = 0.01 und η = 1.2!",
  }[verfahren];
  text(t, p.x + 16, p.y + p.h - 22);
}

// =============================================================================
// Modell & Güte
// =============================================================================
function zeichneModellPanel() {
  const p = P_MODELL;
  panel(p);
  const g = zeigeGerade();
  if (!g || !geradeFertig() || phase === "divergiert") {
    leerText(p, phase === "divergiert" ? "Kein brauchbares Modell –\nder Fehler ist explodiert." : "Noch keine Gerade.\nHier stehen gleich Modellgleichung, Deutung und Gütemaße.");
    return;
  }
  const [m1, m2] = MERKMALE;
  const q = guete(daten, g);
  const x0 = p.x + 16;
  let y = p.y + KOPF_H + 18;

  noStroke();
  fill(...FARBE.text);
  textFont(MONO);
  textStyle(BOLD);
  textSize(15);
  textAlign(LEFT, CENTER);
  text(gleichung(g, true), x0, y);
  textStyle(NORMAL);

  y += 22;
  textFont(SCHRIFT);
  textSize(12.5);
  fill(...FARBE.grau);
  textAlign(LEFT, TOP);
  const deutungen = [
    "a: " + SZ.wort.deuteA(fA(g.a) + " " + m2.einheit),
    "b: " + SZ.wort.deuteB(fB(g.b) + " " + m2.einheit),
  ];
  for (const d of deutungen) {
    for (const z of umbrechen(d, 440).slice(0, 2)) {
      text(z, x0, y);
      y += 16;
    }
    y += 4;
  }

  // Prognose bzw. Grenze
  y = p.y + p.h - 24;
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(13);
  textAlign(LEFT, CENTER);
  const gx = grenzX(g);
  let zeile = "";
  let farbe = FARBE.text;
  if (prognoseX !== null) {
    const [lo, hi] = messbereich();
    const extra = prognoseX < lo || prognoseX > hi;
    zeile = `★ Prognose: ${m1.kurz} = ${wertText(prognoseX, m1)}  →  ${m2.kurz} ≈ ${wertText(prognose(g, prognoseX), m2)}${extra ? "   ⚠ Extrapolation" : ""}`;
    farbe = extra ? FARBE.akzent : FARBE.text;
  } else if (SZ.grenze) {
    zeile = gx !== null && gx > 0 ? `Grenze erreicht bei ${m1.kurz} ≈ ${gx.toFixed(m1.stellen)} ${m1.einheit}  →  ${SZ.grenze.ereignis}` : "Die Gerade erreicht die Grenze nie (Steigung ≤ 0).";
    farbe = FARBE.akzent;
  } else {
    zeile = `Frage: ${SZ.wort.frage}`;
    farbe = FARBE.blass;
    textStyle(NORMAL);
  }
  fill(...farbe);
  text(zeile, x0, y);
  textStyle(NORMAL);

  // Gütemaße rechts
  const tx = p.x + 478;
  const tw = p.w - 478 - 16;
  stroke(...FARBE.linie);
  strokeWeight(1);
  line(tx - 14, p.y + KOPF_H + 10, tx - 14, p.y + p.h - 44);
  const reihen = [
    ["n", String(q.n)],
    ["SSE = Σe²", fSSE(q.sse)],
    ["MSE = SSE/n", fSig(q.mse, 3)],
    ["RMSE = √MSE", `${fSig(q.rmse, 3)} ${m2.einheit}`],
    ["R²", isFinite(q.r2) ? q.r2.toFixed(3) : "–"],
  ];
  let ry = p.y + KOPF_H + 16;
  for (const [k, v] of reihen) {
    noStroke();
    fill(...FARBE.blass);
    textFont(SCHRIFT);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(k, tx, ry);
    fill(...FARBE.text);
    textFont(MONO);
    textSize(13);
    textStyle(k === "R²" ? BOLD : NORMAL);
    textAlign(RIGHT, CENTER);
    text(v, tx + tw, ry);
    textStyle(NORMAL);
    ry += 19;
  }
  // R²-Balken
  const r2 = constrain(isFinite(q.r2) ? q.r2 : 0, 0, 1);
  noStroke();
  fill(...FARBE.flaeche2);
  rect(tx, ry - 4, tw, 8, 4);
  fill(...FARBE.akzent);
  rect(tx, ry - 4, tw * r2, 8, 4);
}

// =============================================================================
// Fehlersumme je Lernschritt bzw. Vergleich mit dem Minimum
// =============================================================================
function zeichneKurvenPanel() {
  const p = P_KURVE;
  p.titel = verfahren === "gd" ? "Fehlersumme je Lernschritt" : "Fehlersumme im Vergleich";
  panel(p);

  if (verfahren !== "gd") {
    const g = zeigeGerade();
    if (!g || !geradeFertig()) {
      leerText(p, "Die Fehlersumme SSE zeigt,\nwie weit die Messungen insgesamt\nneben der Geraden liegen.");
      return;
    }
    const jetzt = fehlersumme(daten, g);
    const balken = [
      { name: verfahren === "hand" ? "Deine Gerade" : "Formel", wert: jetzt, farbe: FARBE.akzent },
      { name: "Minimum", wert: ols.sse, farbe: FARBE.blass },
      { name: "nur ȳ (a = 0)", wert: ols.sst, farbe: FARBE.neutral },
    ];
    const max = Math.max(...balken.map((b) => b.wert)) * 1.05;
    let y = p.y + KOPF_H + 22;
    const bx = p.x + 112;
    const bw = p.w - 112 - 70;
    for (const b of balken) {
      noStroke();
      fill(...FARBE.grau);
      textFont(SCHRIFT);
      textSize(12);
      textAlign(LEFT, CENTER);
      text(b.name, p.x + 16, y);
      fill(...FARBE.flaeche2);
      rect(bx, y - 9, bw, 18, 4);
      fill(...b.farbe);
      rect(bx, y - 9, Math.max(2, (b.wert / max) * bw), 18, 4);
      fill(...FARBE.text);
      textFont(MONO);
      textAlign(LEFT, CENTER);
      text(fSSE(b.wert), bx + bw + 6, y);
      y += 34;
    }
    noStroke();
    fill(...FARBE.blass);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(LEFT, CENTER);
    text("Kleiner als das Minimum geht es nicht.", p.x + 16, p.y + p.h - 18);
    return;
  }

  if (verlauf.length === 0) {
    leerText(p, "Noch kein Lernschritt.\nHier sieht man, wie der Fehler\nbeim Lernen sinkt.");
    return;
  }
  // Liniendiagramm
  const gx = p.x + 66;
  const gy = p.y + KOPF_H + 16;
  const gw = p.w - 86;
  const gh = p.h - KOPF_H - 48;
  const minX = verlauf[0].i;
  const maxX = Math.max(1, verlauf[verlauf.length - 1].i);
  let maxY = verlauf[0].sse;
  for (const q of verlauf) {
    if (isFinite(q.sse)) {
      maxY = Math.max(maxY, Math.min(q.sse, verlauf[0].sse * 4));
    }
  }
  maxY = maxY > 0 ? maxY * 1.1 : 1;
  const sx = (x) => gx + (maxX === minX ? 0.5 : (x - minX) / (maxX - minX)) * gw;
  const sy = (v) => gy + gh - (Math.min(v, maxY) / maxY) * gh;

  stroke(...FARBE.linie);
  strokeWeight(1);
  line(gx, sy(maxY / 2), gx + gw, sy(maxY / 2));
  // Minimum der Formel
  stroke(...FARBE.gruen);
  gestrichelt(true);
  line(gx, sy(ols.sse), gx + gw, sy(ols.sse));
  gestrichelt(false);
  stroke(...FARBE.blass);
  strokeWeight(1.5);
  line(gx, gy, gx, gy + gh);
  line(gx, gy + gh, gx + gw, gy + gh);

  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(11);
  textAlign(RIGHT, CENTER);
  text(fSSE(maxY / 2), gx - 6, sy(maxY / 2));
  text("0", gx - 6, sy(0));
  textAlign(CENTER, TOP);
  text(String(minX), gx, gy + gh + 5);
  text(String(maxX), gx + gw, gy + gh + 5);
  text("Lernschritt", gx + gw / 2, gy + gh + 5);
  fill(...FARBE.gruen);
  textAlign(RIGHT, BOTTOM);
  text("Minimum", gx + gw, sy(ols.sse) - 2);

  const f = phase === "divergiert" ? FARBE.akzent : FARBE.blau;
  noFill();
  stroke(...f);
  strokeWeight(2.5);
  beginShape();
  for (const q of verlauf) {
    vertex(sx(q.i), sy(q.sse));
  }
  endShape();
  const last = verlauf[verlauf.length - 1];
  noStroke();
  fill(...f);
  circle(sx(last.i), sy(last.sse), 8);
}

// =============================================================================
// Residuendiagramm
// =============================================================================
function zeichneResiduenPanel() {
  const p = P_RESID;
  panel(p);
  const g = zeigeGerade();
  if (!g || !geradeFertig() || phase === "divergiert") {
    leerText(p, "Residuen gegen x: Liegen sie\nzufällig um die Null, passt\ndas lineare Modell.");
    return;
  }
  const m1 = MERKMALE[0];
  const gx = p.x + 50;
  const gy = p.y + KOPF_H + 14;
  const gw = p.w - 66;
  const gh = p.h - KOPF_H - 40;
  let maxE = 0;
  for (const q of daten) {
    maxE = Math.max(maxE, Math.abs(residuum(g, q)));
  }
  maxE = maxE > 0 ? maxE * 1.15 : 1;
  const sx = (x) => gx + ((x - m1.min) / (m1.max - m1.min)) * gw;
  const sy = (e) => gy + gh / 2 - (e / maxE) * (gh / 2);

  stroke(...FARBE.linie);
  strokeWeight(1);
  noFill();
  rect(gx, gy, gw, gh);
  stroke(...FARBE.akzent);
  strokeWeight(2);
  line(gx, sy(0), gx + gw, sy(0));

  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(11);
  textAlign(RIGHT, CENTER);
  text("0", gx - 6, sy(0));
  text("+" + fSig(maxE, 2), gx - 6, gy + 6);
  text("−" + fSig(maxE, 2), gx - 6, gy + gh - 6);
  textAlign(CENTER, TOP);
  text(`${m1.name} in ${m1.einheit}`, gx + gw / 2, gy + gh + 5);

  for (const q of daten) {
    const e = residuum(g, q);
    const px = sx(q.x);
    const py = sy(e);
    stroke(...FARBE.akzent, 110);
    strokeWeight(1);
    line(px, sy(0), px, py);
    noStroke();
    fill(...(q.ausreisser ? FARBE.senf : FARBE.blau));
    circle(px, py, 7);
  }
}

// -----------------------------------------------------------------------------
// Tooltip und Fehlermeldung
// -----------------------------------------------------------------------------
function zeichneTooltip() {
  if (ziehen >= 0) {
    return;
  }
  const i = punktUnterMaus();
  if (i < 0) {
    return;
  }
  const [m1, m2] = MERKMALE;
  const q = daten[i];
  let s = `${q.ausreisser ? "Ausreißer" : SZ.wort.einzahl + " " + q.id} · ${wertText(q.x, m1)} · ${wertText(q.y, m2)}`;
  const g = zeigeGerade();
  if (g && geradeFertig() && phase !== "divergiert") {
    const e = residuum(g, q);
    s += ` · ŷ = ${wertText(prognose(g, q.x), m2)} · e = ${e >= 0 ? "+" : "−"}${Math.abs(e).toFixed(m2.stellen)} ${m2.einheit}`;
  }
  const mx = mausX();
  const my = mausY();
  textFont(SCHRIFT);
  textSize(13);
  const w = textWidth(s) + 18;
  const tx = Math.min(mx + 14, W - w - 10);
  noStroke();
  fill(...FARBE.dunkelFlaeche, 235);
  rect(tx, my + 14, w, 26, 6);
  fill(255);
  textAlign(LEFT, CENTER);
  text(s, tx + 9, my + 27);
}

function zeichneFehlerMeldung() {
  if (!fehlerMeldung || millis() - fehlerMeldung.t0 > 8000) {
    return;
  }
  const s = "Interner Fehler: " + fehlerMeldung.text + "  (Details in der Konsole)";
  textFont(SCHRIFT);
  textSize(14);
  const b = textWidth(s) + 30;
  noStroke();
  fill(...FARBE.akzent, 240);
  rect(W / 2 - b / 2, 62, b, 30, 6);
  fill(255);
  textAlign(CENTER, CENTER);
  text(s, W / 2, 77);
}

// =============================================================================
// Eingaben
// =============================================================================
function mousePressed() {
  if (laufAuto) {
    return;
  }
  const mx = mausX();
  const my = mausY();

  // 1. Griff der Geraden anfassen
  const gr = griffUnterMaus();
  if (gr >= 0) {
    ziehen = gr;
    return;
  }
  if (!imPlot(mx, my)) {
    return;
  }
  // 2. Prognose setzen (und ziehbar machen)
  if (gerade && geradeFertig() && phase !== "divergiert") {
    prognoseX = aufRaster(ausPlot(mx, my).x, MERKMALE[0]);
    ziehen = 2;
    return;
  }
  zeigeHinweis(verfahren === "formel" ? "Erst die Gerade berechnen (→), dann kann sie Prognosen machen." : "Erst lernen lassen (→), dann kann die Gerade Prognosen machen.");
}

function mouseDragged() {
  if (ziehen < 0) {
    return;
  }
  const pkt = ausPlot(mausX(), mausY());
  if (ziehen === 2) {
    prognoseX = aufRaster(pkt.x, MERKMALE[0]);
    return;
  }
  // Griff i bewegt sich senkrecht, der andere Griff bleibt stehen
  const gx = griffX();
  const andere = 1 - ziehen;
  const yAndere = prognose(gerade, gx[andere]);
  const a = (pkt.y - yAndere) / (gx[ziehen] - gx[andere]);
  gerade = { a, b: pkt.y - a * gx[ziehen] };
}

function mouseReleased() {
  ziehen = -1;
}

function keyPressed() {
  // Tasten nicht abfangen, wenn eine Auswahlliste oder ein Textfeld den Fokus hat
  const el = document.activeElement;
  if (el && (el.tagName === "SELECT" || el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && !["checkbox", "range", "button", "file"].includes(el.type)))) {
    return true;
  }
  if (key === "ArrowRight") {
    if (!laufAuto) {
      schritt();
    }
    return false;
  }
  if (key === " ") {
    autoUmschalten();
    return false;
  }
  if ((key === "r" || key === "R") && !laufAuto) {
    neuStarten();
    return false;
  }
  if (key === "Escape") {
    prognoseX = null;
    return false;
  }
  return true;
}

// =============================================================================
// Daten als CSV speichern (z. B. zur Weiterarbeit in Python oder Excel)
// =============================================================================
function csvSpeichern() {
  const [m1, m2] = MERKMALE;
  const g = zeigeGerade();
  const mitModell = g && geradeFertig() && phase !== "divergiert";
  const kopf = [SZ.wort.einzahl.toLowerCase(), m1.csv, m2.csv];
  if (mitModell) {
    kopf.push("prognose", "residuum");
  }
  const zeilen = [kopf.join(";")];
  const sortiert = daten.slice().sort((a, b) => a.id - b.id);
  for (const q of sortiert) {
    const z = [q.id, q.x.toFixed(m1.stellen), q.y.toFixed(m2.stellen)];
    if (mitModell) {
      z.push(prognose(g, q.x).toFixed(m2.stellen + 1), residuum(g, q).toFixed(m2.stellen + 1));
    }
    zeilen.push(z.join(";"));
  }
  const blob = new Blob([zeilen.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = SZ.csvDatei;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
