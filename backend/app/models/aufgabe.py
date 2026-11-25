from enum import Enum
from pydantic import BaseModel


class Thema(str, Enum):
    # Bestehende Themen
    hunderterraum = "hunderterraum"
    addition_ohne = "addition_ohne_ueberschreitung"
    addition_mit = "addition_mit_ueberschreitung"
    subtraktion_ohne = "subtraktion_ohne_ueberschreitung"
    subtraktion_mit = "subtraktion_mit_ueberschreitung"
    rechenmauer = "rechenmauer"
    einmaleins = "einmaleins"
    division = "division"
    geld = "geld"
    uhrzeit = "uhrzeit"
    # Neue Themen
    sachaufgaben = "sachaufgaben"
    geometrie = "geometrie"
    zahlenstrahl = "zahlenstrahl"
    groessen = "groessen"
    brueche = "brueche"
    muster = "muster"


class Schwierigkeit(str, Enum):
    leicht = "leicht"
    mittel = "mittel"
    schwer = "schwer"


class AufgabeAnfrage(BaseModel):
    thema: Thema
    schwierigkeit: Schwierigkeit = Schwierigkeit.mittel
    alter: int = 8


class Aufgabe(BaseModel):
    id: str
    thema: Thema
    frage: str
    richtige_antwort: str
    falsche_antworten: list[str]
    hinweis: str
    punkte: int = 10


class AntwortPruefen(BaseModel):
    aufgabe_id: str
    antwort: str
    richtige_antwort: str


class AntwortErgebnis(BaseModel):
    richtig: bool
    punkte: int
    erklaerung: str
    ermutigung: str = ""


class Profil(BaseModel):
    name: str
    avatar: str = "🦁"


class FortschrittEintrag(BaseModel):
    profil_name: str
    thema: Thema
    richtig: bool
    punkte: int
    schwierigkeit: Schwierigkeit = Schwierigkeit.mittel


class AdaptiveAnfrage(BaseModel):
    profil_name: str
    thema: Thema
    alter: int = 8
