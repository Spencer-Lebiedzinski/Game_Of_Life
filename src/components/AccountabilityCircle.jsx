import { useState, useEffect } from 'react';
import { Flame, Zap, UserPlus, Search, X, Loader2, UserMinus } from 'lucide-react';

function activityLabel(lastDate) {
  if (!lastDate) return 'Never active';
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (lastDate === today) return 'Active today ✓';
  if (lastDate === yesterday) return 'Active yesterday';
  return `Last active ${lastDate}`;
}

function activeToday(lastDate) {
  if (!lastDate) return false;
  return lastDate === new Date().toISOString().split('T')[0];
}

export default function AccountabilityCircle({ theme, userName, userId }) {
  const [friends, setFriends]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [addedIds, setAddedIds]     = useState(new Set());
  const [removing, setRemoving]     = useState(null);

  const accent  = theme?.accent  || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  // Load friends on mount
  useEffect(() => {
    if (!userId || userId === 'frontend-user') { setLoading(false); return; }
    fetch(`http://localhost:8000/api/social/friends/${userId}`)
      .then((r) => r.json())
      .then((d) => setFriends(d.friends ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(
          `http://localhost:8000/api/social/search?q=${encodeURIComponent(query)}&user_id=${userId}`
        );
        const d = await r.json();
        setResults(d.results ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [query, userId]);

  const handleAdd = async (friend) => {
    await fetch('http://localhost:8000/api/social/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, friend_id: friend.user_id }),
    }).catch(() => {});
    setAddedIds((s) => new Set([...s, friend.user_id]));
    setResults((r) => r.filter((u) => u.user_id !== friend.user_id));
    // Refresh friends list
    fetch(`http://localhost:8000/api/social/friends/${userId}`)
      .then((r) => r.json())
      .then((d) => setFriends(d.friends ?? []))
      .catch(() => {});
  };

  const handleRemove = async (friendId) => {
    setRemoving(friendId);
    await fetch(
      `http://localhost:8000/api/social/friends/remove?user_id=${userId}&friend_id=${friendId}`,
      { method: 'DELETE' }
    ).catch(() => {});
    setFriends((f) => f.filter((fr) => fr.user_id !== friendId));
    setRemoving(null);
  };

  return (
    <div className="space-y-4">
      {/* Add friend panel */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-dark text-sm">Your Circle</h3>
          <button
            onClick={() => { setShowAdd((v) => !v); setQuery(''); setResults([]); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={{ backgroundColor: accent + '20', color: accent }}
          >
            {showAdd ? <X size={12} /> : <UserPlus size={12} />}
            {showAdd ? 'Cancel' : 'Add Friend'}
          </button>
        </div>

        {showAdd && (
          <div className="mb-4">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-2 focus-within:border-accent transition-colors">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-sm focus:outline-none text-dark placeholder-gray-400"
              />
              {searching && <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />}
            </div>

            {results.length > 0 && (
              <div className="space-y-1">
                {results.map((u) => (
                  <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`}
                      alt={u.name}
                      className="w-8 h-8 rounded-full bg-gray-100 shrink-0"
                    />
                    <p className="text-sm text-dark flex-1">{u.name}</p>
                    {addedIds.has(u.user_id) ? (
                      <span className="text-xs text-green-600 font-medium">Added ✓</span>
                    ) : (
                      <button
                        onClick={() => handleAdd(u)}
                        className="text-xs px-3 py-1 rounded-full font-medium text-white"
                        style={{ backgroundColor: accent }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {query.trim() && !searching && results.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No users found matching "{query}"</p>
            )}
          </div>
        )}

        {/* Friends list */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">No friends yet.</p>
            <p className="text-xs text-gray-300 mt-1">Search above to add people to your circle.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((f) => (
              <div key={f.user_id} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${f.name}`}
                    alt={f.name}
                    className="w-11 h-11 rounded-full bg-gray-100"
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      activeToday(f.last_activity_date) ? 'bg-green-400' : 'bg-gray-300'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-dark truncate">{f.name}</p>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Flame size={11} className="text-orange-400" />
                      <span className="text-xs text-orange-500 font-medium">{f.streak}</span>
                    </div>
                    {activeToday(f.last_activity_date) && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">done ✓</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <Zap size={10} className="text-yellow-400" />
                      <span className="text-xs text-gray-500">Lv {f.level}</span>
                    </div>
                    <span className="text-xs text-gray-400">{f.xp.toLocaleString()} XP</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{activityLabel(f.last_activity_date)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(f.user_id)}
                  disabled={removing === f.user_id}
                  className="shrink-0 p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                  title="Remove friend"
                >
                  {removing === f.user_id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <UserMinus size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div
        className="rounded-2xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}
      >
        <p className="font-bold text-sm mb-1" style={{ color: accent }}>How the circle works</p>
        <ul className="text-xs text-gray-400 space-y-1 mt-2">
          <li>• Add friends by searching their name above</li>
          <li>• Green dot = they've been active today</li>
          <li>• Friends appear on your Friends leaderboard</li>
          <li>• XP, level & streak update in real time</li>
        </ul>
      </div>
    </div>
  );
}
