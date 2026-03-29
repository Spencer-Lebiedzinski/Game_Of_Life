import { useState } from 'react';
import { CheckCircle, Circle, Dumbbell, Plus } from 'lucide-react';

const WORKOUT_SUGGESTIONS = {
  strength: {
    access: {
      headline: 'Bodyweight Strength',
      note: 'No gym needed — your body is the weight.',
      days: [
        { focus: 'Push Focus', exercises: ['Push-ups 3×12', 'Pike push-ups 3×10', 'Tricep dips off chair 3×10', 'Plank 3×45s'] },
        { focus: 'Legs Focus', exercises: ['Bulgarian split squats 3×10', 'Jump squats 3×12', 'Glute bridges 3×15', 'Calf raises 3×20'] },
        { focus: 'Pull + Core', exercises: ['Door-frame rows 3×10', 'Inverted rows 3×8', 'Hollow body hold 3×20s', 'Bicycle crunches 3×15'] },
      ],
    },
    time: {
      headline: '20-Minute Strength Sessions',
      note: 'Short, heavy, effective — fits into a busy schedule.',
      days: [
        { focus: 'Upper Body', exercises: ['Bench press 4×5', 'Barbell row 4×5', 'Overhead press 3×8', 'Chin-ups 3×max'] },
        { focus: 'Lower Body', exercises: ['Back squat 4×5', 'Romanian deadlift 3×8', 'Walking lunges 3×10', 'Calf raises 3×15'] },
        { focus: 'Full Body', exercises: ['Deadlift 4×4', 'Push-ups 3×15', 'Dumbbell row 3×10', 'Plank 3×45s'] },
      ],
    },
    motivation: {
      headline: 'Low-Commitment Strength',
      note: 'Consistency beats intensity. Show up, even if it\'s just 10 minutes.',
      days: [
        { focus: 'Daily Anchor', exercises: ['5 push-ups + 5 squats on waking', 'Add 1 rep per week'] },
        { focus: 'Main Session', exercises: ['3 compound movements: squat, press, row', 'Do them slowly. Feel every rep.'] },
        { focus: 'Active Day', exercises: ['Walk 20+ minutes', 'Stretch 15 min', 'Anything that gets you moving'] },
      ],
    },
    knowledge: {
      headline: 'Strength Fundamentals',
      note: 'Master these 5 movements and you\'ll be ahead of most people in the gym.',
      days: [
        { focus: 'Squat + Hinge', exercises: ['Goblet squat 3×10', 'Romanian deadlift 3×10', 'Hip thrust 3×12'] },
        { focus: 'Push + Pull', exercises: ['Dumbbell bench press 3×10', 'Dumbbell row 3×10', 'Overhead press 3×10'] },
        { focus: 'Carry + Core', exercises: ['Farmer carries 3×20m', 'Plank 3×45s', 'Dead bug 3×10'] },
      ],
    },
  },
  weight: {
    access: {
      headline: 'Home Cardio + Burn',
      note: 'HIIT burns more in less time than steady-state cardio.',
      days: [
        { focus: 'HIIT Circuit', exercises: ['20s on / 10s off × 8 rounds', 'Jumping jacks, Burpees, Mountain climbers, Jump squats'] },
        { focus: 'Bodyweight Strength', exercises: ['Push-ups 3×15', 'Squats 3×20', 'Lunges 3×12', 'Plank 3×45s'] },
        { focus: 'Active Recovery', exercises: ['30-min brisk walk', 'Stretching 20 min'] },
      ],
    },
    time: {
      headline: '25-Min Fat Burn',
      note: 'High intensity in a short window is more effective than long slow sessions.',
      days: [
        { focus: 'Sprint Intervals', exercises: ['Warm-up 5 min', '8×30s sprint / 1 min walk', 'Cool-down 5 min'] },
        { focus: 'Metabolic Strength', exercises: ['Dumbbell complex 4×8 (no rest between movements)', 'Squat → press → row → lunge'] },
        { focus: 'EMOM (25 min)', exercises: ['Every minute: 10 squats + 5 push-ups', 'Rest what\'s left of the minute'] },
      ],
    },
    motivation: {
      headline: 'Enjoyable Movement',
      note: 'The best workout is the one you actually do.',
      days: [
        { focus: 'Fun Cardio', exercises: ['Dance, sports, swimming, cycling — anything you enjoy for 30 min'] },
        { focus: 'Light Strength', exercises: ['Full body circuit: squats, push-ups, rows, lunges (3 rounds)'] },
        { focus: 'Move More Day', exercises: ['Take stairs, park further away, walk after meals'] },
      ],
    },
    knowledge: {
      headline: 'Sustainable Fat Loss',
      note: 'Fat loss is mostly nutrition. Exercise helps — but focus on consistency.',
      days: [
        { focus: 'Cardio Foundation', exercises: ['Walk/jog 30 min at a pace you can hold a conversation', 'Zone 2 burns fat efficiently'] },
        { focus: 'Strength Circuit', exercises: ['Squats, push-ups, rows 3×12', 'Strength preserves muscle while losing fat'] },
        { focus: 'Active Rest', exercises: ['20-min walk after dinner', 'One of the highest-ROI habits for fat loss'] },
      ],
    },
  },
  energy: {
    access: {
      headline: 'Energy Flow Routine',
      note: 'Movement creates energy — the more you move, the more you have.',
      days: [
        { focus: 'Morning Activation', exercises: ['Sun salutations × 5', 'Bodyweight squats 2×10', 'Jumping jacks 2×30s', 'Deep breathing 5 min'] },
        { focus: 'Midday Reset', exercises: ['10-min walk outside', 'Desk stretches 5 min'] },
        { focus: 'Evening Wind-Down', exercises: ['Yoga flow 20 min', 'Foam roll 10 min'] },
      ],
    },
    time: {
      headline: 'Energy Boosters (10–15 min)',
      note: 'A 10-minute workout beats a zero-minute workout every single day.',
      days: [
        { focus: 'Morning Burst', exercises: ['5 min: jumping jacks + push-ups + squats on loop'] },
        { focus: 'Midday Walk', exercises: ['10-min brisk walk outside', 'No phone — just walk'] },
        { focus: 'Evening Stretch', exercises: ['10 min: hip flexors, chest, shoulders, hamstrings'] },
      ],
    },
    motivation: {
      headline: 'Movement on Autopilot',
      note: 'Attach movement to things you already do.',
      days: [
        { focus: 'Morning Anchor', exercises: ['10 squats while coffee brews', 'Stretch while checking phone'] },
        { focus: 'Midday Move', exercises: ['Walk to get lunch', 'Take one flight of stairs per day'] },
        { focus: 'Evening Recharge', exercises: ['20-min walk or yoga', 'No screens 30 min before bed'] },
      ],
    },
    knowledge: {
      headline: 'The Energy Blueprint',
      note: 'Sleep, movement, and sunlight are the three biggest energy levers.',
      days: [
        { focus: 'Cardio for Energy', exercises: ['Zone 2 cardio 30 min (light jog, bike, swim)', 'Trains your mitochondria — literal energy factories'] },
        { focus: 'Strength for Hormones', exercises: ['Compound lifts 3×8', 'Strength training boosts testosterone and HGH'] },
        { focus: 'Recovery Day', exercises: ['Yoga or stretching 20 min', 'Sleep 7-9 hours — energy is built here'] },
      ],
    },
  },
  consistent: {
    access: {
      headline: 'The Consistency System',
      note: 'Two rules: never miss twice. Make it so easy you can\'t say no.',
      days: [
        { focus: 'Minimum Session', exercises: ['5 push-ups, 5 squats, 5 lunges', 'If you feel good, keep going. If not, you\'re done.'] },
        { focus: 'Full Session', exercises: ['20-min full body: push-ups, squats, rows, plank', '3 sets each.'] },
        { focus: 'Active Recovery', exercises: ['20-min walk', 'Stretching or foam rolling'] },
      ],
    },
    time: {
      headline: 'The 15-Minute Habit',
      note: 'You have 15 minutes. That\'s all this takes.',
      days: [
        { focus: 'Quick Full Body', exercises: ['3 rounds: 10 squats, 8 push-ups, 10 rows', 'Under 15 minutes.'] },
        { focus: 'Cardio Micro', exercises: ['10 min walk + 5 min stretching'] },
        { focus: 'Strength Micro', exercises: ['4×5 on one movement (squat, press, or deadlift)'] },
      ],
    },
    motivation: {
      headline: 'Identity-Based Fitness',
      note: 'You\'re not trying to work out more. You\'re becoming someone who works out.',
      days: [
        { focus: 'Identity Session', exercises: ['Ask: what would a fit person do today?', 'Then do that, however small'] },
        { focus: 'Streak Session', exercises: ['Any workout that keeps your streak alive', 'Intensity doesn\'t matter. Showing up does.'] },
        { focus: 'Review', exercises: ['Write down what worked and what didn\'t', 'Adjust one thing next week'] },
      ],
    },
    knowledge: {
      headline: 'Build the Foundation',
      note: 'Sustainable habits are built on understanding, not willpower.',
      days: [
        { focus: 'Learn + Do', exercises: ['Pick one movement. Watch a form video. Do it 3×10.'] },
        { focus: 'Cardio Basics', exercises: ['30-min easy jog or walk', 'If you can hold a conversation, the intensity is right'] },
        { focus: 'Reflect', exercises: ['What muscles are sore? That\'s what worked.', 'Adjust next week based on this'] },
      ],
    },
  },
};

