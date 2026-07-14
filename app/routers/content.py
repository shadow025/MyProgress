import random
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app import storage

router = APIRouter(prefix="/api", tags=["content"])

NOTES_ARCHIVO = "notes.json"
IMAGES_ARCHIVO = "images.json"
IMAGES_DIR = Path(__file__).parent.parent / "static" / "images"

FRANJAS_VALIDAS = {"manana", "noche", ""}


class NoteIn(BaseModel):
    texto: str
    franja: str = ""


def franja_actual() -> str:
    hora = datetime.now().hour
    if 5 <= hora < 12:
        return "manana"
    if hora >= 19 or hora < 5:
        return "noche"
    return ""


def elegir_por_franja(items: list, campo_franja: str = "franja"):
    if not items:
        return None
    franja = franja_actual()
    if franja:
        candidatos = [i for i in items if i.get(campo_franja) == franja]
        if candidatos:
            return random.choice(candidatos)
    sin_franja = [i for i in items if not i.get(campo_franja)]
    if sin_franja:
        return random.choice(sin_franja)
    return random.choice(items)


# ---- Notas ----

@router.get("/notes")
def listar_notes():
    return storage.leer(NOTES_ARCHIVO)


@router.post("/notes")
def crear_note(note: NoteIn):
    if note.franja not in FRANJAS_VALIDAS:
        raise HTTPException(status_code=400, detail="Franja invalida")
    notes = storage.leer(NOTES_ARCHIVO)
    nueva = {"id": uuid.uuid4().hex, "texto": note.texto, "franja": note.franja}
    notes.append(nueva)
    storage.escribir(NOTES_ARCHIVO, notes)
    return nueva


@router.delete("/notes/{note_id}")
def eliminar_note(note_id: str):
    notes = storage.leer(NOTES_ARCHIVO)
    restantes = [n for n in notes if n["id"] != note_id]
    if len(restantes) == len(notes):
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    storage.escribir(NOTES_ARCHIVO, restantes)
    return {"ok": True}


# ---- Imagenes ----

@router.get("/images")
def listar_images():
    return storage.leer(IMAGES_ARCHIVO)


@router.post("/images")
async def subir_image(file: UploadFile = File(...), franja: str = Form("")):
    if franja not in FRANJAS_VALIDAS:
        raise HTTPException(status_code=400, detail="Franja invalida")
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    destino = IMAGES_DIR / filename
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    with open(destino, "wb") as f:
        f.write(await file.read())

    images = storage.leer(IMAGES_ARCHIVO)
    nueva = {"id": uuid.uuid4().hex, "filename": filename, "franja": franja}
    images.append(nueva)
    storage.escribir(IMAGES_ARCHIVO, images)
    return nueva


@router.delete("/images/{image_id}")
def eliminar_image(image_id: str):
    images = storage.leer(IMAGES_ARCHIVO)
    objetivo = next((i for i in images if i["id"] == image_id), None)
    if not objetivo:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    restantes = [i for i in images if i["id"] != image_id]
    storage.escribir(IMAGES_ARCHIVO, restantes)
    ruta = IMAGES_DIR / objetivo["filename"]
    if ruta.exists():
        ruta.unlink()
    return {"ok": True}


# ---- Contenido aleatorio ----

@router.get("/random")
def contenido_random():
    notes = storage.leer(NOTES_ARCHIVO)
    images = storage.leer(IMAGES_ARCHIVO)
    return {
        "nota": elegir_por_franja(notes),
        "imagen": elegir_por_franja(images),
    }
