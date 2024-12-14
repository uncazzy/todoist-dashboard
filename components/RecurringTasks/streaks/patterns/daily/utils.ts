import { startOfDay, endOfDay } from 'date-fns';
import { DailyRecurrencePattern, DateRange } from '../../types';
import { isWorkday } from '../../helpers/dateUtils';

export function isValidTargetDay(date: Date, pattern: DailyRecurrencePattern): boolean {
  if (pattern.isWorkday) {
    return isWorkday(date);
  }
  if (pattern.isWeekend) {
    return !isWorkday(date);
  }
  return true;
}

export function calculateAllowedRange(date: Date): DateRange {
  // Always use full day range regardless of time specification
  return {
    start: startOfDay(date),
    end: endOfDay(date)
  };
}

// Helper function to check if a pattern is a daily pattern
export function isDailyPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return false;
  }

  // Match patterns for daily recurrences
  const patterns = [
    // Basic daily patterns
    /^every\s+day$/i,
    /^every\s+day\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?$/i,
    /^every\s+day\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?$/i,
    /^every\s+other\s+day$/i,
    /^every\s+weekday$/i,
    /^every\s+workday$/i,
    /^every\s+weekend$/i,
    // Time of day patterns
    /^every\s+morning$/i,
    /^every\s+afternoon$/i,
    /^every\s+evening$/i,
    /^every\s+night$/i,
    // Interval patterns
    /^every\s+\d+\s+days?(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm))?$/i,
    /^every!\s+\d+\s+days?$/i,
    /^after\s+\d+\s+days?$/i,
    // Date range patterns
    /^every\s+day\s+starting\s+(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s+\d{1,2})?$/i,
    /^every\s+day\s+ending\s+(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s+\d{1,2})?$/i,
    /^every\s+day\s+ending\s+\d{4}-\d{2}-\d{2}$/i,
    /^every\s+day\s+from\s+(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s+\d{1,2})?\s+until\s+(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s+\d{1,2})?$/i
  ];

  return patterns.some(regex => regex.test(normalizedPattern));
}
