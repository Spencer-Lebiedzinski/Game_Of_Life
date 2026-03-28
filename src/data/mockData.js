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
