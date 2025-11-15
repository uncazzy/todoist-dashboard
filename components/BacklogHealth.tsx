import React, { useMemo, useState } from 'react';
import { ActiveTask, CompletedTask, ProjectData } from '../types';
import { calculateBacklogHealth } from '../utils/calculateBacklogHealth';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { Tooltip } from 'react-tooltip';

interface BacklogHealthProps {
  activeTasks: ActiveTask[];
  completedTasks: CompletedTask[];
  projectData: ProjectData[];
}

const BacklogHealth: React.FC<BacklogHealthProps> = ({ activeTasks, completedTasks, projectData }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5;

  const healthData = useMemo(() => {
    return calculateBacklogHealth(activeTasks, completedTasks);
  }, [activeTasks, completedTasks]);

  const { metrics, tasksToReview } = healthData;

  // Create a map of project IDs to project names for quick lookup
  const projectMap: { [key: string]: ProjectData } = useMemo(() =>
    Object.fromEntries(projectData.map(project => [project.id, project])),
    [projectData]
  );

  // Determine health color
  const getHealthColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-400', border: 'border-green-500/30' };
    if (score >= 50) return { text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { text: 'text-red-400', border: 'border-red-500/30' };
  };

  const healthColor = getHealthColor(metrics.healthScore);

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'stale': return { text: 'Old', icon: '🕰️', color: 'text-orange-400' };
      case 'overdue-high-priority': return { text: 'Action Needed', icon: '🚨', color: 'text-red-400' };
      default: return { text: 'Review', icon: '⚠️', color: 'text-warm-gray' };
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4: return { text: 'P1', color: 'text-red-400' };
      case 3: return { text: 'P2', color: 'text-orange-400' };
      case 2: return { text: 'P3', color: 'text-yellow-400' };
      default: return { text: 'P4', color: 'text-warm-gray' };
    }
  };

  if (!activeTasks || !completedTasks) {
    return <div className="text-center py-4 text-warm-gray">Loading...</div>;
  }

  // Paginate tasks needing attention
  const totalPages = Math.ceil(tasksToReview.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const paginatedTasks = tasksToReview.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="w-full space-y-4">
      {/* Health Score & Key Stats */}
      <div className="flex items-center gap-4">
        {/* Health Score Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-20 h-20" viewBox="0 0 100 100">
              <circle
                className="text-warm-border"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className={healthColor.text}
                strokeWidth="10"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                strokeDasharray={`${(2 * Math.PI * 40 * metrics.healthScore) / 100} ${2 * Math.PI * 40}`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${healthColor.text}`}>{metrics.healthScore}</span>
            </div>
          </div>
          <p className="text-xs mt-1 text-warm-gray">Health</p>
        </div>

        {/* Key Backlog Metrics */}
        <div className="flex-1 grid grid-cols-3 gap-2">
          <div
            className="p-2 bg-warm-hover border border-warm-border rounded-lg text-center cursor-help"
            data-tooltip-id="backlog-tooltip"
            data-tooltip-content="Half of your active tasks are older/newer than this age"
          >
            <div className="text-xs text-warm-gray">Median Age</div>
            <div className="text-lg font-bold text-white">{Math.round(metrics.medianAge)}d</div>
          </div>

          <div
            className="p-2 bg-warm-hover border border-warm-border rounded-lg text-center cursor-help"
            data-tooltip-id="backlog-tooltip"
            data-tooltip-content="Tasks that are past their due date"
          >
            <div className="text-xs text-warm-gray">Overdue</div>
            <div className="text-lg font-bold text-red-400">{metrics.overdueCount}</div>
          </div>

          <div
            className="p-2 bg-warm-hover border border-warm-border rounded-lg text-center cursor-help"
            data-tooltip-id="backlog-tooltip"
            data-tooltip-content="Tasks that have been sitting for over 30 days"
          >
            <div className="text-xs text-warm-gray">Stale (30d+)</div>
            <div className="text-lg font-bold text-orange-400">{metrics.staleCount}</div>
          </div>
        </div>
      </div>

      {/* Tasks Needing Attention */}
      <div className="flex items-center justify-between border-b border-warm-border pb-2">
        <h3 className="text-sm font-semibold text-white">Tasks Needing Attention</h3>
        <span className="text-xs text-warm-gray">{tasksToReview.length} tasks</span>
      </div>

      {/* Task List */}
      <div className="space-y-2" key={`attention-${currentPage}`}>
        {paginatedTasks.length > 0 ? (
          paginatedTasks.map((task) => {
            const project = projectMap[task.projectId];
            const age = task.age;
            const reasonInfo = getReasonLabel(task.reason);
            const priorityInfo = getPriorityLabel(task.priority);

            return (
              <div
                key={task.id}
                className="bg-warm-hover rounded-lg p-2 border border-warm-border hover:bg-warm-card transition-all duration-200"
              >
                <div className="flex flex-col space-y-1">
                  {/* Task title */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-white text-sm font-medium flex-1 line-clamp-1">{task.content}</h4>
                    <span className={`text-xs font-semibold ${priorityInfo.color} shrink-0`}>
                      {priorityInfo.text}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {/* Project */}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-warm-peach/20 text-warm-peach border border-warm-peach/30">
                      {project?.name || 'No Project'}
                    </span>

                    {/* Reason tag */}
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border ${reasonInfo.color}`}>
                      <span>{reasonInfo.icon}</span>
                      <span>{reasonInfo.text}</span>
                    </span>

                    {/* Creation date */}
                    <span className="text-warm-gray">
                      Created {new Date(task.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>

                    {/* Age */}
                    <span className="text-warm-gray">
                      ({age}d old)
                    </span>

                    {/* Due date */}
                    {task.due?.date && (
                      <span className={`${new Date(task.due.date) < new Date() ? 'text-red-400' : 'text-warm-peach'}`}>
                        {new Date(task.due.date) < new Date() ? 'Overdue' : 'Due'} {new Date(task.due.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-warm-gray bg-warm-hover rounded-lg border border-warm-border">
            <div className="text-3xl mb-1">✨</div>
            <p className="text-sm font-medium">Backlog is clean!</p>
            <p className="text-xs mt-1">No tasks need immediate attention</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-warm-border">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-2 py-1 text-sm text-warm-gray hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <BsChevronLeft className="w-3 h-3" />
            Prev
          </button>
          <span className="text-xs text-warm-gray">
            {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, tasksToReview.length)} of {tasksToReview.length}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1 px-2 py-1 text-sm text-warm-gray hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <BsChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <Tooltip id="backlog-tooltip" />
    </div>
  );
};

export default BacklogHealth;
