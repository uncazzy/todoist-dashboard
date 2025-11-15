import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { CompletedTask } from '../types';
import { calculateCompletionHeatmapData } from '../utils/calculateCompletionHeatmapData';

interface CompletionHeatmapProps {
  completedTasks: CompletedTask[];
  loading?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${hour}${ampm}`;
});

export default function CompletionHeatmap({ 
  completedTasks, 
  loading = false 
}: CompletionHeatmapProps): JSX.Element {
  // Handle loading state
  if (loading || !completedTasks || completedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
      </div>
    );
  }

  // Calculate heatmap data
  const heatmapData = calculateCompletionHeatmapData(completedTasks);
  const { data, maxValue, mostActiveDay, mostActiveHour, mostActiveCombination } = heatmapData;

  // Prepare the chart data as [hour, day, value] tuples that ECharts expects
  const chartData = data.map(point => [point.hour, point.day, point.value || 0]);

  // Format day and hour for display in the stats
  const formatDay = (day: number) => DAYS[day] || 'Unknown';
  const formatHour = (hour: number) => HOURS[hour] || 'Unknown';
  
  // ECharts configuration
  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const value = params.value;
        if (!value || value.length < 3) return '';
        
        const hour = value[0];
        const day = value[1];
        const count = value[2];
        
        return `
          <div class="font-medium">${formatDay(day)}, ${formatHour(hour)}</div>
          <div>Completed Tasks: ${count}</div>
          ${count > 0 ? `<div class="text-xs">${((count / heatmapData.totalCompletions) * 100).toFixed(1)}% of total</div>` : ''}
        `;
      },
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f3f4f6'
      }
    },
    grid: {
      top: '15%',
      left: '5%',
      right: '10%',
      bottom: '10%'
    },
    xAxis: {
      type: 'category',
      data: HOURS,
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 10,
        interval: window?.innerWidth < 640 ? 3 : 1,
        formatter: (value: string) => {
          // Show only the hour number for space
          return value.replace(/([0-9]+)(AM|PM)/, '$1');
        }
      },
      axisLine: {
        lineStyle: {
          color: '#374151'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: DAYS,
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11
      },
      axisLine: {
        lineStyle: {
          color: '#374151'
        }
      }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      textStyle: {
        color: '#9ca3af'
      },
      inRange: {
        color: [
          '#2A2A2A', // warm-border (low)
          '#FFB599', // light warm-peach (medium)
          '#FF9B71', // warm-peach (high)
          '#FF7A3D'  // darker warm-peach (very high)
        ]
      }
    },
    series: [
      {
        type: 'heatmap',
        data: chartData,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-warm-card/50 border border-warm-border rounded-2xl p-4 text-center">
          <div className="text-xs text-warm-gray mb-1">Most Active Day</div>
          <div className="text-xl font-bold text-warm-peach">{formatDay(mostActiveDay.day)}</div>
          <div className="text-sm text-warm-gray">{mostActiveDay.count} tasks</div>
        </div>

        <div className="bg-warm-card/50 border border-warm-border rounded-2xl p-4 text-center">
          <div className="text-xs text-warm-gray mb-1">Most Active Hour</div>
          <div className="text-xl font-bold text-warm-blue">{formatHour(mostActiveHour.hour)}</div>
          <div className="text-sm text-warm-gray">{mostActiveHour.count} tasks</div>
        </div>

        <div className="bg-warm-card/50 border border-warm-border rounded-2xl p-4 text-center">
          <div className="text-xs text-warm-gray mb-1">Peak Activity</div>
          <div className="text-xl font-bold text-warm-sage">
            {formatDay(mostActiveCombination.day)} at {formatHour(mostActiveCombination.hour)}
          </div>
          <div className="text-sm text-warm-gray">{mostActiveCombination.count} tasks</div>
        </div>
      </div>
      
      <div className="h-[320px] w-full">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
      
      <div className="mt-2 text-xs text-warm-gray text-center">
        Based on {heatmapData.totalCompletions} completed tasks
      </div>
    </div>
  );
} 