import { endOfDay, startOfDay, subDays, isAfter, isEqual, isBefore } from 'date-fns';
import { WeeklyRecurrencePattern, DateRange, WeekDay } from '../../types';
import { WeeklyTarget } from './types';

interface DateGenerationOptions {
  latestCompletion?: Date;
  sortedCompletions?: Date[];
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

  // Extend range start if we have completions before it
  const earliestCompletion = options.sortedCompletions && options.sortedCompletions.length > 0 ? 
    options.sortedCompletions[options.sortedCompletions.length - 1] : null;
  
  const adjustedRange = {
    ...range,
    start: earliestCompletion && earliestCompletion < range.start ? 
      subDays(range.start, 7 * interval) : range.start
  };

  // Set the time of day if specified in the pattern
  const setTimeOfDay = (date: Date): Date => {
    if (pattern.timeOfDay) {
      date.setHours(pattern.timeOfDay.hours);
      date.setMinutes(pattern.timeOfDay.minutes);
      date.setSeconds(0);
      date.setMilliseconds(0);
    } else {
      // Default to start of day if no time specified
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  // Always start from range.end to include all relevant targets
  let currentDate = new Date(adjustedRange.end);
  currentDate = setTimeOfDay(currentDate);

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
    currentDate = setTimeOfDay(currentDate);
  }

  // Move currentDate back to the first matching weekday
  while (!weekdays.includes(currentDate.getDay() as WeekDay)) {
    currentDate = subDays(currentDate, 1);
    setTimeOfDay(currentDate);
  }

  // Generate target dates backwards from our starting point
  while (
    (isAfter(currentDate, adjustedRange.start) || isEqual(currentDate, adjustedRange.start)) &&
    (isBefore(currentDate, adjustedRange.end) || isEqual(currentDate, adjustedRange.end))
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

      // For interval > 1, skip the appropriate number of weeks
      if (interval > 1) {
        currentDate = subDays(currentDate, 7 * (interval - 1));
      }
    }
    currentDate = subDays(currentDate, 1);
    setTimeOfDay(currentDate);
  }

  // Sort targets from newest to oldest to match the expected order
  targets.sort((a, b) => b.date.getTime() - a.date.getTime());

  return targets;
}
