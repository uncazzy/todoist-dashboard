import React, { useState, useMemo } from 'react';
import { BsCalendar3, BsCalendarWeek, BsCalendarMonth, BsThreeDots } from 'react-icons/bs';
import { Virtuoso } from 'react-virtuoso';
import { ActiveTask, ProjectData } from '../../types';
import { TaskCalendar } from './TaskCalendar';
import { RecurringFrequency } from './types';
import { getTaskFrequency, calculateStats } from './utils';

interface TaskItemProps {
  taskData: RecurringTaskData;
  activeTasksMap: Map<string, ActiveTask>;
  projectDataMap: Map<string, ProjectData>;
}

interface CompletedTask {
  task_id: string;
  completed_at: string;
}

interface Props {
  activeTasks: ActiveTask[];
  allCompletedTasks: CompletedTask[];
  projectData: ProjectData[];
}

interface RecurringTaskData {
  taskId: string;
  frequency: RecurringFrequency;
  completionDates: Date[];
  completedCount: number;
  totalDueCount: number;
  currentStreak: number;
  completionRate: number;
}

const RecurringTasksCard: React.FC<Props> = ({ activeTasks, allCompletedTasks, projectData }) => {
  const [selectedFrequency, setSelectedFrequency] = useState<RecurringFrequency>('daily');

  const frequencies = useMemo(() => [
    { freq: 'daily' as const, icon: <BsCalendar3 className="w-4 h-4" />, label: 'Daily Tasks' },
    { freq: 'weekly' as const, icon: <BsCalendarWeek className="w-4 h-4" />, label: 'Weekly Tasks' },
    { freq: 'monthly' as const, icon: <BsCalendarMonth className="w-4 h-4" />, label: 'Monthly Tasks' },
    { freq: 'other' as const, icon: <BsThreeDots className="w-4 h-4" />, label: 'Other Recurring' }
  ], []);

  // Create lookup maps for efficient data retrieval
  const activeTasksMap = useMemo(() => {
    const map = new Map<string, ActiveTask>();
    activeTasks.forEach(task => map.set(task.id, task));
    return map;
  }, [activeTasks]);

  const projectDataMap = useMemo(() => {
    const map = new Map<string, ProjectData>();
    projectData.forEach(project => map.set(project.id, project));
    return map;
  }, [projectData]);

  // Prepare recurring tasks data
  const recurringTasksData = useMemo<RecurringTaskData[]>(() => {
    const recurringTasks = activeTasks.filter(task => task.due?.isRecurring);

    return recurringTasks.map((task) => {
      const taskCompletions = allCompletedTasks.filter(ct => ct.task_id === task.id);
      const frequency = getTaskFrequency(task.due?.string);
      const completionDates = taskCompletions.map(ct => new Date(ct.completed_at));
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

  const frequencyCounts = useMemo(() => {
    const counts: Record<RecurringFrequency, number> = {
      daily: 0,
      weekly: 0,
      monthly: 0,
      other: 0
    };

    recurringTasksData.forEach(taskData => {
      if (counts[taskData.frequency] !== undefined) {
        counts[taskData.frequency]++;
      }
    });

    return counts;
  }, [recurringTasksData]);

  const filteredTasks = useMemo(
    () => recurringTasksData.filter(taskData => taskData.frequency === selectedFrequency),
    [recurringTasksData, selectedFrequency]
  );

  const TaskItem: React.FC<TaskItemProps> = React.memo(({ taskData, activeTasksMap, projectDataMap }: TaskItemProps) => {
    const task = activeTasksMap.get(taskData.taskId);
    const project = task ? projectDataMap.get(task.projectId) : undefined;

    if (!task) {
      console.warn(`Task with ID ${taskData.taskId} not found.`);
      return null;
    }

    return (
      <div className="bg-gray-900/30 rounded-lg backdrop-blur-sm hover:bg-gray-900/40 transition-colors">
        <div className="p-3 sm:p-6">
          <div className="overflow-x-auto -mx-6 px-6 hide-scrollbar">
            <TaskCalendar taskData={taskData} task={task} project={project} />
          </div>
        </div>
      </div>
    );
  });

  TaskItem.displayName = 'TaskItem';

  if (!recurringTasksData || recurringTasksData.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-8 text-center">
        <p className="text-gray-400 text-lg">No recurring tasks found.</p>
        <p className="text-gray-500 mt-2">Create recurring tasks in Todoist to track them here.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Frequency Selector */}
      <div className="flex-none bg-gray-900/30 backdrop-blur-sm">
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4 -mx-6 px-6 sm:mx-0 sm:px-4 hide-scrollbar">
          {frequencies.map(({ freq, icon, label }) => (
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
                {frequencyCounts[freq] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="flex-1 mt-6" style={{ minHeight: 0 }}>
        <Virtuoso
          data={filteredTasks}
          useWindowScroll
          itemContent={(_index, taskData) => (
            <div className="mb-6">
              <TaskItem
                taskData={taskData}
                activeTasksMap={activeTasksMap}
                projectDataMap={projectDataMap}
              />
            </div>
          )}
          increaseViewportBy={{ top: 300, bottom: 300 }}
          overscan={5}
        />
      </div>
    </div>
  );
};

export default React.memo(RecurringTasksCard);
