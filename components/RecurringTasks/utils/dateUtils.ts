import { startOfDay, endOfDay, subDays, isBefore, isAfter, isEqual } from 'date-fns';
import { WeeklyTarget } from '../streaks/patterns/weekly/types';
import { WeeklyRecurrencePattern, DateRange, WeekDay } from '../streaks/types';

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
export function generateWeeklyTargetDates(
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
      // Skip if target date falls outside our range
      targets.push({
        date: new Date(currentDate),
        allowedRange: {
          start: startOfDay(new Date(currentDate)),
          end: endOfDay(new Date(currentDate))
        },
        weekday: dayNumber
      });
    }

    // Move backwards by the interval
    currentDate = subDays(currentDate, interval * 7);
  }

  // Sort targets from newest to oldest
  return targets.sort((a, b) => b.date.getTime() - a.date.getTime());
}
