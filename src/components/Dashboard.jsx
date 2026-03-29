import { useState, useEffect, useRef } from 'react';
import WeeklyCalendar from './WeeklyCalendar';
import TaskList from './TaskList';
import LifeScore from './LifeScore';
import VoiceCoach from './VoiceCoach';
import StudyMode from './StudyMode';
import { Star, Plus, X } from 'lucide-react';
import { playComplete, playUncomplete, playEndOfDay } from '../utils/sounds';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard({ tasks, setTasks, selectedDay, setSelectedDay, userName, theme, userStats, taskPoints = 0, onPointsChange, sound = 'chime' }) {
  const [pointsToast, setPointsToast] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const addInputRef = useRef(null);
  const endOfDayChecked = useRef(false);
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

  const handleToggle = (taskId) => {
    setTasks((prev) => {
      const updated = prev[selectedDay].map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      );
      const task = updated.find((t) => t.id === taskId);
      const delta = task.done ? 10 : -10;
      if (onPointsChange) onPointsChange(delta);
      if (task.done) {
        playComplete(sound);
        const toastId = Date.now();
        setPointsToast({ id: toastId, delta });
        setTimeout(() => setPointsToast((p) => (p?.id === toastId ? null : p)), 1500);
      } else {
        playUncomplete(sound);
      }
      return { ...prev, [selectedDay]: updated };
    });
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) { setAddingTask(false); return; }
    const newTask = { id: Date.now(), title: newTaskText.trim(), category: 'school', time: '', done: false };
    setTasks((prev) => ({ ...prev, [selectedDay]: [...(prev[selectedDay] || []), newTask] }));
    setNewTaskText('');
    setAddingTask(false);
  };

  // End-of-day reminder: check at 9pm if there are incomplete tasks for today
  useEffect(() => {
    const now = new Date();
    const todayKey = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
    if (endOfDayChecked.current) return;
    const hour = now.getHours();
    if (hour >= 21) {
      const todayTasks = tasks[todayKey] || [];
      const incomplete = todayTasks.filter((t) => !t.done).length;
      if (incomplete > 0) {
        playEndOfDay(sound, incomplete);
        endOfDayChecked.current = true;
      }
    }
  }, [tasks, sound]);

  const accent = theme?.accent || '#2DD4BF';

  return (
    <div className="p-4 max-w-7xl mx-auto relative">
      {/* Points earned toast */}
      {pointsToast && (
        <div
          key={pointsToast.id}
          className="fixed top-24 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg animate-bounce pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          <Star size={14} fill="white" />
          +{pointsToast.delta} pts
        </div>
      )}
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
              <div className="flex items-center gap-2">
                {dayTasks.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 bg-gray-100 rounded-full w-20 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(completedCount / dayTasks.length) * 100}%`, backgroundColor: accent }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round((completedCount / dayTasks.length) * 100)}%
                    </span>
                  </div>
                )}
                <button
                  onClick={() => { setAddingTask(true); setTimeout(() => addInputRef.current?.focus(), 50); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ backgroundColor: accent }}
                  title="Add task"
                >
                  <Plus size={16} className="text-white" />
                </button>
              </div>
            </div>
            <TaskList tasks={dayTasks} onToggle={handleToggle} />
            {addingTask && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  ref={addInputRef}
                  type="text"
                  placeholder="Add a task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') { setAddingTask(false); setNewTaskText(''); } }}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-accent"
                  style={{ '--tw-ring-color': accent }}
                />
                <button onClick={handleAddTask} className="px-3 py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: accent }}>Add</button>
                <button onClick={() => { setAddingTask(false); setNewTaskText(''); }} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-4 gap-3">
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
            <div className="rounded-xl p-3 text-center relative overflow-hidden" style={{ backgroundColor: accent + '20' }}>
              <p className="text-2xl font-bold" style={{ color: accent }}>{taskPoints}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pts</p>
            </div>
          </div>

          {/* Study Mode */}
          <StudyMode theme={theme} />
        </div>

        {/* Right: Life Score + Voice Coach */}
        <div className="lg:col-span-1 space-y-4">
          <LifeScore userStats={userStats} />
          <VoiceCoach tasks={todayTasks} userName={userName} theme={theme} />
        </div>
      </div>
    </div>
  );
}
