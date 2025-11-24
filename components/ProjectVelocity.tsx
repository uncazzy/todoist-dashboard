import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption, BarSeriesOption } from 'echarts';
import { format } from 'date-fns';
import { CompletedTask, ProjectData, TodoistColor } from '../types';
import { calculateProjectVelocity, VelocityData } from '../utils/calculateProjectVelocity';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { colorNameToHex } from '../utils/projectUtils';

interface ProjectVelocityProps {
  completedTasks: CompletedTask[];
  projectData: ProjectData[];
  timeIntervals?: number;
  intervalDays?: number;
  loading?: boolean;
}

function ProjectVelocity({
  completedTasks,
  projectData,
  timeIntervals = 4,
  intervalDays = 7,
  loading = false
}: ProjectVelocityProps): JSX.Element {
  // Extract project names map (memoized for performance)
  const projectNames = useMemo(() => {
    const names: Record<string, string> = {};
    projectData.forEach(project => {
      names[project.id] = project.name;
    });
    return names;
  }, [projectData]);

  if (loading || completedTasks.length === 0 || projectData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
      </div>
    );
  }

  // Calculate velocity data
  const velocityData: VelocityData = calculateProjectVelocity(
    completedTasks,
    projectData,
    timeIntervals,
    intervalDays
  );

  // Format the date range for each interval for display
  const intervalLabels = velocityData.intervals.map(interval => {
    return `${format(interval.startDate, 'MMM d')} - ${format(interval.endDate, 'MMM d')}`;
  });

  // Get the top 8 projects across all time periods
  const topProjectIds = new Set<string>();
  velocityData.projectData.forEach(periodData => {
    // Take top projects from each period
    periodData.slice(0, 5).forEach(item => {
      topProjectIds.add(item.projectId);
    });
  });

  // Limit to 8 projects for clarity
  const limitedProjectIds = Array.from(topProjectIds).slice(0, 8);

  // Prepare data for stacked bar chart
  const series: BarSeriesOption[] = limitedProjectIds.map(projectId => {
    const projectName = projectNames[projectId] || 'Unknown';
    const projectColor = projectData.find(p => p.id === projectId)?.color as TodoistColor || 'grey' as TodoistColor;
    const colorHex = colorNameToHex(projectColor) || '#b8b8b8';
    
    const data = velocityData.projectData.map(periodData => {
      const projectItem = periodData.find(item => item.projectId === projectId);
      return projectItem ? projectItem.count : 0;
    });

    return {
      name: projectName,
      type: 'bar',
      stack: 'total',
      emphasis: {
        focus: 'series'
      },
      data,
      itemStyle: {
        color: colorHex
      }
    };
  });

  // Reverse the data so that most recent is on the right
  intervalLabels.reverse();
  series.forEach(s => {
    if (s.data) {
      (s.data as number[]).reverse();
    }
  });

  // Chart options
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f3f4f6'
      }
    },
    legend: {
      data: limitedProjectIds.map(id => projectNames[id] || 'Unknown'),
      textStyle: {
        color: '#9ca3af'
      },
      type: 'scroll',
      pageIconColor: '#9ca3af',
      pageTextStyle: {
        color: '#9ca3af'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: intervalLabels,
      axisLabel: {
        color: '#9ca3af',
        fontSize: 10
      },
      axisLine: {
        lineStyle: {
          color: '#374151'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Tasks',
      nameTextStyle: {
        color: '#9ca3af'
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
          opacity: 0.3
        }
      }
    },
    series
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {velocityData.majorShifts.map((shift, index) => (
            <div
              key={shift.projectId + index}
              className="flex items-center bg-warm-border/30 rounded-lg px-3 py-2 text-sm"
            >
              <span className="mr-2 font-medium">
                {shift.projectName}:
              </span>
              <span
                className={`flex items-center ${
                  shift.direction === 'up' ? 'text-warm-sage' : 'text-warm-peach'
                }`}
              >
                {shift.direction === 'up' ? (
                  <FiArrowUp className="mr-1" />
                ) : (
                  <FiArrowDown className="mr-1" />
                )}
                {Math.abs(shift.percentageChange).toFixed(1)}%
              </span>
            </div>
          ))}
          {velocityData.majorShifts.length === 0 && (
            <div className="text-warm-gray text-sm">
              No significant focus shifts detected
            </div>
          )}
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
}

export default React.memo(ProjectVelocity);