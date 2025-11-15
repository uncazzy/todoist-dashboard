import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import { EChartsOption } from 'echarts';
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

interface Task {
  completed_at: string;
}

interface CompletedTasksOverTimeProps {
  allData: Task[];
  loading: boolean;
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

export default function CompletedTasksOverTime({ allData, loading }: CompletedTasksOverTimeProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
  const [viewType, setViewType] = useState<ViewType>('daily');
  
  if (!allData || loading) return null;

  // Update view type when time frame changes to ensure valid combinations
  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
    // Adjust view type if current selection is invalid for new time frame
    if ((newTimeFrame === '1Y' || newTimeFrame === '6M') && viewType === 'daily') {
      setViewType('weekly');
    } else if (newTimeFrame === '1M' && viewType === 'monthly') {
      setViewType('daily');
    }
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

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f3f4f6'
      },
      formatter: function(params: CallbackDataParams | CallbackDataParams[]): string {
        const data = Array.isArray(params) ? params[0] : params;
        if (!data || typeof data.value === 'undefined' || !('axisValue' in data)) {
          return '';
        }
        return `${data.axisValue}<br/>Tasks Completed: ${data.value}`;
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
        color: '#9ca3af',
        fontSize: 11,
        rotate: 45
      },
      axisLine: {
        lineStyle: {
          color: '#374151'
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
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
    series: [{
      data: data,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 4,
        color: '#FF9B71'  // warm-peach
      },
      itemStyle: {
        color: '#FF9B71',  // warm-peach
        borderWidth: 2,
        borderColor: '#ffffff'
      },
      areaStyle: {
        opacity: 0.2,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
          offset: 0,
          color: '#FF9B71'  // warm-peach
        }, {
          offset: 1,
          color: '#7FD49E'  // warm-sage
        }])
      }
    }]
  };

  return (
    <div className="w-full">
      <div className="flex justify-end space-x-2 mb-4">
        <div className="flex space-x-2">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
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
      <ReactECharts option={option} style={{ height: '400px' }} />
    </div>
  );
}
