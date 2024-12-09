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
    // weeksAscending[0] = oldest week, weeksAscending[last] = most recent week
    // We want data[0] = most recent, so we’ll build data accordingly and then reverse at the end.
    const weeklyDataAscending = weeksAscending.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart);

      // Identify target dates in this week
      const weekTargets = filteredTargets.filter(td => isWithinInterval(td, { start: weekStart, end: weekEnd }));
      const expected = weekTargets.length;

      if (pattern === 'daily') {
        // Daily: count completions in this week vs 7 days
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const completedDays = daysInWeek.filter(isCompletedOn).length;
        return (completedDays / daysInWeek.length) * 100;
      }

      // For other weekly patterns:
      if (expected > 0) {
        const actual = weekTargets.filter(isCompletedOn).length;
        return (actual / expected) * 100;
      } else {
        return 0;
      }
    });

    // Now reverse it so that weeklyData[0] = most recent week
    return weeklyDataAscending.reverse();
  } else if (pattern === 'months' || pattern === 'monthly' || pattern === 'monthly-last') {
    // Aggregate by month - 6 data points: current month to 5 months ago
    // We want index 0 = current month, index 5 = oldest month.
    const data: number[] = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(monthStart);

      const monthTargets = filteredTargets.filter(td =>
        isWithinInterval(td, { start: monthStart, end: monthEnd })
      );
      const expected = monthTargets.length;
      const actual = monthTargets.filter(isCompletedOn).length;

      // i=0: current month, data[0] = current month’s rate
      data.push(expected > 0 ? (actual / expected) * 100 : 0);
    }

    // data[0] = current month, data[5] = oldest month, matches desired order (now at 0, older at end)
    return data;
  } else {
    // If pattern not recognized, return empty. Should not happen as detectPattern covers all.
    return [];
  }
}
