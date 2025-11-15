import React, { memo } from 'react';
import { calculateMostProductiveDay } from "../utils/calculateMostProductiveDay";
import { calculateMostProductiveTimeOfDay } from "../utils/calculateMostProductiveTimeOfDay";
import { calculateMostProductiveDayOfWeek } from "../utils/calculateMostProductiveDayOfWeek";
import { getDayOfWeekName, DayOfWeek } from "../utils/getDayOfWeekName";
import { calculateCompletionRates } from "../utils/calculateCompletionRates";
import { calculateCreatedTasks } from "../utils/calculateCreatedTasks";
import { calculateTaskAverages } from "../utils/calculateTaskAverages";
import { Tooltip } from 'react-tooltip';
import { BsQuestionCircle } from 'react-icons/bs';
import TrendChart from './TrendChart';
import GoalProgress from './GoalProgress';
import { DashboardData } from '../types';

// Additional types for utility function returns
type MostProductiveDay = {
  date: string;
  count: number;
};

type FocusTimeRange = {
  startTime: string;
  endTime: string;
  count: number;
};

type MostProductiveDayOfWeek = {
  dayOfWeek: number;
  averageCount: number;
};

type CompletionRates = {
  dailyCompletionRate: number;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
};

type TaskAverageHistory = {
  data: number[];
  labels: string[];
};

type TaskAverage = {
  average: number;
  percentChange: number;
  history: TaskAverageHistory;
};

type TaskAverages = {
  last24Hours?: TaskAverage;
  last7Days?: TaskAverage;
  last30Days?: TaskAverage;
};

type CreatedTasks = {
  weeklyTasks: number[];
};

type ProjectStat = {
  name: string;
  completedTasks: number;
  color: string;
};

type QuestionMarkProps = {
  content: string;
};

const QuestionMark: React.FC<QuestionMarkProps> = memo(({ content }) => (
  <BsQuestionCircle
    className="inline-block ml-2 text-warm-gray hover:text-white cursor-help"
    data-tooltip-id="insights-tooltip"
    data-tooltip-content={content}
  />
));

QuestionMark.displayName = 'QuestionMark';

type MetricCardProps = {
  icon: string;
  title: string;
  value: string;
  subtext?: string;
  tooltipContent: string;
};

const MetricCard: React.FC<MetricCardProps> = memo(
  ({ icon, title, value, subtext, tooltipContent }) => (
    <div
      className="flex flex-col items-center p-4 bg-warm-hover border border-warm-border rounded-2xl cursor-help hover:bg-warm-card transition-colors"
      data-tooltip-id="insights-tooltip"
      data-tooltip-content={tooltipContent}
    >
      <span className="text-4xl mb-2">{icon}</span>
      <span className="text-sm text-warm-gray">{title}</span>
      <span className="text-lg text-warm-peach font-semibold">{value}</span>
      {subtext && (
        <span className="text-xs text-warm-gray mt-1">{subtext}</span>
      )}
    </div>
  )
);

MetricCard.displayName = 'MetricCard';

type InsightsProps = {
  allData: DashboardData | null;
  isLoading: boolean;
  fullyLoaded: boolean;
};

