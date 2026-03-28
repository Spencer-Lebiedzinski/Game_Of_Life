"use client";

import { useState, FormEvent } from "react";

const GOALS = [
  { value: "better_grades", label: "Better grades" },
  { value: "lose_weight", label: "Lose weight / get fit" },
  { value: "save_money", label: "Save money" },
  { value: "reduce_stress", label: "Reduce stress" },
  { value: "sleep_better", label: "Sleep better" },
  { value: "be_more_social", label: "Be more social" },
  { value: "reduce_screen_time", label: "Reduce screen time" },
  { value: "stop_vaping_drinking", label: "Stop vaping / drinking" },
];

const SCALE_LABELS: Record<string, Record<number, string>> = {
  eating_quality: { 1: "Very poor", 3: "Average", 5: "Excellent" },
  stress_level: { 1: "Very low", 3: "Moderate", 5: "Very high" },
  spending_awareness: { 1: "No idea", 3: "Somewhat aware", 5: "Very aware" },
  social_activity: { 1: "Very isolated", 3: "Moderate", 5: "Very social" },
};

interface FormState {
  name: string;
  eating_quality: number;
  sleep_hours: number;
  exercise_freq: number;
  stress_level: number;
  spending_awareness: number;
  screen_time_struggle: string;
  social_activity: number;
  goals: string[];
  vaping_drinking: boolean;
  academic_struggle: string;
}

interface OnboardingFormProps {
  userId: string;
  onComplete: () => void;
}

export default function OnboardingForm({ userId, onComplete }: OnboardingFormProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    eating_quality: 3,
    sleep_hours: 7,
    exercise_freq: 3,
    stress_level: 3,
    spending_awareness: 3,
    screen_time_struggle: "sometimes",
    social_activity: 3,
    goals: [],
    vaping_drinking: false,
    academic_struggle: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleGoal(value: string) {
    setForm((prev) => {
      const already = prev.goals.includes(value);
      if (already) return { ...prev, goals: prev.goals.filter((g) => g !== value) };
      if (prev.goals.length >= 3) return prev; // max 3
      return { ...prev, goals: [...prev.goals, value] };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.goals.length === 0) {
      setError("Pick at least one goal.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, user_id: userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Something went wrong.");
      }

      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-lg mx-auto py-10 px-4">
      <div>
        <h1 className="text-2xl font-bold">Welcome to Game of Life</h1>
        <p className="text-sm text-gray-500 mt-1">
          Answer 10 quick questions so we can personalize your experience.
        </p>
      </div>

      {/* Q1 — Name */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">1. What's your name?</label>
        <input
          required
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Q2 — Eating */}
      <ScaleQuestion
        num={2}
        label="How would you rate your eating habits?"
        field="eating_quality"
        value={form.eating_quality}
        onChange={(v) => setField("eating_quality", v)}
        scaleLabels={SCALE_LABELS.eating_quality}
      />

      {/* Q3 — Sleep */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          3. How many hours of sleep do you average per night?{" "}
          <span className="text-indigo-600 font-semibold">{form.sleep_hours}h</span>
        </label>
        <input
          type="range"
          min={3}
          max={12}
          step={0.5}
          value={form.sleep_hours}
          onChange={(e) => setField("sleep_hours", parseFloat(e.target.value))}
          className="accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>3h</span><span>12h</span>
        </div>
      </div>

      {/* Q4 — Exercise */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          4. How many days a week do you exercise?{" "}
          <span className="text-indigo-600 font-semibold">{form.exercise_freq}x</span>
        </label>
        <input
          type="range"
          min={0}
          max={7}
          step={1}
          value={form.exercise_freq}
          onChange={(e) => setField("exercise_freq", parseInt(e.target.value))}
          className="accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0</span><span>7</span>
        </div>
      </div>

      {/* Q5 — Stress */}
      <ScaleQuestion
        num={5}
        label="How stressed are you on a typical day?"
        field="stress_level"
        value={form.stress_level}
        onChange={(v) => setField("stress_level", v)}
        scaleLabels={SCALE_LABELS.stress_level}
      />

      {/* Q6 — Spending */}
      <ScaleQuestion
        num={6}
        label="How aware are you of your spending habits?"
        field="spending_awareness"
        value={form.spending_awareness}
        onChange={(v) => setField("spending_awareness", v)}
        scaleLabels={SCALE_LABELS.spending_awareness}
      />

      {/* Q7 — Screen time */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">7. Do you struggle with screen time?</label>
        <div className="flex gap-3">
          {["yes", "sometimes", "no"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setField("screen_time_struggle", opt)}
              className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${
                form.screen_time_struggle === opt
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-300 hover:border-indigo-400"
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Q8 — Social */}
      <ScaleQuestion
        num={8}
        label="How social are you outside of class?"
        field="social_activity"
        value={form.social_activity}
        onChange={(v) => setField("social_activity", v)}
        scaleLabels={SCALE_LABELS.social_activity}
      />

      {/* Q9 — Goals */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">
          9. Pick your top 3 goals{" "}
          <span className="text-gray-400 font-normal text-sm">({form.goals.length}/3)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => {
            const selected = form.goals.includes(g.value);
            const maxed = form.goals.length >= 3 && !selected;
            return (
              <button
                key={g.value}
                type="button"
                disabled={maxed}
                onClick={() => toggleGoal(g.value)}
                className={`py-2 px-3 rounded border text-sm font-medium transition-colors text-left ${
                  selected
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : maxed
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 hover:border-indigo-400"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Q10 — Vaping/drinking */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">10. Do you currently vape or drink regularly?</label>
        <div className="flex gap-3">
          {[
            { label: "Yes", value: true },
            { label: "No", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setField("vaping_drinking", opt.value)}
              className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${
                form.vaping_drinking === opt.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-300 hover:border-indigo-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bonus — Academic struggle (optional) */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Any specific academic struggle?{" "}
          <span className="text-gray-400 font-normal text-sm">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. math, time management, test anxiety"
          value={form.academic_struggle}
          onChange={(e) => setField("academic_struggle", e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white rounded py-3 font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : "Start my Game of Life"}
      </button>
    </form>
  );
}

// Reusable 1–5 scale component
interface ScaleQuestionProps {
  num: number;
  label: string;
  field: string;
  value: number;
  onChange: (v: number) => void;
  scaleLabels: Record<number, string>;
}

function ScaleQuestion({ num, label, value, onChange, scaleLabels }: ScaleQuestionProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium">
        {num}. {label}{" "}
        <span className="text-indigo-600 font-semibold">{value}/5</span>
      </label>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="accent-indigo-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{scaleLabels[1]}</span>
        <span>{scaleLabels[3]}</span>
        <span>{scaleLabels[5]}</span>
      </div>
    </div>
  );
}
