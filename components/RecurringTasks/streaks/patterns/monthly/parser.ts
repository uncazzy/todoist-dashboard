import { MonthlyRecurrencePattern } from './types';

/**
 * Parse a monthly recurrence pattern from a string.
 * Examples:
 * - "every month"
 * - "every 15th"
 * - "every last day"
 * - "every 1st, 15th"
 * - "every 7 months"
 */
export function parseMonthlyPattern(pattern: string): MonthlyRecurrencePattern | null {
  // Convert to lowercase and trim for consistent parsing
  const lower = pattern.toLowerCase().trim();

  // Check for "every X months" pattern
  const intervalMatch = lower.match(/^every (\d+) months?$/);
  if (intervalMatch?.[1]) {
    const interval = parseInt(intervalMatch[1], 10);
    return {
      type: 'monthly',
      everyMonth: true,
      interval
    };
  }

  // Check for "every month" pattern
  if (lower === 'every month') {
    return {
      type: 'monthly',
      everyMonth: true,
      interval: 1
    };
  }

  // Check for "every last day" pattern
  if (lower === 'every last day' || lower === 'every last day of the month') {
    return {
      type: 'monthly',
      lastDayOfMonth: true,
      interval: 1
    };
  }

  // Check for "every Nth" pattern (e.g., "every 15th", "every 1st")
  const dayMatch = lower.match(/^every (\d{1,2})(st|nd|rd|th)?( day)?( of)?( the)?( month)?$/);
  if (dayMatch?.[1]) {
    const day = parseInt(dayMatch[1], 10);
    if (day >= 1 && day <= 31) {
      return {
        type: 'monthly',
        daysOfMonth: [day],
        interval: 1
      };
    }
  }

  // Check for multiple days (e.g., "every 1st, 15th")
  const multipleDaysMatch = lower.match(/^every ((?:\d{1,2}(?:st|nd|rd|th)?,\s*)*\d{1,2}(?:st|nd|rd|th)?)$/);
  if (multipleDaysMatch?.[1]) {
    const daysStr = multipleDaysMatch[1];
    // Split by comma, remove ordinal suffixes, parse numbers
    const days = daysStr
      .split(',')
      .map(d => parseInt(d.trim().replace(/(st|nd|rd|th)/, ''), 10))
      .filter(d => d >= 1 && d <= 31)
      .sort((a, b) => a - b);

    if (days.length > 0) {
      return {
        type: 'monthly',
        daysOfMonth: days,
        interval: 1
      };
    }
  }

  return null;
}
