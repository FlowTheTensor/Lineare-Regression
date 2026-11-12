// =============================================================================
//  regression.js – der Algorithmus
// =============================================================================
//  Eine Gerade wird als { a, b } in echten Einheiten gespeichert:
//      ŷ = a · x + b        (a = Steigung, b = Achsenabschnitt)
//
//  Zwei Wege zur besten Geraden:
//    1. Methode der kleinsten Quadrate – direkt mit einer Formel berechnet
//    2. Gradientenabstieg – so "lernen" neuronale Netze: Schritt für Schritt
//       bergab auf der Fehlerfläche
// =============================================================================

// Vorhersage der Geraden für einen x-Wert
function prognose(g, x) {
  return g.a * x + g.b;
}

// Residuum = gemessen − vorhergesagt (positiv: Punkt liegt über der Geraden)
function residuum(g, p) {
  return p.y - prognose(g, p.x);
}

// Fehlersumme SSE = Σ (y − ŷ)²
function fehlersumme(daten, g) {
  let s = 0;
  for (const p of daten) {
    const e = residuum(g, p);
    s += e * e;
  }
  return s;
}

// Alle Zwischenwerte der Methode der kleinsten Quadrate (für die Erklärung)
function kleinsteQuadrate(daten) {
  const n = daten.length;
  let sx = 0;
  let sy = 0;
  for (const p of daten) {
    sx += p.x;
    sy += p.y;
  }
  const xq = sx / n;
  const yq = sy / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of daten) {
    sxy += (p.x - xq) * (p.y - yq);
    sxx += (p.x - xq) * (p.x - xq);
    syy += (p.y - yq) * (p.y - yq);
  }
  const a = sxx > 0 ? sxy / sxx : 0;
  const b = yq - a * xq;
  const g = { a, b };
  const sse = fehlersumme(daten, g);
  return { n, xq, yq, sxy, sxx, sst: syy, a, b, g, sse, r2: syy > 0 ? 1 - sse / syy : 1 };
}

// Gütemaße einer beliebigen Geraden
function guete(daten, g) {
  const n = daten.length;
  let yq = 0;
  for (const p of daten) {
    yq += p.y;
  }
  yq /= n;
  let sst = 0;
  for (const p of daten) {
    sst += (p.y - yq) * (p.y - yq);
  }
  const sse = fehlersumme(daten, g);
  const mse = sse / n;
  return { n, sse, mse, rmse: Math.sqrt(mse), r2: sst > 0 ? 1 - sse / sst : 1 };
}

// -----------------------------------------------------------------------------
// Gradientenabstieg
// -----------------------------------------------------------------------------
//  Damit eine Lernrate für alle Beispiele passt, wird in normierten Größen
//  gerechnet:  x′ = (x − xmin) / (xmax − xmin)   und   y′ entsprechend.
//  Modell:     ŷ′ = w · x′ + c
//  Verlust:    MSE = (1/n) · Σ (ŷ′ − y′)²
//  Gradient:   ∂MSE/∂w = (2/n) · Σ (ŷ′ − y′) · x′
//              ∂MSE/∂c = (2/n) · Σ (ŷ′ − y′)
//  Schritt:    w ← w − η · ∂MSE/∂w      c ← c − η · ∂MSE/∂c
// -----------------------------------------------------------------------------
function normX(x) {
  const m = MERKMALE[0];
  return (x - m.min) / (m.max - m.min);
}

function normY(y) {
  const m = MERKMALE[1];
  return (y - m.min) / (m.max - m.min);
}

// normierte Parameter (w, c) → Gerade in echten Einheiten
function ausNormiert(w, c) {
  const [m1, m2] = MERKMALE;
  const rx = m1.max - m1.min;
  const ry = m2.max - m2.min;
  const a = (w * ry) / rx;
  const b = m2.min + c * ry - a * m1.min;
  return { a, b };
}

// Gerade in echten Einheiten → normierte Parameter (w, c)
function inNormiert(g) {
  const [m1, m2] = MERKMALE;
  const rx = m1.max - m1.min;
  const ry = m2.max - m2.min;
  const w = (g.a * rx) / ry;
  const c = (prognose(g, m1.min) - m2.min) / ry;
  return { w, c };
}

// ein Schritt bergab; liefert neue Parameter, Gradient und Verlust vorher
function gdSchritt(daten, w, c, eta) {
  const n = daten.length;
  let gw = 0;
  let gc = 0;
  let mse = 0;
  for (const p of daten) {
    const xn = normX(p.x);
    const e = w * xn + c - normY(p.y);
    gw += e * xn;
    gc += e;
    mse += e * e;
  }
  gw = (2 / n) * gw;
  gc = (2 / n) * gc;
  mse /= n;
  return { w: w - eta * gw, c: c - eta * gc, gw, gc, mse };
}
