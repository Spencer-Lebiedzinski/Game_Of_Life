import { useState } from 'react';
import { Plus, X, CheckSquare, Dumbbell, Target } from 'lucide-react';

export default function FloatingActionButton({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'task' | 'workout' | 'goal'
  const [input, setInput] = useState('');

  const actions = [
    { id: 'task', label: 'Add Task', icon: CheckSquare, color: 'bg-secondary' },
    { id: 'workout', label: 'Add Workout', icon: Dumbbell, color: 'bg-primary' },
    { id: 'goal', label: 'Add Goal', icon: Target, color: 'bg-accent' },
  ];

  const handleSubmit = () => {
    if (input.trim()) {
      onAdd?.(modal, input.trim());
      setInput('');
      setModal(null);
      setOpen(false);
    }
  };

  return (
    <>
      {/* Mini modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-dark mb-3 capitalize">New {modal}</h3>
            <input
              autoFocus
              type="text"
              placeholder={`Enter ${modal} name...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-accent text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Add {modal}
              </button>
              <button
                onClick={() => { setModal(null); setInput(''); }}
                className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Sub-actions */}
        {open && (
          <div className="flex flex-col items-end gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => { setModal(action.id); setOpen(false); }}
                  className={`${action.color} text-white flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg hover:opacity-90 transition-all text-sm font-medium`}
                >
                  <Icon size={16} />
                  {action.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            open
              ? 'bg-gray-800 rotate-45'
              : 'bg-gradient-to-br from-primary to-accent hover:scale-110'
          }`}
        >
          {open ? <X size={22} className="text-white" /> : <Plus size={26} className="text-white" />}
        </button>
      </div>
    </>
  );
}
