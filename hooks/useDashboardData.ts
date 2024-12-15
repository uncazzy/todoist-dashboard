import { useState, useEffect, useCallback, useRef } from 'react';
import { CACHE_DURATION, STALE_DURATION, MAX_TASKS } from '../utils/constants';
import { DashboardData } from '../types';

// Helper: Validate data shape
function isValidDashboardData(data: unknown): data is DashboardData {
  if (!data || typeof data !== 'object') return false;
  const d = data as DashboardData;
  return (
    Array.isArray(d.allCompletedTasks) &&
    Array.isArray(d.projectData) &&
    typeof d.totalCompletedTasks === 'number' &&
    typeof d.hasMoreTasks === 'boolean'
  );
}

// Helper: Local Storage Operations with Try/Catch
function loadFromCache(): { data: DashboardData | null; timestamp: number | null } {
  try {
    const storedData = localStorage.getItem('todoist_dashboard_data');
    const storedTime = localStorage.getItem('todoist_dashboard_timestamp');
    if (!storedData || !storedTime) return { data: null, timestamp: null };
    const parsedData = JSON.parse(storedData);
    if (!isValidDashboardData(parsedData)) return { data: null, timestamp: null };
    return { data: parsedData, timestamp: parseInt(storedTime, 10) };
  } catch (err) {
    console.error('Error reading from cache:', err);
    return { data: null, timestamp: null };
  }
}

function saveToCache(data: DashboardData) {
  try {
    localStorage.setItem('todoist_dashboard_data', JSON.stringify(data));
    localStorage.setItem('todoist_dashboard_timestamp', Date.now().toString());
  } catch (err) {
    // Local storage might fail in private mode, ignore gracefully.
    console.warn('Failed to save to cache:', err);
  }
}

