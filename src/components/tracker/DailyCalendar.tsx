import React, { useEffect, useMemo, useState } from 'react';
import type { DailyData } from '../../lib/trackerTypes';
import {
  formatFullDateLabel,
  getDateForDay,
  getProgramEndDate,
  getWeekDayFromDate,
  parseIsoDate
} from '../../lib/trackerDates';

type DailyCalendarProps = {
  startDate: string;
  currentWeek: number;
  currentDay: number;
  dailyData: DailyData;
  onSelectDay: (week: number, day: number) => void;
};

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

const isSameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function DailyCalendar({
  startDate,
  currentWeek,
  currentDay,
  dailyData,
  onSelectDay
}: DailyCalendarProps) {
  const programStart = useMemo(() => parseIsoDate(startDate), [startDate]);
  const programEnd = useMemo(() => getProgramEndDate(startDate), [startDate]);
  const selectedDate = useMemo(
    () => getDateForDay(startDate, currentWeek, currentDay),
    [startDate, currentWeek, currentDay]
  );
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const base = selectedDate ?? programStart ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (!selectedDate) return;
    setDisplayMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  if (!programStart || !programEnd) {
    return (
      <div className="surface-panel p-5 rounded-2xl mb-6">
        <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-2">Calendar</h3>
        <p className="text-sm text-[#6a5b4a]">Set a start date to unlock the calendar.</p>
      </div>
    );
  }

  const minMonth = new Date(programStart.getFullYear(), programStart.getMonth(), 1);
  const maxMonth = new Date(programEnd.getFullYear(), programEnd.getMonth(), 1);
  const canGoPrev =
    displayMonth.getFullYear() > minMonth.getFullYear() ||
    (displayMonth.getFullYear() === minMonth.getFullYear() &&
      displayMonth.getMonth() > minMonth.getMonth());
  const canGoNext =
    displayMonth.getFullYear() < maxMonth.getFullYear() ||
    (displayMonth.getFullYear() === maxMonth.getFullYear() &&
      displayMonth.getMonth() < maxMonth.getMonth());

  const firstOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const position = getWeekDayFromDate(startDate, date);
    const entry = position ? dailyData[position.week]?.[position.day] : null;
    return {
      date,
      inMonth: date.getMonth() === displayMonth.getMonth(),
      position,
      hasWeight: Boolean(entry?.weight),
      hasCalories: Boolean(entry?.calories),
      hasWorkout: Boolean(entry?.workout)
    };
  });

  const today = new Date();

  return (
    <div className="surface-panel p-5 rounded-2xl mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-xl font-display font-semibold text-[#2a2219]">Calendar</h3>
          <p className="text-xs text-[#6a5b4a]">Tap a date to jump to that daily log.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              canGoPrev &&
              setDisplayMonth(
                new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1)
              )
            }
            className={`btn btn-outline text-xs ${!canGoPrev ? 'opacity-50 pointer-events-none' : ''}`}
          >
            Prev
          </button>
          <div className="text-sm font-semibold text-[#2a2219]">
            {monthFormat.format(displayMonth)}
          </div>
          <button
            onClick={() =>
              canGoNext &&
              setDisplayMonth(
                new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1)
              )
            }
            className={`btn btn-outline text-xs ${!canGoNext ? 'opacity-50 pointer-events-none' : ''}`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-xs text-[#8a7b69] mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <div key={label} className="px-2 py-1 text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(({ date, inMonth, position, hasWeight, hasCalories, hasWorkout }) => {
          const isSelected =
            position &&
            position.week === currentWeek &&
            position.day === currentDay;
          const isToday = isSameDate(date, today);
          const isWithinProgram = Boolean(position);
          return (
            <button
              key={date.toISOString()}
              onClick={() => position && onSelectDay(position.week, position.day)}
              disabled={!isWithinProgram}
              title={formatFullDateLabel(date)}
              className={`rounded-2xl border px-2 py-2 text-left text-xs transition ${
                isSelected
                  ? 'bg-[#2a2219] text-white border-[#2a2219]'
                  : 'bg-white/85 text-[#2a2219] border-[#e7ded2] hover:bg-white'
              } ${!inMonth ? 'opacity-40' : ''} ${
                !isWithinProgram ? 'opacity-30 cursor-not-allowed' : ''
              } ${isToday ? 'ring-2 ring-[#b0895a]/70 ring-offset-1 ring-offset-[#f6f0e7]' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{date.getDate()}</span>
                {position && (
                  <span className="text-[10px] opacity-70">
                    W{position.week}·D{position.day}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${hasWeight ? 'bg-[#2a2219]' : 'bg-[#e7ded2]'}`}
                />
                <span
                  className={`h-2 w-2 rounded-full ${
                    hasCalories ? 'bg-[#8c6a3f]' : 'bg-[#e7ded2]'
                  }`}
                />
                <span
                  className={`h-2 w-2 rounded-full ${
                    hasWorkout ? 'bg-[#4b5a4a]' : 'bg-[#e7ded2]'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#6a5b4a]">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#2a2219]" />
          Weight
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#8c6a3f]" />
          Calories
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4b5a4a]" />
          Workout
        </span>
      </div>
    </div>
  );
}
