import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { CompletedTask, ActiveTask } from '../types';
import { calculateLeadTimeStats, LeadTimeStats } from '../utils/calculateLeadTimeStats';

interface TaskLeadTimeProps {
  completedTasks: CompletedTask[];
  activeTasks: ActiveTask[];
  loading?: boolean;
}

export default function TaskLeadTime({ completedTasks, activeTasks, loading = false }: TaskLeadTimeProps): JSX.Element {
  // Handle loading state
  if (loading || !completedTasks || completedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
      </div>
    );
  }

  // Calculate lead time statistics
  const stats: LeadTimeStats = calculateLeadTimeStats(completedTasks, activeTasks);

  // Format the average and median values
  const formattedAvg = stats.averageLeadTime.toFixed(1);
  const formattedMedian = stats.medianLeadTime.toFixed(1);

  // Prepare chart data
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f3f4f6'
      },
      formatter: (params: any) => {
        const data = Array.isArray(params) ? params[0] : params;
        if (!data) return '';

        return `
          <div>
            <div>${data.name}</div>
            <div>Tasks: ${data.value} (${stats.buckets[data.dataIndex]?.percentage.toFixed(1)}%)</div>
          </div>
        `;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.buckets.map(bucket => bucket.name),
      axisLabel: {
        color: '#9ca3af',
        fontSize: 10,
        interval: 0,
        rotate: window?.innerWidth < 640 ? 30 : 0
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
        name: 'Lead Time Distribution',
        type: 'bar',
        data: stats.buckets.map(bucket => bucket.count),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#FF9B71'  // warm-peach
        },
        emphasis: {
          itemStyle: {
            color: '#FFB599'  // lighter warm-peach
          }
        }
      }
    ]
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="bg-warm-card/50 border border-warm-border rounded-2xl p-4 text-center">
          <div className="text-xs text-warm-gray mb-1">Average Lead Time</div>
          <div className="text-2xl font-bold text-warm-peach">{formattedAvg} days</div>
        </div>
        <div className="bg-warm-card/50 border border-warm-border rounded-2xl p-4 text-center">
          <div className="text-xs text-warm-gray mb-1">Median Lead Time</div>
          <div className="text-2xl font-bold text-warm-sage">{formattedMedian} days</div>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>

      <div className="mt-2 text-xs text-warm-gray text-center">
        Based on {stats.totalTasks} recurring task{stats.totalTasks !== 1 ? 's' : ''}
      </div>
    </div>
  );
} 