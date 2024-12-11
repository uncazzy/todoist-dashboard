import { addDays, startOfDay, endOfDay } from 'date-fns';
import { StreakResult, DailyRecurrencePattern, DateRange, RecurrenceTypes, TimePeriod } from '../types';
import { isValidCompletion } from '../helpers/validation';
import { isWorkday } from '../helpers/dateUtils';
import { TIME_PERIODS } from '../helpers/constants';
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
      isValidCompletion(target.date, completion, target.allowedRange, pattern.timeOfDay)
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
  return true;
}

function calculateAllowedRange(date: Date, pattern: DailyRecurrencePattern): DateRange {
  const baseStart = startOfDay(date);
  const baseEnd = endOfDay(date);

  // For time-specific patterns, use a stricter range
  if (pattern.timeOfDay) {
    if (pattern.timeOfDay.period) {
      const periodRange = TIME_PERIODS[pattern.timeOfDay.period];
      const targetStart = new Date(date);
      const targetEnd = new Date(date);
      targetStart.setHours(periodRange.start.hours, periodRange.start.minutes);
      targetEnd.setHours(periodRange.end.hours, periodRange.end.minutes);
      return { start: targetStart, end: targetEnd };
    }

    const { hours, minutes } = pattern.timeOfDay;
    const targetTime = new Date(date);
    targetTime.setHours(hours, minutes);
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
  
  // Different pattern formats
  const patterns = [
    // Basic daily with optional time period
    /^every\s+(?:(\d+)\s+)?(?:(work))?days?\s*(?:in\s+the\s+(morning|afternoon|evening|night))?$/,
    // Time specific patterns
    /^every\s+(?:(\d+)\s+)?(?:(work))?days?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/,
    // Simple time of day
    /^every\s+(morning|afternoon|evening|night)$/
  ];

  let matches: RegExpMatchArray | null = null;
  for (const regex of patterns) {
    matches = normalizedPattern.match(regex);
    if (matches) break;
  }

  if (!matches) {
    throw new Error('Invalid daily pattern format');
  }

  const result: DailyRecurrencePattern = {
    type: RecurrenceTypes.DAILY,
    interval: 1,
    isWorkday: false
  };

  if (matches[0].startsWith('every morning') || matches[0].startsWith('every afternoon') || 
      matches[0].startsWith('every evening') || matches[0].startsWith('every night')) {
    // Simple time of day pattern
    const period = matches[1] as TimePeriod;
    const periodRange = TIME_PERIODS[period];
    result.timeOfDay = {
      ...periodRange.start,
      period
    };
  } else {
    // Regular daily pattern
    if (matches[1]) {
      result.interval = parseInt(matches[1], 10);
    }
    
    if (matches[2] === 'work') {
      result.isWorkday = true;
    }

    // Handle time specifications
    if (matches[3]) {
      if (matches[3] === 'morning' || matches[3] === 'afternoon' || matches[3] === 'evening' || matches[3] === 'night') {
        // Time period format
        const period = matches[3] as TimePeriod;
        const periodRange = TIME_PERIODS[period];
        result.timeOfDay = {
          ...periodRange.start,
          period
        };
      } else {
        // Specific time format
        let hours = parseInt(matches[3], 10);
        const minutes = matches[4] ? parseInt(matches[4], 10) : 0;
        const meridian = matches[5];

        // Convert to 24-hour format
        if (meridian) {
          if (meridian === 'pm' && hours < 12) hours += 12;
          if (meridian === 'am' && hours === 12) hours = 0;
        }

        result.timeOfDay = { hours, minutes };
      }
    }
  }

  return result;
}
