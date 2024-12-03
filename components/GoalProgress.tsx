import React, { useState, useEffect } from 'react';
import { BsQuestionCircle } from 'react-icons/bs';

interface Task {
  completed_at: string;
}

interface Goals {
  current_daily_streak?: {
    count: number;
  };
  max_daily_streak?: {
    count: number;
  };
  current_weekly_streak?: {
    count: number;
  };
  max_weekly_streak?: {
    count: number;
  };
}

interface StatsData {
  goals: Goals;
}

interface AllData {
  allCompletedTasks: Task[];
}

interface GoalProgressProps {
  allData: AllData;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  tooltip: string;
  color?: 'blue' | 'green' | 'yellow';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, tooltip, color = 'blue' }) => (
  <div
    className="bg-gray-800 p-4 rounded-lg print:bg-transparent print:border print:border-gray-100"
    data-tooltip-id="insights-tooltip"
    data-tooltip-content={tooltip}
  >
    <div className="h-full flex flex-col justify-between gap-2">
      <div className="text-sm text-gray-400 print:text-gray-600">
        {title} <BsQuestionCircle className="inline h-4 w-4 text-gray-400 cursor-help print:text-gray-500" />
      </div>
      <div className={`text-xl font-semibold text-${color}-400 print:text-${color}-600`}>{value}</div>
    </div>
  </div>
);

const GoalProgress: React.FC<GoalProgressProps> = ({ allData }) => {
  const { allCompletedTasks } = allData;
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await fetch('/api/getStats');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch stats data');
        }
        const data = await response.json();
        setStatsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        console.error('Error fetching stats:', err);
      }
    };

    fetchStatsData();
  }, []);

  if (!statsData) return null;

  const { goals } = statsData;

  // Calculate daily completion goals and actuals
  const last30Days = [...Array(30)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const actualCompletions = last30Days.map(date => {
    return allCompletedTasks.filter(task =>
      task.completed_at.split('T')[0] === date
    ).length;
  });

  // Calculate weekly completions
  const weeklyCompletions: number[] = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = i * 7;
    const weekEnd = weekStart + 7;
    const weekTotal = actualCompletions.slice(weekStart, weekEnd).reduce((a, b) => a + b, 0);
    weeklyCompletions.push(weekTotal);
  }

  // Calculate achievement metrics
  const totalCompleted = actualCompletions.reduce((a, b) => a + b, 0);

  // Get streak data from the API
  const currentDailyStreak = goals?.current_daily_streak?.count || 0;
  const bestDailyStreak = goals?.max_daily_streak?.count || 0;
  const currentWeeklyStreak = goals?.current_weekly_streak?.count || 0;
  const bestWeeklyStreak = goals?.max_weekly_streak?.count || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 print:gap-6">
      {error && <div className="text-red-500">{error}</div>}
      <MetricCard
        title="30-Day Total"
        value={totalCompleted}
        tooltip="Total tasks completed over the last 30 days"
        color="green"
      />
      <MetricCard
        title="Current Daily Streak"
        value={`${currentDailyStreak} days`}
        tooltip="Your current streak of consecutive days meeting or exceeding your daily goal"
        color="blue"
      />
      <MetricCard
        title="Best Daily Streak"
        value={`${bestDailyStreak} days`}
        tooltip="Your longest streak of consecutive days meeting or exceeding your daily goal"
        color="yellow"
      />
      <MetricCard
        title="Current Weekly Streak"
        value={`${currentWeeklyStreak} weeks`}
        tooltip="Your current streak of consecutive weeks meeting or exceeding your weekly goal"
        color="blue"
      />
      <MetricCard
        title="Best Weekly Streak"
        value={`${bestWeeklyStreak} weeks`}
        tooltip="Your longest streak of consecutive weeks meeting or exceeding your weekly goal"
        color="yellow"
      />
    </div>
  );
};

export default GoalProgress;
