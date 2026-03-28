import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const GOAL_OPTIONS = [
  { id: 'school',  label: 'Crush School',    icon: '📚', desc: 'Assignments, exams & study goals' },
  { id: 'fitness', label: 'Get Fit',          icon: '💪', desc: 'Workouts, steps & health habits' },
  { id: 'mindset', label: 'Build Mindset',    icon: '🧠', desc: 'Journaling, mood & gratitude' },
  { id: 'social',  label: 'Grow Socially',    icon: '🤝', desc: 'Friendships & connections' },
  { id: 'finance', label: 'Manage Money',     icon: '💰', desc: 'Budget, spending & savings' },
  { id: 'sleep',   label: 'Sleep Better',     icon: '😴', desc: 'Track & improve sleep quality' },
];

// 3 progressive questions per goal — each answer sharpens Gemini's context
const CLARIFY_QUESTIONS = {
  school: [
    {
      question: "What's your biggest academic challenge?",
      options: [
        { id: 'assignments', icon: '📝', label: 'Staying on top of assignments', desc: 'Deadlines keep sneaking up on me' },
        { id: 'grades',      icon: '📈', label: 'Improving my grades',           desc: 'I know I can do better' },
        { id: 'time',        icon: '⏰', label: 'Time management',                desc: 'Too much to do, too little time' },
        { id: 'anxiety',     icon: '😰', label: 'Test anxiety',                  desc: 'I freeze up during exams' },
      ],
    },
    {
      question: 'How do you usually study?',
      options: [
        { id: 'alone',     icon: '🎧', label: 'Alone with music or noise', desc: 'Headphones in, world out' },
        { id: 'groups',    icon: '👥', label: 'Study groups',              desc: 'Better with other people' },
        { id: 'silent',    icon: '📖', label: 'Total silence',             desc: 'Library or quiet room' },
        { id: 'scattered', icon: '🔀', label: 'No real method',            desc: 'Wherever I happen to be' },
      ],
    },
    {
      question: 'How far ahead do you usually plan?',
      options: [
        { id: 'week',     icon: '📅', label: 'A week ahead',   desc: 'I stay ahead of deadlines' },
        { id: 'day',      icon: '🌅', label: 'Day by day',     desc: 'I plan each morning' },
        { id: 'last-min', icon: '🚨', label: 'Last minute',    desc: 'I work best under pressure' },
        { id: 'reactive', icon: '🤷', label: "I don't plan",   desc: 'Just react to what comes up' },
      ],
    },
  ],
  fitness: [
    {
      question: "What's your main fitness goal?",
      options: [
        { id: 'weight',     icon: '⚖️', label: 'Lose weight',       desc: 'Feel better in my body' },
        { id: 'strength',   icon: '🏋️', label: 'Build strength',     desc: 'Get stronger over time' },
        { id: 'energy',     icon: '⚡', label: 'More energy',        desc: 'Stop feeling drained' },
        { id: 'consistent', icon: '🔄', label: 'Stay consistent',    desc: 'Actually stick to it this time' },
      ],
    },
    {
      question: 'How often do you exercise right now?',
      options: [
        { id: 'never',  icon: '🛋️', label: 'Barely ever',   desc: 'Starting from zero' },
        { id: '1-2x',   icon: '🚶', label: '1–2x a week',   desc: 'Just getting started' },
        { id: '3-4x',   icon: '🏃', label: '3–4x a week',   desc: 'Pretty active' },
        { id: 'daily',  icon: '🔥', label: 'Almost daily',  desc: 'Already consistent' },
      ],
    },
    {
      question: 'What gets in the way most?',
      options: [
        { id: 'time',       icon: '⏰', label: 'Not enough time',           desc: "Too busy to work out" },
        { id: 'motivation', icon: '😴', label: 'Lack of motivation',        desc: "I know I should, but I don't" },
        { id: 'access',     icon: '📍', label: 'No gym or equipment',       desc: 'Location or gear issues' },
        { id: 'knowledge',  icon: '🤔', label: "Don't know where to start", desc: "Unsure what to do" },
      ],
    },
  ],
  mindset: [
    {
      question: 'What do you want to work on mentally?',
      options: [
        { id: 'stress',      icon: '😤', label: 'Reduce stress',           desc: 'Feel less overwhelmed' },
        { id: 'sleep',       icon: '😴', label: 'Better sleep',            desc: 'Wake up actually rested' },
        { id: 'journal',     icon: '✍️', label: 'Journaling & reflection', desc: 'Process my thoughts' },
        { id: 'motivation',  icon: '🔥', label: 'Stay motivated',          desc: 'Stop losing momentum' },
      ],
    },
    {
      question: 'How do you usually handle stress?',
      options: [
        { id: 'exercise', icon: '🏃', label: 'Exercise or walk',      desc: 'Move it out of my body' },
        { id: 'talk',     icon: '💬', label: 'Talk to someone',        desc: 'Process it out loud' },
        { id: 'media',    icon: '📱', label: 'Phone, TV, or gaming',   desc: 'Distract myself' },
        { id: 'nothing',  icon: '🌀', label: 'I just sit with it',     desc: "No real strategy yet" },
      ],
    },
    {
      question: 'How often do you feel overwhelmed?',
      options: [
        { id: 'rarely',    icon: '😊', label: 'Rarely',         desc: 'Usually feel in control' },
        { id: 'sometimes', icon: '😐', label: 'Sometimes',      desc: 'Comes and goes' },
        { id: 'often',     icon: '😟', label: 'Pretty often',   desc: 'Hard to keep up' },
        { id: 'always',    icon: '😵', label: 'Almost always',  desc: 'Constantly overwhelmed' },
      ],
    },
  ],
  social: [
    {
      question: 'What matters most to you socially?',
      options: [
        { id: 'meet',    icon: '👋', label: 'Meet new people',          desc: 'Expand my circle' },
        { id: 'friends', icon: '❤️', label: 'Strengthen friendships',   desc: 'Be a better friend' },
        { id: 'phone',   icon: '📵', label: 'Less phone, more people',  desc: 'Be present in real life' },
        { id: 'goals',   icon: '🎯', label: 'Set social goals',         desc: 'Be intentional about connections' },
      ],
    },
    {
      question: 'How would you describe your social life right now?',
      options: [
        { id: 'active',   icon: '🎉', label: 'Pretty active',       desc: 'I see people regularly' },
        { id: 'small',    icon: '👫', label: 'Small tight circle',   desc: 'Few but solid friendships' },
        { id: 'distant',  icon: '🌧️', label: 'Drifted from friends', desc: 'Used to be more social' },
        { id: 'isolated', icon: '🏠', label: 'Mostly isolated',      desc: 'I want more connection' },
      ],
    },
    {
      question: "What's your biggest social barrier?",
      options: [
        { id: 'anxiety',    icon: '😬', label: 'Social anxiety',          desc: 'I overthink interactions' },
        { id: 'time',       icon: '⏰', label: 'No time',                  desc: "I'm too busy" },
        { id: 'confidence', icon: '🪞', label: 'Confidence',               desc: "I don't know how to connect" },
        { id: 'location',   icon: '📍', label: 'Hard to meet people here', desc: 'Environment is the barrier' },
      ],
    },
  ],
  finance: [
    {
      question: "What's your biggest money challenge?",
      options: [
        { id: 'track',      icon: '📊', label: 'Track my spending',     desc: 'Know where it all goes' },
        { id: 'save',       icon: '🏦', label: 'Save more money',        desc: 'Build a financial cushion' },
        { id: 'debt',       icon: '💳', label: 'Get out of debt',        desc: 'Stop the cycle' },
        { id: 'understand', icon: '🤔', label: 'Understand my finances', desc: 'Feel in control of my money' },
      ],
    },
    {
      question: 'Do you currently have a budget?',
      options: [
        { id: 'yes-follow', icon: '✅', label: 'Yes, and I follow it',  desc: 'Pretty disciplined' },
        { id: 'yes-ignore', icon: '📋', label: 'Yes, but I ignore it',  desc: 'Have one, just forget it' },
        { id: 'thinking',   icon: '💭', label: 'Thinking about it',     desc: 'Want to start one' },
        { id: 'no',         icon: '❌', label: 'No budget at all',       desc: 'Flying blind' },
      ],
    },
    {
      question: "What's your relationship with money right now?",
      options: [
        { id: 'in-control', icon: '😌', label: 'Mostly in control',          desc: 'Could be better, but okay' },
        { id: 'stressed',   icon: '😰', label: 'Stressed about it',           desc: 'Worried regularly' },
        { id: 'avoidant',   icon: '🙈', label: 'I avoid thinking about it',   desc: "It's overwhelming" },
        { id: 'clueless',   icon: '🤷', label: 'No idea where I stand',       desc: "I genuinely don't know" },
      ],
    },
  ],
  sleep: [
    {
      question: "What's your sleep struggle?",
      options: [
        { id: 'schedule', icon: '📅', label: 'Staying on a schedule', desc: 'My bedtime is all over the place' },
        { id: 'falling',  icon: '🌙', label: 'Falling asleep',        desc: "My mind won't quiet down" },
        { id: 'hours',    icon: '⏱️', label: 'Not enough hours',      desc: 'I never get enough sleep' },
        { id: 'quality',  icon: '💤', label: 'Sleep quality',         desc: 'I wake up exhausted anyway' },
      ],
    },
    {
      question: 'What time do you usually go to bed?',
      options: [
        { id: 'before-10', icon: '🌙', label: 'Before 10pm',            desc: 'Early bird' },
        { id: '10-12',     icon: '🕙', label: '10pm – midnight',         desc: 'Normal range' },
        { id: '12-2',      icon: '🕛', label: 'Midnight – 2am',          desc: 'Night owl' },
        { id: 'after-2',   icon: '☀️', label: 'After 2am / no pattern',  desc: 'Very inconsistent' },
      ],
    },
    {
      question: 'What disrupts your sleep most?',
      options: [
        { id: 'phone',    icon: '📱', label: 'Phone before bed',    desc: 'Scrolling keeps me up' },
        { id: 'stress',   icon: '😤', label: 'Racing thoughts',     desc: "Can't stop thinking" },
        { id: 'caffeine', icon: '☕', label: 'Caffeine or food',    desc: 'Late coffee or late snacks' },
        { id: 'env',      icon: '🔊', label: 'Environment',         desc: 'Noise, light, or temperature' },
      ],
    },
  ],
};

