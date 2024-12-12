import { startOfDay, endOfDay } from 'date-fns';
import { YearlyRecurrencePattern, DateRange } from '../../types';

export function calculateAllowedRange(date: Date, pattern: YearlyRecurrencePattern): DateRange {
  const baseStart = startOfDay(date);
  const baseEnd = endOfDay(date);

  // For time-specific patterns, use a stricter range
  if (pattern.timeOfDay) {
    const { hours, minutes } = pattern.timeOfDay;
    const targetTime = new Date(date);
    targetTime.setHours(hours, minutes);
    return {
      start: new Date(targetTime.getTime() - 30 * 60 * 1000), // 30 minutes before
      end: new Date(targetTime.getTime() + 30 * 60 * 1000)    // 30 minutes after
    };
  }

  // Otherwise, use the full day
  return {
    start: baseStart,
    end: baseEnd
  };
}
