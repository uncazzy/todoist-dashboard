import { WeekDay } from '../types';

// Common pattern types
export enum PatternType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  RELATIVE = 'relative',
  COMPLETION = 'completion'
}

// Pattern modifiers
export enum PatternModifier {
  EVERY = 'every',
  EVERY_OTHER = 'every other',
  AFTER = 'after'
}

// Time of day references
export enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night'
}

// Special day types
export enum SpecialDayType {
  WEEKDAY = 'weekday',
  WORKDAY = 'workday',
  WEEKEND = 'weekend'
}

// Holiday mapping
export const HOLIDAYS: Record<string, { month: number; day: number }> = {
  "new year's day": { month: 1, day: 1 },
  "valentine's day": { month: 2, day: 14 },
  "halloween": { month: 10, day: 31 },
  "new year's eve": { month: 12, day: 31 }
};

// Time of day defaults
export const TIME_OF_DAY_DEFAULTS: Record<TimeOfDay, { hours: number; minutes: number }> = {
  [TimeOfDay.MORNING]: { hours: 9, minutes: 0 },
  [TimeOfDay.AFTERNOON]: { hours: 14, minutes: 0 },
  [TimeOfDay.EVENING]: { hours: 18, minutes: 0 },
  [TimeOfDay.NIGHT]: { hours: 22, minutes: 0 }
};

// Month name mapping
export const MONTH_NAMES: Record<string, number> = {
  'jan': 1, 'january': 1,
  'feb': 2, 'february': 2,
  'mar': 3, 'march': 3,
  'apr': 4, 'april': 4,
  'may': 5,
  'jun': 6, 'june': 6,
  'jul': 7, 'july': 7,
  'aug': 8, 'august': 8,
  'sep': 9, 'september': 9,
  'oct': 10, 'october': 10,
  'nov': 11, 'november': 11,
  'dec': 12, 'december': 12
};

// Ordinal number mapping
export const ORDINALS: Record<string, number> = {
  'first': 1, '1st': 1,
  'second': 2, '2nd': 2,
  'third': 3, '3rd': 3,
  'fourth': 4, '4th': 4,
  'fifth': 5, '5th': 5,
  'last': -1
};

// Base pattern interface
export interface BasePattern {
  type: PatternType;
  interval?: number;
  timeOfDay?: { hours: number; minutes: number };
  startDate?: Date;
  endDate?: Date;
}

// Pattern-specific interfaces
export interface DailyPattern extends BasePattern {
  type: PatternType.DAILY;
  specialDay?: SpecialDayType;
}

export interface WeeklyPattern extends BasePattern {
  type: PatternType.WEEKLY;
  weekdays: WeekDay[];
}

export interface MonthlyPattern extends BasePattern {
  type: PatternType.MONTHLY;
  dayOfMonth?: number;
  weekdayOrdinal?: number;
  weekday?: WeekDay;
  lastDayOfMonth?: boolean;
}

export interface YearlyPattern extends BasePattern {
  type: PatternType.YEARLY;
  month: number;
  dayOfMonth: number;
  holiday?: string;
}

export interface RelativePattern extends BasePattern {
  type: PatternType.RELATIVE;
  daysFromCompletion: number;
}

export interface CompletionPattern extends BasePattern {
  type: PatternType.COMPLETION;
  daysFromCompletion: number;
}

// Pattern validation utilities
export function isTimeOfDay(value: string): value is TimeOfDay {
  return Object.values(TimeOfDay).includes(value as TimeOfDay);
}

export function isSpecialDay(value: string): value is SpecialDayType {
  return Object.values(SpecialDayType).includes(value as SpecialDayType);
}

export function isHoliday(value: string): boolean {
  return value.toLowerCase() in HOLIDAYS;
}

export function getHolidayDate(holiday: string): { month: number; day: number } | null {
  return HOLIDAYS[holiday.toLowerCase()] || null;
}

export function parseTimeOfDay(timeStr: string): { hours: number; minutes: number } | null {
  // Handle named times of day
  if (isTimeOfDay(timeStr)) {
    return TIME_OF_DAY_DEFAULTS[timeStr];
  }

  // Handle explicit times (e.g., "9am", "2:30pm", "14:00")
  const timeRegex = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const matches = timeStr.match(timeRegex);
  if (!matches?.[1]) return null;

  let hours = parseInt(matches[1], 10);
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  const meridiem = matches[3]?.toLowerCase();

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
    return { hours, minutes };
  }

  return null;
}
