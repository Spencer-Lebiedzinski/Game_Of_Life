import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import SuggestionCard from '../SuggestionCard';

const GOAL_TO_BACKEND = {
  school:   'better_grades',
  fitness:  'lose_weight',
  mindset:  'reduce_stress',
  social:   'be_more_social',
  finance:  'save_money',
  sleep:    'sleep_better',
};

// Builds a minimal profile from what the frontend onboarding collected
function buildProfile(name, goals) {
  return {
    user_id: 'frontend-user',
    name: name || 'Player',
    eating_quality: 3,
    sleep_hours: 7,
    exercise_freq: 3,
    stress_level: 3,
    spending_awareness: 3,
    screen_time_struggle: 'sometimes',
    social_activity: 3,
    goals: goals.map((g) => GOAL_TO_BACKEND[g] || g),
    vaping_drinking: false,
    academic_struggle: null,
    onboarding_complete: true,
  };
}

export default function SuggestionsTab({ userName, theme, goals = [] }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  const accent = theme?.accent || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'frontend-user',
          profile_override: buildProfile(userName, goals),
          checkins_override: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? 'Something went wrong.');
      }

      const data = await res.json();
      setSuggestions(data.suggestions.map((s) => ({ ...s, completed: false })));
      setFetched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleComplete(completedSuggestion) {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.domain === completedSuggestion.domain ? { ...s, completed: true } : s
      )
    );
    // TODO: POST to /api/suggestions/complete to award XP when backend supports it
  }

  const completedCount = suggestions.filter((s) => s.completed).length;
  const totalXp = suggestions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.xp, 0);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">AI Suggestions</h1>
          <p className="text-gray-500 text-sm">
            {fetched
              ? `${completedCount}/5 completed · ${totalXp} XP earned`
              : 'Get personalized tasks across all life domains'}
          </p>
        </div>
        {fetched && (
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {/* CTA — first load */}
      {!fetched && !loading && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-lg font-bold text-dark mb-2">Ready for today's quests?</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Gemini AI will generate 5 personalized actions across school, fitness, finance, social, and wellness.
          </p>
          <button
            onClick={fetchSuggestions}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-lg hover:opacity-90 hover:scale-105 transition-all"
            style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
          >
            <Sparkles size={16} />
            Generate My Quests
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-4 animate-pulse">🤖</div>
          <p className="text-gray-500 text-sm">Gemini is analyzing your profile...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Cards */}
      {fetched && !loading && (
        <>
          {/* XP progress bar */}
          {completedCount > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Today's progress</span>
                <span className="font-semibold" style={{ color: accent }}>{totalXp} XP</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedCount / suggestions.length) * 100}%`,
                    background: `linear-gradient(to right, ${primary}, ${accent})`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.domain}
                suggestion={s}
                onComplete={handleComplete}
                theme={theme}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