const THEMES = [
  { id: 'mint',   label: 'Mint Fresh',   primary: '#6EE7B7', secondary: '#60A5FA', accent: '#2DD4BF', bg: '#F9FAFB', preview: ['bg-emerald-300', 'bg-blue-400',   'bg-teal-400']    },
  { id: 'sunset', label: 'Sunset Vibe',  primary: '#FCA5A5', secondary: '#FDBA74', accent: '#F472B6', bg: '#FFF7ED', preview: ['bg-red-300',     'bg-orange-300', 'bg-pink-400']    },
  { id: 'ocean',  label: 'Deep Ocean',   primary: '#7DD3FC', secondary: '#A5B4FC', accent: '#38BDF8', bg: '#F0F9FF', preview: ['bg-sky-300',     'bg-indigo-300', 'bg-sky-400']     },
  { id: 'forest', label: 'Forest Mode',  primary: '#86EFAC', secondary: '#A3E635', accent: '#34D399', bg: '#F0FDF4', preview: ['bg-green-300',   'bg-lime-400',   'bg-emerald-400'] },
  { id: 'galaxy', label: 'Galaxy Dark',  primary: '#C084FC', secondary: '#818CF8', accent: '#E879F9', bg: '#0F172A', preview: ['bg-purple-400',  'bg-indigo-400', 'bg-fuchsia-400'], dark: true },
  { id: 'candy',  label: 'Candy Pop',    primary: '#F9A8D4', secondary: '#FDE68A', accent: '#6EE7B7', bg: '#FDF2F8', preview: ['bg-pink-300',    'bg-yellow-200', 'bg-emerald-300'] },
];

const GOAL_TO_BACKEND = {
  school: 'better_grades', fitness: 'lose_weight', mindset: 'reduce_stress',
  social: 'be_more_social', finance: 'save_money', sleep: 'sleep_better',
};

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
        goals: selectedGoals.map((g) => GOAL_TO_BACKEND[g] || g).slice(0, 3),
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
