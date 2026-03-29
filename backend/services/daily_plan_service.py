from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from db import get_db
from services.stats_service import award_xp, get_or_create_stats


BACKEND_GOAL_TO_DOMAIN = {
    "better_grades": "school",
    "lose_weight": "fitness",
    "reduce_stress": "mindset",
    "save_money": "finance",
    "sleep_better": "sleep",
    "be_more_social": "social",
}

DOMAIN_PRIORITY = {
    "canvas": 10,
    "school": 20,
    "custom_goal": 30,
    "fitness": 40,
    "finance": 50,
    "sleep": 60,
    "mindset": 70,
}

FITNESS_WORKOUTS = {
    "strength": {
        "title": "Complete your strength workout",
        "description": "Push, pull, and legs with focused compound movements.",
        "exercises": ["Push-ups 3x12", "Squats 3x15", "Rows 3x10", "Plank 3x45s"],
    },
    "weight": {
        "title": "Complete your fat-loss workout",
        "description": "Short conditioning and strength work to keep momentum high.",
        "exercises": ["Jumping jacks 3x45s", "Bodyweight squats 3x20", "Lunges 3x12", "Walk 15 min"],
    },
    "energy": {
        "title": "Do your energy reset workout",
        "description": "Light movement to wake up your body and improve energy.",
        "exercises": ["Stretch 5 min", "Brisk walk 15 min", "Bodyweight circuit 10 min"],
    },
    "consistent": {
        "title": "Keep your workout streak alive",
        "description": "A simple session that is easy to complete even on a busy day.",
        "exercises": ["Push-ups 10", "Squats 15", "Lunges 10", "Walk 10 min"],
    },
}

MINDSET_PROMPTS = {
    "stress": [
        "What drained you most today, and what can you reduce tomorrow?",
        "What would your calmest self tell you right now?",
        "What can you let go of tonight?",
    ],
    "sleep": [
        "What will help you sleep better tonight?",
        "What affected your energy today most?",
        "What can you remove from your evening routine?",
    ],
    "journal": [
        "What moment from today is worth remembering?",
        "What did you learn about yourself this week?",
        "What chapter title would you give today?",
    ],
    "motivation": [
        "What small win did you earn today?",
        "What one action would make tomorrow feel better?",
        "What are you avoiding that matters most?",
    ],
}

DEFAULT_MINDSET_PROMPTS = [
    "What went well today?",
    "What would you do differently next time?",
    "What are you grateful for right now?",
]

INTERNSHIP_STAGES = [
    ("target_definition", "Define your target"),
    ("resume_portfolio", "Build your resume and portfolio"),
    ("sourcing_roles", "Find strong opportunities"),
    ("applications", "Apply consistently"),
    ("interview_prep", "Prepare for interviews"),
    ("offer_decision", "Close the loop"),
]

GENERIC_STAGES = [
    ("setup", "Define the path"),
    ("foundation", "Build the foundation"),
    ("execution", "Execute consistently"),
    ("finish", "Finish strong"),
]


def today_iso() -> str:
    return date.today().isoformat()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def date_label(date_str: str) -> str:
    try:
        parsed = datetime.fromisoformat(date_str)
    except ValueError:
        parsed = datetime.now()
    return f"{parsed.strftime('%a, %b')} {parsed.day}"


def domain_category(domain: str) -> str:
    mapping = {
        "canvas": "school",
        "school": "school",
        "fitness": "fitness",
        "finance": "finance",
        "sleep": "health",
        "mindset": "mindset",
        "custom_goal": "school",
    }
    return mapping.get(domain, "school")


def normalize_school_data(data: Any) -> dict:
    if isinstance(data, list):
        return {"assignments": data}
    if isinstance(data, dict):
        return {
            "assignments": data.get("assignments", []),
            "progress": data.get("progress", {}),
        }
    return {"assignments": [], "progress": {}}


def normalize_fitness_data(data: Any) -> dict:
    if isinstance(data, list):
        return {
            "workouts": data,
            "planned_workouts": [],
            "progress": {"completed_this_week": 0, "difficulty_level": 1, "consistency_streak": 0},
        }
    if isinstance(data, dict):
        return {
            "workouts": data.get("workouts", []),
            "planned_workouts": data.get("planned_workouts", []),
            "progress": data.get("progress", {"completed_this_week": 0, "difficulty_level": 1, "consistency_streak": 0}),
        }
    return {"workouts": [], "planned_workouts": [], "progress": {"completed_this_week": 0, "difficulty_level": 1, "consistency_streak": 0}}


