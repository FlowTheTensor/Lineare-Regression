// =============================================================================
//  daten.js – Messdaten für drei Beispiele (jeweils MIT Zielwert = "Label")
// =============================================================================
//  Lineare Regression ist überwachtes Lernen: Zu jeder Eingabe x ist der
//  gemessene Zielwert y bekannt. Gesucht ist eine Gerade y = a·x + b, mit der
//  sich für neue x-Werte ein y vorhersagen lässt (Prognose).
//
//  Beispiel "motor" (Standard):
//    Förderband der Industrie-4.0-Modellanlage. Pro Messung: Beladung in kg
//    und Motorstrom in A.  → Wie viel Strom zieht der Motor bei 9 kg?
//
//  Beispiel "verschleiss":
//    Fräswerkzeug. Pro Messung: Einsatzzeit in min und Verschleißmarken-
//    breite VB in mm.  → Wann ist die Verschleißgrenze VB = 0.30 mm erreicht?
//
//  Beispiel "energie":
//    Fertigungslinie. Pro Schicht: Stückzahl und Energieverbrauch in kWh.
//    → Was bedeutet der Achsenabschnitt b? (Grundlast ohne ein einziges Teil)
//
//  Die "wahre" Gerade (wahrA, wahrB) dient nur dazu, die Beispieldaten zu
//  erzeugen. Das Verfahren kennt sie nicht – es sieht nur die Messpunkte.
// =============================================================================

const SZENARIEN = {
  immobilien: {
    name: "Skript · Immobilienpreise",
    titel: "Verkaufsdaten · Immobilienmakler",
    untertitel: "Beispiel aus dem Skript (4.1) · Lineare Regression · überwachtes Lernen",
    startwert: 1,
    merkmale: [
      { name: "Wohnfläche", kurz: "A", einheit: "m²", min: 0, max: 160, gitter: 20, stellen: 0, raster: 1, csv: "wohnflaeche_m2" },
      { name: "Verkaufspreis", kurz: "P", einheit: "T€", min: 0, max: 450, gitter: 50, stellen: 1, raster: 0.1, csv: "verkaufspreis_tsd_eur" },
    ],
    // feste Daten aus dem Skript (Preise in Tausend €) – werden nicht zufällig erzeugt
    fest: [
      { x: 50, y: 200 },
      { x: 75, y: 210 },
      { x: 100, y: 300 },
      { x: 120, y: 320 },
    ],
    ausreisser: [{ x: 60, y: 390 }],
    grenze: null,
    wort: {
      einzahl: "Haus",
      mehrzahl: "Häuser",
      jede: "Jedes",
      deuteA: (a) => `Jeder zusätzliche Quadratmeter Wohnfläche erhöht den Preis um ${a}.`,
      deuteB: (b) => `Ein Haus mit 0 m² würde ${b} kosten – ein rein rechnerischer Wert (eher Grundstück), solche Häuser gibt es nicht.`,
      frage: "Was kostet ein Haus mit 140 m² Wohnfläche? (Skript, Aufgabe c)",
    },
    csvDatei: "immobilienpreise_skript.csv",
  },

  motor: {
    name: "Förderband · Motorstrom",
    titel: "Messdaten · Förderband-Antrieb M1",
    untertitel: "Förderband-Antrieb · Lineare Regression · überwachtes Lernen",
    startwert: 20260311,
    merkmale: [
      { name: "Beladung", kurz: "m", einheit: "kg", min: 0, max: 12, gitter: 1, stellen: 1, raster: 0.1, csv: "beladung_kg" },
      { name: "Motorstrom", kurz: "I", einheit: "A", min: 0, max: 1.6, gitter: 0.2, stellen: 2, raster: 0.01, csv: "motorstrom_a" },
    ],
    wahrA: 0.085,
    wahrB: 0.32,
    streuung: 0.045,
    n: 40,
    xBereich: [0.5, 10.5],
    // Fehlmessungen, die mit "Ausreißer einfügen" dazukommen
    ausreisser: [
      { x: 1.6, y: 1.42 },
      { x: 9.8, y: 0.28 },
      { x: 4.2, y: 1.38 },
    ],
    grenze: null,
    wort: {
      einzahl: "Messung",
      mehrzahl: "Messungen",
      jede: "Jede",
      // Deutung der Steigung a und des Achsenabschnitts b
      deuteA: (a) => `Pro zusätzlichem Kilogramm Beladung steigt der Motorstrom um ${a}.`,
      deuteB: (b) => `Ohne Beladung (Leerlauf) zieht der Motor ${b} – Reibung von Band und Getriebe.`,
      frage: "Wie viel Strom wird der Motor bei einer Beladung von 11 kg ziehen?",
    },
    csvDatei: "messdaten_foerderband_m1.csv",
  },

  verschleiss: {
    name: "Fräswerkzeug · Verschleiß",
    titel: "Messdaten · Schaftfräser T12",
    untertitel: "Werkzeugverschleiß · Lineare Regression · Predictive Maintenance",
    startwert: 20260412,
    merkmale: [
      { name: "Einsatzzeit", kurz: "t", einheit: "min", min: 0, max: 300, gitter: 25, stellen: 0, raster: 1, csv: "einsatzzeit_min" },
      { name: "Verschleiß", kurz: "VB", einheit: "mm", min: 0, max: 0.4, gitter: 0.05, stellen: 3, raster: 0.001, csv: "verschleiss_vb_mm" },
    ],
    wahrA: 0.00095,
    wahrB: 0.04,
    streuung: 0.011,
    n: 32,
    xBereich: [8, 190],
    ausreisser: [
      { x: 30, y: 0.27 },
      { x: 175, y: 0.06 },
      { x: 120, y: 0.31 },
    ],
    // waagrechte Grenzlinie: Wann erreicht die Prognose diesen Wert?
    grenze: { y: 0.3, name: "Verschleißgrenze VB = 0.30 mm", ereignis: "Werkzeug tauschen" },
    wort: {
      einzahl: "Messung",
      mehrzahl: "Messungen",
      jede: "Jede",
      deuteA: (a) => `Pro Minute Einsatzzeit wächst der Verschleiß um ${a}.`,
      deuteB: (b) => `Schon beim Start misst man ${b} – Einlaufverschleiß der neuen Schneide.`,
      frage: "Nach wie vielen Minuten muss der Fräser getauscht werden?",
    },
    csvDatei: "messdaten_fraeser_t12.csv",
  },

  energie: {
    name: "Fertigungslinie · Energie",
    titel: "Schichtdaten · Fertigungslinie 2",
    untertitel: "Energieverbrauch · Lineare Regression · Grundlast erkennen",
    startwert: 20251111,
    merkmale: [
      { name: "Stückzahl", kurz: "n", einheit: "Stk", min: 0, max: 500, gitter: 50, stellen: 0, raster: 1, csv: "stueckzahl" },
      { name: "Energie", kurz: "E", einheit: "kWh", min: 0, max: 300, gitter: 25, stellen: 0, raster: 1, csv: "energie_kwh" },
    ],
    wahrA: 0.38,
    wahrB: 62,
    streuung: 9,
    n: 36,
    xBereich: [90, 460],
    ausreisser: [
      { x: 120, y: 205 },
      { x: 430, y: 95 },
      { x: 300, y: 255 },
    ],
    grenze: null,
    wort: {
      einzahl: "Schicht",
      mehrzahl: "Schichten",
      jede: "Jede",
      deuteA: (a) => `Jedes zusätzliche Teil kostet ${a} Energie.`,
      deuteB: (b) => `Auch ohne ein einziges Teil verbraucht die Linie ${b} pro Schicht – die Grundlast (Druckluft, Licht, Standby).`,
      frage: "Wie viel Energie braucht eine Schicht ohne Produktion – und was kostet ein Teil?",
    },
    csvDatei: "schichtdaten_linie2.csv",
  },
};

