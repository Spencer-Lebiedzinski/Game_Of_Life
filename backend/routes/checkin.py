from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

router = APIRouter()

# In-memory store — swap with Supabase insert later
# keyed by user_id, stores list of checkins (most recent first)
checkins: dict[str, list] = {}


class CheckinPayload(BaseModel):
    user_id: str
    studied: bool
    study_hours: float = Field(0.0, ge=0, le=24)
    mood: int = Field(..., ge=1, le=5)
    exercised: bool
    sleep_hours: float = Field(..., ge=0, le=24)
    ate_well: bool
    screen_time_hours: float = Field(..., ge=0, le=24)
    spent_money: float = Field(..., ge=0)
    notes: Optional[str] = None


class CheckinEntry(BaseModel):
    user_id: str
    timestamp: str
    studied: bool
    study_hours: float
    mood: int
    exercised: bool
    sleep_hours: float
    ate_well: bool
    screen_time_hours: float
    spent_money: float
    notes: Optional[str]


@router.post("/checkin", response_model=CheckinEntry, status_code=201)
def submit_checkin(payload: CheckinPayload):
    entry = CheckinEntry(
        user_id=payload.user_id,
        timestamp=datetime.utcnow().isoformat(),
        studied=payload.studied,
        study_hours=payload.study_hours,
        mood=payload.mood,
        exercised=payload.exercised,
        sleep_hours=payload.sleep_hours,
        ate_well=payload.ate_well,
        screen_time_hours=payload.screen_time_hours,
        spent_money=payload.spent_money,
        notes=payload.notes,
    )

    if payload.user_id not in checkins:
        checkins[payload.user_id] = []

    checkins[payload.user_id].insert(0, entry.model_dump())
    return entry


@router.get("/checkin/{user_id}")
def get_checkins(user_id: str, limit: int = 7):
    user_checkins = checkins.get(user_id, [])
    if not user_checkins:
        raise HTTPException(status_code=404, detail="No check-ins found for this user.")
    return user_checkins[:limit]