def normalize_finance_data(data: Any) -> dict:
    if isinstance(data, list):
        return {
            "expenses": data,
            "actions": [],
            "progress": {"review_streak": 0, "last_action_date": None},
        }
    if isinstance(data, dict):
        return {
            "expenses": data.get("expenses", []),
            "actions": data.get("actions", []),
            "progress": data.get("progress", {"review_streak": 0, "last_action_date": None}),
        }
    return {"expenses": [], "actions": [], "progress": {"review_streak": 0, "last_action_date": None}}


def normalize_sleep_data(data: Any) -> dict:
    if isinstance(data, list):
        return {
            "entries": data,
            "actions": [],
            "progress": {"logging_streak": 0, "last_log_date": None, "target_hours": 8},
        }
    if isinstance(data, dict):
        return {
            "entries": data.get("entries", []),
            "actions": data.get("actions", []),
            "progress": data.get("progress", {"logging_streak": 0, "last_log_date": None, "target_hours": 8}),
        }
    return {"entries": [], "actions": [], "progress": {"logging_streak": 0, "last_log_date": None, "target_hours": 8}}


def normalize_mindset_data(data: Any) -> dict:
    if isinstance(data, dict):
        return {
            "reflection": data.get("reflection", ""),
            "gratitude": data.get("gratitude", ["", "", ""]),
            "intention": data.get("intention", ""),
            "prompts": data.get("prompts", []),
            "progress": data.get("progress", {"prompt_streak": 0, "last_prompt_date": None}),
        }
    return {
        "reflection": "",
        "gratitude": ["", "", ""],
        "intention": "",
        "prompts": [],
        "progress": {"prompt_streak": 0, "last_prompt_date": None},
    }


def normalize_canvas_data(data: Any) -> dict:
    if isinstance(data, dict):
        return {
            "courses": data.get("courses", []),
            "local_completion_map": data.get("local_completion_map", {}),
            "last_synced_at": data.get("last_synced_at"),
        }
    return {"courses": [], "local_completion_map": {}, "last_synced_at": None}


async def load_tab_data(user_id: str, tab: str) -> Any:
    db = get_db()
    doc = await db.tab_data.find_one({"user_id": user_id, "tab": tab}, {"_id": 0, "data": 1})
    return doc.get("data") if doc else None


async def save_tab_data(user_id: str, tab: str, data: Any) -> None:
    db = get_db()
    await db.tab_data.update_one(
        {"user_id": user_id, "tab": tab},
        {"$set": {"data": data, "updated_at": now_iso()}},
        upsert=True,
    )


def custom_goal_stages(label: str) -> list[tuple[str, str]]:
    lowered = label.lower()
    if any(keyword in lowered for keyword in ["internship", "job", "career", "resume", "offer", "interview"]):
        return INTERNSHIP_STAGES
    return GENERIC_STAGES


