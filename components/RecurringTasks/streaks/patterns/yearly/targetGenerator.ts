import { addYears, startOfDay, setMonth, setDate } from 'date-fns';
import { YearlyRecurrencePattern, DateRange } from '../../types';
import { YearlyTarget } from './types';
import { calculateAllowedRange } from './utils';

export function generateYearlyTargets(pattern: YearlyRecurrencePattern, range: DateRange): YearlyTarget[] {
  const targets: YearlyTarget[] = [];
  const interval = pattern.interval || 1;
  const { month, dayOfMonth } = pattern;
  let currentDate = startOfDay(range.end);
  const rangeStart = startOfDay(range.start);

  while (currentDate >= rangeStart) {
    const targetDate = setDate(setMonth(currentDate, month), dayOfMonth);
    
    // Skip if target date falls outside our range
    if (targetDate <= range.end && targetDate >= rangeStart) {
      targets.push({
        date: targetDate,
        allowedRange: calculateAllowedRange(targetDate, pattern),
        month,
        dayOfMonth
      });
    }

    currentDate = addYears(currentDate, -interval);
  }

  // Sort targets by date descending (newest first)
  return targets.sort((a, b) => b.date.getTime() - a.date.getTime());
}
