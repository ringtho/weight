import { DAYS_PER_WEEK, TOTAL_WEEKS } from './trackerData';

const formatDay = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});

const formatFullDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

export const parseIsoDate = (value: string): Date | null => {
  if (typeof value !== 'string') return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDateForDay = (startDate: string, week: number, dayIndex: number) => {
  const start = parseIsoDate(startDate);
  if (!start) return null;
  const offset = (week - 1) * DAYS_PER_WEEK + (dayIndex - 1);
  const date = new Date(start);
  date.setDate(start.getDate() + offset);
  return date;
};

export const formatDayLabel = (date: Date) => formatDay.format(date).replace(',', '');

export const formatFullDateLabel = (date: Date) => formatFullDate.format(date).replace(',', '');

export const getDayLabel = (startDate: string, week: number, dayIndex: number) => {
  const date = getDateForDay(startDate, week, dayIndex);
  if (!date) return `Day ${dayIndex}`;
  return formatDayLabel(date);
};

export const getProgramEndDate = (startDate: string, totalWeeks = TOTAL_WEEKS) => {
  const start = parseIsoDate(startDate);
  if (!start) return null;
  const date = new Date(start);
  date.setDate(start.getDate() + totalWeeks * DAYS_PER_WEEK - 1);
  return date;
};

export const getWeekDayFromDate = (startDate: string, targetDate: Date, totalWeeks = TOTAL_WEEKS) => {
  const start = parseIsoDate(startDate);
  if (!start) return null;

  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const targetUtc = Date.UTC(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );
  const diffDays = Math.floor((targetUtc - startUtc) / 86400000);
  if (diffDays < 0) return null;
  if (diffDays >= totalWeeks * DAYS_PER_WEEK) return null;

  const week = Math.floor(diffDays / DAYS_PER_WEEK) + 1;
  const day = (diffDays % DAYS_PER_WEEK) + 1;
  return { week, day };
};
