import { useEffect, useMemo, useState } from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import WeeklyCalendar from './WeeklyCalendar';
import TaskList from './TaskList';
import LifeScore from './LifeScore';
import VoiceCoach from './VoiceCoach';
import GroupLeaderboardPanel from './GroupLeaderboardPanel';
import StudyMode from './StudyMode';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDueDate(value) {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Dashboard({
  selectedDay,
  setSelectedDay,
  userName,
  theme,
  userStats,
  userId,
  profile,
  onXpAwarded,
  onPlanUpdated,
  leaderboardRefreshKey,
  planRefreshKey,
  canvasConnected,
  canvasDashboard,
  canvasLoading,
  canvasMessage,
  canvasError,
  onRefreshCanvas,
}) {
  const [weekPlans, setWeekPlans] = useState({});
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() - mondayIndex);
    return DAYS.reduce((acc, day, index) => {
      const value = new Date(monday);
      value.setDate(monday.getDate() + index);
      acc[day] = value.toISOString().slice(0, 10);
      return acc;
    }, {});
  };

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayName = DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
  const weekDates = useMemo(() => getWeekDates(), []);
  const selectedDate = weekDates[selectedDay];
  const todayDate = weekDates[todayName];
  const isSelectedToday = selectedDate === todayDate;

  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const taskCounts = Object.fromEntries(
    DAYS.map((day) => [day, weekPlans[day]?.tasks?.length || 0]),
  );

  const dayTasks = weekPlans[selectedDay]?.tasks || [];
  const completedCount = dayTasks.filter((t) => t.done).length;
  const todayTasks = weekPlans[todayName]?.tasks || [];
  const courses = canvasDashboard?.courses ?? [];
  const completedCanvasIds = new Set(
    (weekPlans[todayName]?.tasks || [])
      .filter((task) => task.domain === 'canvas' && task.done)
      .map((task) => task.source_record_id),
  );

  const loadWeekPlans = async ({ regenerateToday = false } = {}) => {
    if (!userId || userId === 'frontend-user') return;
    setLoadingPlan(true);
    setPlanError('');
    try {
      if (regenerateToday) {
        await fetch('http://localhost:8000/api/daily-plan/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, date: todayDate }),
        });
      }

      const entries = await Promise.all(
        DAYS.map(async (day) => {
          const response = await fetch(`http://localhost:8000/api/daily-plan/${userId}?date=${weekDates[day]}`);
          const data = response.ok ? await response.json() : { tasks: [] };
          return [day, data];
        }),
      );
      setWeekPlans(Object.fromEntries(entries));
    } catch {
      setPlanError('Could not load today\'s plan right now.');
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    loadWeekPlans({ regenerateToday: true });
  }, [userId, planRefreshKey]);

  const handleToggle = async (taskId) => {
    if (!isSelectedToday) return;
    try {
      const response = await fetch('http://localhost:8000/api/daily-plan/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, task_id: taskId, date: selectedDate }),
      });
      if (!response.ok) {
        throw new Error();
      }
      const data = await response.json();
      setWeekPlans((prev) => ({
        ...prev,
        [selectedDay]: data.plan,
      }));
      onXpAwarded?.();
      onPlanUpdated?.();
      loadWeekPlans();
    } catch {
      setPlanError('Could not mark that task complete.');
    }
  };

  const accent = theme?.accent || '#2DD4BF';

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Date header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-dark">{todayFormatted}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {completedCount}/{dayTasks.length} tasks completed today
        </p>
      </div>

      {/* Weekly calendar */}
      <WeeklyCalendar
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        taskCounts={taskCounts}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Tasks + Study Mode */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today's Plan */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-dark">
                {selectedDay === todayName ? "Today's Plan" : `${selectedDay}'s Plan`}
              </h2>
              {dayTasks.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="h-2 bg-gray-100 rounded-full w-20 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(completedCount / dayTasks.length) * 100}%`,
                        backgroundColor: accent,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round((completedCount / dayTasks.length) * 100)}%
                  </span>
                </div>
              )}
            </div>
            {!isSelectedToday && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-3">
                <Lock size={12} />
                Past and future plan days are view-only. Only today can be checked off.
              </div>
            )}
            {planError && (
              <div className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">
                {planError}
              </div>
            )}
            <TaskList tasks={dayTasks} onToggle={handleToggle} disableToggle={!isSelectedToday} loading={loadingPlan && dayTasks.length === 0} />
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Completed', value: completedCount, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Remaining', value: dayTasks.length - completedCount, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total', value: dayTasks.length, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Momentum card */}
          {(() => {
            const pct = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;
            const msgs = [
              { min: 0,   max: 0,   text: 'Your day is wide open. Let\'s get moving.', emoji: '🌅' },
              { min: 1,   max: 33,  text: 'Good start — keep the momentum going.',     emoji: '🔥' },
              { min: 34,  max: 66,  text: 'Halfway there. You\'re crushing it.',        emoji: '⚡' },
              { min: 67,  max: 99,  text: 'Almost done. Finish strong.',                emoji: '🎯' },
              { min: 100, max: 100, text: 'All tasks done. Legendary day.',             emoji: '🏆' },
            ];
            const msg = msgs.find((m) => pct >= m.min && pct <= m.max) ?? msgs[0];
            const radius = 40;
            const circ = 2 * Math.PI * radius;
            const dash = (pct / 100) * circ;
            return (
              <div
                className="relative overflow-hidden rounded-2xl shadow-sm p-5"
                style={{ background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`, border: `1px solid ${accent}33` }}
              >
                {/* Animated background orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[
                    { size: 80,  top: '-10%', left: '70%', delay: '0s',    dur: '4s'  },
                    { size: 56,  top: '60%',  left: '-5%', delay: '1.5s',  dur: '5s'  },
                    { size: 40,  top: '20%',  left: '85%', delay: '0.8s',  dur: '3.5s'},
                  ].map((o, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: o.size, height: o.size,
                        top: o.top, left: o.left,
                        background: `${accent}18`,
                        animation: `pulse ${o.dur} ease-in-out ${o.delay} infinite alternate`,
                      }}
                    />
                  ))}
                </div>

                <div className="relative flex items-center gap-5">
                  {/* SVG ring */}
                  <div className="shrink-0">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={radius} fill="none" stroke={`${accent}22`} strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r={radius}
                        fill="none"
                        stroke={accent}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                      />
                      <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="700" fill={accent}>{pct}%</text>
                      <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#9CA3AF">done</text>
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{msg.emoji}</span>
                      <p className="font-semibold text-dark text-sm">{msg.text}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {completedCount} of {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''} completed
                    </p>
                    {/* Mini bar */}
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: accent, transition: 'width 0.8s ease' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <StudyMode theme={theme} userId={userId} onXpAwarded={onXpAwarded} />

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-semibold text-dark">Classes</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {canvasConnected
                    ? 'Your Canvas classes stay put until you refresh them.'
                    : 'Connect your Canvas token in Settings to show live classes here.'}
                </p>
              </div>
              <button
                onClick={() => onRefreshCanvas?.()}
                disabled={!canvasConnected || canvasLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={canvasLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {(canvasMessage || canvasError) && (
              <div className={`rounded-xl px-3 py-2 text-sm mb-4 ${canvasError ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                {canvasError || canvasMessage}
              </div>
            )}

            {!canvasConnected ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                No class data yet.
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                Press refresh to load your latest classes.
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((item) => {
                  const course = item.course ?? {};
                  const grade = item.grade_summary ?? {};
                  const counts = item.counts ?? {};
                  const assignments = item.next_assignments ?? [];

                  return (
                    <div key={course.id ?? course.name} className="rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-dark">{course.name || 'Untitled class'}</h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {course.course_code || 'Course code unavailable'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-dark">
                            {grade.current_grade || grade.final_grade || 'No grade yet'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {typeof grade.current_score === 'number'
                              ? `${Math.round(grade.current_score)}% current score`
                              : typeof grade.final_score === 'number'
                              ? `${Math.round(grade.final_score)}% final score`
                              : 'Score unavailable'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap mt-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                          {counts.missing_count ?? 0} missing
                        </span>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                          {counts.late_count ?? 0} late
                        </span>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          {counts.assignment_count ?? 0} assignments
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {assignments.length === 0 ? (
                          <p className="text-sm text-gray-400">No upcoming assignments found.</p>
                        ) : (
                          assignments.map((assignment) => (
                            <div key={assignment.id} className="rounded-xl bg-gray-50 px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-dark">{assignment.name || 'Untitled assignment'}</p>
                                <div className="flex items-center gap-2">
                                  {completedCanvasIds.has(`${course.id}:${assignment.id}`) && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                                      Done in Today&apos;s Plan
                                    </span>
                                  )}
                                  <span className={`text-xs font-medium ${assignment.submission?.missing ? 'text-red-600' : 'text-gray-500'}`}>
                                    {formatDueDate(assignment.due_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Life Score + Voice Coach */}
        <div className="lg:col-span-1 space-y-4">
          <LifeScore userStats={userStats} />
          <GroupLeaderboardPanel userId={userId} theme={theme} refreshKey={leaderboardRefreshKey} />
          <VoiceCoach tasks={selectedDay === todayName ? todayTasks : dayTasks} userName={userName} theme={theme} />
        </div>
      </div>
    </div>
  );
}
