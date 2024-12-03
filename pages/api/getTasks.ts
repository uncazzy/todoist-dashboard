import { TodoistApi, Project, Task } from "@doist/todoist-api-typescript";
import { getToken } from 'next-auth/jwt';
import { MAX_TASKS, INITIAL_BATCH_SIZE } from "../../utils/constants";
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchWithRetry } from '../../utils/fetchWithRetry';
import type { 
  CompletedTask, 
  TodoistStats, 
  TodoistUserData, 
  KarmaStats, 
  LoadMoreResponse, 
  ErrorResponse,
  DashboardData,
  ActiveTask,
  ProjectData
} from '../../types';

interface ApiResponse extends Omit<DashboardData, 'projectData'> {
  projectData: ProjectData[];
}

// Custom error classes for better error handling
class TodoistAPIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'TodoistAPIError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Map Todoist API Task to our ActiveTask type
const mapToActiveTask = (task: Task): ActiveTask => ({
  ...task,
  deadline: task.due?.date || null
});

// Map Todoist API Project to our ProjectData type
const mapToProjectData = (project: Project): ProjectData => ({
  ...project,
  parentId: project.parentId || null
});

async function getTotalTaskCount(token: string): Promise<number> {
  try {
    const response = await fetchWithRetry(
      'https://api.todoist.com/sync/v9/completed/get_stats',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        maxRetries: 3
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new TodoistAPIError(
        response.status,
        `Failed to fetch task count: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json() as TodoistStats;
    if (typeof data.completed_count !== 'number') {
      throw new Error('Invalid response: completed_count is not a number');
    }
    
    return data.completed_count;
  } catch (error) {
    console.error('Error getting total task count:', error);
    throw error; // Propagate error to be handled by the main handler
  }
}

async function fetchCompletedTasksBatch(
  token: string,
  offset: number,
  limit: number
): Promise<CompletedTask[]> {
  // Input validation
  if (!Number.isInteger(offset) || offset < 0) {
    throw new ValidationError('Invalid offset: must be a non-negative integer');
  }
  if (limit <= 0) {
    throw new ValidationError('Invalid limit: must be a positive integer');
  }

  const response = await fetchWithRetry(
    'https://api.todoist.com/sync/v9/completed/get_all',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        limit,
        offset
      }),
      maxRetries: 3
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error details available');
    throw new TodoistAPIError(
      response.status,
      `Failed to fetch completed tasks batch: ${response.status} ${response.statusText}. ${errorText}`
    );
  }

  const data = await response.json();
  if (!Array.isArray(data.items)) {
    throw new Error('Invalid response: items is not an array');
  }

  return data.items;
}

async function getKarmaStats(token: string): Promise<KarmaStats> {
  try {
    const response = await fetch('https://api.todoist.com/sync/v9/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sync_token: '*',
        resource_types: ['user']
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch karma: ${response.status}`);
    }

    const data = await response.json() as TodoistUserData;
    const trend = data.user?.karma_trend?.toLowerCase();
    
    return {
      karma: data.user?.karma || 0,
      karmaRising: trend === 'up',
      karmaTrend: (trend === 'up' || trend === 'down') ? trend : 'none'
    };
  } catch (error) {
    console.error('Error getting karma:', error);
    return { karma: 0, karmaRising: false, karmaTrend: 'none' };
  }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse | LoadMoreResponse | ErrorResponse>
) {
  // Validate request method
  if (request.method !== 'GET') {
    return response.status(405).json({ 
      error: 'Method not allowed',
      details: 'Only GET requests are supported'
    });
  }

  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return response.status(401).json({ 
        error: 'Unauthorized',
        details: 'No token found'
      });
    }

    if (!token.accessToken) {
      return response.status(401).json({ 
        error: 'Unauthorized',
        details: 'No access token found'
      });
    }

    const accessToken = token.accessToken as string;

    const { loadMore } = request.query;
    
    // If loadMore is true, fetch next batch of completed tasks
    if (loadMore === 'true') {
      const offset = parseInt(request.query.offset as string || '0');
      const totalTasks = parseInt(request.query.total as string || '0');
      
      if (isNaN(offset) || isNaN(totalTasks)) {
        return response.status(400).json({ 
          error: 'Invalid Parameters',
          details: 'offset and total must be valid numbers'
        });
      }

      // Check if we've reached the maximum task limit
      if (offset >= MAX_TASKS || offset >= totalTasks) {
        return response.status(200).json({
          newTasks: [],
          hasMoreTasks: false,
          totalTasks: totalTasks,
          loadedTasks: offset
        });
      }

      try {
        // Calculate how many tasks to fetch in this batch
        const remainingTasks = Math.min(MAX_TASKS - offset, totalTasks - offset);
        const batchSize = Math.min(INITIAL_BATCH_SIZE, remainingTasks);

        const newTasks = await fetchCompletedTasksBatch(
          accessToken,
          offset,
          batchSize
        );

        // Calculate if there are more tasks to fetch
        const nextOffset = offset + newTasks.length;
        const hasMoreTasks = newTasks.length > 0 && nextOffset < Math.min(MAX_TASKS, totalTasks);

        return response.status(200).json({
          newTasks,
          hasMoreTasks,
          totalTasks,
          loadedTasks: nextOffset
        });
      } catch (error) {
        console.error('Error fetching more tasks:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return response.status(500).json({
          error: "Failed to fetch more tasks",
          details: errorMessage
        });
      }
    }

    // Initial load
    const api = new TodoistApi(accessToken);
    const [projects, activeTasks, totalCompletedTasks, karmaStats] = await Promise.all([
      api.getProjects(),
      api.getTasks(),
      getTotalTaskCount(accessToken),
      getKarmaStats(accessToken)
    ]);

    if (totalCompletedTasks === null) {
      return response.status(500).json({ error: "Failed to get total task count" });
    }

    // Fetch first batch of completed tasks
    const completedTasks = await fetchCompletedTasksBatch(
      accessToken,
      0,
      INITIAL_BATCH_SIZE
    );

    // Calculate if there are more tasks after the initial batch
    const hasMoreTasks = completedTasks.length > 0 && 
                        completedTasks.length < Math.min(MAX_TASKS, totalCompletedTasks);

    const data: ApiResponse = {
      projectData: projects.map(mapToProjectData),
      activeTasks: activeTasks.map(mapToActiveTask),
      allCompletedTasks: completedTasks,
      totalCompletedTasks,
      hasMoreTasks,
      karma: karmaStats.karma,
      karmaRising: karmaStats.karmaRising,
      karmaTrend: karmaStats.karmaTrend
    };

    return response.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof TodoistAPIError) {
      return response.status(error.statusCode).json({
        error: 'Todoist API Error',
        details: error.message
      });
    }

    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: 'Validation Error',
        details: error.message
      });
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return response.status(502).json({
        error: 'Invalid Response',
        details: 'Failed to parse Todoist API response'
      });
    }

    return response.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
