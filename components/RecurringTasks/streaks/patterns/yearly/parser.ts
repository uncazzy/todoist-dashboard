import { YearlyRecurrencePattern, RecurrenceTypes } from '../../types';

export function parseYearlyPattern(pattern: string): YearlyRecurrencePattern {
  if (!pattern || typeof pattern !== 'string') {
    throw new Error('Invalid yearly pattern format');
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    throw new Error('Invalid yearly pattern format');
  }

  // Match patterns for yearly recurrences
  const patterns = [
    // Basic yearly patterns
    /^every\s+year$/i,
    /^every\s+(\d+)\s+years?$/i,
    // Month and day patterns
    /^every\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?$/i,
    /^every\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?$/i,
    // With time
    /^every\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)$/i,
    /^every\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)$/i
  ];

  if (!patterns.some(regex => regex.test(normalizedPattern))) {
    throw new Error('Invalid yearly pattern format');
  }

  let interval = 1;
  let month = 0;
  let dayOfMonth = 1;

  // Handle interval if specified
  if (normalizedPattern.includes('years')) {
    const intervalMatch = normalizedPattern.match(/every\s+(\d+)\s+years/);
    if (intervalMatch?.[1]) {
      interval = parseInt(intervalMatch[1], 10);
    }
  }

  // Extract month and day
  const monthMatch = normalizedPattern.match(/(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  if (monthMatch) {
    const monthStr = monthMatch[0].toLowerCase();
    const monthMap: Record<string, number> = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    const mappedMonth = monthMap[monthStr];
    if (mappedMonth === undefined) {
      throw new Error(`Invalid month: ${monthStr}`);
    }
    month = mappedMonth;
  }

  // Extract day of month
  const dayMatch = normalizedPattern.match(/\d{1,2}(?:st|nd|rd|th)?/);
  if (dayMatch) {
    dayOfMonth = parseInt(dayMatch[0], 10);
  }

  // Validate day of month
  if (dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error('Invalid day of month');
  }

  return {
    type: RecurrenceTypes.YEARLY,
    interval,
    month,
    dayOfMonth
  };
}
