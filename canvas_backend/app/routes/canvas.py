from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import RedirectResponse

from app.config import settings
from app.models.canvas_models import (
    ConnectCanvasTokenRequest,
    DisconnectCanvasRequest,
)
from app.services.canvas_client import canvas_client
from app.services.token_store import delete_token, has_token, save_token

router = APIRouter(prefix="/api/canvas", tags=["canvas"])


def resolve_user_id(x_user_id: str | None) -> str | None:
    if not x_user_id:
        return None
    return x_user_id.strip() or None


def require_user_id(x_user_id: str | None) -> str:
    user_id = resolve_user_id(x_user_id)
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header.")
    return user_id


def _safe_course_summary(course: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": course.get("id"),
        "name": course.get("name"),
        "course_code": course.get("course_code"),
        "original_name": course.get("original_name"),
        "workflow_state": course.get("workflow_state"),
        "enrollments": course.get("enrollments"),
        "term": course.get("term"),
        "total_scores": course.get("total_scores"),
    }


@router.get("/login")
def canvas_login(
    user_id: str = Query(..., description="Your app's user id"),
):
    """
    Optional OAuth login route.
    Not needed for token-paste mode, but kept for future upgrade.
    """
    login_url = canvas_client.build_oauth_login_url(user_id)
    return RedirectResponse(login_url)


@router.get("/callback")
def canvas_callback(code: str, state: str):
    """
    Optional OAuth callback route.
    Exchanges code for token and stores it in the in-memory OAuth store.
    """
    user_id = canvas_client.verify_state(state)
    token_data = canvas_client.exchange_code_for_token(code)

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Canvas did not return an access token.")

    canvas_client.store_oauth_token(user_id, access_token)

    redirect_to = settings.frontend_redirect_url or "/"
    separator = "&" if "?" in redirect_to else "?"
    return RedirectResponse(f"{redirect_to}{separator}canvas_connected=true")


@router.post("/connect-token")
def connect_canvas_token(payload: ConnectCanvasTokenRequest):
    """
    Save a user-provided Canvas token under that user's app user ID.
    Verifies the token before storing it.
    """
    user_id = payload.user_id.strip()
    token = payload.token.strip()

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required.")
    if not token:
        raise HTTPException(status_code=400, detail="token is required.")

    # Verify before saving
    profile = canvas_client.verify_token(token)

    save_token(user_id, token)

    return {
        "connected": True,
        "user_id": user_id,
        "message": "Canvas token saved and verified.",
        "canvas_user": {
            "id": profile.get("id"),
            "name": profile.get("name"),
            "short_name": profile.get("short_name"),
            "sortable_name": profile.get("sortable_name"),
            "primary_email": profile.get("primary_email"),
            "login_id": profile.get("login_id"),
        },
    }


@router.post("/disconnect-token")
def disconnect_canvas_token(payload: DisconnectCanvasRequest):
    user_id = payload.user_id.strip()

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required.")

    delete_token(user_id)

    return {
        "connected": False,
        "user_id": user_id,
        "message": "Canvas token removed.",
    }


