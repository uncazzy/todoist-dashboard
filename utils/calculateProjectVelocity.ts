import { CompletedTask, ProjectData } from '../types';
import { subDays, isWithinInterval } from 'date-fns';

interface ProjectVelocityItem {
  projectId: string;
  projectName: string;
  color: string;
  count: number;
  percentage: number;
}

export interface Interval {
  name: string;
  startDate: Date;
  endDate: Date;
}

interface ProjectShift {
  projectId: string;
  projectName: string;
  percentageChange: number;
  direction: 'up' | 'down';
}

export interface VelocityData {
  intervals: Interval[];
  projectData: ProjectVelocityItem[][];
  topProjectsCurrentPeriod: ProjectVelocityItem[];
  topProjectsPreviousPeriod: ProjectVelocityItem[];
  majorShifts: ProjectShift[];
}

/**
 * Calculate the velocity and focus drift for projects
 * @param completedTasks Array of completed tasks
 * @param projectData Array of project data
 * @param timeIntervals Number of time intervals to analyze (default: 4)
 * @param intervalDays Number of days per interval (default: 7)
 */
export function calculateProjectVelocity(
  completedTasks: CompletedTask[],
  projectData: ProjectData[],
  timeIntervals: number = 4,
  intervalDays: number = 7
): VelocityData {
  const now = new Date();
  
  // Create time intervals
  const intervals: Interval[] = [];
  for (let i = 0; i < timeIntervals; i++) {
    const endDate = i === 0 ? now : intervals[i - 1]?.startDate || now;
    const startDate = subDays(endDate, intervalDays);
    
    let name: string;
    if (i === 0) {
      name = 'Current';
    } else if (i === 1) {
      name = 'Previous';
    } else {
      name = `${i} periods ago`;
    }
    
    intervals.push({
      name,
      startDate,
      endDate
    });
  }

  // Create a map to efficiently look up project data
  const projectMap = new Map<string, ProjectData>();
  projectData.forEach(project => {
    projectMap.set(project.id, project);
  });

  // Calculate tasks per project per interval
  const projectVelocityData: ProjectVelocityItem[][] = intervals.map(interval => {
    // Get tasks within this interval
    const tasksInInterval = completedTasks.filter(task => {
      const completedDate = new Date(task.completed_at);
      return isWithinInterval(completedDate, {
        start: interval.startDate,
        end: interval.endDate
      });
    });

    // Count tasks per project
    const projectCounts = new Map<string, number>();
    tasksInInterval.forEach(task => {
      const projectId = task.project_id;
      projectCounts.set(projectId, (projectCounts.get(projectId) || 0) + 1);
    });

    // Calculate percentages and create items
    const totalTasks = tasksInInterval.length;
    const velocityItems: ProjectVelocityItem[] = [];

    projectCounts.forEach((count, projectId) => {
      const project = projectMap.get(projectId);
      if (project) {
        velocityItems.push({
          projectId,
          projectName: project.name,
          color: project.color || 'grey',
          count,
          percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0
        });
      }
    });

    // Sort by count (descending)
    return velocityItems.sort((a, b) => b.count - a.count);
  });

  // Extract top projects for current and previous period
  const topProjectsCurrentPeriod = projectVelocityData[0]?.slice(0, 5) || [];
  const topProjectsPreviousPeriod = projectVelocityData[1]?.slice(0, 5) || [];

  // Calculate major shifts between current and previous period
  const majorShifts: ProjectShift[] = [];
  
  if (projectVelocityData.length >= 2 && projectVelocityData[0] && projectVelocityData[1]) {
    const currentPeriodMap = new Map<string, ProjectVelocityItem>();
    const previousPeriodMap = new Map<string, ProjectVelocityItem>();
    
    projectVelocityData[0].forEach(item => currentPeriodMap.set(item.projectId, item));
    projectVelocityData[1].forEach(item => previousPeriodMap.set(item.projectId, item));
    
    // Check all projects in either period
    const allProjectIds = new Set<string>([
      ...Array.from(currentPeriodMap.keys()),
      ...Array.from(previousPeriodMap.keys())
    ]);
    
    allProjectIds.forEach(projectId => {
      const currentItem = currentPeriodMap.get(projectId);
      const previousItem = previousPeriodMap.get(projectId);
      
      if (currentItem && previousItem) {
        const percentageChange = currentItem.percentage - previousItem.percentage;
        
        // Only include significant changes (more than 5%)
        if (Math.abs(percentageChange) >= 5) {
          const project = projectMap.get(projectId);
          if (project) {
            majorShifts.push({
              projectId,
              projectName: project.name,
              percentageChange,
              direction: percentageChange > 0 ? 'up' : 'down'
            });
          }
        }
      } else if (currentItem && !previousItem && currentItem.percentage >= 10) {
        // New project with significant work
        const project = projectMap.get(projectId);
        if (project) {
          majorShifts.push({
            projectId,
            projectName: project.name,
            percentageChange: currentItem.percentage,
            direction: 'up'
          });
        }
      } else if (!currentItem && previousItem && previousItem.percentage >= 10) {
        // Project with no work this period but significant work last period
        const project = projectMap.get(projectId);
        if (project) {
          majorShifts.push({
            projectId,
            projectName: project.name,
            percentageChange: -previousItem.percentage,
            direction: 'down'
          });
        }
      }
    });
  }
  
  // Sort shifts by absolute change (descending)
  majorShifts.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

  return {
    intervals,
    projectData: projectVelocityData,
    topProjectsCurrentPeriod,
    topProjectsPreviousPeriod,
    majorShifts: majorShifts.slice(0, 3) // Return top 3 shifts
  };
} 