// aktives Beispiel – wird mit setzeSzenario() umgeschaltet
let SZ = SZENARIEN.immobilien;
let MERKMALE = SZ.merkmale;

function setzeSzenario(schluessel) {
  SZ = SZENARIEN[schluessel];
  MERKMALE = SZ.merkmale;
}

// Zufallsgenerator mit festem Startwert: der Datensatz ist bei jedem Start gleich
function zufallsGenerator(startwert) {
  let a = startwert >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// normalverteilte Zufallszahl (Box-Muller-Verfahren)
function gaussZahl(rnd) {
  let u = 0;
  while (u === 0) {
    u = rnd();
  }
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function begrenzen(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// auf das Messraster runden (z. B. 0.01 A oder 1 kWh)
function aufRaster(v, m) {
  const r = Math.round(v / m.raster) * m.raster;
  return Number(r.toFixed(Math.max(0, m.stellen)));
}

function erzeugeMessdaten(startwert) {
  const rnd = zufallsGenerator(startwert);
  const [mx, my] = MERKMALE;
  if (SZ.fest) {
    return SZ.fest.map((p, i) => ({ id: 1001 + i, x: p.x, y: p.y, ausreisser: false }));
  }
  const liste = [];
  for (let i = 0; i < SZ.n; i++) {
    const x = SZ.xBereich[0] + rnd() * (SZ.xBereich[1] - SZ.xBereich[0]);
    const y = SZ.wahrB + SZ.wahrA * x + gaussZahl(rnd) * SZ.streuung;
    liste.push({ x, y, ausreisser: false });
  }
  // nach x sortiert durchnummerieren wäre zu ordentlich – Reihenfolge wie gemessen
  for (let i = 0; i < liste.length; i++) {
    const b = liste[i];
    b.id = 1001 + i;
    b.x = aufRaster(begrenzen(b.x, mx.min + mx.raster, mx.max - mx.raster), mx);
    b.y = aufRaster(begrenzen(b.y, my.min + my.raster, my.max - my.raster), my);
  }
  return liste;
}

function ausreisserPunkte() {
  return SZ.ausreisser.map((p, i) => ({ id: 9001 + i, x: p.x, y: p.y, ausreisser: true }));
}

// Messwert mit Einheit, z. B. "0.72 A" oder "180 kWh"
function wertText(v, m) {
  return v.toFixed(m.stellen) + " " + m.einheit;
}
