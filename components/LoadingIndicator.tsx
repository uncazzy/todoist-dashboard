import React from 'react';
import { MAX_TASKS } from '../utils/constants';

interface LoadingIndicatorProps {
  loadingProgress: {
    loaded: number;
    total: number;
  };
  isLoadingFromCache?: boolean;
  onRefresh?: () => void;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  loadingProgress,
  isLoadingFromCache = false,
  onRefresh
}) => {
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

  return (
    <div className="mb-8 bg-gray-800 p-2 sm:p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-400">
          Last updated: {getTimeAgo(lastUpdateTime)}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={!isFullyLoaded}
            className="flex items-center px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !isFullyLoaded
                ? 'Please wait until all tasks are loaded'
                : 'Refresh tasks from Todoist'
            }
          >
            <svg
              className={`w-4 h-4 mr-1 ${!isFullyLoaded ? 'animate-spin' : ''}`}
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
        )}
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

export default LoadingIndicator;
