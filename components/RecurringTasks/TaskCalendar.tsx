import React from 'react';
import { format, isEqual, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from 'date-fns';
import { BsCalendar3 } from 'react-icons/bs';
import { IoMdTrendingUp } from 'react-icons/io';
import { FaCheckCircle } from 'react-icons/fa';
import { ActiveTask, ProjectData } from '../../types';
import { TaskStats } from './types';
import { getTaskFrequency } from './utils';

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
  const isCompleted = (date: Date): boolean => {
    return taskData.completionDates.some(
      completionDate => format(completionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getCalendarDays = (monthsAgo: number) => {
    const start = startOfMonth(subMonths(new Date(), monthsAgo));
    const end = endOfMonth(subMonths(new Date(), monthsAgo));
    const days = eachDayOfInterval({ start, end });
    const startPadding = getDay(start);
    const paddedDays = Array(startPadding).fill(null).concat(days);

    return {
      month: format(start, 'MMM yyyy'),
      days: paddedDays
    };
  };

  // Show 6 months
  const months = [5, 4,3, 2, 1, 0].map(getCalendarDays);
  const completionRate = Math.round((taskData.completedCount / taskData.totalDueCount) * 100);
  const streak = taskData.currentStreak;

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
          <div className="flex items-center gap-1 text-gray-400">
            <IoMdTrendingUp className={`w-4 h-4 ${completionRate >= 70 ? 'text-emerald-500' : 'text-yellow-500'}`} />
            <span>{completionRate}%</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
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
    </div>
  );
};
