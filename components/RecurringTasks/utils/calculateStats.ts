import { format, isBefore, isAfter, subMonths, startOfMonth, addDays } from 'date-fns';
import { ActiveTask } from '../../../types';
import { isValidCompletion } from './validationUtils';
import { detectPattern } from './patternUtils';
import { calculateStreaks } from './streakUtils';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  isLongTerm?: boolean | undefined;
  interval?: number | undefined;
  nextTargetDate?: Date | undefined;
}

export function calculateStats(
  task: ActiveTask,
  completionDates: Date[]
): Stats {
  if (!task.due?.string) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
  }

  const lower = task.due!.string.toLowerCase();
  const today = new Date();
  // Strict 6-month window
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));
  
  // Filter completions within the last 6 months
  const recentCompletions = completionDates
    .filter(date => !isBefore(date, sixMonthsAgo) && !isAfter(date, today))
    // Deduplicate completions by day
    .reduce((acc: Date[], date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!acc.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
        acc.push(date);
      }
      return acc;
    }, [])
    .sort((a, b) => b.getTime() - a.getTime());

  const totalCompletions = recentCompletions.length;
  const latestCompletion = recentCompletions[0];

  // Detect the pattern and generate target dates
  const { pattern, interval, targetDates } = detectPattern(lower, today, sixMonthsAgo, latestCompletion, recentCompletions);

  // Filter targetDates to the last 6 months window
  const filteredTargets = targetDates.filter(d =>
    !isBefore(d, sixMonthsAgo) &&
    !isAfter(d, today)
  );

  // For tasks that recur less frequently than every 6 months, treat them as long-term
  const isLongTermRecurring = pattern === 'months' && interval > 6;

  if (isLongTermRecurring) {
    const hasCompletionInWindow = totalCompletions > 0;
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions,
      completionRate: hasCompletionInWindow ? 100 : 0,
      isLongTerm: true,
      interval: interval
    };
  }

  // Calculate expected occurrences and on-time completions
  const expectedCount = filteredTargets.length;
  let onTimeCompletions = 0;
  
  if (pattern === 'monthly-strict') {
    // For monthly-strict, check each target date for an exact match
    onTimeCompletions = filteredTargets.reduce((count, targetDate) => {
      const hasCompletion = recentCompletions.some(cd => 
        format(cd, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')
      );
      return hasCompletion ? count + 1 : count;
    }, 0);
  } else {
    // For other patterns, use the existing validation
    filteredTargets.forEach(targetDate => {
      const completed = recentCompletions.some(completionDate =>
        isValidCompletion(targetDate, completionDate, task.due!.string)
      );
      if (completed) onTimeCompletions++;
    });
  }

  let completionRate = 0;
  if (expectedCount > 0) {
    // Cap at 100% since we're being strict about exact matches
    completionRate = Math.min(100, Math.round((onTimeCompletions / expectedCount) * 100));
  }

  const { currentStreak, longestStreak } = calculateStreaks(
    task.due!.string,
    interval,
    filteredTargets,
    recentCompletions,
    today,
    sixMonthsAgo
  );

  // Determine the next target date based on the current streak
  let nextTargetDate: Date | undefined;
  if (pattern === 'monthly-strict') {
    if (currentStreak > 0) {
      // Find the last valid completion in the current streak
      // Sort targetDates from oldest to newest
      const sortedTargetDates = [...targetDates].sort((a, b) => a.getTime() - b.getTime());
      let lastValidCompletion: Date | undefined;

      for (let i = sortedTargetDates.length - 1; i >= 0; i--) {
        const targetDate = sortedTargetDates[i];
        if (targetDate) {
          const correspondingCompletion = recentCompletions.find(completionDate =>
            isValidCompletion(targetDate, completionDate, task.due!.string)
          );
          if (correspondingCompletion) {
            lastValidCompletion = correspondingCompletion;
            break;
          }
        }
      }

      if (lastValidCompletion) {
        if (lastValidCompletion !== null) {
          nextTargetDate = addDays(lastValidCompletion, 30);
        }
      }
    } else if (latestCompletion) {
      // If streak is broken, set next target to 30 days after the last completion
      nextTargetDate = addDays(latestCompletion, 30);
    }
  } else {
    // Existing logic for other patterns to determine nextTargetDate
    nextTargetDate = targetDates.find(date => isAfter(date, today));
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
    isLongTerm: false,
    interval,
    nextTargetDate
  };
}