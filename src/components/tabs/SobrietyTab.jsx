import { useState, useEffect } from 'react';
import { Shield, Flame, Award, Heart, Phone, ChevronDown, ChevronUp, Plus, X, Check, AlertTriangle } from 'lucide-react';

const MILESTONES = [
  { days: 1,   label: '1 Day',    icon: '🌱', message: 'First day done. That took courage.' },
  { days: 3,   label: '3 Days',   icon: '💧', message: 'The hardest days are behind you.' },
  { days: 7,   label: '1 Week',   icon: '⭐', message: 'One full week. You should be proud.' },
  { days: 14,  label: '2 Weeks',  icon: '🔥', message: 'Two weeks of choosing yourself.' },
  { days: 30,  label: '1 Month',  icon: '🏅', message: 'A month of strength and clarity.' },
  { days: 60,  label: '2 Months', icon: '🥈', message: 'Two months. Your brain is healing.' },
  { days: 90,  label: '3 Months', icon: '🥇', message: 'Ninety days — a true transformation.' },
  { days: 180, label: '6 Months', icon: '💎', message: 'Six months of a new life.' },
  { days: 365, label: '1 Year',   icon: '👑', message: 'One full year. Legendary.' },
];

const COPING_TIPS = [
  'Take 10 deep breaths — your craving will peak and pass within minutes.',
  'Call or text someone you trust right now.',
  'Go for a 5-minute walk. Change your physical environment.',
  'Drink a full glass of cold water.',
  'Write down exactly how you\'re feeling without judgment.',
  'Do 20 jumping jacks — release the tension physically.',
  'Remind yourself of your #1 reason for quitting.',
  'Listen to a song that grounds you.',
  'Play a game, watch a video — distract for 15 minutes.',
  'Reach out to a support line. That\'s what they\'re there for.',
];

const HOTLINES = [
  { name: 'SAMHSA Helpline', number: '1-800-662-4357', note: 'Free, confidential, 24/7' },
  { name: 'Crisis Text Line', number: 'Text HOME to 741741', note: 'Text anytime' },
  { name: 'AA Hotline', number: '1-800-839-1686', note: '24/7 Alcoholics Anonymous' },
  { name: 'NA Helpline', number: '1-800-662-4357', note: 'Narcotics Anonymous' },
];

function getElapsed(startDate) {
  const now = new Date();
  const start = new Date(startDate);
  const ms = now - start;
  if (ms < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);
  return { days, hours, minutes, seconds, totalDays: days };
}

function useLiveTimer(startDate) {
  const [elapsed, setElapsed] = useState(() => startDate ? getElapsed(startDate) : null);
  useEffect(() => {
    if (!startDate) { setElapsed(null); return; }
    setElapsed(getElapsed(startDate));
    const id = setInterval(() => setElapsed(getElapsed(startDate)), 1000);
    return () => clearInterval(id);
  }, [startDate]);
  return elapsed;
}

