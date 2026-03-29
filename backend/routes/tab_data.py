from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from db import get_db

router = APIRouter()


class TabDataPayload(BaseModel):
    data: dict | list


@router.get("/tab-data/{user_id}/{tab}")
async def get_tab_data(user_id: str, tab: str):
    db = get_db()
    doc = await db.tab_data.find_one(
        {"user_id": user_id, "tab": tab}, {"_id": 0, "data": 1}
    )
    if not doc:
        return {"data": None}
    return {"data": doc["data"]}


@router.put("/tab-data/{user_id}/{tab}")
async def save_tab_data(user_id: str, tab: str, payload: TabDataPayload):
    db = get_db()
    await db.tab_data.update_one(
        {"user_id": user_id, "tab": tab},
        {"$set": {"data": payload.data, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}
