import { addYears, startOfDay, endOfDay, setMonth, setDate } from 'date-fns';
import { StreakResult, YearlyRecurrencePattern, DateRange, RecurrenceTypes } from '../types';
import { isValidCompletion } from '../helpers/validation';

interface YearlyTarget {
  date: Date;
  allowedRange: DateRange;
  month: number;
  dayOfMonth: number;
}

export function calculateYearlyStreak(
  pattern: YearlyRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.YEARLY) {
    throw new Error('Invalid pattern type for yearly streak calculation');
  }

  // Generate target dates based on pattern
  const targetDates = generateYearlyTargets(pattern, range);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target year
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
      // Special handling for current year's target
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

function generateYearlyTargets(pattern: YearlyRecurrencePattern, range: DateRange): YearlyTarget[] {
  const targets: YearlyTarget[] = [];
  const interval = pattern.interval || 1;
  const { month, dayOfMonth } = pattern;
  let currentDate = startOfDay(range.end);
  const rangeStart = startOfDay(range.start);

  while (currentDate >= rangeStart) {
    const targetDate = setDate(setMonth(currentDate, month), dayOfMonth);
    
    // Skip if target date falls outside our range
    if (targetDate <= range.end && targetDate >= rangeStart) {
      targets.push({
        date: targetDate,
        allowedRange: calculateAllowedRange(targetDate, pattern),
        month,
        dayOfMonth
      });
    }

    currentDate = addYears(currentDate, -interval);
  }

  // Sort targets by date descending (newest first)
  return targets.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function calculateAllowedRange(date: Date, pattern: YearlyRecurrencePattern): DateRange {
  const baseStart = startOfDay(date);
  const baseEnd = endOfDay(date);

  // For time-specific patterns, use a stricter range
  if (pattern.timeOfDay) {
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

export function isYearlyPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return false;
  }

  // Match patterns like "every year on January 1st" or "every 2 years on December 25th"
  const yearlyRegex = /^every\s+(?:(\d+)\s+)?years?\s+on\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+(?:st|nd|rd|th)?$/;
  return yearlyRegex.test(normalizedPattern) || /^every\s+(?:(\d+)\s+)?years?$/.test(normalizedPattern);
}

export function parseYearlyPattern(pattern: string): YearlyRecurrencePattern {
  if (!isYearlyPattern(pattern)) {
    throw new Error('Invalid yearly pattern format');
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Handle basic yearly patterns first
  const basicYearlyRegex = /^every\s+(?:(\d+)\s+)?years?$/;
  const basicMatches = normalizedPattern.match(basicYearlyRegex);
  if (basicMatches) {
    const interval = basicMatches[1] ? parseInt(basicMatches[1], 10) : 1;
    return {
      type: RecurrenceTypes.YEARLY,
      interval,
      month: 0, // January
      dayOfMonth: 1 // 1st
    };
  }

  // Handle specific date patterns
  const yearlyRegex = /^every\s+(?:(\d+)\s+)?years?\s+on\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d+)(?:st|nd|rd|th)?$/;
  const matches = normalizedPattern.match(yearlyRegex);

  if (!matches || !matches[2] || !matches[3]) {
    throw new Error('Unsupported pattern format: ' + pattern);
  }

  const interval = matches[1] ? parseInt(matches[1], 10) : 1;
  const monthStr = matches[2].toLowerCase();
  const dayOfMonth = parseInt(matches[3], 10);

  if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error('Invalid day of month');
  }

  const MONTH_MAP: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3,
    'may': 4, 'june': 5, 'july': 6, 'august': 7,
    'september': 8, 'october': 9, 'november': 10, 'december': 11
  };

  const month = MONTH_MAP[monthStr];
  if (month === undefined) {
    throw new Error(`Invalid month: ${monthStr}`);
  }

  return {
    type: RecurrenceTypes.YEARLY,
    interval,
    month,
    dayOfMonth
  };
}