import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

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
  
  // For weekly tasks, allow completion within the same week
  if (lower.includes('every') && !lower.includes('month') && !lower.includes('other') && !lower.includes('day')) {
    const targetWeekStart = startOfWeek(targetDate);
    const targetWeekEnd = endOfWeek(targetDate);
    return isWithinInterval(completionDate, { start: targetWeekStart, end: targetWeekEnd });
  }
  
  // For daily tasks and others, require exact date match
  return targetStr === completionStr;
};
