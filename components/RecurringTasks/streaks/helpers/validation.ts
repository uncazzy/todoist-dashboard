import { isWithinInterval, isValid } from 'date-fns';
import { DateRange, TimeOfDay, TimePeriod } from '../types';
import { TIME_PERIODS, MAX_STREAK_DAYS, HOLIDAY_MAP } from './constants';

export function isValidCompletion(
  targetDate: Date,
  completionDate: Date,
  allowedRange: DateRange,
  timeConstraint?: TimeOfDay
): boolean {
  if (!isValid(targetDate) || !isValid(completionDate)) {
    return false;
  }

  // For time-constrained tasks, check exact time
  if (timeConstraint) {
    const completionHours = completionDate.getHours();
    const completionMinutes = completionDate.getMinutes();

    if (timeConstraint.period) {
      const periodConfig = TIME_PERIODS[timeConstraint.period];
      if (!periodConfig) return false;

      const startTime = new Date(completionDate);
      const endTime = new Date(completionDate);
      startTime.setHours(periodConfig.start.hours, periodConfig.start.minutes, 0, 0);
      endTime.setHours(periodConfig.end.hours, periodConfig.end.minutes, 59, 999);

      const isWithinPeriod = isWithinInterval(completionDate, {
        start: startTime,
        end: endTime
      });
      if (!isWithinPeriod) return false;
    } else {
      // Check specific time
      if (completionHours !== timeConstraint.hours || 
          completionMinutes !== timeConstraint.minutes) {
        return false;
      }
    }
  }

  // Check if completion is within allowed range
  return isWithinInterval(completionDate, {
    start: allowedRange.start,
    end: allowedRange.end
  });
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
