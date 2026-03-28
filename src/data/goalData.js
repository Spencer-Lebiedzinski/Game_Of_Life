// Shared goal config used by both Onboarding and Settings

export const GOAL_OPTIONS = [
  { id: 'school',  label: 'Crush School',  icon: '📚', desc: 'Assignments, exams & study goals' },
  { id: 'fitness', label: 'Get Fit',        icon: '💪', desc: 'Workouts, steps & health habits' },
  { id: 'mindset', label: 'Build Mindset',  icon: '🧠', desc: 'Journaling, mood & gratitude' },
  { id: 'social',  label: 'Grow Socially',  icon: '🤝', desc: 'Friendships & connections' },
  { id: 'finance', label: 'Manage Money',   icon: '💰', desc: 'Budget, spending & savings' },
  { id: 'sleep',   label: 'Sleep Better',   icon: '😴', desc: 'Track & improve sleep quality' },
];

export const CLARIFY_QUESTIONS = {
  school: [
    {
      question: "What's your biggest academic challenge?",
      options: [
        { id: 'assignments', icon: '📝', label: 'Staying on top of assignments', desc: 'Deadlines keep sneaking up on me' },
        { id: 'grades',      icon: '📈', label: 'Improving my grades',           desc: 'I know I can do better' },
        { id: 'time',        icon: '⏰', label: 'Time management',                desc: 'Too much to do, too little time' },
        { id: 'anxiety',     icon: '😰', label: 'Test anxiety',                  desc: 'I freeze up during exams' },
      ],
    },
    {
      question: 'How do you usually study?',
      options: [
        { id: 'alone',     icon: '🎧', label: 'Alone with music or noise', desc: 'Headphones in, world out' },
        { id: 'groups',    icon: '👥', label: 'Study groups',              desc: 'Better with other people' },
        { id: 'silent',    icon: '📖', label: 'Total silence',             desc: 'Library or quiet room' },
        { id: 'scattered', icon: '🔀', label: 'No real method',            desc: 'Wherever I happen to be' },
      ],
    },
    {
      question: 'How far ahead do you usually plan?',
      options: [
        { id: 'week',     icon: '📅', label: 'A week ahead',  desc: 'I stay ahead of deadlines' },
        { id: 'day',      icon: '🌅', label: 'Day by day',    desc: 'I plan each morning' },
        { id: 'last-min', icon: '🚨', label: 'Last minute',   desc: 'I work best under pressure' },
        { id: 'reactive', icon: '🤷', label: "I don't plan",  desc: 'Just react to what comes up' },
      ],
    },
  ],
  fitness: [
    {
      question: "What's your main fitness goal?",
      options: [
        { id: 'weight',     icon: '⚖️', label: 'Lose weight',    desc: 'Feel better in my body' },
        { id: 'strength',   icon: '🏋️', label: 'Build strength',  desc: 'Get stronger over time' },
        { id: 'energy',     icon: '⚡', label: 'More energy',     desc: 'Stop feeling drained' },
        { id: 'consistent', icon: '🔄', label: 'Stay consistent', desc: 'Actually stick to it this time' },
      ],
    },
    {
      question: 'How often do you exercise right now?',
      options: [
        { id: 'never',  icon: '🛋️', label: 'Barely ever',  desc: 'Starting from zero' },
        { id: '1-2x',   icon: '🚶', label: '1–2x a week',  desc: 'Just getting started' },
        { id: '3-4x',   icon: '🏃', label: '3–4x a week',  desc: 'Pretty active' },
        { id: 'daily',  icon: '🔥', label: 'Almost daily', desc: 'Already consistent' },
      ],
    },
    {
      question: 'What gets in the way most?',
      options: [
        { id: 'time',       icon: '⏰', label: 'Not enough time',           desc: 'Too busy to work out' },
        { id: 'motivation', icon: '😴', label: 'Lack of motivation',        desc: "I know I should, but I don't" },
        { id: 'access',     icon: '📍', label: 'No gym or equipment',       desc: 'Location or gear issues' },
        { id: 'knowledge',  icon: '🤔', label: "Don't know where to start", desc: 'Unsure what to do' },
      ],
    },
  ],
  mindset: [
    {
      question: 'What do you want to work on mentally?',
      options: [
        { id: 'stress',     icon: '😤', label: 'Reduce stress',           desc: 'Feel less overwhelmed' },
        { id: 'sleep',      icon: '😴', label: 'Better sleep',            desc: 'Wake up actually rested' },
        { id: 'journal',    icon: '✍️', label: 'Journaling & reflection', desc: 'Process my thoughts' },
        { id: 'motivation', icon: '🔥', label: 'Stay motivated',          desc: 'Stop losing momentum' },
      ],
    },
    {
      question: 'How do you usually handle stress?',
      options: [
        { id: 'exercise', icon: '🏃', label: 'Exercise or walk',    desc: 'Move it out of my body' },
        { id: 'talk',     icon: '💬', label: 'Talk to someone',      desc: 'Process it out loud' },
        { id: 'media',    icon: '📱', label: 'Phone, TV, or gaming', desc: 'Distract myself' },
        { id: 'nothing',  icon: '🌀', label: 'I just sit with it',   desc: 'No real strategy yet' },
      ],
    },
    {
      question: 'How often do you feel overwhelmed?',
      options: [
        { id: 'rarely',    icon: '😊', label: 'Rarely',        desc: 'Usually feel in control' },
        { id: 'sometimes', icon: '😐', label: 'Sometimes',     desc: 'Comes and goes' },
        { id: 'often',     icon: '😟', label: 'Pretty often',  desc: 'Hard to keep up' },
        { id: 'always',    icon: '😵', label: 'Almost always', desc: 'Constantly overwhelmed' },
      ],
    },
  ],
  social: [
    {
      question: 'What matters most to you socially?',
      options: [
        { id: 'meet',    icon: '👋', label: 'Meet new people',         desc: 'Expand my circle' },
        { id: 'friends', icon: '❤️', label: 'Strengthen friendships',  desc: 'Be a better friend' },
        { id: 'phone',   icon: '📵', label: 'Less phone, more people', desc: 'Be present in real life' },
        { id: 'goals',   icon: '🎯', label: 'Set social goals',        desc: 'Be intentional about connections' },
      ],
    },
    {
      question: 'How would you describe your social life right now?',
      options: [
        { id: 'active',   icon: '🎉', label: 'Pretty active',      desc: 'I see people regularly' },
        { id: 'small',    icon: '👫', label: 'Small tight circle',  desc: 'Few but solid friendships' },
        { id: 'distant',  icon: '🌧️', label: 'Drifted from friends', desc: 'Used to be more social' },
        { id: 'isolated', icon: '🏠', label: 'Mostly isolated',     desc: 'I want more connection' },
      ],
    },
    {
      question: "What's your biggest social barrier?",
      options: [
        { id: 'anxiety',    icon: '😬', label: 'Social anxiety',          desc: 'I overthink interactions' },
        { id: 'time',       icon: '⏰', label: 'No time',                  desc: "I'm too busy" },
        { id: 'confidence', icon: '🪞', label: 'Confidence',               desc: "I don't know how to connect" },
        { id: 'location',   icon: '📍', label: 'Hard to meet people here', desc: 'Environment is the barrier' },
      ],
    },
  ],
  finance: [
    {
      question: "What's your biggest money challenge?",
      options: [
        { id: 'track',      icon: '📊', label: 'Track my spending',     desc: 'Know where it all goes' },
        { id: 'save',       icon: '🏦', label: 'Save more money',        desc: 'Build a financial cushion' },
        { id: 'debt',       icon: '💳', label: 'Get out of debt',        desc: 'Stop the cycle' },
        { id: 'understand', icon: '🤔', label: 'Understand my finances', desc: 'Feel in control of my money' },
      ],
    },
    {
      question: 'Do you currently have a budget?',
      options: [
        { id: 'yes-follow', icon: '✅', label: 'Yes, and I follow it', desc: 'Pretty disciplined' },
        { id: 'yes-ignore', icon: '📋', label: 'Yes, but I ignore it', desc: 'Have one, just forget it' },
        { id: 'thinking',   icon: '💭', label: 'Thinking about it',    desc: 'Want to start one' },
        { id: 'no',         icon: '❌', label: 'No budget at all',      desc: 'Flying blind' },
      ],
    },
    {
      question: "What's your relationship with money right now?",
      options: [
        { id: 'in-control', icon: '😌', label: 'Mostly in control',        desc: 'Could be better, but okay' },
        { id: 'stressed',   icon: '😰', label: 'Stressed about it',         desc: 'Worried regularly' },
        { id: 'avoidant',   icon: '🙈', label: 'I avoid thinking about it', desc: "It's overwhelming" },
        { id: 'clueless',   icon: '🤷', label: 'No idea where I stand',     desc: "I genuinely don't know" },
      ],
    },
  ],
  sleep: [
    {
      question: "What's your sleep struggle?",
      options: [
        { id: 'schedule', icon: '📅', label: 'Staying on a schedule', desc: 'My bedtime is all over the place' },
        { id: 'falling',  icon: '🌙', label: 'Falling asleep',        desc: "My mind won't quiet down" },
        { id: 'hours',    icon: '⏱️', label: 'Not enough hours',      desc: 'I never get enough sleep' },
        { id: 'quality',  icon: '💤', label: 'Sleep quality',         desc: 'I wake up exhausted anyway' },
      ],
    },
    {
      question: 'What time do you usually go to bed?',
      options: [
        { id: 'before-10', icon: '🌙', label: 'Before 10pm',           desc: 'Early bird' },
        { id: '10-12',     icon: '🕙', label: '10pm – midnight',        desc: 'Normal range' },
        { id: '12-2',      icon: '🕛', label: 'Midnight – 2am',         desc: 'Night owl' },
        { id: 'after-2',   icon: '☀️', label: 'After 2am / no pattern', desc: 'Very inconsistent' },
      ],
    },
    {
      question: 'What disrupts your sleep most?',
      options: [
        { id: 'phone',    icon: '📱', label: 'Phone before bed',  desc: 'Scrolling keeps me up' },
        { id: 'stress',   icon: '😤', label: 'Racing thoughts',   desc: "Can't stop thinking" },
        { id: 'caffeine', icon: '☕', label: 'Caffeine or food',  desc: 'Late coffee or late snacks' },
        { id: 'env',      icon: '🔊', label: 'Environment',       desc: 'Noise, light, or temperature' },
      ],
    },
  ],
};

