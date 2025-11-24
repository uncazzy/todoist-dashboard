import type { CompletedTask, DateRange } from '@/types';

/**
 * Filters completed tasks by a date range
 *
 * @param tasks - Array of completed tasks to filter
 * @param dateRange - Date range with start and end dates
 * @returns Filtered array of completed tasks within the date range
 *
 * Notes:
 * - If both start and end are null, returns all tasks (no filtering)
 * - Filters based on the completed_at field
 * - Validates date logic (prevents invalid ranges)
 */
export function filterCompletedTasksByDateRange(
  tasks: CompletedTask[],
  dateRange: DateRange
): CompletedTask[] {
  // "All Time" filter - no date restrictions
  if (!dateRange.start && !dateRange.end) {
    return tasks;
  }

  return tasks.filter(task => {
    const completedDate = new Date(task.completed_at);

    // Check if the date is valid
    if (isNaN(completedDate.getTime())) {
      return false;
    }

    // Filter by start date (inclusive)
    if (dateRange.start && completedDate < dateRange.start) {
      return false;
    }

    // Filter by end date (inclusive)
    if (dateRange.end && completedDate > dateRange.end) {
      return false;
    }

    return true;
  });
}