@router.get("/status")
def canvas_status(x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    user_id = require_user_id(x_user_id)

    return {
        "user_id": user_id,
        "connected": has_token(user_id),
    }


@router.get("/courses")
def get_courses(x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    user_id = require_user_id(x_user_id)
    return canvas_client.get_courses(user_id=user_id)


@router.get("/grades")
def get_grades(x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    user_id = require_user_id(x_user_id)
    return canvas_client.get_enrollments(user_id=user_id)


@router.get("/course/{course_id}/assignments")
def get_assignments(
    course_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = require_user_id(x_user_id)
    return canvas_client.get_assignments(course_id=course_id, user_id=user_id)


@router.get("/course/{course_id}/submissions")
def get_submissions(
    course_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = require_user_id(x_user_id)
    return canvas_client.get_submissions(course_id=course_id, user_id=user_id)


@router.get("/me")
def get_canvas_profile(x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    user_id = require_user_id(x_user_id)
    return canvas_client.get("/users/self", user_id=user_id)


@router.get("/dashboard")
def get_dashboard(x_user_id: str | None = Header(default=None, alias="X-User-Id")):
    """
    Combined dashboard response for the frontend.
    Returns:
    - course summary
    - enrollment/grade summary
    - next 3 assignments per course
    - missing count per course
    """
    user_id = require_user_id(x_user_id)

    courses = canvas_client.get_courses(user_id=user_id)
    enrollments = canvas_client.get_enrollments(user_id=user_id)

    enrollments_by_course: dict[str, dict[str, Any]] = {}
    for enrollment in enrollments:
        course_id = enrollment.get("course_id")
        if course_id is not None:
            enrollments_by_course[str(course_id)] = enrollment

    dashboard_courses: list[dict[str, Any]] = []

    for course in courses:
        course_id = str(course.get("id"))
        enrollment = enrollments_by_course.get(course_id, {})

        try:
            assignments = canvas_client.get_assignments(course_id=course_id, user_id=user_id)
        except HTTPException:
            assignments = []

        try:
            submissions = canvas_client.get_submissions(course_id=course_id, user_id=user_id)
        except HTTPException:
            submissions = []

        submissions_by_assignment_id: dict[str, dict[str, Any]] = {}
        for submission in submissions:
            assignment_id = submission.get("assignment_id")
            if assignment_id is not None:
                submissions_by_assignment_id[str(assignment_id)] = submission

        enriched_assignments: list[dict[str, Any]] = []
        missing_count = 0
        late_count = 0

        for assignment in assignments:
            assignment_id = str(assignment.get("id"))
            submission = submissions_by_assignment_id.get(assignment_id)

            workflow_state = submission.get("workflow_state") if submission else None
            submitted_at = submission.get("submitted_at") if submission else None
            score = submission.get("score") if submission else None
            grade = submission.get("grade") if submission else None
            late = bool(submission.get("late")) if submission else False
            missing = workflow_state == "unsubmitted"

            if missing:
                missing_count += 1
            if late:
                late_count += 1

            enriched_assignments.append(
                {
                    "id": assignment.get("id"),
                    "name": assignment.get("name"),
                    "due_at": assignment.get("due_at"),
                    "points_possible": assignment.get("points_possible"),
                    "html_url": assignment.get("html_url"),
                    "submission_types": assignment.get("submission_types"),
                    "has_submitted_submissions": assignment.get("has_submitted_submissions"),
                    "submission": {
                        "workflow_state": workflow_state,
                        "submitted_at": submitted_at,
                        "score": score,
                        "grade": grade,
                        "late": late,
                        "missing": missing,
                    },
                }
            )

        enriched_assignments.sort(
            key=lambda a: (a["due_at"] is None, a["due_at"] or "9999-12-31T23:59:59Z")
        )

        next_assignments = enriched_assignments[:3]

        grades = enrollment.get("grades", {}) if enrollment else {}

        dashboard_courses.append(
            {
                "course": _safe_course_summary(course),
                "grade_summary": {
                    "current_grade": grades.get("current_grade"),
                    "final_grade": grades.get("final_grade"),
                    "current_score": grades.get("current_score"),
                    "final_score": grades.get("final_score"),
                    "current_points": enrollment.get("current_points"),
                },
                "counts": {
                    "assignment_count": len(assignments),
                    "submission_count": len(submissions),
                    "missing_count": missing_count,
                    "late_count": late_count,
                },
                "next_assignments": next_assignments,
            }
        )

    # Optional simple priority sort:
    # more missing work first, then more late work, then lower score first if available
    def priority_key(item: dict[str, Any]):
        counts = item["counts"]
        grade_summary = item["grade_summary"]
        current_score = grade_summary.get("current_score")
        sortable_score = current_score if isinstance(current_score, (int, float)) else 10_000
        return (-counts["missing_count"], -counts["late_count"], sortable_score)

    dashboard_courses.sort(key=priority_key)

    return {
        "user_id": user_id,
        "connected": True,
        "course_count": len(dashboard_courses),
        "courses": dashboard_courses,
    }