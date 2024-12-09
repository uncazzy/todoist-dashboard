import { format, isEqual, isBefore, subMonths, startOfMonth } from 'date-fns';
import { ActiveTask } from '../../../types';
import { TaskStats } from './types';
import { isValidCompletion } from './validationUtils';
import { detectPattern } from './patternUtils';
import { calculateStreaks } from './streakUtils';

export function calculateStats(
  task: ActiveTask,
  completionDates: Date[]
): TaskStats {
  if (!task.due?.string) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
  }

  const lower = task.due!.string.toLowerCase();
  const today = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));

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

  // Detect pattern and generate target dates
  const { pattern, interval, targetDates } = detectPattern(lower, today, sixMonthsAgo, latestCompletion, recentCompletions);
  console.log('Detected pattern:', pattern, 'with interval:', interval);
  console.log('Target dates:', targetDates.map(d => format(d, 'yyyy-MM-dd')));

  // Check if this is a long-term recurring task (> 6 months)
  const isLongTermRecurring = pattern === 'months' && interval > 6;
  if (isLongTermRecurring) {
    console.log('Long-term recurring task detected - task recurs every', interval, 'months');
    // For long-term tasks, we'll return info about the recurrence pattern
    const hasCompletionInWindow = totalCompletions > 0;
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions,
      completionRate: hasCompletionInWindow ? 100 : 0,
      isLongTerm: true,
      interval: interval
    };
  }

  // Calculate completion rate
  let expectedCount = 0;
  let validCompletions = 0;

  if (pattern === 'months' && interval > 1) {
    // For multi-month intervals, calculate expected completions differently
    if (recentCompletions.length > 0) {
      // Get the earliest completion in our window
      const earliestCompletion = recentCompletions[recentCompletions.length - 1]!; // Assert non-null with !
      
      // Generate expected dates from the earliest completion
      let expectedDates: Date[] = [];
      let expectedDate = new Date(earliestCompletion);
      
      // First, add the initial completion
      if (isBefore(sixMonthsAgo, earliestCompletion) || isEqual(sixMonthsAgo, earliestCompletion)) {
        expectedDates.push(new Date(earliestCompletion));
      }
      
      // Then add interval months to get subsequent expected dates
      expectedDate.setMonth(expectedDate.getMonth() + interval);
      while (isEqual(expectedDate, today) || isBefore(expectedDate, today)) {
        if (isBefore(sixMonthsAgo, expectedDate) || isEqual(sixMonthsAgo, expectedDate)) {
          expectedDates.push(new Date(expectedDate));
        }
        expectedDate = new Date(expectedDate);
        expectedDate.setMonth(expectedDate.getMonth() + interval);
      }

      expectedCount = expectedDates.length;
      console.log('Expected dates:', expectedDates.map(d => format(d, 'yyyy-MM-dd')));

      // Count completions that are within 1 month of any expected date
      for (const expectedDate of expectedDates) {
        const hasValidCompletion = recentCompletions.some(completion => {
          const monthDiff = Math.abs(
            (expectedDate.getFullYear() - completion.getFullYear()) * 12 +
            (expectedDate.getMonth() - completion.getMonth())
          );
          return monthDiff <= 1;
        });
        if (hasValidCompletion) {
          validCompletions++;
        }
      }
    }
  } else {
    // Original logic for other patterns
    expectedCount = targetDates.length;
    
    if (lower === 'every month' && recentCompletions.length > 0) {
      const lastCompletion = recentCompletions[0]!; // Assert non-null with !
      const lastCompletionDay = parseInt(format(lastCompletion, 'd'));
      const currentDay = parseInt(format(today, 'd'));
      
      // If we haven't reached the day of the month when the task was last completed,
      // don't count this month in the expected count
      if (currentDay < lastCompletionDay) {
        expectedCount--;
      }
    }

    targetDates.forEach(targetDate => {
      const isCompleted = recentCompletions.some(completionDate => 
        isValidCompletion(targetDate, completionDate, task.due!.string)
      );
      if (isCompleted) validCompletions++;
    });
  }

  let completionRate = 0;
  if (expectedCount > 0) {
    // For tasks completed more times than expected, cap at 200%
    completionRate = Math.min(200, Math.round((validCompletions / expectedCount) * 100));
  }

  console.log('Expected count:', expectedCount, 
    'Completed count:', validCompletions,
    'Rate:', completionRate);

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(
    task.due!.string,
    interval,
    targetDates,
    recentCompletions,
    today,
    sixMonthsAgo
  );

  console.log('Final streaks:', { currentStreak, longestStreak });
  console.log('========================================\n');

  return {
    currentStreak,
    longestStreak,
    totalCompletions: validCompletions,
    completionRate
  };
}