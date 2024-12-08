import React, { useState, useEffect, useCallback, memo } from 'react';
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
import { IoMdTrendingDown, IoMdTrendingUp } from 'react-icons/io';
import { SiTodoist } from 'react-icons/si';
import CompletionStreak from './CompletionStreak';
import TaskWordCloud from './TaskWordCloud';
import RecurringTasksMatrix from './RecurringTasksMatrix';
import { BsQuestionCircle, BsListTask, BsArrowRepeat } from 'react-icons/bs';
import { MAX_TASKS, CACHE_DURATION } from '../utils/constants';
import { DashboardData, LoadingProgress } from '../types';

export default function Dashboard(): JSX.Element {
  const { status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMoreTasks, setHasMoreTasks] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({ loaded: 0, total: 0 });
  const [fullyLoaded, setFullyLoaded] = useState<boolean>(false);
  const [autoLoading, setAutoLoading] = useState<boolean>(true);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState<boolean>(false);

  // Validate stored data
  const isValidData = useCallback((data: any): data is DashboardData => {
    return (
      data &&
      data.allCompletedTasks &&
      Array.isArray(data.allCompletedTasks) &&
      data.projectData &&
      Array.isArray(data.projectData)
    );
  }, []);

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      setAutoLoading(true);
      setError(null);

      // Try to get data from localStorage
      const storedData = localStorage.getItem('todoist_dashboard_data');
      const storedTime = localStorage.getItem('todoist_dashboard_timestamp');

      // Use cached data if valid and fresh
      if (storedData && storedTime) {
        const parsedData: DashboardData = JSON.parse(storedData);
        const timeDiff = Date.now() - parseInt(storedTime);

        if (isValidData(parsedData) && timeDiff < CACHE_DURATION) {
          setIsLoadingFromCache(true);
          setData(parsedData);
          setHasMoreTasks(false);
          setLoadingProgress({
            loaded: parsedData.allCompletedTasks.length,
            total: parsedData.totalCompletedTasks,
          });
          setFullyLoaded(true);
          setAutoLoading(false);
          setLoading(false);
          return;
        }
      }

      setIsLoadingFromCache(false);
      const response = await fetch('/api/getTasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks. Please try again later.');
      }

      const result: DashboardData = await response.json();
      if (!isValidData(result)) {
        throw new Error('Invalid data received from server');
      }

      // Set initial data and progress
      setData(result);
      setHasMoreTasks(result.hasMoreTasks || false);
      setLoadingProgress({
        loaded: result.allCompletedTasks.length,
        total: result.totalCompletedTasks,
      });

      // Continue loading if we haven't reached MAX_TASKS
      const targetAmount = Math.min(MAX_TASKS, result.totalCompletedTasks);
      setAutoLoading(result.allCompletedTasks.length < targetAmount);
      setFullyLoaded(result.allCompletedTasks.length >= targetAmount || !result.hasMoreTasks);

      // Only cache if we're done loading
      if (result.allCompletedTasks.length >= targetAmount || !result.hasMoreTasks) {
        localStorage.setItem('todoist_dashboard_data', JSON.stringify(result));
        localStorage.setItem('todoist_dashboard_timestamp', Date.now().toString());
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setAutoLoading(false);
    } finally {
      setLoading(false);
    }
  }, [status, isValidData]);

  const loadMoreTasks = useCallback(async () => {
    if (loadingMore || !hasMoreTasks || !data?.allCompletedTasks) return;

    try {
      setLoadingMore(true);
      const currentOffset = data.allCompletedTasks.length;
      const totalTasks = data.totalCompletedTasks;

      const response = await fetch(
        `/api/getTasks?loadMore=true&offset=${currentOffset}&total=${totalTasks}`
      );
      if (!response.ok) {
        throw new Error('Failed to load more tasks');
      }

      const result = await response.json();
      if (!result?.newTasks || !Array.isArray(result.newTasks)) {
        throw new Error('Invalid data received when loading more tasks');
      }

      if (result.newTasks.length > 0) {
        const updatedData: DashboardData = {
          ...data,
          allCompletedTasks: [...data.allCompletedTasks, ...result.newTasks],
        };

        setData(updatedData);
        setHasMoreTasks(result.hasMoreTasks);
        setLoadingProgress((prev) => ({
          ...prev,
          loaded: updatedData.allCompletedTasks.length,
        }));

        const targetAmount = Math.min(MAX_TASKS, totalTasks);
        const totalLoaded = updatedData.allCompletedTasks.length;

        // Continue loading if we haven't reached our target
        if (totalLoaded < targetAmount) {
          setAutoLoading(true);
          setFullyLoaded(false);
        } else {
          setAutoLoading(false);
          setFullyLoaded(true);
          // Update cache only when we've loaded all tasks
          localStorage.setItem('todoist_dashboard_data', JSON.stringify(updatedData));
          localStorage.setItem('todoist_dashboard_timestamp', Date.now().toString());
        }
      } else {
        setHasMoreTasks(false);
        setAutoLoading(false);
        setFullyLoaded(true);
        // Update cache when we're done (even if no new tasks)
        localStorage.setItem('todoist_dashboard_data', JSON.stringify(data));
        localStorage.setItem('todoist_dashboard_timestamp', Date.now().toString());
      }
    } catch (err: any) {
      console.error('Error loading more tasks:', err);
      setError(err.message);
      setAutoLoading(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreTasks, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (autoLoading && hasMoreTasks && !loadingMore && data?.allCompletedTasks) {
      timeoutId = setTimeout(loadMoreTasks, 100); // Small delay to prevent rate limiting
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [autoLoading, hasMoreTasks, loadingMore, data, loadMoreTasks]);

  // Helper function to determine karma level
  const getKarmaLevel = (karma: number): string => {
    if (karma >= 50000) return 'Enlightened';
    if (karma >= 20000) return 'Grand Master';
    if (karma >= 10000) return 'Master';
    if (karma >= 7500) return 'Expert';
    if (karma >= 5000) return 'Professional';
    if (karma >= 2500) return 'Intermediate';
    if (karma >= 500) return 'Novice';
    return 'Beginner';
  };

  // Loading indicator component
  const LoadingIndicator: React.FC = () => {
    const progressPercentage =
      (loadingProgress.loaded / Math.min(MAX_TASKS, loadingProgress.total)) * 100;
    const isFullyLoaded =
      loadingProgress.loaded >= Math.min(MAX_TASKS, loadingProgress.total);

    // Calculate time since last update
    const lastUpdateTime = localStorage.getItem('todoist_dashboard_timestamp');
    const getTimeAgo = (timestamp: string | null): string => {
      if (!timestamp) return 'never';
      const seconds = Math.floor((Date.now() - parseInt(timestamp)) / 1000);
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    };

    const handleRefresh = () => {
      // Clear cache
      localStorage.removeItem('todoist_dashboard_data');
      localStorage.removeItem('todoist_dashboard_timestamp');
      // Refetch data
      fetchData();
    };

    return (
      <div className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-400">
            Last updated: {getTimeAgo(lastUpdateTime)}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || loadingMore || !isFullyLoaded}
            className="flex items-center px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !isFullyLoaded
                ? 'Please wait until all tasks are loaded'
                : 'Refresh tasks from Todoist'
            }
          >
            <svg
              className={`w-4 h-4 mr-1 ${loading || loadingMore ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
        <div className="bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 max-w-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-sm text-gray-400 mt-2 text-center">
          {isLoadingFromCache ? 'Loaded from cache: ' : 'Loaded '}
          {loadingProgress.loaded} out of {Math.min(MAX_TASKS, loadingProgress.total)} tasks
          {loadingProgress.total > MAX_TASKS && (
            <span className="text-gray-500"> ({loadingProgress.total} total available)</span>
          )}
        </div>
      </div>
    );
  };

  const QuestionMark: React.FC<{ content: string }> = memo(({ content }) => (
    <BsQuestionCircle
      className="inline-block ml-2 text-gray-400 hover:text-gray-300 cursor-help"
      data-tooltip-id="dashboard-tooltip"
      data-tooltip-content={content}
    />
  ));
  QuestionMark.displayName = 'QuestionMark';

  if (loading) {
    // Don't show loading message until we have a task count
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading your dashboard...</h2>
          {loadingProgress.total > 0 && (
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
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 rounded-lg">
        <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-gray-900 rounded-lg">
        <p className="text-gray-400">No data available. Please check your Todoist connection.</p>
      </div>
    );
  }

  const { projectData, allCompletedTasks, totalCompletedTasks, activeTasks } = data;

  const needsFullData = !fullyLoaded && hasMoreTasks;

  return (
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
        <LoadingIndicator />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition-transform">
            <h3 className="text-gray-400 text-sm sm:text-base mb-2">Active Tasks</h3>
            <div className="text-2xl sm:text-3xl font-bold text-blue-400">
              {activeTasks.length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition-transform">
            <h3 className="text-gray-400 text-sm sm:text-base mb-2">Active Projects</h3>
            <div className="text-2xl sm:text-3xl font-bold text-blue-400">
              {projectData.length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition-transform">
            <h3 className="text-gray-400 text-sm sm:text-base mb-2">Completed Tasks</h3>
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">
              {totalCompletedTasks}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition-transform">
            <h3 className="text-gray-400 text-sm sm:text-base mb-2">Karma Score</h3>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-green-400">
                  {data?.karma || 0}
                </div>
                {data?.karmaTrend !== 'none' && (
                  <div
                    className={`text-xl ${data?.karmaRising ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {data?.karmaRising ? <IoMdTrendingUp /> : <IoMdTrendingDown />}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {getKarmaLevel(data?.karma || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Insights Section */}
          <div className="lg:col-span-3">
            <Insights
              allData={data}
              isLoading={loading || loadingMore || autoLoading}
              fullyLoaded={fullyLoaded}
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
              <CompletedTasksOverTime allData={allCompletedTasks} loading={loading} />
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

        <div className="space-y-8">
          {/* Task Topics Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <BsListTask className="w-5 h-5" />
                <span>Task Topics</span>
              </h2>
              <div className="flex items-center space-x-2">
                <Tooltip content="Shows the most common topics in your tasks">
                  <BsQuestionCircle className="w-5 h-5 text-gray-400" />
                </Tooltip>
              </div>
            </div>
            <TaskWordCloud tasks={[...activeTasks, ...allCompletedTasks]} />
          </div>

          {/* Recurring Tasks Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <BsArrowRepeat className="w-5 h-5" />
                <span>Recurring Tasks</span>
              </h2>
              <div className="flex items-center space-x-2">
                <Tooltip content="Track your recurring tasks and habits. View completion rates, streaks, and trends.">
                  <BsQuestionCircle className="w-5 h-5 text-gray-400" />
                </Tooltip>
              </div>
            </div>
            {needsFullData ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <RecurringTasksMatrix
                activeTasks={activeTasks}
                allCompletedTasks={allCompletedTasks}
                projectData={projectData}
              />
            )}
          </div>
        </div>

      </div>
      <Tooltip
        id="dashboard-tooltip"
        place="top"
        className="max-w-xs text-center"
      />
    </div>
  );
}
