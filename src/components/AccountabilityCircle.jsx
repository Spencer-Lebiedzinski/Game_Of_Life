import { useState } from 'react';
import { Check, Send, Heart, Users, Target, Flame } from 'lucide-react';

const circleMembers = [
  {
    id: 1,
    name: 'Jordan',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan',
    streak: 20,
    lastCheckin: '2h ago',
    recentGoal: 'Finish 5 workouts this week',
    progress: 80,
    completedToday: true,
    status: 'online',
  },
  {
    id: 2,
    name: 'Taylor',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor',
    streak: 15,
    lastCheckin: '5h ago',
    recentGoal: 'Study 2 hours daily',
    progress: 60,
    completedToday: false,
    status: 'away',
  },
  {
    id: 3,
    name: 'Morgan',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Morgan',
    streak: 8,
    lastCheckin: '1d ago',
    recentGoal: 'Sleep by 11pm',
    progress: 45,
    completedToday: false,
    status: 'offline',
  },
];

const initialFeed = [
  { id: 1, user: 'Jordan', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan', action: 'completed their workout 💪', time: '2h ago', likes: 3 },
  { id: 2, user: 'Taylor', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor', action: 'hit a 15-day streak 🔥', time: '5h ago', likes: 5 },
  { id: 3, user: 'Morgan', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Morgan', action: 'shared goal: Sleep by 11pm 🌙', time: '1d ago', likes: 2 },
];

const statusColors = {
  online: 'bg-green-400',
  away: 'bg-yellow-400',
  offline: 'bg-gray-300',
};

export default function AccountabilityCircle({ theme, userName }) {
  const [feed, setFeed] = useState(initialFeed);
  const [checkedIn, setCheckedIn] = useState(false);
  const [nudgeSent, setNudgeSent] = useState({});
  const [likedIds, setLikedIds] = useState([]);
  const [checkInMsg, setCheckInMsg] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [sharedGoal, setSharedGoal] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(false);

  const accent = theme?.accent || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const handleCheckIn = () => {
    if (!checkedIn) {
      const msg = checkInMsg.trim() || 'Checked in for the day ✅';
      setFeed(f => [{
        id: Date.now(),
        user: userName || 'You',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${userName || 'Alex'}`,
        action: msg,
        time: 'Just now',
        likes: 0,
        isMe: true,
      }, ...f]);
      setCheckedIn(true);
      setShowCheckIn(false);
      setCheckInMsg('');
    }
  };

  const handleNudge = (memberId, memberName) => {
    setNudgeSent(n => ({ ...n, [memberId]: true }));
    setTimeout(() => setNudgeSent(n => ({ ...n, [memberId]: false })), 3000);
  };

  const handleLike = (id) => {
    if (likedIds.includes(id)) return;
    setLikedIds(ids => [...ids, id]);
    setFeed(f => f.map(item => item.id === id ? { ...item, likes: item.likes + 1 } : item));
  };

  const handleShareGoal = () => {
    if (!sharedGoal.trim()) return;
    setFeed(f => [{
      id: Date.now(),
      user: userName || 'You',
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${userName || 'Alex'}`,
      action: `set a new goal: ${sharedGoal} 🎯`,
      time: 'Just now',
      likes: 0,
      isMe: true,
    }, ...f]);
    setSharedGoal('');
    setShowGoalInput(false);
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #0F172A, #1E293B)` }}
      >
        <div
          className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ backgroundColor: accent }}
        />
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} style={{ color: accent }} />
          <p className="font-bold text-sm">Accountability Circle</p>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: accent + '30', color: accent }}
          >
            BASE44
          </span>
        </div>
        <p className="text-gray-400 text-xs mb-4">Private group — no feeds, just real support</p>

        {/* Check-in button */}
        {!checkedIn ? (
          <div>
            {showCheckIn ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={checkInMsg}
                  onChange={e => setCheckInMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCheckIn()}
                  placeholder="What did you accomplish? (optional)"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                />
                <button
                  onClick={handleCheckIn}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-dark"
                  style={{ backgroundColor: accent }}
                >
                  <Send size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCheckIn(true)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-dark hover:opacity-90 transition-all"
                style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
              >
                ✅ Check In Today
              </button>
            )}
          </div>
        ) : (
          <div
            className="text-center py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: accent + '30', color: accent }}
          >
            ✅ Checked in! Your circle can see your progress.
          </div>
        )}
      </div>

      {/* Circle members */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-dark text-sm">Your Circle</h3>
          <span className="text-xs text-gray-400">{circleMembers.length} friends</span>
        </div>
        <div className="space-y-3">
          {circleMembers.map(member => (
            <div key={member.id} className="flex items-center gap-3">
              {/* Avatar + status */}
              <div className="relative shrink-0">
                <img src={member.avatar} alt={member.name} className="w-11 h-11 rounded-full bg-gray-100" />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[member.status]}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-dark">{member.name}</p>
                  <div className="flex items-center gap-0.5">
                    <Flame size={11} className="text-orange-400" />
                    <span className="text-xs text-orange-500 font-medium">{member.streak}</span>
                  </div>
                  {member.completedToday && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">done ✓</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{member.recentGoal}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${member.progress}%`, backgroundColor: accent }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{member.progress}%</span>
                </div>
              </div>

              {/* Nudge */}
              <button
                onClick={() => handleNudge(member.id, member.name)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  nudgeSent[member.id]
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
                }`}
              >
                {nudgeSent[member.id] ? 'Sent! 👊' : '👊 Nudge'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-dark text-sm">Circle Activity</h3>
          <button
            onClick={() => setShowGoalInput(!showGoalInput)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={{ backgroundColor: accent + '20', color: accent }}
          >
            <Target size={11} className="inline mr-1" />
            Share Goal
          </button>
        </div>

        {showGoalInput && (
          <div className="flex gap-2 mb-3">
            <input
              autoFocus
              type="text"
              value={sharedGoal}
              onChange={e => setSharedGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleShareGoal()}
              placeholder="Share a goal with your circle..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleShareGoal}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              <Send size={12} />
            </button>
          </div>
        )}

        <div className="space-y-3">
          {feed.map(item => (
            <div key={item.id} className="flex items-start gap-3">
              <img src={item.avatar} alt={item.user} className="w-9 h-9 rounded-full bg-gray-100 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-dark">
                  <span className="font-semibold">{item.user}</span>{' '}
                  <span className="text-gray-600">{item.action}</span>
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">{item.time}</span>
                  <button
                    onClick={() => handleLike(item.id)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      likedIds.includes(item.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart size={11} fill={likedIds.includes(item.id) ? 'currentColor' : 'none'} />
                    {item.likes}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
