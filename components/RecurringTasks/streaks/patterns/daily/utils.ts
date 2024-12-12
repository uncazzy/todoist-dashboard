import { startOfDay, endOfDay } from 'date-fns';
import { DailyRecurrencePattern, DateRange } from '../../types';
import { isWorkday } from '../../helpers/dateUtils';

export function isValidTargetDay(date: Date, pattern: DailyRecurrencePattern): boolean {
  if (pattern.isWorkday) {
    return isWorkday(date);
  }
  if (pattern.isWeekend) {
    return !isWorkday(date);
  }
  return true;
}

export function calculateAllowedRange(date: Date, pattern: DailyRecurrencePattern): DateRange {
  const baseStart = startOfDay(date);
  const baseEnd = endOfDay(date);

  // For time-specific patterns, use a stricter range
  if (pattern.timeOfDay) {
    const { hours, minutes } = pattern.timeOfDay;
    const targetTime = new Date(date);
    targetTime.setHours(hours || 0, minutes || 0);
    return {
      start: new Date(targetTime.getTime() - 30 * 60 * 1000), // 30 minutes before
      end: new Date(targetTime.getTime() + 30 * 60 * 1000)    // 30 minutes after
    };
  }

  return { start: baseStart, end: baseEnd };
}