def build_custom_goal_action(label: str, stage_id: str, stage_title: str, action_number: int = 1) -> dict:
    lowered = label.lower()
    if stage_id == "target_definition":
        return {
            "id": make_id("goal_action"),
            "title": f"Define your target for {label}",
            "description": "Write down the exact role, company type, or outcome you are aiming for.",
            "stage_id": stage_id,
            "sequence": action_number,
            "completed": False,
            "created_at": now_iso(),
        }
    if stage_id == "resume_portfolio":
        return {
            "id": make_id("goal_action"),
            "title": f"Improve one resume or portfolio item for {label}",
            "description": "Make one concrete asset stronger so you can move toward applications.",
            "stage_id": stage_id,
            "sequence": action_number,
            "completed": False,
            "created_at": now_iso(),
        }
    if stage_id == "sourcing_roles":
        return {
            "id": make_id("goal_action"),
            "title": f"Find one strong lead for {label}",
            "description": "Add one quality opportunity or contact to your pipeline today.",
            "stage_id": stage_id,
            "sequence": action_number,
            "completed": False,
            "created_at": now_iso(),
        }
    if stage_id == "applications":
        return {
            "id": make_id("goal_action"),
            "title": f"Submit one application for {label}",
            "description": "Move from preparation to execution with one real application.",
            "stage_id": stage_id,
            "sequence": action_number,
            "completed": False,
            "created_at": now_iso(),
        }
    if stage_id == "interview_prep":
        return {
            "id": make_id("goal_action"),
            "title": f"Practice one interview question for {label}",
            "description": "Turn your preparation into interview-ready answers.",
            "stage_id": stage_id,
            "sequence": action_number,
            "completed": False,
            "created_at": now_iso(),
        }
    if stage_id == "offer_decision":
        return {
            "id": make_id("goal_action"),
            "title": f"Close the loop on {label}",
            "description": "Review open conversations, follow up, or make a decision on your best next step.",
            "stage_id": stage_id,
            "sequence": action_number,
            "completed": False,
            "created_at": now_iso(),
        }
    if "learn" in lowered or "study" in lowered:
        title = f"Practice one concrete step for {label}"
        description = "Do one focused session that pushes the skill slightly further."
    else:
        title = f"Advance {label}"
        description = f"Complete one action in the current stage: {stage_title}."
    return {
        "id": make_id("goal_action"),
        "title": title,
        "description": description,
        "stage_id": stage_id,
        "sequence": action_number,
        "completed": False,
        "created_at": now_iso(),
    }


def ensure_custom_goal_progress(goal: dict) -> tuple[dict, bool]:
    changed = False
    updated = deepcopy(goal)
    stages = custom_goal_stages(updated.get("label", "Goal"))
    milestone_map = {item["id"]: item for item in updated.get("milestones", []) if isinstance(item, dict) and item.get("id")}
    milestones = []
    for stage_id, title in stages:
        existing = milestone_map.get(stage_id)
        if existing:
            milestones.append(existing)
        else:
            milestones.append({"id": stage_id, "title": title, "done": False})
            changed = True

    stage_index = updated.get("stage_index", 0)
    if not isinstance(stage_index, int) or stage_index < 0 or stage_index >= len(stages):
        stage_index = 0
        changed = True

    stage_id, stage_title = stages[stage_index]
    current_action = updated.get("current_action")
    if not isinstance(current_action, dict) or current_action.get("completed") is True:
        current_action = build_custom_goal_action(updated.get("label", "Goal"), stage_id, stage_title)
        changed = True

    if updated.get("endpoint") != updated.get("label"):
        updated["endpoint"] = updated.get("endpoint") or updated.get("label")
        changed = True

    if updated.get("stage") != stage_id:
        updated["stage"] = stage_id
        changed = True

    if updated.get("stage_label") != stage_title:
        updated["stage_label"] = stage_title
        changed = True

    if updated.get("milestones") != milestones:
        updated["milestones"] = milestones
        changed = True

    if updated.get("action_history") is None:
        updated["action_history"] = []
        changed = True

    if updated.get("current_action") != current_action:
        updated["current_action"] = current_action
        changed = True

    if updated.get("progress_summary") is None:
        updated["progress_summary"] = f"Current stage: {stage_title}"
        changed = True

    updated["stage_index"] = stage_index
    return updated, changed


async def load_profile_with_progress(user_id: str) -> dict | None:
    db = get_db()
    profile = await db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        return None

    changed = False
    custom_goals = []
    for goal in profile.get("custom_goals", []):
        ensured, goal_changed = ensure_custom_goal_progress(goal)
        custom_goals.append(ensured)
        changed = changed or goal_changed

    if changed:
        profile["custom_goals"] = custom_goals
        await db.profiles.update_one({"user_id": user_id}, {"$set": {"custom_goals": custom_goals}})
    else:
        profile["custom_goals"] = custom_goals
    return profile


def resolve_active_domains(profile: dict) -> list[dict]:
    active = []
    active_domains = []
    for goal in profile.get("goals", []):
        domain = BACKEND_GOAL_TO_DOMAIN.get(goal, goal)
        if domain == "social":
            continue
        active_domains.append(domain)
        active.append({"kind": "builtin", "domain": domain})

    for goal in profile.get("custom_goals", []):
        active.append({"kind": "custom_goal", "domain": "custom_goal", "goal_id": goal.get("id")})

    if "school" in active_domains:
        active.append({"kind": "builtin", "domain": "canvas"})
    return active


