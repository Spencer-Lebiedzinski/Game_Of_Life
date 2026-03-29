import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Circle, Timer, AlertCircle, Link, Unlink, RefreshCw, ExternalLink, BookOpen, TrendingUp, Clock } from 'lucide-react';
import { assignments as mockAssignments } from '../../data/mockData';

const CANVAS_API = 'http://localhost:8000';

function formatDueDate(isoString) {
  if (!isoString) return 'No due date';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return formatted;
}

function getDueUrgency(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  const diffMs = d - new Date();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${CANVAS_API}/api/canvas/connect-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, token: token.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to connect Canvas token.');
      }
      const data = await res.json();
      onConnected(data.canvas_user?.name);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-dashed border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
          <Link size={18} className="text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-dark">Connect Canvas LMS</h3>
          <p className="text-xs text-gray-500">Paste your Canvas access token to see real assignments and grades.</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Get your token: Canvas → Account → Settings → Approved Integrations → New Access Token
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          placeholder="Paste your Canvas access token..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={handleConnect}
          disabled={loading || !token.trim()}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

export default function SchoolTab({ userId = 'frontend-user', theme }) {
  const [canvasConnected, setCanvasConnected] = useState(null); // null = loading, false = not connected, true = connected
  const [canvasData, setCanvasData] = useState(null);
  const [canvasFetching, setCanvasFetching] = useState(false);
  const [canvasError, setCanvasError] = useState('');
  const [useMock, setUseMock] = useState(false);

  // Mock data fallback state
  const [mockList, setMockList] = useState(mockAssignments);
  const [timerActive, setTimerActive] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRef, setTimerRef] = useState(null);

  const accent = theme?.accent || '#2DD4BF';

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${CANVAS_API}/api/canvas/status`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error('Backend unreachable');
      const data = await res.json();
      setCanvasConnected(data.connected);
      if (data.connected) fetchDashboard();
    } catch {
      setCanvasConnected(false);
      setUseMock(true);
    }
  }, [userId]);

  const fetchDashboard = useCallback(async () => {
    setCanvasFetching(true);
    setCanvasError('');
    try {
      const res = await fetch(`${CANVAS_API}/api/canvas/dashboard`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error('Failed to fetch Canvas data');
      const data = await res.json();
      setCanvasData(data);
    } catch (e) {
      setCanvasError(e.message);
    } finally {
      setCanvasFetching(false);
    }
  }, [userId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

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

  // Mock mode helpers
  const toggleDone = (id) => setMockList((prev) => prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a)));
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
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Loading state
  if (canvasConnected === null) {
    return (
      <div className="p-4 max-w-7xl mx-auto flex justify-center items-center h-40">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Canvas connected: show real data ──
  if (canvasConnected && !useMock) {
    const courses = canvasData?.courses || [];
    const totalAssignments = courses.reduce((sum, c) => sum + c.counts.assignment_count, 0);
    const totalMissing = courses.reduce((sum, c) => sum + c.counts.missing_count, 0);

    return (
      <div className="p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark">School</h1>
            <p className="text-gray-500 text-sm">{courses.length} courses · {totalMissing} missing</p>
          </div>
          <div className="flex items-center gap-2">
            {canvasFetching && <RefreshCw size={14} className="animate-spin text-gray-400" />}
            <button
              onClick={fetchDashboard}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl text-xs font-medium">
              <Link size={12} />
              Canvas Live
            </div>
            <button
              onClick={handleDisconnect}
              className="p-2 rounded-xl hover:bg-red-50 transition-colors"
              title="Disconnect Canvas"
            >
              <Unlink size={15} className="text-gray-400 hover:text-red-400" />
            </button>
          </div>
        </div>

        {canvasError && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {canvasError} — <button className="underline" onClick={fetchDashboard}>retry</button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-dark">{courses.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Courses</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{totalMissing}</p>
            <p className="text-xs text-gray-500 mt-0.5">Missing</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-dark">{totalAssignments}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Assignments</p>
          </div>
        </div>

        {/* Course cards */}
        <div className="space-y-4">
          {courses.map(({ course, grade_summary, counts, next_assignments }) => {
            const grade = grade_summary.current_grade || grade_summary.final_grade;
            const score = grade_summary.current_score ?? grade_summary.final_score;

            return (
              <div key={course.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Course header */}
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
                      {grade && (
                        <p className="font-bold text-lg leading-tight" style={{ color: accent }}>{grade}</p>
                      )}
                      {score != null && (
                        <p className="text-xs text-gray-400">{score.toFixed(1)}%</p>
                      )}
                    </div>
                  </div>

                  {/* Score bar */}
                  {score != null && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(score, 100)}%`, backgroundColor: accent }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Counts */}
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-gray-500">{counts.assignment_count} assignments</span>
                    {counts.missing_count > 0 && (
                      <span className="text-xs text-red-500 font-medium">{counts.missing_count} missing</span>
                    )}
                    {counts.late_count > 0 && (
                      <span className="text-xs text-orange-500 font-medium">{counts.late_count} late</span>
                    )}
                  </div>
                </div>

                {/* Next assignments */}
                {next_assignments.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {next_assignments.map((a) => {
                      const urgency = getDueUrgency(a.due_at);
                      const submissionState = a.submission?.workflow_state;
                      const isSubmitted = submissionState === 'submitted' || submissionState === 'graded';
                      const isMissing = a.submission?.missing;

                      return (
                        <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {isSubmitted
                              ? <CheckCircle size={16} className="text-green-500" />
                              : isMissing
                              ? <AlertCircle size={16} className="text-red-500" />
                              : <Circle size={16} className="text-gray-300" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium truncate ${isSubmitted ? 'line-through text-gray-400' : 'text-dark'}`}>
                                {a.name}
                              </p>
                              {a.submission?.grade && (
                                <span className="text-xs font-semibold shrink-0" style={{ color: accent }}>
                                  {a.submission.grade}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={10} />
                                {formatDueDate(a.due_at)}
                              </div>
                              {urgency === 'overdue' && <span className="text-xs text-red-600 font-medium">Overdue</span>}
                              {urgency === 'today' && <span className="text-xs text-orange-500 font-medium">Due today</span>}
                              {urgency === 'soon' && <span className="text-xs text-yellow-600 font-medium">Due soon</span>}
                              {a.points_possible != null && (
                                <span className="text-xs text-gray-400">{a.points_possible} pts</span>
                              )}
                            </div>
                          </div>
                          {a.html_url && (
                            <a
                              href={a.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <ExternalLink size={13} className="text-gray-400" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {next_assignments.length === 0 && (
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

  // ── Not connected: show connect panel + mock data ──
  const completedCount = mockList.filter((a) => a.done).length;
  const priorityColors = {
    high: 'text-red-500 bg-red-50 border-red-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-green-600 bg-green-50 border-green-200',
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">School</h1>
          <p className="text-gray-500 text-sm">{completedCount}/{mockList.length} completed (demo data)</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2">
          <AlertCircle size={16} className="text-blue-500" />
          <span className="text-sm text-blue-700 font-medium">
            {mockList.filter(a => !a.done).length} pending
          </span>
        </div>
      </div>

      <CanvasConnectPanel
        userId={userId}
        onConnected={() => { setCanvasConnected(true); fetchDashboard(); }}
      />

      {/* Mock progress */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="font-semibold text-dark text-sm mb-3">Overall Progress</h3>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-secondary to-accent rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / mockList.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 text-right">{Math.round((completedCount / mockList.length) * 100)}%</p>
      </div>

      <div className="space-y-3">
        {mockList.map((a) => (
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">Due {a.due}</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span><span>{a.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${a.progress}%` }} />
                  </div>
                </div>
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
