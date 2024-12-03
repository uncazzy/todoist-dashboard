import { CompletedTask } from '../types';

interface CreatedTasks {
  weeklyTasks: number[];
}

export function calculateCreatedTasks(tasks: CompletedTask[] | null): CreatedTasks {
  if (!tasks || tasks.length === 0) {
    console.log('No tasks provided');
    return { weeklyTasks: new Array(7).fill(0) };
  }

  // Initialize an array for the last 7 days
  const weeklyTasks = new Array(7).fill(0);
  
  // Get current date at the start of the day
  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6); // Start of 7 days ago
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let totalCounted = 0;
  tasks.forEach(task => {
    if (!task.completed_at) return;

    const completedDate = new Date(task.completed_at);
    
    // Only count tasks completed in the last 7 days
    if (completedDate >= sevenDaysAgo && completedDate <= now) {
      // Calculate days ago (0 = today, 6 = 6 days ago)
      const daysAgo = 6 - Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      weeklyTasks[daysAgo]++;
      totalCounted++;
    }
  });

  return { weeklyTasks };
}
