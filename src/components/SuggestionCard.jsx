import { CheckCircle, Circle, Zap } from 'lucide-react';

const DOMAIN_META = {
  grades:   { icon: '📚', label: 'School',   color: 'bg-blue-50   text-blue-700   border-blue-200'   },
  health:   { icon: '💪', label: 'Fitness',  color: 'bg-green-50  text-green-700  border-green-200'  },
  finance:  { icon: '💰', label: 'Finance',  color: 'bg-orange-50 text-orange-700 border-orange-200' },
  social:   { icon: '🤝', label: 'Social',   color: 'bg-purple-50 text-purple-700 border-purple-200' },
  wellness: { icon: '🧠', label: 'Mindset',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

const DIFFICULTY_COLOR = {
  easy:   'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  hard:   'text-red-500 bg-red-50 border-red-200',
};

export default function SuggestionCard({ suggestion, onComplete, theme }) {
  const { domain, action, xp, difficulty, reason, completed } = suggestion;
  const meta = DOMAIN_META[domain] || DOMAIN_META.wellness;
  const accent = theme?.accent || '#2DD4BF';

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-4 transition-all ${completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          onClick={() => !completed && onComplete(suggestion)}
          className="mt-0.5 shrink-0"
          disabled={completed}
        >
          {completed
            ? <CheckCircle size={22} style={{ color: accent }} />
            : <Circle size={22} className="text-gray-300 hover:text-accent transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{meta.icon}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                {meta.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFFICULTY_COLOR[difficulty]}`}>
                {difficulty}
              </span>
            </div>
            {/* XP badge */}
            <div
              className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
              style={{ backgroundColor: accent }}
            >
              <Zap size={10} />
              +{xp} XP
            </div>
          </div>

          {/* Action */}
          <p className={`font-semibold text-sm mb-1 ${completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {action}
          </p>

          {/* Reason */}
          <p className="text-xs text-gray-500 leading-relaxed">{reason}</p>
        </div>
      </div>
    </div>
  );
}
