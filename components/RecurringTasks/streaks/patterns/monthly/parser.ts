import { MonthlyRecurrencePattern } from './types';
import { WeekDay } from '../../types';

/**
 * Parse a monthly recurrence pattern from a string.
 * Examples:
 * - "every month"
 * - "every 15th"
 * - "every last day"
 * - "every 1st, 15th"
 * - "every 7 months"
 * - "every 15th at 10:15am"
 * - "every 2nd Wednesday"
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

  // Check for "every other month" pattern
  if (lower === 'every other month') {
    return {
      type: 'monthly',
      everyMonth: true,
      interval: 2
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

  // Check for "every Nth at HH:MMam/pm" pattern (e.g., "every 15th at 10:15am")
  const dayTimeMatch = lower.match(/^every (\d{1,2})(st|nd|rd|th)?( day)?( at )(\d{1,2}):(\d{2})(am|pm)$/);
  if (dayTimeMatch?.[1] && dayTimeMatch[5] && dayTimeMatch[6] && dayTimeMatch[7]) {
    const day = parseInt(dayTimeMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const hours = parseInt(dayTimeMatch[5], 10);
      const minutes = parseInt(dayTimeMatch[6], 10);
      const period = dayTimeMatch[7].toUpperCase() as 'AM' | 'PM';
      
      // Validate time
      if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes < 60) {
        // Convert to 24-hour format if PM
        const militaryHours = period === 'PM' ? (hours === 12 ? 12 : hours + 12) : (hours === 12 ? 0 : hours);
        
        return {
          type: 'monthly',
          daysOfMonth: [day],
          interval: 1,
          timeOfDay: {
            hours: militaryHours,
            minutes
          }
        };
      }
    }
  }

  // Check for "every Nth weekday" pattern (e.g., "every 2nd Wednesday")
  const weekdayOrdinalMatch = lower.match(/^every (\d{1,2})(st|nd|rd|th)? (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (weekdayOrdinalMatch?.[1] && weekdayOrdinalMatch[3]) {
    const ordinal = parseInt(weekdayOrdinalMatch[1], 10);
    if (ordinal >= 1 && ordinal <= 5) {
      const weekdayMap: Record<string, WeekDay> = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      };
      // We can safely assert this as WeekDay since our regex ensures it's a valid weekday
      const weekday = weekdayMap[weekdayOrdinalMatch[3]] as WeekDay;
      
      return {
        type: 'monthly',
        weekday,
        weekdayOrdinal: ordinal,
        interval: 1
      };
    }
  }

  // Check for "every last weekday" pattern (e.g., "every last Tuesday")
  const lastWeekdayMatch = lower.match(/^every last (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (lastWeekdayMatch?.[1]) {
    const weekdayMap: Record<string, WeekDay> = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    const weekday = weekdayMap[lastWeekdayMatch[1]] as WeekDay;
    
    return {
      type: 'monthly',
      weekday,
      weekdayOrdinal: -1, // -1 indicates last occurrence of the weekday
      interval: 1
    };
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
