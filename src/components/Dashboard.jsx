import WeeklyCalendar from './WeeklyCalendar';
import TaskList from './TaskList';
import LifeScore from './LifeScore';
import VoiceCoach from './VoiceCoach';
import StudyMode from './StudyMode';
import { weekTasks } from '../data/mockData';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard({ tasks, setTasks, selectedDay, setSelectedDay, userName, theme }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayName = DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const taskCounts = Object.fromEntries(
    Object.entries(weekTasks).map(([day, t]) => [day, t.length])
  );

  const dayTasks = tasks[selectedDay] || [];
  const completedCount = dayTasks.filter((t) => t.done).length;
  const todayTasks = tasks[todayName] || [];

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

          {/* Study Mode */}
          <StudyMode theme={theme} />
        </div>

        {/* Right: Life Score + Voice Coach */}
        <div className="lg:col-span-1 space-y-4">
          <LifeScore />
          <VoiceCoach tasks={todayTasks} userName={userName} theme={theme} />
        </div>
      </div>
    </div>
  );
}
