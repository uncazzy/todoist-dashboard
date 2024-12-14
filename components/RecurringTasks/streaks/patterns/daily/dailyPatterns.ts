import { isBefore, subDays } from 'date-fns';
import { PatternInfo, PatternContext } from '../../../utils/types';

export function detectDailyPattern(
  dueString: string,
  context: PatternContext
): PatternInfo | null {
  const lower = dueString.toLowerCase();
  
  if (!lower.includes('every day') && !lower.includes('daily') && 
      !(/every \d+ days?/.test(lower)) && lower !== 'every other day') {
    return null;
  }

  let interval = 1; // Default interval
  
  // Extract interval from "every X days" pattern or handle "every other day"
  if (lower === 'every other day') {
    interval = 2;
  } else {
    const intervalMatch = lower.match(/every (\d+) days?/);
    interval = intervalMatch?.[1] ? parseInt(intervalMatch[1], 10) : 1;
  }
  
  const targetDates: Date[] = [];
  let date = context.today;
  while (isBefore(date, context.sixMonthsAgo) === false) {
    targetDates.push(new Date(date)); // Clone the date
    date = subDays(date, interval);
  }

  // Sort dates from oldest to newest
  targetDates.sort((a, b) => a.getTime() - b.getTime());

  return {
    pattern: 'daily',
    interval,
    targetDates
  };
}
