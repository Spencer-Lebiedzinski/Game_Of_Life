import { useState } from 'react';
import { CheckCircle, Circle, Timer, AlertCircle } from 'lucide-react';
import { assignments as initialAssignments } from '../../data/mockData';

const priorityColors = {
  high: 'text-red-500 bg-red-50 border-red-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low: 'text-green-600 bg-green-50 border-green-200',
};

const STUDY_STRATEGIES = {
  assignments: {
    headline: 'Tame the Assignment Pile',
    tips: ['List every assignment at the start of the week', 'Break each into 3 micro-tasks', 'Set a personal due date 2 days early'],
  },
  grades: {
    headline: 'Grade Improvement System',
    tips: ['Visit office hours once per week', 'Review every test immediately after getting it back', 'Target your weakest subject first each week'],
  },
  time: {
    headline: 'Time Ownership',
    tips: ['Time-block your calendar in 90-min study sessions', 'Protect 2 deep-work blocks per day from distractions', 'Audit your week every Sunday — where did the time go?'],
  },
  anxiety: {
    headline: 'Conquer Test Anxiety',
    tips: ['Practice under timed conditions weekly, not just before tests', 'Box breathe before exams: 4s in, 4s hold, 4s out', 'Reframe: anxiety and excitement feel identical — call it excitement'],
  },
};

const STUDY_STYLE_TIPS = {
  alone:    'You work best alone — protect your focus blocks like meetings.',
  groups:   'Use study groups for review, solo time for initial learning.',
  silent:   'Book the same library spot every day — environment becomes a cue.',
  scattered: 'Pick one consistent location and time to anchor your study habit.',
};

const PLANNING_TIPS = {
  week:     'You plan ahead — great. Set a Sunday review habit to keep it tight.',
  day:      'Daily planning works. Add a 5-min morning session to lock in priorities.',
  'last-min': 'You thrive under pressure — channel it. Set fake deadlines 2 days early.',
  reactive:  'Start with just one thing each morning: what\'s the one task that matters most?',
};

export default function SchoolTab({ profile }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [timerActive, setTimerActive] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRef, setTimerRef] = useState(null);

  const toggleDone = (id) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
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
  const challenge = schoolDetails?.[0];
  const studyStyle = schoolDetails?.[1];
  const planning  = schoolDetails?.[2];
  const strategy  = STUDY_STRATEGIES[challenge] ?? null;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Personalized strategy card */}
      {strategy && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4 border-blue-400">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Study Strategy</span>
          <h2 className="text-lg font-bold text-dark mt-1 mb-3">{strategy.headline}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {strategy.tips.map((tip, i) => (
              <div key={i} className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
                <span className="font-bold mr-1">{i + 1}.</span>{tip}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {studyStyle && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Study style: </span>{STUDY_STYLE_TIPS[studyStyle]}
              </div>
            )}
            {planning && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Planning: </span>{PLANNING_TIPS[planning]}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">School</h1>
          <p className="text-gray-500 text-sm">{completedCount}/{assignments.length} assignments completed</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2">
          <AlertCircle size={16} className="text-blue-500" />
          <span className="text-sm text-blue-700 font-medium">
            {assignments.filter(a => !a.done).length} pending
          </span>
        </div>
      </div>

      {/* Progress overview */}
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

      {/* Assignments list */}
      <div className="space-y-3">
        {assignments.map((a) => (
          <div
            key={a.id}
            className={`bg-white rounded-2xl shadow-sm p-4 transition-all ${a.done ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-3">
              <button onClick={() => toggleDone(a.id)} className="mt-0.5 shrink-0">
                {a.done
                  ? <CheckCircle size={22} className="text-accent" />
                  : <Circle size={22} className="text-gray-300 hover:text-accent transition-colors" />
                }
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className={`font-medium text-sm ${a.done ? 'line-through text-gray-400' : 'text-dark'}`}>
                    {a.title}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${priorityColors[a.priority]}`}>
                    {a.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">Due {a.due}</span>
                  {!a.done && (
                    <span className={`text-xs font-medium ${
                      a.due.includes('Mar 29') || a.due.includes('Mar 30') ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {a.due.includes('Mar 29') || a.due.includes('Mar 30') ? '• Due soon!' : ''}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{a.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-500"
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                </div>

                {/* Timer button */}
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
    </div>
  );
}
