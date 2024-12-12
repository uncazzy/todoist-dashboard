import { addMonths, startOfDay, getDaysInMonth } from 'date-fns';
import { DateRange } from '../../types';
import { MonthlyRecurrencePattern, MonthlyTarget } from './types';
import { calculateAllowedRange } from './utils';

function adjustToLocalDate(utcDate: Date): Date {
  const localDate = new Date(utcDate);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate;
}

function createTargetDate(year: number, month: number, day: number): Date {
  // Create date in local timezone
  const localDate = new Date(year, month, day, 0, 0, 0, 0);
  // Convert to UTC by adding timezone offset
  const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60 * 1000);
  return utcDate;
}

export function generateMonthlyTargets(
  pattern: MonthlyRecurrencePattern, 
  range: DateRange,
  firstCompletionDate?: Date
): MonthlyTarget[] {
  const targets: MonthlyTarget[] = [];
  const rangeStart = startOfDay(adjustToLocalDate(range.start));
  let currentDate = new Date(rangeStart);

  // For "every month" pattern, we need to use the day from the first completion
  if (pattern.everyMonth) {
    // Use first completion date if available, otherwise use range start
    const localReferenceDate = firstCompletionDate 
      ? adjustToLocalDate(firstCompletionDate)
      : adjustToLocalDate(range.start);
    const targetDay = localReferenceDate.getDate();
    currentDate.setDate(1); // Start from the first day of the month

    while (currentDate <= range.end) {
      const daysInMonth = getDaysInMonth(currentDate);
      // Ensure we don't exceed the days in the month
      const actualTargetDay = Math.min(targetDay, daysInMonth);

      // Create target date in local timezone then convert to UTC
      const targetDate = createTargetDate(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        actualTargetDay
      );

      // Skip if target date falls outside our range
      if (targetDate <= range.end && targetDate >= rangeStart) {
        const localTargetDate = adjustToLocalDate(targetDate);
        targets.push({
          date: targetDate,
          allowedRange: calculateAllowedRange(targetDate, pattern),
          dayOfMonth: localTargetDate.getDate()
        });
      }

      currentDate = addMonths(currentDate, pattern.interval || 1);
    }
    return targets;
  }

  currentDate.setDate(1); // Start from the first day of the month

  // Handle weekday patterns
  if (pattern.weekday !== undefined) {
    while (currentDate <= range.end) {
      const daysInMonth = getDaysInMonth(currentDate);
      let targetDay = -1;

      if (pattern.weekdayOrdinal !== undefined) {
        if (pattern.weekdayOrdinal === -1) {
          // Last occurrence of weekday
          const lastDay = new Date(currentDate);
          lastDay.setDate(daysInMonth);
          // Go backwards until we find the last occurrence of the weekday
          while (lastDay.getDay() !== pattern.weekday) {
            lastDay.setDate(lastDay.getDate() - 1);
          }
          targetDay = lastDay.getDate();
        } else if (pattern.weekdayOrdinal > 0) {
          // Nth occurrence of weekday
          const firstDay = new Date(currentDate);
          firstDay.setDate(1);
          // Find the first occurrence of the weekday
          const firstDayOfWeekday = new Date(firstDay);
          firstDayOfWeekday.setDate(firstDayOfWeekday.getDate() + ((7 - firstDayOfWeekday.getDay() + pattern.weekday) % 7));
          targetDay = firstDayOfWeekday.getDate() + (pattern.weekdayOrdinal - 1) * 7;
          if (targetDay > daysInMonth) {
            targetDay = -1; // No valid date for this month
          }
        }
      }

      if (targetDay !== -1) {
        // Create target date in local timezone then convert to UTC
        const targetDate = createTargetDate(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          targetDay
        );
        
        // Skip if target date falls outside our range
        if (targetDate <= range.end && targetDate >= rangeStart) {
          const localTargetDate = adjustToLocalDate(targetDate);
          targets.push({
            date: targetDate,
            allowedRange: calculateAllowedRange(targetDate, pattern),
            dayOfMonth: localTargetDate.getDate()
          });
        }
      }

      currentDate = addMonths(currentDate, pattern.interval || 1);
    }
  } else if (pattern.lastDayOfMonth) {
    // Handle last day of month pattern
    while (currentDate <= range.end) {
      const daysInMonth = getDaysInMonth(currentDate);

      // Create target date in local timezone then convert to UTC
      const targetDate = createTargetDate(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        daysInMonth
      );
      
      // Skip if target date falls outside our range
      if (targetDate <= range.end && targetDate >= rangeStart) {
        const localTargetDate = adjustToLocalDate(targetDate);
        targets.push({
          date: targetDate,
          allowedRange: calculateAllowedRange(targetDate, pattern),
          dayOfMonth: localTargetDate.getDate()
        });
      }

      currentDate = addMonths(currentDate, pattern.interval || 1);
    }
  } else if (pattern.daysOfMonth) {
    // Handle specific day of month pattern
    while (currentDate <= range.end) {
      const daysInMonth = getDaysInMonth(currentDate);
      
      // Process each target day
      for (const targetDay of pattern.daysOfMonth) {
        // Skip if target day is greater than days in month
        if (targetDay > daysInMonth) {
          console.log(`Skipping target day ${targetDay} as it exceeds days in month ${daysInMonth}`);
          continue;
        }

        // Create target date in local timezone then convert to UTC
        const targetDate = createTargetDate(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          targetDay
        );

        // Skip if target date falls outside our range
        if (targetDate <= range.end && targetDate >= rangeStart) {
          const localTargetDate = adjustToLocalDate(targetDate);
          targets.push({
            date: targetDate,
            allowedRange: calculateAllowedRange(targetDate, pattern),
            dayOfMonth: localTargetDate.getDate()
          });
        }
      }

      currentDate = addMonths(currentDate, pattern.interval || 1);
    }
  }

  return targets;
}
