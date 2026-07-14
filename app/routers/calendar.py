import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import storage

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

ARCHIVO = "calendar.json"
FECHA_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
COLORES_VALIDOS = {"verde", "amarillo", "rojo"}


class DiaIn(BaseModel):
    color: str
    nota: str = ""


@router.get("")
def listar_calendario():
    return storage.leer(ARCHIVO)


@router.post("/{fecha}")
def marcar_dia(fecha: str, dia: DiaIn):
    if not FECHA_RE.match(fecha):
        raise HTTPException(status_code=400, detail="Fecha invalida, usar YYYY-MM-DD")
    if dia.color not in COLORES_VALIDOS:
        raise HTTPException(status_code=400, detail="Color invalido, usar verde/amarillo/rojo")
    calendario = storage.leer(ARCHIVO)
    if not isinstance(calendario, dict):
        calendario = {}
    calendario[fecha] = {"color": dia.color, "nota": dia.nota}
    storage.escribir(ARCHIVO, calendario)
    return {fecha: calendario[fecha]}
