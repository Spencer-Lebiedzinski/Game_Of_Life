import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Link2, Loader2, Unplug, Trash2 } from 'lucide-react';
import { GOAL_OPTIONS, CLARIFY_QUESTIONS, THEMES } from '../../data/goalData';
import ProfileConnections from '../ProfileConnections';

export default function SettingsTab({
  profile,
  userId,
  onProfileUpdate,
  canvasConnected,
  canvasLoading,
  canvasMessage,
  canvasError,
  onCanvasConnected,
  onCanvasDisconnected,
}) {
  const [activeGoals, setActiveGoals] = useState(profile?.goals ?? []);
  const [goalDetails, setGoalDetails] = useState(profile?.goalDetails ?? {});
  const [customGoals, setCustomGoals] = useState(profile?.customGoals ?? []);
  const [selectedTheme, setSelectedTheme] = useState(profile?.theme?.id ?? 'mint');
  const [canvasToken, setCanvasToken] = useState('');
  const [canvasSaving, setCanvasSaving] = useState(false);
  const [canvasStatusMessage, setCanvasStatusMessage] = useState('');

  // Mini clarify flow state
  const [pendingGoal, setPendingGoal] = useState(null);
  const [pendingAnswers, setPendingAnswers] = useState([null, null, null]);
  const [pendingQIdx, setPendingQIdx] = useState(0);

  const [saved, setSaved] = useState(false);

  const accent = profile?.theme?.accent || '#2DD4BF';

  // ── Helpers ──────────────────────────────────────────────────────────────

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function persist(updates) {
    const merged = { ...profile, ...updates };
    onProfileUpdate(merged);
    flashSaved();
    fetch(`http://localhost:8000/api/profile/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }

  // ── Goal toggling ────────────────────────────────────────────────────────

  function handleGoalClick(goalId) {
    if (pendingGoal === goalId) {
      // Cancel pending setup
      setPendingGoal(null);
      return;
    }

    if (activeGoals.includes(goalId)) {
      // Remove the goal
      const updated = activeGoals.filter((g) => g !== goalId);
      setActiveGoals(updated);
      persist({ goals: updated, goal_details: goalDetails });
    } else if (goalDetails[goalId]) {
      // Already has answers — just re-enable
      const updated = [...activeGoals, goalId];
      setActiveGoals(updated);
      persist({ goals: updated, goal_details: goalDetails });
    } else {
      // Start mini setup flow
      setPendingGoal(goalId);
      setPendingAnswers([null, null, null]);
      setPendingQIdx(0);
    }
  }

  function handlePendingAnswer(answerId) {
    const updated = [...pendingAnswers];
    updated[pendingQIdx] = answerId;
    setPendingAnswers(updated);
  }

  function handlePendingNext() {
    const questions = CLARIFY_QUESTIONS[pendingGoal] ?? [];
    if (pendingQIdx < questions.length - 1) {
      setPendingQIdx((q) => q + 1);
    } else {
      // Done — add goal + save answers
      const updatedGoals = [...activeGoals, pendingGoal];
      const updatedDetails = { ...goalDetails, [pendingGoal]: pendingAnswers };
      setActiveGoals(updatedGoals);
      setGoalDetails(updatedDetails);
      persist({ goals: updatedGoals, goal_details: updatedDetails });
      setPendingGoal(null);
      setPendingAnswers([null, null, null]);
      setPendingQIdx(0);
    }
  }

  function handlePendingBack() {
    if (pendingQIdx > 0) {
      setPendingQIdx((q) => q - 1);
    } else {
      setPendingGoal(null);
    }
  }

  // ── Custom goal removal ──────────────────────────────────────────────────

  function handleRemoveCustomGoal(goalId) {
    const updated = customGoals.filter((g) => g.id !== goalId);
    setCustomGoals(updated);
    persist({ customGoals: updated, custom_goals: updated });
  }

  // ── Theme switching ──────────────────────────────────────────────────────

  function handleTheme(themeId) {
    const t = THEMES.find((th) => th.id === themeId);
    if (!t) return;
    setSelectedTheme(themeId);
    persist({ theme: t });
  }

  async function handleConnectCanvas() {
    const token = canvasToken.trim();
    if (!token || !userId) return;

    setCanvasSaving(true);
    setCanvasStatusMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/canvas/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, token }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Could not save Canvas token.');
      }

      setCanvasToken('');
      setCanvasStatusMessage(data?.message || 'Canvas token saved.');
      await onCanvasConnected?.();
    } catch (error) {
      setCanvasStatusMessage(error.message || 'Could not save Canvas token.');
    } finally {
      setCanvasSaving(false);
    }
  }

  async function handleDisconnectCanvas() {
    if (!userId) return;

    setCanvasSaving(true);
    setCanvasStatusMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/canvas/disconnect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Could not disconnect Canvas token.');
      }

      setCanvasToken('');
      setCanvasStatusMessage(data?.message || 'Canvas disconnected.');
      onCanvasDisconnected?.();
    } catch (error) {
      setCanvasStatusMessage(error.message || 'Could not disconnect Canvas token.');
    } finally {
      setCanvasSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const pendingQuestions = pendingGoal ? CLARIFY_QUESTIONS[pendingGoal] ?? [] : [];
  const currentQ = pendingQuestions[pendingQIdx];
  const currentAnswer = pendingAnswers[pendingQIdx];

  return (
    <div className="p-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your goals and preferences</p>
        </div>
        {saved && (
          <span className="text-sm font-medium text-green-600 flex items-center gap-1">
            <Check size={14} /> Saved
          </span>
        )}
      </div>

      {/* ── My Goals ── */}
      <section className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="font-semibold text-dark mb-1">My Goals</h2>
        <p className="text-xs text-gray-400 mb-4">
          Tap to add or remove. Your tabs update instantly.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((goal) => {
            const isActive = activeGoals.includes(goal.id);
            const isPending = pendingGoal === goal.id;
            return (
              <button
                key={goal.id}
                onClick={() => handleGoalClick(goal.id)}
                className={`relative p-4 rounded-2xl text-left transition-all border-2 ${
                  isActive
                    ? 'bg-green-50 border-green-300'
                    : isPending
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-green-500">
                    <Check size={11} className="text-white" />
                  </div>
                )}
                {isPending && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-gray-400">
                    <span className="text-white text-xs">…</span>
                  </div>
                )}
                <span className="text-xl block mb-1">{goal.icon}</span>
                <p className="font-semibold text-sm text-dark">{goal.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{goal.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Mini clarify flow */}
        {pendingGoal && currentQ && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">
                {GOAL_OPTIONS.find((g) => g.id === pendingGoal)?.icon}{' '}
                {GOAL_OPTIONS.find((g) => g.id === pendingGoal)?.label} — Q{pendingQIdx + 1} of {pendingQuestions.length}
              </span>
              <div className="flex gap-1">
                {pendingQuestions.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-6 rounded-full"
                    style={{ backgroundColor: i <= pendingQIdx ? accent : '#E5E7EB' }}
                  />
                ))}
              </div>
            </div>

            <p className="font-semibold text-dark text-sm mb-3">{currentQ.question}</p>

            <div className="grid grid-cols-1 gap-2 mb-4">
              {currentQ.options.map((opt) => {
                const sel = currentAnswer === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePendingAnswer(opt.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left border-2 transition-all ${
                      sel ? 'bg-gray-100 border-gray-400' : 'border-gray-100 hover:border-gray-300'
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
                onClick={handlePendingBack}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-dark transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <button
                onClick={handlePendingNext}
                disabled={!currentAnswer}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: accent }}
              >
                {pendingQIdx < pendingQuestions.length - 1 ? 'Next' : `Add ${GOAL_OPTIONS.find(g => g.id === pendingGoal)?.label}`}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Custom Goals ── */}
      {customGoals.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="font-semibold text-dark mb-1">Custom Goals</h2>
          <p className="text-xs text-gray-400 mb-4">AI-generated tabs from Planning. Remove to delete the tab.</p>
          <div className="space-y-2">
            {customGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl shrink-0">{goal.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">{goal.label}</p>
                  <p className="text-xs text-gray-400 truncate">{goal.summary}</p>
                </div>
                <button
                  onClick={() => handleRemoveCustomGoal(goal.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  title="Remove goal"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Theme ── */}
      <section className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="font-semibold text-dark mb-1">Theme</h2>
        <p className="text-xs text-gray-400 mb-4">Changes apply across the whole app instantly.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTheme(t.id)}
              className={`p-4 rounded-2xl border-2 transition-all bg-white shadow-sm ${
                selectedTheme === t.id ? 'scale-105 shadow-md' : 'border-transparent hover:border-gray-200'
              }`}
              style={selectedTheme === t.id ? { borderColor: t.accent } : {}}
            >
              <div className="flex gap-1.5 mb-2">
                {t.preview.map((c, i) => <div key={i} className={`w-5 h-5 rounded-full ${c}`} />)}
              </div>
              <p className="text-sm font-medium text-left text-gray-800">{t.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-dark mb-1">Canvas</h2>
            <p className="text-xs text-gray-400">
              Save your Canvas token here, then refresh class data only when you want to.
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${canvasConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {canvasConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            value={canvasToken}
            onChange={(e) => setCanvasToken(e.target.value)}
            placeholder="Paste Canvas access token"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleConnectCanvas}
              disabled={!canvasToken.trim() || canvasSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {(canvasSaving || canvasLoading) ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
              Save Token
            </button>

            <button
              onClick={handleDisconnectCanvas}
              disabled={!canvasConnected || canvasSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 disabled:opacity-50"
            >
              <Unplug size={14} />
              Disconnect
            </button>
          </div>

          {(canvasStatusMessage || canvasMessage || canvasError) && (
            <div className={`rounded-xl px-3 py-2 text-sm ${
              canvasError || canvasStatusMessage.toLowerCase().includes('could not') || canvasStatusMessage.toLowerCase().includes('invalid')
                ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              {canvasError || canvasStatusMessage || canvasMessage}
            </div>
          )}

          <p className="text-xs text-gray-400">
            Refreshing class data can take a while because each class is checked separately.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-semibold text-dark mb-4">Account</h2>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
            {profile?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-medium text-dark text-sm">{profile?.name}</p>
            <p className="text-xs text-gray-400">Player since today</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          To sign out, use the logout button in the top bar.
        </p>
      </section>

      <ProfileConnections userId={userId} theme={profile?.theme} />
    </div>
  );
}
