import { useState } from 'react';
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
import { weekTasks } from './data/mockData';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTodayKey() {
  const d = new Date().getDay();
  return DAYS[d === 0 ? 6 : d - 1];
}

export default function App() {
  const [profile, setProfile] = useState(null); // null = not logged in
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState(weekTasks);
  const [selectedDay, setSelectedDay] = useState(getTodayKey());

  const handleOnboardingComplete = (data) => {
    setProfile(data);
    // Apply theme CSS variables
    const { theme } = data;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-bg', theme.bg);
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

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
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
        return <SchoolTab />;
      case 'fitness':
        return <FitnessTab />;
      case 'mindset':
        return <MindsetTab />;
      case 'social':
        return <SocialTab theme={profile.theme} userName={profile.name} />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'finance':
        return <FinanceTab />;
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
      />
      <main className="pb-24">
        {renderContent()}
      </main>
      <FloatingActionButton onAdd={handleAdd} />
    </div>
  );
}
