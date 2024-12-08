import React, { useCallback, useMemo } from 'react';
import { format, isEqual, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from 'date-fns';
import { BsCalendar3 } from 'react-icons/bs';
import { IoMdTrendingUp } from 'react-icons/io';
import { FaCheckCircle } from 'react-icons/fa';
import { ActiveTask, ProjectData } from '../../types';
import { TaskStats } from './types';
import { getTaskFrequency } from './utils';
import { Tooltip } from 'react-tooltip';

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
    const frequency = getTaskFrequency(task.due?.string);
    const today = new Date();
    let expectedCount = 0;
    let completedCount = 0;

    // Look back 30 days for the completion rate
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);

    const days = eachDayOfInterval({ start: startDate, end: today });
    
    // Limit the number of iterations for performance
    const relevantDays = days.filter(date => {
      if (isBefore(date, today) || isEqual(date, today)) {
        switch (frequency) {
          case 'daily':
            return true;
          case 'weekly':
            return format(date, 'EEEE').toLowerCase() === task.due?.string?.toLowerCase()?.replace('every ', '');
          case 'monthly':
            const dayOfMonth = format(date, 'd');
            return task.due?.string?.includes(dayOfMonth);
          default:
            return false;
        }
      }
      return false;
    });

    relevantDays.forEach(date => {
      expectedCount++;
      if (isCompleted(date)) completedCount++;
    });

    return expectedCount > 0 ? Math.round((completedCount / expectedCount) * 100) : 0;
  }, [task.due?.string, isCompleted]);

  // Calculate current streak based on frequency
  const calculateStreak = useCallback(() => {
    const frequency = getTaskFrequency(task.due?.string);
    const today = new Date();
    let streak = 0;
    let date = new Date(today);
    let daysChecked = 0;
    const MAX_DAYS_TO_CHECK = 365; // Limit how far back we look

    while (daysChecked < MAX_DAYS_TO_CHECK) {
      const shouldCheck = frequency === 'daily' ||
        (frequency === 'weekly' && format(date, 'EEEE').toLowerCase() === task.due?.string?.toLowerCase()?.replace('every ', '')) ||
        (frequency === 'monthly' && task.due?.string?.includes(format(date, 'd')));

      if (shouldCheck) {
        if (!isCompleted(date) && (isBefore(date, today) || isEqual(date, today))) {
          break;
        }
        if (isCompleted(date)) {
          streak++;
        }
      }

      date = new Date(date.setDate(date.getDate() - 1));
      daysChecked++;
    }

    return streak;
  }, [task.due?.string, isCompleted]);

  // Memoize months calculation
  const months = useMemo(() => 
    [0, 1, 2, 3, 4, 5].map(getCalendarDays),
    [getCalendarDays]
  );

  // Memoize stats calculations
  const completionRate = useMemo(() => 
    calculateCompletionRate(),
    [calculateCompletionRate]
  );

  const streak = useMemo(() => 
    calculateStreak(),
    [calculateStreak]
  );

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
      <div className="flex items-start justify-between mb-4">
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
              {getTaskFrequency(task.due?.string)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div 
            className="flex items-center gap-1 text-gray-400 cursor-help"
            data-tooltip-id="task-calendar-tooltip"
            data-tooltip-content={`30-day completion rate: ${completionRate}% of scheduled tasks completed`}
          >
            <IoMdTrendingUp className={`w-4 h-4 ${completionRate >= 70 ? 'text-emerald-500' : 'text-yellow-500'}`} />
            <span>{completionRate}%</span>
          </div>
          <div 
            className="flex items-center gap-1 text-gray-400 cursor-help"
            data-tooltip-id="task-calendar-tooltip"
            data-tooltip-content={`Current streak: ${streak} consecutive ${
              getTaskFrequency(task.due?.string) === 'daily' ? 'days' :
              getTaskFrequency(task.due?.string) === 'weekly' ? 'weeks' :
              getTaskFrequency(task.due?.string) === 'monthly' ? 'months' : 'occurrences'
            } completed on schedule`}
          >
            <FaCheckCircle className={`w-4 h-4 ${streak > 0 ? 'text-blue-500' : 'text-gray-600'}`} />
            <span>{streak}</span>
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
