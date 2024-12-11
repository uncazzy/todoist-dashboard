import { addDays, startOfDay, endOfDay } from 'date-fns';
import { StreakResult, RelativeRecurrencePattern, DateRange, RecurrenceTypes } from '../types';
import { isValidCompletion } from '../helpers/validation';
import { isRelativePattern } from './patternMatchers';

interface RelativeTarget {
  date: Date;
  allowedRange: DateRange;
  baseCompletion: Date;
  daysFromCompletion: number;
}

export function calculateRelativeStreak(
  pattern: RelativeRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.RELATIVE) {
    throw new Error('Invalid pattern type for relative streak calculation');
  }

  if (!completions.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  // Generate target dates based on pattern
  const targetDates = generateRelativeTargets(pattern, sortedCompletions, range);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target
  for (const target of targetDates) {
    // For relative patterns, we need to check if the completion is after the base completion
    // and within the allowed range from the target date
    const isCompleted = sortedCompletions.some(completion => {
      const isAfterBase = completion.getTime() > target.baseCompletion.getTime();
      const isWithinRange = isValidCompletion(
        target.date,
        completion,
        target.allowedRange,
        pattern.timeOfDay
      );
      return isAfterBase && isWithinRange;
    });

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // Special handling for current target
      if (target === targetDates[0]) {
        const now = new Date();
        // If we haven't reached the target date yet, keep the streak alive
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

  return { currentStreak, longestStreak };
}

function generateRelativeTargets(
  pattern: RelativeRecurrencePattern,
  completions: Date[],
  range: DateRange
): RelativeTarget[] {
  const targets: RelativeTarget[] = [];
  const { daysFromCompletion } = pattern;
  const rangeStart = startOfDay(range.start);
  const now = new Date();

  // Generate targets based on completion dates
  for (const completion of completions) {
    const targetDate = addDays(completion, daysFromCompletion);
    
    // Skip if target date falls outside our range or is in the future
    if (targetDate <= range.end && targetDate >= rangeStart && targetDate <= now) {
      targets.push({
        date: targetDate,
        allowedRange: calculateAllowedRange(targetDate, pattern),
        baseCompletion: completion,
        daysFromCompletion
      });
    }
  }

  // Sort targets by date descending (newest first)
  return targets.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function calculateAllowedRange(date: Date, pattern: RelativeRecurrencePattern): DateRange {
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

export function parseRelativePattern(patternStr: string): RelativeRecurrencePattern {
  if (!isRelativePattern(patternStr)) {
    throw new Error('Invalid relative pattern format');
  }

  const normalizedPattern = patternStr.trim().toLowerCase();

  // Handle "every other day" pattern
  const everyOtherRegex = /^every\s+other\s+day(?:\s+at\s+(\d{1,2}):(\d{2}))?$/;
  const everyOtherMatches = normalizedPattern.match(everyOtherRegex);
  if (everyOtherMatches) {
    const result: RelativeRecurrencePattern = {
      type: RecurrenceTypes.RELATIVE,
      daysFromCompletion: 2 // "every other day" means 2 days between completions
    };

    // Handle optional time specification
    if (everyOtherMatches[1] && everyOtherMatches[2]) {
      const hours = parseInt(everyOtherMatches[1], 10);
      const minutes = parseInt(everyOtherMatches[2], 10);
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        result.timeOfDay = { hours, minutes };
      } else {
        throw new Error('Invalid time format');
      }
    }

    return result;
  }

  // Handle "after X days" pattern
  const relativeRegex = /^after\s+(\d+)\s+days?(?:\s+at\s+(\d{1,2}):(\d{2}))?$/;
  const matches = normalizedPattern.match(relativeRegex);

  if (!matches || !matches[1]) {
    throw new Error('Invalid relative pattern format');
  }

  const daysFromCompletion = parseInt(matches[1], 10);
  if (daysFromCompletion < 1) {
    throw new Error('Days must be a positive number');
  }

  const result: RelativeRecurrencePattern = {
    type: RecurrenceTypes.RELATIVE,
    daysFromCompletion
  };

  // Handle optional time specification
  if (matches[2] && matches[3]) {
    const hours = parseInt(matches[2], 10);
    const minutes = parseInt(matches[3], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      result.timeOfDay = { hours, minutes };
    } else {
      throw new Error('Invalid time format');
    }
  }

  return result;
}
