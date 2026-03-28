from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from db import get_db

router = APIRouter()


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
async def submit_checkin(payload: CheckinPayload):
    db = get_db()
    entry = {
        "user_id": payload.user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "studied": payload.studied,
        "study_hours": payload.study_hours,
        "mood": payload.mood,
        "exercised": payload.exercised,
        "sleep_hours": payload.sleep_hours,
        "ate_well": payload.ate_well,
        "screen_time_hours": payload.screen_time_hours,
        "spent_money": payload.spent_money,
        "notes": payload.notes,
    }
    await db.checkins.insert_one({**entry})
    return CheckinEntry(**entry)


@router.get("/checkin/{user_id}")
async def get_checkins(user_id: str, limit: int = 7):
    db = get_db()
    cursor = db.checkins.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit)

    results = await cursor.to_list(length=limit)
    if not results:
        raise HTTPException(status_code=404, detail="No check-ins found for this user.")
    return results
