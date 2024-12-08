import { format, isEqual, isBefore, subMonths, subDays } from 'date-fns';
import { ActiveTask } from '../../../types';

interface TaskStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
}

export function calculateStats(
  task: ActiveTask,
  completionDates: Date[]
): TaskStats {
  if (!task.due?.string) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
  }

  const lower = task.due.string.toLowerCase();
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);

  // Get completions within 6 month window
  const recentCompletions = completionDates
    .filter(date =>
      (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) &&
      (isBefore(date, today) || isEqual(date, today))
    )
    .sort((a, b) => b.getTime() - a.getTime());

  const totalCompletions = recentCompletions.length;

  // Calculate completion rate
  let completionRate = 0;
  if (lower.includes('every other')) {
    // Calculate bi-weekly completion rate
    const weekdayMatch = lower.match(/every other (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (weekdayMatch?.[1]) {
      const weekday = weekdayMatch[1].toLowerCase();
      let expectedCount = 0;
      let date = today;

      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        if (format(date, 'EEEE').toLowerCase() === weekday) {
          expectedCount++;
        }
        date = subDays(date, 14);
      }

      completionRate = Math.round((totalCompletions / Math.max(1, expectedCount)) * 100);
    }
  } else if (lower.includes('every') && !lower.includes('month')) {
    // Calculate weekly completion rate
    const weekdayMatch = lower.match(/every (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
    if (weekdayMatch?.[1]) {
      const dayMap: { [key: string]: string } = {
        sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
        thu: 'thursday', fri: 'friday', sat: 'saturday'
      };
      const weekday = dayMap[weekdayMatch[1].toLowerCase()] || weekdayMatch[1].toLowerCase();
      let expectedCount = 0;
      let date = today;

      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        if (format(date, 'EEEE').toLowerCase() === weekday) {
          expectedCount++;
        }
        date = subDays(date, 7);
      }

      completionRate = Math.round((totalCompletions / Math.max(1, expectedCount)) * 100);
    }
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  if (lower.includes('every') && !lower.includes('month') && !lower.includes('other')) {
    // Weekly tasks
    const weekdayMatch = lower.match(/every (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
    if (weekdayMatch?.[1]) {
      const dayMap: { [key: string]: string } = {
        sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
        thu: 'thursday', fri: 'friday', sat: 'saturday'
      };
      const weekday = dayMap[weekdayMatch[1].toLowerCase()] || weekdayMatch[1].toLowerCase();

      let date = today;
      // Find most recent occurrence of weekday
      while (format(date, 'EEEE').toLowerCase() !== weekday) {
        date = subDays(date, 1);
      }

      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        const completed = recentCompletions.some(d =>
          format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );

        if (completed) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          if (isBefore(sixMonthsAgo, date)) currentStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
        date = subDays(date, 7);
      }
    }
  } else if (lower.includes('every other')) {
    // Handle bi-weekly tasks
    const weekdayMatch = lower.match(/every other (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (weekdayMatch?.[1]) {
      const weekday = weekdayMatch[1].toLowerCase();
      let date = today;

      while (format(date, 'EEEE').toLowerCase() !== weekday) {
        date = subDays(date, 1);
      }

      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        const completed = recentCompletions.some(d =>
          format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );

        if (completed) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          if (isBefore(sixMonthsAgo, date)) currentStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
        date = subDays(date, 14);
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate
  };
}
