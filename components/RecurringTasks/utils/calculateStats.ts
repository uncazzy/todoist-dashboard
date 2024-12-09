import { format, isBefore, isAfter, subMonths, startOfMonth } from 'date-fns';
import { ActiveTask } from '../../../types';
import { isValidCompletion } from './validationUtils';
import { detectPattern } from './patternUtils';
import { calculateStreaks } from './streakUtils';

export function calculateStats(
  task: ActiveTask,
  completionDates: Date[]
) {
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
  if (expectedCount > 0) {
    filteredTargets.forEach(targetDate => {
      const completed = recentCompletions.some(completionDate =>
        isValidCompletion(targetDate, completionDate, task.due!.string)
      );
      if (completed) onTimeCompletions++;
    });
  }

  let completionRate = 0;
  if (expectedCount > 0) {
    // Cap at 200% just in case user completes more often than expected
    completionRate = Math.min(200, Math.round((onTimeCompletions / expectedCount) * 100));
  }

  const { currentStreak, longestStreak } = calculateStreaks(
    task.due!.string,
    interval,
    filteredTargets,
    recentCompletions,
    today,
    sixMonthsAgo
  );

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
    isLongTerm: false,
    interval
  };
}