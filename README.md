# 🌟 Lernsterne — KI-Lernapp für Grundschulkinder

[![Backend CI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![KI](https://img.shields.io/badge/KI-Gemini%203.5%20Flash-4285F4?logo=google)](https://ai.google.dev)
[![PWA](https://img.shields.io/badge/PWA-installierbar-5A0FC8)](https://web.dev/progressive-web-apps/)
[![Lizenz](https://img.shields.io/badge/Lizenz-MIT-22C55E)](LICENSE)

Eine KI-gestützte Lernapp für Grundschulkinder (Klasse 1–4), die Mathematikaufgaben individuell generiert — mit adaptivem Schwierigkeitsgrad, Spaced Repetition und kindgerechtem Feedback.

---

## 📸 App-Übersicht

```
┌─────────────────────────────────────────────────┐
│  🌟 Lernsterne                                  │
│                                                 │
│  Thema wählen:                                  │
│  ➕ Plus   ➖ Minus   ✖️ Einmaleins   ➗ Division  │
│  📖 Sachaufgaben   📐 Geometrie   🍕 Brüche      │
│  ⚖️ Größen   📏 Zahlenstrahl   🔢 Muster         │
│                                                 │
│  Schwierigkeit: [ Leicht ] [ Mittel ] [ Schwer ] │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Mia hat 24 Murmeln und bekommt 13 dazu.  │  │
│  │  Wie viele hat sie jetzt?                 │  │
│  │                                           │  │
│  │  [ 37 ]   [ 36 ]   [ 47 ]   [ 27 ]       │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  🌟 Fantastisch! Du bist ein Mathe-Profi!       │
└─────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Beschreibung |
|---------|-------------|
| **14 Mathematik-Themen** | Addition, Subtraktion, Einmaleins, Division, Geld, Uhrzeit, Sachaufgaben, Geometrie, Zahlenstrahl, Größen, Brüche, Muster + mehr |
| **Adaptiver Schwierigkeitsgrad** | Automatisch leichter/schwerer basierend auf den letzten 5 Ergebnissen |
| **Spaced Repetition** | Schwache Themen öfter üben — Endpoint `/aufgaben/spaced-repetition/{profil}` |
| **Kindgerechtes Feedback** | 10 verschiedene Ermutigungen statt starrem "Richtig/Falsch" |
| **PWA** | Installierbar auf Handy und Tablet |
| **Profil-System** | Mehrere Kinderprofile mit eigenem Lernfortschritt |

---

## 🏗️ Architektur

```
┌──────────────────────┐     ┌─────────────────────────────┐
│   Frontend (PWA)     │────▶│   FastAPI Backend           │
│   index.html         │     │                             │
│   GitHub Pages       │     │  POST /aufgaben/generieren  │
│                      │     │  POST /aufgaben/adaptiv     │
│   Themen-Auswahl     │     │  POST /aufgaben/pruefen     │
│   Aufgaben-View      │     │  GET  /aufgaben/spaced-rep. │
│   Ergebnis + Punkte  │     │  GET  /fortschritt/{profil} │
└──────────────────────┘     │                             │
                             │  Gemini 3.5 Flash (KI)      │
                             └─────────────────────────────┘
```

---

## 🚀 Quickstart

### Backend lokal starten

```bash
git clone https://github.com/enesdoudouzi-sys/antona
cd antona
cp .env.example .env     # GOOGLE_API_KEY eintragen
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API Docs: http://localhost:8000/docs

### Frontend öffnen

```bash
# Direkt im Browser öffnen:
open index.html

# Oder mit lokalem Server:
python3 -m http.server 3000
# → http://localhost:3000
```

---

## 📚 Themen (14 gesamt)

| Kategorie | Themen |
|-----------|--------|
| **Grundrechenarten** | Plus ohne/mit Übergang, Minus ohne/mit Übergang, Einmaleins, Division |
| **Alltagsmathematik** | Geld, Uhrzeit, Größen & Einheiten |
| **Verstehen & Denken** | Sachaufgaben, Zahlenstrahl, Hunderterraum, Rechenmauer |
| **Geometrie & Logik** | Geometrie, Brüche, Muster & Folgen |

---

## 🔌 API-Endpoints

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| `GET` | `/health` | Health-Check |
| `POST` | `/aufgaben/generieren` | Aufgabe mit festem Schwierigkeitsgrad |
| `POST` | `/aufgaben/adaptiv` | Aufgabe mit automatisch angepasstem Schwierigkeitsgrad |
| `POST` | `/aufgaben/pruefen` | Antwort prüfen + zufällige Ermutigung |
| `GET` | `/aufgaben/spaced-repetition/{profil}` | Schwächstes Thema ermitteln |
| `GET` | `/fortschritt/{profil}` | Lernfortschritt abrufen |
| `GET` | `/docs` | Swagger UI (Interaktive API-Dokumentation) |

---

## 🧠 Pädagogisches Konzept

- **Adaptiver Schwierigkeitsgrad** — ZPD nach Vygotsky: nie zu leicht, nie zu schwer
- **Spaced Repetition** — schwache Themen kommen häufiger (Ebbinghaus-Vergessenskurve)
- **Kurze Sessions** — 5–8 Min Einheiten, passend zur Aufmerksamkeitsspanne von Grundschülern
- **Ermutigendes Feedback** — 10 verschiedene positive Rückmeldungen statt "Falsch!"
- **Alltagsbezug** — Sachaufgaben verknüpfen Mathematik mit dem echten Leben

---

## ⚙️ Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `GOOGLE_API_KEY` | Google Gemini API Key (erforderlich) |

---

## 📄 Lizenz

MIT — Von Enes Doudouzi
