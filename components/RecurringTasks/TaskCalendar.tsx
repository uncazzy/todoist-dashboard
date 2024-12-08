import React, { useCallback, useMemo } from 'react';
import { format, isEqual, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, subDays, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { BsCalendar3 } from 'react-icons/bs';
import { IoMdTrendingUp } from 'react-icons/io';
import { FaCheckCircle } from 'react-icons/fa';
import { ActiveTask, ProjectData } from '../../types';
import { TaskStats } from './types';
import { Tooltip } from 'react-tooltip';
import { Sparklines, SparklinesLine, SparklinesBars } from 'react-sparklines';

interface TaskCalendarProps {
  taskData: TaskStats;
  task: ActiveTask;
  project?: ProjectData | undefined;
}

const weekDays = [
  { key: 'sun', label: 'S' },
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' }
];

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ taskData, task, project }) => {
  const isCompleted = useCallback((date: Date): boolean => {
    return taskData.completionDates.some(
      completionDate => format(completionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  }, [taskData.completionDates]);

  const getCalendarDays = useCallback((monthsAgo: number) => {
    const start = startOfMonth(subMonths(new Date(), monthsAgo));
    const end = endOfMonth(subMonths(new Date(), monthsAgo));
    const days = eachDayOfInterval({ start, end });
    const startPadding = getDay(start);
    const paddedDays = Array(startPadding).fill(null).concat(days);

    return {
      month: format(start, 'MMM yyyy'),
      days: paddedDays
    };
  }, []);

  // Calculate completion rate based on task frequency
  const calculateCompletionRate = useCallback(() => {
    if (!task.due?.string) return 0;
    const lower = task.due.string.toLowerCase();
    const today = new Date();

    // Sort completion dates
    const sortedCompletions = [...taskData.completionDates].sort((a, b) => a.getTime() - b.getTime());
    if (sortedCompletions.length === 0) return 0;

    // Look back 90 days to get a good sample
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);

    // Filter completions within our date range
    const recentCompletions = sortedCompletions.filter(date =>
      (isBefore(startDate, date) || isEqual(startDate, date)) &&
      (isBefore(date, today) || isEqual(date, today))
    );

    if (recentCompletions.length === 0) return 0;

    // For "every other" patterns, calculate based on actual intervals
    if (lower.includes('every other')) {
      // Get the weekday if it's "every other Monday" etc.
      const weekdayMatch = lower.match(/every other (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);

      if (weekdayMatch?.[1]) {
        const weekday = weekdayMatch[1].toLowerCase();
        // Filter all matching weekdays in our date range
        const days = eachDayOfInterval({ start: startDate, end: today });
        const expectedDays = days.filter(date =>
          format(date, 'EEEE').toLowerCase() === weekday &&
          (isBefore(date, today) || isEqual(date, today))
        );

        // Count every other occurrence as expected
        let expectedCount = Math.ceil(expectedDays.length / 2);
        let completedCount = recentCompletions.filter(date =>
          format(date, 'EEEE').toLowerCase() === weekday
        ).length;

        return Math.round((completedCount / expectedCount) * 100);
      } else {
        // "every other day" pattern
        const days = eachDayOfInterval({ start: startDate, end: today });
        const expectedCount = Math.ceil(days.length / 2);
        return Math.round((recentCompletions.length / expectedCount) * 100);
      }
    }

    // For weekly tasks
    if (lower.includes('every') && !lower.includes('month')) {
      const weekdayMatch = lower.match(/every (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
      if (weekdayMatch?.[1]) {
        // Normalize day names
        const dayMap: { [key: string]: string } = {
          sun: 'sunday',
          mon: 'monday',
          tue: 'tuesday',
          wed: 'wednesday',
          thu: 'thursday',
          fri: 'friday',
          sat: 'saturday'
        };
        const weekday = dayMap[weekdayMatch[1].toLowerCase()] || weekdayMatch[1].toLowerCase();
        const days = eachDayOfInterval({ start: startDate, end: today });
        const expectedDays = days.filter(date =>
          format(date, 'EEEE').toLowerCase() === weekday &&
          (isBefore(date, today) || isEqual(date, today))
        );

        const completedCount = recentCompletions.filter(date =>
          format(date, 'EEEE').toLowerCase() === weekday
        ).length;

        return Math.round((completedCount / expectedDays.length) * 100);
      }
    }

    // For monthly tasks
    if (lower.includes('every') && lower.includes('month')) {
      const dayMatch = lower.match(/(\d{1,2})(st|nd|rd|th)?/);
      if (dayMatch?.[1]) {
        const targetDay = dayMatch[1];
        const days = eachDayOfInterval({ start: startDate, end: today });
        const expectedDays = days.filter(date =>
          format(date, 'd') === targetDay &&
          (isBefore(date, today) || isEqual(date, today))
        );
        return Math.round((recentCompletions.length / expectedDays.length) * 100);
      }
    }

    // For daily tasks
    if (lower.includes('every day') || lower.includes('daily')) {
      const days = eachDayOfInterval({ start: startDate, end: today });
      return Math.round((recentCompletions.length / days.length) * 100);
    }

    // For other patterns (every X days)
    const xDaysMatch = lower.match(/every (\d+) days?/);
    if (xDaysMatch?.[1]) {
      const interval = parseInt(xDaysMatch[1]);
      const days = eachDayOfInterval({ start: startDate, end: today });
      const expectedCount = Math.ceil(days.length / interval);
      return Math.round((recentCompletions.length / expectedCount) * 100);
    }

    return 0;
  }, [task.due?.string, taskData.completionDates]);

  // Calculate streak based on completion pattern
  const calculateStreak = useCallback(() => {
    if (!task.due?.string) return 0;
    const lower = task.due.string.toLowerCase();
    const today = new Date();

    // Sort completion dates in descending order (newest first)
    const sortedCompletions = [...taskData.completionDates]
      .sort((a, b) => b.getTime() - a.getTime())
      .filter(date => isBefore(date, today) || isEqual(date, today));

    if (sortedCompletions.length === 0) return 0;

    // For weekly tasks
    if (lower.includes('every') && !lower.includes('month') && !lower.includes('other')) {
      const weekdayMatch = lower.match(/every (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
      if (weekdayMatch?.[1]) {
        // Normalize day names
        const dayMap: { [key: string]: string } = {
          sun: 'sunday',
          mon: 'monday',
          tue: 'tuesday',
          wed: 'wednesday',
          thu: 'thursday',
          fri: 'friday',
          sat: 'saturday'
        };
        const weekday = dayMap[weekdayMatch[1].toLowerCase()] || weekdayMatch[1].toLowerCase();
        let streak = 0;
        let lastExpectedDate = today;

        // Find the most recent occurrence of the weekday
        while (format(lastExpectedDate, 'EEEE').toLowerCase() !== weekday) {
          lastExpectedDate = subDays(lastExpectedDate, 1);
        }

        while (true) {
          const completed = sortedCompletions.some(date =>
            format(date, 'yyyy-MM-dd') === format(lastExpectedDate, 'yyyy-MM-dd')
          );

          if (!completed) break;
          streak++;
          lastExpectedDate = subDays(lastExpectedDate, 7); // Move to previous week
        }

        return streak;
      }
    }

    // For "every other" patterns
    if (lower.includes('every other')) {
      const weekdayMatch = lower.match(/every other (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);

      if (weekdayMatch?.[1]) {
        const weekday = weekdayMatch[1].toLowerCase();
        let streak = 0;
        let lastExpectedDate = today;

        while (format(lastExpectedDate, 'EEEE').toLowerCase() !== weekday) {
          lastExpectedDate = subDays(lastExpectedDate, 1);
        }

        while (true) {
          const completed = sortedCompletions.some(date =>
            format(date, 'yyyy-MM-dd') === format(lastExpectedDate, 'yyyy-MM-dd')
          );

          if (!completed) break;
          streak++;
          lastExpectedDate = subDays(lastExpectedDate, 14); // Skip two weeks for "every other"
        }

        return streak;
      }
    }

    // For other patterns, keep the existing streak calculation
    return taskData.currentStreak;
  }, [task.due?.string, taskData.completionDates, taskData.currentStreak]);

  // Calculate stats including longest streak and total completions
  const calculateStats = useCallback(() => {
    if (!task.due?.string) return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
    const lower = task.due.string.toLowerCase();
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);

    // Get completions within 6 month window
    const recentCompletions = taskData.completionDates
      .filter(date =>
        (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) &&
        (isBefore(date, today) || isEqual(date, today))
      )
      .sort((a, b) => b.getTime() - a.getTime());

    const totalCompletions = recentCompletions.length;
    const completionRate = calculateCompletionRate();

    // Calculate longest streak within 6 months
    let longestStreak = 0;
    let currentStreak = 0;

    if (lower.includes('every') && !lower.includes('month') && !lower.includes('other')) {
      // Weekly tasks
      const weekdayMatch = lower.match(/every (monday|tuesday|wednesday|thursday|friday|saturday|sunday|sun|mon|tue|wed|thu|fri|sat)/i);
      if (weekdayMatch?.[1]) {
        const dayMap: { [key: string]: string } = {
          sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday',
          thu: 'thursday', fri: 'friday', sat: 'saturday'
        };
        const weekday = dayMap[weekdayMatch[1].toLowerCase()] || weekdayMatch[1].toLowerCase();

        let tempStreak = 0;
        let date = today;

        // Find most recent occurrence of weekday
        while (format(date, 'EEEE').toLowerCase() !== weekday) {
          date = subDays(date, 1);
        }

        while (isBefore(sixMonthsAgo, date) || isEqual(sixMonthsAgo, date)) {
          const completed = recentCompletions.some(d =>
            format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
          );

          if (completed) {
            tempStreak++;
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            if (isBefore(sixMonthsAgo, date)) currentStreak = tempStreak;
          } else {
            tempStreak = 0;
          }
          date = subDays(date, 7);
        }
      }
    } else if (lower.includes('every other')) {
      // Handle "every other" patterns similarly but with 14-day intervals
      // ... existing every other logic ...
      currentStreak = calculateStreak();
      longestStreak = currentStreak; // For now, we'll use current streak as longest
    }

    return {
      currentStreak,
      longestStreak,
      totalCompletions,
      completionRate
    };
  }, [task.due?.string, taskData.completionDates, calculateCompletionRate, calculateStreak]);

  const stats = useMemo(() => calculateStats(), [calculateStats]);

  // Calculate completion trend data
  const getTrendData = useCallback(() => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    const weeks = eachWeekOfInterval({ start: sixMonthsAgo, end: today });

    // Get the pattern type
    const pattern = task.due?.string?.toLowerCase() || '';
    const isWeekly = pattern.includes('every') && !pattern.includes('month') && !pattern.includes('other');
    const isMonthly = pattern.includes('month');
    const isBiWeekly = pattern.includes('every other');

    // For weekly/bi-weekly tasks, calculate weekly completion rate
    if (isWeekly || isBiWeekly) {
      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart);
        const completionsInWeek = taskData.completionDates.filter(date =>
          (isBefore(weekStart, date) || isEqual(weekStart, date)) &&
          (isBefore(date, weekEnd) || isEqual(date, weekEnd))
        ).length;

        // Bi-weekly tasks should only expect completion every other week
        const expectedCompletions = isBiWeekly ? 0.5 : 1;
        return (completionsInWeek / expectedCompletions) * 100;
      });
    }

    // For monthly tasks, calculate monthly completion rate
    if (isMonthly) {
      return Array.from({ length: 6 }, (_, i) => {
        const monthStart = startOfMonth(subMonths(today, 5 - i));
        const monthEnd = endOfMonth(monthStart);
        const completionsInMonth = taskData.completionDates.filter(date =>
          (isBefore(monthStart, date) || isEqual(monthStart, date)) &&
          (isBefore(date, monthEnd) || isEqual(date, monthEnd))
        ).length;
        return (completionsInMonth / 1) * 100;
      });
    }

    // For daily tasks, calculate weekly average completion rate
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const completionsInWeek = taskData.completionDates.filter(date =>
        (isBefore(weekStart, date) || isEqual(weekStart, date)) &&
        (isBefore(date, weekEnd) || isEqual(date, weekEnd))
      ).length;
      return (completionsInWeek / daysInWeek.length) * 100;
    });
  }, [task.due?.string, taskData.completionDates]);

  const trendData = useMemo(() => getTrendData(), [getTrendData]);

  // Get descriptive text for the recurrence pattern
  const getRecurrenceDescription = useCallback(() => {
    if (!task.due?.string) return '';
    const lower = task.due.string.toLowerCase();
    if (lower.includes('every other')) {
      return 'bi-weekly';
    } else if (lower.includes('every') && !lower.includes('month')) {
      return 'weekly';
    } else if (lower.includes('month')) {
      return 'monthly';
    }
    return 'daily';
  }, [task.due?.string]);

  // Memoize months calculation
  const months = useMemo(() =>
    [0, 1, 2, 3, 4, 5].map(getCalendarDays),
    [getCalendarDays]
  );

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="space-y-1">
          <h3 className="font-medium text-gray-200">{task.content}</h3>
          <div className="flex items-center gap-2 text-sm">
            {project && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-opacity-20">
                {project.name}
              </span>
            )}
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <BsCalendar3 className="w-3 h-3" />
              {task.due?.string || 'No recurrence'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <div
              className="text-sm text-gray-400 flex items-center gap-1 cursor-help"
              data-tooltip-id="task-calendar-tooltip"
              data-tooltip-content={`6-month completion rate: ${stats.completionRate}% of scheduled tasks completed`}
            >
              <IoMdTrendingUp className={`w-4 h-4 ${stats.completionRate > 0 ? 'text-green-500' : 'text-gray-600'}`} />
              {stats.completionRate}%
            </div>
            <div
              className="text-sm text-gray-400 flex items-center gap-1 cursor-help"
              data-tooltip-id="task-calendar-tooltip"
              data-tooltip-content={`Current streak: ${stats.currentStreak} consecutive ${getRecurrenceDescription()} completions`}
            >
              <FaCheckCircle className={`w-4 h-4 ${stats.currentStreak > 0 ? 'text-blue-500' : 'text-gray-600'}`} />
              {stats.currentStreak}
            </div>
            <div
              className="text-sm text-gray-400 flex items-center gap-1 cursor-help"
              data-tooltip-id="task-calendar-tooltip"
              data-tooltip-content={`Longest streak in past 6 months: ${stats.longestStreak} consecutive ${getRecurrenceDescription()} completions`}
            >
              <IoMdTrendingUp className={`w-4 h-4 ${stats.longestStreak > 0 ? 'text-yellow-500' : 'text-gray-600'}`} />
              {stats.longestStreak}
            </div>
          </div>

          <div
            className="w-full"
            data-tooltip-id="task-calendar-tooltip"
            data-tooltip-content="Completion trend over the past 6 months"
          >
            <Sparklines data={trendData} height={20} margin={2}>
              <SparklinesLine
                style={{
                  stroke: "#60a5fa",
                  strokeWidth: 1,
                  fill: "none"
                }}
              />
              <SparklinesBars
                style={{
                  fill: "#60a5fa",
                  fillOpacity: "0.2"
                }}
              />
            </Sparklines>
          </div>

        </div>

      </div>


      <div className="flex gap-4 overflow-x-auto pb-2">
        {months.map(({ month, days }) => (
          <div key={month} className="flex-none min-w-[180px]">
            <div className="text-xs text-gray-400 mb-1">{month}</div>
            <div className="grid grid-cols-7 gap-0.5">
              {weekDays.map(day => (
                <div key={day.key} className="text-[10px] text-gray-500 h-4 flex items-center justify-center">
                  {day.label}
                </div>
              ))}
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-5 w-5" />;
                }

                const completed = isCompleted(date);
                const isToday = isEqual(date, new Date());
                const isPast = isBefore(date, new Date());

                return (
                  <div key={date.toString()} className="group relative">
                    <div
                      className={`
                        h-5 w-5 rounded-sm flex items-center justify-center text-[10px]
                        ${completed ? 'bg-emerald-500 dark:bg-emerald-500 text-white' :
                          isPast ? 'bg-gray-800 dark:bg-gray-800 text-gray-400' :
                            'bg-gray-900 dark:bg-gray-900 text-gray-500'
                        }
                        ${isToday ? 'ring-1 ring-blue-500' : ''}
                        transition-all duration-200 hover:ring-1 hover:ring-blue-400
                      `}
                    >
                      {format(date, 'd')}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 
                      bg-gray-800 text-xs text-gray-200 rounded-md opacity-0 group-hover:opacity-100 
                      transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {format(date, 'EEEE, MMMM d, yyyy')}
                      <br />
                      {completed ? 'Task completed' : isPast ? 'Not completed' : 'Upcoming'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Tooltip id="task-calendar-tooltip" />
    </div>
  );
};
