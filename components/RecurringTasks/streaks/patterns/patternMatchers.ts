import { WEEKDAYS, MONTH_MAP } from '../helpers/constants';

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
    /^every\s+day\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)$/i,
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

// Helper function to check if a pattern is a weekly pattern
export function isWeeklyPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return false;
  }

  // Match patterns for weekly recurrences
  const patterns = [
    // Basic weekly patterns
    /^every\s+week$/i,
    /^every\s+(\d+)\s+weeks?$/i,
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)$/i,
    /^every\s+other\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)$/i,
    // Multiple weekdays pattern
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*(?:,\s*(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*)+$/i,
    // Weekly patterns with time
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)$/i,
    // Weekly patterns with date ranges
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s+(?:starting|ending)\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}$/i,
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s+(?:starting|ending)\s+\d{4}-\d{2}-\d{2}$/i,
    /^every\s+\d+\s+weeks?\s+(?:starting|ending)\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}$/i,
    /^every\s+\d+\s+weeks?\s+(?:starting|ending)\s+\d{4}-\d{2}-\d{2}$/i,
    // Completion-based patterns
    /^every!\s+\d+\s+weeks?$/i
  ];

  return patterns.some(regex => regex.test(normalizedPattern));
}

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

// Helper function to check if a pattern is a holiday pattern
export function isHolidayPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return false;
  }

  // Remove time part for pattern matching
  const patternWithoutTime = normalizedPattern.replace(/\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '');

  // Check for various holiday patterns
  const patterns = [
    // Common holidays
    /^every\s+(?:new\s+year(?:'s)?\s+(?:day|eve)|valentine's\s+day|halloween)$/i,
    // Other holidays can be added here
  ];

  return patterns.some(regex => regex.test(patternWithoutTime));
}

// Helper function to check if a pattern is a relative pattern
export function isRelativePattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();

  // Get weekday pattern string
  const weekdaysFull = Object.keys(WEEKDAYS).map(day => day.toLowerCase());
  const weekdaysAbbr = weekdaysFull.map(day => day.substring(0, 3));
  const allWeekdays = Array.from(new Set(weekdaysFull.concat(weekdaysAbbr))).join('|');

  // Check for various relative patterns
  const patterns = [
    // After X days: "after 3 days"
    /^after\s+\d+\s+days?$/i,
    // Every other patterns
    /^every\s+other\s+day$/i,
    /^every\s+other\s+week$/i,
    /^every\s+other\s+month$/i,
    /^every\s+other\s+year$/i,
    // Every other weekday
    new RegExp(`^every\\s+other\\s+(?:${allWeekdays})$`, 'i')
  ];

  return patterns.some(regex => regex.test(normalizedPattern));
}

// Helper function to check if a pattern is a completion pattern
export function isCompletionPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();

  // Check for patterns with "!"
  const patterns = [
    // Simple completion: "every! day"
    /^every!\s*day$/i,
    // With interval: "every! 3 days"
    /^every!\s*\d+\s*days?$/i,
    // With weeks: "every! 2 weeks"
    /^every!\s*\d+\s*weeks?$/i
  ];

  return patterns.some(regex => regex.test(normalizedPattern));
}
