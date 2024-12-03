import { CompletedTask } from '../types';
import { 
  startOfDay, endOfDay, subDays, 
  subWeeks, subMonths
} from 'date-fns';

interface CompletionRates {
  dailyCompletionRate: number;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  weeklyTasks: { date: string; count: number }[];
}

export function calculateCompletionRates(tasks: CompletedTask[]): CompletionRates {
  if (!tasks || tasks.length === 0) {
    return {
      dailyCompletionRate: 0,
      weeklyCompletionRate: 0,
      monthlyCompletionRate: 0,
      weeklyTasks: []
    };
  }

  const today = new Date();

  // Calculate current period tasks
  const last24Hours = tasks.filter(task => {
    const date = new Date(task.completed_at);
    return date >= startOfDay(today) && date <= endOfDay(today);
  }).length;

  const last7Days = tasks.filter(task => {
    const date = new Date(task.completed_at);
    const sevenDaysAgo = subDays(today, 6);
    return date >= startOfDay(sevenDaysAgo) && date <= endOfDay(today);
  }).length;

  const last30Days = tasks.filter(task => {
    const date = new Date(task.completed_at);
    const thirtyDaysAgo = subDays(today, 29);
    return date >= startOfDay(thirtyDaysAgo) && date <= endOfDay(today);
  }).length;

  // Calculate historical averages using same periods as calculateTaskAverages
  const fourWeeksAgo = subWeeks(today, 4);
  const twelveWeeksAgo = subWeeks(today, 12);
  const twelveMonthsAgo = subMonths(today, 12);

  // Daily average (last 4 weeks, excluding today)
  const dailyHistoricalTasks = tasks.filter(task => {
    const date = new Date(task.completed_at);
    return date >= startOfDay(fourWeeksAgo) && date < startOfDay(today);
  });
  const dailyAverage = Math.round(dailyHistoricalTasks.length / 28);

  // Weekly average (last 12 weeks, excluding current week)
  const weeklyHistoricalTasks = tasks.filter(task => {
    const date = new Date(task.completed_at);
    const sevenDaysAgo = subDays(today, 6);
    return date >= startOfDay(twelveWeeksAgo) && date < startOfDay(sevenDaysAgo);
  });
  const weeklyAverage = Math.round(weeklyHistoricalTasks.length / 12);

  // Monthly average (last 12 months, excluding current month)
  const monthlyHistoricalTasks = tasks.filter(task => {
    const date = new Date(task.completed_at);
    const thirtyDaysAgo = subDays(today, 29);
    return date >= startOfDay(twelveMonthsAgo) && date < startOfDay(thirtyDaysAgo);
  });
  const monthlyAverage = Math.round(monthlyHistoricalTasks.length / 12);

  // Calculate rates based on current vs average
  const dailyRate = Math.round((last24Hours / Math.max(1, dailyAverage)) * 100);
  const weeklyRate = Math.round((last7Days / Math.max(1, weeklyAverage)) * 100);
  const monthlyRate = Math.round((last30Days / Math.max(1, monthlyAverage)) * 100);

  // Group tasks by week for the chart (keep this part unchanged)
  const weeklyTasks = tasks
    .filter(task => {
      const date = new Date(task.completed_at);
      return date >= new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    })
    .reduce((acc: { date: string; count: number }[], task) => {
      const date = new Date(task.completed_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0] ?? '';
      
      const existingWeek = acc.find(w => w.date === weekKey);
      if (existingWeek) {
        existingWeek.count++;
      } else {
        acc.push({ date: weekKey, count: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    dailyCompletionRate: dailyRate,
    weeklyCompletionRate: weeklyRate,
    monthlyCompletionRate: monthlyRate,
    weeklyTasks
  };
}
