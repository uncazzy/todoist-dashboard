import { format, subMonths, subDays, isAfter, isEqual, isBefore, addDays } from 'date-fns';

interface PatternInfo {
  pattern: string;  // 'daily', 'every-other-day', 'weekly', 'biweekly', 'months', 'monthly', 'monthly-last'
  interval: number;
  targetDates: Date[];
}

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
  const lower = dueString.toLowerCase();
  let pattern = '';
  let interval = 1; // Default interval
  let targetDates: Date[] = [];

  // Daily
  if (lower.includes('every day') || lower.includes('daily') || /every \d+ days?/.test(lower) || lower === 'every other day') {
    pattern = 'daily';
    // Extract interval from "every X days" pattern or handle "every other day"
    if (lower === 'every other day') {
      interval = 2;
    } else {
      const intervalMatch = lower.match(/every (\d+) days?/);
      interval = intervalMatch?.[1] ? parseInt(intervalMatch[1], 10) : 1;
    }
    
    let date = today;
    while (isBefore(date, sixMonthsAgo) === false) {
      targetDates.push(date);
      date = subDays(date, interval);
    }
  }
  else if (lower === 'every other') {
    pattern = 'biweekly';
    interval = 14;
    
    const weekdayMatch = lower.match(/every other (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
    if (weekdayMatch && weekdayMatch[1] && recentCompletions.length > 0) {
      
      // Sort completions ascending and find first one in our window
      const firstCompletion = recentCompletions
        .filter(c => !isBefore(c, sixMonthsAgo) && !isAfter(c, today))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      
      if (firstCompletion) {
        let date = new Date(firstCompletion);
        // Generate forward
        while (date <= today) {
          targetDates.push(new Date(date));
          date = addDays(date, 14);
        }
        // Generate backward
        date = new Date(firstCompletion);
        while (date >= sixMonthsAgo) {
          targetDates.push(new Date(date));
          date = subDays(date, 14);
        }
        targetDates.sort((a, b) => b.getTime() - a.getTime());
      }
    }
    if (targetDates.length === 0) {
      generateWeeklyDates(lower, today, sixMonthsAgo, targetDates);
    }
  }
  else if (lower.match(/every (\d+) months?/)) {
    const monthMatch = lower.match(/every (\d+) months?/);
    if (monthMatch) {
      pattern = 'months';
      interval = parseInt(monthMatch[1] || '1', 10);
      generateMonthlyDates(lower, today, sixMonthsAgo, latestCompletion, targetDates);
    }
  }
  else if (lower === 'every year' || lower.match(/every \d+ years?/)) {
    pattern = 'yearly';
    const yearMatch = lower.match(/every (\d+) years?/);
    interval = yearMatch?.[1] ? parseInt(yearMatch[1], 10) : 1;
    
    // For yearly tasks, we'll generate one target date per year
    let date = today;
    while (!isBefore(date, sixMonthsAgo)) {
      targetDates.push(new Date(date));
      date = subMonths(date, 12); // Move back one year
    }
  }
  else if (lower === 'every month') {
    pattern = 'monthly-strict';
    interval = 1;
    
    // For "every month" pattern, detect the consistent day from completions
    const sortedCompletions = recentCompletions
      .sort((a, b) => b.getTime() - a.getTime());
    
    // Find a day that appears in consecutive months
    const consistentDay = sortedCompletions.find(c => {
      const day = c.getDate();
      return sortedCompletions.some(other => 
        other.getDate() === day && 
        other !== c && 
        Math.abs(other.getMonth() - c.getMonth()) === 1
      );
    });

    if (consistentDay) {
      const targetDay = consistentDay.getDate();
      
      // Start from today and work backwards
      let currentDate = new Date(today);
      currentDate.setDate(targetDay); // Set to target day of current month
      
      // If we're past the target day this month, start from next month
      if (today.getDate() > targetDay) {
        currentDate = subMonths(currentDate, 1);
      }
      
      // Generate 6 months of target dates
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(currentDate);
        if (!isAfter(targetDate, today) && !isBefore(targetDate, sixMonthsAgo)) {
          targetDates.push(targetDate);
        }
        currentDate = subMonths(currentDate, 1);
      }
    } else {
      // Fallback to current date's day if no consistent pattern found
      let currentDate = new Date(today);
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(currentDate);
        if (!isAfter(targetDate, today) && !isBefore(targetDate, sixMonthsAgo)) {
          targetDates.push(targetDate);
        }
        currentDate = subMonths(currentDate, 1);
      }
    }
  }
  else if (lower.includes('month') || /every \d+(?:st|nd|rd|th)?(?:\s|$)/.test(lower) || lower.includes('last day')) {
    if (lower.includes('last day')) {
      pattern = 'monthly-last';
      generateLastDayDates(today, sixMonthsAgo, targetDates);
    } else {
      pattern = generateMonthlyDates(lower, today, sixMonthsAgo, latestCompletion, targetDates);
    }
  }
  else if (lower.includes('every')) {
    pattern = 'weekly';
    interval = 7;
    generateWeeklyDates(lower, today, sixMonthsAgo, targetDates);
  }

  return { pattern, interval, targetDates };
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

