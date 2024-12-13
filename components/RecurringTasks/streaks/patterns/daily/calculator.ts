import { StreakResult, DailyRecurrencePattern, DateRange, RecurrenceTypes } from '../../types';
import { isValidCompletionWithTimeConstraint } from '../../helpers/validation';
import { generateDailyTargets } from './targetGenerator';

export function calculateDailyStreak(
  pattern: DailyRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.DAILY) {
    throw new Error('Invalid pattern type for daily streak calculation');
  }

  // Generate target dates based on pattern
  const targetDates = generateDailyTargets(pattern, range);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0, nextDue: null, overdue: false };
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target date
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
      // Special handling for today's target
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

  // Calculate the next due date
  const nextDue = targetDates[0]?.date || null;
  const overdue = nextDue ? new Date() > nextDue : false;

  return { currentStreak, longestStreak, nextDue, overdue };
}
