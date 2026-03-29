import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, Circle, Timer, AlertCircle, Plus, Link, Unlink, RefreshCw, ExternalLink, BookOpen, TrendingUp, Clock } from 'lucide-react';
import { useTabData } from '../../hooks/useTabData';
import { normalizeSchoolData } from '../../utils/tabDataShapes';

const CANVAS_API = 'http://localhost:8000';

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
  week:       'Since you plan ahead, a Sunday review habit can keep it tight.',
  day:        'Daily planning works well. A quick 5-minute morning session to lock in priorities helps.',
  'last-min': 'You thrive under pressure — channeling that with fake deadlines 2 days early might help.',
  reactive:   "Try starting each morning with just one question: what's the single most important task today?",
};

function formatDueDate(isoString) {
  if (!isoString) return 'No due date';
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getDueUrgency(isoString) {
  if (!isoString) return null;
  const diffDays = Math.ceil((new Date(isoString) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 1) return 'today';
  if (diffDays <= 3) return 'soon';
  return null;
}

function CanvasConnectPanel({ userId, onConnected }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    // Clean the token: strip whitespace and accidental "Bearer " prefix
    const cleaned = token.trim().replace(/^Bearer\s+/i, '');
    if (!cleaned) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${CANVAS_API}/api/canvas/connect-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, token: cleaned }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to connect Canvas token.');
      }
      onConnected();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 border-2 border-dashed border-blue-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
          <Link size={18} className="text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-dark">Connect Canvas LMS</h3>
          <p className="text-xs text-gray-500">Syncs your real assignments, grades and due dates.</p>
        </div>
      </div>
      <ol className="text-xs text-gray-500 mb-3 space-y-0.5 list-decimal list-inside">
        <li>Go to <strong>canvas.psu.edu</strong> → click your <strong>Account</strong> (top-left)</li>
        <li>Click <strong>Settings</strong> → scroll to <strong>Approved Integrations</strong></li>
        <li>Click <strong>+ New Access Token</strong> → give it a name → <strong>Generate Token</strong></li>
        <li>Copy the token that appears (it starts with <code className="bg-gray-100 px-1 rounded">1~</code>) and paste below</li>
      </ol>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Paste token here (starts with 1~...)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 font-mono"
        />
        <button
          onClick={handleConnect}
          disabled={loading || !token.trim()}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2 break-words">{error}</p>}
    </div>
  );
}

