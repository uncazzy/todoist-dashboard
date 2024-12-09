import { subMonths, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, format, isBefore, isAfter } from 'date-fns';
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

  const { pattern, targetDates } = detectPattern(
    task.due?.string?.toLowerCase() || '',
    today,
    sixMonthsAgo,
    completionDates[0],
    completionDates
  );

  console.log("Pattern detected for task", task.content, "is", pattern);

  const filteredTargets = targetDates.filter(d =>
    !isBefore(d, sixMonthsAgo) &&
    !isAfter(d, today)
  );

  const isCompletedOn = (date: Date) =>
    completionDates.some(cd => format(cd, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

  if (pattern === 'daily' || pattern === 'every-other-day' || pattern === 'weekly' || pattern === 'biweekly') {
    // Aggregate by week
    const weeksAscending = eachWeekOfInterval({ start: sixMonthsAgo, end: today });
    const weeklyDataAscending: number[] = [];

    for (const weekStart of weeksAscending) {
      const weekEnd = endOfWeek(weekStart);
      const weekTargets = filteredTargets.filter(td => isWithinInterval(td, { start: weekStart, end: weekEnd }));
      const expected = weekTargets.length;

      if (pattern === 'daily') {
        // Daily: count completions in this week vs 7 days
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const completedDays = daysInWeek.filter(isCompletedOn).length;
        weeklyDataAscending.push((completedDays / daysInWeek.length) * 100);
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
    // For tasks that recur every X months, we need a different approach than calendar month aggregation
    if (pattern === 'months') {
      // For "every X months" pattern, we'll calculate completion rates for each month
      const data: number[] = [];
      for (let i = 0; i < 6; i++) {
        const monthStart = startOfMonth(subMonths(today, i));
        const monthEnd = endOfMonth(monthStart);

        // Get targets that were due in this month
        const monthTargets = filteredTargets.filter(td =>
          isWithinInterval(td, { start: monthStart, end: monthEnd })
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
      return data;
    } else {
      // For regular monthly patterns, continue with month-by-month aggregation
      const data: number[] = [];
      for (let i = 0; i < 6; i++) {
        const monthStart = startOfMonth(subMonths(today, i));
        const monthEnd = endOfMonth(monthStart);

        const monthTargets = filteredTargets.filter(td =>
          isWithinInterval(td, { start: monthStart, end: monthEnd })
        );
        const expected = monthTargets.length;
        const actual = monthTargets.filter(isCompletedOn).length;

        data.push(expected > 0 ? (actual / expected) * 100 : 0);
      }
      return data;
    }
  } else {
    // If pattern not recognized, return empty. Should not happen as detectPattern covers all.
    return [];
  }
}
