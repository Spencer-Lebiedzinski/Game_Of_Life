import { useState } from 'react';
import { Bell, Mic, Zap, Flame, LogOut, Settings } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { user, notifications } from '../data/mockData';

export default function Header({ activeTab, setActiveTab, userName, theme, goals = [] }) {
  const { logout, user: auth0User } = useAuth0();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMicToast, setShowMicToast] = useState(false);
  const xpPercent = Math.round((user.xp / user.xpToNext) * 100);

  const accent = theme?.accent || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', alwaysShow: true },
    { id: 'school', label: 'School', goal: 'school' },
    { id: 'fitness', label: 'Fitness', goal: 'fitness' },
    { id: 'mindset', label: 'Mindset', goal: 'mindset' },
    { id: 'social', label: 'Social', goal: 'social' },
    { id: 'analytics', label: 'Analytics', alwaysShow: true },
    { id: 'finance', label: 'Finance', goal: 'finance' },
    { id: 'suggestions', label: 'Quests ✨', alwaysShow: true },
  ];

  const tabs = goals.length === 0
    ? allTabs
    : allTabs.filter((t) => t.alwaysShow || goals.includes(t.goal));

  const handleMic = () => {
    setShowMicToast(true);
    setTimeout(() => setShowMicToast(false), 2000);
  };

  const displayName = userName || user.name;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      {/* Gamification bar */}
      <div className="bg-dark text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Level + XP */}
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <div className="flex items-center gap-1 shrink-0">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-400">Lv {user.level}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                <span>{user.xp.toLocaleString()} XP</span>
                <span>{user.xpToNext.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${xpPercent}%`,
                    background: `linear-gradient(to right, ${primary}, ${accent})`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Streak + Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1">
              <Flame size={16} className="text-orange-400" />
              <span className="text-orange-400 font-semibold text-sm">{user.streak}</span>
            </div>
            <div className="hidden sm:flex gap-1">
              {user.badges.map((badge, i) => (
                <span key={i} className="text-sm">{badge}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mic */}
            <button
              onClick={handleMic}
              className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
              title="Voice input"
            >
              <Mic size={16} className="text-gray-300" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-1.5 rounded-full hover:bg-gray-700 transition-colors relative"
              >
                <Bell size={16} className="text-gray-300" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-dark text-sm">Notifications</p>
                  </div>
                  {notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <p className="text-sm text-dark">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-1.5">
              <img
                src={auth0User?.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${displayName}`}
                alt={displayName}
                className="w-7 h-7 rounded-full bg-gray-600"
              />
              <span className="text-xs text-gray-300 hidden sm:inline">{displayName}</span>
            </div>

            {/* Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Settings
                size={15}
                style={{ color: activeTab === 'settings' ? accent : undefined }}
                className={activeTab === 'settings' ? '' : 'text-gray-400'}
              />
            </button>

            {/* Logout */}
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="overflow-x-auto scrollbar-hide">
        <nav className="flex max-w-7xl mx-auto px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-current text-current'
                  : 'border-transparent text-gray-500 hover:text-dark hover:border-gray-300'
              }`}
              style={activeTab === tab.id ? { color: accent, borderColor: accent } : {}}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mic toast */}
      {showMicToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-dark text-white px-4 py-2 rounded-full text-sm shadow-lg z-50 flex items-center gap-2">
          <Mic size={14} style={{ color: primary }} className="animate-pulse" />
          Listening... (UI only)
        </div>
      )}
    </header>
  );
}
