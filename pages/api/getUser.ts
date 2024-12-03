import { getToken } from 'next-auth/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { TodoistUser, ErrorResponse } from '../../types';
import { fetchWithRetry } from '../../utils/fetchWithRetry';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<TodoistUser | ErrorResponse>
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return response.status(401).json({ error: "Not authenticated" });
    }

    if (!token.accessToken) {
      return response.status(401).json({ error: "No access token found" });
    }

    const accessToken = token.accessToken as string;

    const getUserDetails = await fetchWithRetry(`https://api.todoist.com/sync/v9/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      maxRetries: 3
    });

    if (!getUserDetails.ok) {
      const errorData = await getUserDetails.json();
      console.error("Error from Todoist API:", errorData);
      return response.status(getUserDetails.status).json({ error: "Failed to fetch user details from Todoist" });
    }

    const userDetail = await getUserDetails.json() as TodoistUser;
    response.status(200).json(userDetail);
  } catch (error) {
    console.error("Error in getUser API:", error);
    response.status(500).json({ error: "Internal server error" });
  }
}
