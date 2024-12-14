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

  // Check for weekly patterns, including biweekly
  if (
    lower.includes('every week') || 
    lower.includes('weekly') ||
    /every (other )?((monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(mon|tue|wed|thu|fri|sat|sun))/i.test(lower)
  ) return 'weekly';
  
  // Check for monthly patterns
  if (
    lower.includes('every') && lower.includes('month') ||
    lower.includes('monthly') ||
    /every (\d{1,2})(st|nd|rd|th)?( day)?( of)?( the)?( month)?$/i.test(lower) || 
    /every (first|last|1st) day/i.test(lower)
  ) return 'monthly';

  // Catch any remaining "every other" patterns
  if (lower.includes('every other')) return 'other';
  
  return 'other';
}
