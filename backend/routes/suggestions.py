from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.gemini_service import get_suggestions
from routes.onboarding import profiles
from routes.checkin import checkins

router = APIRouter()


class SuggestionRequest(BaseModel):
    user_id: str
    # Optional inline overrides — used when onboarding isn't wired to backend yet
    profile_override: Optional[dict] = None
    checkins_override: Optional[list] = None


@router.post("/suggestions")
async def generate_suggestions(req: SuggestionRequest):
    # Use inline data if provided, otherwise fall back to stored data
    profile = req.profile_override or profiles.get(req.user_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No profile found. Complete onboarding first or pass profile_override."
        )

    user_checkins = req.checkins_override or checkins.get(req.user_id, [])

    suggestions = await get_suggestions(
        profile=profile,
        checkins=user_checkins,
        canvas_courses=None,  # plug in Canvas route when teammate is ready
    )

    if not suggestions:
        raise HTTPException(status_code=500, detail="Gemini returned no valid suggestions.")

    return {"suggestions": suggestions}
