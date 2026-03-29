from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.daily_plan_service import complete_daily_task, generate_daily_plan

router = APIRouter()


class GeneratePlanRequest(BaseModel):
    user_id: str
    date: str | None = None


class CompletePlanTaskRequest(BaseModel):
    user_id: str
    task_id: str
    date: str | None = None


@router.get("/daily-plan/{user_id}")
async def get_daily_plan(user_id: str, date: str | None = Query(default=None)):
    return await generate_daily_plan(user_id, date)


@router.post("/daily-plan/generate")
async def regenerate_daily_plan(req: GeneratePlanRequest):
    return await generate_daily_plan(req.user_id, req.date)


@router.post("/daily-plan/complete")
async def complete_plan_task(req: CompletePlanTaskRequest):
    try:
        return await complete_daily_task(req.user_id, req.task_id, req.date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
