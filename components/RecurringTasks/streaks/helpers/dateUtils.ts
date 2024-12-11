import { format, isBefore, isAfter, startOfDay, 
  endOfDay, addDays, addWeeks, addMonths, addYears, 
  isSameDay, isWeekend, isWithinInterval, differenceInDays } from 'date-fns';
import { DateRange, TimeUnit } from '../types';

export function isWorkday(date: Date): boolean {
  return !isWeekend(date);
}

export function isWithinRange(date: Date, range: DateRange): boolean {
  return isWithinInterval(date, { 
    start: startOfDay(range.start), 
    end: endOfDay(range.end) 
  });
}

export function getNextOccurrence(
  baseDate: Date,
  interval: number,
  unit: TimeUnit
): Date {
  switch (unit) {
    case 'day':
      return addDays(baseDate, interval);
    case 'week':
      return addWeeks(baseDate, interval);
    case 'month':
      return addMonths(baseDate, interval);
    case 'year':
      return addYears(baseDate, interval);
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

export function formatDateForComparison(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function areDatesEqual(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

export function isDateBefore(date1: Date, date2: Date): boolean {
  return isBefore(startOfDay(date1), startOfDay(date2));
}

export function isDateAfter(date1: Date, date2: Date): boolean {
  return isAfter(startOfDay(date1), startOfDay(date2));
}

export function getLastDayOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function getNthWeekdayOfMonth(date: Date, n: number, dayOfWeek: number): Date {
  if (n < 1 || n > 5) {
    throw new Error('Week number must be between 1 and 5');
  }
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error('Day of week must be between 0 and 6');
  }

  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  let count = 0;
  let current = startOfDay(firstDayOfMonth);

  while (count < n && current.getMonth() === date.getMonth()) {
    if (current.getDay() === dayOfWeek) {
      count++;
      if (count === n) {
        return current;
      }
    }
    current = addDays(current, 1);
  }

  throw new Error(`No ${n}th ${dayOfWeek} found in the month`);
}

export function getLastWeekdayOfMonth(date: Date, dayOfWeek: number): Date {
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error('Day of week must be between 0 and 6');
  }

  let current = getLastDayOfMonth(date);
  
  while (current.getDay() !== dayOfWeek && current.getMonth() === date.getMonth()) {
    current = addDays(current, -1);
  }

  if (current.getMonth() !== date.getMonth()) {
    throw new Error(`No ${dayOfWeek} found in the last week of the month`);
  }

  return startOfDay(current);
}

export function getDaysBetween(date1: Date, date2: Date): number {
  return Math.abs(differenceInDays(startOfDay(date1), startOfDay(date2)));
}
