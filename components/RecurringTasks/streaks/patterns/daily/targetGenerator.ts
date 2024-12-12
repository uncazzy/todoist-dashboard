import { addDays, startOfDay } from 'date-fns';
import { DailyRecurrencePattern, DateRange } from '../../types';
import { DailyTarget } from './types';
import { calculateAllowedRange, isValidTargetDay } from './utils';

export function generateDailyTargets(pattern: DailyRecurrencePattern, range: DateRange): DailyTarget[] {
  const targets: DailyTarget[] = [];
  const interval = pattern.interval || 1;
  let currentDate = startOfDay(range.end);
  const rangeStart = startOfDay(range.start);

  while (currentDate >= rangeStart) {
    if (isValidTargetDay(currentDate, pattern)) {
      targets.push({
        date: currentDate,
        allowedRange: calculateAllowedRange(currentDate, pattern)
      });
    }
    currentDate = addDays(currentDate, -interval);
  }

  return targets;
}
