import React, { useState } from 'react';
import { BsCalendar3, BsCalendarWeek, BsCalendarMonth, BsThreeDots } from 'react-icons/bs';
import { ActiveTask, ProjectData } from '../../types';
import { TaskCalendar } from './TaskCalendar';
import { RecurringFrequency } from './types';
import { getTaskFrequency, calculateStats } from './utils';

interface Props {
  activeTasks: ActiveTask[];
  allCompletedTasks: any[];
  projectData: ProjectData[];
}

const RecurringTasksCard: React.FC<Props> = ({ activeTasks, allCompletedTasks, projectData }) => {
  const [selectedFrequency, setSelectedFrequency] = useState<RecurringFrequency>('daily');

  const recurringTasksData = React.useMemo(() => {
    const recurringTasks = activeTasks.filter(task => task.due?.isRecurring);
    return recurringTasks.map(task => {
      const taskCompletions = allCompletedTasks.filter(ct => ct.task_id === task.id);
      const frequency = getTaskFrequency(task.due?.string);
      const completionDates = taskCompletions.map(ct => new Date(ct.completed_at));
      
      // Calculate stats for the task
      const stats = calculateStats(task, completionDates);
      
      return {
        taskId: task.id,
        frequency,
        completionDates,
        completedCount: stats.totalCompletions,
        totalDueCount: stats.totalCompletions || 1,
        currentStreak: stats.currentStreak,
        completionRate: stats.completionRate
      };
    });
  }, [activeTasks, allCompletedTasks]);

  if (!recurringTasksData || recurringTasksData.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-8 text-center">
        <p className="text-gray-400 text-lg">No recurring tasks found.</p>
        <p className="text-gray-500 mt-2">Create recurring tasks in Todoist to track them here.</p>
      </div>
    );
  }

  const frequencies: { freq: RecurringFrequency; icon: JSX.Element; label: string }[] = [
    { freq: 'daily', icon: <BsCalendar3 className="w-4 h-4" />, label: 'Daily Tasks' },
    { freq: 'weekly', icon: <BsCalendarWeek className="w-4 h-4" />, label: 'Weekly Tasks' },
    { freq: 'monthly', icon: <BsCalendarMonth className="w-4 h-4" />, label: 'Monthly Tasks' },
    { freq: 'other', icon: <BsThreeDots className="w-4 h-4" />, label: 'Other Recurring' }
  ];

  const filteredTasks = recurringTasksData.filter(
    taskData => taskData.frequency === selectedFrequency
  );

  return (
    <div className="h-full flex flex-col">
      {/* Frequency Selector */}
      <div className="flex-none bg-gray-900/30 backdrop-blur-sm">
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4 -mx-6 px-6 sm:mx-0 sm:px-4 hide-scrollbar">
          {frequencies.map(({ freq, icon, label }) => {
            const count = recurringTasksData.filter(td => td.frequency === freq).length;
            return (
              <button
                key={freq}
                onClick={() => setSelectedFrequency(freq)}
                className={`flex items-center sm:flex-col sm:items-center gap-2 p-3 sm:p-4 rounded-lg transition-all flex-shrink-0 w-auto sm:w-full
                  ${selectedFrequency === freq
                    ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
              >
                <div className="flex items-center gap-2 sm:flex-col sm:items-center">
                  {icon}
                  <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-800/50 ml-auto sm:ml-0">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="flex-1 overflow-hidden mt-6">
        <div className="h-full overflow-y-auto px-6 -mx-6 sm:px-0 sm:mx-0">
          <div className="space-y-6">
            {filteredTasks.map((taskData) => {
              const task = activeTasks.find(t => t.id === taskData.taskId);
              if (!task) return null;

              const project = projectData.find(p => p.id === task.projectId);

              return (
                <div 
                  key={task.id} 
                  className="bg-gray-900/30 rounded-lg backdrop-blur-sm hover:bg-gray-900/40 transition-colors"
                >
                  <div className="p-3 sm:p-6">
                    <div className="overflow-x-auto -mx-6 px-6 hide-scrollbar">
                      <div className="">
                        <TaskCalendar
                          taskData={taskData}
                          task={task}
                          project={project}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="bg-gray-900/30 rounded-lg p-8 text-center backdrop-blur-sm">
                <p className="text-gray-400 text-lg">
                  No {selectedFrequency} tasks found
                </p>
                <p className="text-gray-500 mt-2">
                  Create some {selectedFrequency} recurring tasks in Todoist to see them here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringTasksCard;
