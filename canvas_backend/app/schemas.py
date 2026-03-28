from typing import Any

from pydantic import BaseModel, Field


class CourseSummary(BaseModel):
    course_id: str
    course_name: str
    current_grade: str | None = None
    current_score: float | None = None
    missing_count: int = 0
    late_count: int = 0
    priority_score: int = 0
    upcoming_assignments: list[dict[str, Any]] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    courses: list[CourseSummary]


class OAuthStatusResponse(BaseModel):
    connected: bool
    mode: str
    user_id: str


class OAuthCallbackResponse(BaseModel):
    message: str
    user_id: str
    mode: str
