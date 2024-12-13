import { startOfDay, endOfDay, addYears } from 'date-fns';
import { StreakResult, HolidayRecurrencePattern, DateRange, RecurrenceTypes, TimePeriod } from '../types';
import { isValidHoliday, isValidHolidayCompletion } from '../helpers/validation';
import { TIME_PERIODS, HOLIDAY_MAP } from '../helpers/constants';

interface HolidayTarget {
  date: Date;
  allowedRange: DateRange;
  holidayName: string;
}

export function calculateHolidayStreak(
  pattern: HolidayRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.HOLIDAY) {
    throw new Error('Invalid pattern type for holiday streak calculation');
  }

  // Generate target dates based on pattern
  const targetDates = generateHolidayTargets(pattern, range);
  if (!targetDates.length) {
    return { 
      currentStreak: 0, 
      longestStreak: 0,
      nextDue: null,
      overdue: false
    };
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target holiday
  for (const target of targetDates) {
    const isCompleted = sortedCompletions.some(completion =>
      isValidHolidayCompletion(completion, target.allowedRange)
    );

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // Special handling for current holiday's target
      if (target === targetDates[0]) {
        const now = new Date();
        // If we haven't reached the holiday yet, keep the streak alive
        if (target.date.getTime() > now.getTime()) {
          currentStreak = tempStreak;
        } else if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  return { 
    currentStreak, 
    longestStreak,
    nextDue: null,
    overdue: false
  };
}

function generateHolidayTargets(pattern: HolidayRecurrencePattern, range: DateRange): HolidayTarget[] {
  const targets: HolidayTarget[] = [];
  const holidayName = pattern.holidayName.toLowerCase();
  
  const holiday = HOLIDAY_MAP[holidayName];
  if (!holiday) {
    throw new Error(`Unsupported holiday: ${pattern.holidayName}`);
  }

  let currentDate = new Date(range.end.getFullYear(), holiday.month, holiday.day);
  const rangeStart = startOfDay(range.start);

  while (currentDate >= rangeStart) {
    // Skip if target date falls outside our range
    if (currentDate <= range.end && currentDate >= rangeStart) {
      targets.push({
        date: currentDate,
        allowedRange: calculateAllowedRange(currentDate, pattern),
        holidayName
      });
    }

    currentDate = addYears(currentDate, -1);
  }

  // Sort targets by date descending (newest first)
  return targets.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function calculateAllowedRange(date: Date, pattern: HolidayRecurrencePattern): DateRange {
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

export function isHolidayPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return false;
  }

  // Match patterns like "every Christmas" or "every New Year's Day"
  const holidayNames = Object.keys(HOLIDAY_MAP).join('|');
  const holidayRegex = new RegExp(`^every\\s+(${holidayNames})(?:\\s+at\\s+(\\d{1,2}):(\\d{2}))?$`, 'i');
  return holidayRegex.test(normalizedPattern);
}

export function parseHolidayPattern(patternStr: string): HolidayRecurrencePattern | null {
  if (!patternStr || typeof patternStr !== 'string') {
    return null;
  }

  if (!isHolidayPattern(patternStr)) {
    return null;
  }

  const normalizedPattern = patternStr.trim().toLowerCase();
  const holidayRegex = /^every\s+([a-z\s]+)(?:\s+in\s+the\s+(morning|afternoon|evening|night))?$/;
  const matches = normalizedPattern.match(holidayRegex);

  if (!matches || !matches[1]) {
    return null;
  }

  const holidayName = matches[1].trim();
  const period = matches[2] as TimePeriod | undefined;

  if (!isValidHoliday(holidayName)) {
    return null;
  }

  const holidayDate = HOLIDAY_MAP[holidayName];
  if (!holidayDate) {
    return null;
  }

  const result: HolidayRecurrencePattern = {
    type: RecurrenceTypes.HOLIDAY,
    holidayName,
    month: holidayDate.month,
    dayOfMonth: holidayDate.day,
    pattern: patternStr,
    originalPattern: patternStr
  };

  if (period) {
    const periodRange = TIME_PERIODS[period];
    if (!periodRange) {
      return null;
    }
    result.timeOfDay = {
      ...periodRange.start,
      period
    };
  }

  return result;
}
