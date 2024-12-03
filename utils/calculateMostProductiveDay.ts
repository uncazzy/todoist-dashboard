import { CompletedTask } from '../types';

interface MostProductiveDay {
  date: string;
  count: number;
}

interface TaskCountsByDate {
  [date: string]: number;
}

export function calculateMostProductiveDay(allCompletedTasks: CompletedTask[] | null): MostProductiveDay | null {
  const taskCountsByDate: TaskCountsByDate = {};

  // Group tasks by date
  if (allCompletedTasks) {
    allCompletedTasks.forEach((task) => {
      const completedDate = new Date(task.completed_at);

      // Format the date as "Month Day, Year" (e.g., "May 1, 2023")
      const formattedDate = completedDate.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (taskCountsByDate[formattedDate]) {
        taskCountsByDate[formattedDate]++;
      } else {
        taskCountsByDate[formattedDate] = 1;
      }
    });
  }

  // Find the day with the highest task count
  let mostProductiveDay: MostProductiveDay | null = null;
  let highestTaskCount = 0;

  Object.entries(taskCountsByDate).forEach(([date, count]) => {
    if (count > highestTaskCount) {
      mostProductiveDay = { date, count };
      highestTaskCount = count;
    }
  });

  return mostProductiveDay;
}
