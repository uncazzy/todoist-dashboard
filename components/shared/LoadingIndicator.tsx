import React from 'react';
import { MAX_TASKS } from '../../utils/constants';
import { Tooltip } from 'react-tooltip';
import { BsExclamationTriangle } from 'react-icons/bs';
import { trackData } from '@/utils/analytics';

interface LoadingIndicatorProps {
  loading: boolean;
  loadingMore: boolean;
  loadingProgress: {
    loaded: number;
    total: number;
  };
  isLoadingFromCache: boolean;
  onRefresh: () => void;
  loadError?: {
    message: string;
    type: 'partial' | 'full';
    timestamp: number;
  } | undefined;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  loading,
  loadingMore,
  loadingProgress,
  isLoadingFromCache,
  onRefresh,
  loadError,
}) => {
  const progressPercentage =
    (loadingProgress.loaded / Math.min(MAX_TASKS, loadingProgress.total)) * 100;

  const handleRefresh = () => {
    trackData('refresh');
    onRefresh();
  };

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
    <div className="mb-8 bg-warm-card border border-warm-border p-2 sm:p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-warm-gray">
          Last updated: {getTimeAgo(lastUpdateTime)}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || loadingMore}
          className="flex items-center px-3 py-1 text-sm bg-warm-hover hover:bg-warm-border rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title={loading ? 'Loading in progress' : 'Refresh tasks from Todoist'}
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
      <div className="bg-warm-border rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 max-w-full ${
            loadError ? 'bg-warm-peach' : 'bg-warm-sage'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="text-sm mt-2 text-center flex items-center justify-center gap-2">
        <span className={loadError ? 'text-warm-peach' : 'text-warm-gray'}>
          {isLoadingFromCache ? 'Loaded from cache: ' : 'Loaded '}
          {loadingProgress.loaded} out of {Math.min(MAX_TASKS, loadingProgress.total)} tasks
          {loadingProgress.total > MAX_TASKS && (
            <span className="text-warm-gray/70"> ({loadingProgress.total} total available)</span>
          )}
        </span>
        {loadError && (
          <>
            <BsExclamationTriangle
              className="text-warm-peach cursor-help"
              data-tooltip-id="error-tooltip"
              data-tooltip-content={`Only partial data loaded: ${loadError.message}`}
            />
            <Tooltip id="error-tooltip" positionStrategy="fixed" openOnClick={true} className="z-50 max-w-xs text-center" />
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;
