import React from 'react';
import Link from 'next/link';
import { BsCalendar3 } from 'react-icons/bs';
import { IoIosCheckmarkCircle, IoMdTrendingUp } from 'react-icons/io';
import { FaArrowRight } from 'react-icons/fa';
import { ActiveTask } from '../../types';
import { calculateStats } from './utils/index';

interface RecurringTasksPreviewProps {
  activeTasks: ActiveTask[];
  allCompletedTasks: any[];
}

const RecurringTasksPreview: React.FC<RecurringTasksPreviewProps> = ({
  activeTasks,
  allCompletedTasks}) => {
  const recurringTasks = activeTasks.filter(task => task.due?.isRecurring);

  // Calculate overall stats
  const totalRecurringTasks = recurringTasks.length;
  const completedRecurringTasks = allCompletedTasks.filter(
    task => recurringTasks.some(rt => rt.id === task.task_id)
  ).length;

  // Calculate average completion rate
  const completionRates = recurringTasks.map(task => {
    const taskCompletions = allCompletedTasks.filter(ct => ct.task_id === task.id);
    const stats = calculateStats(task, taskCompletions.map(tc => new Date(tc.completed_at)));
    return stats.completionRate;
  });

  const averageCompletionRate = completionRates.length > 0
    ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
    : 0;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Recurring Tasks
          </h2>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400">
            <BsCalendar3 className="w-4 h-4" />
            <span>Total Tasks</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{totalRecurringTasks}</div>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400">
            <IoIosCheckmarkCircle className="text-lg" />
            <span>Completed</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{completedRecurringTasks}</div>
        </div>

        <Link
          href="/recurring"
          className="group bg-gray-900/50 p-4 rounded-lg transition-all duration-200 no-underline hover:bg-gray-900/70 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-gray-400">
            <IoMdTrendingUp className="text-lg" />
            <span>Avg. Completion Rate</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{averageCompletionRate}%</span>
            <span className="text-sm text-blue-400/80 group-hover:text-blue-400 flex items-center gap-1">
              More
              <FaArrowRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform duration-200" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default RecurringTasksPreview;
