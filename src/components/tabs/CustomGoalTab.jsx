import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function CustomGoalTab({ goal, userId, theme }) {
  const [insight, setInsight]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const accent = theme?.accent || '#2DD4BF';

  const fetchInsight = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `http://localhost:8000/api/goals/custom/insight/${goal.id}?user_id=${userId}`
      );
      if (!res.ok) throw new Error();
      setInsight(await res.json());
    } catch {
      setError('Could not load suggestions. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsight(); }, [goal.id]);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4" style={{ borderColor: accent }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{goal.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-dark">{goal.label}</h1>
            <p className="text-sm text-gray-500">{goal.summary}</p>
          </div>
        </div>
        {(goal.stage_label || goal.endpoint) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {goal.stage_label && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: `${accent}18`, color: accent }}>
                Current stage: {goal.stage_label}
              </span>
            )}
            {goal.endpoint && (
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                Endpoint: {goal.endpoint}
              </span>
            )}
          </div>
        )}
      </div>

      {(goal.current_action || goal.milestones?.length > 0) && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-dark text-sm">Progress Path</h2>
            <span className="text-xs text-gray-400">{goal.progress_summary}</span>
          </div>
          {goal.current_action && (
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: `${accent}12` }}>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Current action from Today's Plan</p>
              <p className="text-sm font-semibold text-dark">{goal.current_action.title}</p>
              <p className="text-xs text-gray-500 mt-1">{goal.current_action.description}</p>
            </div>
          )}
          {goal.milestones?.length > 0 && (
            <div className="space-y-2">
              {goal.milestones.map((milestone) => (
                <div key={milestone.id} className={`flex items-center justify-between rounded-xl px-3 py-2 ${milestone.done ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${milestone.done ? 'text-green-700 font-medium' : 'text-dark'}`}>{milestone.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${milestone.done ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {milestone.done ? 'Done' : 'Next up'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center gap-3 text-center">
          <Loader2 size={24} className="animate-spin" style={{ color: accent }} />
          <p className="text-sm text-gray-400">Generating personalized suggestions...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-sm text-gray-400 mb-3">{error}</p>
          <button onClick={fetchInsight} className="text-sm font-medium" style={{ color: accent }}>
            Try again
          </button>
        </div>
      )}

      {insight && !loading && (
        <>
          {/* Tips */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-dark text-sm">Suggested for you</h2>
              <button
                onClick={fetchInsight}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-dark transition-colors"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(insight.tips ?? []).map((tip, i) => (
                <div key={i} className="rounded-xl p-3 text-xs" style={{ backgroundColor: `${accent}18` }}>
                  <span className="font-bold mr-1" style={{ color: accent }}>{i + 1}.</span>
                  <span className="text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly tasks */}
          {insight.tasks?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-dark text-sm mb-3">This week's tasks</h2>
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const task = insight.tasks.find((t) => t.day === day);
                  if (!task) return null;
                  return (
                    <div key={day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span
                        className="text-xs font-semibold w-8 shrink-0"
                        style={{ color: accent }}
                      >
                        {day}
                      </span>
                      <p className="text-sm text-dark">{task.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
