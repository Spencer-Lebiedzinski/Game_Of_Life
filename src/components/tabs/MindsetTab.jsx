import { useState } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { mindsetPrompts } from '../../data/mockData';

const moods = [
  { emoji: '😔', label: 'Low', value: 1 },
  { emoji: '😐', label: 'Okay', value: 2 },
  { emoji: '🙂', label: 'Good', value: 3 },
  { emoji: '😊', label: 'Great', value: 4 },
  { emoji: '🤩', label: 'Amazing', value: 5 },
];

const MINDSET_FOCUS = {
  stress: {
    headline: 'Stress Reduction Protocol',
    prompts: ['What drained you most today — and can you reduce it tomorrow?', 'Name one thing you can let go of right now.', 'What would your calmest self tell you today?'],
    tip: 'Stress compounds when unnamed. Writing it down shrinks it.',
  },
  sleep: {
    headline: 'Sleep Optimization Mindset',
    prompts: ['What will you do differently tonight to sleep better?', 'Rate your energy today 1–10. What affected it most?', 'What can you cut from your evening to protect your sleep?'],
    tip: 'Your thoughts before bed set your nervous system state for the night.',
  },
  journal: {
    headline: 'Reflection Practice',
    prompts: ['What\'s one moment today worth remembering?', 'What did you learn about yourself this week?', 'If today was a chapter title in your life story, what would it be called?'],
    tip: 'The goal isn\'t perfect prose — it\'s honest observation.',
  },
  motivation: {
    headline: 'Momentum Building',
    prompts: ['What\'s one small win from today, however tiny?', 'What would tomorrow look like if you were fully motivated?', 'What is the one thing you keep avoiding that would change everything?'],
    tip: 'Motivation follows action, not the other way around. Start small.',
  },
};

const STRESS_COPE_TIPS = {
  exercise:  '💪 Your go-to is movement — schedule it before stress hits, not after.',
  talk:      '💬 You process by talking — identify one person you can call on hard days.',
  media:     '📱 Distraction works short-term. Add one active coping tool for the hard days.',
  nothing:   '🌀 No strategy yet — try 4-7-8 breathing: in 4s, hold 7s, out 8s.',
};

const OVERWHELM_TIPS = {
  rarely:    'You handle pressure well. Use mindset work to stay sharp at the top.',
  sometimes: 'Occasional overwhelm is normal. Build a reset routine for bad days.',
  often:     'Frequent overwhelm suggests too much input. Time to prune commitments.',
  always:    'Constant overwhelm needs immediate attention — start with one fewer commitment.',
};

export default function MindsetTab({ profile }) {
  const [selectedMood, setSelectedMood] = useState(3);
  const [reflection, setReflection] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptDone, setPromptDone] = useState(false);
  const [saved, setSaved] = useState(false);

  const mindsetDetails = profile?.goalDetails?.mindset;
  const mindsetGoal  = mindsetDetails?.[0];
  const copingStyle  = mindsetDetails?.[1];
  const overwhelm    = mindsetDetails?.[2];
  const focus        = MINDSET_FOCUS[mindsetGoal] ?? null;

  // Use personalized prompts if available, fall back to mock data
  const activePrompts = focus ? focus.prompts : mindsetPrompts;

  const nextPrompt = () => {
    setPromptIdx((i) => (i + 1) % mindsetPrompts.length);
    setPromptDone(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Mindset</h1>
        <p className="text-gray-500 text-sm">Daily prompts, mood tracking & reflection</p>
      </div>

      {/* Personalized insight card */}
      {focus && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4 border-purple-400">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Focus</span>
          <h2 className="text-lg font-bold text-dark mt-1 mb-1">{focus.headline}</h2>
          <p className="text-sm text-gray-500 italic mb-3">"{focus.tip}"</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {copingStyle && STRESS_COPE_TIPS[copingStyle] && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Your coping style: </span>{STRESS_COPE_TIPS[copingStyle]}
              </div>
            )}
            {overwhelm && OVERWHELM_TIPS[overwhelm] && (
              <div className="flex-1 bg-purple-50 rounded-xl px-3 py-2 text-xs text-purple-800">
                <span className="font-semibold">Overwhelm level: </span>{OVERWHELM_TIPS[overwhelm]}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Prompt */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark">Daily Challenge</h3>
            <button
              onClick={nextPrompt}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="Next prompt"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 mb-4 border border-purple-100">
            <p className="text-lg font-medium text-dark text-center">
              {activePrompts[promptIdx % activePrompts.length]}
            </p>
          </div>

          <button
            onClick={() => setPromptDone(!promptDone)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
              promptDone
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-primary hover:text-dark'
            }`}
          >
            <CheckCircle size={16} />
            {promptDone ? 'Done! +50 XP' : 'Mark Complete'}
          </button>
        </div>

        {/* Mood Tracker */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-dark mb-4">How are you feeling?</h3>
          <div className="flex justify-between mb-4">
            {moods.map((m) => (
              <button
                key={m.value}
                onClick={() => setSelectedMood(m.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  selectedMood === m.value
                    ? 'bg-yellow-50 scale-110 border-2 border-yellow-300'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className={`text-xs ${selectedMood === m.value ? 'text-yellow-700 font-semibold' : 'text-gray-400'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* Mood slider */}
          <input
            type="range"
            min={1}
            max={5}
            value={selectedMood}
            onChange={(e) => setSelectedMood(Number(e.target.value))}
            className="w-full accent-yellow-400 h-2"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Low</span>
            <span>Amazing</span>
          </div>
        </div>

        {/* Reflection */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
          <h3 className="font-semibold text-dark mb-3">Daily Reflection</h3>
          <p className="text-xs text-gray-500 mb-3">What happened today? What are you grateful for?</p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write your thoughts here..."
            rows={5}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-accent resize-none text-dark placeholder-gray-400"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">{reflection.length} characters</span>
            <button
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                saved
                  ? 'bg-accent text-white'
                  : 'bg-dark text-white hover:opacity-90'
              }`}
            >
              {saved ? 'Saved!' : 'Save Entry'}
            </button>
          </div>
        </div>

        {/* Gratitude */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-5 border border-green-100">
          <h3 className="font-semibold text-dark mb-3">3 Good Things Today</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-accent shadow-sm shrink-0">
                  {n}
                </span>
                <input
                  type="text"
                  placeholder={`Something good #${n}...`}
                  className="flex-1 bg-white border border-green-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Social prompt */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
          <h3 className="font-semibold text-dark mb-3">Social Connection</h3>
          <div className="space-y-2">
            {[
              { text: "Compliment someone", done: false },
              { text: "Talk to a friend", done: true },
              { text: "Help someone today", done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-purple-100">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-accent' : 'border-2 border-gray-200'}`}>
                  {item.done && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-dark'}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
