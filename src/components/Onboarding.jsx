import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const GOAL_OPTIONS = [
  { id: 'school', label: 'Crush School', icon: '📚', desc: 'Assignments, exams & study goals' },
  { id: 'fitness', label: 'Get Fit', icon: '💪', desc: 'Workouts, steps & health habits' },
  { id: 'mindset', label: 'Build Mindset', icon: '🧠', desc: 'Journaling, mood & gratitude' },
  { id: 'social', label: 'Grow Socially', icon: '🤝', desc: 'Friendships & connections' },
  { id: 'finance', label: 'Manage Money', icon: '💰', desc: 'Budget, spending & savings' },
  { id: 'sleep', label: 'Sleep Better', icon: '😴', desc: 'Track & improve sleep quality' },
];

const THEMES = [
  {
    id: 'mint',
    label: 'Mint Fresh',
    primary: '#6EE7B7',
    secondary: '#60A5FA',
    accent: '#2DD4BF',
    bg: '#F9FAFB',
    preview: ['bg-emerald-300', 'bg-blue-400', 'bg-teal-400'],
  },
  {
    id: 'sunset',
    label: 'Sunset Vibe',
    primary: '#FCA5A5',
    secondary: '#FDBA74',
    accent: '#F472B6',
    bg: '#FFF7ED',
    preview: ['bg-red-300', 'bg-orange-300', 'bg-pink-400'],
  },
  {
    id: 'ocean',
    label: 'Deep Ocean',
    primary: '#7DD3FC',
    secondary: '#A5B4FC',
    accent: '#38BDF8',
    bg: '#F0F9FF',
    preview: ['bg-sky-300', 'bg-indigo-300', 'bg-sky-400'],
  },
  {
    id: 'forest',
    label: 'Forest Mode',
    primary: '#86EFAC',
    secondary: '#A3E635',
    accent: '#34D399',
    bg: '#F0FDF4',
    preview: ['bg-green-300', 'bg-lime-400', 'bg-emerald-400'],
  },
  {
    id: 'galaxy',
    label: 'Galaxy Dark',
    primary: '#C084FC',
    secondary: '#818CF8',
    accent: '#E879F9',
    bg: '#0F172A',
    preview: ['bg-purple-400', 'bg-indigo-400', 'bg-fuchsia-400'],
    dark: true,
  },
  {
    id: 'candy',
    label: 'Candy Pop',
    primary: '#F9A8D4',
    secondary: '#FDE68A',
    accent: '#6EE7B7',
    bg: '#FDF2F8',
    preview: ['bg-pink-300', 'bg-yellow-200', 'bg-emerald-300'],
  },
];

const STEPS = ['welcome', 'name', 'goals', 'theme', 'done'];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('mint');

  const stepKey = STEPS[step];

  const toggleGoal = (id) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = () => {
    const theme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];
    onComplete({ name: name || 'Player', goals: selectedGoals, theme });
  };

  const canNext =
    stepKey === 'welcome' ||
    (stepKey === 'name' && name.trim().length > 0) ||
    stepKey === 'goals' ||
    stepKey === 'theme';

  const theme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];
  const isDark = theme.dark;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500"
      style={{ backgroundColor: stepKey === 'theme' ? '#ffffff' : '#000000' }}
    >
      <div className={`w-full max-w-lg ${stepKey === 'theme' ? 'text-dark' : 'text-white'}`}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.slice(0, -1).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < step
                  ? 'w-6 h-2'
                  : i === step
                  ? 'w-8 h-2'
                  : 'w-2 h-2 opacity-30'
              }`}
              style={{ backgroundColor: theme.accent }}
            />
          ))}
        </div>

        {/* WELCOME */}
        {stepKey === 'welcome' && (
          <div className="text-center">
            <div className="text-7xl mb-6">🎮</div>
            <h1 className="text-4xl font-bold mb-3">Game of Life</h1>
            <p className="text-lg mb-8 text-gray-400">
              Your gamified life dashboard. Track habits, crush goals, and level up every day.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-10">
              {['Level Up', 'Daily Streaks', 'Life Score'].map((feat, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 text-center bg-white/10 shadow-sm"
                >
                  <div className="text-2xl mb-1">
                    {['⚡', '🔥', '📊'][i]}
                  </div>
                  <p className="text-xs font-medium">{feat}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NAME */}
        {stepKey === 'name' && (
          <div className="text-center">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-3xl font-bold mb-2">What's your name?</h2>
            <p className="mb-8 text-gray-400">
              We'll use this to personalize your experience.
            </p>
            <input
              autoFocus
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && next()}
              className="w-full text-center text-xl py-4 px-6 rounded-2xl border-2 focus:outline-none transition-colors mb-2 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-white/60"
              style={{ '--tw-ring-color': theme.accent }}
            />
          </div>
        )}

        {/* GOALS */}
        {stepKey === 'goals' && (
          <div>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎯</div>
              <h2 className="text-3xl font-bold mb-2">What are your goals?</h2>
              <p className="text-gray-400">
                Pick as many as you like. We'll customize your dashboard.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((goal) => {
                const selected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`relative p-4 rounded-2xl text-left transition-all border-2 ${
                      selected
                        ? 'border-white bg-white/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    style={selected ? { borderColor: theme.accent } : {}}
                  >
                    {selected && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.accent }}
                      >
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                    <span className="text-2xl block mb-1">{goal.icon}</span>
                    <p className="font-semibold text-sm">{goal.label}</p>
                    <p className="text-xs mt-0.5 text-gray-400">
                      {goal.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* THEME */}
        {stepKey === 'theme' && (
          <div>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎨</div>
              <h2 className="text-3xl font-bold mb-2">Pick your vibe</h2>
              <p className="text-gray-500">
                Choose a color scheme that motivates you.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    selectedTheme === t.id
                      ? 'border-current shadow-lg scale-105'
                      : 'border-transparent hover:scale-102'
                  } bg-white border border-gray-100 text-dark shadow-sm`}
                  style={selectedTheme === t.id ? { borderColor: t.accent } : {}}
                >
                  <div className="flex gap-1.5 mb-2">
                    {t.preview.map((c, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full ${c}`} />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-left">{t.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DONE */}
        {stepKey === 'done' && (
          <div className="text-center">
            <div className="text-7xl mb-4 animate-bounce">🚀</div>
            <h2 className="text-3xl font-bold mb-2">You're all set, {name || 'Player'}!</h2>
            <p className="text-lg mb-6 text-gray-400">
              Your personalized life dashboard is ready. Time to level up!
            </p>
            <div className="rounded-2xl p-5 mb-8 bg-white/10 shadow-sm">
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: theme.accent }}>1</p>
                  <p className="text-xs mt-1 text-gray-400">Level</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: theme.accent }}>0</p>
                  <p className="text-xs mt-1 text-gray-400">XP</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: theme.accent }}>{selectedGoals.length}</p>
                  <p className="text-xs mt-1 text-gray-400">Goals</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
            >
              Start Playing! 🎮
            </button>
          </div>
        )}

        {/* Nav buttons */}
        {stepKey !== 'done' && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={back}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm transition-colors ${
                step === 0
                  ? 'invisible'
                  : stepKey === 'theme' ? 'text-gray-400 hover:text-dark' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <button
              onClick={next}
              disabled={!canNext}
              className="flex items-center gap-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                color: isDark ? 'white' : '#111827',
              }}
            >
              {stepKey === 'theme' ? 'Almost there' : 'Continue'}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
