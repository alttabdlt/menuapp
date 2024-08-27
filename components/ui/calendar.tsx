import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

interface CalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect }) => {
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selected));

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>{format(currentMonth, 'MMMM yyyy')}</div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center font-bold">
            {day}
          </div>
        ))}
        {days.map((day) => (
          <button
            key={day.toString()}
            onClick={() => onSelect(day)}
            className={`p-2 rounded-full ${
              isSameMonth(day, currentMonth)
                ? isSameDay(day, selected)
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200'
                : 'text-gray-400'
            }`}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  );
};