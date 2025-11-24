import type { DateRangePreset } from '@/types';

/**
 * Calculates the date range for a given preset
 *
 * @param preset - The date range preset to calculate
 * @returns Object with start and end dates, or null for "all time"
 *
 * All presets calculate from TODAY (calendar-based):
 * - '7d': Last 7 days (today - 7 days to today)
 * - '30d': Last 30 days
 * - '90d': Last 90 days
 * - '6m': Last 6 months
 * - '1y': Last 1 year
 * - 'all': No filtering (null dates)
 * - 'custom': Should not be used (custom dates set manually)
 */
export function getDateRangeFromPreset(
  preset: DateRangePreset
): { start: Date | null; end: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'all':
      return { start: null, end: null };

    case '7d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    case '90d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    case '6m': {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    case '1y': {
      const start = new Date(today);
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    case 'custom':
      // Custom ranges should be set manually, not calculated
      return { start: null, end: null };

    default:
      // Fallback to "all time"
      return { start: null, end: null };
  }
}

/**
 * Gets a human-readable label for a date range preset
 *
 * @param preset - The date range preset
 * @returns Human-readable label
 */
export function getPresetLabel(preset: DateRangePreset): string {
  switch (preset) {
    case 'all':
      return 'All Time';
    case '7d':
      return 'Last 7 Days';
    case '30d':
      return 'Last 30 Days';
    case '90d':
      return 'Last 90 Days';
    case '6m':
      return 'Last 6 Months';
    case '1y':
      return 'Last Year';
    case 'custom':
      return 'Custom Range';
    default:
      return 'All Time';
  }
}
