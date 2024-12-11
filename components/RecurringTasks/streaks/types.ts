export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export const RecurrenceTypes = {
  DAILY: 'daily',
  WEEKDAY: 'weekday',
  WEEKEND: 'weekend',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  RELATIVE: 'relative',
  COMPLETION: 'completion',
  HOLIDAY: 'holiday'
} as const;

export type RecurrenceType = typeof RecurrenceTypes[keyof typeof RecurrenceTypes];

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TimeUnit = 'day' | 'week' | 'month' | 'year';

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimePeriodConfig {
  start: TimeOfDay;
  end: TimeOfDay;
}

export interface TimeOfDay {
  hours: number;
  minutes: number;
  period?: TimePeriod;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface BaseRecurrencePattern {
  type: RecurrenceType;
  interval?: number;
  timeOfDay?: TimeOfDay;
}

export interface DailyRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.DAILY;
  isWorkday?: boolean;
}

export interface WeekdayRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.WEEKDAY;
}

export interface WeekendRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.WEEKEND;
}

export interface WeeklyRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.WEEKLY;
  weekdays: WeekDay[];
}

export interface MonthlyRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.MONTHLY;
  dayOfMonth: number;
  lastDayOfMonth?: boolean;
}

export interface YearlyRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.YEARLY;
  month: number;
  dayOfMonth: number;
}

export interface RelativeRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.RELATIVE;
  daysFromCompletion: number;
}

export interface CompletionRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.COMPLETION;
  completionsRequired: number;
  periodDays: number;
}

export interface HolidayRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.HOLIDAY;
  holidayName: string;
  month: number;
  dayOfMonth: number;
}

export type RecurrencePattern =
  | DailyRecurrencePattern
  | WeekdayRecurrencePattern
  | WeekendRecurrencePattern
  | WeeklyRecurrencePattern
  | MonthlyRecurrencePattern
  | YearlyRecurrencePattern
  | RelativeRecurrencePattern
  | CompletionRecurrencePattern
  | HolidayRecurrencePattern;