def canvas_assignment_key(course_id: Any, assignment_id: Any) -> str:
    return f"{course_id}:{assignment_id}"


def parse_due_timestamp(value: Any) -> float:
    if not value:
        return float("inf")
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
    except ValueError:
        return float("inf")


def build_task(task_id: str, domain: str, source_tab: str, source_record_id: str, source_record_type: str,
               title: str, description: str, xp: int = 50, carry_forward: bool = False) -> dict:
    return {
        "task_id": task_id,
        "id": task_id,
        "domain": domain,
        "source_tab": source_tab,
        "source_record_id": source_record_id,
        "source_record_type": source_record_type,
        "title": title,
        "description": description,
        "completed": False,
        "done": False,
        "completed_at": None,
        "xp": xp,
        "carry_forward": carry_forward,
        "priority": DOMAIN_PRIORITY.get(domain, 100),
        "progress_mode": source_record_type,
        "category": domain_category(domain),
        "time": "",
    }


def clone_carried_task(task: dict) -> dict:
    carried = deepcopy(task)
    carried["task_id"] = make_id("plan_task")
    carried["id"] = carried["task_id"]
    carried["carry_forward"] = True
    carried["completed"] = False
    carried["done"] = False
    carried["completed_at"] = None
    return carried


async def build_canvas_task(user_id: str, date_str: str) -> tuple[dict | None, dict | None]:
    raw = await load_tab_data(user_id, "canvas")
    canvas = normalize_canvas_data(raw)
    completions = canvas.get("local_completion_map", {})
    candidates = []
    for item in canvas.get("courses", []):
        course = item.get("course", {})
        for assignment in item.get("next_assignments", []):
            key = canvas_assignment_key(course.get("id"), assignment.get("id"))
            if completions.get(key, {}).get("completed"):
                continue
            candidates.append({
                "course_id": course.get("id"),
                "course_name": course.get("name") or "Canvas class",
                "assignment": assignment,
                "missing": bool(assignment.get("submission", {}).get("missing")),
            })

    if not candidates:
        return None, None

    candidates.sort(key=lambda item: (0 if item["missing"] else 1, parse_due_timestamp(item["assignment"].get("due_at"))))
    winner = candidates[0]
    assignment = winner["assignment"]
    record_id = canvas_assignment_key(winner["course_id"], assignment.get("id"))
    task = build_task(
        make_id("plan_task"),
        "canvas",
        "dashboard",
        record_id,
        "canvas_assignment",
        f"Submit {assignment.get('name') or 'your Canvas assignment'}",
        f"{winner['course_name']} due soon. Complete it and keep your classes moving forward.",
        xp=75,
    )
    return task, canvas


async def build_school_task(user_id: str, date_str: str) -> tuple[dict | None, dict]:
    raw = await load_tab_data(user_id, "school")
    school = normalize_school_data(raw)
    assignments = school["assignments"]
    pending = [item for item in assignments if not item.get("done")]
    priority_order = {"high": 0, "medium": 1, "low": 2}
    pending.sort(key=lambda item: (priority_order.get(item.get("priority", "medium"), 1), str(item.get("due", ""))))
    if pending:
        assignment = pending[0]
    else:
        assignment = {
            "id": make_id("school_assignment"),
            "title": "Complete a focused study block",
            "due": date_label(date_str),
            "progress": 0,
            "done": False,
            "priority": "medium",
            "from_today_plan": True,
            "created_at": now_iso(),
        }
        school["assignments"] = [assignment, *assignments]

    task = build_task(
        make_id("plan_task"),
        "school",
        "school",
        str(assignment["id"]),
        "assignment",
        f"Finish {assignment['title']}",
        f"School progress improves when your real assignments get completed, not just planned.",
        xp=60,
    )
    return task, school