function generateMonthlyDates(
  lower: string,
  today: Date,
  sixMonthsAgo: Date,
  latestCompletion: Date | undefined,
  targetDates: Date[]
): string {
  const monthlyMatch = lower.match(/every( \d+)? months? on the (\d+)(?:st|nd|rd|th)?/i);
  const specificDateMatch = lower.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
  const monthIntervalMatch = lower.match(/every (\d+) months?/i);
  const everyMonthMatch = lower === 'every month';

  if (everyMonthMatch) {
    // For "every month" pattern, generate target dates for the past 6 months
    let date = today;
    while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
      if (!isAfter(date, today)) {
        targetDates.push(new Date(date));
      }
      date = subMonths(date, 1);
    }
  } else if (monthIntervalMatch) {
    // For "every X months" pattern, generate dates based on latest completion
    const monthInterval = monthIntervalMatch?.[1] ? parseInt(monthIntervalMatch[1], 10) : 1;
    let date;

    if (latestCompletion) {
      // Start from the latest completion
      date = new Date(latestCompletion);

      // Generate past target dates
      let pastDate = new Date(date);
      while (isBefore(sixMonthsAgo, pastDate) || isEqual(sixMonthsAgo, pastDate)) {
        if (!isAfter(pastDate, today)) {
          targetDates.push(new Date(pastDate));
        }
        pastDate = new Date(pastDate);
        pastDate.setMonth(pastDate.getMonth() - monthInterval);
      }

      // Generate future target dates
      let futureDate = new Date(date);
      futureDate.setMonth(futureDate.getMonth() + monthInterval);
      while (!isAfter(futureDate, today)) {
        targetDates.push(new Date(futureDate));
        futureDate = new Date(futureDate);
        futureDate.setMonth(futureDate.getMonth() + monthInterval);
      }
    } else {
      // If no completions, start from today and work backwards
      date = today;
      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        targetDates.push(new Date(date));
        date = subMonths(date, monthInterval);
      }
    }
  } else if (monthlyMatch || specificDateMatch) {
    // This is a monthly pattern (e.g. "every 25th" or "every month on the 25th")
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
    if (latestCompletion) {
      // Start from the latest completion and generate one target date one month after
      let nextTarget = new Date(latestCompletion);
      nextTarget.setMonth(nextTarget.getMonth() + 1);

      // Only add the target if we're looking at historical data
      if (isBefore(nextTarget, today)) {
        targetDates.push(new Date(nextTarget));
      }

      // Generate past target dates based on completion
      let pastDate = new Date(latestCompletion);
      while (isBefore(sixMonthsAgo, pastDate) || isEqual(sixMonthsAgo, pastDate)) {
        if (!isAfter(pastDate, today)) {
          targetDates.push(new Date(pastDate));
        }
        pastDate = new Date(pastDate);
        pastDate.setMonth(pastDate.getMonth() - 1);
      }
    } else {
      // If no completions, start from today and work backwards
      let date = today;
      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        targetDates.push(new Date(date));
        date = subMonths(date, 1);
      }
    }
  }

  // Sort target dates from oldest to newest
  targetDates.sort((a, b) => a.getTime() - b.getTime());

  return (monthIntervalMatch || everyMonthMatch) ? 'months' : 'monthly';
}

function generateLastDayDates(today: Date, sixMonthsAgo: Date, targetDates: Date[]) {
  let date = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month

  // Generate target dates for the last 6 months
  for (let i = 0; i < 6; i++) {
    if (!isAfter(date, today) && (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date))) {
      targetDates.push(date);
    }
    // Move to last day of previous month
    date = new Date(date.getFullYear(), date.getMonth(), 0);
  }

  // Sort target dates from oldest to newest
  targetDates.sort((a, b) => a.getTime() - b.getTime());
}