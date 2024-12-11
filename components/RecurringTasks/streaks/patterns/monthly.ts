import { addMonths, startOfDay, endOfDay, getDaysInMonth, setDate } from 'date-fns';
import { StreakResult, MonthlyRecurrencePattern, DateRange, RecurrenceTypes } from '../types';
import { isValidCompletion } from '../helpers/validation';
import { isMonthlyPattern } from './patternMatchers';

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

  // Generate target dates based on pattern
  const targetDates = generateMonthlyTargets(pattern, range);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target month
  for (const target of targetDates) {
    const isCompleted = sortedCompletions.some(completion =>
      isValidCompletion(target.date, completion, target.allowedRange, pattern.timeOfDay)
    );

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // Special handling for current month's target
      if (target === targetDates[0]) {
        if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  return { currentStreak, longestStreak };
}

function generateMonthlyTargets(pattern: MonthlyRecurrencePattern, range: DateRange): MonthlyTarget[] {
  const targets: MonthlyTarget[] = [];
  const interval = pattern.interval || 1;
  const dayOfMonth = pattern.dayOfMonth;
  let currentDate = startOfDay(range.end);
  const rangeStart = startOfDay(range.start);

  // Keep track of which months we've already processed
  const processedMonths = new Set<string>();

  while (currentDate >= rangeStart) {
    // Format: YYYY-MM
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!processedMonths.has(monthKey)) {
      processedMonths.add(monthKey);
      
      const daysInMonth = getDaysInMonth(currentDate);
      let targetDay = dayOfMonth;

      // Handle "last day of month" pattern
      if (pattern.lastDayOfMonth || dayOfMonth > daysInMonth) {
        targetDay = daysInMonth;
      }

      const targetDate = setDate(currentDate, targetDay);
      
      // Skip if target date falls outside our range
      if (targetDate <= range.end && targetDate >= rangeStart) {
        targets.push({
          date: targetDate,
          allowedRange: calculateAllowedRange(targetDate, pattern),
          dayOfMonth: targetDay
        });
      }
    }
    
    // Move to previous month based on interval
    const newDate = addMonths(currentDate, -interval);
    // Ensure we don't get stuck if the day doesn't exist in the new month
    if (newDate.getMonth() === currentDate.getMonth()) {
      newDate.setDate(0); // Move to last day of previous month
    }
    currentDate = newDate;
  }

  // Sort targets by date descending (newest first)
  return targets.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function calculateAllowedRange(date: Date, pattern: MonthlyRecurrencePattern): DateRange {
  const baseStart = startOfDay(date);
  const baseEnd = endOfDay(date);

  // For time-specific patterns, use a stricter range
  if (pattern.timeOfDay) {
    const { hours, minutes } = pattern.timeOfDay;
    const targetTime = new Date(date);
    targetTime.setHours(hours, minutes);
    return {
      start: new Date(targetTime.getTime() - 30 * 60 * 1000), // 30 minutes before
      end: new Date(targetTime.getTime() + 30 * 60 * 1000)    // 30 minutes after
    };
  }

  return { start: baseStart, end: baseEnd };
}

export function parseMonthlyPattern(pattern: string): MonthlyRecurrencePattern {
  if (!isMonthlyPattern(pattern)) {
    throw new Error('Invalid monthly pattern format');
  }

  const normalizedPattern = pattern.trim().toLowerCase();

  // Check for simple day number pattern (e.g., "every 26" or "every 26th")
  const simpleDayMatch = normalizedPattern.match(/^every\s+(\d+)(?:st|nd|rd|th)?$/);
  if (simpleDayMatch?.[1]) {
    const dayOfMonth = parseInt(simpleDayMatch[1], 10);
    if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error('Invalid day of month');
    }
    return {
      type: RecurrenceTypes.MONTHLY,
      interval: 1,
      dayOfMonth
    };
  }

  // Handle "last day" patterns
  if (/^every\s+last\s+day(?:\s+of\s+the\s+month)?$/.test(normalizedPattern)) {
    return {
      type: RecurrenceTypes.MONTHLY,
      interval: 1,
      dayOfMonth: -1,
      lastDayOfMonth: true
    };
  }

  // Handle interval patterns (e.g., "every 3 months")
  const intervalMatch = normalizedPattern.match(/^every\s+(\d+)\s+months?(?:\s+on\s+(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)|last\s+day))?$/);
  if (intervalMatch?.[1]) {
    const interval = parseInt(intervalMatch[1], 10);
    if (isNaN(interval) || interval < 1) {
      throw new Error('Invalid month interval');
    }

    // If no day specified, default to first day of month
    if (!intervalMatch[2]) {
      return {
        type: RecurrenceTypes.MONTHLY,
        interval,
        dayOfMonth: 1
      };
    }

    // Handle "last day" specification
    if (intervalMatch[2].toLowerCase() === 'last') {
      return {
        type: RecurrenceTypes.MONTHLY,
        interval,
        dayOfMonth: -1,
        lastDayOfMonth: true
      };
    }

    // Handle specific day
    const dayOfMonth = parseInt(intervalMatch[2], 10);
    if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error('Invalid day of month');
    }
    return {
      type: RecurrenceTypes.MONTHLY,
      interval,
      dayOfMonth
    };
  }

  // Handle simple "every month" pattern
  if (normalizedPattern === 'every month') {
    return {
      type: RecurrenceTypes.MONTHLY,
      interval: 1,
      dayOfMonth: 1
    };
  }

  throw new Error(`Invalid monthly pattern format: ${pattern}`);
}
