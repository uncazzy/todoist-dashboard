// Add weekday name mapping
export const WEEKDAY_NAMES: Record<string, string> = {
  'sun': 'SUNDAY',
  'sunday': 'SUNDAY',
  'mon': 'MONDAY',
  'monday': 'MONDAY',
  'tue': 'TUESDAY',
  'tues': 'TUESDAY',
  'tuesday': 'TUESDAY',
  'wed': 'WEDNESDAY',
  'wednesday': 'WEDNESDAY',
  'thu': 'THURSDAY',
  'thur': 'THURSDAY',
  'thurs': 'THURSDAY',
  'thursday': 'THURSDAY',
  'fri': 'FRIDAY',
  'friday': 'FRIDAY',
  'sat': 'SATURDAY',
  'saturday': 'SATURDAY'
};

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
