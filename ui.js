// =============================================================================
//  ui.js – HTML-Bedienelemente über der Zeichenfläche
// =============================================================================
//  Alle Positionen werden im logischen 1600×900-Raster angegeben und beim
//  Ändern der Fenstergröße mitskaliert (siehe layoutUi).
// =============================================================================

const ui = {};
const uiPositionen = [];
let huelle;

function platziere(el, x, y, w, ...klassen) {
  el.addClass("ui");
  for (const k of klassen) {
    el.addClass(k);
  }
  el.parent(huelle);
  uiPositionen.push({ el, x, y, w });
  return el;
}

function layoutUi() {
  huelle.style("width", width + "px");
  huelle.style("font-size", 15 * S + "px");
  for (const p of uiPositionen) {
    // alles unterhalb der Kopfzeile rutscht um die Beispiel-Leiste nach unten
    const y = p.y >= 56 && !p.el.hasClass("beispiel") ? p.y + LEISTE : p.y;
    p.el.position(p.x * S, y * S);
    if (p.w) {
      p.el.style("width", p.w * S + "px");
    }
  }
}

// Nach dem Anklicken den Fokus abgeben, damit die Tasten wieder wirken
function fokusWeg(el) {
  const inp = el.elt.querySelector ? el.elt.querySelector("input, select") : null;
  (inp || el.elt).blur();
}

function erstelleUi() {
  huelle = createDiv();
  huelle.addClass("huelle");

  // --- Kopfzeile -------------------------------------------------------------
  ui.logo = platziere(createImg("assets/logo-jps.png", "Logo der Jakob-Preh-Schule"), 14, 3, 122, "logo");

  // Beispiel-Leiste: ein Reiter je Beispiel (Reihenfolge wie in daten.js)
  ui.beispiele = {};
  let bx = 128;
  Object.keys(SZENARIEN).forEach((id, i) => {
    const text = `${i + 1} · ${SZENARIEN[id].name}`;
    const b = 34 + text.length * 8.6;
    ui.beispiele[id] = platziere(createButton(text), bx, 63, b, "beispiel");
    ui.beispiele[id].attribute("title", "Beispiel wechseln (neue Messdaten, Verfahren startet neu)");
    ui.beispiele[id].mousePressed(() => {
      szenarioWechseln(id);
      ui.beispiele[id].elt.blur();
    });
    bx += b + 10;
  });

  ui.neueDaten = platziere(createButton("Neue Messdaten"), 1270, 12, 150, "kopf");
  ui.neueDaten.mousePressed(neueMessdaten);

  ui.csv = platziere(createButton("CSV speichern"), 1428, 12, 148, "kopf");
  ui.csv.mousePressed(csvSpeichern);

  // --- unter dem Diagramm ----------------------------------------------------
  ui.residuen = platziere(createButton("Residuen zeigen"), 40, 830, 220);
  ui.residuen.mousePressed(() => {
    residuenAn = !residuenAn;
  });

  ui.quadrate = platziere(createButton("Fehlerquadrate zeigen"), 270, 830, 250);
  ui.quadrate.mousePressed(() => {
    quadrateAn = !quadrateAn;
  });

  // --- Ablauf (Erklärfeld) ---------------------------------------------------
  ui.schritt = platziere(createButton("Schritt ▶ (→)"), 876, 284, 190, "dunkel");
  ui.schritt.mousePressed(schritt);

  ui.auto = platziere(createButton("▶ Automatisch"), 1074, 284, 190, "primaer");
  ui.auto.mousePressed(autoUmschalten);

  ui.neu = platziere(createButton("↺ Neu starten (R)"), 1272, 284, 190);
  ui.neu.mousePressed(neuStarten);

  // --- Einstellungen ---------------------------------------------------------
  platziere(createSpan("Verfahren"), 876, 380, 80);
  ui.verfahren = platziere(createSelect(), 956, 380, 262);
  ui.verfahren.option("① Gerade per Hand anpassen", "hand");
  ui.verfahren.option("② Kleinste Quadrate (Formel)", "formel");
  ui.verfahren.option("③ Gradientenabstieg (KI lernt)", "gd");
  ui.verfahren.selected(verfahren);
  ui.verfahren.changed(() => {
    verfahrenWechseln(ui.verfahren.value());
    ui.verfahren.elt.blur();
  });

  platziere(createSpan("Lernrate η"), 1236, 380, 84);
  ui.lernrate = platziere(createSelect(), 1320, 380, 78);
  for (const eta of ["0.01", "0.1", "0.5", "0.8", "1.2"]) {
    ui.lernrate.option(eta, eta);
  }
  ui.lernrate.selected(String(lernrate));
  ui.lernrate.changed(() => {
    lernrate = parseFloat(ui.lernrate.value());
    neuStarten();
    ui.lernrate.elt.blur();
  });

  platziere(createSpan("Tempo"), 1418, 380, 56);
  ui.tempo = platziere(createSelect(), 1474, 380, 90);
  for (const t of ["langsam", "mittel", "schnell"]) {
    ui.tempo.option(t, t);
  }
  ui.tempo.selected(tempo);
  ui.tempo.changed(() => {
    tempo = ui.tempo.value();
    ui.tempo.elt.blur();
  });

  ui.mitte = platziere(createCheckbox(" Schwerpunkt (x̄ | ȳ)", mitteAn), 876, 418, 200);
  ui.mitte.changed(() => {
    mitteAn = ui.mitte.checked();
    fokusWeg(ui.mitte);
  });

  ui.ausreisser = platziere(createCheckbox(" Ausreißer einfügen", ausreisserAn), 1086, 418, 190);
  ui.ausreisser.changed(() => {
    ausreisserAn = ui.ausreisser.checked();
    datenGeaendert(ausreisserAn ? `${SZ.ausreisser.length === 1 ? "1 Ausreißer" : SZ.ausreisser.length + " Ausreißer"} eingefügt – wie stark verbiegen sie die Gerade?` : "Ausreißer entfernt.");
    fokusWeg(ui.ausreisser);
  });

  ui.vergleich = platziere(createCheckbox(" Beste Gerade zum Vergleich", vergleichAn), 1286, 418, 280);
  ui.vergleich.changed(() => {
    vergleichAn = ui.vergleich.checked();
    fokusWeg(ui.vergleich);
  });
}

