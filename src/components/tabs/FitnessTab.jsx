import { useState } from 'react';
import { CheckCircle, Circle, Dumbbell, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { workouts as initialWorkouts, weeklyFitnessGoal, analyticsData } from '../../data/mockData';

const typeColors = {
  Cardio: 'bg-red-100 text-red-700',
  Strength: 'bg-blue-100 text-blue-700',
  Flexibility: 'bg-purple-100 text-purple-700',
};

export default function FitnessTab() {
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [showLog, setShowLog] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ name: '', type: 'Cardio', duration: '' });

  const completedWorkouts = workouts.filter((w) => w.done).length;
  const { total } = weeklyFitnessGoal;
  const percent = Math.round((completedWorkouts / total) * 100);

  const toggleWorkout = (id) => {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, done: !w.done } : w)));
  };

  const handleAdd = () => {
    if (!newWorkout.name) return;
    setWorkouts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newWorkout.name,
        type: newWorkout.type,
        duration: newWorkout.duration || '30 min',
        date: 'Today',
        done: false,
      },
    ]);
    setNewWorkout({ name: '', type: 'Cardio', duration: '' });
    setShowLog(false);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Fitness</h1>
          <p className="text-gray-500 text-sm">{completedWorkouts}/{total} weekly workouts</p>
        </div>
        <button
          onClick={() => setShowLog(!showLog)}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Log Workout
        </button>
      </div>

      {/* Log form */}
      {showLog && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-primary">
          <h3 className="font-semibold text-dark mb-3">Log a Workout</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Workout name"
              value={newWorkout.name}
              onChange={(e) => setNewWorkout((p) => ({ ...p, name: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <select
              value={newWorkout.type}
              onChange={(e) => setNewWorkout((p) => ({ ...p, type: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              <option>Cardio</option>
              <option>Strength</option>
              <option>Flexibility</option>
            </select>
            <input
              type="text"
              placeholder="Duration (e.g. 30 min)"
              value={newWorkout.duration}
              onChange={(e) => setNewWorkout((p) => ({ ...p, duration: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Add
            </button>
            <button onClick={() => setShowLog(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Weekly goal */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Dumbbell size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-dark text-sm">Weekly Goal</h3>
                <p className="text-xs text-gray-500">{completedWorkouts} of {total} workouts</p>
              </div>
              <div className="ml-auto text-2xl font-bold text-accent">{percent}%</div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < completedWorkouts ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Workouts list */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-dark text-sm mb-3">Workouts</h3>
            <div className="space-y-2">
              {workouts.map((w) => (
                <div
                  key={w.id}
                  onClick={() => toggleWorkout(w.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                    w.done ? 'bg-gray-50 opacity-70' : 'bg-gray-50 hover:bg-green-50'
                  }`}
                >
                  {w.done
                    ? <CheckCircle size={20} className="text-accent shrink-0" />
                    : <Circle size={20} className="text-gray-300 hover:text-accent shrink-0 transition-colors" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${w.done ? 'line-through text-gray-400' : 'text-dark'}`}>
                      {w.name}
                    </p>
                    <p className="text-xs text-gray-400">{w.duration} • {w.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[w.type] || 'bg-gray-100 text-gray-600'}`}>
                    {w.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.fitness} barSize={16}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(v) => [`${v}%`, 'Activity']}
              />
              <Bar dataKey="value" fill="#6EE7B7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
