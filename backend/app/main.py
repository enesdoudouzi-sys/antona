"""Lernsterne Backend — KI-gestützte Mathematikaufgaben für Grundschulkinder."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import aufgaben, fortschritt

app = FastAPI(
    title="Lernsterne API",
    description="KI-generierte Mathematikaufgaben für Grundschulkinder",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5500", "*"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(aufgaben.router, prefix="/aufgaben")
app.include_router(fortschritt.router, prefix="/fortschritt")


@app.get("/health")
def health():
    return {"status": "ok", "app": "Lernsterne API", "version": "1.0.0"}
