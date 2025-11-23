import { TodoistApi, Project, Task } from "@doist/todoist-api-typescript";
import { getToken } from 'next-auth/jwt';
import { MAX_TASKS, INITIAL_BATCH_SIZE } from "../../utils/constants";
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchWithRetry } from '../../utils/fetchWithRetry';
import type {
  CompletedTask,
  TodoistStats,
  TodoistUser,
  LoadMoreResponse,
  ErrorResponse,
  DashboardData,
  ActiveTask,
  ProjectData
} from '../../types';
import { USE_FAKE_DATA } from '../../config/dataSource';
import fakeDataset from '../../test/data/fake-dataset.json';

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

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse | LoadMoreResponse | ErrorResponse>
) {
  try {
    // If using fake data, return it immediately
    if (USE_FAKE_DATA) {

      // Handle "load more" requests (fake data is already fully loaded)
      if (request.query.loadMore === 'true') {
        return response.status(200).json({
          newTasks: [],
          hasMoreTasks: false,
          totalTasks: fakeDataset.totalCompletedTasks,
          loadedTasks: fakeDataset.totalCompletedTasks
        });
      }

      // Return fake dataset
      return response.status(200).json(fakeDataset as unknown as ApiResponse);
    }

    const token = await getToken({ req: request });
    if (!token?.accessToken) {
      return response.status(401).json({ error: "Not authenticated" });
    }

    const accessToken = token.accessToken as string;
    const api = new TodoistApi(accessToken);

    // Handle "load more" requests
    if (request.query.loadMore === 'true') {
      const offset = parseInt(request.query.offset as string) || 0;
      const total = parseInt(request.query.total as string) || 0;

      try {
        const newTasks = await fetchCompletedTasksBatch(accessToken, offset, INITIAL_BATCH_SIZE);
        return response.status(200).json({
          newTasks,
          hasMoreTasks: offset + newTasks.length < total && offset + newTasks.length < MAX_TASKS,
          totalTasks: total,
          loadedTasks: offset + newTasks.length
        });
      } catch (error) {
        console.error('Error loading more tasks:', error);
        return response.status(500).json({ error: 'Failed to load more tasks' });
      }
    }

    // Get user data (includes karma)
    const userResponse = await fetchWithRetry(`https://api.todoist.com/sync/v9/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      maxRetries: 3
    });

    if (!userResponse.ok) {
      throw new TodoistAPIError(
        userResponse.status,
        `Failed to fetch user data: ${userResponse.status} ${userResponse.statusText}`
      );
    }

    const userData = await userResponse.json() as TodoistUser;

    // Fetch other required data
    const [totalCount, projects, tasks] = await Promise.all([
      getTotalTaskCount(accessToken),
      api.getProjects(),
      api.getTasks()
    ]);

    const initialTasks = await fetchCompletedTasksBatch(accessToken, 0, INITIAL_BATCH_SIZE);

    // Map projects to our internal format
    const projectData = projects.map(mapToProjectData);
    
    // Map active tasks to our internal format
    const activeTasks = tasks.map(mapToActiveTask);

    const responseData: ApiResponse = {
      allCompletedTasks: initialTasks,
      projectData,
      activeTasks,
      totalCompletedTasks: totalCount,
      hasMoreTasks: initialTasks.length < Math.min(totalCount, MAX_TASKS),
      karma: userData.karma,
      karmaRising: userData.karma_trend === 'up',
      karmaTrend: userData.karma_trend as 'up' | 'down' | 'none',
      dailyGoal: userData.daily_goal,
      weeklyGoal: userData.weekly_goal
    };

    response.status(200).json(responseData);
  } catch (error) {
    console.error('Error in getTasks API:', error);
    if (error instanceof TodoistAPIError) {
      return response.status(error.statusCode).json({ 
        error: error.message,
        details: 'Todoist API error'
      });
    }
    if (error instanceof ValidationError) {
      return response.status(400).json({ 
        error: error.message,
        details: 'Validation error'
      });
    }
    response.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
