export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'other';

export interface TaskStats {
  taskId: string;
  frequency: RecurringFrequency;
  completedCount: number;
  totalDueCount: number;
  currentStreak: number;
  completionDates: Date[];
}