const FREQ_TO_DAYS = { never: 2, '1-2x': 3, '3-4x': 4, daily: 5 };

const BARRIER_CONTEXT = {
  time:       '⏰ Since time is your main barrier, these sessions are all under 25 min.',
  motivation: '💡 Since motivation is your main barrier, these are intentionally simple.',
  access:     '🏠 Since gym access is your main barrier, everything here is equipment-free.',
  knowledge:  '📖 Since you\'re still learning, explanations are included for each movement.',
};

const GOAL_LABELS = {
  weight:     { icon: '⚖️', label: 'Lose Weight' },
  strength:   { icon: '🏋️', label: 'Build Strength' },
  energy:     { icon: '⚡', label: 'More Energy' },
  consistent: { icon: '🔄', label: 'Stay Consistent' },
};

const typeColors = {
  Cardio:      'bg-red-100 text-red-700',
  Strength:    'bg-blue-100 text-blue-700',
  Flexibility: 'bg-purple-100 text-purple-700',
};

export default function FitnessTab({ profile }) {
  const [workouts, setWorkouts] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ name: '', type: 'Cardio', duration: '' });

  const fitnessDetails = profile?.goalDetails?.fitness;
  const goal    = fitnessDetails?.[0];
  const freq    = fitnessDetails?.[1];
  const barrier = fitnessDetails?.[2];

  const suggestions = WORKOUT_SUGGESTIONS[goal]?.[barrier] ?? null;
  const targetDays  = FREQ_TO_DAYS[freq] ?? 3;
  const goalMeta    = GOAL_LABELS[goal];
  const suggestionDays = suggestions ? suggestions.days.slice(0, Math.min(suggestions.days.length, targetDays)) : [];

  const completedWorkouts = workouts.filter((w) => w.done).length;
  const percent = targetDays > 0 ? Math.round((completedWorkouts / targetDays) * 100) : 0;

  const toggleWorkout = (id) => {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, done: !w.done } : w)));
  };

  const handleAdd = () => {
    if (!newWorkout.name) return;
    setWorkouts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newWorkout.name,
        type: newWorkout.type,
        duration: newWorkout.duration || '30 min',
        date: 'Today',
        done: false,
      },
    ]);
    setNewWorkout({ name: '', type: 'Cardio', duration: '' });
    setShowLog(false);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Fitness</h1>
          <p className="text-gray-500 text-sm">{completedWorkouts}/{targetDays} workouts logged this week</p>
        </div>
        <button
          onClick={() => setShowLog(!showLog)}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Log Workout
        </button>
      </div>

      {/* Suggestions based on onboarding */}
      {suggestions && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4" style={{ borderColor: '#6EE7B7' }}>
          <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suggested for you</span>
                {goalMeta && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                    {goalMeta.icon} {goalMeta.label}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-dark">{suggestions.headline}</h2>
              <p className="text-sm text-gray-500 mt-0.5 italic">"{suggestions.note}"</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-green-600">{targetDays}×</p>
              <p className="text-xs text-gray-400">per week</p>
            </div>
          </div>

          {barrier && BARRIER_CONTEXT[barrier] && (
            <div className="text-xs bg-gray-50 rounded-xl px-3 py-2 text-gray-600 mb-4">
              {BARRIER_CONTEXT[barrier]}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestionDays.map((day, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Session {i + 1}</p>
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

      <div className="space-y-4">
        {/* Weekly goal */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Dumbbell size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-dark text-sm">Weekly Goal</h3>
              <p className="text-xs text-gray-500">{completedWorkouts} of {targetDays} workouts</p>
            </div>
            <div className="ml-auto text-2xl font-bold text-accent">{percent}%</div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: targetDays }).map((_, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < completedWorkouts ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'}`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Workout log */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-3">Workout Log</h3>
          {workouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏋️</div>
              <p className="text-sm text-gray-400">No workouts logged yet.</p>
              <p className="text-xs text-gray-300 mt-1">Hit "Log Workout" to track your first session.</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
