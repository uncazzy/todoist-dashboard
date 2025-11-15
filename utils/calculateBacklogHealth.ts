import { ActiveTask, CompletedTask } from '../types';
import { subDays, differenceInDays } from 'date-fns';

export interface BacklogHealthMetrics {
  healthScore: number; // 0-100
  totalActiveTasks: number;
  overdueCount: number;
  staleCount: number; // >=30 days old
  noDueDateCount: number;
  labeledCount: number;
  medianAge: number; // in days
  recommendedWIPLimit: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface TaskToReview {
  id: string;
  content: string;
  projectId: string;
  createdAt: string;
  age: number; // in days
  reason: 'stale' | 'overdue-high-priority';
  priority: number;
  due: {
    date: string;
    isRecurring: boolean;
  } | null | undefined;
}

export interface BacklogHealthData {
  metrics: BacklogHealthMetrics;
  tasksToReview: TaskToReview[];
  breakdown: {
    overdue: number;
    stale: number;
    noDueDate: number;
    unlabeled: number;
  };
}

/**
 * Calculate backlog health score and provide actionable insights
 */
export function calculateBacklogHealth(
  activeTasks: ActiveTask[],
  completedTasks: CompletedTask[]
): BacklogHealthData {
  const now = new Date();

  // Filter out recurring tasks for cleaner analysis
  const nonRecurringTasks = activeTasks.filter(task => !task.due?.isRecurring);
  const totalActiveTasks = nonRecurringTasks.length;

  if (totalActiveTasks === 0) {
    return {
      metrics: {
        healthScore: 100,
        totalActiveTasks: 0,
        overdueCount: 0,
        staleCount: 0,
        noDueDateCount: 0,
        labeledCount: 0,
        medianAge: 0,
        recommendedWIPLimit: 0,
        trend: 'stable'
      },
      tasksToReview: [],
      breakdown: {
        overdue: 0,
        stale: 0,
        noDueDate: 0,
        unlabeled: 0
      }
    };
  }

  // Calculate task ages (filter out invalid dates)
  const taskAges = nonRecurringTasks
    .map(task => {
      const createdAt = new Date(task.createdAt);
      // Validate date
      if (isNaN(createdAt.getTime())) {
        return null;
      }
      return differenceInDays(now, createdAt);
    })
    .filter((age): age is number => age !== null);

  // Calculate median age
  const sortedAges = [...taskAges].sort((a, b) => a - b);
  const medianAge: number = sortedAges.length > 0
    ? sortedAges.length % 2 === 0
      ? ((sortedAges[sortedAges.length / 2 - 1] ?? 0) + (sortedAges[sortedAges.length / 2] ?? 0)) / 2
      : (sortedAges[Math.floor(sortedAges.length / 2)] ?? 0)
    : 0;

  // Count problematic tasks
  const overdueCount = nonRecurringTasks.filter(task => {
    if (!task.due?.date) return false;
    const dueDate = new Date(task.due.date);
    return dueDate < now;
  }).length;

  const staleCount = taskAges.filter(age => age >= 30).length;
  const noDueDateCount = nonRecurringTasks.filter(task => !task.due?.date).length;
  const labeledCount = nonRecurringTasks.filter(task => task.labels && task.labels.length > 0).length;

  // Calculate weekly completion capacity (average completions per week over last 8 weeks)
  const eightWeeksAgo = subDays(now, 56);
  const recentCompletions = completedTasks.filter(task => {
    const completedAt = new Date(task.completed_at);
    return completedAt >= eightWeeksAgo;
  });

  let weeksOfData = 1;
  if (recentCompletions.length > 0) {
    // Sort to find earliest and latest completions
    const sortedByDate = [...recentCompletions].sort((a, b) =>
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );
    const earliestCompletion = sortedByDate[0]!;
    const latestCompletion = sortedByDate[sortedByDate.length - 1]!;
    const daysSpan = differenceInDays(new Date(latestCompletion.completed_at), new Date(earliestCompletion.completed_at));
    weeksOfData = Math.max(1, Math.min(8, Math.ceil(daysSpan / 7)));
  }

  const avgWeeklyCompletions = weeksOfData > 0 ? recentCompletions.length / weeksOfData : 10;
  const recommendedWIPLimit = Math.ceil(avgWeeklyCompletions * 1.5); // 1.5 weeks worth of work

  // Calculate component scores (0-100 each)
  const overdueScore = 100 - Math.min(100, (overdueCount / totalActiveTasks) * 200); // Double weight
  const staleScore = 100 - Math.min(100, (staleCount / totalActiveTasks) * 150);
  const noDueDateScore = 100 - Math.min(100, (noDueDateCount / totalActiveTasks) * 100);
  const labelScore = (labeledCount / totalActiveTasks) * 100;

  // Median age score: 0-7 days = 100, 8-14 days = 80, 15-30 days = 60, 31-60 days = 40, 61+ days = 20
  let medianAgeScore = 100;
  if (medianAge > 60) medianAgeScore = 20;
  else if (medianAge > 30) medianAgeScore = 40;
  else if (medianAge > 14) medianAgeScore = 60;
  else if (medianAge > 7) medianAgeScore = 80;

  // Calculate composite health score (weighted average)
  const healthScore = Math.round(
    overdueScore * 0.25 +
    staleScore * 0.25 +
    noDueDateScore * 0.20 +
    labelScore * 0.15 +
    medianAgeScore * 0.15
  );

  // Identify tasks needing attention - comprehensive criteria (single pass for performance)
  const tasksToReview: TaskToReview[] = [];

  nonRecurringTasks.forEach(task => {
    const createdAt = new Date(task.createdAt);
    // Skip tasks with invalid creation dates
    if (isNaN(createdAt.getTime())) {
      return;
    }

    const age = differenceInDays(now, createdAt);
    const dueDate = task.due?.date ? new Date(task.due.date) : null;
    const isOverdue = dueDate && dueDate < now;

    // Determine if task needs review (priority order: overdue > very stale > old unscheduled > high priority unscheduled)
    let shouldReview = false;
    let reason: 'stale' | 'overdue-high-priority' = 'stale';

    if (isOverdue) {
      // 1. Overdue tasks (any priority)
      shouldReview = true;
      reason = 'overdue-high-priority';
    } else if (age > 60) {
      // 2. Very stale tasks (60+ days old)
      shouldReview = true;
      reason = 'stale';
    } else if (age > 30 && !task.due?.date) {
      // 3. Old tasks without due dates (30+ days, no schedule)
      shouldReview = true;
      reason = 'stale';
    } else if (task.priority >= 3 && !task.due?.date) {
      // 4. High priority without due dates (P1/P2 but not scheduled)
      shouldReview = true;
      reason = 'overdue-high-priority';
    }

    if (shouldReview) {
      tasksToReview.push({
        id: task.id,
        content: task.content,
        projectId: task.projectId,
        createdAt: task.createdAt,
        age,
        reason,
        priority: task.priority,
        due: task.due
      });
    }
  });

  // Sort by urgency: overdue first, then by age
  tasksToReview.sort((a, b) => {
    if (a.reason === 'overdue-high-priority' && b.reason !== 'overdue-high-priority') return -1;
    if (b.reason === 'overdue-high-priority' && a.reason !== 'overdue-high-priority') return 1;
    return b.age - a.age;
  });

  // Limit to top 20 most actionable
  const topTasksToReview = tasksToReview.slice(0, 20);

  return {
    metrics: {
      healthScore,
      totalActiveTasks,
      overdueCount,
      staleCount,
      noDueDateCount,
      labeledCount,
      medianAge,
      recommendedWIPLimit,
      trend: 'stable' as const // Future: could track historical scores
    },
    tasksToReview: topTasksToReview,
    breakdown: {
      overdue: overdueCount,
      stale: staleCount,
      noDueDate: noDueDateCount,
      unlabeled: totalActiveTasks - labeledCount
    }
  };
}
