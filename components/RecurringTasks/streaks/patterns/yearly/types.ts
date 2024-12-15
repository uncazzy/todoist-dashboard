import { DateRange } from '../../types';

export interface YearlyTarget {
  date: Date;
  allowedRange: DateRange;
  month: number;
  dayOfMonth: number;
}
