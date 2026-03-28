import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from db import get_db
from services.gemini_service import get_suggestions

router = APIRouter()


class SuggestionRequest(BaseModel):
    user_id: str
    profile_override: Optional[dict] = None
    checkins_override: Optional[list] = None


@router.post("/suggestions")
async def generate_suggestions(req: SuggestionRequest):
    db = get_db()

    # 1. Load profile
    profile = req.profile_override
    if not profile:
        profile = await db.profiles.find_one({"user_id": req.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No profile found. Complete onboarding first or pass profile_override."
        )

    # 2. Load recent check-ins
    if req.checkins_override is not None:
        user_checkins = req.checkins_override
    else:
        cursor = db.checkins.find(
            {"user_id": req.user_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(7)
        user_checkins = await cursor.to_list(length=7)

    # 3. Load quest history for learning context (last 14 days)
    since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    history_cursor = db.quests_sessions.find(
        {"user_id": req.user_id, "generated_at": {"$gte": since}},
        {"_id": 0}
    ).sort("generated_at", -1).limit(20)
    quest_history = await history_cursor.to_list(length=20)

    # 4. Ask Gemini
    suggestions = await get_suggestions(
        profile=profile,
        checkins=user_checkins,
        quest_history=quest_history,
        canvas_courses=None,
    )

    if not suggestions:
        raise HTTPException(status_code=500, detail="Gemini returned no valid suggestions.")

    # 5. Assign IDs and save session so we can track completions
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    quests_with_ids = [
        {**s, "id": str(uuid.uuid4()), "completed": False, "completed_at": None}
        for s in suggestions
    ]

    await db.quests_sessions.insert_one({
        "session_id": session_id,
        "user_id": req.user_id,
        "generated_at": now,
        "quests": quests_with_ids,
    })

    return {"session_id": session_id, "suggestions": quests_with_ids}
