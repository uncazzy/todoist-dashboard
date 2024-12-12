import { addMonths, startOfDay, getDaysInMonth } from 'date-fns';
import { StreakResult, MonthlyRecurrencePattern, DateRange, RecurrenceTypes, TimeOfDay, WeekDay } from '../types';
import { isMonthlyPattern } from './patternMatchers';
import { WEEKDAYS } from '../helpers/constants';

interface MonthlyTarget {
  date: Date;
  allowedRange: DateRange;
  dayOfMonth: number;
}

export function calculateMonthlyStreak(
  pattern: MonthlyRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.MONTHLY) {
    throw new Error('Invalid pattern type for monthly streak calculation');
  }

  console.log('========== MONTHLY STREAK CALCULATION ==========');
  console.log('Task pattern:', pattern);

  // Generate target dates based on pattern
  const targetDates = generateMonthlyTargets(pattern, range).sort((a, b) => b.date.getTime() - a.date.getTime());
  if (!targetDates.length) {
    console.log('No target dates found');
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Determine the correct day of month from the most recent on-time completion
  if (!pattern.daysOfMonth || pattern.daysOfMonth[0] === 1) {
    const recentOnTimeCompletion = completions.find(c => {
      const day = c.getDate();
      return completions.some(other => other.getDate() === day && 
                                     other !== c && 
                                     Math.abs(other.getMonth() - c.getMonth()) === 1);
    });
    
    if (recentOnTimeCompletion) {
      pattern.daysOfMonth = [recentOnTimeCompletion.getDate()];
      // Regenerate target dates with correct day of month
      return calculateMonthlyStreak(pattern, completions, range);
    }
  }

  console.log('Target dates:', targetDates.map(t => ({ 
    date: t.date.toISOString(),
    allowedRange: {
      start: t.allowedRange.start.toISOString(),
      end: t.allowedRange.end.toISOString()
    }
  })));

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());
  console.log('Sorted completions:', sortedCompletions.map(c => c.toISOString()));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target month from newest to oldest
  for (const target of targetDates) {
    const isCompleted = sortedCompletions.some(completion => {
      // For monthly tasks, check if completion is exactly on the target date
      return completion.getDate() === target.date.getDate() &&
             completion.getMonth() === target.date.getMonth() &&
             completion.getFullYear() === target.date.getFullYear();
    });

    console.log('Checking target:', {
      date: target.date.toISOString(),
      isCompleted,
      tempStreak,
      activeStreak,
      currentStreak,
      longestStreak
    });

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
      console.log('Target completed:', {
        tempStreak,
        activeStreak,
        currentStreak,
        longestStreak
      });
    } else {
      // Break streak for any missed target
      activeStreak = false;
      if (tempStreak > 0) {
        longestStreak = Math.max(longestStreak, tempStreak);
      }
      tempStreak = 0;
      currentStreak = 0;  // Reset current streak when a target is missed
      console.log('Target missed:', {
        tempStreak,
        activeStreak,
        currentStreak,
        longestStreak
      });
    }
  }

  console.log('Final result:', { currentStreak, longestStreak });
  console.log('===========================================');

  return { currentStreak, longestStreak };
}

function generateMonthlyTargets(pattern: MonthlyRecurrencePattern, range: DateRange): MonthlyTarget[] {
  const targets: MonthlyTarget[] = [];
  const rangeStart = startOfDay(range.start);
  let currentDate = new Date(rangeStart);
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
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDay);
        
        // Skip if target date falls outside our range
        if (targetDate <= range.end && targetDate >= rangeStart) {
          targets.push({
            date: targetDate,
            allowedRange: calculateAllowedRange(targetDate, pattern),
            dayOfMonth: targetDay
          });
        }
      }

      // Move to next month
      currentDate = addMonths(currentDate, pattern.interval || 1);
    }
    return targets;
  }

  // Handle regular monthly patterns
  while (currentDate <= range.end) {
    const daysInMonth = getDaysInMonth(currentDate);
    let targetDay = pattern.daysOfMonth?.[0] ?? -1;  // Use first day from array or -1 as default

    // Handle last day of month separately
    if (pattern.lastDayOfMonth) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(daysInMonth);
      
      // Skip if target date falls outside our range
      if (targetDate <= range.end && targetDate >= rangeStart) {
        targets.push({
          date: targetDate,
          allowedRange: calculateAllowedRange(targetDate, pattern),
          dayOfMonth: daysInMonth
        });
      }
    }
    // Handle regular day of month - only if not handling multiple days
    else if (!pattern.daysOfMonth && targetDay > 0 && targetDay <= daysInMonth) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(targetDay);
      
      // Skip if target date falls outside our range
      if (targetDate <= range.end && targetDate >= rangeStart) {
        targets.push({
          date: targetDate,
          allowedRange: calculateAllowedRange(targetDate, pattern),
          dayOfMonth: targetDay
        });
      }
    }

    // Handle multiple days of month
    else if (pattern.daysOfMonth) {
      for (const day of pattern.daysOfMonth) {
        if (day > 0 && day <= daysInMonth) {
          const targetDate = new Date(currentDate);
          targetDate.setDate(day);
          
          // Skip if target date falls outside our range
          if (targetDate <= range.end && targetDate >= rangeStart) {
            targets.push({
              date: targetDate,
              allowedRange: calculateAllowedRange(targetDate, pattern),
              dayOfMonth: day
            });
          }
        }
      }
    }

    // Move to next month
    currentDate = addMonths(currentDate, pattern.interval || 1);
  }

  return targets;
}

