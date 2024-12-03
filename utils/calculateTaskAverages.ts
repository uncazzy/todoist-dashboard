import { CompletedTask } from '../types';
import { 
  startOfDay, endOfDay, eachDayOfInterval, subDays, 
  subWeeks, subMonths, startOfWeek, format 
} from 'date-fns';

interface TaskHistory {
  labels: string[];
  data: number[];
}

interface TaskPeriodStats {
  average: number;
  percentChange: number;
  history: TaskHistory;
}

interface TaskAverages {
  last24Hours: TaskPeriodStats;
  last7Days: TaskPeriodStats;
  last30Days: TaskPeriodStats;
}

export function calculateTaskAverages(tasks: CompletedTask[] | null): TaskAverages | null {
  if (!Array.isArray(tasks)) {
    console.error('Invalid tasks array:', tasks);
    return null;
  }

  const now = new Date();
  const yearStart = new Date();
  yearStart.setFullYear(yearStart.getFullYear() - 1);

  // Filter tasks to last year and sort by date
  const validTasks = tasks
    .filter(task => {
      const date = new Date(task.completed_at);
      return date >= yearStart && date <= now;
    })
    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

  if (validTasks.length === 0) return null;

  // Calculate daily stats using last 4 weeks of data
  const today = new Date();
  const fourWeeksAgo = subWeeks(today, 4);
  const dailyTaskCounts = validTasks
    .filter(task => {
      const date = new Date(task.completed_at);
      return date >= startOfDay(fourWeeksAgo) && date <= endOfDay(today);
    })
    .reduce((acc: { [key: string]: number }, task) => {
      const date = new Date(task.completed_at);
      const dayKey = format(date, 'yyyy-MM-dd');
      acc[dayKey] = (acc[dayKey] || 0) + 1;
      return acc;
    }, {});

  const dailyAverage = Math.round(
    Object.values(dailyTaskCounts).reduce((sum, count) => sum + count, 0) / 
    Object.keys(dailyTaskCounts).length
  );

  // Get today's task count
  const todayCount = validTasks.filter(task => {
    const date = new Date(task.completed_at);
    return date >= startOfDay(today) && date <= endOfDay(today);
  }).length;

  // Calculate daily percent change against historical average
  const dailyPercentChange = dailyAverage === 0 ? 0 :
    Math.round(((todayCount - dailyAverage) / dailyAverage) * 100);

  // Weekly stats using last 12 weeks
  const twelveWeeksAgo = subWeeks(today, 12);
  const weeklyTaskCounts = validTasks
    .filter(task => {
      const date = new Date(task.completed_at);
      return date >= startOfDay(twelveWeeksAgo) && date <= endOfDay(today);
    })
    .reduce((acc: { [key: string]: number }, task) => {
      const date = new Date(task.completed_at);
      const weekStart = startOfWeek(date);
      const weekKey = format(weekStart, 'yyyy-ww');
      acc[weekKey] = (acc[weekKey] || 0) + 1;
      return acc;
    }, {});

  const weeklyAverage = Math.round(
    Object.values(weeklyTaskCounts).reduce((sum, count) => sum + count, 0) / 
    Object.keys(weeklyTaskCounts).length
  );

  // Current week's task count (last 7 days)
  const thisWeekCount = validTasks.filter(task => {
    const date = new Date(task.completed_at);
    const sevenDaysAgo = subDays(today, 6);
    return date >= startOfDay(sevenDaysAgo) && date <= endOfDay(today);
  }).length;

  // Calculate weekly percent change against historical average
  const weeklyPercentChange = weeklyAverage === 0 ? 0 :
    Math.round(((thisWeekCount - weeklyAverage) / weeklyAverage) * 100);

  // Monthly stats using last 12 months
  const twelveMonthsAgo = subMonths(today, 12);
  const monthlyTaskCounts = validTasks
    .filter(task => {
      const date = new Date(task.completed_at);
      return date >= startOfDay(twelveMonthsAgo) && date <= endOfDay(today);
    })
    .reduce((acc: { [key: string]: number }, task) => {
      const date = new Date(task.completed_at);
      const monthKey = format(date, 'yyyy-MM');
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

  const monthlyAverage = Math.round(
    Object.values(monthlyTaskCounts).reduce((sum, count) => sum + count, 0) / 
    Object.keys(monthlyTaskCounts).length
  );

  // Current month's task count (last 30 days)
  const thisMonthCount = validTasks.filter(task => {
    const date = new Date(task.completed_at);
    const thirtyDaysAgo = subDays(today, 29);
    return date >= startOfDay(thirtyDaysAgo) && date <= endOfDay(today);
  }).length;

  // Calculate monthly percent change against historical average
  const monthlyPercentChange = monthlyAverage === 0 ? 0 :
    Math.round(((thisMonthCount - monthlyAverage) / monthlyAverage) * 100);

  // Group by days for the 24h chart
  const sevenDaysAgo = subDays(today, 6);
  
  const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });
  const dailyData: { [key: string]: number } = {};
  
  // Initialize all days with 0
  days.forEach(day => {
    dailyData[format(day, 'yyyy-MM-dd')] = 0;
  });

  // Count tasks for each day
  validTasks.forEach(task => {
    const completedDate = new Date(task.completed_at);
    const dayKey = format(startOfDay(completedDate), 'yyyy-MM-dd');
    if (completedDate >= startOfDay(sevenDaysAgo) && completedDate <= endOfDay(today)) {
      dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
    }
  });

  // Convert to arrays for charts
  const dailyChartData = days.map(date => ({
    count: dailyData[format(date, 'yyyy-MM-dd')] || 0,
    label: format(date, 'EEE')
  }));

  // Group by weeks for the chart
  const weeklyData: { [key: string]: number } = {};
  validTasks.forEach(task => {
    const date = new Date(task.completed_at);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
  });

  // Group by months for the chart
  const monthlyData: { [key: string]: number } = {};
  validTasks.forEach(task => {
    const date = new Date(task.completed_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  // Convert to arrays for charts
  const weeklyChartData = Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, count]) => ({
      count,
      label: `Week ${key.split('-W')[1]}`
    }));

  const monthlyChartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, count]) => {
      const parts = key.split('-');
      const year = parts[0] ? parseInt(parts[0]) : new Date().getFullYear();
      const month = parts[1] ? parseInt(parts[1]) - 1 : new Date().getMonth();
      
      return {
        count,
        label: new Date(year, month).toLocaleString('default', { month: 'short' })
      };
    });

  return {
    last24Hours: {
      average: dailyAverage,
      percentChange: dailyPercentChange,
      history: {
        labels: dailyChartData.map(d => d.label),
        data: dailyChartData.map(d => d.count)
      }
    },
    last7Days: {
      average: weeklyAverage,
      percentChange: weeklyPercentChange,
      history: {
        labels: weeklyChartData.map(w => w.label),
        data: weeklyChartData.map(w => w.count)
      }
    },
    last30Days: {
      average: monthlyAverage,
      percentChange: monthlyPercentChange,
      history: {
        labels: monthlyChartData.map(m => m.label),
        data: monthlyChartData.map(m => m.count)
      }
    }
  };
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
