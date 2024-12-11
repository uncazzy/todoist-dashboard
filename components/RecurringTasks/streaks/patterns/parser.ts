import {
  PatternType,
  SpecialDayType,
  DailyPattern,
  WeeklyPattern,
  MonthlyPattern,
  YearlyPattern,
  RelativePattern,
  CompletionPattern,
  parseTimeOfDay,
  MONTH_NAMES,
  ORDINALS,
  HOLIDAYS
} from './types';
import { WEEKDAYS } from '../helpers/constants';
import {
  isCompletionPattern,
  isRelativePattern,
  isDailyPattern,
  isWeeklyPattern,
  isYearlyPattern,
  isMonthlyPattern
} from './patternMatchers';

type Pattern = DailyPattern | WeeklyPattern | MonthlyPattern | YearlyPattern | RelativePattern | CompletionPattern;

interface PatternOptions {
  timeOfDay?: { hours: number; minutes: number } | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

// Helper to extract time of day from pattern
function extractTimeOfDay(pattern: string): { pattern: string; timeOfDay?: { hours: number; minutes: number } } {
  const atIndex = pattern.toLowerCase().indexOf(' at ');
  if (atIndex === -1) return { pattern };

  const timeStr = pattern.slice(atIndex + 4).trim();
  const time = parseTimeOfDay(timeStr);
  if (!time) return { pattern };

  return {
    pattern: pattern.slice(0, atIndex).trim(),
    timeOfDay: time
  };
}

// Helper to extract date range from pattern
function extractDateRange(pattern: string): { 
  pattern: string;
  startDate?: Date;
  endDate?: Date;
} {
  // TODO: Implement date range extraction
  return { pattern };
}

// Main pattern parser
export function parsePattern(pattern: string): Pattern {
  if (!pattern) throw new Error('Pattern cannot be empty');

  let normalizedPattern = pattern.trim().toLowerCase();
  
  // Extract time and date range
  const { pattern: patternWithoutTime, timeOfDay } = extractTimeOfDay(normalizedPattern);
  const { pattern: finalPattern, startDate, endDate } = extractDateRange(patternWithoutTime);
  normalizedPattern = finalPattern;

  const options: PatternOptions = {
    timeOfDay: timeOfDay ? timeOfDay : null,
    startDate: startDate ? startDate : null,
    endDate: endDate ? endDate : null
  };

  // Check for completion-based patterns
  if (isCompletionPattern(normalizedPattern)) {
    return parseCompletionPattern(normalizedPattern, options);
  }

  // Check for relative patterns
  if (isRelativePattern(normalizedPattern)) {
    return parseRelativePattern(normalizedPattern, options);
  }

  // Check for daily patterns
  if (isDailyPattern(normalizedPattern)) {
    return parseDailyPattern(normalizedPattern, options);
  }

  // Check for weekly patterns
  if (isWeeklyPattern(normalizedPattern)) {
    return parseWeeklyPattern(normalizedPattern, options);
  }

  // Check for yearly patterns
  if (isYearlyPattern(normalizedPattern)) {
    return parseYearlyPattern(normalizedPattern, options);
  }

  // Check for monthly patterns
  if (isMonthlyPattern(normalizedPattern)) {
    return parseMonthlyPattern(normalizedPattern, options);
  }

  throw new Error(`Unsupported pattern format: ${pattern}`);
}

function parseDailyPattern(pattern: string, options: PatternOptions): DailyPattern {
  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Base pattern object with type-safe spread
  const basePattern: DailyPattern = {
    type: PatternType.DAILY,
    ...(options.timeOfDay ? { timeOfDay: options.timeOfDay } : {}),
    ...(options.startDate ? { startDate: options.startDate } : {}),
    ...(options.endDate ? { endDate: options.endDate } : {})
  };

  // Match patterns like "every day", "every workday", or "every 2 days in the morning"
  const dailyRegex = /^every\s+(?:(\d+)\s+)?(?:(work))?days?\s*(?:in\s+the\s+(morning|afternoon|evening|night))?$/;
  const matches = normalizedPattern.match(dailyRegex);

  if (!matches) {
    throw new Error('Invalid daily pattern format');
  }

  // Extract interval (defaults to 1)
  if (matches[1]) {
    basePattern.interval = parseInt(matches[1], 10);
  }

  // Check if it's a workday pattern
  if (matches[2] === 'work') {
    basePattern.specialDay = SpecialDayType.WORKDAY;
  }

  return basePattern;
}

function parseWeeklyPattern(pattern: string, options: PatternOptions): WeeklyPattern {
  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Base pattern object with type-safe spread
  const basePattern: WeeklyPattern = {
    type: PatternType.WEEKLY,
    weekdays: [],
    ...(options.timeOfDay ? { timeOfDay: options.timeOfDay } : {}),
    ...(options.startDate ? { startDate: options.startDate } : {}),
    ...(options.endDate ? { endDate: options.endDate } : {})
  };

  // Handle interval if specified
  if (normalizedPattern.includes('other week')) {
    basePattern.interval = 2;
  } else if (normalizedPattern.includes('weeks')) {
    const intervalMatch = normalizedPattern.match(/every\s+(\d+)\s+weeks/);
    if (intervalMatch?.[1]) {
      basePattern.interval = parseInt(intervalMatch[1], 10);
    }
  } else {
    basePattern.interval = 1;
  }

  // Extract weekdays
  for (const [weekdayStr, weekdayValue] of Object.entries(WEEKDAYS)) {
    if (normalizedPattern.includes(weekdayStr.toLowerCase())) {
      basePattern.weekdays.push(weekdayValue);
    }
  }

  // If no specific weekdays mentioned but pattern includes "week", default to Monday
  if (basePattern.weekdays.length === 0 && normalizedPattern.includes('week')) {
    basePattern.weekdays.push(1); // Monday
  }

  if (basePattern.weekdays.length === 0) {
    throw new Error(`Invalid weekly pattern format: ${pattern}`);
  }

  return basePattern;
}

function parseMonthlyPattern(pattern: string, options: PatternOptions): MonthlyPattern {
  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Base pattern object with type-safe spread
  const basePattern: MonthlyPattern = {
    type: PatternType.MONTHLY,
    ...(options.timeOfDay ? { timeOfDay: options.timeOfDay } : {}),
    ...(options.startDate ? { startDate: options.startDate } : {}),
    ...(options.endDate ? { endDate: options.endDate } : {})
  };

  // Handle interval if specified
  if (normalizedPattern.includes('other month')) {
    basePattern.interval = 2;
  } else if (normalizedPattern.includes('months')) {
    const intervalMatch = normalizedPattern.match(/every\s+(\d+)\s+months/);
    if (intervalMatch?.[1]) {
      basePattern.interval = parseInt(intervalMatch[1], 10);
    }
  } else {
    basePattern.interval = 1;
  }

  // Extract the day of month
  const dayMatch = normalizedPattern.match(/(\d+)(?:st|nd|rd|th)/);
  if (dayMatch?.[1]) {
    const day = parseInt(dayMatch[1], 10);
    if (day >= 1 && day <= 31) {
      basePattern.dayOfMonth = day;
      return basePattern;
    }
    throw new Error(`Invalid day of month: ${day}`);
  }

  // Handle "last day" patterns
  if (normalizedPattern.includes('last day')) {
    basePattern.lastDayOfMonth = true;
    return basePattern;
  }

  // Handle ordinal weekday patterns (e.g., "first monday", "last friday")
  for (const [ordinalStr, ordinalValue] of Object.entries(ORDINALS)) {
    if (normalizedPattern.includes(ordinalStr)) {
      for (const [weekdayStr, weekdayValue] of Object.entries(WEEKDAYS)) {
        if (normalizedPattern.includes(weekdayStr.toLowerCase())) {
          basePattern.weekdayOrdinal = ordinalValue;
          basePattern.weekday = weekdayValue;
          return basePattern;
        }
      }
    }
  }

  // If we have an interval but no day specification, default to first day
  if (basePattern.interval && !basePattern.dayOfMonth && !basePattern.lastDayOfMonth && !basePattern.weekdayOrdinal) {
    basePattern.dayOfMonth = 1;
    return basePattern;
  }

  throw new Error(`Invalid monthly pattern format: ${pattern}`);
}

function parseYearlyPattern(pattern: string, options: PatternOptions): YearlyPattern {
  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Base pattern object with type-safe spread
  const basePattern: YearlyPattern = {
    type: PatternType.YEARLY,
    month: 1,  // Default to January
    dayOfMonth: 1,  // Default to 1st
    ...(options.timeOfDay ? { timeOfDay: options.timeOfDay } : {}),
    ...(options.startDate ? { startDate: options.startDate } : {}),
    ...(options.endDate ? { endDate: options.endDate } : {})
  };

  // Check for holiday patterns first
  for (const [holidayName, holidayDate] of Object.entries(HOLIDAYS)) {
    if (normalizedPattern.includes(holidayName)) {
      basePattern.month = holidayDate.month;
      basePattern.dayOfMonth = holidayDate.day;
      basePattern.holiday = holidayName;
      return basePattern;
    }
  }

  // Handle interval if specified
  if (normalizedPattern.includes('other year')) {
    basePattern.interval = 2;
  } else if (normalizedPattern.includes('years')) {
    const intervalMatch = normalizedPattern.match(/every\s+(\d+)\s+years/);
    if (intervalMatch?.[1]) {
      basePattern.interval = parseInt(intervalMatch[1], 10);
    }
  } else {
    basePattern.interval = 1;
  }

  // Extract month and day
  for (const [monthStr, monthNum] of Object.entries(MONTH_NAMES)) {
    if (normalizedPattern.includes(monthStr)) {
      basePattern.month = monthNum;
      
      // Look for day after month name
      const dayMatch = normalizedPattern.match(new RegExp(`${monthStr}\\s+(\\d+)(?:st|nd|rd|th)?`));
      if (dayMatch?.[1]) {
        const day = parseInt(dayMatch[1], 10);
        if (day >= 1 && day <= 31) {
          basePattern.dayOfMonth = day;
          return basePattern;
        }
        throw new Error(`Invalid day of month: ${day}`);
      }
      break;
    }
  }

  return basePattern;
}

function parseRelativePattern(pattern: string, options: PatternOptions): RelativePattern {
  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Base pattern object with type-safe spread
  const basePattern: RelativePattern = {
    type: PatternType.RELATIVE,
    daysFromCompletion: 1,  // Default to next day
    ...(options.timeOfDay ? { timeOfDay: options.timeOfDay } : {}),
    ...(options.startDate ? { startDate: options.startDate } : {}),
    ...(options.endDate ? { endDate: options.endDate } : {})
  };

  // Match patterns like "after 3 days" or "every other day"
  if (normalizedPattern.startsWith('after')) {
    const daysMatch = normalizedPattern.match(/after\s+(\d+)\s+days?/);
    if (daysMatch?.[1]) {
      basePattern.daysFromCompletion = parseInt(daysMatch[1], 10);
    } else {
      throw new Error('Invalid relative pattern format');
    }
  } else if (normalizedPattern.includes('other')) {
    basePattern.daysFromCompletion = 2;  // every other day = 2 days from completion
  }

  return basePattern;
}

function parseCompletionPattern(pattern: string, options: PatternOptions): CompletionPattern {
  const normalizedPattern = pattern.trim().toLowerCase();
  
  // Base pattern object with type-safe spread
  const basePattern: CompletionPattern = {
    type: PatternType.COMPLETION,
    daysFromCompletion: 1,  // Default to next day
    ...(options.timeOfDay ? { timeOfDay: options.timeOfDay } : {}),
    ...(options.startDate ? { startDate: options.startDate } : {}),
    ...(options.endDate ? { endDate: options.endDate } : {})
  };

  // Match patterns with "!" like "every! 3 days"
  const daysMatch = normalizedPattern.match(/every!\s*(\d+)?\s*days?/);
  if (daysMatch) {
    if (daysMatch[1]) {
      basePattern.daysFromCompletion = parseInt(daysMatch[1], 10);
    }
    return basePattern;
  }

  throw new Error('Invalid completion pattern format');
}
