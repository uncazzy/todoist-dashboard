import React, { useState, useMemo } from 'react';
import { BsCalendar3, BsCalendarWeek, BsCalendarMonth, BsThreeDots } from 'react-icons/bs';
import { BsQuestionCircle } from 'react-icons/bs';
import { Tooltip } from 'react-tooltip';
import { Virtuoso } from 'react-virtuoso';
import { ActiveTask, ProjectData } from '../../types';
import { TaskCalendar } from './TaskCalendar';
import { RecurringFrequency } from './types';
import { RecurrencePattern } from './streaks/types';
import { getTaskFrequency, calculateStats } from './utils';
import { parsePattern } from './streaks/index';

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
  pattern: RecurrencePattern | undefined;
}

const RecurringTasksCard: React.FC<Props> = ({ activeTasks, allCompletedTasks, projectData }) => {
  const [selectedFrequency, setSelectedFrequency] = useState<RecurringFrequency>('daily');

  const frequencies = useMemo(() => [
    { freq: 'daily' as const, icon: <BsCalendar3 className="w-4 h-4" />, label: 'Daily' },
    { freq: 'weekly' as const, icon: <BsCalendarWeek className="w-4 h-4" />, label: 'Weekly' },
    { freq: 'monthly' as const, icon: <BsCalendarMonth className="w-4 h-4" />, label: 'Monthly' },
    { freq: 'other' as const, icon: <BsThreeDots className="w-4 h-4" />, label: 'Other' }
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

      const pattern = task.due?.string ? parsePattern(task.due.string) : undefined;

      return {
        taskId: task.id,
        frequency,
        completionDates,
        completedCount: stats.totalCompletions,
        totalDueCount: stats.totalCompletions || 1,
        currentStreak: stats.currentStreak,
        completionRate: stats.completionRate,
        pattern
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
      <div className="bg-warm-card/50 border border-warm-border rounded-2xl hover:bg-warm-hover transition-colors">
        <div className="p-4 sm:p-6">
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
      <div className="bg-warm-card/50 border border-warm-border rounded-2xl p-12 text-center m-6">
        <p className="text-white text-lg font-medium mb-2">No recurring tasks found.</p>
        <p className="text-warm-gray text-sm">Create recurring tasks in Todoist to track them here.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Stats Overview */}
      <div className="flex-none mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-warm-card/50 border border-warm-peach/30 rounded-2xl p-6 hover:border-warm-peach/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-warm-gray font-medium">Recurring Tasks</span>
              <BsQuestionCircle
                className="text-warm-gray hover:text-warm-peach cursor-help"
                data-tooltip-id="recurring-tasks-tooltip"
                data-tooltip-content="Total number of recurring tasks in your Todoist"
              />
            </div>
            <div className="text-5xl font-semibold text-warm-peach">
              {recurringTasksData.length}
            </div>
          </div>

          <div className="bg-warm-card/50 border border-warm-blue/30 rounded-2xl p-6 hover:border-warm-blue/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-warm-gray font-medium">Total Completions</span>
              <BsQuestionCircle
                className="text-warm-gray hover:text-warm-blue cursor-help"
                data-tooltip-id="total-completions-tooltip"
                data-tooltip-content="Number of times recurring tasks have been completed"
              />
            </div>
            <div className="text-5xl font-semibold text-warm-blue">
              {allCompletedTasks.filter(task =>
                recurringTasksData.some(rt => rt.taskId === task.task_id)
              ).length}
            </div>
          </div>

          <div className="bg-warm-card/50 border border-warm-sage/30 rounded-2xl p-6 hover:border-warm-sage/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-warm-gray font-medium">Avg. Completion</span>
              <BsQuestionCircle
                className="text-warm-gray hover:text-warm-sage cursor-help"
                data-tooltip-id="avg-completion-tooltip"
                data-tooltip-content="Average completion rate across all recurring tasks"
              />
            </div>
            <div className="text-5xl font-semibold text-warm-sage">
              {Math.round(
                recurringTasksData.reduce((sum, task) => sum + task.completionRate, 0) /
                (recurringTasksData.length || 1)
              )}%
            </div>
          </div>
        </div>
      </div>

      <Tooltip id="recurring-tasks-tooltip" />
      <Tooltip id="total-completions-tooltip" />
      <Tooltip id="avg-completion-tooltip" />

      {/* Frequency Selector */}
      <div className="flex-none bg-warm-card/50 border border-warm-border rounded-2xl p-2 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {frequencies.map(({ freq, icon, label }) => (
            <button
              key={freq}
              onClick={() => setSelectedFrequency(freq)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-medium
                ${selectedFrequency === freq
                  ? 'bg-warm-peach text-white'
                  : 'text-warm-gray hover:bg-warm-hover hover:text-white'}`}
            >
              {icon}
              <span className="text-sm hidden sm:inline">{label}</span>
              <span className="text-xs font-semibold ml-auto bg-warm-black/30 px-2 py-0.5 rounded-full">
                {frequencyCounts[freq] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="flex-1 pb-6" style={{ minHeight: 0 }}>
        <Virtuoso
          data={filteredTasks}
          useWindowScroll
          itemContent={(_index, taskData) => (
            <div className="mb-6 last:mb-0">
              <TaskItem
                taskData={taskData}
                activeTasksMap={activeTasksMap}
                projectDataMap={projectDataMap}
              />
            </div>
          )}
          increaseViewportBy={{ top: 300, bottom: 600 }}
          overscan={10}
        />
      </div>
    </div>
  );
};

export default React.memo(RecurringTasksCard);
