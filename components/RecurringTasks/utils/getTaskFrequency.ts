import { RecurringFrequency } from '../types';

export function getTaskFrequency(dueString: string | undefined): RecurringFrequency {
  if (!dueString) return 'other';
  const lower = dueString.toLowerCase();
  
  // Check for daily patterns first, including those with intervals
  if (
    lower.includes('every day') || 
    lower.includes('daily') ||
    lower === 'every other day' ||
    /every \d+ days?/.test(lower)
  ) return 'daily';

  // Check for monthly patterns first (before weekly to avoid incorrect matches)
  if (
    lower.includes('monthly') ||
    /every (\d{1,2})(st|nd|rd|th)?( day)?( of)?( the)?( month)?$/i.test(lower) || 
    /every (first|last|1st) day/i.test(lower) ||
    // Match "every month" and "every N months" explicitly
    /every( \d+)? months?/.test(lower)
  ) return 'monthly';

  // Check for weekly patterns, including biweekly
  if (
    lower.includes('every week') || 
    lower.includes('weekly') ||
    /every (other )?((monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(mon|tue|wed|thu|fri|sat|sun))/i.test(lower)
  ) return 'weekly';
  
  // Catch any remaining "every other" patterns
  if (lower.includes('every other')) return 'other';
  
  return 'other';
}
