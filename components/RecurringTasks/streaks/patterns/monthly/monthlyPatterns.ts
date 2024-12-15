import { subMonths, isAfter, isBefore, isEqual, format } from 'date-fns';
import { PatternInfo, PatternContext } from '../../../utils/types';

export function detectMonthlyPattern(
  dueString: string,
  context: PatternContext
): PatternInfo | null {
  const lower = dueString.toLowerCase();
  
  // Handle "every X months" pattern
  const monthMatch = lower.match(/every (\d+) months?/);
  if (monthMatch) {
    const interval = parseInt(monthMatch[1] || '1', 10);
    const targetDates: Date[] = [];
    generateMonthlyDates(lower, context.today, context.sixMonthsAgo, context.latestCompletion, targetDates);
    
    return {
      pattern: 'months',
      interval,
      targetDates
    };
  }
  
  // Handle "every month" pattern
  if (lower === 'every month') {
    return handleEveryMonthPattern(context);
  }
  
  // Handle other monthly patterns
  if (lower.includes('month') || /every \d+(?:st|nd|rd|th)?(?:\s|$)/.test(lower) || lower.includes('last day')) {
    const targetDates: Date[] = [];
    
    if (lower.includes('last day')) {
      generateLastDayDates(context.today, context.sixMonthsAgo, targetDates);
      return {
        pattern: 'monthly-last',
        interval: 1,
        targetDates
      };
    } else {
      const pattern = generateMonthlyDates(lower, context.today, context.sixMonthsAgo, context.latestCompletion, targetDates);
      return {
        pattern,
        interval: 1,
        targetDates
      };
    }
  }
  
  return null;
}

function handleEveryMonthPattern(context: PatternContext): PatternInfo {
  const targetDates: Date[] = [];
  
  // For "every month" pattern, detect the consistent day from completions
  const sortedCompletions = context.recentCompletions
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
    let currentDate = new Date(context.today);
    currentDate.setDate(targetDay); // Set to target day of current month
    
    // If we're past the target day this month, start from next month
    if (context.today.getDate() > targetDay) {
      currentDate = subMonths(currentDate, 1);
    }
    
    // Generate 6 months of target dates
    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(currentDate);
      if (!isAfter(targetDate, context.today) && !isBefore(targetDate, context.sixMonthsAgo)) {
        targetDates.push(targetDate);
      }
      currentDate = subMonths(currentDate, 1);
    }
  } else {
    // Fallback to current date's day if no consistent pattern found
    let currentDate = new Date(context.today);
    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(currentDate);
      if (!isAfter(targetDate, context.today) && !isBefore(targetDate, context.sixMonthsAgo)) {
        targetDates.push(targetDate);
      }
      currentDate = subMonths(currentDate, 1);
    }
  }

  return {
    pattern: 'monthly-strict',
    interval: 1,
    targetDates
  };
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
