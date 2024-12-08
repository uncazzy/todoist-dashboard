import React from 'react';
import Link from 'next/link';
import { BsCalendar3 } from 'react-icons/bs';
import { IoMdTrendingUp } from 'react-icons/io';
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import { ActiveTask, ProjectData } from '../../types';
import { calculateStats } from './utils/index';

interface RecurringTasksPreviewProps {
  activeTasks: ActiveTask[];
  allCompletedTasks: any[];
  projectData: ProjectData[];
}

const RecurringTasksPreview: React.FC<RecurringTasksPreviewProps> = ({
  activeTasks,
  allCompletedTasks,
  projectData
}) => {
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
            <FaCheckCircle className="w-4 h-4" />
            <span>Completed</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{completedRecurringTasks}</div>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400">
            <IoMdTrendingUp className="w-4 h-4" />
            <span>Avg. Completion Rate</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{averageCompletionRate}%</div>
        </div>
      </div>

      <Link 
        href="/recurring-tasks" 
        className="flex items-center justify-center gap-2 w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-3 px-4 rounded-lg transition-colors"
      >
        View Detailed Analysis
        <FaArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default RecurringTasksPreview;
