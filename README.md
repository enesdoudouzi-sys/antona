# 🌟 Lernsterne

> **KI-gestützte Mathematik-Lernapp für Grundschulkinder der 2. Klasse**  
> Von Enes Doudouzi — Intelligent Process Optimization Lab

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Gemini](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat-square)](https://web.dev/progressive-web-apps/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-181717?style=flat-square&logo=github)](https://enesdoudouzi-sys.github.io/antona/)

---

## 📱 Was ist Lernsterne?

Lernsterne ist eine **Progressive Web App** für Kinder der 2. Klasse. Kinder üben Mathematik spielerisch — mit KI-generierten Aufgaben, die sich automatisch ans Niveau anpassen. Jede richtige Antwort bringt Sterne und Belohnungen.

**Das Besondere:** Hinter der App steckt ein vollständiges FastAPI-Backend das Google Gemini nutzt, um immer neue, kindgerechte Aufgaben zu erstellen — keine Aufgabe wiederholt sich.

🌐 **Live-Demo:** https://enesdoudouzi-sys.github.io/antona/

---

## ✨ Features

| Feature | Beschreibung |
|---|---|
| 🤖 **KI-Aufgaben** | Gemini 2.0 Flash generiert individuelle Aufgaben |
| 📚 **10 Themenblöcke** | Hunderterraum, Addition, Subtraktion, Einmaleins, Division, Geld, Uhrzeit |
| 🎯 **3 Schwierigkeitsstufen** | Leicht / Mittel / Schwer |
| ⭐ **Punktesystem** | Sterne sammeln, Fortschritt verfolgen |
| 👤 **Mehrere Profile** | Eigene Profile für jedes Kind |
| 🌙 **Dark Mode** | Automatisch nach Systemeinstellung |
| 📲 **PWA** | Installierbar auf dem Handy, funktioniert offline |
| 🔒 **Kinder-sicher** | Kein Tracking, keine Werbung |

---

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    LERNSTERNE APP                        │
├──────────────────────┬──────────────────────────────────┤
│   FRONTEND (PWA)     │   BACKEND (FastAPI)               │
│                      │                                   │
│  Vanilla JS          │  POST /aufgaben/generieren        │
│  CSS Variables       │    └─ Gemini 2.0 Flash            │
│  Service Worker      │  POST /aufgaben/pruefen           │
│  localStorage        │  GET  /fortschritt/{name}         │
│                      │  GET  /health                     │
└──────────────────────┴──────────────────────────────────┘
```

---

## 🚀 Schnellstart

### Voraussetzungen

- Python 3.11+
- Google API Key ([kostenlos hier holen](https://aistudio.google.com/apikey))

### Installation

```bash
# 1. Repo klonen
git clone https://github.com/enesdoudouzi-sys/antona.git
cd antona

# 2. Virtuelle Umgebung erstellen
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3. Abhängigkeiten installieren
pip install -r requirements.txt

# 4. API Key konfigurieren
cp .env.example .env
# GOOGLE_API_KEY=dein-key-hier in .env eintragen

# 5. Backend starten
uvicorn app.main:app --reload
```

✅ API läuft auf **http://localhost:8000**  
📖 Interaktive Docs: **http://localhost:8000/docs**

---

## 📡 API Endpunkte

### `POST /aufgaben/generieren` — Neue Aufgabe erstellen

```json
// Request
{
  "thema": "einmaleins",
  "schwierigkeit": "mittel",
  "alter": 8
}

// Response
{
  "id": "3fa85f64-...",
  "thema": "einmaleins",
  "frage": "Was ist 7 × 8?",
  "richtige_antwort": "56",
  "falsche_antworten": ["54", "48", "63"],
  "hinweis": "7 × 8 ist das Gleiche wie 7 × 4 × 2",
  "punkte": 10
}
```

### `POST /aufgaben/pruefen` — Antwort prüfen

```json
// Request
{ "aufgabe_id": "uuid", "antwort": "56", "richtige_antwort": "56" }

// Response
{ "richtig": true, "punkte": 10, "erklaerung": "Super gemacht! 🌟" }
```

### `GET /fortschritt/{profil_name}` — Lernfortschritt abrufen

```json
{
  "profil": "Emma",
  "gesamt_aufgaben": 42,
  "richtig": 38,
  "gesamt_punkte": 380
}
```

---

## 📚 Themenblöcke (2. Klasse Lehrplan)

| Thema | API Parameter | Beispiel |
|---|---|---|
| Hunderterraum | `hunderterraum` | Zahlen bis 100 darstellen |
| Addition ohne Überschreitung | `addition_ohne_ueberschreitung` | 23 + 15 = ? |
| Addition mit Überschreitung | `addition_mit_ueberschreitung` | 27 + 15 = ? |
| Subtraktion ohne Überschreitung | `subtraktion_ohne_ueberschreitung` | 45 − 23 = ? |
| Subtraktion mit Überschreitung | `subtraktion_mit_ueberschreitung` | 42 − 15 = ? |
| Rechenmauer | `rechenmauer` | Fehlende Zahl in der Mauer finden |
| Einmaleins | `einmaleins` | 7 × 8 = ? |
| Division | `division` | 56 ÷ 7 = ? |
| Rechnen mit Geld | `geld` | Wechselgeld berechnen |
| Uhrzeit | `uhrzeit` | Wie viele Minuten bis 14:00? |

---

## 🗂️ Projektstruktur

```
antona/
├── app/
│   ├── main.py                  # FastAPI App + CORS
│   ├── api/
│   │   ├── aufgaben.py          # Aufgaben generieren & prüfen
│   │   └── fortschritt.py       # Punkte & Fortschritt
│   ├── models/
│   │   └── aufgabe.py           # Pydantic Datenmodelle
│   └── services/
│       └── ki_aufgaben.py       # Gemini 2.0 Flash Integration
├── index.html                   # PWA Frontend (Vanilla JS)
├── sw.js                        # Service Worker
├── manifest.webmanifest         # PWA Manifest
├── requirements.txt             # Python Abhängigkeiten
├── .env.example                 # API Key Template
└── README.md
```

---

## 🛠️ Tech Stack

**Backend**
| Technologie | Version | Verwendung |
|---|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | 0.115 | Web Framework |
| [Pydantic v2](https://docs.pydantic.dev/) | 2.10 | Datenvalidierung |
| [Google Gemini](https://ai.google.dev/) | 2.0 Flash | KI Aufgabengenerator |
| [Uvicorn](https://www.uvicorn.org/) | 0.32 | ASGI Server |

**Frontend**
| Technologie | Beschreibung |
|---|---|
| Vanilla JavaScript | Kein Framework — maximale Performance |
| CSS Custom Properties | Vollständiges Light/Dark Theme-System |
| Service Worker | Offline-Funktionalität |
| Web App Manifest | Installierbar als native App |

---

## 🔮 Roadmap

- [ ] **SQLite Datenbank** — Fortschritt dauerhaft speichern
- [ ] **Schwierigkeitsanpassung** — KI lernt das Niveau des Kindes
- [ ] **Eltern-Dashboard** — Lernfortschritt im Überblick
- [ ] **Sprachausgabe** — Aufgaben vorlesen (Text-to-Speech)
- [ ] **Cloud Deploy** — Backend auf Render.com hosten

---

## 👨‍💻 Autor

**Enes Doudouzi** · Intelligent Process Optimization Lab  
GitHub: [@enesdoudouzi-sys](https://github.com/enesdoudouzi-sys)

---

## 📄 Lizenz

MIT License — frei nutzbar für Bildungszwecke.

---

*Lernsterne – Lernen, entdecken und Sterne sammeln.* ⭐