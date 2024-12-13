import { WEEKDAYS } from '../helpers/constants';

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
