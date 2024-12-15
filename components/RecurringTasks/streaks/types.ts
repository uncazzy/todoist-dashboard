export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  nextDue: Date | null;
  overdue: boolean;
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
  HOLIDAY: 'holiday',
  UNSUPPORTED: 'unsupported'
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
  interval?: number;
  isWorkday?: boolean;
  isWeekend?: boolean;
  timeOfDay?: TimeOfDay;
  endDate?: Date;
  isCompletionBased?: boolean;
  isAfterCompletion?: boolean;
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
  daysOfMonth?: number[];
  interval?: number;
  timeOfDay?: TimeOfDay;
  isWorkday?: boolean;
  isWeekend?: boolean;
  weekday?: WeekDay;
  weekdayOrdinal?: number;
  lastDayOfMonth?: boolean;  // Flag to indicate if the task occurs on the last day of each month
}

export interface YearlyRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.YEARLY;
  month: number;
  dayOfMonth: number;
  pattern: string;
  originalPattern: string;
}

export interface RelativeRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.RELATIVE;
  daysFromCompletion: number;
  pattern: string;
  originalPattern: string;
}

export interface CompletionRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.COMPLETION;
  completionsRequired: number;
  periodDays: number;
  pattern: string;
  originalPattern: string;
}

export interface HolidayRecurrencePattern extends BaseRecurrencePattern {
  type: typeof RecurrenceTypes.HOLIDAY;
  holidayName: string;
  month: number;
  dayOfMonth: number;
  pattern: string;
  originalPattern: string;
}

export interface UnsupportedRecurrencePattern {
  type: typeof RecurrenceTypes.UNSUPPORTED;
  pattern: string;
  originalPattern: string;
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
  | HolidayRecurrencePattern
  | UnsupportedRecurrencePattern;