async def build_fitness_task(user_id: str, date_str: str, profile: dict) -> tuple[dict, dict]:
    raw = await load_tab_data(user_id, "fitness")
    fitness = normalize_fitness_data(raw)
    existing = next((item for item in fitness["planned_workouts"] if item.get("date") == date_str and not item.get("done")), None)
    if not existing:
        goal_details = (profile.get("goal_details") or {}).get("fitness") or []
        goal = goal_details[0] if len(goal_details) > 0 else "consistent"
        workout_template = FITNESS_WORKOUTS.get(goal, FITNESS_WORKOUTS["consistent"])
        existing = {
            "id": make_id("workout"),
            "date": date_str,
            "title": workout_template["title"],
            "name": workout_template["title"],
            "description": workout_template["description"],
            "focus": goal,
            "type": "Strength" if goal == "strength" else "Cardio",
            "duration": "20 min",
            "exercises": workout_template["exercises"],
            "done": False,
            "from_today_plan": True,
            "created_at": now_iso(),
        }
        fitness["planned_workouts"].insert(0, existing)
        if not any(str(item.get("id")) == str(existing["id"]) for item in fitness["workouts"]):
            fitness["workouts"].insert(0, existing.copy())

    task = build_task(
        make_id("plan_task"),
        "fitness",
        "fitness",
        str(existing["id"]),
        "planned_workout",
        existing["title"],
        existing["description"],
        xp=70,
    )
    return task, fitness


async def build_finance_task(user_id: str, date_str: str, profile: dict) -> tuple[dict, dict]:
    raw = await load_tab_data(user_id, "finance")
    finance = normalize_finance_data(raw)
    existing = next((item for item in finance["actions"] if item.get("date") == date_str and not item.get("done")), None)
    if not existing:
        challenge = ((profile.get("goal_details") or {}).get("finance") or ["track"])[0]
        if challenge == "save":
            title = "Review one savings move today"
            description = "Find one transfer, cut, or tweak that grows your savings."
            kind = "savings_review"
        elif challenge == "debt":
            title = "Review one debt payoff step"
            description = "Look at one payment, balance, or extra payoff move today."
            kind = "debt_review"
        elif challenge == "understand":
            title = "Review your money picture"
            description = "Take one clear look at income, fixed costs, or where money is going."
            kind = "money_review"
        else:
            title = "Log your spending today"
            description = "Track at least one purchase so your finance tab reflects real behavior."
            kind = "expense_log"
        existing = {
            "id": make_id("finance_action"),
            "date": date_str,
            "title": title,
            "description": description,
            "kind": kind,
            "done": False,
            "from_today_plan": True,
            "created_at": now_iso(),
        }
        finance["actions"].insert(0, existing)

    task = build_task(
        make_id("plan_task"),
        "finance",
        "finance",
        str(existing["id"]),
        "finance_action",
        existing["title"],
        existing["description"],
        xp=55,
    )
    return task, finance


async def build_sleep_task(user_id: str, date_str: str, profile: dict) -> tuple[dict, dict]:
    raw = await load_tab_data(user_id, "sleep")
    sleep = normalize_sleep_data(raw)
    existing = next((item for item in sleep["actions"] if item.get("date") == date_str and not item.get("done")), None)
    if not existing:
        target_hours = float(profile.get("sleep_hours") or 8)
        existing = {
            "id": make_id("sleep_action"),
            "date": date_str,
            "title": "Log last night's sleep",
            "description": f"Record your sleep and keep moving toward a consistent {target_hours:.0f} hour target.",
            "done": False,
            "from_today_plan": True,
            "created_at": now_iso(),
        }
        sleep["actions"].insert(0, existing)
        sleep["progress"]["target_hours"] = target_hours

    task = build_task(
        make_id("plan_task"),
        "sleep",
        "sleep",
        str(existing["id"]),
        "sleep_action",
        existing["title"],
        existing["description"],
        xp=50,
    )
    return task, sleep


async def build_mindset_task(user_id: str, date_str: str, profile: dict) -> tuple[dict, dict]:
    raw = await load_tab_data(user_id, "mindset")
    mindset = normalize_mindset_data(raw)
    existing = next((item for item in mindset["prompts"] if item.get("date") == date_str and not item.get("done")), None)
    if not existing:
        goal_key = ((profile.get("goal_details") or {}).get("mindset") or ["journal"])[0]
        prompt_list = MINDSET_PROMPTS.get(goal_key, DEFAULT_MINDSET_PROMPTS)
        prompt = prompt_list[date.fromisoformat(date_str).toordinal() % len(prompt_list)]
        existing = {
            "id": make_id("mindset_prompt"),
            "date": date_str,
            "prompt": prompt,
            "done": False,
            "from_today_plan": True,
            "created_at": now_iso(),
        }
        mindset["prompts"].insert(0, existing)

    task = build_task(
        make_id("plan_task"),
        "mindset",
        "mindset",
        str(existing["id"]),
        "mindset_prompt",
        "Complete today's mindset prompt",
        existing["prompt"],
        xp=50,
    )
    return task, mindset


