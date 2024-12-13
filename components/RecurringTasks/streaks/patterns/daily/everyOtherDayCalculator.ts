import { StreakResult, DailyRecurrencePattern, DateRange } from '../../types';
import { isValidCompletionWithTimeConstraint } from '../../helpers/validation';
import { startOfDay, addDays, endOfDay } from 'date-fns';

export function calculateEveryOtherDayStreak(
  pattern: DailyRecurrencePattern,
  completions: Date[],
  range: DateRange
): StreakResult {
  // Sort completions from newest to oldest
  const sortedCompletions = [...completions].sort((a, b) => b.getTime() - a.getTime());

  // Generate target dates (every other day) from range.end to range.start
  const targets: { date: Date, allowedRange: DateRange }[] = [];
  let currentDate = startOfDay(range.end);
  const rangeStart = startOfDay(range.start);

  // If we have completions, use the most recent one to align the schedule
  if (sortedCompletions.length > 0) {
    // We know the element exists since we checked length > 0
    const lastCompletion = startOfDay(sortedCompletions[0]!);
    currentDate = startOfDay(range.end);
    
    // Align the schedule with the last completion
    const daysSinceCompletion = Math.floor((currentDate.getTime() - lastCompletion.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSinceCompletion % 2 !== 0) {
      currentDate = addDays(currentDate, -1);
    }
  }

  // Generate target dates
  while (currentDate >= rangeStart) {
    const allowedRange = pattern.timeOfDay ? {
      start: new Date(currentDate),
      end: new Date(currentDate)
    } : {
      start: startOfDay(currentDate),
      end: endOfDay(currentDate)
    };

    if (pattern.timeOfDay) {
      allowedRange.start.setHours(pattern.timeOfDay.hours || 0, pattern.timeOfDay.minutes || 0);
      allowedRange.end.setHours(pattern.timeOfDay.hours || 0, pattern.timeOfDay.minutes || 0);
      // Allow 30 minutes before and after the target time
      allowedRange.start = new Date(allowedRange.start.getTime() - 30 * 60 * 1000);
      allowedRange.end = new Date(allowedRange.end.getTime() + 30 * 60 * 1000);
    }

    targets.push({
      date: currentDate,
      allowedRange
    });
    currentDate = addDays(currentDate, -2); // Move back 2 days
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Calculate streaks by checking each target date
  for (const target of targets) {
    const isCompleted = sortedCompletions.some(completion =>
      isValidCompletionWithTimeConstraint(target.date, completion, target.allowedRange)
    );

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // Special handling for today's target
      if (target === targets[0]) {
        // If today is a target day but not yet completed, keep the streak alive
        if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  // Calculate the next due date
  const nextDue = targets[0]?.date || null;
  const overdue = nextDue ? new Date() > nextDue : false;

  return { currentStreak, longestStreak, nextDue, overdue };
}
