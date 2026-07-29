import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { CompletedTask, ActiveTask } from '../types';
import { calculateLeadTimeStats, LeadTimeStats } from '../utils/calculateLeadTimeStats';
import Spinner from './shared/Spinner';
import { CHART_TOOLTIP, AXIS_LABEL, AXIS_LINE, SPLIT_LINE, WARM_GRAY, WARM_PEACH, WARM_PEACH_LIGHT } from '../utils/chartTheme';

interface TaskLeadTimeProps {
  completedTasks: CompletedTask[];
  activeTasks: ActiveTask[];
  loading?: boolean;
}

function TaskLeadTime({ completedTasks, activeTasks, loading = false }: TaskLeadTimeProps): JSX.Element {
  // Handle loading state
  if (loading || !completedTasks || completedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Spinner />
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
      ...CHART_TOOLTIP,
      borderWidth: 1,
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
        ...AXIS_LABEL,
        fontSize: 10,
        interval: 0,
        rotate: window?.innerWidth < 640 ? 30 : 0
      },
      axisLine: {
        ...AXIS_LINE
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: 'Tasks',
      nameTextStyle: {
        color: WARM_GRAY
      },
      axisLabel: {
        ...AXIS_LABEL,
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          ...SPLIT_LINE.lineStyle,
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
          color: WARM_PEACH
        },
        emphasis: {
          itemStyle: {
            color: WARM_PEACH_LIGHT
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

export default React.memo(TaskLeadTime);