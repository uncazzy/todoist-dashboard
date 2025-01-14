import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { getProjectById, colorNameToHex } from "../../utils/projectUtils";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { CompletedTask, ProjectData, TodoistColor } from "../../types";

interface TaskWithProject {
  task: CompletedTask;
  projectId: string;
}

interface ProjectInfo {
  projectName: string;
  projectColor: TodoistColor;
}

interface TasksProps {
  getPageItems: () => TaskWithProject[];
  projectData: ProjectData[];
  groupByProject: boolean;
}

interface ProjectGroup {
  project: ProjectInfo | undefined;
  tasks: CompletedTask[];
}

const extractTagsAndContent = (content: string) => {
  const tags = content.match(/@\S+/g) || [];
  const cleanContent = content.replace(/@\S+/g, '').trim();
  return { tags, cleanContent };
};

export default function Tasks({ getPageItems, projectData, groupByProject }: TasksProps) {
  const tasks = getPageItems();

  if (groupByProject) {
    // Group tasks by project
    const tasksByProject = tasks.reduce<Record<string, CompletedTask[]>>((acc, { task, projectId }) => {
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(task);
      return acc;
    }, {});

    // Sort projects by name
    const sortedProjects: ProjectGroup[] = Object.entries(tasksByProject)
      .map(([projectId, tasks]) => ({
        project: getProjectById(projectId, projectData),
        tasks: tasks.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      }))
      .sort((a, b) => (a.project?.projectName ?? '').localeCompare(b.project?.projectName ?? ''));


    // View for printing
    return (
      <div className="flex flex-col gap-8 print:gap-12">
        {sortedProjects.map(({ project, tasks }) => (
          <div key={project?.projectName} className="print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-4 print:border-b print:border-gray-300 print:pb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: colorNameToHex(project?.projectColor as TodoistColor, '80') || '#808080',
                  borderColor: colorNameToHex(project?.projectColor as TodoistColor) || '#808080',
                  borderWidth: '2px'
                }}
              />
              <h2 className="text-xl font-semibold print:text-gray-900">{project?.projectName || 'Unknown Project'}</h2>
              <span className="text-sm text-gray-500 print:text-gray-600">({tasks.length} tasks)</span>
            </div>
            <ul className="flex flex-col gap-2 print:gap-3">
              {tasks.map(task => (
                <li
                  key={task.id}
                  className="relative flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-gray-800 group print:hover:bg-transparent print:border-b print:border-gray-100 print:pb-3"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="pr-2 text-gray-300 group-hover:text-white transition-colors duration-200 print:text-gray-900">
                            <ReactMarkdown
                              unwrapDisallowed
                              allowedElements={["span", "em", "a"]}
                              className="break-words text-sm md:text-base print:text-base"
                            >
                              {extractTagsAndContent(task.content).cleanContent}
                            </ReactMarkdown>
                          </div>
                          {extractTagsAndContent(task.content).tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {extractTagsAndContent(task.content).tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 text-xs bg-gray-500/30 text-gray-300 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-center">
                          <div className="text-xs text-gray-500 whitespace-nowrap print:text-gray-600">
                            <IoIosCheckmarkCircle className="inline text-lg mr-1" title="Done" />
                            {new Date(task.completed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // Regular view for screen (non-print)
  return (
    <ul className="flex flex-col gap-2 border border-gray-800 rounded-lg p-4 print:border-gray-200 print:gap-4">
      {tasks.map(({ task, projectId }) => {
        const projectInfo = getProjectById(projectId, projectData);
        const projectColorHex = colorNameToHex(projectInfo?.projectColor as TodoistColor) || '#808080';

        return (
          <li
            key={task.id}
            className="relative flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-gray-800 group print:hover:bg-transparent print:border-b print:border-gray-100 print:pb-4"
          >
            <div className="flex space-x-3 w-full">
              <span
                className="w-3 h-3 rounded-full transition-all duration-200 group-hover:ring-2 ring-offset-2 ring-offset-gray-900 print:ring-offset-white"
                style={{
                  backgroundColor: projectColorHex + '80',
                  borderColor: projectColorHex,
                  borderWidth: '2px'
                }}
                title={projectInfo?.projectName}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between gap-y-2">
                  <div className="flex flex-col">
                    <div className="pr-2 text-gray-300 group-hover:text-white transition-colors duration-200 print:text-gray-900">
                      <ReactMarkdown
                        unwrapDisallowed
                        allowedElements={["span", "em", "a"]}
                        className="my-[-0.4rem] break-words text-sm md:text-base print:text-base"
                      >
                        {extractTagsAndContent(task.content).cleanContent}
                      </ReactMarkdown>
                    </div>
                    {extractTagsAndContent(task.content).tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {extractTagsAndContent(task.content).tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-xs bg-gray-500/30 text-gray-300 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:items-end justify-center">
                    <div className="text-xs text-gray-300 whitespace-nowrap print:inline">
                      <IoIosCheckmarkCircle className="inline text-lg mr-1" title="Done" />
                      {new Date(task.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-200 whitespace-nowrap print:text-gray-600 sm:mt-1" title={projectInfo?.projectName}>
                      {projectInfo?.projectName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
