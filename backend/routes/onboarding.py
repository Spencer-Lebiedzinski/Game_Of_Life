from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from db import get_db

router = APIRouter()


class Goal(str, Enum):
    better_grades = "better_grades"
    lose_weight = "lose_weight"
    save_money = "save_money"
    reduce_stress = "reduce_stress"
    sleep_better = "sleep_better"
    be_more_social = "be_more_social"
    reduce_screen_time = "reduce_screen_time"
    stop_vaping_drinking = "stop_vaping_drinking"


class OnboardingPayload(BaseModel):
    user_id: str
    name: str
    eating_quality: int = Field(..., ge=1, le=5)
    sleep_hours: float = Field(..., ge=0, le=24)
    exercise_freq: int = Field(..., ge=0, le=7)
    stress_level: int = Field(..., ge=1, le=5)
    spending_awareness: int = Field(..., ge=1, le=5)
    screen_time_struggle: str = Field(..., pattern="^(yes|no|sometimes)$")
    social_activity: int = Field(..., ge=1, le=5)
    goals: List[Goal] = Field(..., min_length=1, max_length=6)
    vaping_drinking: bool
    academic_struggle: Optional[str] = None
    # 3 answers per selected goal — powers Gemini personalization
    goal_details: Optional[dict] = None


class UserProfile(BaseModel):
    user_id: str
    name: str
    eating_quality: int
    sleep_hours: float
    exercise_freq: int
    stress_level: int
    spending_awareness: int
    screen_time_struggle: str
    social_activity: int
    goals: List[str]
    vaping_drinking: bool
    academic_struggle: Optional[str]
    goal_details: Optional[dict] = None
    onboarding_complete: bool = True


@router.post("/onboarding", response_model=UserProfile, status_code=201)
async def submit_onboarding(payload: OnboardingPayload):
    db = get_db()
    existing = await db.profiles.find_one({"user_id": payload.user_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Onboarding already completed for this user.")

    profile = {
        "user_id": payload.user_id,
        "name": payload.name,
        "eating_quality": payload.eating_quality,
        "sleep_hours": payload.sleep_hours,
        "exercise_freq": payload.exercise_freq,
        "stress_level": payload.stress_level,
        "spending_awareness": payload.spending_awareness,
        "screen_time_struggle": payload.screen_time_struggle,
        "social_activity": payload.social_activity,
        "goals": [g.value for g in payload.goals],
        "vaping_drinking": payload.vaping_drinking,
        "academic_struggle": payload.academic_struggle,
        "goal_details": payload.goal_details,
        "onboarding_complete": True,
    }

    await db.profiles.insert_one({**profile})
    return UserProfile(**profile)


@router.get("/onboarding/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    db = get_db()
    profile = await db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile


class ProfilePatch(BaseModel):
    goals: Optional[List[str]] = None
    goal_details: Optional[dict] = None
    theme: Optional[dict] = None
    name: Optional[str] = None


@router.patch("/profile/{user_id}")
async def update_profile(user_id: str, patch: ProfilePatch):
    db = get_db()
    updates = {k: v for k, v in patch.model_dump().items() if v is not None}
    if not updates:
        return {"ok": True}
    await db.profiles.update_one({"user_id": user_id}, {"$set": updates})
    return {"ok": True}
