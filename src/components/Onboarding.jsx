import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { GOAL_OPTIONS, CLARIFY_QUESTIONS, THEMES, GOAL_TO_BACKEND } from '../data/goalData';

const STEPS = ['welcome', 'name', 'goals', 'clarify', 'theme', 'done'];

export default function Onboarding({ onComplete, userId = 'frontend-user' }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  // goalDetails: { school: ['assignments', 'alone', 'last-min'], fitness: [...], ... }
  const [goalDetails, setGoalDetails] = useState({});
  const [clarifyGoalIdx, setClarifyGoalIdx] = useState(0);
  const [clarifyQIdx, setClarifyQIdx] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState('mint');

  const stepKey = STEPS[step];
  const theme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];
  const isDark = theme.dark;

  const goalsToClarify = selectedGoals.filter((g) => CLARIFY_QUESTIONS[g]);
  const currentGoal = goalsToClarify[clarifyGoalIdx];
  const currentQuestions = currentGoal ? CLARIFY_QUESTIONS[currentGoal] : [];
  const currentQ = currentQuestions[clarifyQIdx];
  const currentAnswer = goalDetails[currentGoal]?.[clarifyQIdx];

  const totalClarifySteps = goalsToClarify.length * 3;
  const doneClarifySteps = clarifyGoalIdx * 3 + clarifyQIdx;

  const toggleGoal = (id) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const selectAnswer = (answerId) => {
    setGoalDetails((prev) => {
      const arr = [...(prev[currentGoal] || [])];
      arr[clarifyQIdx] = answerId;
      return { ...prev, [currentGoal]: arr };
    });
  };

  const next = () => {
    if (stepKey === 'clarify') {
      if (clarifyQIdx < currentQuestions.length - 1) {
        setClarifyQIdx((q) => q + 1);
      } else if (clarifyGoalIdx < goalsToClarify.length - 1) {
        setClarifyGoalIdx((g) => g + 1);
        setClarifyQIdx(0);
      } else {
        setStep((s) => s + 1);
      }
      return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const back = () => {
    if (stepKey === 'clarify') {
      if (clarifyQIdx > 0) {
        setClarifyQIdx((q) => q - 1);
      } else if (clarifyGoalIdx > 0) {
        const prevGoal = goalsToClarify[clarifyGoalIdx - 1];
        const prevQCount = CLARIFY_QUESTIONS[prevGoal]?.length || 3;
        setClarifyGoalIdx((g) => g - 1);
        setClarifyQIdx(prevQCount - 1);
      } else {
        setStep((s) => s - 1);
      }
      return;
    }
    if (step > 0) setStep((s) => s - 1);
  };

  const canNext =
    stepKey === 'welcome' ||
    (stepKey === 'name' && name.trim().length > 0) ||
    (stepKey === 'goals' && selectedGoals.length > 0) ||
    (stepKey === 'clarify' && !!currentAnswer) ||
    stepKey === 'theme';

  const effectiveStepKey = stepKey === 'clarify' && goalsToClarify.length === 0 ? 'theme' : stepKey;

  const handleFinish = async () => {
    const playerName = name || 'Player';

    fetch('http://localhost:8000/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name: playerName,
        eating_quality: 3,
        sleep_hours: selectedGoals.includes('sleep') ? 6 : 7,
        exercise_freq: selectedGoals.includes('fitness') ? 2 : 3,
        stress_level: selectedGoals.includes('mindset') ? 4 : 3,
        spending_awareness: selectedGoals.includes('finance') ? 2 : 3,
        screen_time_struggle: 'sometimes',
        social_activity: selectedGoals.includes('social') ? 2 : 3,
        goals: selectedGoals.map((g) => GOAL_TO_BACKEND[g] || g),
        vaping_drinking: false,
        academic_struggle: goalDetails.school?.[0] || null,
        goal_details: goalDetails,
      }),
    }).catch(() => {});

    onComplete({ name: playerName, goals: selectedGoals, goalDetails, theme });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500"
      style={{ backgroundColor: effectiveStepKey === 'theme' ? '#ffffff' : '#000000' }}
    >
      <div className={`w-full max-w-lg ${effectiveStepKey === 'theme' ? 'text-gray-900' : 'text-white'}`}>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.slice(0, -1).map((s, i) => {
            const isCurrent = i === step;
            const isPast = i < step;
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  isPast ? 'w-6 h-2' : isCurrent ? 'w-8 h-2' : 'w-2 h-2 opacity-30'
                }`}
                style={{ backgroundColor: theme.accent }}
              />
            );
          })}
        </div>

        {/* WELCOME */}
        {effectiveStepKey === 'welcome' && (
          <div className="text-center">
            <div className="text-7xl mb-6">🎮</div>
            <h1 className="text-4xl font-bold mb-3">Game of Life</h1>
            <p className="text-lg mb-8 text-gray-400">
              Your gamified life dashboard. Track habits, crush goals, and level up every day.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-10">
              {['Level Up', 'Daily Streaks', 'Life Score'].map((feat, i) => (
                <div key={i} className="rounded-2xl p-4 text-center bg-white/10 shadow-sm">
                  <div className="text-2xl mb-1">{['⚡', '🔥', '📊'][i]}</div>
                  <p className="text-xs font-medium">{feat}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NAME */}
        {effectiveStepKey === 'name' && (
          <div className="text-center">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-3xl font-bold mb-2">What's your name?</h2>
            <p className="mb-8 text-gray-400">We'll use this to personalize your experience.</p>
            <input
              autoFocus
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && next()}
              className="w-full text-center text-xl py-4 px-6 rounded-2xl border-2 focus:outline-none transition-colors mb-2 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-white/60"
            />
          </div>
        )}

        {/* GOALS */}
        {effectiveStepKey === 'goals' && (
          <div>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎯</div>
              <h2 className="text-3xl font-bold mb-2">What are your goals?</h2>
              <p className="text-gray-400">Pick what you want to improve. We'll build your dashboard around it.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((goal) => {
                const selected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`relative p-4 rounded-2xl text-left transition-all border-2 ${
                      selected ? 'border-white bg-white/20' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    style={selected ? { borderColor: theme.accent } : {}}
                  >
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                    <span className="text-2xl block mb-1">{goal.icon}</span>
                    <p className="font-semibold text-sm">{goal.label}</p>
                    <p className="text-xs mt-0.5 text-gray-400">{goal.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CLARIFY — 3 questions per goal */}
        {effectiveStepKey === 'clarify' && currentQ && (
          <div>
            {/* Overall clarify progress */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <span style={{ color: theme.accent }}>{GOAL_OPTIONS.find(g => g.id === currentGoal)?.icon}</span>
                {GOAL_OPTIONS.find(g => g.id === currentGoal)?.label}
              </span>
              <span className="text-xs text-gray-500">
                {doneClarifySteps + 1} of {totalClarifySteps}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((doneClarifySteps) / totalClarifySteps) * 100}%`, backgroundColor: theme.accent }}
              />
            </div>

            {/* Question dots within current goal */}
            <div className="flex gap-1.5 mb-6">
              {currentQuestions.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ backgroundColor: i <= clarifyQIdx ? theme.accent : 'rgba(255,255,255,0.15)' }}
                />
              ))}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1">{currentQ.question}</h2>
              <p className="text-gray-400 text-sm">This helps us personalize your daily quests.</p>
            </div>

            <div className="flex flex-col gap-3">
              {currentQ.options.map((opt) => {
                const selected = currentAnswer === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectAnswer(opt.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all border-2 ${
                      selected ? 'bg-white/20' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    style={selected ? { borderColor: theme.accent } : {}}
                  >
                    <span className="text-2xl shrink-0">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme.accent }}>
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* THEME */}
        {effectiveStepKey === 'theme' && (
          <div>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎨</div>
              <h2 className="text-3xl font-bold mb-2">Pick your vibe</h2>
              <p className="text-gray-500">Choose a color scheme that motivates you.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    selectedTheme === t.id ? 'shadow-lg scale-105' : 'border-transparent hover:scale-102'
                  } bg-white text-gray-900 shadow-sm`}
                  style={selectedTheme === t.id ? { borderColor: t.accent } : {}}
                >
                  <div className="flex gap-1.5 mb-2">
                    {t.preview.map((c, i) => <div key={i} className={`w-6 h-6 rounded-full ${c}`} />)}
                  </div>
                  <p className="text-sm font-medium text-left">{t.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DONE */}
        {effectiveStepKey === 'done' && (
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

        {/* Nav */}
        {effectiveStepKey !== 'done' && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={back}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm transition-colors ${
                step === 0 ? 'invisible' : effectiveStepKey === 'theme' ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'
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
              {effectiveStepKey === 'clarify' && (clarifyQIdx < currentQuestions.length - 1 || clarifyGoalIdx < goalsToClarify.length - 1)
                ? 'Next'
                : effectiveStepKey === 'theme'
                ? 'Almost there'
                : 'Continue'}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
