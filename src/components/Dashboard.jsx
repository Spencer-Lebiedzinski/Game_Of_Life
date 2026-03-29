import { RefreshCw } from 'lucide-react';
import WeeklyCalendar from './WeeklyCalendar';
import TaskList from './TaskList';
import LifeScore from './LifeScore';
import VoiceCoach from './VoiceCoach';
import GroupLeaderboardPanel from './GroupLeaderboardPanel';

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
  tasks,
  setTasks,
  selectedDay,
  setSelectedDay,
  userName,
  theme,
  userStats,
  userId,
  onXpAwarded,
  leaderboardRefreshKey,
  canvasConnected,
  canvasDashboard,
  canvasLoading,
  canvasMessage,
  canvasError,
  onRefreshCanvas,
}) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayName = DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const taskCounts = Object.fromEntries(
    Object.entries(tasks).map(([day, t]) => [day, t.length])
  );

  const dayTasks = tasks[selectedDay] || [];
  const completedCount = dayTasks.filter((t) => t.done).length;
  const todayTasks = tasks[todayName] || [];
  const courses = canvasDashboard?.courses ?? [];

  const handleToggle = (taskId) => {
    setTasks((prev) => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      ),
    }));
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
            <TaskList tasks={dayTasks} onToggle={handleToggle} />
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
                                <span className={`text-xs font-medium ${assignment.submission?.missing ? 'text-red-600' : 'text-gray-500'}`}>
                                  {formatDueDate(assignment.due_at)}
                                </span>
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
          <VoiceCoach tasks={todayTasks} userName={userName} theme={theme} />
        </div>
      </div>
    </div>
  );
}
