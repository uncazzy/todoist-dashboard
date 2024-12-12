import { DateRange } from '../../types';
import { MonthlyRecurrencePattern } from './types';
import { generateMonthlyTargets } from './targetGenerator';
import { isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

function adjustToLocalDate(date: Date): Date {
  const localDate = new Date(date);
  return localDate;
}

function isSameDayLocal(date1: Date, date2: Date): boolean {
  const d1 = adjustToLocalDate(date1);
  const d2 = adjustToLocalDate(date2);
  const isSame = d1.getDate() === d2.getDate() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear();
  
  return isSame;
}

function isLastDayOfMonthLocal(date: Date): boolean {
  const localDate = adjustToLocalDate(date);
  const nextDay = new Date(localDate);
  nextDay.setDate(localDate.getDate() + 1);
  return localDate.getMonth() !== nextDay.getMonth();
}

export function calculateMonthlyStreak(
  pattern: MonthlyRecurrencePattern,
  completionDates: Date[],
  range: DateRange
): { currentStreak: number; longestStreak: number } {

  if (completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Convert all dates to local time for consistent day-of-month comparison
  const sortedCompletions = [...completionDates]
    .sort((a, b) => a.getTime() - b.getTime())
    .map(date => {
      const localDate = adjustToLocalDate(date);
      return localDate;
    });

  // Get all possible targets within the range, using first completion for "every month" pattern
  const targets = generateMonthlyTargets(pattern, range, sortedCompletions[0]);

  // Initialize streak counters
  let currentStreak = 0;
  let longestStreak = 0;
  let consecutiveCount = 0;

  // Process each target in chronological order
  const chronologicalTargets = [...targets].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (let i = 0; i < chronologicalTargets.length; i++) {
    const target = chronologicalTargets[i];
    if (!target) continue;

    const isLastTarget = i === chronologicalTargets.length - 1;
    const monthStart = startOfMonth(target.date);
    const monthEnd = endOfMonth(target.date);
    
    // Get completions in this month
    const monthCompletions = sortedCompletions.filter(cd =>
      isWithinInterval(cd, { start: monthStart, end: monthEnd })
    );

    // Check if there's a completion matching this target
    let isCompleted = false;
    if (pattern.lastDayOfMonth) {
      // For last day of month, any completion on the last day counts
      isCompleted = monthCompletions.some(cd => isLastDayOfMonthLocal(cd));
    } else if (pattern.everyMonth) {
      // For "every month", any completion in the month counts
      isCompleted = monthCompletions.length > 0;
    } else {
      // For specific days, need completion on the exact day
      isCompleted = monthCompletions.some(cd => isSameDayLocal(cd, target.date));
    }

    if (isCompleted) {
      consecutiveCount++;
      // Update current streak if this is the most recent target
      if (isLastTarget) {
        currentStreak = consecutiveCount;
      }
    } else {
      // Update longest streak when a sequence breaks
      longestStreak = Math.max(longestStreak, consecutiveCount);
      consecutiveCount = 0;
      // Reset current streak if we haven't reached the last target
      if (!isLastTarget) {
        currentStreak = 0;
      }
    }
  }

  // Final update to longest streak
  longestStreak = Math.max(longestStreak, consecutiveCount);

  return { currentStreak, longestStreak };
}
