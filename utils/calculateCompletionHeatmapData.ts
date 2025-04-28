import { CompletedTask } from '../types';

export interface HeatmapDataPoint {
  hour: number;
  day: number;
  value: number;
}

export interface HeatmapData {
  // Data points in format where day is 0-6 (Sun-Sat) and hour is 0-23
  data: HeatmapDataPoint[];
  // Max value for scaling
  maxValue: number;
  // Total completions
  totalCompletions: number;
  // Most active day and hour combinations
  mostActiveDay: { day: number; count: number };
  mostActiveHour: { hour: number; count: number };
  mostActiveCombination: { day: number; hour: number; count: number };
}

/**
 * Calculate completion heatmap data based on day of week and hour of day
 * @param completedTasks Array of completed tasks
 * @returns Heatmap data
 */
export function calculateCompletionHeatmapData(completedTasks: CompletedTask[]): HeatmapData {
  // Use a map with string keys instead of a 2D array to avoid TypeScript undefined errors
  const heatmap = new Map<string, number>();
  const dayCounters = new Map<number, number>();
  const hourCounters = new Map<number, number>();
  
  // Track maximums
  let maxDayCount = 0;
  let maxDay = 0;
  let maxHourCount = 0;
  let maxHour = 0;
  let maxCombinationCount = 0;
  let maxCombinationDay = 0;
  let maxCombinationHour = 0;
  
  // Helper function to get a key for the map
  const getKey = (day: number, hour: number): string => `${day}:${hour}`;
  
  // Process all tasks
  for (const task of completedTasks) {
    const date = new Date(task.completed_at);
    const day = date.getDay(); // 0-6
    const hour = date.getHours(); // 0-23
    
    // Skip invalid data
    if (day < 0 || day >= 7 || hour < 0 || hour >= 24) continue;
    
    // Update heatmap
    const key = getKey(day, hour);
    const currentValue = heatmap.get(key) || 0;
    heatmap.set(key, currentValue + 1);
    
    // Update day counter
    const currentDayCount = dayCounters.get(day) || 0;
    dayCounters.set(day, currentDayCount + 1);
    
    // Update hour counter
    const currentHourCount = hourCounters.get(hour) || 0;
    hourCounters.set(hour, currentHourCount + 1);
    
    // Check if this is a new max day
    if (currentDayCount + 1 > maxDayCount) {
      maxDayCount = currentDayCount + 1;
      maxDay = day;
    }
    
    // Check if this is a new max hour
    if (currentHourCount + 1 > maxHourCount) {
      maxHourCount = currentHourCount + 1;
      maxHour = hour;
    }
    
    // Check if this is a new max combination
    if (currentValue + 1 > maxCombinationCount) {
      maxCombinationCount = currentValue + 1;
      maxCombinationDay = day;
      maxCombinationHour = hour;
    }
  }
  
  // Convert to the format expected by the heatmap component
  const data: HeatmapDataPoint[] = [];
  let maxValue = 0;
  
  // Generate data points for all day/hour combinations
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const value = heatmap.get(getKey(day, hour)) || 0;
      data.push({ day, hour, value });
      maxValue = Math.max(maxValue, value);
    }
  }
  
  return {
    data,
    maxValue,
    totalCompletions: completedTasks.length,
    mostActiveDay: { day: maxDay, count: maxDayCount },
    mostActiveHour: { hour: maxHour, count: maxHourCount },
    mostActiveCombination: {
      day: maxCombinationDay,
      hour: maxCombinationHour, 
      count: maxCombinationCount
    }
  };
} 