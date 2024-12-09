import { subMonths, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, format } from 'date-fns';
import { ActiveTask } from '../../../types';
import { detectPattern } from './patternUtils';

/**
 * Produce an array of percentage completion rates for a trend chart.
 * We rely on detectPattern to identify the recurrence pattern.
 *
 * For daily/weekly-based tasks: we aggregate by week.
 * For monthly-based tasks: we aggregate by month.
 * 
 * The array represents the last 6 months of data. For weekly tasks, each element 
 * represents a week; for monthly tasks, each element represents a month.
 */
export function getTrendData(
  task: ActiveTask,
  completionDates: Date[]
): number[] {
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);

  // Detect the pattern from the task's due string
  const { pattern, interval, targetDates } = detectPattern(
    task.due?.string?.toLowerCase() || '',
    today,
    sixMonthsAgo,
    completionDates[0],
    completionDates
  );

  // Filter target dates within the last 6 months
  const filteredTargets = targetDates.filter(td => isWithinInterval(td, { start: sixMonthsAgo, end: today }));

  // For calculating completion, we define a helper
  const isCompletedOn = (date: Date) =>
    completionDates.some(cd => format(cd, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

  if (pattern === 'daily' || pattern === 'every-other-day' || pattern === 'weekly' || pattern === 'biweekly') {
    // Aggregate by week
    const weeks = eachWeekOfInterval({ start: sixMonthsAgo, end: today });
    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart);
      // Identify which target dates fall in this week
      const weekTargets = filteredTargets.filter(td => isWithinInterval(td, { start: weekStart, end: weekEnd }));
      const expected = weekTargets.length;

      // For daily tasks, if no explicit targets, we assume a daily pattern = 7 days/week
      if (pattern === 'daily') {
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const completedDays = daysInWeek.filter(isCompletedOn).length;
        return (completedDays / daysInWeek.length) * 100;
      }

      // For every-other-day and weekly/biweekly tasks, rely on targetDates
      if (expected > 0) {
        const actual = weekTargets.filter(isCompletedOn).length;
        return (actual / expected) * 100;
      } else {
        // No expected occurrences this week
        return 0;
      }
    });
  } else if (pattern === 'months' || pattern === 'monthly' || pattern === 'monthly-last') {
    // Aggregate by month - last 6 months
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
    data.reverse();
    return data;
  } else {
    // Default case, if pattern is not recognized (should not happen with detectPattern)
    return [];
  }
}
