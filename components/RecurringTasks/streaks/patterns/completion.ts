import { startOfDay, endOfDay, addDays } from 'date-fns';
import { StreakResult, CompletionRecurrencePattern, DateRange, RecurrenceTypes } from '../types';

interface CompletionTarget {
  date: Date;
  allowedRange: DateRange;
  completionsRequired: number;
  completionsAchieved: number;
}

export function calculateCompletionStreak(
  pattern: CompletionRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  if (pattern.type !== RecurrenceTypes.COMPLETION) {
    throw new Error('Invalid pattern type for completion streak calculation');
  }

  // Sort completions from newest to oldest for optimal performance
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  // Generate target dates based on pattern
  const targetDates = generateCompletionTargets(pattern, range, sortedCompletions);
  if (!targetDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target period
  for (const target of targetDates) {
    const isCompleted = target.completionsAchieved >= target.completionsRequired;

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // Special handling for current period's target
      if (target === targetDates[0]) {
        const now = new Date();
        // If we're still within the current period and have a chance to complete it
        if (target.allowedRange.end.getTime() > now.getTime() &&
            target.completionsAchieved > 0) {
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

function generateCompletionTargets(
  pattern: CompletionRecurrencePattern,
  range: DateRange,
  completions: Date[]
): CompletionTarget[] {
  const targets: CompletionTarget[] = [];
  const { completionsRequired, periodDays } = pattern;
  let currentDate = startOfDay(range.end);
  const rangeStart = startOfDay(range.start);

  while (currentDate >= rangeStart) {
    const periodStart = startOfDay(currentDate);
    const periodEnd = endOfDay(addDays(currentDate, periodDays - 1));

    // Skip if period falls outside our range
    if (periodEnd >= rangeStart) {
      // Count completions within this period
      const completionsInRange = completions.filter(completion =>
        completion >= periodStart && completion <= periodEnd
      ).length;

      targets.push({
        date: currentDate,
        allowedRange: {
          start: periodStart,
          end: periodEnd
        },
        completionsRequired,
        completionsAchieved: completionsInRange
      });
    }

    // Move to next period
    currentDate = addDays(currentDate, -periodDays);
  }

  // Sort targets by date descending (newest first)
  return targets.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function isCompletionPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Match patterns like "2 times per 3 days" or "1 time every 7 days"
  const completionRegex = /^(\d+)\s+times?\s+(?:per|every)\s+(\d+)\s+days?$/;
  return completionRegex.test(normalizedPattern);
}

export function parseCompletionPattern(pattern: string): CompletionRecurrencePattern {
  const normalizedPattern = pattern.trim().toLowerCase();

  // Match patterns like "X times in Y days"
  const matches = normalizedPattern.match(/(\d+)\s+times?\s+(?:in|every)\s+(\d+)\s+days?/i);

  if (!matches || matches.length < 3 || !matches[1] || !matches[2]) {
    throw new Error('Invalid completion pattern format. Expected format: "X times in Y days"');
  }

  const completionsRequired = parseInt(matches[1], 10);
  const periodDays = parseInt(matches[2], 10);

  if (isNaN(completionsRequired) || isNaN(periodDays)) {
    throw new Error('Invalid numbers in completion pattern');
  }

  if (completionsRequired <= 0 || periodDays <= 0) {
    throw new Error('Numbers in completion pattern must be positive');
  }

  if (completionsRequired > periodDays) {
    throw new Error('Cannot require more completions than days in the period');
  }

  return {
    type: RecurrenceTypes.COMPLETION,
    completionsRequired,
    periodDays
  };
}
