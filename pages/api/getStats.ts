import { getToken } from 'next-auth/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { TodoistStats, ErrorResponse } from '../../types';
import { fetchWithRetry } from '../../utils/fetchWithRetry';

// Custom error class for Todoist API errors
class TodoistAPIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'TodoistAPIError';
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TodoistStats | ErrorResponse>
) {
  // Validate request method
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      details: 'Only GET requests are supported'
    });
  }

  try {
    const token = await getToken({ req });
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No token found'
      });
    }

    if (!token.accessToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No access token found'
      });
    }

    const accessToken = token.accessToken as string;

    const response = await fetchWithRetry('https://api.todoist.com/sync/v9/completed/get_stats', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      maxRetries: 3
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      throw new TodoistAPIError(
        response.status,
        `Todoist API error: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json() as TodoistStats;
    
    // Validate response data
    if (!data || typeof data.completed_count === 'undefined') {
      throw new Error('Invalid response data from Todoist API');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getStats:', error);
    
    if (error instanceof TodoistAPIError) {
      return res.status(error.statusCode).json({
        error: 'Todoist API Error',
        details: error.message
      });
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return res.status(502).json({
        error: 'Invalid Response',
        details: 'Failed to parse Todoist API response'
      });
    }

    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
