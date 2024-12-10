import { format, isEqual, isBefore, isAfter, startOfDay, differenceInDays, parseISO, isSameDay, compareDesc } from 'date-fns';
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

  // Calculate streaks for monthly tasks
  if (lower === 'every month' || (lower.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i) || lower === 'every last day') && interval === 1) {
    return calculateMonthlyStreaks(lower, recentCompletions);
  } 
  // Calculate streaks for tasks with multiple month intervals
  else if (lower.match(/every (\d+) months?/i) && interval > 1) {
    return calculateMultiMonthStreaks(interval, recentCompletions, _sixMonthsAgo);
  }
  // Calculate streaks for other recurring tasks
  else {
    return calculateRegularStreaks(validTargetDates, recentCompletions, dueString, today, targetDates);
  }
}

function calculateMonthlyStreaks(dueString: string, recentCompletions: Date[]): StreakResult {
  let currentStreak = 0;
  let longestStreak = 0;
  
  // Sort completions from newest to oldest
  const sortedCompletions = [...recentCompletions].sort((a, b) => b.getTime() - a.getTime());

  if (dueString === 'every month') {
    // For "every month" tasks, each completion must be exactly one month after the previous
    let lastDate: Date | undefined;
    let currentCount = 0;

    for (let i = sortedCompletions.length - 1; i >= 0; i--) {
      const completion = sortedCompletions[i];
      
      if (!lastDate) {
        lastDate = completion;
        currentCount = 1;
        continue;
      }

      // Check if this completion is exactly one month after the last one
      const expectedMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);
      const lastDayOfMonth = new Date(expectedMonth.getFullYear(), expectedMonth.getMonth() + 1, 0).getDate();
      const originalDay = lastDate.getDate();
      const expectedDay = Math.min(originalDay, lastDayOfMonth);
      const expectedDate = new Date(expectedMonth.getFullYear(), expectedMonth.getMonth(), expectedDay);
      
      // Check if this completion matches the expected date
      if (completion && format(completion, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
        currentCount++;
        lastDate = completion;
      } else {
        // Chain broken, update longest streak and reset current
        longestStreak = Math.max(longestStreak, currentCount);
        currentCount = 1;
        lastDate = completion;
      }
    }

    // Update longest streak one final time
    longestStreak = Math.max(longestStreak, currentCount);
    
    // Current streak is only maintained if the latest completion is within one month
    if (sortedCompletions.length > 0) {
      const latestCompletion = sortedCompletions[0];
      const nextExpectedDate = latestCompletion ? new Date(latestCompletion) : new Date();
      nextExpectedDate.setMonth(nextExpectedDate.getMonth() + 1);
      
      if (new Date() < nextExpectedDate) {
        currentStreak = currentCount;
      }
    }

    return { currentStreak, longestStreak };
  } else if (dueString === 'every last day') {
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
  } else {
    // Original logic for other monthly tasks with specific dates
    let targetDay: number;
    const match = dueString.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
    targetDay = parseInt(match?.[1] ?? '1');
    
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
  }
  
  return { currentStreak, longestStreak };
}

