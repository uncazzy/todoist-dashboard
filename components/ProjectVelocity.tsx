import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, BarSeriesOption } from 'echarts';
import { format } from 'date-fns';
import { CompletedTask, ProjectData, TodoistColor } from '../types';
import { calculateProjectVelocity, VelocityData } from '../utils/calculateProjectVelocity';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { HiArrowsRightLeft } from 'react-icons/hi2';
import { colorNameToHex } from '../utils/projectUtils';
import Spinner from './shared/Spinner';
import {
  WARM_BORDER,
  WARM_GRAY,
  CHART_TOOLTIP,
  AXIS_LINE,
} from '../utils/chartTheme';

interface ProjectVelocityProps {
  completedTasks: CompletedTask[];
  projectData: ProjectData[];
  timeIntervals?: number;
  intervalDays?: number;
  loading?: boolean;
  comparisonTasks?: CompletedTask[] | undefined;
}

function ProjectVelocity({
  completedTasks,
  projectData,
  timeIntervals = 4,
  intervalDays = 7,
  loading = false,
  comparisonTasks,
}: ProjectVelocityProps): JSX.Element {
  const [showComparison, setShowComparison] = useState(false);
  const hasComparisonData = comparisonTasks && comparisonTasks.length > 0;

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
        <Spinner />
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

  // Calculate previous period total for reference line
  const previousPeriodTotal = showComparison && comparisonTasks ? comparisonTasks.length : null;

  // Reverse the data so that most recent is on the right
  intervalLabels.reverse();
  series.forEach(s => {
    if (s.data) {
      (s.data as number[]).reverse();
    }
  });

  // Add markLine for previous period total if comparison is active
  if (previousPeriodTotal !== null && series.length > 0) {
    const firstSeries = series[0];
    (firstSeries as any).markLine = {
      silent: true,
      symbol: 'none',
      lineStyle: {
        color: WARM_GRAY,
        type: 'dashed',
        width: 2,
      },
      label: {
        formatter: `Prev: ${previousPeriodTotal}`,
        color: WARM_GRAY,
        fontSize: 10,
      },
      data: [
        { yAxis: previousPeriodTotal / timeIntervals },
      ],
    };
  }

  // Chart options
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      ...CHART_TOOLTIP,
      borderWidth: 1,
    },
    legend: {
      data: limitedProjectIds.map(id => projectNames[id] || 'Unknown'),
      textStyle: {
        color: WARM_GRAY
      },
      type: 'scroll',
      pageIconColor: WARM_GRAY,
      pageTextStyle: {
        color: WARM_GRAY
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
        color: WARM_GRAY,
        fontSize: 10
      },
      axisLine: {
        ...AXIS_LINE,
      }
    },
    yAxis: {
      type: 'value',
      name: 'Tasks',
      nameTextStyle: {
        color: WARM_GRAY
      },
      axisLabel: {
        color: WARM_GRAY,
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: WARM_BORDER,
          opacity: 0.3
        }
      }
    },
    series
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {hasComparisonData && (
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className={`p-1.5 rounded-lg border transition-all ${
                showComparison
                  ? 'bg-warm-blue/15 border-warm-blue text-warm-blue'
                  : 'border-warm-border text-warm-gray hover:text-white hover:border-warm-gray'
              }`}
              title="Compare with previous period"
            >
              <HiArrowsRightLeft className="w-3.5 h-3.5" />
            </button>
          )}
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
          notMerge={true}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
}

export default React.memo(ProjectVelocity);