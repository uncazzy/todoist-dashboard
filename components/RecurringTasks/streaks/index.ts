import { StreakResult, RecurrencePattern, DailyRecurrencePattern, RecurrenceTypes, DateRange } from './types';
import { calculateDailyStreak, parseDailyPattern, isDailyPattern } from './patterns/daily';
import { calculateWeeklyStreak, parseWeeklyPattern, isWeeklyPattern } from './patterns/weekly';
import { calculateMonthlyStreak, parseMonthlyPattern, isMonthlyPattern } from './patterns/monthly';
import { calculateYearlyStreak, parseYearlyPattern, isYearlyPattern } from './patterns/yearly';
import { calculateRelativeStreak, parseRelativePattern } from './patterns/relative';
import { calculateCompletionStreak, parseCompletionPattern } from './patterns/completion';
import { calculateHolidayStreak, parseHolidayPattern } from './patterns/holiday';
import {
  isRelativePattern,
  isCompletionPattern,
  isHolidayPattern
} from './patterns/patternMatchers';

export function calculateStreaks(
  pattern: string,
  completions: Date[],
  range: DateRange
): StreakResult {
  // Parse the pattern string into a structured RecurrencePattern
  const recurrencePattern: RecurrencePattern = parsePattern(pattern);

  // Calculate streaks based on the pattern type
  switch (recurrencePattern.type) {
    case RecurrenceTypes.DAILY:
      return {
        ...calculateDailyStreak(recurrencePattern as DailyRecurrencePattern, completions, range),
        nextDue: null,  
        overdue: false  
      };

    case RecurrenceTypes.WEEKDAY:
      return {
        ...calculateDailyStreak({
          ...recurrencePattern,
          type: RecurrenceTypes.DAILY,
          isWorkday: true
        } as DailyRecurrencePattern, completions, range),
        nextDue: null,
        overdue: false
      };

    case RecurrenceTypes.WEEKEND:
      return {
        ...calculateDailyStreak({
          ...recurrencePattern,
          type: RecurrenceTypes.DAILY,
          isWorkday: false
        } as DailyRecurrencePattern, completions, range),
        nextDue: null,
        overdue: false
      };

    case RecurrenceTypes.WEEKLY:
      return {
        ...calculateWeeklyStreak(recurrencePattern, completions, range),
        nextDue: null,
        overdue: false
      };

    case RecurrenceTypes.MONTHLY:
      return {
        ...calculateMonthlyStreak(recurrencePattern, completions, range),
        nextDue: null,
        overdue: false
      };

    case RecurrenceTypes.YEARLY:
      return {
        ...calculateYearlyStreak(recurrencePattern, completions, range),
        nextDue: null,
        overdue: false
      };

    case RecurrenceTypes.RELATIVE:
      return {
        ...calculateRelativeStreak(recurrencePattern, completions, range),
        nextDue: null,
        overdue: false
      };

    case RecurrenceTypes.COMPLETION:
      return {
        ...calculateCompletionStreak(recurrencePattern, completions, range),
        nextDue: null,
        overdue: false
      };

    case RecurrenceTypes.HOLIDAY:
      return {
        ...calculateHolidayStreak(recurrencePattern, completions, range),
        nextDue: null,
        overdue: false
      };

    case RecurrenceTypes.UNSUPPORTED:
      return {
        currentStreak: 0,
        longestStreak: 0,
        nextDue: null,
        overdue: false
      };

    default: {
      const exhaustiveCheck: never = recurrencePattern;
      throw new Error(`Unsupported pattern type: ${exhaustiveCheck}`);
    }
  }
}

export function parsePattern(pattern: string): RecurrencePattern {
  // Try each pattern parser in sequence
  if (isDailyPattern(pattern)) {
    return parseDailyPattern(pattern);
  }
  if (isWeeklyPattern(pattern)) {
    return parseWeeklyPattern(pattern);
  }
  if (isMonthlyPattern(pattern)) {
    const monthlyPattern = parseMonthlyPattern(pattern);
    if (!monthlyPattern) {
      throw new Error(`Invalid monthly pattern format: ${pattern}`);
    }
    return monthlyPattern;
  }
  if (isYearlyPattern(pattern)) {
    return parseYearlyPattern(pattern);
  }
  if (isRelativePattern(pattern)) {
    return parseRelativePattern(pattern);
  }
  if (isCompletionPattern(pattern)) {
    return parseCompletionPattern(pattern);
  }
  if (isHolidayPattern(pattern)) {
    return parseHolidayPattern(pattern);
  }

  return {
    type: RecurrenceTypes.UNSUPPORTED,
    pattern: pattern,
    originalPattern: pattern
  };
}

// Export types and utilities that might be needed by consumers
export * from './types';
export * from './helpers/constants';
export * from './helpers/dateUtils';
