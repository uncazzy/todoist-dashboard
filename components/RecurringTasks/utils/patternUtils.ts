import { subMonths, isAfter, subDays, isBefore } from 'date-fns';
import { PatternContext, PatternInfo } from './types';
import { detectDailyPattern } from '../streaks/patterns/daily/dailyPatterns';
import { detectWeeklyPattern } from '../streaks/patterns/weekly/weeklyPatterns';
import { detectMonthlyPattern } from '../streaks/patterns/monthly/monthlyPatterns';

/**
 * detectPattern attempts to figure out the recurrence pattern from the dueString.
 * It returns a standardized pattern string, an interval (in days or months), and
 * a set of targetDates (descending order) representing when the task was expected.
 */
export function detectPattern(
  dueString: string,
  today: Date,
  sixMonthsAgo: Date,
  latestCompletion: Date | undefined,
  recentCompletions: Date[]
): PatternInfo {
  const context: PatternContext = {
    today,
    sixMonthsAgo,
    ...(latestCompletion && { latestCompletion }),
    recentCompletions
  };

  const lower = dueString.toLowerCase();

  // Check for workday pattern first
  if (lower === 'every workday' || lower === 'every work day') {
    const targetDates: Date[] = [];
    let date = today;
    while (!isBefore(date, sixMonthsAgo)) {
      const dayOfWeek = date.getDay();
      // Only include Monday (1) through Friday (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        targetDates.push(new Date(date));
      }
      date = subDays(date, 1);
    }
    // Sort dates from oldest to newest
    targetDates.sort((a, b) => a.getTime() - b.getTime());
    return { pattern: 'weekday', interval: 1, targetDates };
  }

  // Try each pattern detector in sequence, maintaining original order:
  // daily -> biweekly -> months -> yearly -> monthly-strict -> monthly-last -> weekly

  // Daily patterns
  const dailyPattern = detectDailyPattern(dueString, context);
  if (dailyPattern) return dailyPattern;

  // Biweekly patterns (part of weekly detector)
  if (lower === 'every other') {
    const weeklyPattern = detectWeeklyPattern(dueString, context);
    if (weeklyPattern) return weeklyPattern;
  }

  // Monthly patterns with specific intervals
  if (lower.match(/every (\d+) months?/)) {
    const monthlyPattern = detectMonthlyPattern(dueString, context);
    if (monthlyPattern) return monthlyPattern;
  }

  // Yearly patterns
  if (lower === 'every year' || lower.match(/every \d+ years?/)) {
    const yearMatch = lower.match(/every (\d+) years?/);
    const interval = yearMatch?.[1] ? parseInt(yearMatch[1], 10) : 1;
    
    const targetDates: Date[] = [];
    let date = today;
    while (!isAfter(sixMonthsAgo, date)) {
      targetDates.push(new Date(date));
      date = subMonths(date, 12); // Move back one year
    }

    // Sort dates from oldest to newest
    targetDates.sort((a, b) => a.getTime() - b.getTime());

    return { pattern: 'yearly', interval, targetDates };
  }

  // Monthly patterns (strict and last)
  const monthlyPattern = detectMonthlyPattern(dueString, context);
  if (monthlyPattern) return monthlyPattern;

  // Weekly patterns (catch-all for "every" patterns)
  if (lower.includes('every')) {
    const weeklyPattern = detectWeeklyPattern(dueString, context);
    if (weeklyPattern) return weeklyPattern;
  }

  // Default pattern if nothing matches
  return { pattern: '', interval: 1, targetDates: [] };
}