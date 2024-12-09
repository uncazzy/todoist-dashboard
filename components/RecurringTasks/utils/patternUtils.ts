import { format, subMonths, subDays, isAfter, isEqual, isBefore, addDays } from 'date-fns';

interface PatternInfo {
  pattern: string;
  interval: number;
  targetDates: Date[];
}

export function detectPattern(dueString: string, today: Date, sixMonthsAgo: Date, latestCompletion: Date | undefined, recentCompletions: Date[]): PatternInfo {
  const lower = dueString.toLowerCase();
  let pattern = '';
  let interval = 1;
  let targetDates: Date[] = [];

  if (lower.includes('every day') || lower.includes('daily')) {
    pattern = 'daily';
    let date = today;
    while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
      targetDates.push(date);
      date = subDays(date, 1);
    }
  } else if (lower === 'every other day') {
    pattern = 'every-other-day';
    interval = 2;
    
    // For "every other day", generate target dates independently of completions
    if (recentCompletions.length > 0) {
      // Start from the first completion
      const firstCompletion = recentCompletions[recentCompletions.length - 1]; // Earliest completion
      if (firstCompletion) {
        let currentDate = new Date(firstCompletion);
        
        // Generate all target dates from first completion to today
        while (isBefore(currentDate, today) || isEqual(currentDate, today)) {
          targetDates.push(new Date(currentDate));
          currentDate = addDays(currentDate, interval);
        }
      }
    } else {
      // If no completions, start from today and work backwards
      let currentDate = today;
      while (isBefore(sixMonthsAgo, currentDate) || isEqual(sixMonthsAgo, currentDate)) {
        targetDates.push(new Date(currentDate));
        currentDate = subDays(currentDate, interval);
      }
    }
    
    // Sort target dates from newest to oldest to match other patterns
    targetDates.sort((a, b) => b.getTime() - a.getTime());
  } else if (lower.includes('every other')) {
    pattern = 'biweekly';
    interval = 14;
    generateWeeklyDates(lower, today, sixMonthsAgo, interval, latestCompletion, targetDates);
  } else if (lower.match(/every (\d+) months?/)) {
    const monthMatch = lower.match(/every (\d+) months?/);
    if (monthMatch) {
      pattern = 'months';
      interval = parseInt(monthMatch[1] || '1');
      generateMonthlyDates(lower, today, sixMonthsAgo, interval, latestCompletion, targetDates);
    }
  } else if (lower === 'every last day') {
    pattern = 'monthly-last';
    generateLastDayDates(today, sixMonthsAgo, latestCompletion, targetDates);
  } else if (/every \d+(?:st|nd|rd|th)?(?:\s|$)/.test(lower) || (lower.includes('every') && lower.includes('month'))) {
    pattern = 'monthly';
    generateMonthlyDates(lower, today, sixMonthsAgo, interval, latestCompletion, targetDates);
  } else if (lower.includes('every')) {
    pattern = 'weekly';
    interval = 7;
    generateWeeklyDates(lower, today, sixMonthsAgo, interval, latestCompletion, targetDates);
  }

  return { pattern, interval, targetDates };
}

function generateWeeklyDates(lower: string, today: Date, sixMonthsAgo: Date, interval: number, latestCompletion: Date | undefined, targetDates: Date[]) {
  const weekdayMatch = lower.match(/every( other)? (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
  
  if (weekdayMatch) {
    const dayMap: { [key: string]: string } = {
      sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
      thu: 'thursday', fri: 'friday', sat: 'saturday'
    };
    const targetDay = weekdayMatch[2] ? (dayMap[weekdayMatch[2].toLowerCase()] || weekdayMatch[2].toLowerCase()) : 'monday';
    
    // Start from the most recent completion or today
    let date = latestCompletion || today;
    
    // If using latestCompletion, move forward one interval to get next target
    if (latestCompletion) {
      date = addDays(latestCompletion, interval);
    }
    
    // Align to the target weekday
    while (format(date, 'EEEE').toLowerCase() !== targetDay) {
      date = subDays(date, 1);
    }

    // For "every other" patterns, ensure we're on the correct alternating week
    if (lower.includes('every other') && latestCompletion) {
      // Find the next target date after the last completion
      let checkDate = latestCompletion;
      while (format(checkDate, 'EEEE').toLowerCase() !== targetDay) {
        checkDate = subDays(checkDate, 1);
      }
      
      // If we're not on the right schedule, adjust back one more interval
      const diffInDays = Math.abs(date.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diffInDays) % interval !== 0) {
        date = subDays(date, interval);
      }
    }

    // Generate target dates
    while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
      if (!isAfter(date, today)) {
        targetDates.push(new Date(date));
      }
      date = subDays(date, interval);
    }
  }
}

