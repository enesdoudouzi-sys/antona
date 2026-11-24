from fastapi import APIRouter

from app.models.aufgabe import FortschrittEintrag

router = APIRouter(tags=["Fortschritt"])

_fortschritt: list[FortschrittEintrag] = []


@router.post("/")
def fortschritt_speichern(eintrag: FortschrittEintrag):
    _fortschritt.append(eintrag)
    return {"status": "gespeichert"}


@router.get("/{profil_name}")
def fortschritt_laden(profil_name: str):
    eintraege = [e for e in _fortschritt if e.profil_name == profil_name]
    gesamt_punkte = sum(e.punkte for e in eintraege)
    richtig = sum(1 for e in eintraege if e.richtig)
    return {
        "profil": profil_name,
        "gesamt_aufgaben": len(eintraege),
        "richtig": richtig,
        "gesamt_punkte": gesamt_punkte,
        "eintraege": eintraege,
    }
