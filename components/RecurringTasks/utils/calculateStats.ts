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
  const { pattern, interval, targetDates } = detectPattern(lower, today, sixMonthsAgo, latestCompletion);
  console.log('Detected pattern:', pattern, 'with interval:', interval);
  console.log('Target dates:', targetDates.map(d => format(d, 'yyyy-MM-dd')));

  // Calculate completion rate
  let expectedCount = targetDates.length;
  let validCompletions = 0;
  console.log('Expected completions:', expectedCount);

  // For "every month" tasks, don't count current month if we're still within the grace period
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

  let completionRate = 0;
  if (expectedCount > 0) {
    const completedCount = validCompletions;
    
    // For monthly tasks with specific dates, adjust completion rate calculation
    const specificDateMatch = lower.match(/every (\d+)(?:st|nd|rd|th)?(?:\s|$)/i);
    if (specificDateMatch?.[1]) {
      const targetDay = parseInt(specificDateMatch[1] ?? '1');
      const currentDay = parseInt(format(today, 'd'));
      
      // If we haven't reached this month's target day, don't count it in expected completions
      if (currentDay < targetDay) {
        expectedCount = targetDates.length;
      }
    }
    
    // For tasks completed more times than expected, cap at 200%
    completionRate = Math.min(200, Math.round((completedCount / expectedCount) * 100));
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