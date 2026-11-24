from fastapi import APIRouter, HTTPException

from app.models.aufgabe import (
    Aufgabe,
    AufgabeAnfrage,
    AntwortErgebnis,
    AntwortPruefen,
)
from app.services.ki_aufgaben import generiere_aufgabe

router = APIRouter(tags=["Aufgaben"])


@router.post("/generieren", response_model=Aufgabe)
def aufgabe_generieren(anfrage: AufgabeAnfrage):
    try:
        return generiere_aufgabe(anfrage)
    except Exception as e:
        raise HTTPException(500, f"Aufgabe konnte nicht generiert werden: {e}")


@router.post("/pruefen", response_model=AntwortErgebnis)
def antwort_pruefen(daten: AntwortPruefen):
    richtig = daten.antwort.strip().lower() == daten.richtige_antwort.strip().lower()
    return AntwortErgebnis(
        richtig=richtig,
        punkte=10 if richtig else 0,
        erklaerung="Super gemacht! 🌟" if richtig else f"Die richtige Antwort war: {daten.richtige_antwort}",
    )
