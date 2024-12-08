import { format, isEqual, isBefore, subMonths, subDays, startOfDay, isAfter, startOfWeek, endOfWeek, isWithinInterval, startOfMonth } from 'date-fns';
import { ActiveTask } from '../../../types';

interface TaskStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
}

export function calculateStats(
  task: ActiveTask,
  completionDates: Date[]
): TaskStats {
  if (!task.due?.string) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
  }

  const lower = task.due!.string.toLowerCase();
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);

  console.log('\n========================================');
  console.log('Calculating stats for task:', task.content);
  console.log('Due string:', task.due!.string);
  console.log('Time window:', format(sixMonthsAgo, 'yyyy-MM-dd'), 'to', format(today, 'yyyy-MM-dd'));

  // Get completions within 6 month window, deduplicated by day
  const recentCompletions = completionDates
    .filter(date =>
      (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) &&
      (isBefore(date, today) || isEqual(date, today))
    )
    .reduce((acc: Date[], date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!acc.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
        acc.push(date);
      }
      return acc;
    }, [])
    .sort((a, b) => b.getTime() - a.getTime());

  console.log('Recent completions:', recentCompletions.map(d => format(d, 'yyyy-MM-dd')));
  const totalCompletions = recentCompletions.length;
  console.log('Total completions:', totalCompletions);

  // Find the latest completion date to set our window
  const latestCompletion = recentCompletions[0];

  // Initialize variables
  let recurrencePattern = '';
  let interval = 1;
  let targetDates: Date[] = [];

  // Calculate completion rate
  let completionRate = 0;
  let expectedCount = 0;

  // Helper function to check if a completion is valid for a given target date
  const isValidCompletion = (targetDate: Date, completionDate: Date, dueString: string): boolean => {
    const targetStr = format(targetDate, 'yyyy-MM-dd');
    const completionStr = format(completionDate, 'yyyy-MM-dd');
    const lower = dueString.toLowerCase();
    
    // For "every month" without a specific day, check if completion is in the same month
    if (lower === 'every month') {
      return format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
    }
    
    // For "every last day", check if completion is on the last day of the month
    if (lower === 'every last day') {
      const lastDayOfMonth = new Date(completionDate.getFullYear(), completionDate.getMonth() + 1, 0);
      return format(completionDate, 'yyyy-MM-dd') === format(lastDayOfMonth, 'yyyy-MM-dd') &&
             format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
    }
    
    // For specific date monthly tasks (e.g., "every 26" or "every 26th"), require exact date match
    const specificDateMatch = lower.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
    if (specificDateMatch) {
      const targetDay = parseInt(specificDateMatch[1] ?? '1');
      return parseInt(format(completionDate, 'd')) === targetDay &&
             format(targetDate, 'yyyy-MM') === format(completionDate, 'yyyy-MM');
    }
    
    // For weekly tasks, allow completion within the same week
    if (lower.includes('every') && !lower.includes('month') && !lower.includes('other') && !lower.includes('day')) {
      const targetWeekStart = startOfWeek(targetDate);
      const targetWeekEnd = endOfWeek(targetDate);
      return isWithinInterval(completionDate, { start: targetWeekStart, end: targetWeekEnd });
    }
    
    // For daily tasks and others, require exact date match
    return targetStr === completionStr;
  };

  // Parse and normalize the recurrence pattern
  if (lower.includes('every day') || lower.includes('daily')) {
    recurrencePattern = 'daily';
  } else if (lower.includes('every other')) {
    recurrencePattern = 'biweekly';
    interval = 14;
  } else if (lower.match(/every (\d+) months?/)) {
    const monthMatch = lower.match(/every (\d+) months?/);
    if (monthMatch) {
      recurrencePattern = 'months';
      interval = parseInt(monthMatch[1] || '1');
    }
  } else if (lower === 'every last day') {
    recurrencePattern = 'monthly-last';
    
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
  } else if (/every \d+(?:st|nd|rd|th)?(?:\s|$)/.test(lower) || (lower.includes('every') && lower.includes('month'))) {
    recurrencePattern = 'monthly';
    let date: Date;
    
    // Check if it's "every month on the X", "every X", or just "every month"
    const monthlyMatch = lower.match(/every( \d+)? months? on the (\d+)(?:st|nd|rd|th)?/i);
    const specificDateMatch = lower.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
    
    if (monthlyMatch || specificDateMatch) {
      // Handle specific day of month
      const targetDay = monthlyMatch ? 
        parseInt(monthlyMatch[2] ?? '1') : 
        parseInt(specificDateMatch![1] ?? '1');
      
      console.log('Detected specific day:', targetDay);
      
      // Start from the latest completion month or today, whichever is earlier
      const startDate = latestCompletion || today;
      date = new Date(startDate.getFullYear(), startDate.getMonth(), targetDay);
      
      // If the target day hasn't passed this month, start from last month
      if (parseInt(format(today, 'd')) < targetDay) {
        date = subMonths(date, 1);
      }
      
      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        if (!isAfter(date, today)) {
          targetDates.push(date);
        }
        date = subMonths(date, interval);
      }
      
      // Sort target dates from newest to oldest
      targetDates.sort((a, b) => b.getTime() - a.getTime());
    } else {
      // For "every month" without a specific day
      date = startOfMonth(today);
      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        targetDates.push(new Date(date));
        date = subMonths(date, interval);
      }
    }
  } else if (lower.includes('every')) {
    recurrencePattern = 'weekly';
    interval = 7;
  }

  console.log('Detected pattern:', recurrencePattern, 'with interval:', interval);

  // Calculate expected completions based on pattern
  let date = today;

  switch (recurrencePattern) {
    case 'daily':
      while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
        targetDates.push(date);
        date = subDays(date, 1);
      }
      break;

    case 'weekly':
    case 'biweekly':
      const weekdayMatch = lower.match(/every( other)? (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
      if (weekdayMatch) {
        const dayMap: { [key: string]: string } = {
          sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
          thu: 'thursday', fri: 'friday', sat: 'saturday'
        };
        const targetDay = weekdayMatch[2] ? (dayMap[weekdayMatch[2].toLowerCase()] || weekdayMatch[2].toLowerCase()) : 'monday';
        
        // Align to the target weekday
        while (format(date, 'EEEE').toLowerCase() !== targetDay) {
          date = subDays(date, 1);
        }

        while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
          targetDates.push(date);
          date = subDays(date, interval);
        }
      }
      break;

    case 'monthly':
    case 'months':
      const monthlyMatch = lower.match(/every( \d+)? months? on the (\d+)(?:st|nd|rd|th)?/i);
      if (monthlyMatch) {
        const targetDay = parseInt(monthlyMatch[2] ?? '1');
        date = new Date(today.getFullYear(), today.getMonth(), targetDay);
        
        while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
          if (!isAfter(date, today)) {
            targetDates.push(date);
          }
          date = subMonths(date, interval);
        }
      }
      break;
  }

  console.log('Target dates:', targetDates.map(d => format(d, 'yyyy-MM-dd')));
  expectedCount = targetDates.length;
  console.log('Expected completions:', expectedCount);

  // Calculate completion rate
  let validCompletions = 0;
  targetDates.forEach(targetDate => {
    const isCompleted = recentCompletions.some(completionDate => 
      isValidCompletion(targetDate, completionDate, task.due!.string)
    );
    if (isCompleted) validCompletions++;
  });

  // For monthly tasks, don't count current month in expected count
  const isMonthlyTask = task.due!.string.toLowerCase() === 'every month';
  const specificDateMatch = task.due!.string.toLowerCase().match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
  const isLastDayTask = task.due!.string.toLowerCase() === 'every last day';
  
  if (isMonthlyTask || specificDateMatch || isLastDayTask) {
    const currentMonthTargets = targetDates.filter(date => {
      const isCurrentMonth = format(date, 'yyyy-MM') === format(today, 'yyyy-MM');
      
      // For specific date tasks, only exclude if the date hasn't passed yet
      if (specificDateMatch) {
        const targetDay = parseInt(specificDateMatch[1] ?? '1');
        const currentDay = parseInt(format(today, 'd'));
        return isCurrentMonth && currentDay >= targetDay;
      }
      
      // For last day of month tasks, only exclude if we haven't reached the last day
      if (isLastDayTask) {
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const currentDay = parseInt(format(today, 'd'));
        const lastDay = parseInt(format(lastDayOfMonth, 'd'));
        return isCurrentMonth && currentDay >= lastDay;
      }
      
      // For general monthly tasks, exclude current month entirely
      return isCurrentMonth;
    });
    
    expectedCount -= currentMonthTargets.length;
  }

  if (expectedCount > 0) {
    const completedCount = validCompletions;
    completionRate = Math.round((completedCount / expectedCount) * 100);
  }

  console.log('Expected count:', expectedCount, 
    'Completed count:', validCompletions,
    'Rate:', completionRate);

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastCompletedDate: Date | null = null;
  let activeStreak = true;

  // Sort target dates from newest to oldest
  targetDates.sort((a, b) => b.getTime() - a.getTime());

  // Filter out target dates before the time window
  const validTargetDates = targetDates.filter(date => 
    (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) &&
    !isBefore(date, sixMonthsAgo)
  );

  for (let i = 0; i < validTargetDates.length; i++) {
    const targetDate = validTargetDates[i] as Date;
    const isToday = isEqual(startOfDay(targetDate), startOfDay(today));
    const isCurrentMonth = format(targetDate, 'yyyy-MM') === format(today, 'yyyy-MM');
    const isFutureDate = isAfter(targetDate, today);
    
    // Skip future dates
    if (isFutureDate) continue;
    
    // Find the completion for this target date
    const completion = recentCompletions.find(completionDate => 
      isValidCompletion(targetDate, completionDate, task.due!.string)
    );

    console.log('Checking date:', format(targetDate, 'yyyy-MM-dd'), 
      'completed:', !!completion, 
      'isToday:', isToday,
      'isCurrentMonth:', isCurrentMonth,
      'tempStreak:', tempStreak);

    if (completion) {
      // If this is our first completion in the streak
      if (tempStreak === 0) {
        lastCompletedDate = completion;
      }
      
      tempStreak++;
      
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      
      // Update current streak if we're still in an active streak
      if (activeStreak) {
        currentStreak = tempStreak;
      }
    } else {
      // For monthly tasks, don't break streak if we're in current month
      const isMonthlyTask = task.due!.string.toLowerCase() === 'every month';
      if (isMonthlyTask && isCurrentMonth) {
        // Keep the streak going if we have one
        if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      } else if (!isToday) {
        // Break the streak if we miss a day (except today)
        activeStreak = false;
        if (lastCompletedDate) {
          console.log('Streak broken at:', format(targetDate, 'yyyy-MM-dd'),
            'Last completed:', format(lastCompletedDate, 'yyyy-MM-dd'));
        }
        tempStreak = 0;
        lastCompletedDate = null;
      } else {
        // For today's incomplete task, keep the streak going if we have one
        if (tempStreak > 0) {
          currentStreak = tempStreak;
        }
      }
    }
  }

  console.log('Final streaks:', { 
    currentStreak, 
    longestStreak, 
    activeStreak,
    lastCompletedDate: lastCompletedDate ? format(lastCompletedDate, 'yyyy-MM-dd') : null 
  });
  console.log('========================================\n');

  return {
    currentStreak,
    longestStreak,
    totalCompletions: validCompletions,
    completionRate
  };
}
