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

export interface PatternInfo {
  pattern: string;  // 'daily', 'every-other-day', 'weekly', 'biweekly', 'months', 'monthly', 'monthly-last'
  interval: number;
  targetDates: Date[];
}

export interface PatternContext {
  today: Date;
  sixMonthsAgo: Date;
  latestCompletion?: Date;
  recentCompletions: Date[];
}
