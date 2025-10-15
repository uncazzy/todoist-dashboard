import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tooltip } from 'react-tooltip';
import ActiveTasksByProject from './ActiveTasksByProject';
import CompletedTasksByProject from './CompletedTasksByProject';
import Insights from './Insights';
import RecentlyCompletedList from './RecentlyCompleted/RecentlyCompletedList';
import CompletedTasksOverTime from './CompletedTasksOverTime';
import TaskPriority from './TaskPriority';
import NeglectedTasks from './NeglectedTasks';
import CompletedByTimeOfDay from './CompletedByTimeOfDay';
import { SiTodoist } from 'react-icons/si';
import CompletionStreak from './CompletionStreak';
import TaskWordCloud from './TaskWordCloud';
import RecurringTasksPreview from './RecurringTasks/RecurringTasksPreview';
import { BsQuestionCircle } from 'react-icons/bs';
import { MAX_TASKS } from '../utils/constants';
import QuestionMark from './shared/QuestionMark';
import LoadingIndicator from './shared/LoadingIndicator';
import QuickStats from './QuickStats/QuickStats';
import { useDashboardData } from '../hooks/useDashboardData';
import Layout from './layout/Layout';
import ProjectPicker from './ProjectPicker';
import TaskLeadTime from './TaskLeadTime';
import ProjectVelocity from './ProjectVelocity';
import CompletionHeatmap from './CompletionHeatmap';
import ExportButton from './Export/ExportButton';
import ExportModal from './Export/ExportModal';
import { useExportSection } from '../hooks/useExportManager';

