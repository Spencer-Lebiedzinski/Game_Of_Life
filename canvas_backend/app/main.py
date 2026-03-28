from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.canvas import router as canvas_router
from app.services.token_store import init_db

app = FastAPI(title=settings.app_name, debug=settings.app_debug)

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def healthcheck():
    return {"ok": True, "app": settings.app_name}

app.include_router(canvas_router)