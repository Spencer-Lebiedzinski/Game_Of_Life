import os
import json
import google.generativeai as genai
from typing import Optional

def _get_model():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash")

DOMAINS = ["grades", "health", "finance", "social", "wellness"]

# Maps onboarding goal values to the domains they prioritize
GOAL_DOMAIN_MAP = {
    "better_grades":        "grades",
    "lose_weight":          "health",
    "save_money":           "finance",
    "reduce_stress":        "wellness",
    "sleep_better":         "wellness",
    "be_more_social":       "social",
    "reduce_screen_time":   "wellness",
    "stop_vaping_drinking": "health",
}


def _build_priority_context(profile: dict) -> str:
    """Derive which domains the user cares most about from their goals and weak spots."""
    goals = profile.get("goals", [])
    priority_domains = list(dict.fromkeys(
        GOAL_DOMAIN_MAP[g] for g in goals if g in GOAL_DOMAIN_MAP
    ))

    weak_spots = []
    if profile.get("eating_quality", 3) <= 2:
        weak_spots.append("health (poor eating)")
    if profile.get("sleep_hours", 7) < 6:
        weak_spots.append("wellness (low sleep)")
    if profile.get("stress_level", 3) >= 4:
        weak_spots.append("wellness (high stress)")
    if profile.get("spending_awareness", 3) <= 2:
        weak_spots.append("finance (low spending awareness)")
    if profile.get("social_activity", 3) <= 2:
        weak_spots.append("social (isolated)")
    if profile.get("exercise_freq", 3) <= 1:
        weak_spots.append("health (rarely exercises)")
    if profile.get("vaping_drinking"):
        weak_spots.append("health (vaping/drinking habit)")

    lines = []
    if priority_domains:
        lines.append(f"User's stated priority domains (from goals): {', '.join(priority_domains)}")
    if weak_spots:
        lines.append(f"Detected weak spots from onboarding: {', '.join(weak_spots)}")
    if not priority_domains and not weak_spots:
        lines.append("No strong priorities detected — treat all domains equally.")

    return "\n".join(lines)


def build_prompt(
    profile: dict,
    checkins: list[dict],
    canvas_courses: Optional[list[dict]] = None,
) -> str:
    canvas_section = ""
    if canvas_courses:
        courses_text = "\n".join(
            f"  - {c['name']}: grade {c['current_grade']}, trend {c['trend']}, "
            f"missing {c['missing_assignments']} assignments, next due {c['next_due']}"
            for c in canvas_courses
        )
        canvas_section = f"\nACADEMIC DATA (Canvas):\n{courses_text}\n"

    checkin_lines = []
    for i, c in enumerate(checkins[:7], 1):
        checkin_lines.append(
            f"  Day {i}: mood={c['mood']}/5, sleep={c['sleep_hours']}h, "
            f"studied={c['studied']} ({c['study_hours']}h), exercised={c['exercised']}, "
            f"ate_well={c['ate_well']}, screen_time={c['screen_time_hours']}h, "
            f"spent=${c['spent_money']}"
        )
    checkins_section = "\n".join(checkin_lines) if checkin_lines else "  No check-ins yet."

    priority_context = _build_priority_context(profile)

    prompt = f"""
You are a life coach AI for a college student gamified wellness app called "Game of Life".
Your job is to generate 5 personalized, actionable improvement suggestions — one per domain.

USER PROFILE:
  Name: {profile['name']}
  Goals: {', '.join(profile.get('goals', []))}
  Eating quality: {profile['eating_quality']}/5
  Avg sleep: {profile['sleep_hours']}h
  Exercise frequency: {profile['exercise_freq']}x/week
  Stress level: {profile['stress_level']}/5
  Spending awareness: {profile['spending_awareness']}/5
  Screen time struggle: {profile['screen_time_struggle']}
  Social activity: {profile['social_activity']}/5
  Vaping/drinking: {profile['vaping_drinking']}
  Academic struggle: {profile.get('academic_struggle') or 'not specified'}

PERSONALIZATION CONTEXT:
  {priority_context}
{canvas_section}
LAST 7 DAILY CHECK-INS (most recent first):
{checkins_section}

INSTRUCTIONS:
- Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
- Exactly 5 suggestions, one per domain: grades, health, finance, social, wellness.
- Each suggestion must follow this exact shape:
  {{
    "domain": "<grades|health|finance|social|wellness>",
    "action": "<specific, concrete action — max 12 words>",
    "xp": <integer between 50 and 200>,
    "difficulty": "<easy|medium|hard>",
    "reason": "<1 sentence explaining why this matters for this user>"
  }}
- For the user's priority domains, make the suggestion more ambitious and assign higher XP.
- For weak spots detected from onboarding, address the root cause directly.
- For non-priority domains, keep suggestions easy and low-friction.
- Base all suggestions on the user's actual data — reference their patterns where relevant.
- Assign higher XP to harder tasks.
- Keep actions specific and achievable today or this week.

Return the JSON array now.
""".strip()

    return prompt


def parse_suggestions(raw: str) -> list[dict]:
    """Extract and validate JSON array from Gemini response."""
    # Strip markdown code fences if present
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    suggestions = json.loads(text)

    validated = []
    for s in suggestions:
        if not all(k in s for k in ("domain", "action", "xp", "difficulty", "reason")):
            continue
        if s["domain"] not in DOMAINS:
            continue
        if s["difficulty"] not in ("easy", "medium", "hard"):
            continue
        validated.append(s)

    return validated


async def get_suggestions(
    profile: dict,
    checkins: list[dict],
    canvas_courses: Optional[list[dict]] = None,
) -> list[dict]:
    prompt = build_prompt(profile, checkins, canvas_courses)
    model = _get_model()
    response = model.generate_content(prompt)
    return parse_suggestions(response.text)