export default function Dashboard(): JSX.Element {
  const { status } = useSession();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const {
    data,
    isLoading,
    error,
    loadingProgress,
    isLoadingFromCache,
    refreshData
  } = useDashboardData();

  // Register export sections
  const quickStatsRef = useExportSection('quick-stats', 'Quick Stats');
  const insightsRef = useExportSection('insights', 'Insights');
  const projectVelocityRef = useExportSection('project-velocity', 'Project Velocity & Focus Shifts');
  const recentlyCompletedRef = useExportSection('recently-completed', 'Recently Completed Tasks');
  const neglectedTasksRef = useExportSection('neglected-tasks', 'Neglected Tasks');
  const recurringTasksRef = useExportSection('recurring-tasks', 'Recurring Tasks');
  const taskPriorityRef = useExportSection('task-priority', 'Tasks by Priority');
  const activeTasksRef = useExportSection('active-tasks', 'Active Tasks by Project');
  const completedOverTimeRef = useExportSection('completed-over-time', 'Completed Tasks Over Time');
  const completedByProjectRef = useExportSection('completed-by-project', 'Completed Tasks by Project');
  const completionHeatmapRef = useExportSection('completion-heatmap', 'Completion Patterns Heatmap');
  const dailyStreakRef = useExportSection('daily-streak', 'Daily Streak');
  const dailyActivityRef = useExportSection('daily-activity', 'Daily Activity Pattern');
  const taskLeadTimeRef = useExportSection('task-lead-time', 'Task Lead Time Analysis');
  const taskTopicsRef = useExportSection('task-topics', 'Task Topics');

  if (status !== 'authenticated') {
    return (
      <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
        <div className="p-6 bg-gray-900 rounded-lg">
          <p className="text-gray-400">Please sign in to view your dashboard.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading && (!loadingProgress || loadingProgress.total === 0)) {
    return (
      <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Loading your dashboard...</h2>
            {loadingProgress && loadingProgress.total > 0 && (
              <div className="text-gray-400">
                Loaded {loadingProgress.loaded} out of {Math.min(MAX_TASKS, loadingProgress.total)}{' '}
                tasks
                {loadingProgress.total > MAX_TASKS && (
                  <span className="text-gray-500"> ({loadingProgress.total} total available)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
        <div className="p-6 bg-red-900/20 rounded-lg">
          <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
        <div className="p-6 bg-gray-900 rounded-lg">
          <p className="text-gray-400">No data available. Please check your Todoist connection.</p>
        </div>
      </Layout>
    );
  }

  const { projectData, allCompletedTasks, activeTasks } = data;
  const needsFullData = data.hasMoreTasks;

  const filteredActiveTasks = selectedProjectIds.length > 0
    ? activeTasks?.filter(task => selectedProjectIds.includes(task.projectId)) || []
    : activeTasks || [];

  const filteredCompletedTasks = selectedProjectIds.length > 0
    ? allCompletedTasks?.filter(task => selectedProjectIds.includes(task.project_id)) || []
    : allCompletedTasks || [];

  const filteredProjects = selectedProjectIds.length > 0
    ? projectData?.filter(project => selectedProjectIds.includes(project.id)) || []
    : projectData || [];

  return (
    <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
      <div className="min-h-screen rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto p-6">
          <header className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                  Todoist Dashboard
                </h1>
                <p className="text-gray-400">
                  <span>
                    <SiTodoist className="inline text-red-500 ml-1 mr-2" />
                  </span>
                  Your productivity at a glance
                </p>
              </div>
              <div className="flex items-center gap-3">
                {data?.projectData && (
                  <ProjectPicker
                    projects={data.projectData}
                    selectedProjectIds={selectedProjectIds}
                    onProjectSelect={setSelectedProjectIds}
                  />
                )}
                <ExportButton
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={isLoading || !data}
                />
              </div>
            </div>
          </header>

          {/* Always show loading indicator */}
          <LoadingIndicator
            loading={isLoading}
            loadingMore={false}
            loadingProgress={loadingProgress || { loaded: 0, total: 0 }}
            isLoadingFromCache={isLoadingFromCache}
            onRefresh={refreshData}
            loadError={data?.loadError}
          />

          {/* Quick Stats */}
          <div ref={quickStatsRef}>
            <QuickStats
              activeTasks={filteredActiveTasks}
              projectCount={selectedProjectIds.length || data?.projectData?.length || 0}
              totalCompletedTasks={filteredCompletedTasks.length}
              karma={data?.karma || 0}
              karmaTrend={data?.karmaTrend || 'none'}
              karmaRising={data?.karmaRising || false}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Insights Section */}
            <div className="lg:col-span-3" ref={insightsRef}>
              <Insights
                allData={{
                  ...data,
                  activeTasks: filteredActiveTasks,
                  allCompletedTasks: filteredCompletedTasks
                }}
                isLoading={isLoading}
                fullyLoaded={!needsFullData}
              />
            </div>

            {/* Project Velocity & Focus Drift */}
            <div className="lg:col-span-3 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg" ref={projectVelocityRef}>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Project Velocity & Focus Shifts
                <QuestionMark content="Shows how your focus shifts between projects over time. Analyze your project velocity (tasks completed per period) and focus drift (percentage of total effort per project)." />
              </h2>
              <ProjectVelocity
                completedTasks={filteredCompletedTasks}
                projectData={filteredProjects}
                loading={needsFullData}
              />
            </div>

            {/* Two Column Layout for Tasks Overview */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg" ref={recentlyCompletedRef}>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Recently Completed <span className="text-white">✅</span>
              </h2>
              <RecentlyCompletedList
                allData={{
                  ...data,
                  allCompletedTasks: filteredCompletedTasks
                }}
              />
            </div>

            {/* Neglected Tasks Section */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg" ref={neglectedTasksRef}>
              <h2 className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 my-2">
                Neglected Tasks
                <QuestionMark content="Tasks that have been on your list the longest without being completed. Consider reviewing these tasks to either complete them, reschedule, or remove if no longer relevant." />
              </h2>
              <NeglectedTasks
                activeTasks={filteredActiveTasks}
                projectData={projectData}
              />
            </div>

            {/* Recurring Tasks Section */}
            <div className="md:col-span-3 bg-gray-800 rounded-lg" ref={recurringTasksRef}>
              <div className="flex items-center">
                <Tooltip content="Track your recurring tasks and habits. View completion rates, streaks, and trends.">
                  <BsQuestionCircle className="w-5 h-5 text-gray-400" />
                </Tooltip>
              </div>
              {needsFullData ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <RecurringTasksPreview
                  activeTasks={filteredActiveTasks}
                  allCompletedTasks={filteredCompletedTasks}
                />
              )}
            </div>

            {/* Task Management Section */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={`lg:col-span-1 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''}`}
                ref={taskPriorityRef}
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Tasks by Priority
                </h2>
                <TaskPriority
                  activeTasks={filteredActiveTasks}
                  loading={needsFullData}
                />
              </div>

              <div
                className={`lg:col-span-1 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''}`}
                ref={activeTasksRef}
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Active Tasks by Project
                </h2>
                <ActiveTasksByProject
                  projectData={filteredProjects}
                  activeTasks={filteredActiveTasks}
                  loading={needsFullData}
                />
              </div>
            </div>

            {/* Completed Tasks over time and by project */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={`bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''}`}
                ref={completedOverTimeRef}
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Completed Tasks Over Time
                </h2>
                <CompletedTasksOverTime
                  allData={filteredCompletedTasks}
                  loading={isLoading}
                />
              </div>

              <div className={`flex flex-col bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''}`} ref={completedByProjectRef}>
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Completed Tasks by Project
                </h2>
                <CompletedTasksByProject
                  projectData={filteredProjects.map(project => ({
                    ...project,
                    completedTasksCount: filteredCompletedTasks.filter(
                      task => task.project_id === project.id
                    ).length,
                  }))}
                  loading={needsFullData}
                />
              </div>
            </div>

            {/* Completion Heatmap */}
            <div className="lg:col-span-3 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg" ref={completionHeatmapRef}>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Completion Patterns Heatmap
                <QuestionMark content="Visualization of when you typically complete tasks by day of week and time of day. Identify your most productive times and optimize your schedule accordingly." />
              </h2>
              <CompletionHeatmap
                completedTasks={filteredCompletedTasks}
                loading={needsFullData}
              />
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={`lg:col-span-1 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''}`}
                ref={dailyStreakRef}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Daily Streak
                  </h2>
                </div>
                <CompletionStreak
                  allData={{
                    allCompletedTasks: filteredCompletedTasks
                  }}
                />
              </div>

              <div
                className={`lg:col-span-1 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''}`}
                ref={dailyActivityRef}
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Daily Activity Pattern
                </h2>
                <CompletedByTimeOfDay
                  allData={{
                    ...data,
                    allCompletedTasks: filteredCompletedTasks
                  }}
                  loading={needsFullData}
                />
              </div>
            </div>
          </div>

          {/* Task Lead Time Analysis */}
          <div className="lg:col-span-3 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg" ref={taskLeadTimeRef}>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Task Lead Time Analysis
              <QuestionMark content="Cycle time analysis showing how long tasks take from creation to completion. This helps identify bottlenecks in your workflow and set expectations for different types of tasks." />
            </h2>
            <TaskLeadTime
              completedTasks={filteredCompletedTasks}
              activeTasks={filteredActiveTasks}
              loading={needsFullData}
            />
          </div>

          {/* Task Topics Section */}
          <div className="bg-gray-800 rounded-lg p-6 my-6" ref={taskTopicsRef}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Task Topics
              </h2>
              <div className="flex items-center space-x-2">
                <Tooltip content="Shows the most common topics in your tasks">
                  <BsQuestionCircle className="w-5 h-5 text-gray-400" />
                </Tooltip>
              </div>
            </div>
            {needsFullData ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <TaskWordCloud
                tasks={[...filteredActiveTasks, ...filteredCompletedTasks]}
              />
            )}
          </div>
        </div>
        <Tooltip
          id="dashboard-tooltip"
          place="top"
          className="max-w-xs text-center"
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      </div>
    </Layout>
  );
}
