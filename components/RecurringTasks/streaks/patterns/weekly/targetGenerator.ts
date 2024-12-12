import { endOfDay, startOfDay } from 'date-fns';
import { WeeklyRecurrencePattern, DateRange, WeekDay } from '../../types';
import { WeeklyTarget } from './types';

export function generateWeeklyTargets(pattern: WeeklyRecurrencePattern, range: DateRange): WeeklyTarget[] {
  const targets: WeeklyTarget[] = [];
  const weekdays = pattern.weekdays;
  let currentDate = startOfDay(range.end);
  
  while (currentDate >= range.start) {
    const dayNumber = currentDate.getDay() as WeekDay;
    
    if (weekdays.includes(dayNumber)) {
      targets.push({
        date: currentDate,
        allowedRange: {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        },
        weekday: dayNumber
      });
    }
    
    // Move to the previous day
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return targets;
}