function calculateMultiMonthStreaks(interval: number, recentCompletions: Date[], _sixMonthsAgo: Date): StreakResult {
  // For tasks with interval > 6 months
  if (interval > 6) {
    if (recentCompletions.length > 0) {
      return { currentStreak: 1, longestStreak: 1 };
    }
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest
  const sortedCompletions = [...recentCompletions].sort((a, b) => b.getTime() - a.getTime());
  
  if (sortedCompletions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // For multi-month intervals, we need to:
  // 1. Start from the latest completion
  // 2. Look back at expected completion dates based on the interval
  // 3. Count streak only if completions match these expected dates

  let currentStreak = 1;  // Start with 1 for the most recent completion
  let longestStreak = 1;
  let lastValidDate = sortedCompletions[0]!;  // We know this exists because we checked length above

  // Generate expected dates working backwards from the latest completion
  let expectedDate = new Date(lastValidDate);
  expectedDate.setMonth(expectedDate.getMonth() - interval);  // First expected date before latest completion

  // Keep track of which completions we've matched to avoid counting duplicates
  const usedCompletions = new Set<string>([format(lastValidDate, 'yyyy-MM-dd')]);

  while (expectedDate >= _sixMonthsAgo) {
    // Look for a completion around this expected date
    // Allow completion to be up to 15 days before or after the expected date
    const foundCompletion = sortedCompletions.find(completion => {
      const dateStr = format(completion, 'yyyy-MM-dd');
      if (usedCompletions.has(dateStr)) return false;  // Skip if we've already used this completion

      const daysDiff = Math.abs(completion.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 15;  // Allow 15 days before or after expected date
    });

    if (foundCompletion && format(foundCompletion, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
      // Found a valid completion for this expected date
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
      usedCompletions.add(format(foundCompletion, 'yyyy-MM-dd'));
    } else {
      // No completion found for this expected date - break the streak
      break;
    }

    // Move to the next expected date
    expectedDate.setMonth(expectedDate.getMonth() - interval);
  }

  // Cap streak at maximum possible within time window
  const maxPossibleStreak = Math.floor(6 / interval);
  currentStreak = Math.min(currentStreak, maxPossibleStreak);
  longestStreak = Math.min(longestStreak, maxPossibleStreak);

  return { currentStreak, longestStreak };
}

function calculateRegularStreaks(
  validTargetDates: Date[],
  recentCompletions: Date[],
  dueString: string,
  today: Date,
  targetDates: Date[]
): StreakResult {
  const lower = dueString.toLowerCase();
  const isEveryOtherDay = lower === 'every other day';

  if (isEveryOtherDay) {
    let currentStreak = 1;
    let longestStreak = 1;
    let lastBreak = -1;

    // Sort completions from newest to oldest
    const sortedCompletions = [...recentCompletions]
      .map(date => format(date, 'yyyy-MM-dd'))
      .sort((a, b) => compareDesc(parseISO(a), parseISO(b)));

    // Start counting current streak from the most recent completion
    if (sortedCompletions.length > 0) {
      // Check each pair of consecutive completions
      for (let i = 0; i < sortedCompletions.length - 1; i++) {
        const currentDate = sortedCompletions[i];
        const nextDate = sortedCompletions[i + 1];

        // Skip if either date is undefined
        if (!currentDate || !nextDate) {
          continue;
        }

        const diff = differenceInDays(parseISO(currentDate), parseISO(nextDate));

        if (diff === 2) {
          if (lastBreak === -1) {
            currentStreak++;
          }
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          if (lastBreak === -1) {
            lastBreak = i;
            longestStreak = Math.max(longestStreak, currentStreak);
          }
        }
      }

      // Get last completion date, return early if no completions
      if (!sortedCompletions.length) {
        console.log('No completions found');
        return { currentStreak: 0, longestStreak: 0 };
      }
      
      const lastCompletionDate = parseISO(sortedCompletions[0]!);
      const daysSinceLastCompletion = differenceInDays(today, lastCompletionDate);

      // Get the next target date after the last completion
      const nextTargetDate = targetDates.find(date => 
        isAfter(date, lastCompletionDate)
      );

      // Check if today is a target date and the last completion was on schedule
      const todayIsTarget = nextTargetDate && isSameDay(nextTargetDate, today);
      const lastCompletionWasTarget = targetDates.some(date => 
        isSameDay(date, lastCompletionDate)
      );

      // If today is a target date and the last completion was valid, maintain the streak
      if (todayIsTarget && lastCompletionWasTarget && daysSinceLastCompletion <= 2) {
        // Keep the current streak as is since today is just pending completion
      } else if (daysSinceLastCompletion > 2) {
        // Reset streak if we've gone too long without completion
        currentStreak = 1;
      }

      return { currentStreak, longestStreak };
    }

    // If no completions, return 0 streaks
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Original logic for other types of tasks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let activeStreak = true;

  // Sort target dates from newest to oldest
  const sortedTargetDates = [...validTargetDates].sort((a, b) => b.getTime() - a.getTime());

  for (const targetDate of sortedTargetDates) {
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
      // For every other day tasks, only break streak if we've missed a target date
      // that's not today
      const isToday = isEqual(startOfDay(targetDate), startOfDay(today));
      
      if (isToday) {
        // Keep the streak going if we have one
        if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        // Break the streak
        activeStreak = false;
        tempStreak = 0;
      }
    }
  }

  return { currentStreak, longestStreak };
}
