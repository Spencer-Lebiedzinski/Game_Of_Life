import os
import json
import google.generativeai as genai
from typing import Optional
from collections import defaultdict

def _get_model():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash")

DOMAINS = ["grades", "health", "finance", "social", "wellness"]

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

    # Deep personalization from 3-question onboarding answers
    goal_details = profile.get("goal_details") or {}
    detail_lines = []
    label_maps = {
        "school": {
            0: {"assignments": "struggles with deadlines", "grades": "wants better grades",
                "time": "has time management issues", "anxiety": "has test anxiety"},
            1: {"alone": "studies alone with music", "groups": "prefers study groups",
                "silent": "needs silence to study", "scattered": "has no study method"},
            2: {"week": "plans a week ahead", "day": "plans day by day",
                "last-min": "works best last minute", "reactive": "doesn't plan"},
        },
        "fitness": {
            0: {"weight": "wants to lose weight", "strength": "wants to build strength",
                "energy": "wants more energy", "consistent": "wants to stay consistent"},
            1: {"never": "never exercises", "1-2x": "exercises 1-2x/week",
                "3-4x": "exercises 3-4x/week", "daily": "exercises daily"},
            2: {"time": "no time barrier", "motivation": "lacks motivation",
                "access": "no gym access", "knowledge": "doesn't know where to start"},
        },
        "mindset": {
            0: {"stress": "wants to reduce stress", "sleep": "wants better sleep",
                "journal": "wants to journal", "motivation": "wants to stay motivated"},
            1: {"exercise": "exercises to cope with stress", "talk": "talks through stress",
                "media": "uses media to escape stress", "nothing": "has no stress strategy"},
            2: {"rarely": "rarely overwhelmed", "sometimes": "sometimes overwhelmed",
                "often": "often overwhelmed", "always": "almost always overwhelmed"},
        },
        "social": {
            0: {"meet": "wants to meet new people", "friends": "wants to strengthen friendships",
                "phone": "wants less phone time", "goals": "wants intentional social goals"},
            1: {"active": "socially active", "small": "has small tight circle",
                "distant": "drifted from friends", "isolated": "mostly isolated"},
            2: {"anxiety": "has social anxiety", "time": "no time for socializing",
                "confidence": "lacks confidence", "location": "hard to meet people nearby"},
        },
        "finance": {
            0: {"track": "wants to track spending", "save": "wants to save more",
                "debt": "wants to get out of debt", "understand": "wants to understand finances"},
            1: {"yes-follow": "has and follows a budget", "yes-ignore": "has budget but ignores it",
                "thinking": "thinking about budgeting", "no": "no budget at all"},
            2: {"in-control": "feels in control of money", "stressed": "stressed about money",
                "avoidant": "avoids thinking about money", "clueless": "clueless about finances"},
        },
        "sleep": {
            0: {"schedule": "struggles with sleep schedule", "falling": "struggles to fall asleep",
                "hours": "doesn't get enough hours", "quality": "has poor sleep quality"},
            1: {"before-10": "goes to bed before 10pm", "10-12": "goes to bed 10pm-midnight",
                "12-2": "goes to bed midnight-2am", "after-2": "goes to bed after 2am"},
            2: {"phone": "phone disrupts sleep", "stress": "racing thoughts disrupt sleep",
                "caffeine": "caffeine/food disrupts sleep", "env": "environment disrupts sleep"},
        },
    }

    for goal, answers in goal_details.items():
        if not isinstance(answers, list):
            continue
        maps = label_maps.get(goal, {})
        for i, answer in enumerate(answers):
            if answer and i in maps and answer in maps[i]:
                detail_lines.append(f"  [{goal}] {maps[i][answer]}")

    lines = []
    if priority_domains:
        lines.append(f"Priority domains (from goals): {', '.join(priority_domains)}")
    if weak_spots:
        lines.append(f"Detected weak spots: {', '.join(weak_spots)}")
    if detail_lines:
        lines.append("Deep profile from onboarding questions:")
        lines.extend(detail_lines)
    if not lines:
        lines.append("No strong priorities detected — treat all domains equally.")

    return "\n".join(lines)


def _build_learning_context(quest_history: list[dict]) -> str:
    """
    Summarize the user's quest completion patterns so Gemini can adapt.
    High completion rate → increase difficulty/XP.
    Low completion rate → try easier quests or different framing.
    """
    if not quest_history:
        return "No quest history yet — this is the user's first time."

    domain_total: dict[str, int] = defaultdict(int)
    domain_done: dict[str, int] = defaultdict(int)
    completed_examples: list[str] = []
    skipped_examples: list[str] = []

    for session in quest_history:
        for q in session.get("quests", []):
            d = q.get("domain", "")
            domain_total[d] += 1
            if q.get("completed"):
                domain_done[d] += 1
                if len(completed_examples) < 4:
                    completed_examples.append(f'"{q["action"]}" ({d}, {q.get("difficulty","?")})')
            else:
                if len(skipped_examples) < 4:
                    skipped_examples.append(f'"{q["action"]}" ({d}, {q.get("difficulty","?")})')

    lines = ["LEARNING CONTEXT (last 14 days of quest history):"]

    # Per-domain completion rates
    lines.append("  Completion rate by domain:")
    for domain in DOMAINS:
        total = domain_total.get(domain, 0)
        done = domain_done.get(domain, 0)
        if total > 0:
            pct = int((done / total) * 100)
            flag = " ← LOW ENGAGEMENT" if pct < 40 else (" ← HIGH ENGAGEMENT" if pct >= 80 else "")
            lines.append(f"    {domain}: {done}/{total} ({pct}%){flag}")

    if completed_examples:
        lines.append(f"  Recent completions: {'; '.join(completed_examples)}")
    if skipped_examples:
        lines.append(f"  Recent skips: {'; '.join(skipped_examples)}")

    # Guidance for Gemini
    low = [d for d in DOMAINS if domain_total.get(d, 0) > 0 and domain_done.get(d, 0) / domain_total[d] < 0.4]
    high = [d for d in DOMAINS if domain_total.get(d, 0) > 0 and domain_done.get(d, 0) / domain_total[d] >= 0.8]
    if low:
        lines.append(f"  ADJUST: For {', '.join(low)} — try simpler, more specific actions and different framing.")
    if high:
        lines.append(f"  ESCALATE: For {', '.join(high)} — increase difficulty and XP; user is ready for more.")

    return "\n".join(lines)


def build_prompt(
    profile: dict,
    checkins: list[dict],
    quest_history: Optional[list[dict]] = None,
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
    learning_context = _build_learning_context(quest_history or [])

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

{learning_context}

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
- Use the LEARNING CONTEXT to adapt difficulty and framing per domain.
- Use the deep onboarding profile details to make each quest feel personal.
- For priority domains, make suggestions ambitious with higher XP.
- For weak spots, address the root cause from onboarding answers.
- Base all suggestions on the user's actual data — reference their patterns.

Return the JSON array now.
""".strip()

    return prompt


def parse_suggestions(raw: str) -> list[dict]:
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
    quest_history: Optional[list[dict]] = None,
    canvas_courses: Optional[list[dict]] = None,
) -> list[dict]:
    prompt = build_prompt(profile, checkins, quest_history, canvas_courses)
    model = _get_model()
    response = model.generate_content(prompt)
    return parse_suggestions(response.text)
