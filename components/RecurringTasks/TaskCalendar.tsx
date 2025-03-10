import React, { useCallback, useMemo } from 'react';
import { format, isEqual, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, parseISO } from 'date-fns';
import { BsCalendar3, BsAlarm } from 'react-icons/bs';
import { IoMdTrendingUp } from 'react-icons/io';
import { FaCheckCircle } from 'react-icons/fa';
import { ActiveTask, ProjectData, TodoistColor } from '../../types';
import { TaskStats } from './types';
import { Tooltip } from 'react-tooltip';
import { Sparklines, SparklinesLine, SparklinesBars } from 'react-sparklines';
import { calculateStats, getTrendData } from './utils/index';
import { getColorClass } from '../../utils/projectUtils';

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

export const TaskCalendar = React.memo(({ taskData, task, project }: TaskCalendarProps) => {
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

    if (lower.includes('every day') || lower.includes('daily')) {
      return 'daily';
    } else if (lower === 'every other day') {
      return 'every other day';
    } else if (lower.includes('every other')) {
      return 'bi-weekly';
    } else if (lower.match(/every (\d+) months?/)) {
      return 'monthly';
    } else if (lower === 'every last day' || /every \d+(?:st|nd|rd|th)?(?:\s|$)/.test(lower) || lower.includes('month')) {
      return 'monthly';
    } else if (lower.includes('every')) {
      return 'weekly';
    }
    return 'daily';
  }, [task.due?.string]);

  // Format the next due date
  const formatNextDue = useCallback(() => {
    if (!task.due?.date) return null;
    const dueDate = parseISO(task.due.date);
    const today = new Date();

    // Compare just the dates without time
    const isDueToday = format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isPastDue = isBefore(dueDate, today) && !isDueToday;
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isTomorrow = daysUntil === 1;

    if (isDueToday) {
      return 'Today';
    } else if (isPastDue) {
      return 'Overdue';
    } else if (isTomorrow) {
      return 'Tomorrow';
    } else {
      const formattedDate = format(dueDate, 'MMM d');
      return `${formattedDate} (in ${daysUntil} days)`;
    }
  }, [task.due?.date]);

  // Get next due date status color
  const getNextDueColor = useCallback(() => {
    if (!task.due?.date) return 'text-gray-400';
    const dueDate = parseISO(task.due.date);
    const today = new Date();

    // Compare just the dates without time
    const isDueToday = format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isPastDue = isBefore(dueDate, today) && !isDueToday;

    if (isDueToday) {
      return 'text-yellow-500';
    } else if (isPastDue) {
      return 'text-red-500';
    } else {
      return 'text-green-500';
    }
  }, [task.due?.date]);

  // Memoize months calculation
  const months = useMemo(() =>
    [0, 1, 2, 3, 4, 5].map(getCalendarDays),
    [getCalendarDays]
  );

  const nextDue = formatNextDue();
  const nextDueColor = getNextDueColor();

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-2 gap-4 sm:gap-0">
        <div className="space-y-1 w-full sm:w-auto">
          <div className="space-y-0.5 mb-4">
            <h3 className="font-medium text-gray-200 mb-0">{task.content}</h3>
            {nextDue && (
              <span className={`${nextDueColor} text-xs flex items-center gap-1`}
                data-tooltip-id="task-calendar-tooltip"
                data-tooltip-content="Next scheduled due date"
              >
                <BsAlarm className="w-3 h-3" />
                {nextDue}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm flex-wrap">
            {project && (
              <div>
                <div
                  className={`w-2 h-2 rounded-sm inline-block bg-${getColorClass(project.color as TodoistColor)}`}
                  data-tooltip-id="task-calendar-tooltip"
                />
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-opacity-20">
                  {project.name}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <BsCalendar3 className="w-4 h-4" />
              <span>
                {task.due?.string}
                {taskData.pattern?.type === 'unsupported' && <span className="ml-2 text-yellow-500">(Pattern not supported)</span>}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-start sm:justify-end">
            <div
              className="text-sm text-gray-400 flex items-center gap-1 cursor-help"
              data-tooltip-id="task-calendar-tooltip"
              data-tooltip-content={stats.isLongTerm
                ? `This task recurs every ${stats.interval || 12} months - too long for 6-month analysis window. ${stats.isOnTrack ? 'Task has been completed at least once in the past 6 months.' : 'Task has not been completed in the past 6 months.'}`
                : `6-month completion rate: ${stats.completionRate}% of scheduled tasks completed`}
            >
              <IoMdTrendingUp className={`w-4 h-4 ${stats.isLongTerm ? (stats.isOnTrack ? 'text-green-500' : 'text-gray-600') : (stats.completionRate > 0 ? 'text-green-500' : 'text-gray-600')}`} />
              {stats.isLongTerm ? (stats.isOnTrack ? 'On Track' : 'Long-term') : `${stats.completionRate}%`}
            </div>
            {!stats.isLongTerm && (
              <>
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
              </>
            )}
          </div>

          <div
            className="w-full sm:w-48"
            data-tooltip-id="task-calendar-tooltip"
            data-tooltip-content={stats.isLongTerm
              ? `Long-term recurring task (${stats.interval || 12} months) - trend analysis not applicable`
              : "Completion trend over the past 6 months"}
          >
            <Sparklines
              data={trendData}
              height={20}
              margin={2}
              min={0}
              max={100}
              preserveAspectRatio="none"
              width={192}
            >
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
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>now</span>
              <span>6mo ago</span>
            </div>
          </div>

        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {months.map(({ month, days }) => (
          <div key={month} className="flex-none min-w-[180px]">
            <div className="text-xs text-gray-400 mb-1">{month}</div>
            <div className="grid grid-cols-7 gap-0.5">
              {weekDays.map(day => (
                <div key={day.key} className="text-xs text-gray-500 h-4 flex items-center justify-center">
                  {day.label}
                </div>
              ))}
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-6 sm:h-5 w-full" />;
                }

                const completed = isCompleted(date);
                const isToday = isEqual(date, new Date());
                const isPast = isBefore(date, new Date());

                return (
                  <div key={date.toString()} className="group relative">
                    <div
                      className={`h-6 sm:h-5 w-full rounded-sm flex items-center justify-center text-[11px] sm:text-xs
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
                    <div className="absolute bottom-full left-0 mb-1 px-2 py-1 
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
});

TaskCalendar.displayName = 'TaskCalendar';
