import { endOfDay, startOfDay, subDays, isAfter, isEqual, isBefore } from 'date-fns';
import { WeeklyRecurrencePattern, DateRange, WeekDay } from '../../types';
import { WeeklyTarget } from './types';

interface DateGenerationOptions {
  latestCompletion?: Date;
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


  // Always start from range.end to include all relevant targets
  let currentDate = startOfDay(range.end);

  // For interval > 1, adjust the starting point based on the latestCompletion
  if (interval > 1 && options.latestCompletion) {
    const latestCompletionDay = startOfDay(options.latestCompletion);
    // Calculate the number of weeks between latestCompletion and range.end
    const weeksDifference = Math.floor(
      (currentDate.getTime() - latestCompletionDay.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    // Adjust currentDate to align with the interval
    // For biweekly tasks, we want to ensure we're on the same schedule as the latest completion
    const daysToSubtract = weeksDifference % interval === 0 ? 0 : 7 * (interval - (weeksDifference % interval));
    currentDate = subDays(currentDate, daysToSubtract);
  }

  // Move currentDate back to the first matching weekday
  while (!weekdays.includes(currentDate.getDay() as WeekDay)) {
    currentDate = subDays(currentDate, 1);
  }

  // Generate target dates backwards from our starting point
  while (
    (isAfter(currentDate, range.start) || isEqual(currentDate, range.start)) &&
    (isBefore(currentDate, range.end) || isEqual(currentDate, range.end))
  ) {
    const dayNumber = currentDate.getDay() as WeekDay;

    if (weekdays.includes(dayNumber)) {
      targets.push({
        date: new Date(currentDate),
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
