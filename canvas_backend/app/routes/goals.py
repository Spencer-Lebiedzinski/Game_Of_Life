import json
import sqlite3
import uuid
from pathlib import Path

from google import genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/goals", tags=["goals"])

# ── DB setup ──────────────────────────────────────────────────────────────────
DB_PATH = Path(__file__).resolve().parent.parent.parent / "canvas_tokens.db"


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init_goals_db() -> None:
    c = _conn()
    try:
        c.execute("""
            CREATE TABLE IF NOT EXISTS custom_goals (
                goal_id   TEXT PRIMARY KEY,
                user_id   TEXT NOT NULL,
                label     TEXT NOT NULL,
                icon      TEXT NOT NULL,
                summary   TEXT NOT NULL,
                questions TEXT NOT NULL,
                answers   TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        c.commit()
    finally:
        c.close()


init_goals_db()

# ── Pydantic models ───────────────────────────────────────────────────────────

class ResearchRequest(BaseModel):
    user_id: str
    goal_text: str


class AnswersRequest(BaseModel):
    user_id: str
    goal_id: str
    label: str
    icon: str
    summary: str
    questions: list
    answers: list


# ── Prompts ───────────────────────────────────────────────────────────────────

RESEARCH_PROMPT = """
You are a goal-planning AI. A user has described a goal. Your job is to:
1. Give the goal a short label (2-4 words), an emoji icon, and a one-sentence summary.
2. Generate exactly 4 personalized clarifying questions to understand how to best help them achieve this goal.
   Each question must have exactly 4 answer options.

Respond with ONLY valid JSON in this exact structure (no markdown, no code blocks):
{{
  "label": "Short Goal Name",
  "icon": "🎯",
  "summary": "One sentence describing what this goal is about.",
  "questions": [
    {{
      "id": "q1",
      "question": "Question text here?",
      "options": [
        {{"id": "a", "icon": "🔥", "label": "Option A", "desc": "Brief description"}},
        {{"id": "b", "icon": "📅", "label": "Option B", "desc": "Brief description"}},
        {{"id": "c", "icon": "🌱", "label": "Option C", "desc": "Brief description"}},
        {{"id": "d", "icon": "💡", "label": "Option D", "desc": "Brief description"}}
      ]
    }},
    {{
      "id": "q2",
      "question": "Question text here?",
      "options": [
        {{"id": "a", "icon": "⚡", "label": "Option A", "desc": "Brief description"}},
        {{"id": "b", "icon": "🎯", "label": "Option B", "desc": "Brief description"}},
        {{"id": "c", "icon": "📊", "label": "Option C", "desc": "Brief description"}},
        {{"id": "d", "icon": "🤝", "label": "Option D", "desc": "Brief description"}}
      ]
    }},
    {{
      "id": "q3",
      "question": "Question text here?",
      "options": [
        {{"id": "a", "icon": "🏃", "label": "Option A", "desc": "Brief description"}},
        {{"id": "b", "icon": "🧠", "label": "Option B", "desc": "Brief description"}},
        {{"id": "c", "icon": "📝", "label": "Option C", "desc": "Brief description"}},
        {{"id": "d", "icon": "🌟", "label": "Option D", "desc": "Brief description"}}
      ]
    }},
    {{
      "id": "q4",
      "question": "Question text here?",
      "options": [
        {{"id": "a", "icon": "☀️", "label": "Option A", "desc": "Brief description"}},
        {{"id": "b", "icon": "🌙", "label": "Option B", "desc": "Brief description"}},
        {{"id": "c", "icon": "⏰", "label": "Option C", "desc": "Brief description"}},
        {{"id": "d", "icon": "🔄", "label": "Option D", "desc": "Brief description"}}
      ]
    }}
  ]
}}

User's goal: {goal_text}
"""

INSIGHT_PROMPT = """
You are a personal coaching AI. A user set the following goal and answered personalization questions.
Use their answers to generate highly specific, actionable advice.

Goal: {label}
Summary: {summary}

Their answers to personalization questions:
{qa_context}

Generate a personalized action plan. Respond with ONLY valid JSON (no markdown, no code blocks):
{{
  "tips": [
    "Specific tip 1 tailored to their answers",
    "Specific tip 2 tailored to their answers",
    "Specific tip 3 tailored to their answers",
    "Specific tip 4 tailored to their answers",
    "Specific tip 5 tailored to their answers"
  ],
  "tasks": [
    {{"day": "Mon", "title": "Specific action task for Monday"}},
    {{"day": "Tue", "title": "Specific action task for Tuesday"}},
    {{"day": "Wed", "title": "Specific action task for Wednesday"}},
    {{"day": "Thu", "title": "Specific action task for Thursday"}},
    {{"day": "Fri", "title": "Specific action task for Friday"}}
  ]
}}
"""

# ── Routes ────────────────────────────────────────────────────────────────────

def _gemini_client():
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    return genai.Client(api_key=settings.gemini_api_key)


def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


@router.post("/custom/research")
async def research_goal(req: ResearchRequest):
    client = _gemini_client()
    prompt = RESEARCH_PROMPT.format(goal_text=req.goal_text)
    try:
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        data = _parse_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

    goal_id = str(uuid.uuid4())
    return {
        "goal_id": goal_id,
        "label": data["label"],
        "icon": data["icon"],
        "summary": data["summary"],
        "questions": data["questions"],
    }


@router.post("/custom/answers")
async def save_answers(req: AnswersRequest):
    c = _conn()
    try:
        c.execute(
            """
            INSERT INTO custom_goals (goal_id, user_id, label, icon, summary, questions, answers)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(goal_id) DO UPDATE SET answers = excluded.answers
            """,
            (
                req.goal_id, req.user_id, req.label, req.icon, req.summary,
                json.dumps(req.questions), json.dumps(req.answers),
            ),
        )
        c.commit()
    finally:
        c.close()
    return {"ok": True, "goal_id": req.goal_id}


@router.get("/custom/insight/{goal_id}")
async def get_insight(goal_id: str, user_id: str):
    # Load stored goal
    c = _conn()
    try:
        row = c.execute(
            "SELECT * FROM custom_goals WHERE goal_id = ? AND user_id = ?",
            (goal_id, user_id),
        ).fetchone()
    finally:
        c.close()

    if not row:
        raise HTTPException(status_code=404, detail="Goal not found")

    questions = json.loads(row["questions"])
    answers = json.loads(row["answers"] or "[]")

    # Build Q&A context string
    qa_lines = []
    for i, q in enumerate(questions):
        chosen_id = answers[i] if i < len(answers) else None
        chosen_opt = next((o for o in q["options"] if o["id"] == chosen_id), None)
        if chosen_opt:
            qa_lines.append(f'- {q["question"]} → {chosen_opt["label"]}: {chosen_opt["desc"]}')
    qa_context = "\n".join(qa_lines) or "No answers provided."

    client = _gemini_client()
    prompt = INSIGHT_PROMPT.format(
        label=row["label"],
        summary=row["summary"],
        qa_context=qa_context,
    )
    try:
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        data = _parse_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

    return data
