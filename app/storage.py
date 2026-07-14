"""
Capa de almacenamiento. Hoy lee/escribe JSON local en app/data/.
Mas adelante se reemplazara la implementacion interna por llamadas
a la API de GitHub (usando archivos del repo como "base de datos"),
sin que los routers tengan que cambiar: solo usan leer()/escribir().
"""
import json
from pathlib import Path
from threading import Lock

DATA_DIR = Path(__file__).parent / "data"
_lock = Lock()


def leer(archivo: str):
    """Lee un archivo JSON de app/data/ y devuelve su contenido (lista o dict)."""
    path = DATA_DIR / archivo
    if not path.exists():
        return []
    with _lock:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)


def escribir(archivo: str, data) -> None:
    """Escribe data como JSON en app/data/archivo."""
    path = DATA_DIR / archivo
    with _lock:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
