from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_db

router = APIRouter()


class AddFriendRequest(BaseModel):
    user_id: str
    friend_id: str


@router.get("/social/search")
async def search_users(q: str, user_id: str):
    """Search users by name. Excludes self and already-added friends."""
    if not q.strip():
        return {"results": []}

    db = get_db()
    profile = await db.profiles.find_one({"user_id": user_id}, {"friends": 1, "_id": 0})
    existing_friends = set(profile.get("friends", []) if profile else [])
    existing_friends.add(user_id)  # exclude self

    cursor = db.profiles.find(
        {"name": {"$regex": q.strip(), "$options": "i"}},
        {"user_id": 1, "name": 1, "_id": 0},
    ).limit(10)
    all_results = await cursor.to_list(length=10)

    results = [r for r in all_results if r["user_id"] not in existing_friends]
    return {"results": results}


@router.post("/social/friends/add")
async def add_friend(req: AddFriendRequest):
    """Add a friend bidirectionally."""
    if req.user_id == req.friend_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    db = get_db()
    # Add friend_id to user's friends list (and vice versa), avoiding duplicates
    await db.profiles.update_one(
        {"user_id": req.user_id},
        {"$addToSet": {"friends": req.friend_id}},
    )
    await db.profiles.update_one(
        {"user_id": req.friend_id},
        {"$addToSet": {"friends": req.user_id}},
    )
    return {"ok": True}


@router.delete("/social/friends/remove")
async def remove_friend(user_id: str, friend_id: str):
    """Remove a friend bidirectionally."""
    db = get_db()
    await db.profiles.update_one(
        {"user_id": user_id},
        {"$pull": {"friends": friend_id}},
    )
    await db.profiles.update_one(
        {"user_id": friend_id},
        {"$pull": {"friends": user_id}},
    )
    return {"ok": True}


@router.get("/social/friends/{user_id}")
async def get_friends(user_id: str):
    """Return friends list with their stats."""
    db = get_db()
    profile = await db.profiles.find_one({"user_id": user_id}, {"friends": 1, "_id": 0})
    if not profile or not profile.get("friends"):
        return {"friends": []}

    friend_ids = profile["friends"]

    # Fetch all friend profiles + stats in parallel-ish
    profiles_cursor = db.profiles.find(
        {"user_id": {"$in": friend_ids}},
        {"user_id": 1, "name": 1, "_id": 0},
    )
    friend_profiles = {p["user_id"]: p async for p in profiles_cursor}

    stats_cursor = db.user_stats.find(
        {"user_id": {"$in": friend_ids}},
        {"user_id": 1, "xp": 1, "level": 1, "streak": 1, "last_activity_date": 1, "badges": 1, "_id": 0},
    )
    friend_stats = {s["user_id"]: s async for s in stats_cursor}

    friends = []
    for fid in friend_ids:
        p = friend_profiles.get(fid, {})
        s = friend_stats.get(fid, {})
        friends.append({
            "user_id": fid,
            "name": p.get("name", "Unknown"),
            "xp": s.get("xp", 0),
            "level": s.get("level", 1),
            "streak": s.get("streak", 0),
            "last_activity_date": s.get("last_activity_date"),
            "badges": s.get("badges", []),
        })

    # Sort by XP descending
    friends.sort(key=lambda f: f["xp"], reverse=True)
    return {"friends": friends}


@router.get("/social/friends-leaderboard/{user_id}")
async def friends_leaderboard(user_id: str):
    """Leaderboard filtered to friends + self."""
    db = get_db()
    profile = await db.profiles.find_one({"user_id": user_id}, {"friends": 1, "_id": 0})
    friend_ids = list(profile.get("friends", []) if profile else [])
    friend_ids.append(user_id)

    stats_cursor = db.user_stats.find(
        {"user_id": {"$in": friend_ids}},
        {"_id": 0},
    ).sort("xp", -1)
    stats_list = await stats_cursor.to_list(length=50)

    result = []
    for s in stats_list:
        p = await db.profiles.find_one({"user_id": s["user_id"]}, {"name": 1, "_id": 0})
        result.append({
            "user_id": s["user_id"],
            "name": p["name"] if p else "Unknown",
            "xp": s["xp"],
            "level": s["level"],
            "streak": s["streak"],
            "badges": s.get("badges", []),
        })

    return {"leaderboard": result}
