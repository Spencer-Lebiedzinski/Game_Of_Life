// Default task templates shown on first load — replaced by user's own tasks
export const weekTasks = {
  Mon: [],
  Tue: [],
  Wed: [],
  Thu: [],
  Fri: [],
  Sat: [],
  Sun: [],
};

export const assignments = [
  { id: 1, title: "CS131 - Inheritance Lab", due: "Apr 1", progress: 60, done: false, priority: "high" },
  { id: 2, title: "Math 141 - Problem Set 8", due: "Apr 3", progress: 30, done: false, priority: "medium" },
  { id: 3, title: "ENGL 202 - Essay Draft", due: "Apr 5", progress: 10, done: false, priority: "medium" },
  { id: 4, title: "CMPSC 311 - Systems Project", due: "Apr 8", progress: 75, done: false, priority: "high" },
  { id: 5, title: "STAT 200 - Quiz Prep", due: "Apr 10", progress: 90, done: true, priority: "low" },
];

export const workouts = [
  { id: 1, name: "Morning Run", type: "Cardio", duration: "30 min", date: "Mar 28", done: true },
  { id: 2, name: "Upper Body Lift", type: "Strength", duration: "45 min", date: "Mar 26", done: true },
  { id: 3, name: "Yoga Flow", type: "Flexibility", duration: "20 min", date: "Mar 25", done: true },
  { id: 4, name: "HIIT Blast", type: "Cardio", duration: "25 min", date: "Mar 30", done: false },
  { id: 5, name: "Leg Day", type: "Strength", duration: "50 min", date: "Mar 31", done: false },
];

export const weeklyFitnessGoal = { completed: 3, total: 5 };

export const friends = [
  { id: 1, name: "Jordan", level: 9, xp: 5200, streak: 20, taskPoints: 340, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan", badges: ["🏆", "💪"] },
  { id: 2, name: "Taylor", level: 7, xp: 3800, streak: 15, taskPoints: 210, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor", badges: ["📚", "🔥"] },
  { id: 3, name: "Alex (You)", level: 7, xp: 3420, streak: 12, taskPoints: 0, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex", badges: ["🏆", "🔥"], isMe: true },
  { id: 4, name: "Morgan", level: 6, xp: 2900, streak: 8, taskPoints: 150, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Morgan", badges: ["🌟"] },
  { id: 5, name: "Casey", level: 5, xp: 2100, streak: 5, taskPoints: 80, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Casey", badges: ["📚"] },
];

export const analyticsData = {
  productivity: [
    { day: "Mon", value: 85 }, { day: "Tue", value: 72 }, { day: "Wed", value: 90 },
    { day: "Thu", value: 68 }, { day: "Fri", value: 78 }, { day: "Sat", value: 55 }, { day: "Sun", value: 60 },
  ],
  fitness: [
    { day: "Mon", value: 80 }, { day: "Tue", value: 90 }, { day: "Wed", value: 60 },
    { day: "Thu", value: 75 }, { day: "Fri", value: 40 }, { day: "Sat", value: 95 }, { day: "Sun", value: 30 },
  ],
  sleep: [
    { day: "Mon", value: 7 }, { day: "Tue", value: 6 }, { day: "Wed", value: 8 },
    { day: "Thu", value: 7.5 }, { day: "Fri", value: 5 }, { day: "Sat", value: 9 }, { day: "Sun", value: 8 },
  ],
};

export const mindsetPrompts = [
  "Compliment someone today",
  "Text a friend you haven't spoken to in a while",
  "Take 5 deep breaths before your first task",
  "Write 3 things you're grateful for",
  "Do one kind thing for a stranger",
];

export const notifications = [
  { id: 1, text: "Complete your first daily check-in to earn XP! 🎯", time: "now" },
  { id: 2, text: "Try generating AI quests for personalized suggestions ✨", time: "now" },
];

export const categoryColors = {
  school:  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  fitness: { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  social:  { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  mindset: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  health:  { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  finance: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
};
