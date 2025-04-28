import { CompletedTask, ActiveTask } from '../types';

interface LeadTimeBucket {
  name: string;
  count: number;
  percentage: number;
}

export interface LeadTimeStats {
  averageLeadTime: number;
  medianLeadTime: number;
  buckets: LeadTimeBucket[];
  totalTasks: number;
}

/**
 * Calculate lead time statistics for completed tasks
 * Lead time is the duration between task creation and completion
 */
export function calculateLeadTimeStats(completedTasks: CompletedTask[], activeTasks: ActiveTask[] = []): LeadTimeStats {
  // Filter tasks that have both creation and completion dates
  const tasksWithDates = completedTasks.filter(task => {
    // Try to find matching active task to get creation date
    const matchingTask = activeTasks.find(activeTask => activeTask.id === task.task_id);
    return Boolean(matchingTask?.createdAt && task.completed_at);
  });

  // If no valid tasks, return default stats
  if (tasksWithDates.length === 0) {
    return {
      averageLeadTime: 0,
      medianLeadTime: 0,
      buckets: [],
      totalTasks: 0
    };
  }

  // Calculate lead times in days for each task
  const leadTimes = tasksWithDates.map(task => {
    const matchingTask = activeTasks.find(activeTask => activeTask.id === task.task_id);
    // Early return if no matching task with createdAt
    if (!matchingTask || !matchingTask.createdAt) return 0;
    
    const createdAt = new Date(matchingTask.createdAt);
    const completedAt = new Date(task.completed_at);
    
    // Calculate difference in milliseconds
    const diffTime = completedAt.getTime() - createdAt.getTime();
    // Convert to days
    return diffTime / (1000 * 3600 * 24);
  }).filter(time => time > 0); // Filter out invalid times

  // Calculate average lead time
  const totalLeadTime = leadTimes.reduce((sum, time) => sum + time, 0);
  const averageLeadTime = leadTimes.length > 0 ? totalLeadTime / leadTimes.length : 0;

  // Calculate median lead time
  const sortedLeadTimes = [...leadTimes].sort((a, b) => a - b);
  const midIndex = Math.floor(sortedLeadTimes.length / 2);
  let medianLeadTime = 0;
  
  if (sortedLeadTimes.length > 0) {
    if (sortedLeadTimes.length % 2 === 0) {
      const midValue1 = sortedLeadTimes[midIndex - 1] || 0;
      const midValue2 = sortedLeadTimes[midIndex] || 0;
      medianLeadTime = (midValue1 + midValue2) / 2;
    } else {
      medianLeadTime = sortedLeadTimes[midIndex] || 0;
    }
  }

  // Define lead time buckets
  const bucketRanges = [
    { name: "Less than 1 day", max: 1 },
    { name: "1-3 days", max: 3 },
    { name: "3-7 days", max: 7 },
    { name: "7-14 days", max: 14 },
    { name: "14+ days", max: Infinity }
  ];

  // Count tasks in each bucket
  const bucketCounts = bucketRanges.map((bucket, index) => {
    let count = 0;
    if (index === 0) {
      // First bucket: less than max
      count = leadTimes.filter(time => time < bucket.max).length;
    } else {
      // Other buckets: between prev.max and this.max
      const prevMax = bucketRanges[index - 1]?.max || 0;
      count = leadTimes.filter(time => time >= prevMax && time < bucket.max).length;
    }
    return { 
      name: bucket.name, 
      count,
      percentage: leadTimes.length > 0 ? (count / leadTimes.length) * 100 : 0
    };
  });

  return {
    averageLeadTime,
    medianLeadTime,
    buckets: bucketCounts,
    totalTasks: leadTimes.length
  };
} 