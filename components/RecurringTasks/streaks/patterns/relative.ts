import { addDays, startOfDay, endOfDay } from 'date-fns';
import { StreakResult, RelativeRecurrencePattern, DateRange, RecurrenceTypes } from '../types';
import { isValidRelativeCompletion } from '../helpers/validation';

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
    return { 
      currentStreak: 0, 
      longestStreak: 0,
      nextDue: null,
      overdue: false
    };
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  // Generate target dates based on pattern
  const targetDates = generateRelativeTargets(pattern, sortedCompletions, range);
  if (!targetDates.length) {
    return { 
      currentStreak: 0, 
      longestStreak: 0,
      nextDue: null,
      overdue: false
    };
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
      const isWithinRange = isValidRelativeCompletion(
        completion,
        target.allowedRange
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

  return { 
    currentStreak, 
    longestStreak,
    nextDue: null,
    overdue: false
  };
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

export function parseRelativePattern(pattern: string): RelativeRecurrencePattern | null {
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  const normalizedPattern = pattern.trim().toLowerCase();

  // Match "after X days" pattern
  const afterPattern = /^after\s+(\d+)\s+days?$/i;
  const matches = normalizedPattern.match(afterPattern);

  if (!matches || !matches[1]) {
    return null;
  }

  const daysFromCompletion = parseInt(matches[1], 10);
  if (isNaN(daysFromCompletion) || daysFromCompletion <= 0) {
    return null;
  }

  return {
    type: RecurrenceTypes.RELATIVE,
    daysFromCompletion,
    pattern: pattern,
    originalPattern: pattern
  };
}
