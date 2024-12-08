import { format, isEqual, isBefore, isAfter, startOfDay, differenceInMonths } from 'date-fns';
import { isValidCompletion } from './validationUtils';

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export function calculateStreaks(
  dueString: string,
  interval: number,
  targetDates: Date[],
  recentCompletions: Date[],
  today: Date,
  _sixMonthsAgo: Date
): StreakResult {
  const lower = dueString.toLowerCase();

  // Sort target dates from newest to oldest
  targetDates.sort((a, b) => b.getTime() - a.getTime());

  // Filter out target dates before the time window
  const validTargetDates = targetDates.filter(date => 
    (isBefore(_sixMonthsAgo, date) || isEqual(_sixMonthsAgo, date)) &&
    !isBefore(date, _sixMonthsAgo)
  );

  // Calculate streaks for monthly tasks with specific dates
  if ((lower.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i) || lower === 'every last day') && interval === 1) {
    return calculateMonthlyStreaks(lower, recentCompletions);
  } 
  // Calculate streaks for tasks with multiple month intervals
  else if (lower.match(/every (\d+) months?/i) && interval > 1) {
    return calculateMultiMonthStreaks(interval, recentCompletions, _sixMonthsAgo);
  }
  // Calculate streaks for other recurring tasks
  else {
    return calculateRegularStreaks(validTargetDates, recentCompletions, dueString, today);
  }
}

function calculateMonthlyStreaks(dueString: string, recentCompletions: Date[]): StreakResult {
  let currentStreak = 0;
  let longestStreak = 0;
  
  // Sort completions from newest to oldest
  const sortedCompletions = [...recentCompletions].sort((a, b) => b.getTime() - a.getTime());
  
  if (dueString === 'every last day') {
    // For "every last day" tasks, we just need to count consecutive months
    let consecutiveMonths = 0;
    let lastMonth = -1;
    
    for (const completion of sortedCompletions) {
      const completionMonth = parseInt(format(completion, 'M')); // 1-12
      
      if (lastMonth === -1 || lastMonth - completionMonth === 1 || (lastMonth === 1 && completionMonth === 12)) {
        consecutiveMonths++;
        longestStreak = Math.max(longestStreak, consecutiveMonths);
        currentStreak = consecutiveMonths;
      } else {
        consecutiveMonths = 1;
        if (sortedCompletions.indexOf(completion) === 0) {
          currentStreak = 1;
        }
      }
      lastMonth = completionMonth;
    }
    
    return { currentStreak, longestStreak };
  }
  
  // Original logic for other monthly tasks with specific dates
  let targetDay: number;
  if (dueString === 'every last day') {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    targetDay = parseInt(format(lastDayOfMonth, 'd'));
  } else {
    const match = dueString.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
    targetDay = parseInt(match?.[1] ?? '1');
  }
  
  let currentTempStreak = 0;
  for (const completion of sortedCompletions) {
    const completionDay = parseInt(format(completion, 'd'));
    
    if (completionDay === targetDay) {
      currentTempStreak++;
      if (currentTempStreak > longestStreak) {
        longestStreak = currentTempStreak;
      }
      if (currentTempStreak === sortedCompletions.indexOf(completion) + 1) {
        currentStreak = currentTempStreak;
      }
    } else {
      currentTempStreak = 0;
      if (sortedCompletions.indexOf(completion) === 0) {
        currentStreak = 0;
      }
    }
  }
  
  return { currentStreak, longestStreak };
}

function calculateMultiMonthStreaks(interval: number, recentCompletions: Date[], _sixMonthsAgo: Date): StreakResult {
  // For tasks with interval > 6 months
  if (interval > 6) {
    if (recentCompletions.length > 0) {
      return {
        currentStreak: 1,
        longestStreak: 1,
      };
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  // For tasks with shorter intervals
  let currentStreak = 0;
  let longestStreak = 0;
  let lastDate: Date | null = null;

  // Sort completions from oldest to newest
  const sortedCompletions = [...recentCompletions].sort((a, b) => a.getTime() - b.getTime());
  
  for (const completion of sortedCompletions) {
    if (!lastDate || (lastDate && 
        Math.abs(differenceInMonths(completion, lastDate)) <= interval)) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
    lastDate = completion;
  }

  // Cap streak at maximum possible within 6 month window
  const maxPossibleStreak = Math.floor(6 / interval);
  currentStreak = Math.min(currentStreak, maxPossibleStreak);
  longestStreak = Math.min(longestStreak, maxPossibleStreak);

  return {
    currentStreak,
    longestStreak,
  };
}

function calculateRegularStreaks(
  validTargetDates: Date[],
  recentCompletions: Date[],
  dueString: string,
  today: Date
): StreakResult {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  for (const targetDate of validTargetDates) {
    if (isAfter(targetDate, today)) continue;
    
    const isCompleted = recentCompletions.some(completionDate => 
      isValidCompletion(targetDate, completionDate, dueString)
    );

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // For monthly tasks, don't break streak if we're in current month
      const isMonthlyTask = dueString.toLowerCase() === 'every month';
      const isCurrentMonth = format(targetDate, 'yyyy-MM') === format(today, 'yyyy-MM');
      const isToday = isEqual(startOfDay(targetDate), startOfDay(today));
      
      if ((isMonthlyTask && isCurrentMonth) || isToday) {
        // Keep the streak going if we have one
        if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        // Break the streak if we miss a day (except today)
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  return { currentStreak, longestStreak };
}
