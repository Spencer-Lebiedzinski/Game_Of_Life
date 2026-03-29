export function normalizeSchoolData(data) {
  if (Array.isArray(data)) {
    return { assignments: data, progress: {} };
  }
  return {
    assignments: Array.isArray(data?.assignments) ? data.assignments : [],
    progress: data?.progress ?? {},
  };
}

export function normalizeFitnessData(data) {
  if (Array.isArray(data)) {
    return {
      workouts: data,
      planned_workouts: [],
      progress: { completed_this_week: 0, difficulty_level: 1, consistency_streak: 0 },
    };
  }
  return {
    workouts: Array.isArray(data?.workouts) ? data.workouts : [],
    planned_workouts: Array.isArray(data?.planned_workouts) ? data.planned_workouts : [],
    progress: data?.progress ?? { completed_this_week: 0, difficulty_level: 1, consistency_streak: 0 },
  };
}

export function normalizeFinanceData(data) {
  if (Array.isArray(data)) {
    return {
      expenses: data,
      actions: [],
      progress: { review_streak: 0, last_action_date: null },
    };
  }
  return {
    expenses: Array.isArray(data?.expenses) ? data.expenses : [],
    actions: Array.isArray(data?.actions) ? data.actions : [],
    progress: data?.progress ?? { review_streak: 0, last_action_date: null },
  };
}

export function normalizeSleepData(data) {
  if (Array.isArray(data)) {
    return {
      entries: data,
      actions: [],
      progress: { logging_streak: 0, last_log_date: null, target_hours: 8 },
    };
  }
  return {
    entries: Array.isArray(data?.entries) ? data.entries : [],
    actions: Array.isArray(data?.actions) ? data.actions : [],
    progress: data?.progress ?? { logging_streak: 0, last_log_date: null, target_hours: 8 },
  };
}

export function normalizeMindsetData(data) {
  return {
    reflection: data?.reflection ?? '',
    gratitude: Array.isArray(data?.gratitude) ? data.gratitude : ['', '', ''],
    intention: data?.intention ?? '',
    prompts: Array.isArray(data?.prompts) ? data.prompts : [],
    progress: data?.progress ?? { prompt_streak: 0, last_prompt_date: null },
  };
}

export function normalizeCanvasSnapshot(data) {
  return {
    courses: Array.isArray(data?.courses) ? data.courses : [],
    local_completion_map: data?.local_completion_map ?? {},
    last_synced_at: data?.last_synced_at ?? null,
  };
}
