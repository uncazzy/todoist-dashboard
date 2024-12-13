import { startOfDay, endOfDay } from 'date-fns';
import { YearlyRecurrencePattern, DateRange } from '../../types';
import { MONTH_MAP } from '../../helpers/constants';

// Helper function to check if a pattern is a yearly pattern
export function isYearlyPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return false;
  }

  // Get month pattern string
  const months = Object.keys(MONTH_MAP).join('|');

  // Check for various yearly patterns
  const patterns = [
    // Simple year: "every year"
    /^every\s+year$/i,
    // Year interval: "every 2 years"
    /^every\s+\d+\s+years$/i,
    // Every other year
    /^every\s+other\s+year$/i,
    // Specific date: "every january 1st" or "every jan 1"
    new RegExp(`^every\\s+(?:${months})\\s+\\d{1,2}(?:st|nd|rd|th)?$`, 'i'),
    // Multiple dates: "every 21st february, 1st april, 10th july"
    new RegExp(`^every\\s+\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${months})(?:\\s*,\\s*\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${months}))*$`, 'i'),
    // Holiday patterns
    /^every\s+(?:new\s+year(?:'s)?\s+(?:day|eve)|valentine's\s+day|halloween)$/i
  ];

  return patterns.some(regex => regex.test(normalizedPattern));
}

export function calculateAllowedRange(date: Date, pattern: YearlyRecurrencePattern): DateRange {
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

  // Otherwise, use the full day
  return {
    start: baseStart,
    end: baseEnd
  };
}
