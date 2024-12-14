import { isWithinInterval, isValid, format, startOfDay, endOfDay } from 'date-fns';
import { DateRange, TimeOfDay, TimePeriod } from '../types';
import { TIME_PERIODS, MAX_STREAK_DAYS, HOLIDAY_MAP } from './constants';

export function isValidCompletionWithTimeConstraint(
  targetDate: Date,
  completionDate: Date,
  allowedRange: DateRange,
  timeConstraint?: TimeOfDay
): boolean {
  if (!isValid(targetDate) || !isValid(completionDate)) {
    return false;
  }

  // First check if completion is within allowed range
  const isWithinRange = isWithinInterval(completionDate, {
    start: allowedRange.start,
    end: allowedRange.end
  });

  if (!isWithinRange) {
    return false;
  }

  // For time-constrained tasks, check time with a flexible window
  if (timeConstraint) {
    // If it's a daily task with a specific time, we'll just check if it's completed on the right day
    return isWithinInterval(completionDate, {
      start: startOfDay(targetDate),
      end: endOfDay(targetDate)
    });

    // Commented out strict time window check as per requirement to ignore time
    /*
    const completionTime = completionDate.getHours() * 60 + completionDate.getMinutes();
    const targetTime = timeConstraint.hours * 60 + timeConstraint.minutes;

    if (timeConstraint.period) {
      const periodConfig = TIME_PERIODS[timeConstraint.period];
      if (!periodConfig) return false;

      const startTime = new Date(completionDate);
      const endTime = new Date(completionDate);
      startTime.setHours(periodConfig.start.hours, periodConfig.start.minutes, 0, 0);
      endTime.setHours(periodConfig.end.hours, periodConfig.end.minutes, 59, 999);

      return isWithinInterval(completionDate, {
        start: startTime,
        end: endTime
      });
    } else {
      // Allow a 60-minute window around the target time (30 minutes before and after)
      const WINDOW_SIZE = 30; // minutes
      const isWithinWindow = Math.abs(completionTime - targetTime) <= WINDOW_SIZE;
      
      // Also handle edge cases around midnight
      const isNearMidnight = targetTime < WINDOW_SIZE || targetTime > (24 * 60 - WINDOW_SIZE);
      if (isNearMidnight) {
        const normalizedCompletionTime = completionTime < 12 * 60 ? completionTime + 24 * 60 : completionTime;
        const normalizedTargetTime = targetTime < 12 * 60 ? targetTime + 24 * 60 : targetTime;
        return Math.abs(normalizedCompletionTime - normalizedTargetTime) <= WINDOW_SIZE;
      }
      
      return isWithinWindow;
    }
    */
  }

  // For non-time-constrained tasks, completion must be on the same day
  return format(completionDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
}

export function isValidCompletion(targetDate: Date, completionDate: Date, dueString: string | null | undefined): boolean {
  if (!dueString || typeof dueString !== 'string') return false;
  
  const targetStr = format(targetDate, 'yyyy-MM-dd');
  const completionStr = format(completionDate, 'yyyy-MM-dd');
  const lower = dueString.toLowerCase();

  // For "monthly-strict" pattern, require exact date match
  if (lower === 'every month') {
    return format(targetDate, 'yyyy-MM-dd') === format(completionDate, 'yyyy-MM-dd');
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
}

export function isValidTimeOfDay(timeOfDay: TimeOfDay): boolean {
  if (!timeOfDay || typeof timeOfDay !== 'object') {
    return false;
  }

  if (timeOfDay.period) {
    return timeOfDay.period in TIME_PERIODS;
  }

  if (typeof timeOfDay.hours !== 'number' || typeof timeOfDay.minutes !== 'number') {
    return false;
  }

  return (
    timeOfDay.hours >= 0 &&
    timeOfDay.hours < 24 &&
    timeOfDay.minutes >= 0 &&
    timeOfDay.minutes < 60
  );
}

export function parseTimeOfDay(timeString: string): TimeOfDay | null {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }

  const normalizedTimeString = timeString.trim().toLowerCase();
  if (normalizedTimeString.length === 0) {
    return null;
  }

  // Try parsing period-based time
  const periodMatch = normalizedTimeString.match(/^(morning|afternoon|evening|night)$/);
  if (periodMatch?.[1]) {
    const period = periodMatch[1] as TimePeriod;
    const periodConfig = TIME_PERIODS[period];
    if (periodConfig) {
      return { ...periodConfig.start, period };
    }
  }

  // Try parsing 24-hour format (HH:mm)
  const militaryMatch = normalizedTimeString.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch?.[1] && militaryMatch?.[2]) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return { hours, minutes };
    }
  }

  // Try parsing 12-hour format with am/pm
  const twelveHourMatch = normalizedTimeString.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (twelveHourMatch?.[1]) {
    let hours = parseInt(twelveHourMatch[1], 10);
    const minutes = twelveHourMatch[2] ? parseInt(twelveHourMatch[2], 10) : 0;
    const isPM = twelveHourMatch[3]?.toLowerCase() === 'pm';

    if (hours > 0 && hours <= 12 && minutes >= 0 && minutes < 60) {
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      return { hours, minutes };
    }
  }

  return null;
}

export function isValidDateRange(range: DateRange): boolean {
  if (!range || typeof range !== 'object') {
    return false;
  }

  if (!isValid(range.start) || !isValid(range.end)) {
    return false;
  }

  if (range.end < range.start) {
    return false;
  }

  const msPerDay = 24 * 60 * 60 * 1000; // milliseconds per day
  const daysDiff = Math.abs(
    (range.end.getTime() - range.start.getTime()) / msPerDay
  );

  return daysDiff <= MAX_STREAK_DAYS;
}

export function isValidPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (normalizedPattern.length === 0) {
    return false;
  }

  // Check for valid pattern prefixes
  const validPrefixes = ['every', 'after', 'on', 'at'];
  if (!validPrefixes.some(prefix => normalizedPattern.startsWith(prefix))) {
    return false;
  }

  // Check for valid pattern structure
  const hasTimeComponent = /at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i.test(normalizedPattern);
  const hasDateComponent = /(every|on)\s+(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday|day|week|month|year)/i.test(normalizedPattern);
  const hasIntervalComponent = /after\s+\d+\s+(?:minute|hour|day|week|month|year)s?/i.test(normalizedPattern);
  const hasCompletionComponent = /\d+\s+times?\s+(?:per|every)\s+\d+\s+days?/i.test(normalizedPattern);

  return hasTimeComponent || hasDateComponent || hasIntervalComponent || hasCompletionComponent;
}

export function isValidHoliday(holiday: string): boolean {
  if (!holiday || typeof holiday !== 'string') {
    return false;
  }

  const normalizedHoliday = holiday.trim().toLowerCase();
  return normalizedHoliday in HOLIDAY_MAP;
}

export function isValidHolidayCompletion(completionDate: Date, allowedRange: DateRange): boolean {
  const completion = startOfDay(completionDate);
  return completion >= startOfDay(allowedRange.start) && completion <= endOfDay(allowedRange.end);
}

export function isValidRelativeCompletion(completionDate: Date, allowedRange: DateRange): boolean {
  const completion = startOfDay(completionDate);
  return completion >= startOfDay(allowedRange.start) && completion <= endOfDay(allowedRange.end);
}
