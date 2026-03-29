from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from app.config import settings
from app.routes.canvas import router as canvas_router
from app.routes.goals import router as goals_router
from app.services.token_store import init_db

app = FastAPI(title=settings.app_name, debug=settings.app_debug)

latest_health_data = {}

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DailyStepRecord(BaseModel):
    date: str
    steps: float

class DailySleepRecord(BaseModel):
    date: str
    hours: float

class HealthSyncPayload(BaseModel):
    steps_today: float
    latest_heart_rate: float
    sleep_hours_last_night: float
    daily_steps: list[DailyStepRecord]
    daily_sleep: list[DailySleepRecord]
    synced_at: datetime

@app.post("/health/sync")
def health_sync(payload: HealthSyncPayload):
    global latest_health_data
    latest_health_data = payload.model_dump()
    print("Received health data:", latest_health_data)
    return {"ok": True, "received": latest_health_data}

@app.get("/health/summary")
def health_summary():
    return latest_health_data

app.include_router(canvas_router)
app.include_router(goals_router)