import { Session } from "next-auth/core/types";
import type { Project as TodoistProject } from "@doist/todoist-api-typescript";

// API Response Types - These match the actual API responses
export type CompletedTask = {
  completed_at: string;
  content: string;
  id: string;
  item_object: any | null;
  meta_data: any | null;
  note_count: number;
  notes: any[];
  project_id: string;
  section_id: string;
  task_id: string;
  user_id: string;
  v2_project_id: string;
  v2_section_id: string;
  v2_task_id: string;
};

// Active task type from the API response
export type ActiveTask = {
  assigneeId?: string | null;
  assignerId?: string | null;
  commentCount: number;
  content: string;
  createdAt: string;
  creatorId: string;
  description: string;
  due?: {
    // Required fields
    isRecurring: boolean;
    string: string;
    date: string;
    // Optional fields
    datetime?: string | null;
    timezone?: string | null;
  } | null;
  id: string;
  isCompleted: boolean;
  labels: string[];
  order: number;
  parentId?: string | null;
  priority: number;
  projectId: string;
  sectionId?: string | null;
  url: string;
  deadline?: string | null;
};

// Project data from API response
export interface ProjectData extends Omit<TodoistProject, 'parent_id'> {
  parentId: string | null;
}

export interface DashboardData {
  activeTasks: ActiveTask[];
  allCompletedTasks: CompletedTask[];
  hasMoreTasks: boolean;
  karma: number;
  karmaRising: boolean;
  karmaTrend: 'up' | 'down' | 'none';
  dailyGoal: number;
  weeklyGoal: number;
  projectData: ProjectData[];
  totalCompletedTasks: number;
  loadError?: {
    message: string;
    type: 'partial' | 'full';
    timestamp: number;
  };
}

export interface LoadingProgress {
  loaded: number;
  total: number;
}

export interface TodoistStats {
  completed_count: number;
  completed_today: number;
  completed_items: number[];
  karma: number;
  karma_trend: string;
  daily_goal: number;
  daily_goal_reached: boolean;
  weekly_goal: number;
  weekly_goal_reached: boolean;
}

export interface TodoistUserData {
  user: {
    karma: number;
    karma_trend: string;
  };
}

export interface LoadMoreResponse {
  newTasks: CompletedTask[];
  hasMoreTasks: boolean;
  totalTasks: number;
  loadedTasks: number;
}

export interface KarmaStats {
  karma: number;
  karmaRising: boolean;
  karmaTrend: 'up' | 'down' | 'none';
}

export interface TodoistUser {
  id: number;
  email: string;
  full_name: string;
  image_id?: string;
  is_premium: boolean;
  join_date: string;
  karma: number;
  karma_trend: string;
  daily_goal: number;
  weekly_goal: number;
  premium_until?: string;
  start_page: string;
  timezone: string;
}

export interface ExtendedSession extends Session {
  accessToken?: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export type TodoistColor =
  | 'berry_red'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'olive_green'
  | 'lime_green'
  | 'green'
  | 'mint_green'
  | 'teal'
  | 'sky_blue'
  | 'light_blue'
  | 'blue'
  | 'grape'
  | 'violet'
  | 'lavender'
  | 'magenta'
  | 'salmon'
  | 'charcoal'
  | 'grey'
  | 'taupe';

// Date Range Types for Dashboard Filtering
export type DateRangePreset = 'all' | '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';

export interface DateRange {
  start: Date | null;
  end: Date | null;
  preset: DateRangePreset;
}

// Dashboard Preferences (persisted in localStorage)
export interface DashboardPreferences {
  selectedProjectIds: string[];
  dateRange: DateRange;
  version: number; // For schema migration in the future
}