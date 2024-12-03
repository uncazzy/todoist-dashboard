import { CompletedTask } from '../types';
import { DayOfWeek } from './getDayOfWeekName';

interface DayOfWeekStats {
  dayOfWeek: DayOfWeek;
  averageCount: number;
}

export function calculateMostProductiveDayOfWeek(completedTasks: CompletedTask[]): DayOfWeekStats | null {
  if (!completedTasks || completedTasks.length === 0) {
    return null;
  }

  // Initialize counters for each day of the week
  const dayCounts = new Array(7).fill(0);
  const dayTotals = new Array(7).fill(0);

  // Get the current date
  const currentDate = new Date();
  
  // Calculate the date 4 weeks ago
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(currentDate.getDate() - 28);

  // Filter tasks from the last 4 weeks
  const recentTasks = completedTasks.filter(task => {
    const taskDate = new Date(task.completed_at);
    return taskDate >= fourWeeksAgo && taskDate <= currentDate;
  });

  // Count tasks for each day of the week
  recentTasks.forEach(task => {
    const taskDate = new Date(task.completed_at);
    const dayOfWeek = taskDate.getDay() as DayOfWeek;
    dayCounts[dayOfWeek]++;
  });

  // Calculate which days occurred in the 4-week period
  const startDay = fourWeeksAgo.getDay();
  const endDay = currentDate.getDay();
  
  // Count occurrences of each day in the period
  for (let i = 0; i < 7; i++) {
    let dayCount = 4; // Most days will appear 4 times
    if (i < startDay) dayCount--; // First week might not include earlier days
    if (i > endDay) dayCount--; // Last week might not include later days
    dayTotals[i] = dayCount;
  }

  // Calculate averages and find the most productive day
  let maxAverage = -1;
  let mostProductiveDay: DayOfWeek = 0;

  dayCounts.forEach((count, day) => {
    const average = dayTotals[day] > 0 ? count / dayTotals[day] : 0;
    if (average > maxAverage) {
      maxAverage = average;
      mostProductiveDay = day as DayOfWeek;
    }
  });

  return {
    dayOfWeek: mostProductiveDay,
    averageCount: maxAverage
  };
}
