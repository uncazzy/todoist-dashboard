import { isEqual, isBefore, subMonths, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, format, isWithinInterval } from 'date-fns';
import { ActiveTask } from '../../../types';

export function getTrendData(
  task: ActiveTask,
  completionDates: Date[]
): number[] {
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);
  const weeks = eachWeekOfInterval({ start: sixMonthsAgo, end: today });

  // Get the pattern type and normalize it
  const pattern = task.due?.string?.toLowerCase() || '';

  // Helper function to check if a completion is valid for a target date
  const isValidCompletion = (targetDate: Date, completionDate: Date): boolean => {
    const targetStr = format(targetDate, 'yyyy-MM-dd');
    const completionStr = format(completionDate, 'yyyy-MM-dd');

    // For "every month" without a specific day, check if completion is in the same month
    if (pattern === 'every month') {
      return format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
    }

    // For "every last day", check if completion is on the last day of the month
    if (pattern === 'every last day') {
      const lastDayOfMonth = new Date(completionDate.getFullYear(), completionDate.getMonth() + 1, 0);
      return format(completionDate, 'yyyy-MM-dd') === format(lastDayOfMonth, 'yyyy-MM-dd') &&
             format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
    }

    // For specific date monthly tasks (e.g., "every 26" or "every 26th")
    const specificDateMatch = pattern.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
    if (specificDateMatch) {
      const targetDay = parseInt(specificDateMatch[1] ?? '1');
      return parseInt(format(completionDate, 'd')) === targetDay &&
             format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
    }

    // For weekly tasks, allow completion within the same week
    if (pattern.includes('every') && !pattern.includes('month') && !pattern.includes('other')) {
      const weekStart = startOfWeek(targetDate);
      const weekEnd = endOfWeek(targetDate);
      return isWithinInterval(completionDate, { start: weekStart, end: weekEnd });
    }

    // For daily tasks and others, require exact date match
    return targetStr === completionStr;
  };

  // Calculate trend based on pattern type
  if (pattern.includes('every') && !pattern.includes('month') && !pattern.includes('other')) {
    // Weekly tasks
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const completionsInWeek = completionDates.filter(date =>
        isValidCompletion(weekStart, date)
      ).length;
      return completionsInWeek > 0 ? 100 : 0;
    });
  } else if (pattern.includes('every other')) {
    // Bi-weekly tasks
    return weeks.map((weekStart, index) => {
      if (index % 2 !== 0) return 0; // Skip alternate weeks
      const weekEnd = endOfWeek(weekStart);
      const completionsInWeek = completionDates.filter(date =>
        isValidCompletion(weekStart, date)
      ).length;
      return completionsInWeek > 0 ? 100 : 0;
    });
  } else if (pattern.includes('month')) {
    // Monthly tasks
    return Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(today, 5 - i));
      const monthEnd = endOfMonth(monthStart);
      const completionsInMonth = completionDates.filter(date =>
        isValidCompletion(monthStart, date)
      ).length;
      return completionsInMonth > 0 ? 100 : 0;
    });
  }

  // Daily tasks
  return weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart);
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const completionsInWeek = daysInWeek.filter(day =>
      completionDates.some(date => isValidCompletion(day, date))
    ).length;
    return (completionsInWeek / daysInWeek.length) * 100;
  });
}
