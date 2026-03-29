import { Check, Clock } from 'lucide-react';
import { categoryColors } from '../data/mockData';

export default function TaskList({ tasks, onToggle, disableToggle = false, loading = false }) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Loading plan...</p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No tasks for this day</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const colors = categoryColors[task.category] || categoryColors.school;
        return (
          <div
            key={task.id}
            onClick={() => !disableToggle && onToggle(task.id)}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              disableToggle ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'
            } ${
              task.done ? 'bg-gray-50 opacity-70' : 'bg-white border border-gray-100'
            }`}
          >
            {/* Checkbox */}
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                task.done
                  ? 'bg-accent border-accent'
                  : 'border-gray-300 hover:border-accent'
              }`}
            >
              {task.done && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${task.done ? 'line-through text-gray-400' : 'text-dark'}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                  {task.description}
                </p>
              )}
              {task.time && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-400">{task.time}</span>
                </div>
              )}
            </div>

            {/* Category badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${colors.bg} ${colors.text}`}>
              {task.category}
            </span>
          </div>
        );
      })}
    </div>
  );
}
