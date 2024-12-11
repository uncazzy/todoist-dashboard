import { StreakResult, RecurrencePattern, DailyRecurrencePattern, RecurrenceTypes, DateRange } from './types';
import { calculateDailyStreak, parseDailyPattern } from './patterns/daily';
import { calculateWeeklyStreak, parseWeeklyPattern } from './patterns/weekly';
import { calculateMonthlyStreak, parseMonthlyPattern } from './patterns/monthly';
import { calculateYearlyStreak, isYearlyPattern, parseYearlyPattern } from './patterns/yearly';
import { calculateRelativeStreak, parseRelativePattern } from './patterns/relative';
import { calculateCompletionStreak, isCompletionPattern, parseCompletionPattern } from './patterns/completion';
import { calculateHolidayStreak, isHolidayPattern, parseHolidayPattern } from './patterns/holiday';
import { isDailyPattern, isMonthlyPattern, isRelativePattern, isWeeklyPattern } from './patterns/patternMatchers';

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
      return calculateDailyStreak(recurrencePattern as DailyRecurrencePattern, completions, range);

    case RecurrenceTypes.WEEKDAY:
      return calculateDailyStreak({
        ...recurrencePattern,
        type: RecurrenceTypes.DAILY,
        isWorkday: true
      } as DailyRecurrencePattern, completions, range);

    case RecurrenceTypes.WEEKEND:
      return calculateDailyStreak({
        ...recurrencePattern,
        type: RecurrenceTypes.DAILY,
        isWorkday: false
      } as DailyRecurrencePattern, completions, range);

    case RecurrenceTypes.WEEKLY:
      return calculateWeeklyStreak(recurrencePattern, completions, range);

    case RecurrenceTypes.MONTHLY:
      return calculateMonthlyStreak(recurrencePattern, completions, range);

    case RecurrenceTypes.YEARLY:
      return calculateYearlyStreak(recurrencePattern, completions, range);

    case RecurrenceTypes.RELATIVE:
      return calculateRelativeStreak(recurrencePattern, completions, range);

    case RecurrenceTypes.COMPLETION:
      return calculateCompletionStreak(recurrencePattern, completions, range);

    case RecurrenceTypes.HOLIDAY:
      return calculateHolidayStreak(recurrencePattern, completions, range);

    default: {
      const exhaustiveCheck: never = recurrencePattern;
      throw new Error(`Unsupported pattern type: ${exhaustiveCheck}`);
    }
  }
}

function parsePattern(pattern: string): RecurrencePattern {
  // Try each pattern parser in sequence
  if (isDailyPattern(pattern)) {
    return parseDailyPattern(pattern);
  }
  if (isWeeklyPattern(pattern)) {
    return parseWeeklyPattern(pattern);
  }
  if (isMonthlyPattern(pattern)) {
    return parseMonthlyPattern(pattern);
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

  throw new Error(`Unsupported pattern format: ${pattern}`);
}

// Export types and utilities that might be needed by consumers
export * from './types';
export * from './helpers/constants';
export * from './helpers/dateUtils';
export * from './helpers/validation';
