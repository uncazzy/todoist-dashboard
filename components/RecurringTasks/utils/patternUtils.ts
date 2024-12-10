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
  let interval = 1;
  let targetDates: Date[] = [];

  // Daily
  if (lower.includes('every day') || lower.includes('daily')) {
    pattern = 'daily';
    let date = today;
    while (isBefore(date, sixMonthsAgo) === false) {
      targetDates.push(date);
      date = subDays(date, 1);
    }
  }
  else if (lower === 'every other day') {
    // Adaptive scheduling for every-other-day tasks
    pattern = 'every-other-day';
    interval = 2;
    targetDates = [];

    // Filter completions within the window [sixMonthsAgo, today] and sort ascending
    const windowCompletions = recentCompletions
      .filter(c => !isBefore(c, sixMonthsAgo) && !isAfter(c, today))
      .sort((a, b) => a.getTime() - b.getTime());

    if (windowCompletions.length === 0) {
      // No completions in this window
      // Create a baseline schedule starting at sixMonthsAgo going forward every 2 days
      let anchor = new Date(sixMonthsAgo);
      while (anchor <= today) {
        targetDates.push(new Date(anchor));
        anchor = addDays(anchor, interval);
      }
    } else {
      // We have completions, use them to anchor the schedule
      const firstCompletion = windowCompletions[0];
      if (!firstCompletion) {
        return { pattern, interval, targetDates };
      }
      
      let anchor: Date = firstCompletion;

      // For each completion, fill in every-other-day targets from the previous anchor
      // up to (and including) the current completion if it aligns
      for (let i = 0; i < windowCompletions.length; i++) {
        const currentCompletion = windowCompletions[i];
        // Generate target dates starting from anchor + interval until you reach currentCompletion
        if (currentCompletion) {
          let tempDate = addDays(anchor, interval);
          while (tempDate <= currentCompletion) {
            targetDates.push(new Date(tempDate));
            tempDate = addDays(tempDate, interval);
          }
          // Current completion becomes the new anchor
          anchor = currentCompletion;
        }
      }

      // After the last completion, continue generating targets every 2 days until today
      let finalAnchor = addDays(anchor, interval);
      while (finalAnchor <= today) {
        targetDates.push(new Date(finalAnchor));
        finalAnchor = addDays(finalAnchor, interval);
      }
    }

  }
  else if (lower.includes('every other')) {
    pattern = 'biweekly';
    interval = 14;
    generateWeeklyDates(lower, today, sixMonthsAgo, interval, latestCompletion, targetDates);
  }
  else if (lower.match(/every (\d+) months?/)) {
    const monthMatch = lower.match(/every (\d+) months?/);
    if (monthMatch) {
      pattern = 'months';
      interval = parseInt(monthMatch[1] || '1', 10);
      generateMonthlyDates(lower, today, sixMonthsAgo, latestCompletion, targetDates);
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
    generateWeeklyDates(lower, today, sixMonthsAgo, interval, latestCompletion, targetDates);
  }

  return { pattern, interval, targetDates };
}

function generateWeeklyDates(
  lower: string, 
  today: Date, 
  sixMonthsAgo: Date, 
  interval: number, 
  latestCompletion: Date | undefined, 
  targetDates: Date[]
) {
  // If latestCompletion is undefined, use sixMonthsAgo as the anchor
  const completionAnchor = latestCompletion !== undefined ? latestCompletion : sixMonthsAgo;

  const weekdayMatch = lower.match(/every( other)? (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);

  if (weekdayMatch) {
    const dayMap: { [key: string]: string } = {
      sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
      thu: 'thursday', fri: 'friday', sat: 'saturday'
    };
    const targetDay = weekdayMatch[2] ? (dayMap[weekdayMatch[2].toLowerCase()] || weekdayMatch[2].toLowerCase()) : 'monday';

    // Start from the most recent completion or today
    let date = completionAnchor;

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
    // For "every month" pattern, target dates are always 1 month after each completion
    if (latestCompletion) {
      let date = new Date(latestCompletion);
      
      // First, go backwards from the latest completion
      let pastDate = new Date(date);
      while (isBefore(sixMonthsAgo, pastDate) || isEqual(sixMonthsAgo, pastDate)) {
        if (!isAfter(pastDate, today)) {
          targetDates.push(new Date(pastDate));
        }
        // Next target would have been 1 month after this completion
        pastDate.setMonth(pastDate.getMonth() + 1);
      }
    }
  } else if (monthIntervalMatch) {
    // For "every X months" pattern, generate dates based on latest completion
    const monthInterval = monthIntervalMatch ? parseInt(monthIntervalMatch[1] || '1') : 1;
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

  // Sort target dates from newest to oldest
  targetDates.sort((a, b) => b.getTime() - a.getTime());

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

  // Sort target dates from newest to oldest
  targetDates.sort((a, b) => b.getTime() - a.getTime());
}
