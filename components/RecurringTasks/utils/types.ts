export interface TaskStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  isLongTerm?: boolean;  // Indicates if task recurs less frequently than the analysis window
  interval?: number;     // The recurrence interval in months, if applicable
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}