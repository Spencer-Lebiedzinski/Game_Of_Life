import { useState } from 'react';
import { Trophy, Flame, Zap } from 'lucide-react';
import { friends } from '../../data/mockData';
import AccountabilityCircle from '../AccountabilityCircle';

const medalColors = ['text-yellow-400', 'text-gray-400', 'text-orange-400'];
const sorted = [...friends].sort((a, b) => b.xp - a.xp);

const SOCIAL_GOALS = {
  meet:    { headline: 'Expand Your Circle', actions: ['Say hi to one new person today', 'Join one club, class, or group this week', 'Ask someone you see often their name'] },
  friends: { headline: 'Deepen Your Friendships', actions: ['Text a friend you haven\'t talked to in a while', 'Suggest a specific plan instead of "we should hang"', 'Remember one thing about each friend\'s life this week'] },
  phone:   { headline: 'Reclaim Real Connection', actions: ['Phone-free meals — even just one per day', 'When with others, put phone face-down', 'Schedule a phone-free activity each week'] },
  goals:   { headline: 'Intentional Social Life', actions: ['Define: how many close friends do you want?', 'Block time for social activities like you would work', 'Review your social life monthly — are you investing in the right people?'] },
};

const BARRIER_TIPS = {
  anxiety:    '😬 Social anxiety is common. Start tiny — say hi to one person today. That\'s the whole goal.',
  time:       '⏰ No time for social? Combine it. Study together, walk together, eat together.',
  confidence: '🪞 Confidence builds from action, not from waiting to feel ready. One interaction per day.',
  location:   '📍 Hard to meet people nearby? Online communities count. Find one in your interest area.',
};

export default function SocialTab({ theme, userName, profile }) {
  const socialDetails = profile?.goalDetails?.social;
  const socialGoal    = socialDetails?.[0];
  const currentState  = socialDetails?.[1];
  const barrier       = socialDetails?.[2];
  const goalPlan      = SOCIAL_GOALS[socialGoal] ?? null;
  const [view, setView] = useState('leaderboard');

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-dark">Social</h1>
          <p className="text-gray-500 text-sm">Compete, support & grow together</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['leaderboard', 'circle'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                view === v ? 'bg-white shadow-sm text-dark' : 'text-gray-500'
              }`}
            >
              {v === 'circle' ? '🤝 Circle' : '🏆 Ranks'}
            </button>
          ))}
        </div>
      </div>

      {/* Personalized social plan */}
      {goalPlan && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4 border-purple-400">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Social Goal</span>
          <h2 className="text-lg font-bold text-dark mt-1 mb-3">{goalPlan.headline}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {goalPlan.actions.map((action, i) => (
              <div key={i} className="bg-purple-50 rounded-xl p-3 text-xs text-purple-900">
                <span className="font-bold mr-1">{i + 1}.</span>{action}
              </div>
            ))}
          </div>
          {barrier && BARRIER_TIPS[barrier] && (
            <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
              <span className="font-semibold text-dark">Your barrier: </span>{BARRIER_TIPS[barrier]}
            </div>
          )}
        </div>
      )}

      {view === 'leaderboard' ? (
        <>
          {/* Top 3 podium */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex items-end justify-center gap-4">
              {[sorted[1], sorted[0], sorted[2]].map((friend, i) => {
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const heights = ['h-24', 'h-32', 'h-20'];
                const bgColors = ['bg-gray-100', 'bg-yellow-50', 'bg-orange-50'];
                const medals = ['🥈', '🥇', '🥉'];
                return (
                  <div key={friend.id} className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{medals[i]}</span>
                    <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full bg-gray-200" />
                    <p className="text-xs font-semibold text-dark text-center">{friend.name.split(' ')[0]}</p>
                    <p className="text-xs text-gray-500">{friend.xp.toLocaleString()} XP</p>
                    <div className={`${heights[i]} ${bgColors[i]} w-20 rounded-t-xl flex items-end justify-center pb-2`}>
                      <span className="font-bold text-lg text-gray-600">#{actualRank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full leaderboard */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-dark text-sm mb-3">Full Rankings</h3>
            <div className="space-y-2">
              {sorted.map((friend, i) => (
                <div
                  key={friend.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    friend.isMe ? 'bg-green-50 border-2 border-primary' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-7 flex items-center justify-center">
                    {i < 3 ? (
                      <Trophy size={18} className={medalColors[i]} />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">#{i + 1}</span>
                    )}
                  </div>
                  <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-dark truncate">{friend.name}</p>
                      {friend.isMe && (
                        <span className="text-xs bg-primary text-dark px-1.5 py-0.5 rounded-full font-medium">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Zap size={10} className="text-yellow-400" />
                        <span className="text-xs text-gray-500">Lv {friend.level}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame size={10} className="text-orange-400" />
                        <span className="text-xs text-gray-500">{friend.streak}d</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-dark">{friend.xp.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">XP</span>
                  </div>
                  <div className="hidden sm:flex gap-0.5">
                    {friend.badges.map((b, j) => <span key={j} className="text-sm">{b}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <AccountabilityCircle theme={theme} userName={userName} />
      )}
    </div>
  );
}
