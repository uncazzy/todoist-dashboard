import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '../types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);

  // Validate stored data
  const isValidData = useCallback((data: any): data is DashboardData => {
    return (
      data &&
      data.allCompletedTasks &&
      Array.isArray(data.allCompletedTasks) &&
      data.projectData &&
      Array.isArray(data.projectData) &&
      typeof data.totalCompletedTasks === 'number' &&
      typeof data.hasMoreTasks === 'boolean'
    );
  }, []);

  const loadMoreTasks = useCallback(async (currentData: DashboardData) => {
    try {
      const response = await fetch(`/api/getTasks?loadMore=true&offset=${currentData.allCompletedTasks.length}&total=${currentData.totalCompletedTasks}`);
      if (!response.ok) {
        throw new Error('Failed to fetch more tasks');
      }

      const result = await response.json();
      
      setData(prevData => {
        if (!prevData) return currentData;
        return {
          ...prevData,
          allCompletedTasks: [...prevData.allCompletedTasks, ...result.newTasks],
          hasMoreTasks: result.hasMoreTasks
        };
      });

      setLoadingProgress({
        loaded: result.loadedTasks,
        total: result.totalTasks
      });

      // If there are more tasks and we haven't hit rate limits, continue loading
      if (result.hasMoreTasks) {
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        return loadMoreTasks({
          ...currentData,
          allCompletedTasks: [...currentData.allCompletedTasks, ...result.newTasks],
          hasMoreTasks: result.hasMoreTasks
        });
      }

      // Cache the final complete data
      localStorage.setItem('todoist_dashboard_data', JSON.stringify({
        ...currentData,
        allCompletedTasks: [...currentData.allCompletedTasks, ...result.newTasks],
        hasMoreTasks: result.hasMoreTasks
      }));
      localStorage.setItem('todoist_dashboard_timestamp', Date.now().toString());

    } catch (err) {
      console.error('Error loading more tasks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading more tasks');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsLoadingFromCache(false);

      // Try to get data from localStorage
      const storedData = localStorage.getItem('todoist_dashboard_data');
      const storedTime = localStorage.getItem('todoist_dashboard_timestamp');

      // Use cached data if valid and fresh
      if (storedData && storedTime) {
        const parsedData: DashboardData = JSON.parse(storedData);
        const timeDiff = Date.now() - parseInt(storedTime);

        if (isValidData(parsedData) && timeDiff < CACHE_DURATION) {
          setData(parsedData);
          setLoadingProgress({
            loaded: parsedData.allCompletedTasks.length,
            total: parsedData.totalCompletedTasks
          });
          setIsLoadingFromCache(true);
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/getTasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const result = await response.json();
      if (!isValidData(result)) {
        throw new Error('Invalid data received from server');
      }

      setData(result);
      setLoadingProgress({
        loaded: result.allCompletedTasks.length,
        total: result.totalCompletedTasks
      });

      // If there are more tasks to load, start loading them
      if (result.hasMoreTasks) {
        loadMoreTasks(result);
      } else {
        // Cache the complete data
        localStorage.setItem('todoist_dashboard_data', JSON.stringify(result));
        localStorage.setItem('todoist_dashboard_timestamp', Date.now().toString());
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isValidData, loadMoreTasks]);

  const refreshData = useCallback(() => {
    // Clear cache
    localStorage.removeItem('todoist_dashboard_data');
    localStorage.removeItem('todoist_dashboard_timestamp');
    // Refetch data
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, loadingProgress, isLoadingFromCache, refreshData };
}
