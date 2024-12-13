import { DateRange } from '../../types';
import { MonthlyRecurrencePattern } from './types';
import { WEEKDAYS } from '../../helpers/constants';

// Helper function to check if a pattern is a monthly pattern
export function isMonthlyPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return false;
  }

  // Remove time part for pattern matching
  const patternWithoutTime = normalizedPattern.replace(/\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '');

  // Get weekday pattern string
  const weekdaysFull = Object.keys(WEEKDAYS).map(day => day.toLowerCase());
  const weekdaysAbbr = weekdaysFull.map(day => day.substring(0, 3));
  const allWeekdays = Array.from(new Set(weekdaysFull.concat(weekdaysAbbr))).join('|');

  // Check for various monthly patterns
  const patterns = [
    // Simple month: "every month"
    /^every\s+month$/i,
    // Month interval: "every 3 months"
    /^every\s+\d+\s+months?$/i,
    // Every other month
    /^every\s+other\s+month$/i,
    // Simple day of month: "every 1st", "every 15th", or just "every 26"
    /^every\s+(?:the\s+)?\d+(?:st|nd|rd|th)?$/i,
    // Multiple days of month: "every 1, 15, 30" or "every 2nd, 15th, 27th"
    /^every\s+(?:the\s+)?\d+(?:st|nd|rd|th)?(?:\s*,\s*\d+(?:st|nd|rd|th)?)+$/i,
    // Last day patterns
    /^every\s+last\s+day(?:\s+of\s+the\s+month)?$/i,
    // Ordinal weekday: "every 2nd wednesday" or "every 2nd wed"
    new RegExp(`^every\\s+(?:the\\s+)?(?:\\d+(?:st|nd|rd|th)|last)\\s+(?:${allWeekdays})$`, 'i'),
    // Workday patterns
    /^every\s+(?:the\s+)?(?:\d+(?:st|nd|rd|th)|last|first)\s+workday$/i
  ];

  return patterns.some(regex => regex.test(patternWithoutTime));
}

export function calculateAllowedRange(date: Date, pattern: MonthlyRecurrencePattern): DateRange {
  const targetDate = new Date(date);
  
  // For time-specific patterns
  if (pattern.timeOfDay) {
    const { hours, minutes } = pattern.timeOfDay;
    targetDate.setHours(hours || 0, minutes || 0);
    
    return {
      start: targetDate,
      end: new Date(targetDate.getTime() + 60 * 60 * 1000) // 1 hour window
    };
  }
  
  // For non-time-specific patterns, only allow completion on the exact day
  targetDate.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return {
    start: targetDate,
    end: endOfDay
  };
}
