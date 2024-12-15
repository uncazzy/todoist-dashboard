import { DailyRecurrencePattern, RecurrenceTypes } from '../../types';
import { isDailyPattern } from './index';

export function parseDailyPattern(pattern: string): DailyRecurrencePattern | null {
  if (!isDailyPattern(pattern)) {
    return null;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Handle workday and weekend patterns first
  if (normalizedPattern === 'every workday' || normalizedPattern === 'every weekday') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      isWorkday: true
    };
  }

  if (normalizedPattern === 'every weekend') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      isWeekend: true
    };
  }

  // Handle time of day patterns with specific hours
  if (normalizedPattern === 'every morning') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours: 9, minutes: 0 }
    };
  }

  if (normalizedPattern === 'every afternoon') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours: 12, minutes: 0 }
    };
  }

  if (normalizedPattern === 'every evening') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours: 19, minutes: 0 }
    };
  }

  if (normalizedPattern === 'every night') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours: 22, minutes: 0 }
    };
  }

  // Handle specific time patterns (e.g., "every day at 09:00", "every day at 9am", "every day at 9:15am")
  const timePattern = /^every day at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const match = normalizedPattern.match(timePattern);
  if (match && match[1]) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3]?.toLowerCase();

    // Handle 12-hour format
    if (meridiem) {
      if (meridiem === 'pm' && hours < 12) {
        hours += 12;
      } else if (meridiem === 'am' && hours === 12) {
        hours = 0;
      }
    }

    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours, minutes }
    };
  }

  // Handle "every day [time]" pattern
  const timePattern2 = /^every\s+day\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const timeMatches = normalizedPattern.match(timePattern2);
  if (timeMatches && timeMatches[1]) {
    let hours = parseInt(timeMatches[1], 10);
    const minutes = timeMatches[2] ? parseInt(timeMatches[2], 10) : 0;
    const meridiem = timeMatches[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return {
      type: RecurrenceTypes.DAILY,
      interval: 1,
      timeOfDay: { hours, minutes }
    };
  }

  // Handle "every other day" pattern
  if (normalizedPattern === 'every other day') {
    return {
      type: RecurrenceTypes.DAILY,
      interval: 2
    };
  }

  // Handle other patterns
  const patterns = [
    // Basic daily with optional time period
    /^every\s+(?:(\d+)\s+)?(?:(work))?days?\s*(?:at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?$/,
    // ISO date ending pattern
    /^every\s+day\s+ending\s+(\d{4})-(\d{2})-(\d{2})$/,
  ];

  for (const regex of patterns) {
    const matches = normalizedPattern.match(regex);
    if (matches) {
      const result: DailyRecurrencePattern = {
        type: RecurrenceTypes.DAILY,
        interval: matches[1] ? parseInt(matches[1], 10) : 1
      };

      // Add workday flag if specified
      if (matches[2] === 'work') {
        result.isWorkday = true;
      }

      // Add time if specified
      if (matches[3]) {
        let hours = parseInt(matches[3], 10);
        const minutes = matches[4] ? parseInt(matches[4], 10) : 0;
        const meridiem = matches[5]?.toLowerCase();

        if (meridiem === 'pm' && hours < 12) {
          hours += 12;
        } else if (meridiem === 'am' && hours === 12) {
          hours = 0;
        }

        result.timeOfDay = { hours, minutes };
      }

      // Add end date if specified
      if (matches[6] && matches[7] && matches[8]) {
        const year = parseInt(matches[6], 10);
        const month = parseInt(matches[7], 10) - 1; // JS months are 0-based
        const day = parseInt(matches[8], 10);
        result.endDate = new Date(year, month, day);
      }

      return result;
    }
  }

  // Default to simple daily pattern
  return {
    type: RecurrenceTypes.DAILY,
    interval: 1
  };
}
