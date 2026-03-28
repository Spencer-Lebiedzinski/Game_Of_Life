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

export default function MindsetTab() {
  const [selectedMood, setSelectedMood] = useState(3);
  const [reflection, setReflection] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptDone, setPromptDone] = useState(false);
  const [saved, setSaved] = useState(false);

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
              {mindsetPrompts[promptIdx]}
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
