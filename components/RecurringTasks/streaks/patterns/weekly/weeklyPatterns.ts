import { format, isAfter, isBefore, isEqual, subDays, addDays } from 'date-fns';
import { PatternInfo, PatternContext } from '../../../utils/types';

export function detectWeeklyPattern(
  dueString: string,
  context: PatternContext
): PatternInfo | null {
  const lower = dueString.toLowerCase();
  
  // Handle biweekly patterns
  if (lower === 'every other') {
    return handleBiweeklyPattern(lower, context);
  }
  
  // Handle regular weekly patterns
  if (!lower.includes('every')) {
    return null;
  }

  const targetDates: Date[] = [];
  generateWeeklyDates(lower, context.today, context.sixMonthsAgo, targetDates);

  return {
    pattern: 'weekly',
    interval: 7,
    targetDates
  };
}

function handleBiweeklyPattern(
  lower: string,
  context: PatternContext
): PatternInfo {
  const targetDates: Date[] = [];
  const weekdayMatch = lower.match(/every other (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
  
  if (weekdayMatch && weekdayMatch[1] && context.recentCompletions.length > 0) {
    // Sort completions ascending and find first one in our window
    const firstCompletion = context.recentCompletions
      .filter(c => !isBefore(c, context.sixMonthsAgo) && !isAfter(c, context.today))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    if (firstCompletion) {
      let date = new Date(firstCompletion);
      // Generate forward
      while (date <= context.today) {
        targetDates.push(new Date(date));
        date = addDays(date, 14);
      }
      // Generate backward
      date = new Date(firstCompletion);
      while (date >= context.sixMonthsAgo) {
        targetDates.push(new Date(date));
        date = subDays(date, 14);
      }
      // Sort dates from oldest to newest (ascending)
      targetDates.sort((a, b) => a.getTime() - b.getTime());
    }
  }
  
  if (targetDates.length === 0) {
    generateWeeklyDates(lower, context.today, context.sixMonthsAgo, targetDates);
  }

  return {
    pattern: 'biweekly',
    interval: 14,
    targetDates
  };
}

function generateWeeklyDates(
  lower: string,
  today: Date,
  sixMonthsAgo: Date,
  targetDates: Date[]
) {
  const weekdayMatch = lower.match(/every( other)? (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);

  if (weekdayMatch) {
    const dayMap: { [key: string]: string } = {
      sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
      thu: 'thursday', fri: 'friday', sat: 'saturday'
    };
    const targetDay = weekdayMatch[2] ? (dayMap[weekdayMatch[2].toLowerCase()] || weekdayMatch[2].toLowerCase()) : 'monday';

    // Start from today and work backwards day by day
    let date = new Date(today);
    
    while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
      // Only add dates that match our target weekday
      if (format(date, 'EEEE').toLowerCase() === targetDay) {
        if (!isAfter(date, today)) {
          targetDates.push(new Date(date));
        }
      }
      date = subDays(date, 1);
    }

    // Sort dates from oldest to newest
    targetDates.sort((a, b) => a.getTime() - b.getTime());
  }
}
