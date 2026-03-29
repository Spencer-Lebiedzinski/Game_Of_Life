import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SchoolTab from './components/tabs/SchoolTab';
import FitnessTab from './components/tabs/FitnessTab';
import MindsetTab from './components/tabs/MindsetTab';
import SocialTab from './components/tabs/SocialTab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import FinanceTab from './components/tabs/FinanceTab';
import FloatingActionButton from './components/FloatingActionButton';
import Onboarding from './components/Onboarding';
import SettingsTab from './components/tabs/SettingsTab';
import SobrietyTab from './components/tabs/SobrietyTab';
import LoginScreen from './auth/LoginScreen.jsx';
import { weekTasks } from './data/mockData';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTodayKey() {
  const d = new Date().getDay();
  return DAYS[d === 0 ? 6 : d - 1];
}

export default function App() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth0();
  const [profile, setProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState(weekTasks);
  const [selectedDay, setSelectedDay] = useState(getTodayKey());
  const [taskPoints, setTaskPoints] = useState(() => {
    const saved = localStorage.getItem('taskPoints');
    return saved ? parseInt(saved, 10) : 0;
  });

  const addPoints = (delta) => {
    setTaskPoints((prev) => {
      const next = Math.max(0, prev + delta);
      localStorage.setItem('taskPoints', String(next));
      return next;
    });
  };

  const userId = user?.sub || 'frontend-user';

  // On login, load existing profile from DB (skips onboarding for returning users)
  useEffect(() => {
    if (!userId || userId === 'frontend-user') return;

    const THEMES = [
      { id: 'mint',   primary: '#6EE7B7', secondary: '#60A5FA', accent: '#2DD4BF', bg: '#F9FAFB' },
      { id: 'sunset', primary: '#FCA5A5', secondary: '#FDBA74', accent: '#F472B6', bg: '#FFF7ED' },
      { id: 'ocean',  primary: '#7DD3FC', secondary: '#A5B4FC', accent: '#38BDF8', bg: '#F0F9FF' },
      { id: 'forest', primary: '#86EFAC', secondary: '#A3E635', accent: '#34D399', bg: '#F0FDF4' },
      { id: 'galaxy', primary: '#C084FC', secondary: '#818CF8', accent: '#E879F9', bg: '#0F172A', dark: true },
      { id: 'candy',  primary: '#F9A8D4', secondary: '#FDE68A', accent: '#6EE7B7', bg: '#FDF2F8' },
    ];
    // Map backend goal values back to frontend IDs
    const BACKEND_TO_GOAL = {
      better_grades: 'school', lose_weight: 'fitness', reduce_stress: 'mindset',
      be_more_social: 'social', save_money: 'finance', sleep_better: 'sleep',
    };

    fetch(`http://localhost:8000/api/onboarding/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const theme = THEMES.find((t) => t.id === data.theme?.id) || THEMES[0];
        const goals = (data.goals ?? []).map((g) => BACKEND_TO_GOAL[g] ?? g);
        setProfile({ ...data, goals, goalDetails: data.goal_details ?? {}, theme });
        applyTheme(theme);
      })
      .catch(() => {});
  }, [userId]);

  // Fetch live stats whenever the user is authenticated
  useEffect(() => {
    if (!userId || userId === 'frontend-user') return;
    fetch(`http://localhost:8000/api/stats/${userId}`)
      .then((r) => r.json())
      .then(setUserStats)
      .catch(() => {});
  }, [userId]);

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-bg', theme.bg);
  };

  const handleOnboardingComplete = (data) => {
    setProfile(data);
    applyTheme(data.theme);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    if (updatedProfile.theme) applyTheme(updatedProfile.theme);
  };

  // Called by any tab after awarding XP so the header updates live
  const refreshStats = () => {
    if (!userId || userId === 'frontend-user') return;
    fetch(`http://localhost:8000/api/stats/${userId}`)
      .then((r) => r.json())
      .then(setUserStats)
      .catch(() => {});
  };

  const handleAdd = (type, name) => {
    if (type === 'task') {
      const newTask = { id: Date.now(), title: name, category: 'school', time: '', done: false };
      setTasks((prev) => ({ ...prev, [selectedDay]: [...(prev[selectedDay] || []), newTask] }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🎮</div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  if (!profile) return <Onboarding onComplete={handleOnboardingComplete} userId={userId} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            tasks={tasks}
            setTasks={setTasks}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            userName={profile.name}
            theme={profile.theme}
            userStats={userStats}
            taskPoints={taskPoints}
            onPointsChange={addPoints}
          />
        );
      case 'school':   return <SchoolTab userId={userId} theme={profile.theme} />;
      case 'fitness':  return <FitnessTab profile={profile} />;
      case 'mindset':  return <MindsetTab profile={profile} />;
      case 'social':
        return <SocialTab theme={profile.theme} userName={profile.name} profile={profile} userId={userId} userStats={userStats} taskPoints={taskPoints} />;
      case 'analytics':
        return <AnalyticsTab userId={userId} />;
      case 'finance':  return <FinanceTab profile={profile} />;
      case 'settings':
        return <SettingsTab profile={profile} userId={userId} onProfileUpdate={handleProfileUpdate} />;
      case 'sobriety':
        return <SobrietyTab theme={profile.theme} userName={profile.name} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: profile.theme.bg }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={profile.name}
        theme={profile.theme}
        goals={profile.goals}
        userStats={userStats}
        taskPoints={taskPoints}
      />
      <main className="pb-24">{renderContent()}</main>
      <FloatingActionButton onAdd={handleAdd} />
    </div>
  );
}
