import { useState } from 'react';
import { CheckCircle, Circle, Timer, AlertCircle, Plus } from 'lucide-react';

const priorityColors = {
  high:   'text-red-500 bg-red-50 border-red-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low:    'text-green-600 bg-green-50 border-green-200',
};

const STUDY_TIPS = {
  assignments: {
    headline: 'Staying on top of assignments',
    tips: [
      'List every assignment at the start of each week so nothing sneaks up on you.',
      'Break each assignment into 3 smaller tasks — "study for exam" is too vague.',
      'Set a personal due date 2 days before the real one as a buffer.',
    ],
  },
  grades: {
    headline: 'Improving your grades',
    tips: [
      'Visit office hours even once — professors remember students who show up.',
      'Review every graded test or paper immediately after getting it back.',
      'Target your weakest subject first each week, not the easiest one.',
    ],
  },
  time: {
    headline: 'Managing your time better',
    tips: [
      'Time-block your calendar in 90-minute focused study sessions.',
      'Protect at least two distraction-free blocks per day.',
      'Do a Sunday audit — where did your time actually go last week?',
    ],
  },
  anxiety: {
    headline: 'Working through test anxiety',
    tips: [
      'Practice under timed conditions weekly, not just the night before.',
      'Box breathe before exams: 4s in → 4s hold → 4s out.',
      'Anxiety and excitement feel the same physiologically — try calling it excitement.',
    ],
  },
};

const STUDY_STYLE_CONTEXT = {
  alone:     'You study best alone — protect focus blocks like you would a meeting.',
  groups:    'Use study groups for reviewing material, and solo time for learning it first.',
  silent:    'Try booking the same library spot every session — environment becomes a trigger.',
  scattered: 'Picking one consistent location and time can anchor the habit for you.',
};

const PLANNING_CONTEXT = {
  week:      'Since you plan ahead, a Sunday review habit can keep it tight.',
  day:       'Daily planning works well. A quick 5-minute morning session to lock in priorities helps.',
  'last-min': 'You thrive under pressure — channeling that with fake deadlines 2 days early might help.',
  reactive:  'Try starting each morning with just one question: what\'s the single most important task today?',
};

export default function SchoolTab({ profile }) {
  const [assignments, setAssignments] = useState([]);
  const [showAdd, setShowAdd]         = useState(false);
  const [newTitle, setNewTitle]       = useState('');
  const [newDue, setNewDue]           = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [timerActive, setTimerActive] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRef, setTimerRef]       = useState(null);

  const toggleDone = (id) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a)));
  };

  const handleAddAssignment = () => {
    if (!newTitle.trim()) return;
    setAssignments((prev) => [
      ...prev,
      { id: Date.now(), title: newTitle.trim(), due: newDue || 'No date', progress: 0, done: false, priority: newPriority },
    ]);
    setNewTitle('');
    setNewDue('');
    setNewPriority('medium');
    setShowAdd(false);
  };

  const startTimer = (id) => {
    if (timerActive === id) {
      clearInterval(timerRef);
      setTimerActive(null);
      setTimerSeconds(0);
    } else {
      if (timerRef) clearInterval(timerRef);
      setTimerActive(id);
      setTimerSeconds(0);
      const ref = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
      setTimerRef(ref);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const completedCount = assignments.filter((a) => a.done).length;

  const schoolDetails = profile?.goalDetails?.school;
  const challenge  = schoolDetails?.[0];
  const studyStyle = schoolDetails?.[1];
  const planning   = schoolDetails?.[2];
  const tips       = STUDY_TIPS[challenge] ?? null;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Personalized tips — framed as suggestions */}
      {tips && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4 border-blue-400">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Based on what you shared</span>
          <h2 className="text-lg font-bold text-dark mt-1 mb-3">{tips.headline}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {tips.tips.map((tip, i) => (
              <div key={i} className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
                <span className="font-bold mr-1">{i + 1}.</span>{tip}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {studyStyle && STUDY_STYLE_CONTEXT[studyStyle] && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Study style: </span>{STUDY_STYLE_CONTEXT[studyStyle]}
              </div>
            )}
            {planning && PLANNING_CONTEXT[planning] && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Planning: </span>{PLANNING_CONTEXT[planning]}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">School</h1>
          <p className="text-gray-500 text-sm">{completedCount}/{assignments.length} assignments done</p>
        </div>
        <div className="flex items-center gap-2">
          {assignments.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2">
              <AlertCircle size={16} className="text-blue-500" />
              <span className="text-sm text-blue-700 font-medium">
                {assignments.filter((a) => !a.done).length} pending
              </span>
            </div>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-primary">
          <h3 className="font-semibold text-dark mb-3">Add Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Assignment name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="Due date (e.g. Apr 5)"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddAssignment} className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">Add</button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}

      {/* Progress bar — only shown when there are assignments */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-dark text-sm mb-3">Overall Progress</h3>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-secondary to-accent rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / assignments.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">{Math.round((completedCount / assignments.length) * 100)}%</p>
        </div>
      )}

      {/* Assignments list */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-sm text-gray-400">No assignments yet.</p>
          <p className="text-xs text-gray-300 mt-1">Add your first one with the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className={`bg-white rounded-2xl shadow-sm p-4 transition-all ${a.done ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleDone(a.id)} className="mt-0.5 shrink-0">
                  {a.done
                    ? <CheckCircle size={22} className="text-accent" />
                    : <Circle size={22} className="text-gray-300 hover:text-accent transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className={`font-medium text-sm ${a.done ? 'line-through text-gray-400' : 'text-dark'}`}>{a.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${priorityColors[a.priority]}`}>
                      {a.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Due {a.due}</p>
                  {!a.done && (
                    <button
                      onClick={() => startTimer(a.id)}
                      className={`mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-all ${
                        timerActive === a.id
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <Timer size={12} />
                      {timerActive === a.id ? `Stop • ${formatTime(timerSeconds)}` : 'Start Study Timer'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
