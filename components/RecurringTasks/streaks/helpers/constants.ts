import { WeekDay, TimePeriod, TimePeriodConfig, RecurrenceTypes } from '../types';

export const WEEKDAYS: Readonly<Record<string, WeekDay>> = {
  'SUNDAY': 0, 'SUN': 0,
  'MONDAY': 1, 'MON': 1,
  'TUESDAY': 2, 'TUE': 2,
  'WEDNESDAY': 3, 'WED': 3,
  'THURSDAY': 4, 'THU': 4,
  'FRIDAY': 5, 'FRI': 5,
  'SATURDAY': 6, 'SAT': 6
} as const;

export const MONTH_MAP: Readonly<Record<string, number>> = {
  'jan': 0, 'january': 0,
  'feb': 1, 'february': 1,
  'mar': 2, 'march': 2,
  'apr': 3, 'april': 3,
  'may': 4,
  'jun': 5, 'june': 5,
  'jul': 6, 'july': 6,
  'aug': 7, 'august': 7,
  'sep': 8, 'september': 8,
  'oct': 9, 'october': 9,
  'nov': 10, 'november': 10,
  'dec': 11, 'december': 11
} as const;

export const HOLIDAY_MAP: Readonly<Record<string, { month: number; day: number }>> = {
  "new year's day": { month: 0, day: 1 },
  "valentine's day": { month: 1, day: 14 },
  "st. patrick's day": { month: 2, day: 17 },
  "easter sunday": { month: 3, day: -1 }, // Dynamic date
  "mother's day": { month: 4, day: -1 }, // Second Sunday in May
  "father's day": { month: 5, day: -1 }, // Third Sunday in June
  "independence day": { month: 6, day: 4 },
  "labor day": { month: 8, day: -1 }, // First Monday in September
  "halloween": { month: 9, day: 31 },
  "thanksgiving": { month: 10, day: -1 }, // Fourth Thursday in November
  "christmas eve": { month: 11, day: 24 },
  "christmas day": { month: 11, day: 25 },
  "new year's eve": { month: 11, day: 31 }
} as const;

export const TIME_UNITS: Readonly<Record<string, number>> = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
} as const;

export const PATTERN_TYPES: Readonly<Record<string, typeof RecurrenceTypes[keyof typeof RecurrenceTypes]>> = {
  DAILY: RecurrenceTypes.DAILY,
  WEEKDAY: RecurrenceTypes.WEEKDAY,
  WEEKEND: RecurrenceTypes.WEEKEND,
  WEEKLY: RecurrenceTypes.WEEKLY,
  MONTHLY: RecurrenceTypes.MONTHLY,
  YEARLY: RecurrenceTypes.YEARLY,
  RELATIVE: RecurrenceTypes.RELATIVE,
  COMPLETION: RecurrenceTypes.COMPLETION,
  HOLIDAY: RecurrenceTypes.HOLIDAY
} as const;

export const TIME_PERIODS: Readonly<Record<TimePeriod, TimePeriodConfig>> = {
  'morning': {
    start: { hours: 5, minutes: 0 },
    end: { hours: 11, minutes: 59 }
  },
  'afternoon': {
    start: { hours: 12, minutes: 0 },
    end: { hours: 16, minutes: 59 }
  },
  'evening': {
    start: { hours: 17, minutes: 0 },
    end: { hours: 20, minutes: 59 }
  },
  'night': {
    start: { hours: 21, minutes: 0 },
    end: { hours: 4, minutes: 59 }
  }
} as const;

// Maximum number of days to look back for streaks
export const MAX_STREAK_DAYS = 365;

// Maximum number of completions to consider for a single task
export const MAX_COMPLETIONS = 1000;

// Default time zone offset in minutes (UTC)
export const DEFAULT_TIMEZONE_OFFSET = new Date().getTimezoneOffset();
