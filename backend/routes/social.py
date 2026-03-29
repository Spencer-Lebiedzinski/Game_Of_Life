from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_db

router = APIRouter()


class AddFriendRequest(BaseModel):
    user_id: str
    friend_id: str


class CreateGroupRequest(BaseModel):
    owner_id: str
    name: str


class GroupInviteRequest(BaseModel):
    group_id: str
    inviter_id: str
    friend_id: str


class GroupInviteResponseRequest(BaseModel):
    group_id: str
    user_id: str
    accept: bool


async def _get_profiles_map(db, user_ids: list[str]) -> dict:
    if not user_ids:
        return {}
    cursor = db.profiles.find(
        {"user_id": {"$in": user_ids}},
        {"user_id": 1, "name": 1, "_id": 0},
    )
    return {profile["user_id"]: profile async for profile in cursor}


async def _get_stats_map(db, user_ids: list[str]) -> dict:
    if not user_ids:
        return {}
    cursor = db.user_stats.find(
        {"user_id": {"$in": user_ids}},
        {"user_id": 1, "xp": 1, "level": 1, "streak": 1, "last_activity_date": 1, "badges": 1, "_id": 0},
    )
    return {stats["user_id"]: stats async for stats in cursor}


def _build_member_rows(user_ids: list[str], profiles_map: dict, stats_map: dict) -> list[dict]:
    rows = []
    for uid in user_ids:
        profile = profiles_map.get(uid, {})
        stats = stats_map.get(uid, {})
        rows.append({
            "user_id": uid,
            "name": profile.get("name", "Unknown"),
            "xp": stats.get("xp", 0),
            "level": stats.get("level", 1),
            "streak": stats.get("streak", 0),
            "last_activity_date": stats.get("last_activity_date"),
            "badges": stats.get("badges", []),
        })
    rows.sort(key=lambda row: row["xp"], reverse=True)
    return rows


def _normalize_group_name(name: str) -> str:
    return " ".join(name.strip().lower().split())


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
    user_exists = await db.profiles.find_one({"user_id": req.user_id}, {"user_id": 1, "_id": 0})
    friend_exists = await db.profiles.find_one({"user_id": req.friend_id}, {"user_id": 1, "_id": 0})
    if not user_exists or not friend_exists:
        raise HTTPException(status_code=404, detail="User not found")

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

    friend_profiles = await _get_profiles_map(db, friend_ids)
    friend_stats = await _get_stats_map(db, friend_ids)
    friends = _build_member_rows(friend_ids, friend_profiles, friend_stats)
    return {"friends": friends}


@router.get("/social/friends-leaderboard/{user_id}")
async def friends_leaderboard(user_id: str):
    """Leaderboard filtered to friends + self."""
    db = get_db()
    profile = await db.profiles.find_one({"user_id": user_id}, {"friends": 1, "_id": 0})
    friend_ids = list(profile.get("friends", []) if profile else [])
    friend_ids.append(user_id)

    profiles_map = await _get_profiles_map(db, friend_ids)
    stats_map = await _get_stats_map(db, friend_ids)
    return {"leaderboard": _build_member_rows(friend_ids, profiles_map, stats_map)}


