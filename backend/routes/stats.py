from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from db import get_db
from services.stats_service import get_or_create_stats, award_xp, xp_to_next, xp_for_level

router = APIRouter()

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


@router.get("/stats/{user_id}")
async def get_stats(user_id: str):
    stats = await get_or_create_stats(user_id)
    xp = stats["xp"]
    return {**stats, "xp_to_next": xp_to_next(xp), "xp_for_level": xp_for_level(xp)}


class AwardXPRequest(BaseModel):
    user_id: str
    amount: int
    source: str


@router.post("/stats/xp")
async def give_xp(req: AwardXPRequest):
    return await award_xp(req.user_id, req.amount, req.source)


@router.get("/stats/leaderboard/all")
async def get_leaderboard():
    db = get_db()
    cursor = db.user_stats.find({}, {"_id": 0}).sort("xp", -1).limit(50)
    stats_list = await cursor.to_list(length=50)

    result = []
    for s in stats_list:
        profile = await db.profiles.find_one({"user_id": s["user_id"]}, {"name": 1, "_id": 0})
        name = profile["name"] if profile else "Anonymous"
        result.append({
            "user_id": s["user_id"],
            "name": name,
            "xp": s["xp"],
            "level": s["level"],
            "streak": s["streak"],
            "badges": s.get("badges", []),
        })

    return {"leaderboard": result}


@router.get("/stats/charts/{user_id}")
async def get_chart_data(user_id: str):
    """
    Last 7 check-ins reformatted for the three analytics charts:
    productivity (study), fitness (exercised), sleep (sleep_hours).
    """
    db = get_db()
    cursor = db.checkins.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).limit(7)
    checkins = list(reversed(await cursor.to_list(length=7)))

    if not checkins:
        return {
            "productivity": [{"day": d, "value": 0} for d in DAYS],
            "fitness":      [{"day": d, "value": 0} for d in DAYS],
            "sleep":        [{"day": d, "value": 0} for d in DAYS],
            "has_data": False,
        }

    productivity, fitness, sleep_data = [], [], []

    for c in checkins:
        try:
            ts = c["timestamp"].replace("Z", "+00:00")
            day_label = DAYS[datetime.fromisoformat(ts).weekday()]
        except Exception:
            day_label = "?"

        prod = min(100, int((c.get("study_hours", 0) / 4) * 100))
        if c.get("studied") and prod < 40:
            prod = 40

        productivity.append({"day": day_label, "value": prod})
        fitness.append({"day": day_label, "value": 100 if c.get("exercised") else 0})
        sleep_data.append({"day": day_label, "value": c.get("sleep_hours", 0)})

    return {
        "productivity": productivity,
        "fitness": fitness,
        "sleep": sleep_data,
        "has_data": True,
    }
