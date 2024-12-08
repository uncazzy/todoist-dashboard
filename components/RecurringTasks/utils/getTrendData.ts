import { isEqual, isBefore, subMonths, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ActiveTask } from '../../../types';

export function getTrendData(
  task: ActiveTask,
  completionDates: Date[]
): number[] {
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);
  const weeks = eachWeekOfInterval({ start: sixMonthsAgo, end: today });

  // Get the pattern type
  const pattern = task.due?.string?.toLowerCase() || '';
  const isWeekly = pattern.includes('every') && !pattern.includes('month') && !pattern.includes('other');
  const isMonthly = pattern.includes('month');
  const isBiWeekly = pattern.includes('every other');

  // For weekly/bi-weekly tasks, calculate weekly completion rate
  if (isWeekly || isBiWeekly) {
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const completionsInWeek = completionDates.filter(date =>
        (isBefore(weekStart, date) || isEqual(weekStart, date)) &&
        (isBefore(date, weekEnd) || isEqual(date, weekEnd))
      ).length;

      // Bi-weekly tasks should only expect completion every other week
      const expectedCompletions = isBiWeekly ? 0.5 : 1;
      return (completionsInWeek / expectedCompletions) * 100;
    });
  }

  // For monthly tasks, calculate monthly completion rate
  if (isMonthly) {
    return Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(today, 5 - i));
      const monthEnd = endOfMonth(monthStart);
      const completionsInMonth = completionDates.filter(date =>
        (isBefore(monthStart, date) || isEqual(monthStart, date)) &&
        (isBefore(date, monthEnd) || isEqual(date, monthEnd))
      ).length;
      return (completionsInMonth / 1) * 100;
    });
  }

  // For daily tasks, calculate weekly average completion rate
  return weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart);
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const completionsInWeek = completionDates.filter(date =>
      (isBefore(weekStart, date) || isEqual(weekStart, date)) &&
      (isBefore(date, weekEnd) || isEqual(date, weekEnd))
    ).length;
    return (completionsInWeek / daysInWeek.length) * 100;
  });
}
