import { useState } from 'react';
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
import SuggestionsTab from './components/tabs/SuggestionsTab';
import SettingsTab from './components/tabs/SettingsTab';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState(weekTasks);
  const [selectedDay, setSelectedDay] = useState(getTodayKey());

  // Real Auth0 user ID, falls back to placeholder if Auth0 not configured
  const userId = user?.sub || 'frontend-user';

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

  const handleAdd = (type, name) => {
    if (type === 'task') {
      const newTask = {
        id: Date.now(),
        title: name,
        category: 'school',
        time: '',
        done: false,
      };
      setTasks((prev) => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), newTask],
      }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🎮</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} userId={userId} />;
  }

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
          />
        );
      case 'school':
        return <SchoolTab profile={profile} />;
      case 'fitness':
        return <FitnessTab profile={profile} />;
      case 'mindset':
        return <MindsetTab profile={profile} />;
      case 'social':
        return <SocialTab theme={profile.theme} userName={profile.name} profile={profile} />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'finance':
        return <FinanceTab profile={profile} />;
      case 'suggestions':
        return <SuggestionsTab userName={profile.name} theme={profile.theme} goals={profile.goals} userId={userId} />;
      case 'settings':
        return <SettingsTab profile={profile} userId={userId} onProfileUpdate={handleProfileUpdate} />;
      default:
        return null;
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
      />
      <main className="pb-24">
        {renderContent()}
      </main>
      <FloatingActionButton onAdd={handleAdd} />
    </div>
  );
}
