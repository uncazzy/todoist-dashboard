import React from 'react';
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

export default function Dashboard(): JSX.Element {
  const { status } = useSession();
  const { 
    data, 
    isLoading, 
    error, 
    loadingProgress, 
    isLoadingFromCache,
    refreshData 
  } = useDashboardData();

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

  return (
    <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
      <div className="min-h-screen rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto p-6">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Todoist Dashboard
            </h1>
            <p className="text-gray-400">
              <span>
                <SiTodoist className="inline text-red-500 ml-1 mr-2" />
              </span>
              Your productivity at a glance
            </p>
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
          <QuickStats 
            activeTasks={data?.activeTasks || []}
            projectCount={data?.projectData?.length || 0}
            totalCompletedTasks={data?.totalCompletedTasks || 0}
            karma={data?.karma || 0}
            karmaTrend={data?.karmaTrend || 'none'}
            karmaRising={data?.karmaRising || false}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Insights Section */}
            <div className="lg:col-span-3">
              <Insights
                allData={data}
                isLoading={isLoading}
                fullyLoaded={!needsFullData}
              />
            </div>

            {/* Two Column Layout for Tasks Overview */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Recently Completed <span className="text-white">✅</span>
              </h2>
              <RecentlyCompletedList allData={data} />
            </div>

            {/* Neglected Tasks Section */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 my-2">
                Neglected Tasks
                <QuestionMark content="Tasks that have been on your list the longest without being completed. Consider reviewing these tasks to either complete them, reschedule, or remove if no longer relevant." />
              </h2>
              <NeglectedTasks activeTasks={activeTasks} projectData={projectData} />
            </div>

            {/* Recurring Tasks Section */}
            <div className="md:col-span-3 bg-gray-800 rounded-lg">
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
                  activeTasks={activeTasks}
                  allCompletedTasks={allCompletedTasks}
                />
              )}
            </div>

            {/* Task Management Section */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={`lg:col-span-1 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''
                  }`}
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Tasks by Priority
                </h2>
                <TaskPriority activeTasks={data?.activeTasks || []} loading={needsFullData} />
              </div>

              <div
                className={`lg:col-span-1 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''
                  }`}
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Active Tasks by Project
                </h2>
                <ActiveTasksByProject
                  projectData={data?.projectData || []}
                  activeTasks={data?.activeTasks || []}
                  loading={needsFullData}
                />
              </div>
            </div>

            {/* Completed Tasks over time and by project */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={`bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''
                  }`}
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Completed Tasks Over Time
                </h2>
                <CompletedTasksOverTime allData={allCompletedTasks} loading={isLoading} />
              </div>

              <div className={`flex flex-col bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''}`}>
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Completed Tasks by Project
                </h2>
                <CompletedTasksByProject
                  projectData={projectData.map((project) => ({
                    ...project,
                    completedTasksCount: allCompletedTasks.filter(
                      (task) => task.project_id === project.id
                    ).length,
                  }))}
                  loading={needsFullData}
                />
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={`lg:col-span-1 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''
                  }`}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Daily Streak
                  </h2>
                </div>
                <CompletionStreak allData={data} />
              </div>

              <div
                className={`lg:col-span-1 bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg ${needsFullData ? 'opacity-50' : ''
                  }`}
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Daily Activity Pattern
                </h2>
                <CompletedByTimeOfDay allData={data} loading={needsFullData} />
              </div>
            </div>
          </div>

          {/* Task Topics Section */}
          <div className="bg-gray-800 rounded-lg p-6 my-6">
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
              <TaskWordCloud tasks={[...activeTasks, ...allCompletedTasks]} />
            )}
          </div>
        </div>
        <Tooltip
          id="dashboard-tooltip"
          place="top"
          className="max-w-xs text-center"
        />
      </div>
    </Layout>
  );
}
