import { endOfDay, startOfDay } from 'date-fns';
import { WeeklyRecurrencePattern, DateRange, WeekDay } from '../../types';
import { WeeklyTarget } from './types';

export function generateWeeklyTargets(pattern: WeeklyRecurrencePattern, range: DateRange): WeeklyTarget[] {
  const targets: WeeklyTarget[] = [];
  const weekdays = pattern.weekdays;
  const interval = pattern.interval || 1;
  let currentDate = startOfDay(range.end);

  console.log('Generating targets with pattern:', {
    weekdays,
    interval,
    rangeStart: range.start,
    rangeEnd: range.end
  });

  // For bi-weekly patterns, we need to find the first target date
  // by aligning with the actual completion schedule
  if (interval === 2) {
    // Start from range.start and move forward to find first target
    let date = startOfDay(range.start);

    // Move to the first matching weekday
    while (date <= range.end) {
      const dayNumber = date.getDay() as WeekDay;
      if (weekdays.includes(dayNumber)) {
        // Found first target date
        currentDate = date;
        break;
      }
      date = new Date(date);
      date.setDate(date.getDate() + 1);
    }
  }

  // Generate target dates
  while (currentDate >= range.start && currentDate <= range.end) {
    const dayNumber = currentDate.getDay() as WeekDay;

    if (weekdays.includes(dayNumber)) {
      console.log('Found matching weekday:', {
        date: currentDate,
        dayNumber
      });

      targets.push({
        date: currentDate,
        allowedRange: {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        },
        weekday: dayNumber
      });
      console.log('Added target date:', currentDate);

      // Move to next target date based on interval
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + (interval * 7));
    } else {
      // Move to next day
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Sort targets from newest to oldest to match the expected order
  targets.sort((a, b) => b.date.getTime() - a.date.getTime());

  console.log('Final targets generated:', targets.map(t => t.date));
  return targets;
}
