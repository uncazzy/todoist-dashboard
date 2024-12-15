import { WeeklyRecurrencePattern, RecurrenceTypes, WeekDay, TimeOfDay } from '../../types';
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

export function parseWeeklyPattern(pattern: string): WeeklyRecurrencePattern | null {
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return null;
  }

  // Match patterns for weekly recurrences
  const patterns = [
    // Basic weekly patterns
    /^every\s+week$/i,
    /^every\s+(\d+)\s+weeks?$/i,
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?$/i,
    /^every\s+other\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?$/i,
    // Multiple weekdays pattern
    /^every\s+(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*(?:,\s*(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*)+$/i
  ];

  if (!patterns.some(regex => regex.test(normalizedPattern))) {
    return null;
  }

  let interval = 1;
  const weekdays: WeekDay[] = [];
  let timeOfDay: TimeOfDay | undefined;

  // Handle interval if specified
  if (normalizedPattern.includes('other')) {
    interval = 2;
  } else if (normalizedPattern.includes('weeks')) {
    const intervalMatch = normalizedPattern.match(/every\s+(\d+)\s+weeks/);
    if (intervalMatch?.[1]) {
      interval = parseInt(intervalMatch[1], 10);
    }
  }

  // Extract time if present
  const timeMatch = normalizedPattern.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch && timeMatch[1]) {
    let parsedHour = parseInt(timeMatch[1], 10);
    const parsedMinute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    // Convert to 24-hour format
    if (meridiem === 'pm' && parsedHour !== 12) {
      parsedHour += 12;
    } else if (meridiem === 'am' && parsedHour === 12) {
      parsedHour = 0;
    }

    timeOfDay = {
      hours: parsedHour,
      minutes: parsedMinute
    };
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

  // If no weekdays were found, it's not a valid weekly pattern
  if (weekdays.length === 0) {
    return null;
  }

  // Create the base result
  const result: WeeklyRecurrencePattern = {
    type: RecurrenceTypes.WEEKLY,
    interval,
    weekdays
  };

  // Only add timeOfDay if it was found in the pattern
  if (timeOfDay) {
    result.timeOfDay = timeOfDay;
  }

  return result;
}
