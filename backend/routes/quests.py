"""
Quest logging and completion tracking.

Every time Gemini generates suggestions, we save the session here.
When the user marks a quest complete, we update it.
This history is fed back into Gemini so it learns what resonates
with each user over time — adjusting difficulty, domain focus, and framing.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from db import get_db
from services.stats_service import award_xp

router = APIRouter()


class QuestCompleteRequest(BaseModel):
    user_id: str
    session_id: str
    quest_id: str   # uuid assigned at generation time


@router.post("/quests/complete")
async def complete_quest(req: QuestCompleteRequest):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()

    result = await db.quests_sessions.update_one(
        {
            "session_id": req.session_id,
            "user_id": req.user_id,
            "quests.id": req.quest_id,
        },
        {
            "$set": {
                "quests.$.completed": True,
                "quests.$.completed_at": now,
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quest not found.")

    # Award XP to user stats
    session = await db.quests_sessions.find_one(
        {"session_id": req.session_id},
        {"_id": 0, "quests": 1}
    )
    quest = next((q for q in session["quests"] if q["id"] == req.quest_id), None)
    xp = quest["xp"] if quest else 0
    if xp:
        await award_xp(req.user_id, xp, f"quest_{quest.get('domain', 'unknown')}")

    return {"xp_earned": xp, "quest_id": req.quest_id}


@router.get("/quests/history/{user_id}")
async def get_quest_history(user_id: str, days: int = 14):
    db = get_db()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    cursor = db.quests_sessions.find(
        {"user_id": user_id, "generated_at": {"$gte": since}},
        {"_id": 0}
    ).sort("generated_at", -1)

    sessions = await cursor.to_list(length=100)
    return {"sessions": sessions}
