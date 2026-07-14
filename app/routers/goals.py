import uuid
from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import storage

router = APIRouter(prefix="/api/goals", tags=["goals"])

ARCHIVO = "goals.json"


class GoalIn(BaseModel):
    titulo: str
    categoria: str
    progreso: int = 0


class GoalUpdate(BaseModel):
    titulo: str | None = None
    categoria: str | None = None
    progreso: int | None = None


@router.get("")
def listar_goals():
    return storage.leer(ARCHIVO)


@router.post("")
def crear_goal(goal: GoalIn):
    goals = storage.leer(ARCHIVO)
    nuevo = {
        "id": uuid.uuid4().hex,
        "titulo": goal.titulo,
        "categoria": goal.categoria,
        "progreso": goal.progreso,
        "fecha_creacion": date.today().isoformat(),
    }
    goals.append(nuevo)
    storage.escribir(ARCHIVO, goals)
    return nuevo


@router.put("/{goal_id}")
def actualizar_goal(goal_id: str, cambios: GoalUpdate):
    goals = storage.leer(ARCHIVO)
    for g in goals:
        if g["id"] == goal_id:
            datos = cambios.model_dump(exclude_unset=True)
            g.update(datos)
            storage.escribir(ARCHIVO, goals)
            return g
    raise HTTPException(status_code=404, detail="Meta no encontrada")


@router.delete("/{goal_id}")
def eliminar_goal(goal_id: str):
    goals = storage.leer(ARCHIVO)
    restantes = [g for g in goals if g["id"] != goal_id]
    if len(restantes) == len(goals):
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    storage.escribir(ARCHIVO, restantes)
    return {"ok": True}
