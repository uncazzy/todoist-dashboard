import { addDays, startOfDay, endOfDay } from 'date-fns';
import { StreakResult, DailyRecurrencePattern, DateRange, RecurrenceTypes } from '../types';
import { isValidCompletionWithTimeConstraint } from '../helpers/validation';
import { isWorkday } from '../helpers/dateUtils';
import { isDailyPattern } from './patternMatchers';

interface DailyTarget {
  date: Date;
  allowedRange: DateRange;
}

export function calculateDailyStreak(
  pattern: DailyRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.DAILY) {
    throw new Error('Invalid pattern type for daily streak calculation');
  }

  // Generate target dates based on pattern
  const targetDates = generateDailyTargets(pattern, range);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target date
  for (const target of targetDates) {
    const isCompleted = sortedCompletions.some(completion =>
      isValidCompletionWithTimeConstraint(target.date, completion, target.allowedRange, pattern.timeOfDay)
    );

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // Special handling for today's target
      if (target === targetDates[0]) {
        if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  return { currentStreak, longestStreak };
}

function generateDailyTargets(pattern: DailyRecurrencePattern, range: DateRange): DailyTarget[] {
  const targets: DailyTarget[] = [];
  const interval = pattern.interval || 1;
  let currentDate = startOfDay(range.end);
  const rangeStart = startOfDay(range.start);

  while (currentDate >= rangeStart) {
    if (isValidTargetDay(currentDate, pattern)) {
      targets.push({
        date: currentDate,
        allowedRange: calculateAllowedRange(currentDate, pattern)
      });
    }
    currentDate = addDays(currentDate, -interval);
  }

  return targets;
}

function isValidTargetDay(date: Date, pattern: DailyRecurrencePattern): boolean {
  if (pattern.isWorkday) {
    return isWorkday(date);
  }
  if (pattern.isWeekend) {
    return !isWorkday(date);
  }
  return true;
}

function calculateAllowedRange(date: Date, pattern: DailyRecurrencePattern): DateRange {
  const baseStart = startOfDay(date);
  const baseEnd = endOfDay(date);

  // For time-specific patterns, use a stricter range
  if (pattern.timeOfDay) {
    const { hours, minutes } = pattern.timeOfDay;
    const targetTime = new Date(date);
    targetTime.setHours(hours || 0, minutes || 0);
    return {
      start: new Date(targetTime.getTime() - 30 * 60 * 1000), // 30 minutes before
      end: new Date(targetTime.getTime() + 30 * 60 * 1000)    // 30 minutes after
    };
  }

  return { start: baseStart, end: baseEnd };
}

export function parseDailyPattern(pattern: string): DailyRecurrencePattern {
  if (!isDailyPattern(pattern)) {
    throw new Error('Invalid daily pattern format');
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Handle workday and weekend patterns first
  if (normalizedPattern === 'every workday' || normalizedPattern === 'every weekday') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      isWorkday: true
    };
  }

  if (normalizedPattern === 'every weekend') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      isWeekend: true
    };
  }

  // Handle time of day patterns with specific hours
  if (normalizedPattern === 'every morning') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours: 9, minutes: 0 }
    };
  }

  if (normalizedPattern === 'every afternoon') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours: 12, minutes: 0 }
    };
  }

  if (normalizedPattern === 'every evening') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours: 19, minutes: 0 }
    };
  }

  if (normalizedPattern === 'every night') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours: 22, minutes: 0 }
    };
  }

  // Handle "every day [time]" pattern
  const timePattern = /^every\s+day\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const timeMatches = normalizedPattern.match(timePattern);
  if (timeMatches && timeMatches[1]) {
    let hours = parseInt(timeMatches[1], 10);
    const minutes = timeMatches[2] ? parseInt(timeMatches[2], 10) : 0;
    const meridiem = timeMatches[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours, minutes }
    };
  }

  // Handle "every other day" pattern
  if (normalizedPattern === 'every other day') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 2
    };
  }

  // Handle other patterns
  const patterns = [
    // Basic daily with optional time period
    /^every\s+(?:(\d+)\s+)?(?:(work))?days?\s*(?:at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?$/,
    // ISO date ending pattern
    /^every\s+day\s+ending\s+(\d{4})-(\d{2})-(\d{2})$/,
    // Completion-based patterns
    /^every!\s+(\d+)\s+days?$/,
    /^after\s+(\d+)\s+days?$/
  ];

  let matches: RegExpMatchArray | null = null;
  for (const regex of patterns) {
    matches = normalizedPattern.match(regex);
    if (matches) {
      break;
    }
  }

  if (!matches) {
    // Handle simple "every day" pattern
    if (normalizedPattern === 'every day') {
      return {
        type: RecurrenceTypes.DAILY,
        interval: 1
      };
    }
    throw new Error('Invalid daily pattern format');
  }

  // Check if it's an ISO date ending pattern
  const isoDateMatch = normalizedPattern.match(/^every\s+day\s+ending\s+(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [_, year, month, day] = isoDateMatch;
    if (!year || !month || !day) {
      throw new Error('Invalid ISO date format in pattern');
    }
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      endDate: new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    };
  }

  // Check if it's a completion-based pattern
  const completionMatch = normalizedPattern.match(/^every!\s+(\d+)\s+days?$/);
  if (completionMatch) {
    const [_, interval] = completionMatch;
    if (!interval) {
      throw new Error('Invalid interval in completion-based pattern');
    }
    return {
      type: RecurrenceTypes.DAILY,
      interval: parseInt(interval),
      isCompletionBased: true
    };
  }

  // Check if it's an "after X days" pattern
  const afterMatch = normalizedPattern.match(/^after\s+(\d+)\s+days?$/);
  if (afterMatch) {
    const [_, interval] = afterMatch;
    if (!interval) {
      throw new Error('Invalid interval in after pattern');
    }
    return {
      type: RecurrenceTypes.DAILY,
      interval: parseInt(interval),
      isAfterCompletion: true
    };
  }

  const result: DailyRecurrencePattern = {
    type: RecurrenceTypes.DAILY,
    interval: matches[1] ? parseInt(matches[1], 10) : 1,
    isWorkday: matches[2] === 'work'
  };

  // Handle specific time if present
  if (matches[3]) {
    let hours = parseInt(matches[3], 10);
    const minutes = matches[4] ? parseInt(matches[4], 10) : 0;
    const meridiem = matches[5];

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    result.timeOfDay = { hours, minutes };
  }

  return result;
}
