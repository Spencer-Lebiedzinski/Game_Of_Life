import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Sparkles, Loader2 } from 'lucide-react';

// States: 'input' | 'loading' | 'clarify' | 'done'

export default function PlanningTab({ profile, userId, onGoalCreated }) {
  const [view, setView]           = useState('input');
  const [goalText, setGoalText]   = useState('');
  const [error, setError]         = useState('');

  // Research result
  const [researchData, setResearchData] = useState(null); // { goal_id, label, icon, summary, questions }

  // Clarify flow
  const [qIdx, setQIdx]         = useState(0);
  const [answers, setAnswers]   = useState([]);

  const accent = profile?.theme?.accent || '#2DD4BF';

  const handleResearch = async () => {
    if (!goalText.trim()) return;
    setError('');
    setView('loading');
    try {
      const res = await fetch('http://localhost:8001/api/goals/custom/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, goal_text: goalText.trim() }),
      });
      if (!res.ok) throw new Error('Research failed');
      const data = await res.json();
      setResearchData(data);
      setAnswers(Array(data.questions.length).fill(null));
      setQIdx(0);
      setView('clarify');
    } catch {
      setError('Something went wrong. Try again.');
      setView('input');
    }
  };

  const currentQ      = researchData?.questions?.[qIdx];
  const currentAnswer = answers[qIdx];
  const totalQ        = researchData?.questions?.length ?? 0;

  const handleAnswer = (id) => {
    const updated = [...answers];
    updated[qIdx] = id;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (qIdx < totalQ - 1) {
      setQIdx((q) => q + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (qIdx > 0) setQIdx((q) => q - 1);
    else setView('input');
  };

  const handleFinish = async () => {
    setView('loading');
    try {
      await fetch('http://localhost:8001/api/goals/custom/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          goal_id: researchData.goal_id,
          label: researchData.label,
          icon: researchData.icon,
          summary: researchData.summary,
          questions: researchData.questions,
          answers,
        }),
      });
      // Build the full custom goal object for the profile
      const newGoal = {
        id: researchData.goal_id,
        label: researchData.label,
        icon: researchData.icon,
        summary: researchData.summary,
        questions: researchData.questions,
        answers,
        endpoint: researchData.endpoint,
        stage: researchData.stage,
        stage_label: researchData.stage_label,
        stage_index: researchData.stage_index,
        milestones: researchData.milestones,
        action_history: researchData.action_history,
        current_action: researchData.current_action,
        progress_summary: researchData.progress_summary,
      };
      onGoalCreated(newGoal);
      setView('done');
    } catch {
      setError('Failed to save. Try again.');
      setView('clarify');
    }
  };

  const reset = () => {
    setView('input');
    setGoalText('');
    setResearchData(null);
    setAnswers([]);
    setQIdx(0);
    setError('');
  };

  // ── Existing custom goals list ────────────────────────────────────────────
  const customGoals = profile?.customGoals ?? [];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Planning</h1>
        <p className="text-gray-500 text-sm">Describe any goal and AI will build a personalized tab for it.</p>
      </div>

      {/* ── Input ── */}
      {view === 'input' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <p className="text-sm font-semibold text-dark mb-3">What goal do you want to add?</p>
          <textarea
            autoFocus
            rows={3}
            placeholder='e.g. "Apply to internships", "Learn guitar", "Start a business"'
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && goalText.trim()) { e.preventDefault(); handleResearch(); } }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent mb-3"
          />
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <button
            onClick={handleResearch}
            disabled={!goalText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Sparkles size={14} />
            Research with AI
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {view === 'loading' && (
        <div className="bg-white rounded-2xl shadow-sm p-10 mb-4 flex flex-col items-center gap-3 text-center">
          <Loader2 size={28} className="animate-spin" style={{ color: accent }} />
          <p className="text-sm font-medium text-dark">Researching your goal...</p>
          <p className="text-xs text-gray-400">Gemini is generating personalized questions</p>
        </div>
      )}

      {/* ── Clarify flow ── */}
      {view === 'clarify' && currentQ && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          {/* Goal summary header */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <span className="text-2xl">{researchData.icon}</span>
            <div>
              <p className="font-bold text-dark">{researchData.label}</p>
              <p className="text-xs text-gray-400">{researchData.summary}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {researchData.questions.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= qIdx ? accent : '#E5E7EB' }}
              />
            ))}
          </div>

          <p className="font-semibold text-dark text-sm mb-1">
            Q{qIdx + 1} of {totalQ}: {currentQ.question}
          </p>
          <p className="text-xs text-gray-400 mb-4">This helps personalize your tab.</p>

          <div className="flex flex-col gap-2 mb-5">
            {currentQ.options.map((opt) => {
              const sel = currentAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left border-2 transition-all ${
                    sel ? 'bg-gray-50' : 'border-gray-100 hover:border-gray-300'
                  }`}
                  style={sel ? { borderColor: accent } : {}}
                >
                  <span className="text-lg shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  {sel && (
                    <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: accent }}>
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-dark transition-colors"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: accent }}
            >
              {qIdx < totalQ - 1 ? 'Next' : `Create ${researchData.label} Tab`}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {view === 'done' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-4 text-center">
          <div className="text-4xl mb-3">{researchData?.icon}</div>
          <h2 className="text-xl font-bold text-dark mb-1">{researchData?.label} added!</h2>
          <p className="text-sm text-gray-400 mb-5">Your new tab is now in the navigation bar.</p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            Add another goal
          </button>
        </div>
      )}

      {/* ── Existing custom goals ── */}
      {customGoals.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-dark mb-3 text-sm">Your custom goals</h2>
          <div className="space-y-2">
            {customGoals.map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">{g.label}</p>
                  <p className="text-xs text-gray-400 truncate">{g.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