// --- kleine Helfer, damit das DOM nur bei echten Änderungen angefasst wird ---
function beschrifte(el, html) {
  if (el._html !== html) {
    el.html(html);
    el._html = html;
  }
}

function sperre(el, gesperrt) {
  if (el.elt.disabled !== gesperrt) {
    el.elt.disabled = gesperrt;
  }
  const inp = el.elt.querySelector ? el.elt.querySelector("input") : null;
  if (inp && inp.disabled !== gesperrt) {
    inp.disabled = gesperrt;
  }
}

function klasse(el, name, an) {
  if (an) {
    el.addClass(name);
  } else {
    el.removeClass(name);
  }
}

// wird in jedem Frame aufgerufen
function aktualisiereUi() {
  beschrifte(ui.auto, laufAuto ? "■ Anhalten" : "▶ Automatisch");
  klasse(ui.auto, "primaer", !laufAuto);
  klasse(ui.auto, "dunkel", laufAuto);

  const fertig = phase === "fertig" || phase === "divergiert";
  if (verfahren === "hand") {
    beschrifte(ui.schritt, "Gerade ziehen ✋");
  } else if (verfahren === "formel") {
    const texte = {
      leer: "① Mittelwerte ▶ (→)",
      mittel: "② Steigung a ▶ (→)",
      steigung: "③ Achsenabschnitt b ▶ (→)",
      achse: "④ Güte R² ▶ (→)",
      fertig: "Fertig ✓",
    };
    beschrifte(ui.schritt, texte[phase] || "Schritt ▶ (→)");
  } else {
    beschrifte(ui.schritt, phase === "leer" ? "Startgerade ▶ (→)" : fertig ? "Fertig ✓" : "Lernschritt ▶ (→)");
  }
  sperre(ui.schritt, laufAuto || fertig || verfahren === "hand");
  sperre(ui.auto, fertig || verfahren === "hand");

  beschrifte(ui.residuen, residuenAn ? "Residuen ausblenden" : "Residuen zeigen");
  klasse(ui.residuen, "kopf", true);
  klasse(ui.residuen, "aktiv", residuenAn);
  beschrifte(ui.quadrate, quadrateAn ? "Fehlerquadrate ausblenden" : "Fehlerquadrate zeigen");
  klasse(ui.quadrate, "kopf", true);
  klasse(ui.quadrate, "aktiv", quadrateAn);

  for (const id of Object.keys(ui.beispiele)) {
    klasse(ui.beispiele[id], "aktiv", id === szenario);
    sperre(ui.beispiele[id], laufAuto && id !== szenario);
    ui.beispiele[id].attribute("aria-pressed", id === szenario ? "true" : "false");
  }

  sperre(ui.lernrate, laufAuto || verfahren !== "gd");
  for (const el of [ui.verfahren, ui.ausreisser, ui.neueDaten, ui.neu]) {
    sperre(el, laufAuto);
  }
}
