import { useState } from 'react';
import { Moon, Plus, Trash2 } from 'lucide-react';
import { useTabData } from '../../hooks/useTabData';

const SLEEP_TIPS = {
  schedule: {
    headline: 'Building a sleep schedule',
    tips: [
      'Set one consistent wake time — even on weekends. This anchors your body clock.',
      'Work backwards from your wake time to find your ideal bedtime.',
      'Dim your lights 1 hour before bed. Light is the biggest circadian disruptor.',
    ],
  },
  falling: {
    headline: 'Falling asleep faster',
    tips: [
      'Try 4-7-8 breathing: inhale 4s → hold 7s → exhale 8s. Repeat 4 times.',
      'Keep your room cool — 65–68°F is the optimal sleep temperature.',
      'Write down tomorrow\'s to-do list before bed to offload mental loops.',
    ],
  },
  hours: {
    headline: 'Getting enough sleep',
    tips: [
      'Protect your sleep window like a meeting — block the time on your calendar.',
      'A 20-minute nap before 3pm can recover 1–2 hours of lost sleep.',
      'Cut caffeine after 2pm — it has a 6-hour half-life in your system.',
    ],
  },
  quality: {
    headline: 'Improving sleep quality',
    tips: [
      'Blackout curtains make more difference than most people expect. Try them.',
      'Avoid alcohol before bed — it fragments sleep even if it feels sedating.',
      'Morning sunlight within 30 minutes of waking resets your circadian rhythm.',
    ],
  },
};

const BEDTIME_CONTEXT = {
  'before-10': 'You go to bed early — protecting that window from late-night scrolling is worth it.',
  '10-12':     'A 10pm–midnight bedtime is a solid range. Consistency matters more than exact time.',
  '12-2':      'Midnight–2am bedtime often signals delayed circadian phase. Morning light can help shift it earlier.',
  'after-2':   'Very late or irregular bedtime is hard on your body. Even shifting 30 minutes earlier per week helps.',
};

const DISRUPTOR_CONTEXT = {
  phone:    '📱 Set your phone to grayscale after 9pm — color makes apps more stimulating.',
  stress:   '😤 Try a "brain dump" before bed: write every worry on paper to clear your mental RAM.',
  caffeine: '☕ Track your last caffeine and push it 30 minutes earlier each week.',
  env:      '🔊 White noise, earplugs, or blackout curtains are high-ROI fixes for an imperfect environment.',
};

const QUALITY_COLORS = {
  1: 'text-red-500 bg-red-50 border-red-200',
  2: 'text-orange-500 bg-orange-50 border-orange-200',
  3: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  4: 'text-green-600 bg-green-50 border-green-200',
  5: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

const QUALITY_LABELS = { 1: 'Terrible', 2: 'Poor', 3: 'Okay', 4: 'Good', 5: 'Great' };

export default function SleepTab({ profile, userId }) {
  const [entries, setEntries] = useTabData(userId, 'sleep', []);
  const [showAdd, setShowAdd] = useState(false);
  const [newHours, setNewHours]     = useState('');
  const [newQuality, setNewQuality] = useState(3);
  const [newNote, setNewNote]       = useState('');

  const sleepDetails = profile?.goalDetails?.sleep;
  const struggle   = sleepDetails?.[0];
  const bedtime    = sleepDetails?.[1];
  const disruptor  = sleepDetails?.[2];
  const tips       = SLEEP_TIPS[struggle] ?? null;

  const handleAdd = () => {
    if (!newHours) return;
    const entry = {
      id: Date.now(),
      hours: parseFloat(newHours),
      quality: newQuality,
      note: newNote.trim(),
      date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
    setEntries((prev) => [entry, ...prev]);
    setNewHours('');
    setNewQuality(3);
    setNewNote('');
    setShowAdd(false);
  };

  const handleDelete = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const avgHours  = entries.length > 0 ? (entries.reduce((s, e) => s + e.hours, 0) / entries.length).toFixed(1) : null;
  const avgQuality = entries.length > 0 ? (entries.reduce((s, e) => s + e.quality, 0) / entries.length).toFixed(1) : null;
  const last7 = entries.slice(0, 7);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Personalized tips */}
      {tips && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4 border-indigo-400">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Based on what you shared</span>
          <h2 className="text-lg font-bold text-dark mt-1 mb-3">{tips.headline}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {tips.tips.map((tip, i) => (
              <div key={i} className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-900">
                <span className="font-bold mr-1">{i + 1}.</span>{tip}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {bedtime && BEDTIME_CONTEXT[bedtime] && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Bedtime: </span>{BEDTIME_CONTEXT[bedtime]}
              </div>
            )}
            {disruptor && DISRUPTOR_CONTEXT[disruptor] && (
              <div className="flex-1 bg-indigo-50 rounded-xl px-3 py-2 text-xs text-indigo-800">
                <span className="font-semibold">Disruptor: </span>{DISRUPTOR_CONTEXT[disruptor]}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Sleep</h1>
          <p className="text-gray-500 text-sm">Track your sleep to find what actually helps</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Log Night
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-primary">
          <h3 className="font-semibold text-dark mb-3">Log Last Night</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="Hours slept (e.g. 7.5)"
              value={newHours}
              onChange={(e) => setNewHours(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <select
              value={newQuality}
              onChange={(e) => setNewQuality(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              {[1, 2, 3, 4, 5].map((q) => (
                <option key={q} value={q}>{q} — {QUALITY_LABELS[q]}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Note (optional)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">Add</button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}

      {/* Stats + log */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-2">😴</div>
          <p className="text-sm text-gray-400">No sleep logged yet.</p>
          <p className="text-xs text-gray-300 mt-1">Log your first night with the button above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Averages */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <Moon size={24} className="text-indigo-400 mx-auto mb-1" />
              <p className="text-3xl font-bold text-dark">{avgHours}h</p>
              <p className="text-xs text-gray-400 mt-1">avg per night</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-dark">{avgQuality}/5</p>
              <p className="text-xs text-gray-400 mt-1">avg quality</p>
            </div>
          </div>

          {/* Recent bar chart */}
          {last7.length > 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-dark text-sm mb-4">Last {last7.length} nights</h3>
              <div className="flex items-end gap-2 h-24">
                {[...last7].reverse().map((e) => {
                  const pct = Math.min(100, (e.hours / 10) * 100);
                  return (
                    <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-indigo-100 rounded-t-lg relative" style={{ height: `${pct}%` }}>
                        <div className="absolute inset-x-0 bottom-0 bg-indigo-400 rounded-t-lg" style={{ height: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{e.hours}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Log list */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-dark text-sm mb-3">Sleep Log</h3>
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-dark">{e.hours}h</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${QUALITY_COLORS[e.quality]}`}>
                        {QUALITY_LABELS[e.quality]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{e.date}{e.note ? ` · ${e.note}` : ''}</p>
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