function calculateAllowedRange(date: Date, pattern: MonthlyRecurrencePattern): DateRange {
  const targetDate = new Date(date);
  
  // For time-specific patterns
  if (pattern.timeOfDay) {
    const { hours, minutes } = pattern.timeOfDay;
    targetDate.setHours(hours, minutes, 0, 0);
    
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

export function parseMonthlyPattern(pattern: string): MonthlyRecurrencePattern {
  if (!isMonthlyPattern(pattern)) {
    throw new Error('Invalid monthly pattern format');
  }

  const normalizedPattern = pattern.trim().toLowerCase();

  // Extract time if present
  let timeOfDay: TimeOfDay | undefined;
  const timeMatch = normalizedPattern.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch?.[1]) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3]?.toLowerCase();

    // Convert to 24-hour format if AM/PM is specified
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    timeOfDay = {
      hours,
      minutes
    };
  }

  // Remove time part for pattern matching
  const patternWithoutTime = normalizedPattern.replace(/\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '');

  // Get weekday pattern string
  const weekdaysFull = Object.keys(WEEKDAYS).map(day => day.toLowerCase());
  const weekdaysAbbr = weekdaysFull.map(day => day.substring(0, 3));
  const allWeekdays = Array.from(new Set(weekdaysFull.concat(weekdaysAbbr))).join('|');

  // Check for last weekday pattern (e.g., "every last tuesday")
  const lastWeekdayMatch = patternWithoutTime.match(
    new RegExp(`^every\\s+last\\s+(${allWeekdays})$`, 'i')
  );
  if (lastWeekdayMatch?.[1]) {
    const weekday = lastWeekdayMatch[1].toLowerCase();
    
    // Convert weekday to number (0-6)
    let weekdayNum = -1;
    for (const [key, value] of Object.entries(WEEKDAYS)) {
      if (key.toLowerCase() === weekday || key.toLowerCase().substring(0, 3) === weekday) {
        weekdayNum = value;
        break;
      }
    }

    if (weekdayNum === -1) {
      throw new Error('Invalid weekday');
    }

    const result: MonthlyRecurrencePattern = {
      type: RecurrenceTypes.MONTHLY,
      interval: 1,
      daysOfMonth: [-1], // Special value for weekday patterns
      weekday: weekdayNum as WeekDay,
      weekdayOrdinal: -1 // Special value for last occurrence
    };
    if (timeOfDay) {
      result.timeOfDay = timeOfDay;
    }
    return result;
  }

  // Check for ordinal weekday pattern (e.g., "every 2nd wednesday")
  const ordinalWeekdayMatch = patternWithoutTime.match(
    new RegExp(`^every\\s+(?:the\\s+)?(\\d+)(?:st|nd|rd|th)\\s+(${allWeekdays})$`, 'i')
  );
  if (ordinalWeekdayMatch?.[1] && ordinalWeekdayMatch[2]) {
    const ordinal = parseInt(ordinalWeekdayMatch[1], 10);
    const weekday = ordinalWeekdayMatch[2].toLowerCase();
    
    // Convert weekday to number (0-6)
    let weekdayNum = -1;
    for (const [key, value] of Object.entries(WEEKDAYS)) {
      if (key.toLowerCase() === weekday || key.toLowerCase().substring(0, 3) === weekday) {
        weekdayNum = value;
        break;
      }
    }

    if (weekdayNum === -1 || ordinal < 1 || ordinal > 5) {
      throw new Error('Invalid weekday or ordinal number');
    }

    const result: MonthlyRecurrencePattern = {
      type: RecurrenceTypes.MONTHLY,
      interval: 1,
      daysOfMonth: [-1], // Special value for weekday patterns
      weekday: weekdayNum as WeekDay,
      weekdayOrdinal: ordinal
    };
    if (timeOfDay) {
      result.timeOfDay = timeOfDay;
    }
    return result;
  }

  // Check for multiple days pattern (e.g., "every 1, 15, 30" or "every 2nd, 15th, 27th")
  const multipleDaysRegex = /^every\s+(\d+(?:st|nd|rd|th)?(?:\s*,\s*\d+(?:st|nd|rd|th)?)+)$/;
  const multipleDaysMatch = patternWithoutTime.match(multipleDaysRegex);
  
  if (multipleDaysMatch) {
    // Add non-null assertion since we know it exists due to the if check
    const daysString = multipleDaysMatch[1]!;
    const days = daysString
      .split(',')
      .map(day => day.trim().replace(/(st|nd|rd|th)$/, ''))
      .map(day => parseInt(day))
      .filter(day => !isNaN(day) && day >= 1 && day <= 31)
      .sort((a, b) => a - b);

    if (days.length === 0) {
      throw new Error('Invalid days in monthly pattern');
    }

    return {
      type: RecurrenceTypes.MONTHLY,
      daysOfMonth: days,
      interval: 1
    };
  }

  // Check for simple day number pattern (e.g., "every 26" or "every 26th")
  const simpleDayMatch = patternWithoutTime.match(/^every\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?$/);
  if (simpleDayMatch?.[1]) {
    const dayOfMonth = parseInt(simpleDayMatch[1], 10);
    if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error('Invalid day of month');
    }
    const result: MonthlyRecurrencePattern = {
      type: RecurrenceTypes.MONTHLY,
      interval: 1,
      daysOfMonth: [dayOfMonth]
    };
    if (timeOfDay) {
      result.timeOfDay = timeOfDay;
    }
    return result;
  }

  // Handle "last day" patterns
  if (/^every\s+last\s+day(?:\s+of\s+the\s+month)?$/.test(patternWithoutTime)) {
    const result: MonthlyRecurrencePattern = {
      type: RecurrenceTypes.MONTHLY,
      interval: 1,
      daysOfMonth: [-1],
      lastDayOfMonth: true
    };
    if (timeOfDay) {
      result.timeOfDay = timeOfDay;
    }
    return result;
  }

  // Handle interval patterns (e.g., "every 3 months")
  const intervalMatch = patternWithoutTime.match(/^every\s+(\d+)\s+months?(?:\s+on\s+(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)|last\s+day))?$/);
  if (intervalMatch?.[1]) {
    const interval = parseInt(intervalMatch[1], 10);
    if (isNaN(interval) || interval < 1) {
      throw new Error('Invalid month interval');
    }

    // If no day specified, default to first day of month
    if (!intervalMatch[2]) {
      const result: MonthlyRecurrencePattern = {
        type: RecurrenceTypes.MONTHLY,
        interval,
        daysOfMonth: [1]
      };
      if (timeOfDay) {
        result.timeOfDay = timeOfDay;
      }
      return result;
    }

    // Handle "last day" specification
    if (intervalMatch[2]?.toLowerCase() === 'last') {
      const result: MonthlyRecurrencePattern = {
        type: RecurrenceTypes.MONTHLY,
        interval,
        daysOfMonth: [-1],
        lastDayOfMonth: true
      };
      if (timeOfDay) {
        result.timeOfDay = timeOfDay;
      }
      return result;
    }

    // Handle specific day
    const dayOfMonth = parseInt(intervalMatch[2], 10);
    if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error('Invalid day of month');
    }
    const result: MonthlyRecurrencePattern = {
      type: RecurrenceTypes.MONTHLY,
      interval,
      daysOfMonth: [dayOfMonth]
    };
    if (timeOfDay) {
      result.timeOfDay = timeOfDay;
    }
    return result;
  }

  // Handle "every other month" pattern
  if (patternWithoutTime === 'every other month') {
    const result: MonthlyRecurrencePattern = {
      type: RecurrenceTypes.MONTHLY,
      interval: 2,
      daysOfMonth: [1]
    };
    if (timeOfDay) {
      result.timeOfDay = timeOfDay;
    }
    return result;
  }

  // Handle simple "every month" pattern
  if (patternWithoutTime === 'every month') {
    const result: MonthlyRecurrencePattern = {
      type: RecurrenceTypes.MONTHLY,
      interval: 1,
      daysOfMonth: [1]
    };
    if (timeOfDay) {
      result.timeOfDay = timeOfDay;
    }
    return result;
  }

  throw new Error(`Unsupported pattern format: ${pattern}`);
}
