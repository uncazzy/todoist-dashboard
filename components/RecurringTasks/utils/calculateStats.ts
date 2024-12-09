import { format, isEqual, isBefore, subMonths, startOfMonth } from 'date-fns';
import { ActiveTask } from '../../../types';
import { TaskStats } from './types';
import { isValidCompletion } from './validationUtils';
import { detectPattern } from './patternUtils';
import { calculateStreaks } from './streakUtils';

export function calculateStats(
  task: ActiveTask,
  completionDates: Date[]
): TaskStats {
  if (!task.due?.string) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
  }

  const lower = task.due!.string.toLowerCase();
  const today = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));

  // Filter completions within the last 6 months
  const recentCompletions = completionDates
    .filter(date =>
      (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) &&
      (isBefore(date, today) || isEqual(date, today))
    )
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

  // Detect the pattern and generate target dates
  const latestCompletion = recentCompletions[0];
  const { pattern, interval, targetDates } = detectPattern(lower, today, sixMonthsAgo, latestCompletion, recentCompletions);

  // For tasks that recur less frequently than every 6 months, treat them as long-term
  const isLongTermRecurring = pattern === 'months' && interval > 6;

  if (isLongTermRecurring) {
    // If the task recurs less than once every 6 months, we can't do a normal rate calculation
    // If there's at least one completion, consider completionRate=100% (on-time)
    const hasCompletionInWindow = totalCompletions > 0;
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: totalCompletions, // total completions in the window
      completionRate: hasCompletionInWindow ? 100 : 0,
      isLongTerm: true,
      interval: interval
    };
  }

  // Calculate the expected occurrences and on-time completions
  // targetDates are generated in descending order (newest first)
  const filteredTargets = targetDates.filter(d =>
    (isBefore(sixMonthsAgo, d) || isEqual(sixMonthsAgo, d)) &&
    (isBefore(d, today) || isEqual(d, today))
  );

  const expectedCount = filteredTargets.length;
  let onTimeCompletions = 0;
  filteredTargets.forEach(targetDate => {
    const completed = recentCompletions.some(completionDate =>
      isValidCompletion(targetDate, completionDate, task.due!.string)
    );
    if (completed) onTimeCompletions++;
  });

  let completionRate = 0;
  if (expectedCount > 0) {
    // Cap at 200% just in case user completes more often than expected
    completionRate = Math.min(200, Math.round((onTimeCompletions / expectedCount) * 100));
  }

  // Calculate streaks
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
    // totalCompletions is just how many completions occurred in the last 6 months
    // This is useful for showing raw count. On-time completions affect completionRate.
    totalCompletions: totalCompletions,
    completionRate,
    isLongTerm: false,
    interval
  };
}
