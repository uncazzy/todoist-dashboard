import { DateRange } from '../../types';
import { MonthlyRecurrencePattern } from './types';

export function calculateAllowedRange(date: Date, pattern: MonthlyRecurrencePattern): DateRange {
  const targetDate = new Date(date);
  
  // For time-specific patterns
  if (pattern.timeOfDay) {
    const { hours, minutes } = pattern.timeOfDay;
    targetDate.setHours(hours || 0, minutes || 0);
    
    return {
      start: targetDate,
      end: new Date(targetDate.getTime() + 60 * 60 * 1000) // 1 hour window
    };
  }
  
  // For non-time-specific patterns, only allow completion on the exact day
  targetDate.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return {
    start: targetDate,
    end: endOfDay
  };
}
