import { lifeScore } from '../data/mockData';

function CircleProgress({ value, color, size = 80 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth="6" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth="6"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold" fill="#111827" fontSize="14">
        {value}
      </text>
    </svg>
  );
}

function BarItem({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-semibold text-dark">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function LifeScore() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold text-dark mb-4 text-sm">Life Score</h3>

      {/* Main Score */}
      <div className="flex items-center justify-center mb-5">
        <div className="relative">
          <CircleProgress value={lifeScore.overall} color="#2DD4BF" size={100} />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            Life Score
          </div>
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-3">
        <BarItem label="Productivity" value={lifeScore.productivity} color="#6EE7B7" />
        <BarItem label="Health" value={lifeScore.health} color="#60A5FA" />
        <BarItem label="Social" value={lifeScore.social} color="#A78BFA" />
        <BarItem label="Sleep" value={lifeScore.sleep} color="#FCD34D" />
      </div>
    </div>
  );
}
