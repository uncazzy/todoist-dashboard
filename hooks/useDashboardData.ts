import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '../types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_TASKS = 1000;

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get data from localStorage
        const storedData = localStorage.getItem('todoist_dashboard_data');
        const storedTime = localStorage.getItem('todoist_dashboard_timestamp');

        // Use cached data if valid and fresh
        if (storedData && storedTime) {
          const parsedData: DashboardData = JSON.parse(storedData);
          const timeDiff = Date.now() - parseInt(storedTime);

          if (isValidData(parsedData) && timeDiff < CACHE_DURATION) {
            setData(parsedData);
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
        
        // Cache the data
        localStorage.setItem('todoist_dashboard_data', JSON.stringify(result));
        localStorage.setItem('todoist_dashboard_timestamp', Date.now().toString());

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isValidData]);

  return { data, isLoading, error };
}
