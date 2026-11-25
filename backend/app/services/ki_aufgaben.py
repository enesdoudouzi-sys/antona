import json
import os
import uuid

from google import genai
from google.genai import types

from app.models.aufgabe import Aufgabe, AufgabeAnfrage, Thema

MODEL = "gemini-3.5-flash"

THEMA_BESCHREIBUNG = {
    Thema.hunderterraum:    "Zahlen von 1 bis 100 erkennen, darstellen und vergleichen",
    Thema.addition_ohne:    "Zweistellige Zahlen addieren ohne Zehnerüberschreitung (z.B. 23 + 15)",
    Thema.addition_mit:     "Zweistellige Zahlen addieren mit Zehnerüberschreitung (z.B. 27 + 15)",
    Thema.subtraktion_ohne: "Zweistellige Zahlen subtrahieren ohne Zehnerüberschreitung (z.B. 45 - 23)",
    Thema.subtraktion_mit:  "Zweistellige Zahlen subtrahieren mit Zehnerüberschreitung (z.B. 42 - 15)",
    Thema.rechenmauer:      "Rechenmauer: untere Zahlen addieren ergeben die obere Zahl",
    Thema.einmaleins:       "Einmaleins Multiplikation (Tabellen 2 bis 10)",
    Thema.division:         "Division als Umkehrung der Multiplikation, auch mit Rest",
    Thema.geld:             "Rechnen mit Euro und Cent (kaufen, Wechselgeld berechnen)",
    Thema.uhrzeit:          "Uhrzeit ablesen und berechnen (volle Stunden, halbe Stunden, Minuten)",
    Thema.sachaufgaben:     "Alltagsbezogene Textaufgaben: Situation lesen, Rechenweg erkennen und lösen",
    Thema.geometrie:        "Geometrie: Formen erkennen, Fläche und Umfang von Rechteck und Quadrat berechnen",
    Thema.zahlenstrahl:     "Zahlenstrahl: Zahlen einordnen, Abstände berechnen, Vorgänger und Nachfolger",
    Thema.groessen:         "Größen und Einheiten: Länge (cm/m/km), Gewicht (g/kg), Volumen (ml/l)",
    Thema.brueche:          "Einfache Brüche verstehen: ein Halb, ein Viertel, ein Drittel; Brüche vergleichen",
    Thema.muster:           "Muster und Folgen: Zahlenfolgen fortsetzen, Regeln erkennen und beschreiben",
}

_ERMUTIGUNG_RICHTIG = [
    "Wow, super gemacht! 🌟",
    "Fantastisch! Du bist ein Mathe-Profi! 🎉",
    "Perfekt! Weiter so! ⭐",
    "Ja! Das hast du toll gelöst! 🚀",
    "Klasse! Du wirst immer besser! 💪",
]

_ERMUTIGUNG_FALSCH = [
    "Fast! Du schaffst das! Versuch es nochmal 💪",
    "Nicht schlimm — aus Fehlern lernt man am meisten! 🤔",
    "Gib nicht auf, du bist auf dem richtigen Weg! 🌈",
    "Puh, das war knifflig! Schau dir den Hinweis an 😊",
    "Nächstes Mal klappt's! Du machst Fortschritte! ⭐",
]


def generiere_aufgabe(anfrage: AufgabeAnfrage) -> Aufgabe:
    thema_text = THEMA_BESCHREIBUNG[anfrage.thema]

    prompt = f"""Du bist ein Grundschullehrer. Erstelle EINE Mathematikaufgabe für ein {anfrage.alter}-jähriges Kind.

Thema: {thema_text}
Schwierigkeit: {anfrage.schwierigkeit.value}

Antworte NUR mit diesem JSON-Format (kein Markdown, kein Text davor/danach):
{{
  "frage": "Die Aufgabenstellung als einfacher Text",
  "richtige_antwort": "Die korrekte Antwort",
  "falsche_antworten": ["Falsche Antwort 1", "Falsche Antwort 2", "Falsche Antwort 3"],
  "hinweis": "Ein kurzer freundlicher Hinweis wenn das Kind nicht weiterkommt",
  "punkte": 10
}}

Wichtig:
- Sprache: Deutsch, einfach und kindgerecht
- Falsche Antworten sollen plausibel aber eindeutig falsch sein
- Hinweis soll helfen ohne die Lösung zu verraten
- Bei Sachaufgaben: kurze, spannende Geschichte mit Alltagsbezug"""

    client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )

    data = json.loads(response.text)
    return Aufgabe(
        id=str(uuid.uuid4()),
        thema=anfrage.thema,
        frage=data["frage"],
        richtige_antwort=data["richtige_antwort"],
        falsche_antworten=data["falsche_antworten"],
        hinweis=data["hinweis"],
        punkte=data.get("punkte", 10),
    )
