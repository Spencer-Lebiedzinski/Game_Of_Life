import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { analyticsData } from '../../data/mockData';

const insights = [
  { title: "Peak Productivity", text: "You're most productive on Wednesdays. Schedule your hardest tasks then.", icon: "📈" },
  { title: "Sleep Trend", text: "Your sleep improved 15% this week. Keep maintaining that 8-hour goal!", icon: "😴" },
  { title: "Fitness Consistency", text: "You hit 3/5 workouts. Try adding a short walk on low-energy days.", icon: "💪" },
  { title: "Weekend Dip", text: "Productivity drops on weekends. Consider lighter tasks to keep momentum.", icon: "🎯" },
];

export default function AnalyticsTab() {
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Analytics</h1>
        <p className="text-gray-500 text-sm">Your weekly progress at a glance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Productivity */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-1">Productivity</h3>
          <p className="text-xs text-gray-400 mb-4">Task completion rate this week</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={analyticsData.productivity}>
              <defs>
                <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(v) => [`${v}%`, 'Productivity']}
              />
              <Area type="monotone" dataKey="value" stroke="#6EE7B7" strokeWidth={2} fill="url(#gradProd)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fitness */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-dark text-sm mb-1">Fitness Activity</h3>
          <p className="text-xs text-gray-400 mb-4">Daily activity score this week</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={analyticsData.fitness} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(v) => [`${v}%`, 'Activity']}
              />
              <Bar dataKey="value" fill="#60A5FA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sleep */}
        <div className="bg-white rounded-2xl shadow-sm p-5 lg:col-span-2">
          <h3 className="font-semibold text-dark text-sm mb-1">Sleep Hours</h3>
          <p className="text-xs text-gray-400 mb-4">Hours of sleep per night</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={analyticsData.sleep}>
              <defs>
                <linearGradient id="gradSleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCD34D" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FCD34D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} hide />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(v) => [`${v}h`, 'Sleep']}
              />
              <Line type="monotone" dataKey="value" stroke="#FCD34D" strokeWidth={2.5} dot={{ fill: '#FCD34D', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-dark mb-4">Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl shrink-0">{insight.icon}</span>
              <div>
                <p className="font-medium text-sm text-dark">{insight.title}</p>
                <p className="text-xs text-gray-500 mt-1">{insight.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
