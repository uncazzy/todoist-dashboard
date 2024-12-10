import { format } from 'date-fns';

export const isValidCompletion = (targetDate: Date, completionDate: Date, dueString: string): boolean => {
  const targetStr = format(targetDate, 'yyyy-MM-dd');
  const completionStr = format(completionDate, 'yyyy-MM-dd');
  const lower = dueString.toLowerCase();

  // For "every month" without a specific day, check if completion is in the same month
  if (lower === 'every month') {
    return format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
  }

  // For "every last day", check if completion is on the last day of the month
  if (lower === 'every last day') {
    const lastDayOfMonth = new Date(completionDate.getFullYear(), completionDate.getMonth() + 1, 0);
    return format(completionDate, 'yyyy-MM-dd') === format(lastDayOfMonth, 'yyyy-MM-dd') &&
      format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
  }

  // For specific date monthly tasks (e.g., "every 26" or "every 26th"), require exact date match
  const specificDateMatch = lower.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
  if (specificDateMatch) {
    const targetDay = parseInt(specificDateMatch[1] ?? '1');
    return parseInt(format(completionDate, 'd')) === targetDay &&
      format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
  }

  // For biweekly tasks, require exact date match
  if (lower.includes('every other')) {
    // For "every other day", check if the completion matches the target date exactly
    if (lower === 'every other day') {
      return format(targetDate, 'yyyy-MM-dd') === format(completionDate, 'yyyy-MM-dd');
    }
    // For other biweekly tasks (e.g., "every other Monday"), require exact date match
    return format(targetDate, 'yyyy-MM-dd') === format(completionDate, 'yyyy-MM-dd');
  }

  // For weekly tasks, require exact day match and within the same week
  if (lower.includes('every') && !lower.includes('month') && !lower.includes('other') && !lower.includes('day')) {
    // Get the day name from the due string (e.g., "every sun" -> "sun")
    const dayMatch = lower.match(/every (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
    if (dayMatch && dayMatch[1]) {
      // Map short day names to full day names
      const dayMap: { [key: string]: string } = {
        sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
        thu: 'thursday', fri: 'friday', sat: 'saturday'
      };
      const targetDay = dayMap[dayMatch[1].toLowerCase()] || dayMatch[1].toLowerCase();

      // Check if completion is on the correct day of the week
      const isCorrectDay = format(completionDate, 'EEEE').toLowerCase() === targetDay;

      // Calculate the difference in days between target and completion
      const diffInDays = Math.abs(completionDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);

      // Only allow completions within 1 day before or 1 day after the target date
      const isWithinTimeWindow = diffInDays <= 1;

      return isCorrectDay && isWithinTimeWindow;
    }
  }

  // For daily tasks and others, require exact date match
  return targetStr === completionStr;
};
