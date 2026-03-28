const FINANCE_PLANS = {
  track: {
    headline: 'Know Where Every Dollar Goes',
    steps: ['Write down every purchase today — even $1', 'Categorize last month\'s spending in 4 buckets: needs, wants, savings, debt', 'Set a weekly "money date" to review your numbers'],
  },
  save: {
    headline: 'Build Your Financial Cushion',
    steps: ['Open a separate savings account — name it your goal', 'Automate a fixed transfer on payday, even $10', 'Find one recurring charge you can cut this week'],
  },
  debt: {
    headline: 'The Debt Elimination Path',
    steps: ['List all debts: balance, minimum payment, interest rate', 'Pay minimums on all, attack the highest-interest debt first (avalanche)', 'Stop adding new debt — freeze the card if needed'],
  },
  understand: {
    headline: 'Financial Clarity First',
    steps: ['Calculate your actual monthly take-home income', 'List your fixed costs (rent, subscriptions, loans)', 'What\'s left is your discretionary budget — work from there'],
  },
};

const BUDGET_TIPS = {
  'yes-follow': 'You already budget and follow it — optimize. Raise your savings rate by 1% this month.',
  'yes-ignore': 'You have a budget — the gap is execution. Put it somewhere you see it daily.',
  'thinking':   'Start with the 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
  'no':         'No budget = no control. Start with just tracking — no rules, just awareness.',
};

const MONEY_MINDSET_TIPS = {
  'in-control':  'You\'re stable. Now optimize — what\'s the one move that compounds most?',
  'stressed':    'Financial stress is real. Focus on building a $500 emergency fund first — it changes everything.',
  'avoidant':    'Avoidance makes it worse. Spend 10 minutes this week just looking at your accounts. That\'s it.',
  'clueless':    'No judgment. Start here: what\'s your monthly take-home? That one number unlocks everything.',
};

export default function FinanceTab({ profile }) {
  const financeDetails = profile?.goalDetails?.finance;
  const challenge  = financeDetails?.[0];
  const budgetSit  = financeDetails?.[1];
  const moneyMind  = financeDetails?.[2];
  const plan       = FINANCE_PLANS[challenge] ?? null;
  const placeholders = [
    { label: "Monthly Budget", value: "$1,200", change: "+5%", icon: "💰", color: "bg-green-50 border-green-100" },
    { label: "Spent This Month", value: "$840", change: "70%", icon: "📊", color: "bg-blue-50 border-blue-100" },
    { label: "Savings Goal", value: "$500", change: "60%", icon: "🏦", color: "bg-purple-50 border-purple-100" },
    { label: "Screen Time", value: "3.2h/day", change: "-0.5h", icon: "📱", color: "bg-yellow-50 border-yellow-100" },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Finance</h1>
        <p className="text-gray-500 text-sm">Your personalized money plan</p>
      </div>

      {plan && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4 border-orange-400">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Action Plan</span>
          <h2 className="text-lg font-bold text-dark mt-1 mb-3">{plan.headline}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {plan.steps.map((step, i) => (
              <div key={i} className="bg-orange-50 rounded-xl p-3 text-xs text-orange-900">
                <span className="font-bold mr-1">Step {i + 1}:</span>{step}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {budgetSit && BUDGET_TIPS[budgetSit] && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Budget situation: </span>{BUDGET_TIPS[budgetSit]}
              </div>
            )}
            {moneyMind && MONEY_MINDSET_TIPS[moneyMind] && (
              <div className="flex-1 bg-yellow-50 rounded-xl px-3 py-2 text-xs text-yellow-800">
                <span className="font-semibold">Money mindset: </span>{MONEY_MINDSET_TIPS[moneyMind]}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {placeholders.map((item) => (
          <div key={item.label} className={`bg-white rounded-2xl shadow-sm p-4 border ${item.color}`}>
            <span className="text-2xl">{item.icon}</span>
            <p className="text-xl font-bold text-dark mt-2">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            <p className="text-xs text-green-600 font-medium mt-1">{item.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-4">Spending Categories</h3>
          <div className="space-y-3">
            {[
              { label: "Food & Dining", amount: "$320", percent: 38, color: "bg-red-400" },
              { label: "Transportation", amount: "$120", percent: 14, color: "bg-blue-400" },
              { label: "Entertainment", amount: "$80", percent: 10, color: "bg-purple-400" },
              { label: "Shopping", amount: "$220", percent: 26, color: "bg-yellow-400" },
              { label: "Other", amount: "$100", percent: 12, color: "bg-gray-400" },
            ].map((cat) => (
              <div key={cat.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{cat.label}</span>
                  <span className="font-medium text-dark">{cat.amount}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-4">Screen Time by App</h3>
          <div className="space-y-3">
            {[
              { app: "Instagram", time: "45 min", icon: "📷", color: "bg-pink-100 text-pink-700" },
              { app: "YouTube", time: "62 min", icon: "▶️", color: "bg-red-100 text-red-700" },
              { app: "Messages", time: "28 min", icon: "💬", color: "bg-green-100 text-green-700" },
              { app: "TikTok", time: "35 min", icon: "🎵", color: "bg-gray-100 text-gray-700" },
            ].map((app) => (
              <div key={app.app} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                <span className={`text-xl w-9 h-9 rounded-xl ${app.color} flex items-center justify-center`}>
                  {app.icon}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">{app.app}</p>
                </div>
                <span className="text-sm font-semibold text-gray-600">{app.time}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-xs text-yellow-700">
            <strong>Tip:</strong> Connect your data source to see real screen time stats.
          </div>
        </div>
      </div>
    </div>
  );
}