async def build_custom_goal_task(profile: dict, goal_id: str) -> tuple[dict | None, dict | None]:
    goal = next((item for item in profile.get("custom_goals", []) if item.get("id") == goal_id), None)
    if not goal:
        return None, None
    current_action = goal.get("current_action")
    if not current_action:
        return None, None

    task = build_task(
        make_id("plan_task"),
        "custom_goal",
        goal_id,
        str(current_action["id"]),
        "custom_goal_action",
        current_action["title"],
        current_action["description"],
        xp=80,
    )
    task["custom_goal_id"] = goal_id
    task["goal_label"] = goal.get("label")
    return task, goal


async def previous_incomplete_tasks(user_id: str, date_str: str) -> list[dict]:
    db = get_db()
    cursor = db.daily_plans.find(
        {"user_id": user_id, "date": {"$lt": date_str}},
        {"_id": 0, "tasks": 1, "date": 1},
    ).sort("date", -1).limit(7)
    carried = []
    async for doc in cursor:
        for task in doc.get("tasks", []):
            if task.get("completed"):
                continue
            carried.append(task)
        if carried:
            break
    return carried


async def persist_generated_sources(user_id: str, generated: dict, profile: dict) -> dict:
    if "school" in generated:
        await save_tab_data(user_id, "school", generated["school"])
    if "fitness" in generated:
        await save_tab_data(user_id, "fitness", generated["fitness"])
    if "finance" in generated:
        await save_tab_data(user_id, "finance", generated["finance"])
    if "sleep" in generated:
        await save_tab_data(user_id, "sleep", generated["sleep"])
    if "mindset" in generated:
        await save_tab_data(user_id, "mindset", generated["mindset"])
    if "canvas" in generated:
        await save_tab_data(user_id, "canvas", generated["canvas"])
    if generated.get("custom_goals_changed"):
        db = get_db()
        await db.profiles.update_one({"user_id": user_id}, {"$set": {"custom_goals": profile.get("custom_goals", [])}})
    return profile


async def generate_daily_plan(user_id: str, date_str: str | None = None) -> dict:
    db = get_db()
    target_date = date_str or today_iso()
    profile = await load_profile_with_progress(user_id)
    if not profile:
        return {"user_id": user_id, "date": target_date, "tasks": [], "generated_from": [], "updated_at": now_iso()}

    existing = await db.daily_plans.find_one({"user_id": user_id, "date": target_date}, {"_id": 0})
    if target_date != today_iso() and existing is None:
        return {"user_id": user_id, "date": target_date, "tasks": [], "generated_from": [], "updated_at": now_iso()}
    existing_by_domain = {}
    if existing:
        for task in existing.get("tasks", []):
            if task.get("completed"):
                existing_by_domain.setdefault(task.get("domain"), task)
            elif task.get("domain") in {item["domain"] for item in resolve_active_domains(profile)}:
                existing_by_domain.setdefault(task.get("domain"), task)

    tasks = []
    used_domains = set()
    for domain, task in existing_by_domain.items():
        tasks.append(task)
        used_domains.add(domain)

    active_specs = resolve_active_domains(profile)
    carried_forward = await previous_incomplete_tasks(user_id, target_date)
    for old_task in carried_forward:
        domain = old_task.get("domain")
        if domain in used_domains:
            continue
        if domain not in {item["domain"] for item in active_specs}:
            continue
        tasks.append(clone_carried_task(old_task))
        used_domains.add(domain)

    generated_sources = {}
    custom_goals_changed = False

    for spec in active_specs:
        domain = spec["domain"]
        if domain in used_domains:
            continue
        built_task = None
        if domain == "canvas":
            built_task, source = await build_canvas_task(user_id, target_date)
            if source is not None:
                generated_sources["canvas"] = source
        elif domain == "school":
            built_task, source = await build_school_task(user_id, target_date)
            generated_sources["school"] = source
        elif domain == "fitness":
            built_task, source = await build_fitness_task(user_id, target_date, profile)
            generated_sources["fitness"] = source
        elif domain == "finance":
            built_task, source = await build_finance_task(user_id, target_date, profile)
            generated_sources["finance"] = source
        elif domain == "sleep":
            built_task, source = await build_sleep_task(user_id, target_date, profile)
            generated_sources["sleep"] = source
        elif domain == "mindset":
            built_task, source = await build_mindset_task(user_id, target_date, profile)
            generated_sources["mindset"] = source
        elif domain == "custom_goal":
            built_task, goal = await build_custom_goal_task(profile, spec["goal_id"])
            if goal is not None:
                custom_goals_changed = custom_goals_changed or True
        if built_task is not None:
            tasks.append(built_task)
            used_domains.add(domain)

    tasks.sort(key=lambda task: (task.get("priority", 100), task.get("completed", False), task.get("title", "")))
    tasks = tasks[:5]
    generated_sources["custom_goals_changed"] = custom_goals_changed
    await persist_generated_sources(user_id, generated_sources, profile)

    doc = {
        "user_id": user_id,
        "date": target_date,
        "tasks": tasks,
        "generated_from": [item.get("goal_id") or item["domain"] for item in active_specs],
        "updated_at": now_iso(),
    }
    await db.daily_plans.update_one(
        {"user_id": user_id, "date": target_date},
        {"$set": doc},
        upsert=True,
    )
    return doc