export default function SobrietyTab({ theme, userName = 'Player' }) {
  const accent = theme?.accent || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const storageKey = `sobriety_${userName}`;

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      startDate: null,
      substance: '',
      reason: '',
      checkIns: [],        // [{ date: 'YYYY-MM-DD', stayed: true }]
      cravingLog: [],      // [{ date: ISO, note: '' }]
      longestStreak: 0,
    };
  });

  const [setupMode, setSetupMode] = useState(!data.startDate);
  const [substanceInput, setSubstanceInput] = useState(data.substance || '');
  const [reasonInput, setReasonInput] = useState(data.reason || '');
  const [startDateInput, setStartDateInput] = useState(
    data.startDate ? data.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );

  const [showCoping, setShowCoping] = useState(false);
  const [showHotlines, setShowHotlines] = useState(false);
  const [cravingNote, setCravingNote] = useState('');
  const [showCravingInput, setShowCravingInput] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [celebrateMilestone, setCelebrateMilestone] = useState(null);
  const [copingTip, setCopingTip] = useState(COPING_TIPS[0]);

  const elapsed = useLiveTimer(data.startDate);

  const save = (newData) => {
    setData(newData);
    localStorage.setItem(storageKey, JSON.stringify(newData));
  };

  const handleStart = () => {
    if (!startDateInput) return;
    const startISO = new Date(startDateInput + 'T00:00:00').toISOString();
    save({
      ...data,
      startDate: startISO,
      substance: substanceInput.trim() || 'substances',
      reason: reasonInput.trim(),
    });
    setSetupMode(false);
  };

  const handleReset = () => {
    const currentDays = elapsed?.totalDays || 0;
    const newLongest = Math.max(data.longestStreak, currentDays);
    save({ ...data, startDate: new Date().toISOString(), checkIns: [], longestStreak: newLongest });
    setShowResetConfirm(false);
  };

  const logCraving = () => {
    if (!cravingNote.trim()) return;
    const entry = { date: new Date().toISOString(), note: cravingNote.trim() };
    save({ ...data, cravingLog: [entry, ...data.cravingLog].slice(0, 20) });
    setCravingNote('');
    setShowCravingInput(false);
    setCopingTip(COPING_TIPS[Math.floor(Math.random() * COPING_TIPS.length)]);
    setShowCoping(true);
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const checkedInToday = data.checkIns.some(c => c.date === todayKey);

  const checkInToday = (stayed) => {
    if (checkedInToday) return;
    const newCheckIns = [{ date: todayKey, stayed }, ...data.checkIns];
    if (!stayed) {
      // Relapse — reset streak
      const currentDays = elapsed?.totalDays || 0;
      const newLongest = Math.max(data.longestStreak, currentDays);
      save({ ...data, checkIns: newCheckIns, startDate: new Date().toISOString(), longestStreak: newLongest });
    } else {
      save({ ...data, checkIns: newCheckIns });
      // Check if a milestone was just hit
      const days = elapsed?.totalDays || 0;
      const hit = MILESTONES.slice().reverse().find(m => days >= m.days);
      if (hit) setCelebrateMilestone(hit);
    }
  };

  const nextMilestone = elapsed
    ? MILESTONES.find(m => m.days > elapsed.totalDays)
    : MILESTONES[0];

  const achievedMilestones = elapsed
    ? MILESTONES.filter(m => m.days <= elapsed.totalDays)
    : [];

  // ── Setup screen ──
  if (setupMode) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="text-center mb-8 mt-4">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-2xl font-bold text-dark">Sobriety Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Every day clean is a victory worth counting.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-dark block mb-1.5">What are you quitting?</label>
            <input
              type="text"
              placeholder="e.g. alcohol, weed, nicotine..."
              value={substanceInput}
              onChange={e => setSubstanceInput(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark block mb-1.5">When did you start / when do you want to start?</label>
            <input
              type="date"
              value={startDateInput}
              onChange={e => setStartDateInput(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark block mb-1.5">Your reason (optional)</label>
            <textarea
              placeholder="Why are you doing this? Write it for yourself..."
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!startDateInput}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
          >
            Start My Journey
          </button>
        </div>
      </div>
    );
  }

  // ── Main tracker ──
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">

      {/* Milestone celebration modal */}
      {celebrateMilestone && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-3 animate-bounce">{celebrateMilestone.icon}</div>
            <h2 className="text-2xl font-bold text-dark mb-2">{celebrateMilestone.label} Clean!</h2>
            <p className="text-gray-500 mb-6">{celebrateMilestone.message}</p>
            <button
              onClick={() => setCelebrateMilestone(null)}
              className="w-full py-3 rounded-xl text-white font-semibold"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
            >
              Keep Going 💪
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Sobriety</h1>
          <p className="text-gray-500 text-sm">Free from {data.substance}</p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
        >
          Log relapse
        </button>
      </div>

      {/* Reset confirm */}
      {showResetConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700 font-medium mb-1">Reset your streak?</p>
          <p className="text-xs text-red-500 mb-3">Your longest streak will be saved. Starting over is still progress.</p>
          <div className="flex gap-2">
            <button onClick={handleReset} className="flex-1 py-2 bg-red-500 text-white text-sm font-medium rounded-xl">Yes, reset</button>
            <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 bg-white text-gray-600 text-sm font-medium rounded-xl border border-gray-200">Cancel</button>
          </div>
        </div>
      )}

      {/* Live counter */}
      <div
        className="rounded-3xl p-6 text-white text-center shadow-lg"
        style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield size={20} className="opacity-80" />
          <span className="text-sm font-medium opacity-90">Days Clean</span>
        </div>
        <div className="text-7xl font-bold mb-1 tabular-nums">{elapsed?.days ?? 0}</div>
        <div className="flex justify-center gap-6 text-sm opacity-80 tabular-nums">
          <span>{String(elapsed?.hours ?? 0).padStart(2, '0')}h</span>
          <span>{String(elapsed?.minutes ?? 0).padStart(2, '0')}m</span>
          <span>{String(elapsed?.seconds ?? 0).padStart(2, '0')}s</span>
        </div>
        {data.reason && (
          <p className="text-xs opacity-70 mt-4 italic max-w-xs mx-auto">"{data.reason}"</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-dark">{Math.max(data.longestStreak, elapsed?.totalDays || 0)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Longest Streak</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-dark">{achievedMilestones.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Milestones Hit</p>
        </div>
      </div>

      {/* Today's check-in */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-dark text-sm mb-3">Today's Check-In</h3>
        {checkedInToday ? (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Check size={16} />
            <span>Checked in for today. Keep going!</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">Did you stay clean today?</p>
            <div className="flex gap-2">
              <button
                onClick={() => checkInToday(true)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
              >
                ✓ Yes, I stayed clean
              </button>
              <button
                onClick={() => checkInToday(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                I slipped up
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Next milestone */}
      {nextMilestone && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-dark text-sm">Next Milestone</h3>
            <span className="text-lg">{nextMilestone.icon}</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{nextMilestone.label} — {nextMilestone.message}</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((elapsed?.totalDays || 0) / nextMilestone.days) * 100)}%`,
                background: `linear-gradient(to right, ${primary}, ${accent})`,
              }}
            />
          </div>
          <p className="text-xs text-gray-400 text-right mt-1">
            {elapsed?.totalDays || 0} / {nextMilestone.days} days
          </p>
        </div>
      )}

      {/* Craving SOS */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            <h3 className="font-semibold text-dark text-sm">Feeling a Craving?</h3>
          </div>
          <button
            onClick={() => setShowCravingInput(!showCravingInput)}
            className="text-xs px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 font-medium hover:bg-orange-100 transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Log it
          </button>
        </div>

        {showCravingInput && (
          <div className="mb-3">
            <textarea
              placeholder="What's triggering this craving? Writing it down helps..."
              value={cravingNote}
              onChange={e => setCravingNote(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-300 resize-none mb-2"
            />
            <div className="flex gap-2">
              <button onClick={logCraving} className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors">
                Log & get tip
              </button>
              <button onClick={() => setShowCravingInput(false)} className="px-3 py-2 text-gray-400 text-sm rounded-xl hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Coping tip */}
        <button
          onClick={() => setShowCoping(!showCoping)}
          className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-dark transition-colors"
        >
          <span className="font-medium">Coping strategies</span>
          {showCoping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showCoping && (
          <div className="mt-3 space-y-2">
            {COPING_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                <span className="text-base shrink-0">{['🌬️','📞','🚶','💧','✍️','🤸','💭','🎵','📱','🆘'][i]}</span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestones achieved */}
      {achievedMilestones.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-3">Milestones Achieved</h3>
          <div className="flex flex-wrap gap-2">
            {achievedMilestones.map(m => (
              <div
                key={m.days}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-100"
              >
                <span>{m.icon}</span>
                <span className="text-dark">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Craving history */}
      {data.cravingLog.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-3">Craving Log</h3>
          <div className="space-y-2">
            {data.cravingLog.slice(0, 5).map((entry, i) => (
              <div key={i} className="text-sm bg-gray-50 rounded-xl p-3">
                <p className="text-gray-700">{entry.note}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(entry.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency support */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <button
          onClick={() => setShowHotlines(!showHotlines)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-red-400" />
            <h3 className="font-semibold text-dark text-sm">Emergency Support</h3>
          </div>
          {showHotlines ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showHotlines && (
          <div className="mt-3 space-y-2">
            {HOTLINES.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-dark">{h.name}</p>
                  <p className="text-xs text-gray-500">{h.note}</p>
                </div>
                <a
                  href={`tel:${h.number.replace(/\D/g, '')}`}
                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  {h.number}
                </a>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center pt-1">
              You don't have to do this alone. These lines are free and confidential.
            </p>
          </div>
        )}
      </div>

      {/* Edit goals button */}
      <button
        onClick={() => setSetupMode(true)}
        className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Edit substance / start date
      </button>
    </div>
  );
}
