# MyProgress

App personal para trackear metas y progreso diario. MVP local: FastAPI + JSON
planos como storage, frontend HTML/CSS/JS vanilla servido por el propio backend.

## Correr en local

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Abrir [http://localhost:8000](http://localhost:8000).

## Estructura

- `app/main.py` — entrypoint de FastAPI, monta routers y sirve el frontend estatico.
- `app/storage.py` — capa de lectura/escritura de datos (hoy JSON local en `app/data/`,
  pensada para reemplazarse mas adelante por la API de GitHub sin tocar los routers).
- `app/routers/` — endpoints de metas, calendario, notas/imagenes/contenido random y widget.
- `app/static/` — frontend (`index.html`, `style.css`, `app.js`) e imagenes subidas.

## Endpoints principales

- `GET/POST /api/goals`, `PUT/DELETE /api/goals/{id}`
- `GET /api/calendar`, `POST /api/calendar/{fecha}`
- `GET/POST/DELETE /api/notes`
- `GET/POST/DELETE /api/images`
- `GET /api/random`
- `GET /api/widget` (texto plano, pensado para un widget de Scriptable a futuro)
