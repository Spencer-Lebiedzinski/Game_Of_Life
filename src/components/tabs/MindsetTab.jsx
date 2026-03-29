import { useState } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { useTabData } from '../../hooks/useTabData';
import { normalizeMindsetData } from '../../utils/tabDataShapes';

const moods = [
  { emoji: '😔', label: 'Low',     value: 1 },
  { emoji: '😐', label: 'Okay',    value: 2 },
  { emoji: '🙂', label: 'Good',    value: 3 },
  { emoji: '😊', label: 'Great',   value: 4 },
  { emoji: '🤩', label: 'Amazing', value: 5 },
];

const MINDSET_PROMPTS = {
  stress: [
    'What drained you most today — and can you reduce it tomorrow?',
    'Name one thing you can let go of right now.',
    'What would your calmest self tell you today?',
  ],
  sleep: [
    'What will you do differently tonight to sleep better?',
    'Rate your energy today 1–10. What affected it most?',
    'What can you cut from your evening to protect your sleep?',
  ],
  journal: [
    'What\'s one moment today worth remembering?',
    'What did you learn about yourself this week?',
    'If today was a chapter in your life story, what would it be called?',
  ],
  motivation: [
    'What\'s one small win from today, however tiny?',
    'What would tomorrow look like if you were fully motivated?',
    'What\'s the one thing you keep avoiding that would change everything?',
  ],
};

const DEFAULT_PROMPTS = [
  'What went well today?',
  'What would you do differently?',
  'What are you grateful for right now?',
  'What\'s one thing you can do tomorrow to move forward?',
  'How did you take care of yourself today?',
];

const MINDSET_CONTEXT = {
  stress:     { headline: 'Stress Reduction', tip: 'Stress compounds when unnamed. Writing it down tends to shrink it.' },
  sleep:      { headline: 'Sleep & Recovery', tip: 'What you think about before bed sets your nervous system state for the night.' },
  journal:    { headline: 'Reflection Practice', tip: 'The goal isn\'t perfect prose — it\'s honest observation.' },
  motivation: { headline: 'Building Momentum', tip: 'Motivation follows action, not the other way around. Start small.' },
};

const COPING_CONTEXT = {
  exercise: '💪 Movement is your go-to — scheduling it before stress hits, not after, tends to work better.',
  talk:     '💬 You process by talking — identifying one person you can reliably call on hard days helps.',
  media:    '📱 Distraction works short-term. Having one active coping tool ready for hard days is worth building.',
  nothing:  '🌀 Try 4-7-8 breathing when overwhelm hits: inhale 4s → hold 7s → exhale 8s.',
};

const OVERWHELM_CONTEXT = {
  rarely:    'You handle pressure well. Mindset work at this level is about staying sharp, not firefighting.',
  sometimes: 'Occasional overwhelm is normal. Building a short reset routine for bad days is worth having.',
  often:     'Frequent overwhelm can signal too much input. Pruning one commitment is often more effective than adding another habit.',
  always:    'Constant overwhelm deserves real attention — one fewer commitment this week might matter more than any new technique.',
};

export default function MindsetTab({ profile, userId }) {
  const [rawPersisted, setPersisted] = useTabData(userId, 'mindset', {
    reflection: '',
    gratitude: ['', '', ''],
    intention: '',
  });
  const [selectedMood, setSelectedMood] = useState(3);
  const [promptIdx, setPromptIdx]       = useState(0);
  const [saved, setSaved]               = useState(false);
  const persisted = normalizeMindsetData(rawPersisted);

  const reflection = persisted.reflection ?? '';
  const gratitude  = persisted.gratitude  ?? ['', '', ''];
  const intention  = persisted.intention  ?? '';
  const todaysPrompt = persisted.prompts?.[0];
  const promptDone = Boolean(todaysPrompt?.done);

  const setReflection = (val) => setPersisted((p) => ({ ...p, reflection: val }));
  const setGratitude  = (updater) => setPersisted((p) => ({
    ...p,
    gratitude: typeof updater === 'function' ? updater(p.gratitude ?? ['', '', '']) : updater,
  }));
  const setIntention  = (val) => setPersisted((p) => ({ ...p, intention: val }));

  const mindsetDetails = profile?.goalDetails?.mindset;
  const mindsetGoal = mindsetDetails?.[0];
  const copingStyle = mindsetDetails?.[1];
  const overwhelm   = mindsetDetails?.[2];
  const context     = MINDSET_CONTEXT[mindsetGoal] ?? null;
  const prompts     = MINDSET_PROMPTS[mindsetGoal] ?? DEFAULT_PROMPTS;

  const nextPrompt = () => {
    if (todaysPrompt) return;
    setPromptIdx((i) => (i + 1) % prompts.length);
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

      {/* Personalized context card */}
      {context && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4 border-purple-400">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Based on what you shared</span>
          <h2 className="text-lg font-bold text-dark mt-1 mb-1">{context.headline}</h2>
          <p className="text-sm text-gray-500 italic mb-3">"{context.tip}"</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {copingStyle && COPING_CONTEXT[copingStyle] && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Coping style: </span>{COPING_CONTEXT[copingStyle]}
              </div>
            )}
            {overwhelm && OVERWHELM_CONTEXT[overwhelm] && (
              <div className="flex-1 bg-purple-50 rounded-xl px-3 py-2 text-xs text-purple-800">
                <span className="font-semibold">Overwhelm: </span>{OVERWHELM_CONTEXT[overwhelm]}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Prompt */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark">Daily Prompt</h3>
            <button onClick={nextPrompt} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Next prompt">
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 mb-4 border border-purple-100">
            <p className="text-lg font-medium text-dark text-center">
              {todaysPrompt?.prompt || prompts[promptIdx % prompts.length]}
            </p>
          </div>
          <button
            disabled
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
              promptDone ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <CheckCircle size={16} />
            {promptDone ? 'Done in Today\'s Plan' : todaysPrompt ? 'Complete from Today\'s Plan' : 'Use Today\'s Plan to complete this'}
          </button>
          {todaysPrompt && (
            <p className="text-xs text-gray-400 text-center mt-2">
              This prompt is linked to the dashboard and stays synced here.
            </p>
          )}
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
          <input
            type="range" min={1} max={5} value={selectedMood}
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
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${saved ? 'bg-accent text-white' : 'bg-dark text-white hover:opacity-90'}`}
            >
              {saved ? 'Saved!' : 'Save Entry'}
            </button>
          </div>
        </div>

        {/* Gratitude */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-5 border border-green-100">
          <h3 className="font-semibold text-dark mb-3">3 Good Things Today</h3>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-accent shadow-sm shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={gratitude[i]}
                  onChange={(e) => setGratitude((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                  placeholder={`Something good #${i + 1}...`}
                  className="flex-1 bg-white border border-green-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Intention */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
          <h3 className="font-semibold text-dark mb-1">Tomorrow's Intention</h3>
          <p className="text-xs text-gray-400 mb-3">One thing you want to focus on tomorrow.</p>
          <textarea
            rows={4}
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Tomorrow I want to..."
            className="w-full bg-white border border-purple-100 rounded-xl p-3 text-sm focus:outline-none focus:border-accent resize-none text-dark placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
