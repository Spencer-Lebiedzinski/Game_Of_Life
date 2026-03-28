from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from app.schemas import CourseSummary, DashboardResponse
from app.services.canvas_client import canvas_client


def parse_canvas_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return None


def build_course_grade_map(enrollments: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    grade_map: dict[str, dict[str, Any]] = {}
    for enrollment in enrollments:
        course_id = str(enrollment.get('course_id'))
        grades = enrollment.get('grades') or {}
        grade_map[course_id] = {
            'current_grade': grades.get('current_grade') or grades.get('final_grade'),
            'current_score': grades.get('current_score') or grades.get('final_score'),
        }
    return grade_map


def compute_priority(grade: dict[str, Any], upcoming: list[dict[str, Any]], submissions: list[dict[str, Any]]) -> tuple[int, int, int]:
    now = datetime.now(timezone.utc)
    missing_count = 0
    late_count = 0
    priority = 0

    for submission in submissions:
        workflow_state = (submission.get('workflow_state') or '').lower()
        if workflow_state == 'unsubmitted':
            assignment = submission.get('assignment') or {}
            due_at = parse_canvas_datetime(assignment.get('due_at'))
            if due_at and due_at < now:
                missing_count += 1
                priority += 5
        if submission.get('late'):
            late_count += 1
            priority += 4

    for item in upcoming:
        due_at = parse_canvas_datetime(item.get('due_at'))
        if not due_at:
            continue
        delta = due_at - now
        if delta <= timedelta(hours=24):
            priority += 4
        elif delta <= timedelta(days=3):
            priority += 2
        elif delta <= timedelta(days=7):
            priority += 1

    score = grade.get('current_score')
    if isinstance(score, (int, float)):
        if score < 70:
            priority += 4
        elif score < 80:
            priority += 2

    return priority, missing_count, late_count


def compact_assignment(assignment: dict[str, Any], submission_by_assignment_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    assignment_id = str(assignment.get('id'))
    submission = submission_by_assignment_id.get(assignment_id, {})
    return {
        'assignment_id': assignment_id,
        'name': assignment.get('name'),
        'due_at': assignment.get('due_at'),
        'points_possible': assignment.get('points_possible'),
        'submitted': bool(submission.get('submitted_at')),
        'late': bool(submission.get('late')),
        'score': submission.get('score'),
        'workflow_state': submission.get('workflow_state'),
    }


def build_dashboard(*, user_id: str | None = None) -> DashboardResponse:
    courses = canvas_client.get_courses(user_id=user_id)
    enrollments = canvas_client.get_enrollments(user_id=user_id)
    grade_map = build_course_grade_map(enrollments)

    summaries: list[CourseSummary] = []
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=7)

    for course in courses:
        course_id = str(course.get('id'))
        course_name = course.get('name') or 'Untitled Course'

        assignments = canvas_client.get_assignments(course_id, user_id=user_id)
        submissions = canvas_client.get_submissions(course_id, user_id=user_id)

        submission_by_assignment_id = {
            str(item.get('assignment_id')): item
            for item in submissions
            if item.get('assignment_id') is not None
        }

        upcoming_assignments: list[dict[str, Any]] = []
        for assignment in assignments:
            due_at = parse_canvas_datetime(assignment.get('due_at'))
            if due_at and now <= due_at <= cutoff:
                upcoming_assignments.append(compact_assignment(assignment, submission_by_assignment_id))

        upcoming_assignments.sort(key=lambda item: item.get('due_at') or '')
        top_upcoming = upcoming_assignments[:3]

        grade = grade_map.get(course_id, {})
        priority, missing_count, late_count = compute_priority(grade, top_upcoming, submissions)

        summaries.append(
            CourseSummary(
                course_id=course_id,
                course_name=course_name,
                current_grade=grade.get('current_grade'),
                current_score=grade.get('current_score'),
                missing_count=missing_count,
                late_count=late_count,
                priority_score=priority,
                upcoming_assignments=top_upcoming,
            )
        )

    summaries.sort(key=lambda course: course.priority_score, reverse=True)
    return DashboardResponse(courses=summaries)
