from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
from db import get_db
from services.gemini_service import research_custom_goal, get_custom_goal_insight

router = APIRouter()


def default_custom_goal_progress(label: str) -> dict:
    lowered = label.lower()
    if any(keyword in lowered for keyword in ["internship", "job", "career", "resume", "interview", "offer"]):
        stages = [
            {"id": "target_definition", "title": "Define your target", "done": False},
            {"id": "resume_portfolio", "title": "Build your resume and portfolio", "done": False},
            {"id": "sourcing_roles", "title": "Find strong opportunities", "done": False},
            {"id": "applications", "title": "Apply consistently", "done": False},
            {"id": "interview_prep", "title": "Prepare for interviews", "done": False},
            {"id": "offer_decision", "title": "Close the loop", "done": False},
        ]
    else:
        stages = [
            {"id": "setup", "title": "Define the path", "done": False},
            {"id": "foundation", "title": "Build the foundation", "done": False},
            {"id": "execution", "title": "Execute consistently", "done": False},
            {"id": "finish", "title": "Finish strong", "done": False},
        ]
    return {
        "endpoint": label,
        "stage": stages[0]["id"],
        "stage_label": stages[0]["title"],
        "stage_index": 0,
        "milestones": stages,
        "action_history": [],
        "current_action": None,
        "progress_summary": f"Current stage: {stages[0]['title']}",
    }


class ResearchRequest(BaseModel):
    user_id: str
    goal_text: str


class AnswersRequest(BaseModel):
    user_id: str
    goal_id: str
    answers: List[str]


@router.post("/goals/custom/research")
async def research_goal(req: ResearchRequest):
    if not req.goal_text.strip():
        raise HTTPException(status_code=400, detail="goal_text cannot be empty")

    db = get_db()
    profile = await db.profiles.find_one({"user_id": req.user_id}, {"name": 1, "_id": 0})
    user_name = profile["name"] if profile else "A student"

    data = await research_custom_goal(req.goal_text.strip(), user_name)

    # Build a unique id from a slug of the label + timestamp millis
    slug = data["label"].lower().replace(" ", "_")[:30]
    goal_id = f"custom_{slug}_{int(datetime.now(timezone.utc).timestamp())}"

    stub = {
        "id": goal_id,
        "label": data["label"],
        "icon": data["icon"],
        "summary": data["summary"],
        "questions": data["questions"],
        "answers": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        **default_custom_goal_progress(data["label"]),
    }

    # Save the stub so it exists before answers are submitted
    await db.profiles.update_one(
        {"user_id": req.user_id},
        {"$push": {"custom_goals": stub}},
    )

    return {
        "goal_id": goal_id,
        "label": stub["label"],
        "icon": stub["icon"],
        "summary": stub["summary"],
        "questions": stub["questions"],
        "endpoint": stub["endpoint"],
        "stage": stub["stage"],
        "stage_label": stub["stage_label"],
        "stage_index": stub["stage_index"],
        "milestones": stub["milestones"],
        "action_history": stub["action_history"],
        "current_action": stub["current_action"],
        "progress_summary": stub["progress_summary"],
    }


@router.post("/goals/custom/answers")
async def save_answers(req: AnswersRequest):
    db = get_db()
    result = await db.profiles.update_one(
        {"user_id": req.user_id, "custom_goals.id": req.goal_id},
        {"$set": {"custom_goals.$.answers": req.answers}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Custom goal not found")
    return {"ok": True}


@router.get("/goals/custom/insight/{goal_id}")
async def get_insight(goal_id: str, user_id: str):
    db = get_db()
    profile = await db.profiles.find_one(
        {"user_id": user_id, "custom_goals.id": goal_id},
        {"custom_goals.$": 1, "_id": 0},
    )
    if not profile or not profile.get("custom_goals"):
        raise HTTPException(status_code=404, detail="Custom goal not found")

    goal = profile["custom_goals"][0]
    insight = await get_custom_goal_insight(goal)
    return insight