async def complete_school_task(user_id: str, record_id: str) -> None:
    school = normalize_school_data(await load_tab_data(user_id, "school"))
    for assignment in school["assignments"]:
        if str(assignment.get("id")) == str(record_id):
            assignment["done"] = True
            assignment["completed_at"] = now_iso()
            break
    await save_tab_data(user_id, "school", school)


def update_fitness_progress(fitness: dict) -> dict:
    workouts = fitness["workouts"]
    today = date.today()
    weekly_count = 0
    for workout in workouts:
        if not workout.get("done"):
            continue
        entry_date = workout.get("date")
        try:
            workout_date = date.fromisoformat(entry_date)
        except Exception:
            workout_date = today
        if today - timedelta(days=6) <= workout_date <= today:
            weekly_count += 1
    fitness["progress"]["completed_this_week"] = weekly_count
    fitness["progress"]["consistency_streak"] = weekly_count
    fitness["progress"]["difficulty_level"] = min(5, max(1, 1 + weekly_count // 3))
    return fitness


async def complete_fitness_task(user_id: str, record_id: str) -> None:
    fitness = normalize_fitness_data(await load_tab_data(user_id, "fitness"))
    for collection_name in ("planned_workouts", "workouts"):
        for workout in fitness[collection_name]:
            if str(workout.get("id")) == str(record_id):
                workout["done"] = True
                workout["completed_at"] = now_iso()
    update_fitness_progress(fitness)
    await save_tab_data(user_id, "fitness", fitness)


async def complete_finance_task(user_id: str, record_id: str) -> None:
    finance = normalize_finance_data(await load_tab_data(user_id, "finance"))
    for action in finance["actions"]:
        if str(action.get("id")) == str(record_id):
            action["done"] = True
            action["completed_at"] = now_iso()
            break
    finance["progress"]["last_action_date"] = today_iso()
    finance["progress"]["review_streak"] = finance["progress"].get("review_streak", 0) + 1
    await save_tab_data(user_id, "finance", finance)


async def complete_sleep_task(user_id: str, record_id: str) -> None:
    sleep = normalize_sleep_data(await load_tab_data(user_id, "sleep"))
    for action in sleep["actions"]:
        if str(action.get("id")) == str(record_id):
            action["done"] = True
            action["completed_at"] = now_iso()
            break
    last = sleep["progress"].get("last_log_date")
    if last == today_iso():
        streak = sleep["progress"].get("logging_streak", 1)
    else:
        streak = sleep["progress"].get("logging_streak", 0) + 1
    sleep["progress"]["logging_streak"] = streak
    sleep["progress"]["last_log_date"] = today_iso()
    await save_tab_data(user_id, "sleep", sleep)


async def complete_mindset_task(user_id: str, record_id: str) -> None:
    mindset = normalize_mindset_data(await load_tab_data(user_id, "mindset"))
    for prompt in mindset["prompts"]:
        if str(prompt.get("id")) == str(record_id):
            prompt["done"] = True
            prompt["completed_at"] = now_iso()
            break
    last = mindset["progress"].get("last_prompt_date")
    if last == today_iso():
        streak = mindset["progress"].get("prompt_streak", 1)
    else:
        streak = mindset["progress"].get("prompt_streak", 0) + 1
    mindset["progress"]["prompt_streak"] = streak
    mindset["progress"]["last_prompt_date"] = today_iso()
    await save_tab_data(user_id, "mindset", mindset)


async def complete_canvas_task(user_id: str, record_id: str) -> None:
    canvas = normalize_canvas_data(await load_tab_data(user_id, "canvas"))
    canvas["local_completion_map"][record_id] = {"completed": True, "completed_at": now_iso()}
    await save_tab_data(user_id, "canvas", canvas)


async def complete_custom_goal_task(user_id: str, goal_id: str, record_id: str) -> None:
    db = get_db()
    profile = await load_profile_with_progress(user_id)
    if not profile:
        return
    changed = False
    for goal in profile.get("custom_goals", []):
        if goal.get("id") != goal_id:
            continue
        current_action = goal.get("current_action") or {}
        if str(current_action.get("id")) == str(record_id):
            current_action["completed"] = True
            current_action["completed_at"] = now_iso()
            history = goal.get("action_history", [])
            history.append(current_action)
            goal["action_history"] = history

            stage_index = goal.get("stage_index", 0)
            milestones = goal.get("milestones", [])
            if stage_index < len(milestones):
                milestones[stage_index]["done"] = True
            stages = custom_goal_stages(goal.get("label", "Goal"))
            if stage_index < len(stages) - 1:
                stage_index += 1
            goal["stage_index"] = stage_index
            stage_id, stage_title = stages[stage_index]
            goal["stage"] = stage_id
            goal["stage_label"] = stage_title
            goal["progress_summary"] = f"Current stage: {stage_title}"
            next_action_number = len(goal.get("action_history", [])) + 1
            goal["current_action"] = build_custom_goal_action(goal.get("label", "Goal"), stage_id, stage_title, next_action_number)
            changed = True
        break

    if changed:
        await db.profiles.update_one({"user_id": user_id}, {"$set": {"custom_goals": profile.get("custom_goals", [])}})


async def complete_daily_task(user_id: str, task_id: str, date_str: str | None = None) -> dict:
    db = get_db()
    target_date = date_str or today_iso()
    plan = await generate_daily_plan(user_id, target_date)
    tasks = plan.get("tasks", [])
    target = next((task for task in tasks if str(task.get("task_id")) == str(task_id)), None)
    if not target:
        raise ValueError("Task not found")

    if target.get("completed"):
        stats = await get_or_create_stats(user_id)
        return {"plan": plan, "stats": stats}

    domain = target.get("domain")
    record_id = target.get("source_record_id")
    if domain == "school":
        await complete_school_task(user_id, record_id)
    elif domain == "canvas":
        await complete_canvas_task(user_id, record_id)
    elif domain == "fitness":
        await complete_fitness_task(user_id, record_id)
    elif domain == "finance":
        await complete_finance_task(user_id, record_id)
    elif domain == "sleep":
        await complete_sleep_task(user_id, record_id)
    elif domain == "mindset":
        await complete_mindset_task(user_id, record_id)
    elif domain == "custom_goal":
        await complete_custom_goal_task(user_id, target.get("custom_goal_id"), record_id)

    for task in tasks:
        if str(task.get("task_id")) == str(task_id):
            task["completed"] = True
            task["done"] = True
            task["completed_at"] = now_iso()
            break

    plan["tasks"] = tasks
    plan["updated_at"] = now_iso()
    await db.daily_plans.update_one(
        {"user_id": user_id, "date": target_date},
        {"$set": {"tasks": tasks, "updated_at": plan["updated_at"]}},
        upsert=True,
    )

    stats = await award_xp(user_id, int(target.get("xp", 50)), f"daily_plan:{domain}")
    refreshed = await generate_daily_plan(user_id, target_date)
    return {"plan": refreshed, "stats": stats}
