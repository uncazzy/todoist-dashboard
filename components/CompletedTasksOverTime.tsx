import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import type { CallbackDataParams } from '../types/echarts';
import {
  format,
  endOfWeek,
  eachWeekOfInterval,
  subMonths,
  isWithinInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  startOfDay,
  endOfDay
} from 'date-fns';
import { HiArrowsRightLeft } from 'react-icons/hi2';
import { trackChartInteraction } from '@/utils/analytics';
import {
  WARM_PEACH,
  WARM_SAGE,
  WARM_GRAY,
  WARM_BORDER,
  CHART_TOOLTIP,
  AXIS_LINE,
} from '../utils/chartTheme';

interface Task {
  completed_at: string;
}

interface CompletedTasksOverTimeProps {
  allData: Task[];
  loading: boolean;
  comparisonData?: Task[] | undefined;
}

type TimeFrame = '1M' | '3M' | '6M' | '1Y';
type ViewType = 'daily' | 'weekly' | 'monthly';

interface ViewTypeOption {
  value: ViewType;
  label: string;
}

interface DataPoints {
  labels: string[];
  data: number[];
}

function CompletedTasksOverTime({ allData, loading, comparisonData }: CompletedTasksOverTimeProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [showComparison, setShowComparison] = useState(false);
  const hasComparisonData = comparisonData && comparisonData.length > 0;
  
  if (!allData || loading) return null;

  // Update view type when time frame changes to ensure valid combinations
  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
    trackChartInteraction('completed_tasks_over_time', 'timeframe_change', newTimeFrame);
    // Adjust view type if current selection is invalid for new time frame
    if ((newTimeFrame === '1Y' || newTimeFrame === '6M') && viewType === 'daily') {
      setViewType('weekly');
    } else if (newTimeFrame === '1M' && viewType === 'monthly') {
      setViewType('daily');
    }
  };

  // Handle view type change with tracking
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    trackChartInteraction('completed_tasks_over_time', 'view_change', newViewType);
  };

  // Get available view types based on time frame
  const getViewTypeOptions = (): ViewTypeOption[] => {
    switch (timeFrame) {
      case '1M':
        return [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' }
        ];
      case '3M':
        return [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' }
        ];
      case '6M':
      case '1Y':
        return [
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' }
        ];
      default:
        return [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' }
        ];
    }
  };

  // Get the date range based on selected time frame
  const getDateRange = () => {
    const today = new Date();
    switch (timeFrame) {
      case '1M': return { start: subMonths(today, 1), end: today };
      case '3M': return { start: subMonths(today, 3), end: today };
      case '6M': return { start: subMonths(today, 6), end: today };
      case '1Y': return { start: subMonths(today, 12), end: today };
      default: return { start: subMonths(today, 1), end: today };
    }
  };

  const dateRange = getDateRange();

  const getDataPoints = (): DataPoints => {
    switch (viewType) {
      case 'daily': {
        const days = eachDayOfInterval(dateRange);
        const tasksPerDay: Record<string, number> = days.reduce((acc, day) => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const tasksThisDay = allData.filter(task => {
            if (!task.completed_at) return false;
            const completedDate = new Date(task.completed_at);
            return isWithinInterval(completedDate, { start: dayStart, end: dayEnd });
          }).length;
          
          acc[format(day, 'yyyy-MM-dd')] = tasksThisDay;
          return acc;
        }, {} as Record<string, number>);

        return {
          labels: days.map(date => format(date, 'MMM d')),
          data: days.map(date => tasksPerDay[format(date, 'yyyy-MM-dd')] || 0)
        };
      }
      case 'weekly': {
        const weeks = eachWeekOfInterval(dateRange);
        const tasksPerWeek: Record<string, number> = weeks.reduce((acc, weekStart) => {
          const weekEnd = endOfWeek(weekStart);
          const tasksThisWeek = allData.filter(task => {
            if (!task.completed_at) return false;
            const completedDate = new Date(task.completed_at);
            return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
          }).length;
          
          acc[format(weekStart, 'yyyy-MM-dd')] = tasksThisWeek;
          return acc;
        }, {} as Record<string, number>);

        return {
          labels: weeks.map(date => `Week of ${format(date, 'MMM d')}`),
          data: weeks.map(date => tasksPerWeek[format(date, 'yyyy-MM-dd')] || 0)
        };
      }
      case 'monthly': {
        const months = eachMonthOfInterval(dateRange);
        const tasksPerMonth: Record<string, number> = months.reduce((acc, monthStart) => {
          const monthEnd = endOfMonth(monthStart);
          const tasksThisMonth = allData.filter(task => {
            if (!task.completed_at) return false;
            const completedDate = new Date(task.completed_at);
            return isWithinInterval(completedDate, { start: monthStart, end: monthEnd });
          }).length;
          
          acc[format(monthStart, 'yyyy-MM')] = tasksThisMonth;
          return acc;
        }, {} as Record<string, number>);

        return {
          labels: months.map(date => format(date, 'MMM yyyy')),
          data: months.map(date => tasksPerMonth[format(date, 'yyyy-MM')] || 0)
        };
      }
      default:
        return { labels: [], data: [] };
    }
  };

  const { labels, data } = getDataPoints();

  // Compute comparison data points using the same bucketing logic
  const getComparisonDataPoints = (): number[] => {
    if (!showComparison || !comparisonData || comparisonData.length === 0) return [];
    switch (viewType) {
      case 'daily': {
        const days = eachDayOfInterval(dateRange);
        return days.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          return comparisonData.filter(task => {
            if (!task.completed_at) return false;
            const completedDate = new Date(task.completed_at);
            return isWithinInterval(completedDate, { start: dayStart, end: dayEnd });
          }).length;
        });
      }
      case 'weekly': {
        const weeks = eachWeekOfInterval(dateRange);
        return weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart);
          return comparisonData.filter(task => {
            if (!task.completed_at) return false;
            const completedDate = new Date(task.completed_at);
            return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
          }).length;
        });
      }
      case 'monthly': {
        const months = eachMonthOfInterval(dateRange);
        return months.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          return comparisonData.filter(task => {
            if (!task.completed_at) return false;
            const completedDate = new Date(task.completed_at);
            return isWithinInterval(completedDate, { start: monthStart, end: monthEnd });
          }).length;
        });
      }
      default:
        return [];
    }
  };

  const comparisonPoints = getComparisonDataPoints();
  const hasComparison = comparisonPoints.length > 0;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      ...CHART_TOOLTIP,
      borderWidth: 1,
      formatter: function(params: CallbackDataParams | CallbackDataParams[]): string {
        const items = Array.isArray(params) ? params : [params];
        if (!items[0] || typeof items[0].value === 'undefined' || !('axisValue' in items[0])) {
          return '';
        }
        let html = `${items[0].axisValue}<br/>Current: ${items[0].value}`;
        if (items[1] && typeof items[1].value !== 'undefined') {
          html += `<br/>Previous: ${items[1].value}`;
        }
        return html;
      }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '8%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLabel: {
        color: WARM_GRAY,
        fontSize: 11,
        rotate: 45
      },
      axisLine: {
        ...AXIS_LINE,
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: WARM_GRAY,
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: WARM_BORDER,
          type: 'dashed'
        }
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      }
    },
    series: [
      {
        name: 'Current',
        data: data,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 4,
          color: WARM_PEACH
        },
        itemStyle: {
          color: WARM_PEACH,
          borderWidth: 2,
          borderColor: '#ffffff'
        },
        areaStyle: {
          opacity: 0.2,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: WARM_PEACH
          }, {
            offset: 1,
            color: WARM_SAGE
          }])
        }
      },
      ...(hasComparison ? [{
        name: 'Previous Period',
        data: comparisonPoints,
        type: 'line' as const,
        smooth: true,
        symbol: 'none' as const,
        lineStyle: {
          width: 2,
          color: WARM_GRAY,
          type: 'dashed' as const,
        },
        itemStyle: {
          color: WARM_GRAY,
        },
        areaStyle: {
          opacity: 0.05,
          color: WARM_GRAY,
        },
      }] : [])
    ]
  };

  return (
    <div className="w-full">
      <div className="flex justify-end space-x-2 mb-4">
        <div className="flex items-center space-x-2">
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
          <select
            value={viewType}
            onChange={(e) => handleViewTypeChange(e.target.value as ViewType)}
            className="bg-warm-card text-white rounded-lg px-3 py-1 text-sm border border-warm-border focus:outline-none focus:ring-2 focus:ring-warm-peach"
          >
            {getViewTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={timeFrame}
            onChange={(e) => handleTimeFrameChange(e.target.value as TimeFrame)}
            className="bg-warm-card text-white rounded-lg px-3 py-1 text-sm border border-warm-border focus:outline-none focus:ring-2 focus:ring-warm-peach"
          >
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
          </select>
        </div>
      </div>
      <ReactECharts option={option} notMerge={true} style={{ height: '400px' }} />
    </div>
  );
}

export default React.memo(CompletedTasksOverTime);
