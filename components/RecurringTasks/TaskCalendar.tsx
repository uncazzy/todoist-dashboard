import React, { useCallback, useMemo } from 'react';
import { format, isEqual, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from 'date-fns';
import { BsCalendar3 } from 'react-icons/bs';
import { IoMdTrendingUp } from 'react-icons/io';
import { FaCheckCircle } from 'react-icons/fa';
import { ActiveTask, ProjectData } from '../../types';
import { TaskStats } from './types';
import { Tooltip } from 'react-tooltip';
import { Sparklines, SparklinesLine, SparklinesBars } from 'react-sparklines';
import { calculateStats, getTrendData } from './utils/index';

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

  const stats = useMemo(() => calculateStats(task, taskData.completionDates), [task, taskData.completionDates]);
  const trendData = useMemo(() => getTrendData(task, taskData.completionDates), [task, taskData.completionDates]);

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
                      className={`h-5 w-5 rounded-sm flex items-center justify-center text-[10px]
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
