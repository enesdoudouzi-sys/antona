import json
import os
import uuid

from google import genai

from app.models.aufgabe import Aufgabe, AufgabeAnfrage, Thema

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    return _client


THEMA_BESCHREIBUNG = {
    Thema.hunderterraum: "Zahlen von 1 bis 100 erkennen, darstellen und vergleichen",
    Thema.addition_ohne: "Zweistellige Zahlen addieren ohne Zehnerüberschreitung (z.B. 23 + 15)",
    Thema.addition_mit: "Zweistellige Zahlen addieren mit Zehnerüberschreitung (z.B. 27 + 15)",
    Thema.subtraktion_ohne: "Zweistellige Zahlen subtrahieren ohne Zehnerüberschreitung (z.B. 45 - 23)",
    Thema.subtraktion_mit: "Zweistellige Zahlen subtrahieren mit Zehnerüberschreitung (z.B. 42 - 15)",
    Thema.rechenmauer: "Rechenmauer: untere Zahlen addieren ergeben die obere Zahl",
    Thema.einmaleins: "Einmaleins Multiplikation (Tabellen 2 bis 10)",
    Thema.division: "Division als Umkehrung der Multiplikation, auch mit Rest",
    Thema.geld: "Rechnen mit Euro und Cent (kaufen, Wechselgeld berechnen)",
    Thema.uhrzeit: "Uhrzeit ablesen und berechnen (volle Stunden, halbe Stunden, Minuten)",
}


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
- Hinweis soll helfen ohne die Lösung zu verraten"""

    client = _get_client()
    response = client.models.generate_content(
        model="models/gemini-2.0-flash",
        contents=prompt,
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    data = json.loads(text)
    return Aufgabe(
        id=str(uuid.uuid4()),
        thema=anfrage.thema,
        frage=data["frage"],
        richtige_antwort=data["richtige_antwort"],
        falsche_antworten=data["falsche_antworten"],
        hinweis=data["hinweis"],
        punkte=data.get("punkte", 10),
    )
