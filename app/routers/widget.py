from datetime import date

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app import storage
from app.routers.content import elegir_por_franja

router = APIRouter(prefix="/api", tags=["widget"])


@router.get("/widget", response_class=PlainTextResponse)
def widget():
    goals = storage.leer("goals.json")
    calendario = storage.leer("calendar.json")
    notes = storage.leer("notes.json")

    progreso_promedio = 0
    if goals:
        progreso_promedio = round(sum(g.get("progreso", 0) for g in goals) / len(goals))

    hoy = date.today().isoformat()
    dia_hoy = calendario.get(hoy) if isinstance(calendario, dict) else None
    estado = dia_hoy["color"] if dia_hoy else "sin marcar"

    nota = elegir_por_franja(notes)
    frase = nota["texto"] if nota else ""

    return (
        f"Progreso hoy: {progreso_promedio}%\n"
        f"Estado: {estado}\n"
        f'"{frase}"'
    )
