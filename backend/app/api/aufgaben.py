import random
import traceback
from collections import Counter

from fastapi import APIRouter, HTTPException

from app.models.aufgabe import (
    AdaptiveAnfrage,
    Aufgabe,
    AufgabeAnfrage,
    AntwortErgebnis,
    AntwortPruefen,
    Schwierigkeit,
)
from app.services.ki_aufgaben import (
    generiere_aufgabe,
    _ERMUTIGUNG_RICHTIG,
    _ERMUTIGUNG_FALSCH,
)

router = APIRouter(tags=["Aufgaben"])

# Spaced repetition: thema → liste der letzten Ergebnisse pro Profil
_performance: dict[str, dict[str, list[bool]]] = {}


@router.post("/generieren", response_model=Aufgabe)
def aufgabe_generieren(anfrage: AufgabeAnfrage):
    try:
        return generiere_aufgabe(anfrage)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Aufgabe konnte nicht generiert werden: {e}")


@router.post("/adaptiv", response_model=Aufgabe)
def aufgabe_adaptiv(anfrage: AdaptiveAnfrage):
    """Generiert eine Aufgabe mit automatisch angepasstem Schwierigkeitsgrad
    basierend auf den letzten Ergebnissen des Profils für dieses Thema."""
    try:
        verlauf = _performance.get(anfrage.profil_name, {}).get(anfrage.thema.value, [])
        schwierigkeit = _berechne_schwierigkeit(verlauf)
        return generiere_aufgabe(AufgabeAnfrage(
            thema=anfrage.thema,
            schwierigkeit=schwierigkeit,
            alter=anfrage.alter,
        ))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Adaptive Aufgabe konnte nicht generiert werden: {e}")


@router.post("/pruefen", response_model=AntwortErgebnis)
def antwort_pruefen(daten: AntwortPruefen):
    richtig = daten.antwort.strip().lower() == daten.richtige_antwort.strip().lower()
    return AntwortErgebnis(
        richtig=richtig,
        punkte=10 if richtig else 0,
        erklaerung="Super gemacht! 🌟" if richtig else f"Die richtige Antwort war: {daten.richtige_antwort}",
        ermutigung=random.choice(_ERMUTIGUNG_RICHTIG if richtig else _ERMUTIGUNG_FALSCH),
    )


@router.get("/spaced-repetition/{profil_name}")
def naechstes_thema(profil_name: str):
    """Gibt das Thema zurück, das am meisten Übung benötigt (niedrigste Erfolgsrate)."""
    from app.models.aufgabe import Thema
    verlauf = _performance.get(profil_name, {})
    if not verlauf:
        return {"thema": Thema.addition_ohne.value, "grund": "Noch kein Verlauf — starte mit Addition"}

    schwächste = min(
        verlauf.items(),
        key=lambda kv: sum(kv[1]) / len(kv[1]) if kv[1] else 0,
    )
    thema, ergebnisse = schwächste
    rate = round(sum(ergebnisse) / len(ergebnisse) * 100) if ergebnisse else 0
    return {
        "thema": thema,
        "erfolgsrate": rate,
        "grund": f"Erfolgsrate {rate}% — mehr Übung empfohlen",
    }


@router.post("/fortschritt-intern/{profil_name}/{thema}")
def fortschritt_intern_speichern(profil_name: str, thema: str, richtig: bool):
    """Intern: speichert ein Ergebnis für Spaced Repetition (max. 10 letzte)."""
    if profil_name not in _performance:
        _performance[profil_name] = {}
    if thema not in _performance[profil_name]:
        _performance[profil_name][thema] = []
    verlauf = _performance[profil_name][thema]
    verlauf.append(richtig)
    if len(verlauf) > 10:
        verlauf.pop(0)
    return {"status": "ok"}


def _berechne_schwierigkeit(verlauf: list[bool]) -> Schwierigkeit:
    if len(verlauf) < 3:
        return Schwierigkeit.leicht
    rate = sum(verlauf[-5:]) / min(len(verlauf), 5)
    if rate >= 0.8:
        return Schwierigkeit.schwer
    if rate >= 0.5:
        return Schwierigkeit.mittel
    return Schwierigkeit.leicht
