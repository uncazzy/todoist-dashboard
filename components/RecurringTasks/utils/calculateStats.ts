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
  const range: DateRange = {
    start: sixMonthsAgo,
    end: today
  };

  // Calculate streaks using the new implementation
  const { currentStreak, longestStreak } = calculateStreaks(
    task.due.string,
    recentCompletions,
    range
  );

  // Detect the pattern and generate target dates
  const { pattern, interval, targetDates } = detectPattern(task.due.string, today, sixMonthsAgo, recentCompletions[0], recentCompletions);

  // Filter targetDates to the last 6 months window
  const filteredTargets = targetDates.filter(d =>
    !isBefore(d, sixMonthsAgo) &&
    !isAfter(d, today)
  );

  // Calculate completion rate
  const expectedCount = filteredTargets.length;
  let onTimeCompletions = 0;

  // Sort completions by date
  const sortedCompletions = [...recentCompletions].sort((a, b) => a.getTime() - b.getTime());

  // For monthly tasks, get the target day from the first completion
  let monthlyTargetDay: number | undefined = undefined;
  if ((pattern === 'monthly' || pattern === 'monthly-strict') && sortedCompletions.length > 0) {
    monthlyTargetDay = sortedCompletions[0]?.getDate();
  }

  filteredTargets.forEach(targetDate => {
    const completed = recentCompletions.some(completionDate => {
      // Only apply flexible windows to "every month" tasks
      // For specific day tasks (e.g. "every 27th"), require exact day matching
      if (pattern === 'monthly' && task.due?.string && !task.due.string.match(/every \d+(?:st|nd|rd|th)?/i)) {
        // Allow early completions (up to 3 days early)
        const allowedStart = new Date(targetDate);
        allowedStart.setDate(allowedStart.getDate() - 3);
        allowedStart.setHours(0, 0, 0, 0);
        
        const allowedEnd = new Date(targetDate);
        allowedEnd.setHours(23, 59, 59, 999);

        // For months with fewer days, be more lenient
        const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const isLastDayOfMonth = targetDate.getDate() === lastDayOfMonth;
        const isTargetDayTooLarge = monthlyTargetDay && monthlyTargetDay > lastDayOfMonth;
        
        if ((isLastDayOfMonth && targetDate.getDate() <= 30) || isTargetDayTooLarge) {
          allowedStart.setDate(allowedStart.getDate() - 2); // Allow up to 5 days early for shorter months
        }

        return completionDate >= allowedStart && completionDate <= allowedEnd;
      }

      // For specific days and all other patterns, require exact day matching
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

  // Determine if this is a long-term task (interval > 6 months or yearly)
  const isLongTermRecurring = (pattern === 'months' && interval > 6) || pattern === 'yearly';

  if (isLongTermRecurring) {
    // Check if there are any completions in the last 6 months
    const hasRecentCompletion = recentCompletions.length > 0;
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
        if (lastValidCompletion !== null) {
          nextTargetDate = addDays(lastValidCompletion, 30);
        }
      }
    } else if (recentCompletions[0]) {
      // If streak is broken, set next target to 30 days after the last completion
      nextTargetDate = addDays(recentCompletions[0], 30);
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
    interval: interval,
    nextTargetDate
  };
}