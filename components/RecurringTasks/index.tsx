import React, { useState, useMemo } from 'react';
import { BsCalendar3, BsCalendarWeek, BsCalendarMonth, BsThreeDots, BsChevronDown } from 'react-icons/bs';
import { ActiveTask, CompletedTask, ProjectData } from '../../types';
import { TaskCalendar } from './TaskCalendar';
import { RecurringFrequency } from './types';
import { getTaskFrequency } from './utils';

interface Props {
  activeTasks: ActiveTask[];
  allCompletedTasks: CompletedTask[];
  projectData: ProjectData[];
}

const RecurringTasksMatrix: React.FC<Props> = ({ activeTasks, allCompletedTasks, projectData }) => {
  const [selectedFrequency, setSelectedFrequency] = useState<RecurringFrequency>('daily');
  const [isExpanded, setIsExpanded] = useState(false);

  const recurringTasksData = useMemo(() => {
    const recurringTasks = activeTasks.filter(task => task.due?.isRecurring);
    return recurringTasks.map(task => {
      const taskCompletions = allCompletedTasks.filter(ct => ct.task_id === task.id);
      const frequency = getTaskFrequency(task.due?.string);
      const stats = {
        taskId: task.id,
        frequency,
        completedCount: taskCompletions.length,
        totalDueCount: taskCompletions.length || 1,
        currentStreak: taskCompletions.length > 0 ? 1 : 0,
        completionDates: taskCompletions.map(ct => new Date(ct.completed_at))
      };
      return stats;
    });
  }, [activeTasks, allCompletedTasks]);

  if (!recurringTasksData || recurringTasksData.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6 text-center">
        <p className="text-gray-400">No recurring tasks found.</p>
      </div>
    );
  }

  const frequencies: { freq: RecurringFrequency; icon: JSX.Element }[] = [
    { freq: 'daily', icon: <BsCalendar3 className="w-4 h-4" /> },
    { freq: 'weekly', icon: <BsCalendarWeek className="w-4 h-4" /> },
    { freq: 'monthly', icon: <BsCalendarMonth className="w-4 h-4" /> },
    { freq: 'other', icon: <BsThreeDots className="w-4 h-4" /> }
  ];

  const filteredTasks = recurringTasksData.filter(
    taskData => taskData.frequency === selectedFrequency
  );

  return (
    <div className="bg-gray-800/50 h-full flex flex-col">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="rounded-lg p-4 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Recurring Tasks
          </h2>
          <span className="bg-gray-800/50 px-2 py-0.5 rounded-full text-xs">
            {recurringTasksData.length}
          </span>
        </div>
        <BsChevronDown
          className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      <div 
        className={`transition-all duration-300 origin-top overflow-hidden ${
          isExpanded 
            ? 'flex-1' 
            : 'max-h-0'
        }`}
      >
        <div className="h-full flex flex-col space-y-2 p-4 sm:p-6">
          <div className="p-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {frequencies.map(({ freq, icon }) => {
                const count = recurringTasksData.filter(td => td.frequency === freq).length;
                return (
                  <button
                    key={freq}
                    onClick={() => setSelectedFrequency(freq)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all min-w-[120px]
                      ${selectedFrequency === freq
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                  >
                    {icon}
                    <span className="capitalize">{freq}</span>
                    <span className="ml-auto bg-gray-800/50 px-2 py-0.5 rounded-full text-xs">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            {filteredTasks.length === 0 ? (
              <div className="bg-gray-900/50 rounded-lg p-6 text-center">
                <p className="text-gray-400">No {selectedFrequency} tasks found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((taskData) => {
                  const task = activeTasks.find(t => t.id === taskData.taskId);
                  if (!task) return null;

                  const project = projectData.find(p => p.id === task.projectId);

                  return (
                    <TaskCalendar
                      key={task.id}
                      taskData={taskData}
                      task={task}
                      project={project}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringTasksMatrix;