function generateMonthlyDates(lower: string, today: Date, sixMonthsAgo: Date, interval: number, latestCompletion: Date | undefined, targetDates: Date[]) {
  const monthlyMatch = lower.match(/every( \d+)? months? on the (\d+)(?:st|nd|rd|th)?/i);
  const specificDateMatch = lower.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
  const monthIntervalMatch = lower.match(/every (\d+) months?/i);
  
  if (monthIntervalMatch) {
    // For "every X months" pattern, generate dates based on latest completion
    const monthInterval = parseInt(monthIntervalMatch[1] || '1');
    let date;
    
    if (latestCompletion) {
      // Start from the latest completion and add interval months for next target
      date = new Date(latestCompletion);
      date.setMonth(date.getMonth() + monthInterval);
      
      // Only add future target dates until today
      while (!isAfter(date, today)) {
        targetDates.push(new Date(date));
        date = new Date(date);
        date.setMonth(date.getMonth() + monthInterval);
      }
      
      // Also add the latest completion as a target date
      targetDates.push(new Date(latestCompletion));
    } else {
      // If no completions, start from today and work backwards
      date = today;
      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        targetDates.push(new Date(date));
        date = subMonths(date, monthInterval);
      }
    }
  } else if (monthlyMatch || specificDateMatch) {
    const targetDay = monthlyMatch ? 
      parseInt(monthlyMatch[2] ?? '1') : 
      parseInt(specificDateMatch![1] ?? '1');
    
    let date = new Date(today.getFullYear(), today.getMonth(), targetDay);
    
    // Only include current month's target if we've passed the target day
    const currentDay = parseInt(format(today, 'd'));
    const includeCurrentMonth = currentDay >= targetDay;
    
    if (includeCurrentMonth && !isAfter(date, today)) {
      targetDates.push(new Date(date));
    }
    
    // Add previous months' target dates
    date = subMonths(date, 1); // Start from previous month
    while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
      if (!isAfter(date, today)) {
        targetDates.push(new Date(date));
      }
      date = subMonths(date, 1);
    }
  } else {
    // For "every month" without a specific day
    let date = today;
    while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
      targetDates.push(new Date(date));
      date = subMonths(date, interval);
    }
  }
  
  // Sort target dates from newest to oldest
  targetDates.sort((a, b) => b.getTime() - a.getTime());
}

function generateLastDayDates(today: Date, sixMonthsAgo: Date, latestCompletion: Date | undefined, targetDates: Date[]) {
  // Start from the latest completion month or today, whichever is earlier
  const startDate = latestCompletion || today;
  let date = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Last day of current month
  
  // If today is past the last day of current month, start from last month
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  if (parseInt(format(today, 'd')) > parseInt(format(lastDayOfMonth, 'd'))) {
    date = new Date(today.getFullYear(), today.getMonth(), 0);
  }
  
  // Generate target dates for the last 5 months (not including current month)
  for (let i = 0; i < 5; i++) {
    if (!isAfter(date, today) && (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date))) {
      targetDates.push(date);
    }
    // Move to last day of previous month
    date = new Date(date.getFullYear(), date.getMonth(), 0);
  }
  
  // Sort target dates from newest to oldest
  targetDates.sort((a, b) => b.getTime() - a.getTime());
}
