const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyCalendar({ selectedDay, setSelectedDay, taskCounts }) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  // Map to Mon=0..Sun=6
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Get date numbers for this week
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayIdx);

  const dates = DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {DAYS.map((day, i) => {
          const isToday = i === todayIdx;
          const isSelected = selectedDay === day;
          const count = taskCounts[day] || 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[48px] flex flex-col items-center py-3 px-2 rounded-xl transition-all ${
                isSelected
                  ? 'bg-accent text-white shadow-md scale-105'
                  : isToday
                  ? 'bg-green-50 text-accent border-2 border-accent'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-white' : ''}`}>
                {day}
              </span>
              <span className={`text-lg font-bold ${isSelected ? 'text-white' : isToday ? 'text-accent' : 'text-dark'}`}>
                {dates[i]}
              </span>
              {count > 0 && (
                <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
