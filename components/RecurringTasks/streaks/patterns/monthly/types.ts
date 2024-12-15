import { DateRange, RecurrenceTypes, TimeOfDay, WeekDay } from '../../types';

export interface MonthlyTarget {
  date: Date;
  allowedRange: DateRange;
  dayOfMonth: number;
  isLastDayOfShorterMonth?: boolean;  // Flag to indicate if this target falls on the last day of a month with fewer days than the original target
}

export interface MonthlyRecurrencePattern {
  type: typeof RecurrenceTypes.MONTHLY;
  daysOfMonth?: number[];
  lastDayOfMonth?: boolean;
  weekday?: WeekDay;
  weekdayOrdinal?: number;
  interval?: number;
  timeOfDay?: TimeOfDay;
  everyMonth?: boolean;
}
