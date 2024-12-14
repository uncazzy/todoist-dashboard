import { startOfDay } from 'date-fns';
import { StreakResult, WeeklyRecurrencePattern, DateRange, RecurrenceTypes } from '../../types';
import { generateWeeklyTargets } from './targetGenerator';

export function calculateWeeklyStreak(
  pattern: WeeklyRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.WEEKLY) {
    throw new Error('Invalid pattern type for weekly streak calculation');
  }

  // Sort completions from newest to oldest
  const sortedCompletions = [...completions]
    .map(date => startOfDay(date))
    .sort((a, b) => b.getTime() - a.getTime());

  // **Modification Starts Here**
  // Generate target dates without using latestCompletion as an anchor to include all targets up to range.end
  const targetDates = generateWeeklyTargets(pattern, range, {
    // Do not use latestCompletion as an anchor
    // This ensures all targets within the range are generated
  });
  // **Modification Ends Here**

  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0, nextDue: null, overdue: false };
  }

  const now = startOfDay(new Date());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let foundFirstMiss = false;

  // Process targets from newest to oldest
  for (const target of targetDates) {
    const targetDay = startOfDay(target.date);

    // Skip future targets
    if (targetDay > now) {
      continue;
    }

    // Check if this target was completed
    const wasCompleted = sortedCompletions.some(completion =>
      startOfDay(completion).getTime() === targetDay.getTime()
    );

    if (wasCompleted) {
      tempStreak++;

      // Only update current streak if we haven't found any misses yet
      if (!foundFirstMiss) {
        currentStreak = tempStreak;
      }

      // Update longest streak if we've beaten it
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      // Found a miss
      if (!foundFirstMiss) {
        // This is the first miss we've found
        // Current streak is what we've accumulated so far
        foundFirstMiss = true;
        currentStreak = tempStreak;
      }
      // Reset temp streak counter
      tempStreak = 0;
    }
  }

  // Calculate the next due date
  const nextDue = targetDates[0]?.date || null;
  const overdue = nextDue ? new Date() > nextDue : false;

  return { currentStreak, longestStreak, nextDue, overdue };
}