from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

router = APIRouter()

# In-memory store — swap with Supabase insert later
profiles: dict = {}


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
    eating_quality: int = Field(..., ge=1, le=5)        # 1=very poor, 5=excellent
    sleep_hours: float = Field(..., ge=0, le=24)
    exercise_freq: int = Field(..., ge=0, le=7)          # days per week
    stress_level: int = Field(..., ge=1, le=5)           # 1=very low, 5=very high
    spending_awareness: int = Field(..., ge=1, le=5)     # 1=no idea, 5=very aware
    screen_time_struggle: str = Field(..., pattern="^(yes|no|sometimes)$")
    social_activity: int = Field(..., ge=1, le=5)        # 1=very isolated, 5=very social
    goals: List[Goal] = Field(..., min_length=1, max_length=3)
    vaping_drinking: bool
    academic_struggle: Optional[str] = None             # free text, e.g. "math" or "time management"


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
    onboarding_complete: bool = True


@router.post("/onboarding", response_model=UserProfile, status_code=201)
def submit_onboarding(payload: OnboardingPayload):
    if payload.user_id in profiles:
        raise HTTPException(status_code=409, detail="Onboarding already completed for this user.")

    profile = UserProfile(
        user_id=payload.user_id,
        name=payload.name,
        eating_quality=payload.eating_quality,
        sleep_hours=payload.sleep_hours,
        exercise_freq=payload.exercise_freq,
        stress_level=payload.stress_level,
        spending_awareness=payload.spending_awareness,
        screen_time_struggle=payload.screen_time_struggle,
        social_activity=payload.social_activity,
        goals=[g.value for g in payload.goals],
        vaping_drinking=payload.vaping_drinking,
        academic_struggle=payload.academic_struggle,
        onboarding_complete=True,
    )

    profiles[payload.user_id] = profile.model_dump()
    return profile


@router.get("/onboarding/{user_id}", response_model=UserProfile)
def get_profile(user_id: str):
    profile = profiles.get(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile
