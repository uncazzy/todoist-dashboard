import { endOfDay, startOfDay, subDays, isAfter, isEqual, isBefore } from 'date-fns';
import { WeeklyRecurrencePattern, DateRange, WeekDay } from '../../types';
import { WeeklyTarget } from './types';

export interface DateGenerationOptions {
  latestCompletion?: Date;
  useCompletionAsAnchor?: boolean;
}

/**
 * Generates target dates for weekly recurring tasks.
 * This is a consolidated function that handles both regular weekly and bi-weekly patterns.
 * 
 * @param pattern The weekly recurrence pattern
 * @param range The date range to generate targets for
 * @param options Optional settings for target generation
 * @returns Array of target dates sorted from newest to oldest
 */
export function generateWeeklyTargets(
  pattern: WeeklyRecurrencePattern,
  range: DateRange,
  options: DateGenerationOptions = {}
): WeeklyTarget[] {
  const targets: WeeklyTarget[] = [];
  const weekdays = pattern.weekdays;
  const interval = pattern.interval || 1;

  // Start from the latest completion or range end
  let currentDate = options.useCompletionAsAnchor && options.latestCompletion
    ? options.latestCompletion
    : range.end;

  currentDate = startOfDay(currentDate);

  // For interval > 1, ensure we're on the correct schedule
  if (interval > 1 && options.latestCompletion) {
    // Start from the latest completion and find the correct weekday
    while (!weekdays.includes(currentDate.getDay() as WeekDay)) {
      currentDate = subDays(currentDate, 1);
    }
  } else {
    // For weekly tasks, just find the first matching weekday
    while (!weekdays.includes(currentDate.getDay() as WeekDay)) {
      currentDate = subDays(currentDate, 1);
    }
  }

  // Generate target dates backwards from our starting point
  while (
    (isAfter(currentDate, range.start) || isEqual(currentDate, range.start)) &&
    (isBefore(currentDate, range.end) || isEqual(currentDate, range.end))
  ) {
    const dayNumber = currentDate.getDay() as WeekDay;

    if (weekdays.includes(dayNumber)) {
      targets.push({
        date: currentDate,
        allowedRange: {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        },
        weekday: dayNumber
      });

      // Move to next target date based on interval
      currentDate = subDays(currentDate, 7 * interval);
    } else {
      // Move to previous day
      currentDate = subDays(currentDate, 1);
    }
  }

  // Sort targets from newest to oldest to match the expected order
  targets.sort((a, b) => b.date.getTime() - a.date.getTime());

  return targets;
}
