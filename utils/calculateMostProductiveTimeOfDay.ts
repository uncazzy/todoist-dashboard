import { CompletedTask } from '../types';

interface TaskCountsByHour {
  [hour: string]: number;
}

export interface FocusTimeRange {
  startTime: string;
  endTime: string;
  count: number;
}

export function calculateMostProductiveTimeOfDay(allCompletedTasks: CompletedTask[] | null): FocusTimeRange | null {
  const taskCountsByHour: TaskCountsByHour = {};
  
  if (!allCompletedTasks) return null;

  // Count tasks by hour
  allCompletedTasks.forEach((task) => {
    const completedDate = new Date(task.completed_at);
    const hour = completedDate.getHours();
    taskCountsByHour[hour] = (taskCountsByHour[hour] || 0) + 1;
  });

  // Find the 3-hour window with the most tasks
  let maxTasks = 0;
  let maxStartHour = 0;

  // Iterate through possible 3-hour windows
  for (let startHour = 0; startHour < 24; startHour++) {
    let windowTasks = 0;
    for (let hour = startHour; hour < startHour + 3; hour++) {
      const adjustedHour = hour % 24;
      windowTasks += taskCountsByHour[adjustedHour] || 0;
    }

    if (windowTasks > maxTasks) {
      maxTasks = windowTasks;
      maxStartHour = startHour;
    }
  }

  // Format the time range
  const formatHour = (hour: number): string => {
    const adjustedHour = hour % 24;
    const period = adjustedHour < 12 ? 'AM' : 'PM';
    const displayHour = adjustedHour % 12 || 12;
    return `${displayHour}${period}`;
  };

  return {
    startTime: formatHour(maxStartHour),
    endTime: formatHour(maxStartHour + 3),
    count: maxTasks
  };
}
