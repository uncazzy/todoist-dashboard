import { YearlyRecurrencePattern, RecurrenceTypes } from '../../types';

export function parseYearlyPattern(pattern: string): YearlyRecurrencePattern | null {
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern.startsWith('every')) {
    return null;
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
    return null;
  }

  let interval = 1;
  let month = 0;
  let dayOfMonth = 1;

  // Handle interval if specified
  if (normalizedPattern.includes('years')) {
    const intervalMatch = normalizedPattern.match(/every\s+(\d+)\s+years/);
    if (intervalMatch?.[1]) {
      const parsedInterval = parseInt(intervalMatch[1], 10);
      if (isNaN(parsedInterval) || parsedInterval <= 0) {
        return null;
      }
      interval = parsedInterval;
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
    const parsedMonth = monthMap[monthStr];
    if (parsedMonth === undefined) {
      return null;
    }
    month = parsedMonth;

    // Extract day of month
    const dayMatch = normalizedPattern.match(/\d{1,2}(?=(?:st|nd|rd|th)?(?:\s+|$))/);
    if (dayMatch) {
      const parsedDay = parseInt(dayMatch[0], 10);
      if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        return null;
      }
      dayOfMonth = parsedDay;
    }
  }

  return {
    type: RecurrenceTypes.YEARLY,
    interval,
    month,
    dayOfMonth,
    pattern,
    originalPattern: pattern
  };
}
