import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTabData } from '../../hooks/useTabData';

const FINANCE_TIPS = {
  track: {
    headline: 'Tracking your spending',
    tips: [
      'Write down every purchase today — even small ones. Awareness comes before control.',
      'Categorize last month\'s spending into 4 buckets: needs, wants, savings, debt.',
      'Set a weekly "money date" with yourself — 10 minutes to review the numbers.',
    ],
  },
  save: {
    headline: 'Building savings',
    tips: [
      'Open a separate savings account and name it after your goal — it makes it real.',
      'Automate a fixed transfer on payday, even if it\'s small. Automation beats willpower.',
      'Find one recurring charge you can cut this week. Most people have at least one.',
    ],
  },
  debt: {
    headline: 'Getting out of debt',
    tips: [
      'List all your debts: balance, minimum payment, and interest rate for each.',
      'Pay minimums on all, then attack the highest-interest debt first (avalanche method).',
      'Stop adding new debt while you pay it down — even a small freeze helps.',
    ],
  },
  understand: {
    headline: 'Understanding your finances',
    tips: [
      'Calculate your actual monthly take-home income — the after-tax number.',
      'List your fixed costs: rent, subscriptions, loans. These don\'t change month to month.',
      'What\'s left is discretionary budget. Starting from that number gives you clarity.',
    ],
  },
};

const BUDGET_CONTEXT = {
  'yes-follow': 'You already budget and follow it — the next step is optimizing. Even raising savings by 1% this month compounds over time.',
  'yes-ignore': 'You have a budget but don\'t follow it — the gap is usually visibility. Putting it somewhere you see daily tends to help.',
  'thinking':   'The 50/30/20 rule is a simple starting point: 50% needs, 30% wants, 20% savings.',
  'no':         'Starting without a budget usually means starting with just tracking — no rules yet, just awareness of where it goes.',
};

const MONEY_MINDSET_CONTEXT = {
  'in-control': 'You\'re in a stable position. The question shifts from survival to optimization — what\'s the one move that compounds most?',
  'stressed':   'Financial stress is real and draining. A $500 emergency fund tends to change the feeling significantly — it\'s a worth first target.',
  'avoidant':   'Avoidance usually makes it worse over time. Spending just 10 minutes looking at your accounts this week — no decisions, just looking — is a good first step.',
  'clueless':   'No judgment at all. Starting with one number — monthly take-home — unlocks everything else.',
};

export default function FinanceTab({ profile, userId }) {
  const [expenses, setExpenses]   = useTabData(userId, 'finance', []);
  const [showAdd, setShowAdd]     = useState(false);
  const [newDesc, setNewDesc]     = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCat, setNewCat]       = useState('Needs');

  const financeDetails = profile?.goalDetails?.finance;
  const challenge  = financeDetails?.[0];
  const budgetSit  = financeDetails?.[1];
  const moneyMind  = financeDetails?.[2];
  const tips       = FINANCE_TIPS[challenge] ?? null;

  const handleAdd = () => {
    if (!newDesc.trim() || !newAmount) return;
    setExpenses((prev) => [
      ...prev,
      { id: Date.now(), desc: newDesc.trim(), amount: parseFloat(newAmount), cat: newCat, date: 'Today' },
    ]);
    setNewDesc('');
    setNewAmount('');
    setNewCat('Needs');
    setShowAdd(false);
  };

  const handleDelete = (id) => setExpenses((prev) => prev.filter((e) => e.id !== id));

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const catTotals = expenses.reduce((acc, e) => {
    acc[e.cat] = (acc[e.cat] ?? 0) + e.amount;
    return acc;
  }, {});

  const catColors = {
    Needs:    'bg-blue-400',
    Wants:    'bg-purple-400',
    Savings:  'bg-green-400',
    Debt:     'bg-red-400',
    Other:    'bg-gray-400',
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Finance</h1>
        <p className="text-gray-500 text-sm">Log expenses and stay aware of your spending</p>
      </div>

      {/* Tips based on onboarding */}
      {tips && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-l-4 border-orange-400">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Based on what you shared</span>
          <h2 className="text-lg font-bold text-dark mt-1 mb-3">{tips.headline}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {tips.tips.map((tip, i) => (
              <div key={i} className="bg-orange-50 rounded-xl p-3 text-xs text-orange-900">
                <span className="font-bold mr-1">{i + 1}.</span>{tip}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {budgetSit && BUDGET_CONTEXT[budgetSit] && (
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-dark">Budget: </span>{BUDGET_CONTEXT[budgetSit]}
              </div>
            )}
            {moneyMind && MONEY_MINDSET_CONTEXT[moneyMind] && (
              <div className="flex-1 bg-yellow-50 rounded-xl px-3 py-2 text-xs text-yellow-800">
                <span className="font-semibold">Mindset: </span>{MONEY_MINDSET_CONTEXT[moneyMind]}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log expense */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-dark">Expense Tracker</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border-2 border-primary">
          <h3 className="font-semibold text-dark mb-3">Log an Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <input
              type="number"
              placeholder="Amount ($)"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              <option>Needs</option>
              <option>Wants</option>
              <option>Savings</option>
              <option>Debt</option>
              <option>Other</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">Add</button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense list */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-dark text-sm">Logged Expenses</h3>
            {totalSpent > 0 && (
              <span className="text-sm font-bold text-dark">${totalSpent.toFixed(2)} total</span>
            )}
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-sm text-gray-400">No expenses logged yet.</p>
              <p className="text-xs text-gray-300 mt-1">Start tracking to build awareness.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{e.desc}</p>
                    <p className="text-xs text-gray-400">{e.cat} • {e.date}</p>
                  </div>
                  <span className="text-sm font-bold text-dark shrink-0">${e.amount.toFixed(2)}</span>
                  <button onClick={() => handleDelete(e.id)} className="p-1 hover:text-red-500 text-gray-400 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spending breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-4">Spending Breakdown</h3>
          {Object.keys(catTotals).length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm text-gray-400">Log expenses to see your breakdown.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(catTotals).map(([cat, amount]) => {
                const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{cat}</span>
                      <span className="font-semibold text-dark">${amount.toFixed(2)} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${catColors[cat] ?? 'bg-gray-400'} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
