import { WeeklyRecurrencePattern, RecurrenceTypes, WeekDay } from '../../types';
import { WEEKDAY_NAMES } from './utils';

const WEEKDAY_TO_NUMBER: Record<string, WeekDay> = {
  'SUNDAY': 0,
  'MONDAY': 1,
  'TUESDAY': 2,
  'WEDNESDAY': 3,
  'THURSDAY': 4,
  'FRIDAY': 5,
  'SATURDAY': 6
};

export function parseWeeklyPattern(pattern: string): WeeklyRecurrencePattern {
  if (!pattern || typeof pattern !== 'string') {
    throw new Error('Invalid weekly pattern format');
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    throw new Error('Invalid weekly pattern format');
  }

  // Match patterns for weekly recurrences
  const patterns = [
    // Basic weekly patterns
    /^every\s+week$/i,
    /^every\s+(\d+)\s+weeks?$/i,
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)$/i,
    /^every\s+other\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)$/i,
    // Multiple weekdays pattern
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*(?:,\s*(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*)+$/i
  ];

  if (!patterns.some(regex => regex.test(normalizedPattern))) {
    throw new Error('Invalid weekly pattern format');
  }

  let interval = 1;
  const weekdays: WeekDay[] = [];

  // Handle interval if specified
  if (normalizedPattern.includes('other week')) {
    interval = 2;
  } else if (normalizedPattern.includes('weeks')) {
    const intervalMatch = normalizedPattern.match(/every\s+(\d+)\s+weeks/);
    if (intervalMatch?.[1]) {
      interval = parseInt(intervalMatch[1], 10);
    }
  }

  // Extract weekdays
  for (const [weekdayStr, weekdayValue] of Object.entries(WEEKDAY_NAMES)) {
    if (normalizedPattern.includes(weekdayStr.toLowerCase())) {
      const weekdayNumber = WEEKDAY_TO_NUMBER[weekdayValue];
      if (weekdayNumber !== undefined) {
        weekdays.push(weekdayNumber);
      }
    }
  }

  // If no specific weekdays mentioned but pattern includes "week", default to Monday
  if (weekdays.length === 0 && normalizedPattern.includes('week')) {
    weekdays.push(1); // Monday
  }

  if (weekdays.length === 0) {
    throw new Error('No valid weekdays found in pattern');
  }

  return {
    type: RecurrenceTypes.WEEKLY,
    interval,
    weekdays
  };
}
