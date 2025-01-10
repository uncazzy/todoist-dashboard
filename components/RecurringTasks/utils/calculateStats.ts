import { format, isBefore, isAfter, subMonths, startOfMonth, addDays, addMonths } from 'date-fns';
import { ActiveTask } from '../../../types';
import { calculateStreaks } from '../streaks';
import { DateRange } from '../streaks/types';
import { isValidCompletionWithTimeConstraint } from '../streaks/helpers/validation';
import { detectPattern } from './patternUtils';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  isLongTerm?: boolean | undefined;
  interval?: number | undefined;
  nextTargetDate?: Date | undefined;
  isOnTrack?: boolean | undefined;
}

export function calculateStats(
  task: ActiveTask,
  completionDates: Date[]
): Stats {
  if (!task.due?.string) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
  }

  const today = new Date();
  // Define 6 months ago as the start of analysis
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));

  // Filter completions within the last 6 months
  const allRecentCompletions = completionDates
    .filter(date => !isBefore(date, sixMonthsAgo) && !isAfter(date, today))
    .sort((a, b) => a.getTime() - b.getTime());

  const totalCompletions = allRecentCompletions.length;

  // We attempt pattern detection before returning early so we can handle long-term tasks properly.
  // If we have completions, we'll use the first completion as effective start date, otherwise use sixMonthsAgo.
  const firstCompletion = allRecentCompletions[0];
  const effectiveStartDate = firstCompletion || sixMonthsAgo;

  // Detect the pattern
  const { pattern, interval, targetDates } = detectPattern(
    task.due.string,
    today,
    effectiveStartDate,
    allRecentCompletions[0],
    allRecentCompletions
  );

  // Determine if this is a long-term recurring task (interval > 6 for months or yearly)
  const isLongTermRecurring = (pattern === 'months' && interval && interval > 6) || pattern === 'yearly';

  if (isLongTermRecurring) {
    // For long-term tasks:
    // If there's at least one completion in the last 6 months, it's "On Track"
    // Otherwise, "Long-term"
    const hasRecentCompletion = totalCompletions > 0;
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions,
      completionRate: hasRecentCompletion ? 100 : 0,
      isLongTerm: true,
      interval: interval,
      isOnTrack: hasRecentCompletion
    };
  }

  // If not long-term and there are no completions at all, return zeros
  if (!firstCompletion) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
  }

  // Deduplicate completions by day
  const recentCompletions = allRecentCompletions
    .reduce((acc: Date[], date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!acc.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
        acc.push(date);
      }
      return acc;
    }, [])
    .sort((a, b) => b.getTime() - a.getTime());

  const range: DateRange = {
    start: effectiveStartDate,
    end: today
  };

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(
    task.due.string,
    recentCompletions,
    range
  );

  // Filter target dates to start from the effective start date
  const filteredTargets = targetDates.filter(d =>
    !isBefore(d, effectiveStartDate) &&
    !isAfter(d, today)
  );

  const expectedCount = filteredTargets.length;
  let onTimeCompletions = 0;

  // Sort completions by date ascending for matching
  const sortedCompletions = [...recentCompletions].sort((a, b) => a.getTime() - b.getTime());

  // For monthly tasks, get the target day from the first completion (if any)
  let monthlyTargetDay: number | undefined = undefined;
  if ((pattern === 'monthly' || pattern === 'monthly-strict') && sortedCompletions.length > 0 && sortedCompletions[0]) {
    monthlyTargetDay = sortedCompletions[0].getDate();
  }

  filteredTargets.forEach(targetDate => {
    const completed = recentCompletions.some(completionDate => {
      // Flexible windows for "every month" tasks (not specific day)
      if (pattern === 'monthly' && task.due?.string && !task.due.string.match(/every \d+(?:st|nd|rd|th)?/i)) {
        const allowedStart = new Date(targetDate);
        allowedStart.setDate(allowedStart.getDate() - 3);
        allowedStart.setHours(0, 0, 0, 0);

        const allowedEnd = new Date(targetDate);
        allowedEnd.setHours(23, 59, 59, 999);

        // For months with fewer days, allow more leniency
        const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const isLastDayOfMonth = targetDate.getDate() === lastDayOfMonth;
        const isTargetDayTooLarge = monthlyTargetDay && monthlyTargetDay > lastDayOfMonth;

        if ((isLastDayOfMonth && targetDate.getDate() <= 30) || isTargetDayTooLarge) {
          allowedStart.setDate(allowedStart.getDate() - 2); // Allow up to 5 days early
        }

        return completionDate >= allowedStart && completionDate <= allowedEnd;
      }

      // For daily tasks with intervals
      if (pattern === 'daily' && interval && interval > 1) {
        const allowedStart = new Date(targetDate);
        allowedStart.setHours(0, 0, 0, 0);

        const allowedEnd = new Date(targetDate);
        allowedEnd.setDate(allowedEnd.getDate() + (interval - 1));
        allowedEnd.setHours(23, 59, 59, 999);

        return completionDate >= allowedStart && completionDate <= allowedEnd;
      }

      // For other patterns, require exact day match
      return completionDate.getDate() === targetDate.getDate() &&
        completionDate.getMonth() === targetDate.getMonth() &&
        completionDate.getFullYear() === targetDate.getFullYear();
    });

    if (completed) onTimeCompletions++;
  });

  let completionRate = 0;
  if (expectedCount > 0) {
    completionRate = Math.min(100, Math.round((onTimeCompletions / expectedCount) * 100));
  }

  // Determine the next target date based on the pattern and streaks
  let nextTargetDate: Date | undefined;
  if (pattern === 'monthly-strict') {
    if (currentStreak > 0) {
      // Find the last valid completion in the current streak
      const sortedTargetDates = [...targetDates].sort((a, b) => a.getTime() - b.getTime());
      let lastValidCompletion: Date | undefined;

      for (let i = sortedTargetDates.length - 1; i >= 0; i--) {
        const targetDate = sortedTargetDates[i];
        if (targetDate) {
          const correspondingCompletion = recentCompletions.find(completionDate =>
            isValidCompletionWithTimeConstraint(targetDate, completionDate, {
              start: targetDate,
              end: addMonths(targetDate, 1)
            })
          );
          if (correspondingCompletion) {
            lastValidCompletion = correspondingCompletion;
            break;
          }
        }
      }

      if (lastValidCompletion) {
        nextTargetDate = addDays(lastValidCompletion, 30);
      }
    } else if (recentCompletions[0]) {
      // If streak is broken, set next target 30 days after the last completion
      nextTargetDate = addDays(recentCompletions[0], 30);
    }
  } else {
    // For other patterns
    nextTargetDate = targetDates.find(date => isAfter(date, today));
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
    isLongTerm: false,
    interval: interval,
    nextTargetDate
  };
}
