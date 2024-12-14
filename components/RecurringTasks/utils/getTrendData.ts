import { subMonths, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval, format, isBefore, isAfter } from 'date-fns';
import { ActiveTask } from '../../../types';
import { detectPattern } from './patternUtils';

/**
 * Produce an array of percentage completion rates for a trend chart.
 * The array should represent data from NOW at index 0 to 6 MONTHS AGO at the last index.
 *
 * For daily/weekly-based tasks: we aggregate by week but then reverse so that index 0 = most recent week.
 * For monthly-based tasks: we iterate months from now backward so index 0 = current month, last index = oldest month.
 */
export function getTrendData(
  task: ActiveTask,
  completionDates: Date[]
): number[] {
  const today = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));

  const { pattern, targetDates, interval } = detectPattern(
    task.due?.string?.toLowerCase() || '',
    today,
    sixMonthsAgo,
    completionDates[0],
    completionDates
  );

  const filteredTargets = targetDates.filter(d =>
    !isBefore(d, sixMonthsAgo) &&
    !isAfter(d, today)
  );

  const isCompletedOn = (date: Date) =>
    completionDates.some(cd => format(cd, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

  if (pattern === 'monthly-strict') {
    // For 'monthly-strict' pattern, aggregate by month
    const data: number[] = [];

    // Iterate from newest to oldest (now to 6 months ago)
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthStr = format(monthStart, 'yyyy-MM');
      
      // Find target date for this month (should be on the 16th)
      const monthTargets = filteredTargets.filter(td => 
        format(td, 'yyyy-MM') === monthStr
      );

      if (monthTargets.length > 0) {
        // For each target in this month, check if it was completed exactly on that date
        const hasValidCompletion = monthTargets.some(target => {
          // Find a completion that matches this target date exactly
          return completionDates.some(cd => 
            format(cd, 'yyyy-MM-dd') === format(target, 'yyyy-MM-dd')
          );
        });

        // If no valid completion found, it's a miss (0)
        data.push(hasValidCompletion ? 100 : 0);
      } else if (isAfter(monthStart, sixMonthsAgo)) {
        // If we're in the window but no target, show as a gap (-1)
        data.push(-1);
      }
    }

    return data;
  } else if (pattern === 'daily' || pattern === 'every-other-day' || pattern === 'weekly' || pattern === 'biweekly') {
    // Aggregate by week
    const weeksAscending = eachWeekOfInterval({ start: sixMonthsAgo, end: today });
    const weeklyDataAscending: number[] = [];

    for (const weekStart of weeksAscending) {
      const weekEnd = endOfWeek(weekStart);
      const weekTargets = filteredTargets.filter(td => isWithinInterval(td, { start: weekStart, end: weekEnd }));
      const expected = weekTargets.length;

      if (pattern === 'daily') {
        // For daily tasks, check each target date with its interval window
        if (expected > 0) {
          let completedTargets = 0;
          for (const target of weekTargets) {
            // Check for completion within the interval window
            const targetDate = new Date(target);
            const allowedStart = new Date(targetDate);
            allowedStart.setHours(0, 0, 0, 0);
            
            const allowedEnd = new Date(targetDate);
            allowedEnd.setDate(allowedEnd.getDate() + (interval - 1));
            allowedEnd.setHours(23, 59, 59, 999);

            const isCompleted = completionDates.some(cd => 
              cd >= allowedStart && cd <= allowedEnd
            );

            if (isCompleted) completedTargets++;
          }
          weeklyDataAscending.push((completedTargets / expected) * 100);
        } else {
          // If no tasks were expected this week, skip adding a point
        }
      } else {
        // For other weekly patterns
        if (expected > 0) {
          const actual = weekTargets.filter(isCompletedOn).length;
          weeklyDataAscending.push((actual / expected) * 100);
        } else {
          // If no tasks were expected this week, skip adding a point altogether
        }
      }
    }

    // Reverse so that data[0] = most recent week
    return weeklyDataAscending.reverse();
  }
  else if (pattern === 'months' || pattern === 'monthly' || pattern === 'monthly-last') {
    // For all monthly patterns, use a consistent approach
    const data: number[] = [];

    // Iterate from newest to oldest (now to 6 months ago)
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(monthStart);

      // Get targets that were due in this month AND are in the past
      const monthTargets = filteredTargets.filter(td =>
        isWithinInterval(td, { start: monthStart, end: monthEnd }) &&
        isBefore(td, today)
      );

      // Get completions in this month
      const monthCompletions = completionDates.filter(cd =>
        isWithinInterval(cd, { start: monthStart, end: monthEnd })
      );

      if (monthTargets.length > 0) {
        // If there were targets this month, calculate completion rate based on targets
        const actual = monthTargets.filter(isCompletedOn).length;
        data.push((actual / monthTargets.length) * 100);
      } else if (monthCompletions.length > 0) {
        // If there were no targets but there were completions, count as 100%
        data.push(100);
      } else {
        // No targets and no completions
        data.push(0);
      }
    }

    // Data is now ordered from newest (left) to oldest (right), matching the UI labels
    return data;
  }
  else {
    // If pattern not recognized, return empty. Should not happen as detectPattern covers all.
    return [];
  }
}
