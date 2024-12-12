import { StreakResult, YearlyRecurrencePattern, DateRange, RecurrenceTypes } from '../../types';
import { isValidCompletionWithTimeConstraint } from '../../helpers/validation';
import { generateYearlyTargets } from './targetGenerator';

export function calculateYearlyStreak(
  pattern: YearlyRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.YEARLY) {
    throw new Error('Invalid pattern type for yearly streak calculation');
  }

  // Generate target dates based on pattern
  const targetDates = generateYearlyTargets(pattern, range);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target year
  for (const target of targetDates) {
    const isCompleted = sortedCompletions.some(completion =>
      isValidCompletionWithTimeConstraint(target.date, completion, target.allowedRange, pattern.timeOfDay)
    );

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // Special handling for current year's target
      if (target === targetDates[0]) {
        if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  return { currentStreak, longestStreak };
}
