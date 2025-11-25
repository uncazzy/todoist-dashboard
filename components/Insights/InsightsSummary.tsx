/**
 * Insights Summary Component
 * Displays Completion Rates, Project Distribution, and Weekly Progress in a 3-column grid
 */

import React, { memo } from 'react';
import { Tooltip } from 'react-tooltip';
import { BsQuestionCircle } from 'react-icons/bs';
import { calculateCompletionRates } from '../../utils/calculateCompletionRates';
import { calculateCreatedTasks } from '../../utils/calculateCreatedTasks';
import { CompletedTask, ProjectData } from '../../types';

type QuestionMarkProps = {
  content: string;
};

const QuestionMark: React.FC<QuestionMarkProps> = memo(({ content }) => (
  <BsQuestionCircle
    className="inline-block ml-2 text-warm-gray hover:text-white cursor-help"
    data-tooltip-id="summary-tooltip"
    data-tooltip-content={content}
  />
));

QuestionMark.displayName = 'QuestionMark';

type CompletionRates = {
  dailyCompletionRate: number;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
};

type ProjectStat = {
  id: string;
  name: string;
  completedTasks: number;
  color: string;
};

type InsightsSummaryProps = {
  completedTasks: CompletedTask[];
  projectData: ProjectData[];
  loading?: boolean;
};

const InsightsSummary: React.FC<InsightsSummaryProps> = ({
  completedTasks,
  projectData,
  loading,
}) => {
  const completionRates = calculateCompletionRates(completedTasks);
  const { weeklyTasks } = calculateCreatedTasks(completedTasks);

  // Get project statistics
  const projectStats: ProjectStat[] =
    projectData
      ?.filter((project) => project.name !== 'Inbox')
      .map((project) => ({
        id: project.id,
        name: project.name,
        completedTasks: completedTasks.filter((task) => task.project_id === project.id).length,
        color: project.color || 'charcoal',
      }))
      .sort((a, b) => b.completedTasks - a.completedTasks) || [];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${loading ? 'opacity-50' : ''}`}>
      {/* Completion Rates */}
      <div className="bg-warm-card border border-warm-border p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-6 text-white">
          Completion Rates
          <QuestionMark content="Your task completion rates compared to your average performance" />
        </h3>
        <div className="space-y-6">
          {['daily', 'weekly', 'monthly'].map((period) => {
            const rate = completionRates[`${period}CompletionRate` as keyof CompletionRates] as number;
            const tooltipContent = `Tasks completed ${
              period === 'daily' ? 'today' : period === 'weekly' ? 'last 7 days' : 'last 30 days'
            } vs. your ${period} average`;
            const barColor =
              period === 'daily'
                ? 'bg-warm-sage'
                : period === 'weekly'
                  ? 'bg-warm-blue'
                  : 'bg-warm-peach';

            return (
              <div
                key={period}
                className="flex items-center justify-between"
                data-tooltip-id="summary-tooltip"
                data-tooltip-content={tooltipContent}
              >
                <span className="text-lg">{period.charAt(0).toUpperCase() + period.slice(1)}</span>
                <div className="flex items-center flex-1 ml-4">
                  <div className="w-full h-3 bg-warm-hover rounded-full mr-3">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                  <span className="text-lg font-semibold min-w-[3rem] text-right">
                    {Math.round(rate)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Distribution */}
      <div className="bg-warm-card border border-warm-border p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-6 text-white">
          Project Distribution
          <QuestionMark content="Distribution of completed tasks across your top projects" />
        </h3>
        <div className="space-y-4">
          {projectStats.slice(0, 5).map((project) => (
            <div
              key={project.id}
              className="flex items-center space-x-3"
              data-tooltip-id="summary-tooltip"
              data-tooltip-content={`${project.completedTasks} tasks completed in ${project.name}`}
            >
              <div className="w-32 truncate" title={project.name}>
                {project.name}
              </div>
              <div className="flex-1">
                <div className="w-full h-3 bg-warm-hover rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(project.completedTasks / (projectStats?.[0]?.completedTasks ?? 1)) * 100}%`,
                      backgroundColor: `var(--${project.color}-color, #808080)`,
                    }}
                  />
                </div>
              </div>
              <div className="text-lg font-semibold min-w-[3rem] text-right">
                {project.completedTasks}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-warm-card border border-warm-border p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-10 text-white">
          Weekly Progress
          <QuestionMark content="Number of tasks completed in the last 7 days" />
        </h3>
        <div className="flex justify-between items-end h-48 px-2">
          {weeklyTasks.map((count: number, index: number) => {
            const maxTasks = Math.max(...weeklyTasks);
            const heightPercentage = maxTasks > 0 ? (count / maxTasks) * 100 : 0;

            // Calculate the day for this index (6 days ago to today)
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const fullDayName = date.toLocaleDateString('en-US', { weekday: 'long' });

            return (
              <div
                key={index}
                className="relative flex flex-col items-center"
                style={{ flex: '1 1 0' }}
                data-tooltip-id="summary-tooltip"
                data-tooltip-content={`${count} tasks completed on ${fullDayName}`}
              >
                <div className="relative w-full h-40 flex items-end justify-center">
                  <div
                    className="absolute bottom-0 w-8 bg-warm-blue rounded-t transition-all duration-500"
                    style={{ height: `${heightPercentage}%` }}
                  />
                </div>
                <span className="mt-2 text-sm font-medium">{dayName}</span>
                <span className="text-xs text-warm-gray mt-1">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Tooltip id="summary-tooltip" positionStrategy="fixed" openOnClick={true} className="z-50 max-w-xs text-center" />
    </div>
  );
};

export default memo(InsightsSummary);
