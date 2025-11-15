import React from 'react';
import { ActiveTask, ProjectData } from '../types';

interface NeglectedTasksProps {
  activeTasks: ActiveTask[];
  projectData: ProjectData[];
}

const NeglectedTasks: React.FC<NeglectedTasksProps> = ({ activeTasks, projectData }) => {
  if (activeTasks && projectData) {
    // Sort tasks by creation date to find the oldest ones
    const neglectedTasks = [...activeTasks]
      .filter(task => !task.due?.isRecurring)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 5); // Show top 5 oldest tasks

    // Create a map of project IDs to project names for quick lookup
    const projectMap: { [key: string]: ProjectData } = Object.fromEntries(
      projectData.map(project => [project.id, project])
    );

    return (
      <div className="pt-1 w-full">
        {neglectedTasks.length > 0 ? (
          <div className="space-y-3">
            {neglectedTasks.map((task) => {
              const project = projectMap[task.projectId];
              return (
                <div
                  key={task.id}
                  className="bg-warm-card rounded-2xl p-3 border border-warm-border hover:bg-warm-hover transition-all duration-200"
                >
                  <div className="flex space-x-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-sm font-medium truncate my-2">{task.content}</h3>

                      <div className="flex items-center space-x-1 mt-1 w-full">
                        <span className="inline-flex items-center max-w-[150px] px-2 py-0.5 rounded text-xs font-medium bg-warm-peach/20 text-warm-peach border border-warm-peach/30 whitespace-nowrap truncate">
                          {project?.name || 'No Project'}
                        </span>

                        <div className="flex flex-col pl-1">
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-xs text-warm-gray flex items-center">Created on {" "}
                              {new Date(task.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div>
                            {task.due && (
                              <span className="text-xs text-warm-peach flex items-center">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Due {new Date(task.due.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-warm-gray">
            No neglected tasks found
          </div>
        )}
      </div>
    );
  } else {
    return <div className="text-center py-4 text-warm-gray">Loading tasks...</div>;
  }
};

export default NeglectedTasks;
