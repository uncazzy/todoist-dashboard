import React from 'react';
import ReactECharts from 'echarts-for-react';
import { format } from 'date-fns';
import { EChartsOption } from 'echarts';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import { CompletedTask } from '../types';
import escapeHtml from '@/utils/escapeHtml';

interface AllData {
  allCompletedTasks: CompletedTask[];
}

interface CompletedByTimeOfDayProps {
  allData: AllData;
  loading: boolean;
}

export default function CompletedByTimeOfDay({ allData, loading }: CompletedByTimeOfDayProps) {
  if (!allData?.allCompletedTasks || loading) {
    return (
      <div className="flex items-center justify-center h-[240px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
      </div>
    );
  }

  // Initialize data array for 24 hours
  const hourMap = new Map<number, number>();
  for (let i = 0; i < 24; i++) {
    hourMap.set(i, 0);
  }

  // Count tasks completed in each hour
  allData.allCompletedTasks.forEach(task => {
    const completedDate = new Date(task.completed_at);
    const hour = completedDate.getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  // Convert back to array for chart
  const hourData = Array.from({ length: 24 }, (_, i) => hourMap.get(i) || 0);

  // Create time labels
  const hours: string[] = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setHours(i, 0, 0);
    return format(date, 'ha').toLowerCase();
  });

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f3f4f6'
      },
      formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
        const data = Array.isArray(params) ? params[0] : params;
        if (!data || typeof data.value === 'undefined' || !data.name) {
          return '';
        }
        const safeName = escapeHtml(data.name);
        return `${safeName}<br/>Tasks Completed: ${data.value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: {
        color: '#9ca3af',
        fontSize: 10,
        interval: window?.innerWidth < 640 ? 3 : 1
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
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
          opacity: 0.3
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
        data: hourData,
        type: 'bar',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#8BB4E8'  // warm-blue
        },
        emphasis: {
          itemStyle: {
            color: '#A5C7EF'  // lighter warm-blue
          }
        }
      }
    ]
  };

  return (
    <div className="w-full h-[300px]">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
