# KI-Prognose · Lineare Regression

Überwachtes Lernen zum Zuschauen und Ausprobieren: Aus Messdaten mit bekanntem Zielwert lernt das Programm eine Gerade $\hat{y} = a \cdot x + b$ und sagt damit neue Werte voraus. Die Gerade lässt sich auf drei Wegen finden – per Hand, mit der Formel der kleinsten Quadrate oder mit dem Gradientenabstieg, so wie eine KI lernt. Jeder Schritt ist mit allen Zahlen und Formeln nachvollziehbar.

Erstellt für den Unterricht an der Jakob-Preh-Schule ([bsnes.de](https://www.bsnes.de)).

**Live-Version:** [Hier direkt anschauen](https://flowthetensor.github.io/Lineare-Regression/)

---

## Worum geht es?

Zu jeder Eingabe x ist der gemessene Zielwert y bekannt (das „Label“). Gesucht ist eine Gerade, die möglichst gut durch die Punktwolke läuft. Mit ihr lässt sich für neue x-Werte ein y vorhersagen – eine **Prognose**. Weil der Zielwert eine Zahl ist und keine Klasse, spricht man von **Regression**.

In der roten **Beispiel-Leiste** unter der Kopfzeile stehen vier Beispiele zur Verfügung. Reiter 1 ist das Beispiel aus dem Skript (Kap. 4.1), die anderen drei kommen aus der Industrie. Zu jedem Beispiel gibt es **Ausreißer** (Fehlmessungen), die sich mit „Ausreißer einfügen“ dazunehmen lassen.

> Die Industrie-Werte sind simuliert und an eine typische 24-V-Modellanlage für Industrie 4.0 angelehnt. Sobald echte Messdaten der ETS-Anlage verfügbar sind, kann man sie mit realen Werten vergleichen.

### 1. Skript · Immobilienpreise (Standard)

Die vier Häuser aus dem Skript, fest und unverändert:

| Wohnfläche | Verkaufspreis |
|---|---|
| 50 m² | 200 T€ |
| 75 m² | 210 T€ |
| 100 m² | 300 T€ |
| 120 m² | 320 T€ |

Ergebnis mit der Formel: $\hat{P} \approx 1{,}92\ \tfrac{\text{T€}}{\text{m}^2} \cdot A + 92{,}0\ \text{T€}$, $R^2 = 0{,}904$. Skript-Aufgabe c: Ein Haus mit 140 m² kostet demnach etwa **361 T€**. Der Ausreißer (60 m² für 390 T€) verbiegt die Gerade bei nur vier Punkten so stark, dass $R^2$ auf 0,08 fällt.

### 2. Förderband · Motorstrom

Am Förderband-Antrieb M1 der Modellanlage werden 40-mal Beladung und Motorstrom gemessen:

| Merkmal | Bereich |
|---|---|
| Beladung m | 0,5 … 10,5 kg |
| Motorstrom I | 0 … 1,6 A |

Bei Gleichstrom-Getriebemotoren ist der Strom proportional zum Drehmoment, also zur Last. Die Steigung (≈ 0,084 A/kg) ist der Mehrstrom pro Kilogramm, der Achsenabschnitt (≈ 0,33 A) der **Leerlaufstrom** für die Reibung von Band und Getriebe. Frage: Wie viel Strom zieht der Motor bei 11 kg? (≈ 1,25 A – außerhalb der gemessenen Werte!)

### 3. Fräswerkzeug · Verschleiß (Predictive Maintenance)

Am Schaftfräser T12 wird nach verschiedenen Einsatzzeiten die Verschleißmarkenbreite VB gemessen (32 Messungen):

| Merkmal | Bereich |
|---|---|
| Einsatzzeit t | 8 … 190 min |
| Verschleiß VB | 0 … 0,4 mm |

Der Achsenabschnitt (≈ 0,04 mm) ist der **Einlaufverschleiß** der neuen Schneide. Im Diagramm ist die **Verschleißgrenze VB = 0,30 mm** eingezeichnet: Die Prognose zeigt, wann das Werkzeug getauscht werden muss (beim Standard-Datensatz nach etwa 278 min). Auch das ist eine Extrapolation weit über die Messdaten hinaus.

### 4. Fertigungslinie · Energie

Für 36 Schichten der Fertigungslinie 2 sind Stückzahl und Energieverbrauch erfasst:

| Merkmal | Bereich |
|---|---|
| Stückzahl n | 90 … 460 Stk |
| Energie E | 0 … 300 kWh |

Die Steigung (≈ 0,39 kWh/Stk) ist der Energiebedarf pro Teil. Der Achsenabschnitt (≈ 61 kWh) ist die **Grundlast**: So viel verbraucht die Linie pro Schicht, ohne ein einziges Teil zu produzieren (Druckluft, Licht, Standby) – ein typisches Thema beim Energiesparen in der Fabrik.

## Die lineare Regression

**Modell:** $\hat{y} = a \cdot x + b$ mit Steigung $a$ und Achsenabschnitt $b$.

**Residuum:** So weit liegt eine Messung neben der Vorhersage (positiv: Punkt liegt über der Geraden):

$$e = y - \hat{y}$$

**Fehlersumme** (SSE): Summe der quadrierten Residuen. Die beste Gerade macht sie so klein wie möglich.

$$\text{SSE} = \sum_i (y_i - \hat{y}_i)^2$$

### ① Gerade per Hand anpassen

Die beiden runden Griffe der Geraden nach oben oder unten ziehen. Die Residuen und Fehlerquadrate lassen sich einblenden, das Erklärfeld zeigt, wie viel Prozent die Fehlersumme noch über dem Minimum liegt.

### ② Methode der kleinsten Quadrate (Formel)

Die Formel nach C. F. Gauß berechnet die beste Gerade direkt, ganz ohne Probieren – in vier Schritten:

```
① Mittelwerte          x̄ und ȳ  (der Schwerpunkt der Punktwolke)
② Steigung             a = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²
③ Achsenabschnitt      b = ȳ − a · x̄
④ Güte                 R² = 1 − SSE / SST
```

$$a = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2} \qquad b = \bar{y} - a \cdot \bar{x}$$

Die beste Gerade läuft immer durch den **Schwerpunkt** $(\bar{x} \mid \bar{y})$. Bei der Steigung sieht man im Diagramm, welche Punkte die Gerade nach oben kippen (rechts oben oder links unten vom Schwerpunkt, rot) und welche nach unten (blau).

**Bestimmtheitsmaß:** Welcher Anteil der Streuung von y wird durch x erklärt?

$$R^2 = 1 - \frac{\text{SSE}}{\text{SST}} \qquad \text{SST} = \sum_i (y_i - \bar{y})^2$$

$R^2 = 1$: Alle Punkte liegen auf der Geraden. $R^2 = 0$: Die Gerade sagt nicht mehr als der Mittelwert $\bar{y}$.

### ③ Gradientenabstieg – so lernt eine KI

Die KI startet mit einer geratenen Geraden und verbessert sie in vielen kleinen Schritten bergab auf der Fehlerfläche. Damit eine Lernrate für alle Beispiele passt, werden x und y vorher auf 0 … 1 normiert ($x'$, $y'$), gelernt werden $w$ und $c$ mit $\hat{y}' = w \cdot x' + c$:

$$\text{MSE} = \frac{1}{n} \sum_i (\hat{y}'_i - y'_i)^2$$

$$\frac{\partial\,\text{MSE}}{\partial w} = \frac{2}{n} \sum_i (\hat{y}'_i - y'_i)\, x'_i \qquad \frac{\partial\,\text{MSE}}{\partial c} = \frac{2}{n} \sum_i (\hat{y}'_i - y'_i)$$

$$w \leftarrow w - \eta \cdot \frac{\partial\,\text{MSE}}{\partial w} \qquad c \leftarrow c - \eta \cdot \frac{\partial\,\text{MSE}}{\partial c}$$

Die Schrittweite ist die **Lernrate η** (0,01 · 0,1 · 0,5 · 0,8 · 1,2). Ist sie zu klein, dauert es sehr lange. Ist sie zu groß, springt die KI über das Minimum hinweg und schaukelt sich auf. Nach höchstens 3000 Lernschritten wird abgebrochen. Genau so – nur mit sehr viel mehr Parametern – lernen auch neuronale Netze.

## Bedienung

| Aktion | Wirkung |
|---|---|
| Beispiel-Leiste (Reiter 1–4) | Immobilienpreise, Förderband, Fräswerkzeug oder Fertigungslinie |
| Verfahren | ① per Hand, ② kleinste Quadrate (Formel) oder ③ Gradientenabstieg |
| **→** oder „Schritt“ | nächster Schritt der Formel bzw. nächster Lernschritt |
| **Leertaste** oder „Automatisch“ | bis zum Ende durchlaufen lassen / anhalten |
| **R** oder „Neu starten“ | wieder von vorne, gleiche Daten |
| runde Griffe ziehen | Gerade von Hand verschieben und kippen (Verfahren ①) |
| Klick ins Diagramm | Prognose für diesen x-Wert (ziehbar), **Esc** blendet sie aus |
| Maus über einem Punkt | Messwerte und Residuum dieses Punkts |

**Einstellungen:** Verfahren, Lernrate η, Tempo, Schwerpunkt $(\bar{x} \mid \bar{y})$ einblenden, Ausreißer einfügen, beste Gerade zum Vergleich. Unter dem Diagramm lassen sich die Residuen und die Fehlerquadrate einblenden. Unten rechts zeigen zwei Felder die Fehlersumme (im Vergleich bzw. je Lernschritt) und die Residuen. „Neue Messdaten“ erzeugt einen neuen Datensatz mit demselben Zusammenhang (nicht beim Skript-Beispiel), „CSV speichern“ lädt die Daten herunter (z. B. für Excel oder Python).

## Ideen für den Unterricht

- **Per Hand anpassen:** Wer kommt dem Minimum der Fehlersumme am nächsten? Die Fehlerquadrate einblenden – warum quadriert man die Residuen, statt sie einfach zu addieren?
- **Von Hand rechnen:** Skript-Beispiel mit vier Punkten auf Papier durchrechnen (Mittelwerte, Steigung, Achsenabschnitt), dann mit → vergleichen. Was kostet ein Haus mit 140 m²?
- **Steigung und Achsenabschnitt deuten:** Was bedeuten a und b beim Förderband, beim Fräser, bei der Fertigungslinie? Warum ist b beim Immobilienbeispiel nur ein rechnerischer Wert?
- **Schwerpunkt:** Einblenden und die Gerade per Hand verschieben. Warum läuft die beste Gerade immer durch diesen Punkt?
- **Ausreißer:** Ausreißer einfügen und die Formel neu rechnen lassen. Wie stark ändern sich a, b und R²? Warum wirkt ein Ausreißer bei vier Punkten so viel stärker als bei 40? Was macht man in der Praxis mit Fehlmessungen?
- **Extrapolation:** Prognose für 11 kg Beladung oder für den Werkzeugtausch bei VB = 0,30 mm. Warum ist eine Vorhersage außerhalb der Messdaten unsicher? Was könnte sich beim Fräser ab einem bestimmten Verschleiß ändern?
- **Gradientenabstieg:** Mit η = 0,01, 0,5 und 1,2 lernen lassen. Wie viele Lernschritte braucht es? Was passiert bei 1,2?
- **Formel oder KI?** Beide Verfahren liefern dieselbe Gerade. Warum nimmt man bei neuronalen Netzen trotzdem den Gradientenabstieg?
- **Residuen lesen:** Liegen die Residuen zufällig um 0 verteilt – oder ist ein Muster zu sehen? Was würde ein Muster bedeuten?
- **Energie sparen:** Wie viel Prozent des Verbrauchs einer Schicht mit 300 Teilen ist Grundlast? Wo könnte man ansetzen?
- **Weiterarbeit:** Daten als CSV speichern und in Excel (Trendlinie) oder in Python mit `sklearn.linear_model.LinearRegression` nachrechnen.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seite, bindet Schriften, p5.js und die Skripte ein |
| `style.css` | Gestaltung im Corporate Design der Schule |
| `daten.js` | alle vier Beispiele (Merkmale, Zusammenhang, Streuung, Ausreißer, Texte) und der Datengenerator |
| `regression.js` | der Algorithmus – kleinste Quadrate, Gütemaße, Gradientenabstieg – reines JavaScript, ohne p5 |
| `ui.js` | Knöpfe, Auswahllisten, Kästchen |
| `sketch.js` | Layout, Ablauf, Zeichnen, Erklärtexte |
| `assets/logo-jps.png` | Logo der Jakob-Preh-Schule |
| `libraries/p5.min.js` | p5.js (lokal, damit die Seite auch offline läuft) |

Ein weiteres Beispiel lässt sich ergänzen, indem man in `daten.js` einen Eintrag in `SZENARIEN` hinzufügt (zwei Merkmale, „wahre“ Steigung und Achsenabschnitt, Streuung, Anzahl – oder feste Daten unter `fest` –, Ausreißer, optional eine Grenzlinie, Wörter für die Texte). Es erscheint dann automatisch als weiterer Reiter in der Beispiel-Leiste. Die „wahre“ Gerade dient nur zum Erzeugen der Daten – das Verfahren kennt sie nicht, es sieht nur die Messpunkte.

## Lokal starten

Am einfachsten in VS Code mit der Erweiterung **Live Server**: Rechtsklick auf `index.html` → „Open with Live Server“.

## Technische Hinweise

- Läuft mit **p5.js 1.x** (lokal mitgeliefert) und **p5.js 2.x**. Dafür verzichtet der Code bewusst auf Funktionen, die sich zwischen den Versionen geändert haben (z. B. `preload`, `loadFont`).
- Die Schriften (Quicksand, Inter, JetBrains Mono) kommen von Google Fonts. Ohne Internet weicht die Seite automatisch auf Systemschriften aus.
- Alle Schleifen haben geschweifte Klammern: Der p5-Web-Editor baut in Schleifen eine Endlosschleifen-Sicherung ein, die bei Schleifen ohne Klammern fehlschlägt.
- Fehler in `draw()` werden abgefangen und als Hinweis angezeigt, statt das Programm einzufrieren.
- Jeder Datensatz wird mit festem Startwert erzeugt und ist deshalb bei jedem Start gleich. Erst „Neue Messdaten“ würfelt neu.
- Diese Seite war die Vorlage für die KI-Klassifikations-Seiten (Logistische Regression, kNN, Naiver Bayes, Entscheidungsbaum). Layout und Bedienung sind gleich, nur steckt hier alles in `sketch.js` statt in einer gemeinsamen `basis.js`.
