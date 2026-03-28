import { useState } from 'react';
import { CheckCircle, Circle, Dumbbell, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { workouts as initialWorkouts, weeklyFitnessGoal, analyticsData } from '../../data/mockData';

// ─── Workout plan content ────────────────────────────────────────────────────
// Keyed by [goal][barrier]. goal and barrier come from onboarding goalDetails.fitness[0] and [2].

const WORKOUT_PLANS = {
  strength: {
    access: {
      title: 'Bodyweight Strength Builder',
      tip: 'No gym needed — your body is the weight.',
      days: [
        { focus: 'Push Day', exercises: ['Push-ups 3×12', 'Pike push-ups 3×10', 'Tricep dips off chair 3×10', 'Plank 3×45s'] },
        { focus: 'Legs Day', exercises: ['Bulgarian split squats 3×10', 'Jump squats 3×12', 'Glute bridges 3×15', 'Calf raises 3×20'] },
        { focus: 'Pull + Core', exercises: ['Door-frame rows 3×10', 'Inverted rows 3×8', 'Hollow body hold 3×20s', 'Bicycle crunches 3×15'] },
      ],
    },
    time: {
      title: '20-Minute Strength Sessions',
      tip: 'Short, heavy, effective. Done before you talk yourself out of it.',
      days: [
        { focus: 'Upper (20 min)', exercises: ['Bench press 4×5', 'Barbell row 4×5', 'Overhead press 3×8', 'Chin-ups 3×max'] },
        { focus: 'Lower (20 min)', exercises: ['Back squat 4×5', 'Romanian deadlift 3×8', 'Walking lunges 3×10', 'Calf raises 3×15'] },
        { focus: 'Full Body (20 min)', exercises: ['Deadlift 4×4', 'Push-ups 3×15', 'Dumbbell row 3×10', 'Plank 3×45s'] },
      ],
    },
    motivation: {
      title: 'Minimum Viable Strength',
      tip: 'Consistency beats intensity every time. Show up, even if it\'s just 10 minutes.',
      days: [
        { focus: 'Anchor Workout', exercises: ['5 push-ups + 5 squats on waking (do this every day)', 'Add 1 rep per week'] },
        { focus: 'Main Session', exercises: ['3 compound lifts: squat, press, row', 'Do them slowly. Feel every rep.'] },
        { focus: 'Active Day', exercises: ['Walk 20+ minutes', 'Stretch or yoga 15 min', 'Anything that gets you moving'] },
      ],
    },
    knowledge: {
      title: 'Strength Fundamentals',
      tip: 'Master these 5 movements and you\'ll outperform 80% of gym-goers.',
      days: [
        { focus: 'Squat + Hinge', exercises: ['Goblet squat 3×10 — learn the pattern', 'Romanian deadlift 3×10', 'Hip thrust 3×12'] },
        { focus: 'Push + Pull', exercises: ['Dumbbell bench press 3×10', 'Dumbbell row 3×10', 'Overhead press 3×10'] },
        { focus: 'Carry + Core', exercises: ['Farmer carries 3×20m', 'Plank 3×45s', 'Dead bug 3×10 — great for beginners'] },
      ],
    },
  },
  weight: {
    access: {
      title: 'Cardio + Burn at Home',
      tip: 'HIIT burns more fat in less time than steady-state cardio.',
      days: [
        { focus: 'HIIT Circuit', exercises: ['20s on / 10s off × 8 rounds:', 'Jumping jacks, Burpees, Mountain climbers, Jump squats'] },
        { focus: 'Bodyweight Strength', exercises: ['Push-ups 3×15', 'Squats 3×20', 'Lunges 3×12', 'Plank 3×45s'] },
        { focus: 'Active Recovery', exercises: ['30-min brisk walk', 'Stretching / yoga 20 min'] },
      ],
    },
    time: {
      title: '25-Min Fat Burn',
      tip: 'Shorter sessions with higher intensity burn more than long slow cardio.',
      days: [
        { focus: 'Sprint Intervals', exercises: ['Warm-up 5 min', '8×30s sprint / 1 min walk', 'Cool-down 5 min'] },
        { focus: 'Metabolic Strength', exercises: ['Dumbbell complex 4×8 (no rest between exercises)', 'Squat → press → row → lunge'] },
        { focus: 'EMOM (25 min)', exercises: ['Every minute: 10 squats + 5 push-ups', 'Rest what\'s left of the minute'] },
      ],
    },
    motivation: {
      title: 'Enjoyable Fat Loss',
      tip: 'The best workout is the one you actually do. Pick things you like.',
      days: [
        { focus: 'Fun Cardio', exercises: ['Dance, sports, swimming, cycling — anything you enjoy for 30 min'] },
        { focus: 'Light Strength', exercises: ['Full body circuit: squats, push-ups, rows, lunges (3 rounds)'] },
        { focus: 'Move More Day', exercises: ['Take stairs, park far away, walk after meals', 'Small choices add up'] },
      ],
    },
    knowledge: {
      title: 'Sustainable Fat Loss',
      tip: 'Fat loss is mostly nutrition. Exercise helps — but don\'t out-train a bad diet.',
      days: [
        { focus: 'Cardio Basics', exercises: ['Walk/jog 30 min (zone 2 cardio — you can hold a conversation)', 'This burns fat efficiently'] },
        { focus: 'Strength Circuit', exercises: ['Squats, push-ups, rows 3×12', 'Strength preserves muscle while you lose fat'] },
        { focus: 'Active Rest', exercises: ['20-min walk after dinner', 'This is one of the highest-ROI habits for fat loss'] },
      ],
    },
  },
  energy: {
    access: {
      title: 'Energy Flow Routine',
      tip: 'Movement creates energy — the more you move, the more you have.',
      days: [
        { focus: 'Morning Activation', exercises: ['Sun salutations × 5', 'Bodyweight squats 2×10', 'Jumping jacks 2×30s', 'Deep breathing 5 min'] },
        { focus: 'Midday Reset', exercises: ['10-min walk outside (sunlight matters)', 'Desk stretches 5 min', 'Box breathing 4×4×4'] },
        { focus: 'Evening Wind-Down', exercises: ['Yoga flow 20 min', 'Foam roll 10 min', 'Progressive muscle relaxation'] },
      ],
    },
    time: {
      title: 'Energy Boosters (10–15 min)',
      tip: 'A 10-minute workout beats a zero-minute workout every day.',
      days: [
        { focus: 'AM Burst', exercises: ['5 min: jumping jacks + push-ups + squats on loop', 'Cold water on face after'] },
        { focus: 'Midday Walk', exercises: ['10-min brisk walk (outside if possible)', 'No phone — just walk'] },
        { focus: 'PM Stretch', exercises: ['10 min: hip flexors, chest, shoulders, hamstrings', 'Desk workers priority'] },
      ],
    },
    motivation: {
      title: 'Energy on Autopilot',
      tip: 'Attach movement to things you already do. It stops feeling like effort.',
      days: [
        { focus: 'Morning Anchor', exercises: ['10 squats while coffee brews', 'Stretch while checking phone'] },
        { focus: 'Noon Move', exercises: ['Walk to get lunch instead of ordering', 'Take one flight of stairs per day minimum'] },
        { focus: 'Evening Recharge', exercises: ['20-min walk or yoga', 'No screens 30 min before bed'] },
      ],
    },
    knowledge: {
      title: 'The Energy Blueprint',
      tip: 'Sleep, movement, and sunlight are the three biggest energy levers.',
      days: [
        { focus: 'Cardio for Energy', exercises: ['Zone 2 cardio 30 min (light jog, bike, swim)', 'This trains your mitochondria — literal energy factories'] },
        { focus: 'Strength for Hormones', exercises: ['Compound lifts 3×8', 'Strength training boosts testosterone and HGH — both = more energy'] },
        { focus: 'Recovery Day', exercises: ['Yoga or stretching 20 min', 'Sleep 7-9 hours — this is when energy is actually rebuilt'] },
      ],
    },
  },
  consistent: {
    access: {
      title: 'The Consistency System',
      tip: 'Two rules: never miss twice. Make it so easy you can\'t say no.',
      days: [
        { focus: 'Minimum Workout', exercises: ['5 push-ups, 5 squats, 5 lunges', 'If you feel good, do more. If not, done.'] },
        { focus: 'Full Session', exercises: ['20-min full body: push-ups, squats, rows, plank', '3 sets each. Simple and repeatable.'] },
        { focus: 'Active Recovery', exercises: ['20-min walk', 'Stretching or foam rolling'] },
      ],
    },
    time: {
      title: 'The 15-Minute Habit',
      tip: 'You have 15 minutes. That\'s all this takes.',
      days: [
        { focus: 'Quick Full Body', exercises: ['3 rounds of: 10 squats, 8 push-ups, 10 rows', 'Under 15 minutes. Done.'] },
        { focus: 'Cardio Micro', exercises: ['10 min walk + 5 min stretching', 'Counts. Do it.'] },
        { focus: 'Strength Micro', exercises: ['4×5 on one lift (squat, bench, or deadlift)', 'One lift. Four sets. Done.'] },
      ],
    },
    motivation: {
      title: 'Identity-Based Fitness',
      tip: 'You\'re not trying to work out more. You\'re becoming someone who works out.',
      days: [
        { focus: 'Identity Workout', exercises: ['Ask: what would a fit person do today?', 'Then do that thing, however small'] },
        { focus: 'Win Streak Session', exercises: ['Any workout that keeps your streak alive', 'Intensity doesn\'t matter. Showing up does.'] },
        { focus: 'Review Day', exercises: ['Write down what worked and what didn\'t this week', 'Adjust one thing next week'] },
      ],
    },
    knowledge: {
      title: 'Build the Foundation',
      tip: 'Sustainable habits are built on understanding, not willpower.',
      days: [
        { focus: 'Learn + Do', exercises: ['Pick one lift. Watch a form video. Do it 3×10.', 'Learn while you train.'] },
        { focus: 'Cardio Basics', exercises: ['30-min easy run or walk', 'Talk test: if you can hold a conversation, intensity is right'] },
        { focus: 'Reflect', exercises: ['5 min: what muscles are sore? That\'s what worked.', 'Adjust next week based on this'] },
      ],
    },
  },
};

const FREQ_TO_DAYS = { never: 2, '1-2x': 3, '3-4x': 4, daily: 5 };

const BARRIER_TIPS = {
  time:       '⏰ Your barrier is time — all sessions are under 25 min.',
  motivation: '💡 Your barrier is motivation — keep it dead simple so you never skip.',
  access:     '🏠 Your barrier is access — everything here is equipment-free.',
  knowledge:  '📖 Your barrier is knowledge — explanations included for each exercise.',
};

const GOAL_LABELS = {
  weight: { icon: '⚖️', label: 'Lose Weight' },
  strength: { icon: '🏋️', label: 'Build Strength' },
  energy: { icon: '⚡', label: 'More Energy' },
  consistent: { icon: '🔄', label: 'Stay Consistent' },
};

const FREQ_LABELS = {
  never: 'Starting from zero',
  '1-2x': 'Working out 1–2x/week now',
  '3-4x': 'Working out 3–4x/week now',
  daily: 'Active almost daily',
};

const typeColors = {
  Cardio: 'bg-red-100 text-red-700',
  Strength: 'bg-blue-100 text-blue-700',
  Flexibility: 'bg-purple-100 text-purple-700',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function FitnessTab({ profile }) {
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [showLog, setShowLog] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ name: '', type: 'Cardio', duration: '' });

  const completedWorkouts = workouts.filter((w) => w.done).length;
  const { total } = weeklyFitnessGoal;
  const percent = Math.round((completedWorkouts / total) * 100);

  const toggleWorkout = (id) => {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, done: !w.done } : w)));
  };

  const handleAdd = () => {
    if (!newWorkout.name) return;
    setWorkouts((prev) => [
      ...prev,
      { id: Date.now(), name: newWorkout.name, type: newWorkout.type, duration: newWorkout.duration || '30 min', date: 'Today', done: false },
    ]);
    setNewWorkout({ name: '', type: 'Cardio', duration: '' });
    setShowLog(false);
  };

  // Derive personalized plan from onboarding answers
  const fitnessDetails = profile?.goalDetails?.fitness;
  const goal   = fitnessDetails?.[0];   // weight | strength | energy | consistent
  const freq   = fitnessDetails?.[1];   // never | 1-2x | 3-4x | daily
  const barrier = fitnessDetails?.[2];  // time | motivation | access | knowledge

  const plan = WORKOUT_PLANS[goal]?.[barrier] ?? null;
  const targetDays = FREQ_TO_DAYS[freq] ?? 3;
  const goalMeta = GOAL_LABELS[goal];
  const planDays = plan ? plan.days.slice(0, Math.min(plan.days.length, targetDays)) : [];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Fitness</h1>
          <p className="text-gray-500 text-sm">{completedWorkouts}/{total} weekly workouts</p>
        </div>
        <button
          onClick={() => setShowLog(!showLog)}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Log Workout
        </button>
      </div>

      {/* Personalized plan — shown when onboarding answers exist */}
      {plan && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4" style={{ borderColor: '#6EE7B7' }}>
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Plan</span>
                {goalMeta && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                    {goalMeta.icon} {goalMeta.label}
                  </span>
                )}
                {freq && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {FREQ_LABELS[freq]}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-dark">{plan.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5 italic">"{plan.tip}"</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-green-600">{targetDays}×</p>
              <p className="text-xs text-gray-400">per week</p>
            </div>
          </div>

          {/* Barrier callout */}
          {barrier && BARRIER_TIPS[barrier] && (
            <div className="text-xs bg-gray-50 rounded-xl px-3 py-2 text-gray-600 mb-4">
              {BARRIER_TIPS[barrier]}
            </div>
          )}

          {/* Workout day cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {planDays.map((day, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Day {i + 1}
                </p>
                <p className="font-semibold text-dark text-sm mb-2">{day.focus}</p>
                <ul className="space-y-1">
                  {day.exercises.map((ex, j) => (
                    <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5 shrink-0">•</span>
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log form */}
      {showLog && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-primary">
          <h3 className="font-semibold text-dark mb-3">Log a Workout</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Workout name"
              value={newWorkout.name}
              onChange={(e) => setNewWorkout((p) => ({ ...p, name: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <select
              value={newWorkout.type}
              onChange={(e) => setNewWorkout((p) => ({ ...p, type: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              <option>Cardio</option>
              <option>Strength</option>
              <option>Flexibility</option>
            </select>
            <input
              type="text"
              placeholder="Duration (e.g. 30 min)"
              value={newWorkout.duration}
              onChange={(e) => setNewWorkout((p) => ({ ...p, duration: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">Add</button>
            <button onClick={() => setShowLog(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Weekly goal */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Dumbbell size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-dark text-sm">Weekly Goal</h3>
                <p className="text-xs text-gray-500">{completedWorkouts} of {total} workouts</p>
              </div>
              <div className="ml-auto text-2xl font-bold text-accent">{percent}%</div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < completedWorkouts ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Workouts list */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-dark text-sm mb-3">Workout Log</h3>
            <div className="space-y-2">
              {workouts.map((w) => (
                <div key={w.id} onClick={() => toggleWorkout(w.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:shadow-sm ${w.done ? 'bg-gray-50 opacity-70' : 'bg-gray-50 hover:bg-green-50'}`}>
                  {w.done ? <CheckCircle size={20} className="text-accent shrink-0" /> : <Circle size={20} className="text-gray-300 hover:text-accent shrink-0 transition-colors" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${w.done ? 'line-through text-gray-400' : 'text-dark'}`}>{w.name}</p>
                    <p className="text-xs text-gray-400">{w.duration} • {w.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[w.type] || 'bg-gray-100 text-gray-600'}`}>{w.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.fitness} barSize={16}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(v) => [`${v}%`, 'Activity']} />
              <Bar dataKey="value" fill="#6EE7B7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
