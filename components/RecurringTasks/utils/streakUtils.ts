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
    return calculateRegularStreaks(validTargetDates, recentCompletions, dueString, today, targetDates);
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
      return { currentStreak: 1, longestStreak: 1 };
    }
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort completions from newest to oldest
  const sortedCompletions = [...recentCompletions].sort((a, b) => b.getTime() - a.getTime());
  
  if (sortedCompletions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // For multi-month intervals, we'll consider a streak valid if:
  // The completion is on or before the expected date
  
  let currentStreak = 1;  // Start with 1 for the most recent completion
  let longestStreak = 1;
  let lastValidDate = sortedCompletions[0]!;  // We know this exists because we checked length above
  let expectedNextDate = new Date(lastValidDate);
  expectedNextDate.setMonth(expectedNextDate.getMonth() + interval);

  // Check each completion against its expected date
  for (let i = 1; i < sortedCompletions.length; i++) {
    const currentDate = sortedCompletions[i]!;  // Non-null assertion since i < length
    
    // If this completion is on or before when it was expected
    if (!isAfter(currentDate, expectedNextDate)) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
      lastValidDate = currentDate;
      expectedNextDate = new Date(currentDate);
      expectedNextDate.setMonth(expectedNextDate.getMonth() + interval);
    } else {
      // This completion was after the expected date
      if (i === 1) {
        // If this is the second-most recent completion and it's late,
        // current streak should be 1 (just the most recent completion)
        currentStreak = 1;
      }
      // Start a new potential streak from this point
      lastValidDate = currentDate;
      expectedNextDate = new Date(currentDate);
      expectedNextDate.setMonth(expectedNextDate.getMonth() + interval);
      currentStreak = 1;
    }
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

    console.log('Sorted completions:', sortedCompletions);

    // Start counting current streak from the most recent completion
    if (sortedCompletions.length > 0) {
      // Check each pair of consecutive completions
      for (let i = 0; i < sortedCompletions.length - 1; i++) {
        const currentDate = sortedCompletions[i];
        const nextDate = sortedCompletions[i + 1];

        // Skip if either date is undefined
        if (!currentDate || !nextDate) {
          console.log('Skipping undefined date comparison');
          continue;
        }

        const diff = differenceInDays(parseISO(currentDate), parseISO(nextDate));

        console.log(`Comparing ${currentDate} with ${nextDate}, diff: ${diff} days`);

        if (diff === 2) {
          if (lastBreak === -1) {
            currentStreak++;
          }
          longestStreak = Math.max(longestStreak, currentStreak);
          console.log(`Correct interval, current streak: ${currentStreak}, longest: ${longestStreak}`);
        } else {
          console.log(`Incorrect interval (${diff} days)`);
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
      console.log(`Days since last completion: ${daysSinceLastCompletion}`);

      // Get the next target date after the last completion
      const nextTargetDate = targetDates.find(date => 
        isAfter(date, lastCompletionDate)
      );

      // Check if today is a target date and the last completion was on schedule
      const todayIsTarget = nextTargetDate && isSameDay(nextTargetDate, today);
      const lastCompletionWasTarget = targetDates.some(date => 
        isSameDay(date, lastCompletionDate)
      );

      console.log(`Today (${format(today, 'yyyy-MM-dd')}) is target: ${todayIsTarget}, Last completion (${format(lastCompletionDate, 'yyyy-MM-dd')}) was target: ${lastCompletionWasTarget}`);

      // If today is a target date and the last completion was valid, maintain the streak
      if (todayIsTarget && lastCompletionWasTarget && daysSinceLastCompletion <= 2) {
        // Keep the current streak as is since today is just pending completion
        console.log(`Maintaining streak of ${currentStreak} since today is a pending target date`);
      } else if (daysSinceLastCompletion > 2) {
        // Reset streak if we've gone too long without completion
        console.log(`Resetting streak since ${daysSinceLastCompletion} days have passed since last completion`);
        currentStreak = 1;
      }

      console.log(`Final streaks - current: ${currentStreak}, longest: ${longestStreak}`);
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
