import { DateRange, WeekDay } from '../../types';

export interface WeeklyTarget {
  date: Date;
  allowedRange: DateRange;
  weekday: WeekDay;
}