@router.post("/social/groups")
async def create_group(req: CreateGroupRequest):
    db = get_db()
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Group name is required")
    normalized_name = _normalize_group_name(name)

    owner = await db.profiles.find_one({"user_id": req.owner_id}, {"user_id": 1, "_id": 0})
    if not owner:
        raise HTTPException(status_code=404, detail="Owner profile not found")

    existing_group = await db.groups.find_one(
        {
            "owner_id": req.owner_id,
            "normalized_name": normalized_name,
        },
        {"_id": 0},
    )
    if existing_group:
        return {
            "ok": True,
            "group": existing_group,
            "already_exists": True,
        }

    group = {
        "group_id": uuid4().hex,
        "name": name,
        "normalized_name": normalized_name,
        "owner_id": req.owner_id,
        "member_ids": [req.owner_id],
        "pending_invite_ids": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.groups.insert_one(group)
    return {
        "ok": True,
        "group": {
            **group,
            "owner_name": owner.get("name", "Unknown"),
            "member_count": 1,
            "members": [],
            "is_owner": True,
        },
    }


@router.post("/social/groups/invite")
async def invite_to_group(req: GroupInviteRequest):
    db = get_db()
    group = await db.groups.find_one({"group_id": req.group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if req.inviter_id not in group.get("member_ids", []):
        raise HTTPException(status_code=403, detail="Only group members can send invites")
    if req.friend_id in group.get("member_ids", []):
        raise HTTPException(status_code=400, detail="User is already in the group")
    if req.friend_id in group.get("pending_invite_ids", []):
        raise HTTPException(status_code=400, detail="Invite already sent")

    inviter = await db.profiles.find_one({"user_id": req.inviter_id}, {"friends": 1, "_id": 0})
    inviter_friends = set(inviter.get("friends", []) if inviter else [])
    if req.friend_id not in inviter_friends:
        raise HTTPException(status_code=400, detail="You can only invite your friends")

    friend_exists = await db.profiles.find_one({"user_id": req.friend_id}, {"user_id": 1, "_id": 0})
    if not friend_exists:
        raise HTTPException(status_code=404, detail="Friend profile not found")

    await db.groups.update_one(
        {"group_id": req.group_id},
        {"$addToSet": {"pending_invite_ids": req.friend_id}},
    )
    return {"ok": True}


@router.get("/social/groups/invites/{user_id}")
async def get_group_invites(user_id: str):
    db = get_db()
    invites = await db.groups.find(
        {"pending_invite_ids": user_id},
        {"_id": 0},
    ).to_list(length=50)

    if not invites:
        return {"invites": []}

    owner_ids = list({group["owner_id"] for group in invites})
    owner_profiles = await _get_profiles_map(db, owner_ids)

    results = []
    for group in invites:
        owner = owner_profiles.get(group["owner_id"], {})
        results.append({
            "group_id": group["group_id"],
            "name": group["name"],
            "owner_id": group["owner_id"],
            "owner_name": owner.get("name", "Unknown"),
            "member_count": len(group.get("member_ids", [])),
            "created_at": group.get("created_at"),
        })
    return {"invites": results}


@router.post("/social/groups/invites/respond")
async def respond_to_group_invite(req: GroupInviteResponseRequest):
    db = get_db()
    group = await db.groups.find_one({"group_id": req.group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if req.user_id not in group.get("pending_invite_ids", []):
        raise HTTPException(status_code=400, detail="Invite not found")

    updates = {"$pull": {"pending_invite_ids": req.user_id}}
    if req.accept:
        updates["$addToSet"] = {"member_ids": req.user_id}

    await db.groups.update_one({"group_id": req.group_id}, updates)
    return {"ok": True}


@router.get("/social/groups/overview/{user_id}")
async def get_groups_overview(user_id: str):
    db = get_db()
    groups = await db.groups.find(
        {"member_ids": user_id},
        {"_id": 0},
    ).to_list(length=50)

    if not groups:
        return {"groups": []}

    owner_ids = list({group["owner_id"] for group in groups})
    all_member_ids = list({
        member_id
        for group in groups
        for member_id in group.get("member_ids", [])
    })

    profiles_map = await _get_profiles_map(db, all_member_ids + owner_ids)
    stats_map = await _get_stats_map(db, all_member_ids)

    result = []
    for group in groups:
        member_ids = group.get("member_ids", [])
        members = _build_member_rows(member_ids, profiles_map, stats_map)
        owner = profiles_map.get(group["owner_id"], {})
        result.append({
            "group_id": group["group_id"],
            "name": group["name"],
            "owner_id": group["owner_id"],
            "owner_name": owner.get("name", "Unknown"),
            "member_ids": member_ids,
            "pending_invite_ids": group.get("pending_invite_ids", []),
            "member_count": len(member_ids),
            "created_at": group.get("created_at"),
            "members": members,
            "is_owner": group["owner_id"] == user_id,
        })

    result.sort(
        key=lambda group: (
            0 if group["is_owner"] else 1,
            -(len(group.get("member_ids", []))),
            group["created_at"] or "",
        )
    )
    return {"groups": result}


@router.get("/social/groups/{group_id}/leaderboard")
async def get_group_leaderboard(group_id: str):
    db = get_db()
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    member_ids = group.get("member_ids", [])
    profiles_map = await _get_profiles_map(db, member_ids)
    stats_map = await _get_stats_map(db, member_ids)
    return {
        "group_id": group_id,
        "group_name": group.get("name", "Group"),
        "leaderboard": _build_member_rows(member_ids, profiles_map, stats_map),
    }
