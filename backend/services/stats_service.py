"""
Core XP / level / streak logic.
Imported by both the stats route and any route that needs to award XP
(quests, checkins, etc.) without going through an HTTP round-trip.
"""
from datetime import date, timedelta
from db import get_db

# Cumulative XP required to reach each level (index = level - 1)
XP_FOR_LEVEL = [0, 300, 700, 1_200, 1_800, 2_600, 3_500, 4_600, 5_900, 7_400, 9_000]


def xp_to_level(xp: int) -> int:
    level = 1
    for i, threshold in enumerate(XP_FOR_LEVEL):
        if xp >= threshold:
            level = i + 1
    return level


def xp_for_level(xp: int) -> int:
    """XP threshold at the start of the current level."""
    level = xp_to_level(xp)
    return XP_FOR_LEVEL[level - 1]


def xp_to_next(xp: int) -> int:
    """Absolute XP threshold for the next level."""
    level = xp_to_level(xp)
    if level >= len(XP_FOR_LEVEL):
        return XP_FOR_LEVEL[-1]
    return XP_FOR_LEVEL[level]


async def get_or_create_stats(user_id: str) -> dict:
    db = get_db()
    stats = await db.user_stats.find_one({"user_id": user_id}, {"_id": 0})
    if not stats:
        stats = {
            "user_id": user_id,
            "xp": 0,
            "level": 1,
            "streak": 0,
            "last_activity_date": None,
            "badges": [],
        }
        await db.user_stats.insert_one({**stats})
    return stats


async def award_xp(user_id: str, amount: int, source: str) -> dict:
    """
    Award XP to a user, recompute level, and update streak.
    Uses atomic $inc for XP to prevent lost-update race conditions.
    Returns the updated stats snapshot.
    """
    db = get_db()
    stats = await get_or_create_stats(user_id)
    today = date.today().isoformat()
    last = stats.get("last_activity_date")
    old_level = stats.get("level", 1)

    # Streak logic (still needs a read, but streak conflicts are harmless)
    if last is None:
        new_streak = 1
    elif last == today:
        new_streak = stats["streak"]
    else:
        last_date = date.fromisoformat(last)
        today_date = date.fromisoformat(today)
        new_streak = stats["streak"] + 1 if today_date - last_date == timedelta(days=1) else 1

    # Atomic increment — prevents two concurrent awards from overwriting each other
    updated = await db.user_stats.find_one_and_update(
        {"user_id": user_id},
        {
            "$inc": {"xp": amount},
            "$set": {
                "streak": new_streak,
                "last_activity_date": today,
            },
            "$push": {
                "xp_history": {"date": today, "amount": amount, "source": source}
            },
        },
        return_document=True,
    )

    new_xp = updated["xp"]
    new_level = xp_to_level(new_xp)

    # Update level if it changed (derived from the now-correct XP)
    if new_level != updated.get("level", 1):
        await db.user_stats.update_one(
            {"user_id": user_id},
            {"$set": {"level": new_level}},
        )

    return {
        "xp": new_xp,
        "level": new_level,
        "streak": new_streak,
        "xp_to_next": xp_to_next(new_xp),
        "xp_for_level": xp_for_level(new_xp),
        "leveled_up": new_level > old_level,
    }
