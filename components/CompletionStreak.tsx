import React, { useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { AiFillFire } from 'react-icons/ai';
import { BsStars } from 'react-icons/bs';

interface CompletedTask {
  completed_at: string;
}

interface AllData {
  allCompletedTasks: CompletedTask[];
}

interface CompletionStreakProps {
  allData: AllData;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  hasTasksToday: boolean;
  todayCount: number;
}

interface TasksByDate {
  [date: string]: CompletedTask[];
}

export default function CompletionStreak({ allData }: CompletionStreakProps) {
  const { allCompletedTasks } = allData;

  const streakInfo = useMemo<StreakInfo>(() => {
    // Sort tasks by completion date
    const sortedTasks = [...allCompletedTasks].sort((a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );

    // Group tasks by date
    const tasksByDate = sortedTasks.reduce<TasksByDate>((acc, task) => {
      const date = format(parseISO(task.completed_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {});

    // Calculate current streak
    let currentStreak = 0;
    let date = new Date();
    let todayCount = 0;

    while (true) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const tasksToday = tasksByDate[dateStr] ?? [];
      const hasTasksOnDay = tasksToday.length > 0;

      if (hasTasksOnDay) {
        currentStreak++;
        if (currentStreak === 1) {
          todayCount = tasksToday.length;
        }
      } else {
        break;
      }

      date.setDate(date.getDate() - 1);
    }

    // Calculate longest streak
    let longestStreak = 0;
    let currentCount = 0;
    const dates = Object.keys(tasksByDate).sort();

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentCount = 1;
      } else {
        const currentDate = dates[i];
        const previousDate = dates[i - 1];

        if (currentDate && previousDate) {
          const diff = differenceInDays(
            parseISO(currentDate),
            parseISO(previousDate)
          );

          if (diff === 1) {
            currentCount++;
          } else {
            longestStreak = Math.max(longestStreak, currentCount);
            currentCount = 1;
          }
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentCount);

    return {
      currentStreak,
      longestStreak,
      hasTasksToday: (tasksByDate[format(new Date(), 'yyyy-MM-dd')] ?? []).length > 0,
      todayCount
    };
  }, [allCompletedTasks]);


  return (
    <div className="flex items-center justify-between gap-6 flex-wrap">
      {/* Current Streak */}
      <div
        className="bg-warm-hover border border-warm-border p-6 rounded-2xl flex-1 min-w-[200px] hover:bg-warm-card transition-colors print:bg-transparent print:border print:border-gray-100"
        data-tooltip-id="insights-tooltip"
        data-tooltip-content="Your current streak of consecutive days completing tasks"
      >
        <div className="flex items-center justify-center space-x-3 mb-2">
          <AiFillFire className="text-4xl text-warm-peach print:text-orange-600" />
          <span className="text-4xl font-bold text-warm-peach print:text-orange-600">
            {streakInfo.currentStreak}
          </span>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white print:text-gray-700">
            Current Streak
          </div>
          <div className="text-sm text-warm-gray mt-1 print:text-gray-600">
            {streakInfo.hasTasksToday
              ? `${streakInfo.todayCount} ${streakInfo.todayCount === 1 ? 'task' : 'tasks'} completed today`
              : "Complete a task to start a new streak!"}
          </div>
        </div>
      </div>

      {/* Best Streak */}
      <div
        className="bg-warm-hover border border-warm-border p-6 rounded-2xl flex-1 min-w-[200px] hover:bg-warm-card transition-colors print:bg-transparent print:border print:border-gray-100"
        data-tooltip-id="insights-tooltip"
        data-tooltip-content="Your longest streak of consecutive days completing tasks"
      >
        <div className="flex items-center justify-center space-x-3 mb-2">
          <BsStars className="text-4xl text-warm-sage print:text-yellow-600" />
          <span className="text-4xl font-bold text-warm-sage print:text-yellow-600">
            {streakInfo.longestStreak}
          </span>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white print:text-gray-700">
            Longest Streak
          </div>
          <div className="text-sm text-warm-gray mt-1 print:text-gray-600">
            Consecutive days with tasks from available history
          </div>
        </div>
      </div>
    </div>
  );
}
