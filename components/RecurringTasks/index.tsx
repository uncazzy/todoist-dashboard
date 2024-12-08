import React, { useState, useMemo } from 'react';
import { BsCalendar3, BsCalendarWeek, BsCalendarMonth, BsThreeDots } from 'react-icons/bs';
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
    <div className="space-y-4">
      <div className="bg-gray-900/50 rounded-lg p-2 flex gap-2">
        {frequencies.map(({ freq, icon }) => {
          const count = recurringTasksData.filter(td => td.frequency === freq).length;
          
          return (
            <button
              key={freq}
              onClick={() => setSelectedFrequency(freq)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all flex-1
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
  );
};

export default RecurringTasksMatrix;