function clearCache() {
  try {
    localStorage.removeItem('todoist_dashboard_data');
    localStorage.removeItem('todoist_dashboard_timestamp');
  } catch (err) {
    console.warn('Failed to clear cache:', err);
  }
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Load More Tasks function
  const loadMoreTasks = useCallback(async (currentData: DashboardData): Promise<DashboardData> => {
    let updatedData = { ...currentData };
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    while (updatedData.hasMoreTasks && updatedData.allCompletedTasks.length < MAX_TASKS) {
      if (!isMountedRef.current) break;

      try {
        const response = await fetch(
          `/api/getTasks?loadMore=true&offset=${updatedData.allCompletedTasks.length}&total=${updatedData.totalCompletedTasks}`,
          { signal: abortControllerRef.current?.signal || null }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch more tasks: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        if (!Array.isArray(result.newTasks)) {
          throw new Error('Invalid response format: newTasks is not an array');
        }

        // If no new tasks, we are done
        if (result.newTasks.length === 0) {
          updatedData.hasMoreTasks = false;
          break;
        }

        updatedData.allCompletedTasks = [...updatedData.allCompletedTasks, ...result.newTasks];
        updatedData.hasMoreTasks = result.hasMoreTasks && updatedData.allCompletedTasks.length < MAX_TASKS;

        // Update UI state
        if (isMountedRef.current) {
          setData(updatedData);
          setLoadingProgress({
            loaded: Math.min(result.loadedTasks, MAX_TASKS),
            total: Math.min(result.totalTasks, MAX_TASKS),
          });
        }

        // Reset retry count on success
        retryCount = 0;
        lastError = null;

        // Add delay if still more tasks to fetch, to avoid rate-limit issues
        if (updatedData.hasMoreTasks) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Fetch aborted, just return what we have
          return updatedData;
        }

        lastError = err instanceof Error ? err : new Error('Unknown error occurred');
        retryCount++;
        
        if (retryCount >= MAX_RETRIES) {
          console.error('Max retries reached while loading tasks:', err);
          // Store the error but continue with partial data
          updatedData.loadError = {
            message: lastError.message,
            type: 'partial',
            timestamp: Date.now()
          };
          updatedData.hasMoreTasks = false;
          break;
        }

        // Exponential backoff for transient errors
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    // Ensure hasMoreTasks is false if we reached MAX_TASKS
    if (updatedData.allCompletedTasks.length >= MAX_TASKS) {
      updatedData.hasMoreTasks = false;
    }

    return updatedData;
  }, []);

  const fetchFreshData = useCallback(async (): Promise<DashboardData> => {
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/getTasks', {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!isValidDashboardData(result)) {
        throw new Error('Invalid data received from server');
      }

      // Respect MAX_TASKS limit initially
      return {
        ...result,
        hasMoreTasks: result.hasMoreTasks && result.allCompletedTasks.length < MAX_TASKS
      };
    } catch (err) {
      // For initial data fetch, if we fail completely, throw the error
      throw err;
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setError(null);
    let freshDataNeeded = true;
    let partialDataLoaded = false;

    // Attempt to load from cache
    const { data: cachedData, timestamp } = loadFromCache();
    if (cachedData && timestamp) {
      const timeDiff = Date.now() - timestamp;

      // If data is still fresh
      if (timeDiff < CACHE_DURATION) {
        setData(cachedData);
        setLoadingProgress({
          loaded: Math.min(cachedData.allCompletedTasks.length, MAX_TASKS),
          total: Math.min(cachedData.totalCompletedTasks, MAX_TASKS)
        });
        setIsLoadingFromCache(true);
        setIsLoading(false);
        freshDataNeeded = false;
      } 
      // If data is stale but not too old, show it while fetching fresh data
      else if (timeDiff < STALE_DURATION) {
        setData(cachedData);
        setLoadingProgress({
          loaded: Math.min(cachedData.allCompletedTasks.length, MAX_TASKS),
          total: Math.min(cachedData.totalCompletedTasks, MAX_TASKS)
        });
        setIsLoadingFromCache(true);
        partialDataLoaded = true;
      }
    }

    if (!freshDataNeeded && isMountedRef.current) {
      // We got fresh data from cache, no fetch needed
      return;
    }

    // Otherwise, fetch fresh data now
    try {
      setIsLoading(true);
      const initialData = await fetchFreshData();
      
      if (!isMountedRef.current) return;

      let finalData = initialData;
      setData(finalData);
      setLoadingProgress({
        loaded: Math.min(finalData.allCompletedTasks.length, MAX_TASKS),
        total: Math.min(finalData.totalCompletedTasks, MAX_TASKS)
      });

      if (initialData.hasMoreTasks && isMountedRef.current) {
        try {
          finalData = await loadMoreTasks(initialData);
          if (isMountedRef.current) {
            setData(finalData);
            setLoadingProgress(prev => prev ? {
              ...prev,
              loaded: Math.min(finalData.allCompletedTasks.length, MAX_TASKS)
            } : null);
          }
        } catch (err) {
          // If we fail loading more tasks, keep the initial data
          console.error('Error loading more tasks:', err);
          finalData = {
            ...initialData,
            loadError: {
              message: err instanceof Error ? err.message : 'Failed to load all tasks',
              type: 'partial',
              timestamp: Date.now()
            }
          };
          if (isMountedRef.current) {
            setData(finalData);
          }
        }
      }

      // Save to cache even if we have partial data
      if (isMountedRef.current && finalData.allCompletedTasks.length > 0) {
        saveToCache(finalData);
      }

    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        console.error('Error fetching dashboard data:', err);
        
        // If we have partial data from cache, keep it
        if (partialDataLoaded && cachedData) {
          setData({
            ...cachedData,
            loadError: {
              message: message,
              type: 'partial',
              timestamp: Date.now()
            }
          });
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsLoadingFromCache(false);
      }
    }
  }, [fetchFreshData, loadMoreTasks]);

  const refreshData = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset states
    setIsLoadingFromCache(false);
    setLoadingProgress(null);
    setData(null);
    setError(null);
    setIsLoading(true);

    clearCache();
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchData]);

  return { data, isLoading, error, loadingProgress, isLoadingFromCache, refreshData };
}