export const THEMES = [
  { id: 'mint',   label: 'Mint Fresh',  primary: '#6EE7B7', secondary: '#60A5FA', accent: '#2DD4BF', bg: '#F9FAFB', preview: ['bg-emerald-300', 'bg-blue-400',   'bg-teal-400']    },
  { id: 'sunset', label: 'Sunset Vibe', primary: '#FCA5A5', secondary: '#FDBA74', accent: '#F472B6', bg: '#FFF7ED', preview: ['bg-red-300',     'bg-orange-300', 'bg-pink-400']    },
  { id: 'ocean',  label: 'Deep Ocean',  primary: '#7DD3FC', secondary: '#A5B4FC', accent: '#38BDF8', bg: '#F0F9FF', preview: ['bg-sky-300',     'bg-indigo-300', 'bg-sky-400']     },
  { id: 'forest', label: 'Forest Mode', primary: '#86EFAC', secondary: '#A3E635', accent: '#34D399', bg: '#F0FDF4', preview: ['bg-green-300',   'bg-lime-400',   'bg-emerald-400'] },
  { id: 'galaxy', label: 'Galaxy Dark', primary: '#C084FC', secondary: '#818CF8', accent: '#E879F9', bg: '#0F172A', preview: ['bg-purple-400',  'bg-indigo-400', 'bg-fuchsia-400'], dark: true },
  { id: 'candy',  label: 'Candy Pop',   primary: '#F9A8D4', secondary: '#FDE68A', accent: '#6EE7B7', bg: '#FDF2F8', preview: ['bg-pink-300',    'bg-yellow-200', 'bg-emerald-300'] },
];

export const GOAL_TO_BACKEND = {
  school: 'better_grades', fitness: 'lose_weight', mindset: 'reduce_stress',
  social: 'be_more_social', finance: 'save_money', sleep: 'sleep_better',
};