const Insights: React.FC<InsightsProps> = ({ allData, isLoading }) => {
  if (!allData) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-warm-peach mx-auto"></div>
          <p className="mt-4 text-warm-gray">Loading insights...</p>
        </div>
      </div>
    );
  }

  const { allCompletedTasks, projectData } = allData;

  try {
    const mostProductiveDay: MostProductiveDay | null =
      calculateMostProductiveDay(allCompletedTasks);
    const focusTimeRange: FocusTimeRange | null =
      calculateMostProductiveTimeOfDay(allCompletedTasks);
    const mostProductiveDayOfWeek: MostProductiveDayOfWeek | null =
      calculateMostProductiveDayOfWeek(allCompletedTasks);
    const completionRates: CompletionRates =
      calculateCompletionRates(allCompletedTasks);
    const { weeklyTasks }: CreatedTasks =
      calculateCreatedTasks(allCompletedTasks);
    const taskAverages: TaskAverages | null = calculateTaskAverages(allCompletedTasks);

    // Calculate productivity score (0-100)
    const productivityScore = Math.min(
      100,
      Math.round(
        completionRates.weeklyCompletionRate * 40 +
        completionRates.monthlyCompletionRate * 30 +
        ((mostProductiveDay?.count || 0) > 5
          ? 30
          : (mostProductiveDay?.count || 0) * 6)
      )
    );

    // Get project statistics
    const projectStats: ProjectStat[] =
      projectData
        ?.filter((project) => project.name !== 'Inbox')
        .map((project) => ({

          name: project.name,
          completedTasks: allCompletedTasks.filter(
            (task) => task.project_id === project.id
          ).length,
          color: project.color || 'charcoal',
        }))
        .sort((a, b) => b.completedTasks - a.completedTasks) || [];

    return (
      <div className={`w-full space-y-8 print:space-y-12 ${isLoading ? 'opacity-50' : ''}`}>
        {/* Productivity Score and Key Metrics */}
        <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
          {/* Productivity Score */}
          <div className="text-center">
            <div className="inline-block relative">
              <svg className="w-40 h-40" viewBox="0 0 100 100">
                <circle
                  className="text-warm-border"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-warm-peach"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                  strokeDasharray={`${(2 * Math.PI * 40 * productivityScore) / 100
                    } ${2 * Math.PI * 40}`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold">{productivityScore}</span>
              </div>
            </div>
            <p className="text-xl mt-2">
              Productivity Score
              <QuestionMark content="Your productivity score is based on your completion rates and task consistency" />
            </p>
          </div>

          {/* Key Metrics */}
          <div className="flex-1 bg-warm-card border border-warm-border p-6 rounded-2xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-white">
              Key Metrics
              <QuestionMark content="Overview of your most productive periods" />
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {mostProductiveDay && (
                <MetricCard
                  icon="📅"
                  title="Most Productive Day"
                  value={mostProductiveDay.date}
                  subtext={`${mostProductiveDay.count} tasks`}
                  tooltipContent="Your most productive day with the highest task completion"
                />
              )}
              {focusTimeRange && (
                <MetricCard
                  icon="🎯"
                  title="Focus Mode"
                  value={`${focusTimeRange.startTime}-${focusTimeRange.endTime}`}
                  subtext={`${focusTimeRange.count} tasks`}
                  tooltipContent="Your optimal focus hours based on task completion patterns"
                />
              )}
              {mostProductiveDayOfWeek && (
                <MetricCard
                  icon="📊"
                  title="Best Day of Week"
                  value={getDayOfWeekName(mostProductiveDayOfWeek.dayOfWeek as DayOfWeek)}
                  subtext={`${Math.round(
                    mostProductiveDayOfWeek.averageCount
                  )} tasks/day`}
                  tooltipContent={`Average of ${Math.round(
                    mostProductiveDayOfWeek.averageCount
                  )} tasks completed on ${getDayOfWeekName(
                    mostProductiveDayOfWeek.dayOfWeek as DayOfWeek
                  )}s over the last 4 weeks`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Goal Progress Section */}
        <div className="bg-warm-card border border-warm-border p-6 rounded-2xl print:bg-transparent print:border print:border-gray-200">
          <h3 className="text-xl font-semibold mb-6 text-white print:text-gray-900">
            Goal Progress
          </h3>
          <GoalProgress allData={allData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Completion Rates */}
          <div className="bg-warm-card border border-warm-border p-6 rounded-2xl">
            <h3 className="text-xl font-semibold mb-6 text-white">
              Completion Rates
              <QuestionMark content="Your task completion rates compared to your average performance" />
            </h3>
            <div className="space-y-6">
              {['daily', 'weekly', 'monthly'].map((period) => {
                const rate = completionRates[
                  `${period}CompletionRate` as keyof CompletionRates
                ] as number;
                const tooltipContent = `Tasks completed ${period === 'daily'
                  ? 'today'
                  : period === 'weekly'
                    ? 'last 7 days'
                    : 'last 30 days'
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
                    data-tooltip-id="insights-tooltip"
                    data-tooltip-content={tooltipContent}
                  >
                    <span className="text-lg">
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </span>
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
              {projectStats.slice(0, 5).map((project, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3"
                  data-tooltip-id="insights-tooltip"
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
                const heightPercentage =
                  maxTasks > 0 ? (count / maxTasks) * 100 : 0;

                // Calculate the day for this index (6 days ago to today)
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const dayName = date.toLocaleDateString('en-US', {
                  weekday: 'short',
                });
                const fullDayName = date.toLocaleDateString('en-US', {
                  weekday: 'long',
                });

                return (
                  <div
                    key={index}
                    className="relative flex flex-col items-center"
                    style={{ flex: '1 1 0' }}
                    data-tooltip-id="insights-tooltip"
                    data-tooltip-content={`${count} tasks completed on ${fullDayName}`}
                  >
                    <div className="relative w-full h-40 flex items-end justify-center">
                      <div
                        className="absolute bottom-0 w-8 bg-warm-blue rounded-t transition-all duration-500"
                        style={{
                          height: `${heightPercentage}%`,
                        }}
                      />
                    </div>
                    <span className="mt-2 text-sm font-medium">{dayName}</span>
                    <span className="text-xs text-warm-gray mt-1">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Completion Trends */}
        <div className="bg-warm-card border border-warm-border p-2 md:p-6 rounded-2xl mt-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-white">
            Task Completion Trends
            <QuestionMark content="Historical trends of your task completion patterns" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Daily Trend */}
            <div>
              {isLoading || !taskAverages?.last24Hours ? (
                <div className="flex items-center justify-center h-[240px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-warm-gray">Daily</span>
                    <div className="flex items-center">
                      <span className="text-warm-peach font-semibold mr-3">
                        {taskAverages.last24Hours.average} avg
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded cursor-help ${taskAverages.last24Hours.percentChange >= 0
                          ? 'text-warm-sage bg-warm-sage/10'
                          : 'text-warm-peach bg-warm-peach/10'
                          }`}
                        data-tooltip-id="insights-tooltip"
                        data-tooltip-content={`${Math.abs(
                          taskAverages.last24Hours.percentChange
                        )}% ${taskAverages.last24Hours.percentChange >= 0
                          ? 'above'
                          : 'below'
                          } your daily average (comparing last 24 hours to 4-week average)`}
                      >
                        {taskAverages.last24Hours.percentChange >= 0 ? '↑' : '↓'}{' '}
                        {Math.abs(taskAverages.last24Hours.percentChange)}%
                      </span>
                    </div>
                  </div>
                  <TrendChart
                    data={taskAverages.last24Hours.history.data}
                    labels={taskAverages.last24Hours.history.labels}
                    height={180}
                  />
                </>
              )}
            </div>

            {/* Weekly Trend */}
            <div>
              {isLoading || !taskAverages?.last7Days ? (
                <div className="flex items-center justify-center h-[240px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-warm-gray">Weekly</span>
                    <div className="flex items-center">
                      <span className="text-warm-peach font-semibold mr-3">
                        {taskAverages.last7Days.average} avg
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded cursor-help ${taskAverages.last7Days.percentChange >= 0
                          ? 'text-warm-sage bg-warm-sage/10'
                          : 'text-warm-peach bg-warm-peach/10'
                          }`}
                        data-tooltip-id="insights-tooltip"
                        data-tooltip-content={`${Math.abs(
                          taskAverages.last7Days.percentChange
                        )}% ${taskAverages.last7Days.percentChange >= 0
                          ? 'above'
                          : 'below'
                          } your weekly average (comparing last 7 days to 12-week average)`}
                      >
                        {taskAverages.last7Days.percentChange >= 0 ? '↑' : '↓'}{' '}
                        {Math.abs(taskAverages.last7Days.percentChange)}%
                      </span>
                    </div>
                  </div>
                  <TrendChart
                    data={taskAverages.last7Days.history.data}
                    labels={taskAverages.last7Days.history.labels}
                    height={180}
                  />
                </>
              )}
            </div>

            {/* Monthly Trend */}
            <div>
              {isLoading || !taskAverages?.last30Days ? (
                <div className="flex items-center justify-center h-[240px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-warm-gray">Monthly</span>
                    <div className="flex items-center">
                      <span className="text-warm-peach font-semibold mr-3">
                        {taskAverages.last30Days.average} avg
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded cursor-help ${taskAverages.last30Days.percentChange >= 0
                          ? 'text-warm-sage bg-warm-sage/10'
                          : 'text-warm-peach bg-warm-peach/10'
                          }`}
                        data-tooltip-id="insights-tooltip"
                        data-tooltip-content={`${Math.abs(
                          taskAverages.last30Days.percentChange
                        )}% ${taskAverages.last30Days.percentChange >= 0
                          ? 'above'
                          : 'below'
                          } your monthly average (comparing last 30 days to 12-month average)`}
                      >
                        {taskAverages.last30Days.percentChange >= 0 ? '↑' : '↓'}{' '}
                        {Math.abs(taskAverages.last30Days.percentChange)}%
                      </span>
                    </div>
                  </div>
                  <TrendChart
                    data={taskAverages.last30Days.history.data}
                    labels={taskAverages.last30Days.history.labels}
                    height={180}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <Tooltip
          id="insights-tooltip"
          className="z-50 max-w-[90vw] break-words"
          place="bottom"
          positionStrategy="fixed"
          noArrow={true}
          style={{
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            color: '#e5e7eb',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            maxWidth: '90vw',
            wordBreak: 'break-word',
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Error in Insights component:', error);
    return (
      <div className="w-full p-6 bg-warm-peach/10 border border-warm-peach/30 rounded-lg">
        <h3 className="text-xl font-semibold text-warm-peach mb-2">
          Error Loading Insights
        </h3>
        <p className="text-warm-gray">
          There was an error loading your insights. Please try refreshing the
          page.
        </p>
      </div>
    );
  }
};

export default memo(Insights);