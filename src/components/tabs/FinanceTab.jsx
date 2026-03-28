export default function FinanceTab() {
  const placeholders = [
    { label: "Monthly Budget", value: "$1,200", change: "+5%", icon: "💰", color: "bg-green-50 border-green-100" },
    { label: "Spent This Month", value: "$840", change: "70%", icon: "📊", color: "bg-blue-50 border-blue-100" },
    { label: "Savings Goal", value: "$500", change: "60%", icon: "🏦", color: "bg-purple-50 border-purple-100" },
    { label: "Screen Time", value: "3.2h/day", change: "-0.5h", icon: "📱", color: "bg-yellow-50 border-yellow-100" },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Finance & Screen Time</h1>
        <p className="text-gray-500 text-sm">Coming soon — placeholder data</p>
      </div>

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
