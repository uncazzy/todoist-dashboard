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

  if (lower.includes('every other')) return 'other';
  
  if (
    lower.includes('every') && lower.includes('month') ||
    lower.includes('monthly') ||
    /every (\d{1,2})(st|nd|rd|th)?( day)?( of)?( the)?( month)?$/i.test(lower) || 
    /every (first|last|1st) day/i.test(lower)
  ) return 'monthly';
  if (
    lower.includes('every week') || 
    lower.includes('weekly') ||
    /every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(lower) ||
    /every (mon|tue|wed|thu|fri|sat|sun)/i.test(lower)
  ) return 'weekly';
  
  return 'other';
}
