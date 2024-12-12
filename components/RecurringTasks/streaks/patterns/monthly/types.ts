import { DateRange, RecurrenceTypes, TimeOfDay, WeekDay } from '../../types';

export interface MonthlyTarget {
  date: Date;
  allowedRange: DateRange;
  dayOfMonth: number;
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
