# Lernsterne

**Lernsterne** ist eine kindgerechte, browserbasierte Lern-App für Grundschulkinder. Sie verbindet spielerisches Üben mit kurzen Lerneinheiten, motivierenden Belohnungen und einer übersichtlichen Oberfläche.

🌐 **Live-Demo:** https://enesdoudouzi-sys.github.io/antona/

## Funktionen

- **Lernprofile:** eigene Profile für mehrere Kinder
- **Lernfächer:** Mathematik, Lesen, Formen und Muster, Uhrzeit sowie weitere Wissens- und Übungsbereiche
- **Spielerisches Lernen:** abwechslungsreiche Aufgaben, Lernspiele und Quizrunden
- **Motivation:** Sterne, Münzen, Abzeichen, Tagesziele und Belohnungen
- **Individuelle Gestaltung:** Avatare, Designs und Einstellungen für die Darstellung
- **Lernübersicht:** Fortschritt und Ergebnisse innerhalb der Profile
- **Vorlesefunktion:** Unterstützung durch Sprachausgabe
- **Installierbar:** Web-App mit PWA-Unterstützung, sofern der Browser und die Bereitstellung dies unterstützen

## Nutzung

Die Anwendung kann direkt über die Live-Demo geöffnet werden. Für die lokale Nutzung genügt es, das Repository herunterzuladen und `index.html` in einem aktuellen Browser zu öffnen.

Es ist kein Build-Schritt und keine Paketinstallation erforderlich.

## Daten & Datenschutz

Die Lernprofile und Fortschrittsdaten werden lokal im Browser über `localStorage` gespeichert. Es gibt keine automatische Synchronisierung. Beim Löschen der Browserdaten oder bei einem Wechsel des Browsers können Lernstände verloren gehen.

Im Eltern-Bereich kannst du einen Sicherungscode erstellen und auf einem anderen Gerät einlesen. Der Code enthält alle Profile und ist **nicht verschlüsselt**. Beim Einlesen ersetzt er die Profile auf dem Zielgerät. Bewahre ihn sicher auf und teile ihn nur mit Personen, denen du vertraust. Erstelle vor dem Import bei Bedarf auf dem Zielgerät ebenfalls einen Sicherungscode.

## Technologie

- HTML
- CSS
- Vanilla JavaScript
- Node.js Test Runner für die Speicher- und Sicherungslogik
- Browser-APIs (unter anderem `localStorage` und Web Speech API, sofern verfügbar)
- Progressive-Web-App-Dateien für unterstützte Browser

Die Oberfläche steht in `index.html`, die Gestaltung in `styles.css`, die Lern- und Spielabläufe in `app.js` und die Speicher- sowie Sicherungsfunktionen in `storage.js`.

Hinweise zum Aufbau und zur redaktionellen Prüfung der Aufgaben stehen in [Lerninhalte pflegen](docs/LEARNING_CONTENT.md). Die aktuelle Sammlung ist noch kein offiziell geprüfter Lehrplan.

## Entwicklung

1. Repository klonen oder herunterladen.
2. `index.html` in einem Browser öffnen.
3. Prüfungen mit `node --test-reporter=spec tests/storage.test.js` ausführen.
4. Änderungen lokal in einem aktuellen Browser prüfen.
5. Änderungen über einen Pull Request in `main` übernehmen.

Die GitHub-Pages-Version wird aus dem Repository veröffentlicht.

## Projekt

- **Repository:** https://github.com/enesdoudouzi-sys/antona
- **Standardbranch:** `main`
- **Startdatei:** `index.html`

---

*Lernsterne – Lernen, entdecken und Sterne sammeln.*
