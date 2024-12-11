import { startOfDay, endOfDay } from 'date-fns';
import { StreakResult, WeeklyRecurrencePattern, DateRange, RecurrenceTypes, WeekDay } from '../types';
import { WEEKDAYS } from '../helpers/constants';
import { isWeeklyPattern } from './patternMatchers';

interface WeeklyTarget {
  date: Date;
  allowedRange: DateRange;
  weekday: WeekDay;
}

// Add weekday name mapping
const WEEKDAY_NAMES: Record<string, string> = {
  'sun': 'SUNDAY',
  'sunday': 'SUNDAY',
  'mon': 'MONDAY',
  'monday': 'MONDAY',
  'tue': 'TUESDAY',
  'tues': 'TUESDAY',
  'tuesday': 'TUESDAY',
  'wed': 'WEDNESDAY',
  'wednesday': 'WEDNESDAY',
  'thu': 'THURSDAY',
  'thur': 'THURSDAY',
  'thurs': 'THURSDAY',
  'thursday': 'THURSDAY',
  'fri': 'FRIDAY',
  'friday': 'FRIDAY',
  'sat': 'SATURDAY',
  'saturday': 'SATURDAY'
};

export function calculateWeeklyStreak(
  pattern: WeeklyRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.WEEKLY) {
    throw new Error('Invalid pattern type for weekly streak calculation');
  }

  // Generate target dates based on pattern
  const targetDates = generateWeeklyTargets(pattern, range);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest
  const sortedCompletions = [...completions]
    .map(date => startOfDay(date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const now = startOfDay(new Date());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Process targets from newest to oldest
  for (const target of targetDates) {
    const targetDay = startOfDay(target.date);
    
    // Skip future targets
    if (targetDay > now) {
      continue;
    }

    // Check if this target was completed
    const isCompleted = sortedCompletions.some(completion => 
      completion.getTime() === targetDay.getTime()
    );

    if (isCompleted) {
      tempStreak++;
      if (activeStreak) {
        currentStreak = tempStreak;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      // For the most recent target, don't break streak if we're still within the day
      if (targetDay.getTime() === now.getTime()) {
        if (tempStreak > 0) {
          currentStreak = tempStreak;
          longestStreak = Math.max(longestStreak, tempStreak);
        }
      } else {
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  return { currentStreak, longestStreak };
}

function generateWeeklyTargets(pattern: WeeklyRecurrencePattern, range: DateRange): WeeklyTarget[] {
  const targets: WeeklyTarget[] = [];
  const interval = pattern.interval || 1;
  const weekdays = pattern.weekdays;
  let currentDate = startOfDay(range.end);
  const rangeStart = startOfDay(range.start);

  // For bi-weekly patterns, we need to find a reference point
  // This will be the most recent occurrence of the pattern
  let referenceDate = new Date(currentDate);
  while (referenceDate.getDay() !== weekdays[0]) {
    referenceDate.setDate(referenceDate.getDate() - 1);
  }

  while (currentDate >= rangeStart) {
    // For bi-weekly patterns, check if this week is in sequence
    const weekDiff = Math.floor((referenceDate.getTime() - currentDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const isTargetWeek = weekDiff % interval === 0;

    if (isTargetWeek) {
      for (const weekday of weekdays) {
        const targetDate = new Date(currentDate);
        // Adjust to the target weekday
        const diff = weekday - targetDate.getDay();
        targetDate.setDate(targetDate.getDate() + diff);
        
        // Skip if target date falls outside our range
        if (targetDate > range.end || targetDate < rangeStart) {
          continue;
        }

        targets.push({
          date: targetDate,
          allowedRange: {
            start: startOfDay(targetDate),
            end: endOfDay(targetDate)
          },
          weekday
        });
      }
    }
    
    // Move to previous week
    currentDate.setDate(currentDate.getDate() - 7);
  }

  // Sort targets by date descending (newest first)
  return targets.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function parseWeeklyPattern(pattern: string): WeeklyRecurrencePattern {
  if (!isWeeklyPattern(pattern)) {
    throw new Error('Invalid weekly pattern format');
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  const weekdays: WeekDay[] = [];

  // Handle bi-weekly patterns (e.g., "every other monday")
  const biWeeklyRegex = /every\s+other\s+(\w+)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i;
  const biWeeklyMatch = normalizedPattern.match(biWeeklyRegex);

  if (biWeeklyMatch && biWeeklyMatch.length >= 2 && biWeeklyMatch[1]) {
    const weekdayName = biWeeklyMatch[1].toLowerCase();
    const weekdayKey = Object.keys(WEEKDAYS).find(key => 
      key.toLowerCase() === weekdayName || 
      WEEKDAY_NAMES[weekdayName] === key
    );

    if (!weekdayKey || !(weekdayKey in WEEKDAYS)) {
      throw new Error(`Invalid weekday: ${weekdayName}`);
    }

    const weekday = WEEKDAYS[weekdayKey];
    if (weekday === undefined) {
      throw new Error(`Could not map weekday: ${weekdayKey}`);
    }

    weekdays.push(weekday);

    return {
      type: RecurrenceTypes.WEEKLY,
      interval: 2,
      weekdays
    };
  }

  // Handle regular weekly patterns
  const weekdayRegex = /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/gi;
  const weekdayMatches = normalizedPattern.match(weekdayRegex);

  if (weekdayMatches && weekdayMatches.length > 0) {
    for (const match of weekdayMatches) {
      const weekdayName = match.toLowerCase();
      const weekdayKey = Object.keys(WEEKDAYS).find(key => 
        key.toLowerCase() === weekdayName || 
        WEEKDAY_NAMES[weekdayName] === key
      );

      if (!weekdayKey || !(weekdayKey in WEEKDAYS)) {
        throw new Error(`Invalid weekday: ${weekdayName}`);
      }

      const weekday = WEEKDAYS[weekdayKey];
      if (weekday === undefined) {
        throw new Error(`Could not map weekday: ${weekdayKey}`);
      }

      if (!weekdays.includes(weekday)) {
        weekdays.push(weekday);
      }
    }

    // Check for interval pattern (e.g., "every 2 weeks")
    const intervalMatch = normalizedPattern.match(/every\s+(\d+)\s+weeks?/i);
    const interval = intervalMatch && intervalMatch[1] ? parseInt(intervalMatch[1], 10) : 1;

    return {
      type: RecurrenceTypes.WEEKLY,
      interval,
      weekdays
    };
  }

  throw new Error('Could not parse weekly pattern');
}
