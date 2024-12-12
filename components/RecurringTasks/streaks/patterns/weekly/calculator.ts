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

  // Generate target dates based on pattern
  const targetDates = generateWeeklyTargets(pattern, range);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest
  const sortedCompletions = [...completions]
    .map(date => startOfDay(date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const now = startOfDay(new Date());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Process targets from newest to oldest
  for (const target of targetDates) {
    const targetDay = startOfDay(target.date);
    
    // Skip future targets
    if (targetDay > now) {
      continue;
    }

    // Check if this target was completed
    const isCompleted = sortedCompletions.some(completion => 
      completion.getTime() === targetDay.getTime()
    );

    if (isCompleted) {
      tempStreak++;
      if (activeStreak) {
        currentStreak = tempStreak;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      // For the most recent target, don't break streak if we're still within the day
      if (targetDay.getTime() === now.getTime()) {
        if (tempStreak > 0) {
          currentStreak = tempStreak;
          longestStreak = Math.max(longestStreak, tempStreak);
        }
      } else {
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  return { currentStreak, longestStreak };
}