export default function SchoolTab({ profile, userId }) {
  const [rawSchool, setRawSchool] = useTabData(userId, 'school', []);
  // Canvas state
  const [canvasConnected, setCanvasConnected] = useState(null); // null=loading, false=no, true=yes
  const [canvasData, setCanvasData]           = useState(null);
  const [canvasFetching, setCanvasFetching]   = useState(false);
  const [canvasError, setCanvasError]         = useState('');
  const [showAdd, setShowAdd]         = useState(false);
  const [newTitle, setNewTitle]       = useState('');
  const [newDue, setNewDue]           = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  // Timer
  const [timerActive, setTimerActive]   = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);
  const schoolData = normalizeSchoolData(rawSchool);
  const assignments = schoolData.assignments;
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const fetchDashboard = useCallback(async () => {
    setCanvasFetching(true);
    setCanvasError('');
    try {
      const res = await fetch(`${CANVAS_API}/api/canvas/dashboard`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error('Failed to fetch Canvas data');
      setCanvasData(await res.json());
    } catch (e) {
      setCanvasError(e.message);
    } finally {
      setCanvasFetching(false);
    }
  }, [userId]);

  // Check Canvas status on mount
  useEffect(() => {
    fetch(`${CANVAS_API}/api/canvas/status`, { headers: { 'X-User-Id': userId } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setCanvasConnected(data.connected);
        if (data.connected) fetchDashboard();
      })
      .catch(() => setCanvasConnected(false));
  }, [userId, fetchDashboard]);

  const handleDisconnect = async () => {
    try {
      await fetch(`${CANVAS_API}/api/canvas/disconnect-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
    } catch { /* ignore */ }
    setCanvasConnected(false);
    setCanvasData(null);
  };

  const toggleDone = (id) => {
    setRawSchool((prev) => {
      const data = normalizeSchoolData(prev);
      return {
        ...data,
        assignments: data.assignments.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
      };
    });
  };

  const handleAddAssignment = () => {
    if (!newTitle.trim()) return;
    setRawSchool((prev) => {
      const data = normalizeSchoolData(prev);
      return {
        ...data,
        assignments: [
          ...data.assignments,
          { id: Date.now(), title: newTitle.trim(), due: newDue || 'No date', progress: 0, done: false, priority: newPriority },
        ],
      };
    });
    setNewTitle('');
    setNewDue('');
    setNewPriority('medium');
    setShowAdd(false);
  };

  const startTimer = (id) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerActive === id) { setTimerActive(null); setTimerSeconds(0); return; }
    setTimerActive(id); setTimerSeconds(0);
    timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Profile-based study tips
  const schoolDetails = profile?.goalDetails?.school;
  const challenge  = schoolDetails?.[0];
  const studyStyle = schoolDetails?.[1];
  const planning   = schoolDetails?.[2];
  const tips       = STUDY_TIPS[challenge] ?? null;

  const accent = profile?.theme?.accent || '#2DD4BF';

  // ── Loading Canvas status ──
  if (canvasConnected === null) {
    return (
      <div className="p-4 max-w-7xl mx-auto flex justify-center items-center h-40">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Canvas connected: show live Canvas data ──
  if (canvasConnected) {
    const courses = canvasData?.courses || [];
    const totalAssignments = courses.reduce((sum, c) => sum + c.counts.assignment_count, 0);
    const totalMissing     = courses.reduce((sum, c) => sum + c.counts.missing_count, 0);

    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark">School</h1>
            <p className="text-gray-500 text-sm">{courses.length} courses · {totalMissing} missing</p>
          </div>
          <div className="flex items-center gap-2">
            {canvasFetching && <RefreshCw size={14} className="animate-spin text-gray-400" />}
            <button onClick={fetchDashboard} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Refresh">
              <RefreshCw size={16} className="text-gray-500" />
            </button>
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl text-xs font-medium">
              <Link size={12} /> Canvas Live
            </div>
            <button onClick={handleDisconnect} className="p-2 rounded-xl hover:bg-red-50 transition-colors" title="Disconnect Canvas">
              <Unlink size={15} className="text-gray-400 hover:text-red-400" />
            </button>
          </div>
        </div>

        {canvasError && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {canvasError} — <button className="underline" onClick={fetchDashboard}>retry</button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Courses',     value: courses.length,    color: 'text-dark' },
            { label: 'Missing',     value: totalMissing,      color: 'text-red-500' },
            { label: 'Assignments', value: totalAssignments,  color: 'text-dark' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {courses.map(({ course, grade_summary, counts, next_assignments }) => {
            const grade = grade_summary.current_grade || grade_summary.final_grade;
            const score = grade_summary.current_score ?? grade_summary.final_score;
            return (
              <div key={course.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: accent + '20' }}>
                        <BookOpen size={14} style={{ color: accent }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-dark text-sm truncate">{course.name}</p>
                        <p className="text-xs text-gray-400">{course.course_code}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {grade && <p className="font-bold text-lg leading-tight" style={{ color: accent }}>{grade}</p>}
                      {score != null && <p className="text-xs text-gray-400">{score.toFixed(1)}%</p>}
                    </div>
                  </div>
                  {score != null && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(score, 100)}%`, backgroundColor: accent }} />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-gray-500">{counts.assignment_count} assignments</span>
                    {counts.missing_count > 0 && <span className="text-xs text-red-500 font-medium">{counts.missing_count} missing</span>}
                    {counts.late_count > 0 && <span className="text-xs text-orange-500 font-medium">{counts.late_count} late</span>}
                  </div>
                </div>

                {next_assignments.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {next_assignments.map((a) => {
                      const urgency = getDueUrgency(a.due_at);
                      const submissionState = a.submission?.workflow_state;
                      const isSubmitted = submissionState === 'submitted' || submissionState === 'graded';
                      const isMissing = a.submission?.missing;
                      return (
                        <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {isSubmitted ? <CheckCircle size={16} className="text-green-500" />
                              : isMissing ? <AlertCircle size={16} className="text-red-500" />
                              : <Circle size={16} className="text-gray-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium truncate ${isSubmitted ? 'line-through text-gray-400' : 'text-dark'}`}>{a.name}</p>
                              {a.submission?.grade && <span className="text-xs font-semibold shrink-0" style={{ color: accent }}>{a.submission.grade}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={10} />{formatDueDate(a.due_at)}
                              </div>
                              {urgency === 'overdue' && <span className="text-xs text-red-600 font-medium">Overdue</span>}
                              {urgency === 'today'   && <span className="text-xs text-orange-500 font-medium">Due today</span>}
                              {urgency === 'soon'    && <span className="text-xs text-yellow-600 font-medium">Due soon</span>}
                              {a.points_possible != null && <span className="text-xs text-gray-400">{a.points_possible} pts</span>}
                            </div>
                          </div>
                          {a.html_url && (
                            <a href={a.html_url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                              <ExternalLink size={13} className="text-gray-400" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-xs text-gray-400">No upcoming assignments</p>
                )}
              </div>
            );
          })}

          {courses.length === 0 && !canvasFetching && (
            <div className="text-center text-gray-400 py-10">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active courses found in Canvas</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Not connected: connect panel + manual assignments ──
  const completedCount = assignments.filter((a) => a.done).length;

  return (
    <div className="p-4 max-w-7xl mx-auto">
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

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">School</h1>
          <p className="text-gray-500 text-sm">{completedCount}/{assignments.length} assignments done</p>
        </div>
        <div className="flex items-center gap-2">
          {assignments.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2">
              <AlertCircle size={16} className="text-blue-500" />
              <span className="text-sm text-blue-700 font-medium">{assignments.filter((a) => !a.done).length} pending</span>
            </div>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <CanvasConnectPanel
        userId={userId}
        onConnected={() => { setCanvasConnected(true); fetchDashboard(); }}
      />

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-primary">
          <h3 className="font-semibold text-dark mb-3">Add Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Assignment name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAssignment()}
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

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-sm text-gray-400">No assignments yet.</p>
          <p className="text-xs text-gray-300 mt-1">Connect Canvas above or add manually with the button.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className={`bg-white rounded-2xl shadow-sm p-4 transition-all ${a.done ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleDone(a.id)} className="mt-0.5 shrink-0">
                  {a.done
                    ? <CheckCircle size={22} className="text-accent" />
                    : <Circle size={22} className="text-gray-300 hover:text-accent transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-medium text-sm ${a.done ? 'line-through text-gray-400' : 'text-dark'}`}>{a.title}</p>
                      {a.from_today_plan && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          From Today's Plan
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${priorityColors[a.priority] || priorityColors.medium}`}>
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
