import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { colorNameToHex } from '@/utils/projectUtils';
import * as echarts from 'echarts/core';
import {
  TooltipComponentOption,
  GridComponentOption
} from 'echarts/components';
import { BarSeriesOption } from 'echarts/charts';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import type { Label, ActiveTask, CompletedTask } from '../types';
import { getLabelStats } from '@/utils/parseLabelsFromContent';
import escapeHtml from '@/utils/escapeHtml';

type ECOption = echarts.ComposeOption<
  TooltipComponentOption | GridComponentOption | BarSeriesOption
>;

export type LabelViewMode = 'all' | 'active';

interface LabelDistributionProps {
  activeTasks: ActiveTask[];
  completedTasks: CompletedTask[];
  labels: Label[];
  loading?: boolean;
  viewMode?: LabelViewMode;
}

function LabelDistribution({ activeTasks, completedTasks, labels, loading, viewMode = 'all' }: LabelDistributionProps) {

  const labelStats = useMemo(() => {
    if (!labels || labels.length === 0) return [];

    const stats = getLabelStats(activeTasks, completedTasks, labels);

    // Convert to array and sort by relevant count (descending)
    return Array.from(stats.values())
      .filter(stat => viewMode === 'all' ? stat.total > 0 : stat.active > 0)
      .sort((a, b) => viewMode === 'all'
        ? b.total - a.total
        : b.active - a.active
      );
  }, [activeTasks, completedTasks, labels, viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
      </div>
    );
  }

  if (!labels || labels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-warm-gray">
        <p className="text-sm">No labels found</p>
        <p className="text-xs mt-1 opacity-70">Create labels in Todoist to see analytics here</p>
      </div>
    );
  }

  if (labelStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-warm-gray">
        <p className="text-sm">No labeled tasks</p>
        <p className="text-xs mt-1 opacity-70">Add labels to your tasks to see distribution</p>
      </div>
    );
  }

  const option: ECOption = {
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
      },
      formatter: function (params: CallbackDataParams | CallbackDataParams[]): string {
        const dataArr = Array.isArray(params) ? params : [params];
        const firstItem = dataArr[0];
        if (!firstItem || !firstItem.name) return '';

        const safeName = escapeHtml(firstItem.name);
        const stat = labelStats.find(s => s.label.name === firstItem.name);

        if (!stat) return safeName;

        if (viewMode === 'active') {
          return `<strong>@${safeName}</strong><br/>Active: ${stat.active}`;
        }

        return `<strong>@${safeName}</strong><br/>
Active: ${stat.active}<br/>
Completed: ${stat.completed}<br/>
Total: ${stat.total}`;
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
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
    yAxis: {
      type: 'category',
      data: labelStats.map(stat => stat.label.name),
      inverse: true, // Show highest at top
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (value: string) => `@${value}`
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
    series: [{
      type: 'bar',
      data: labelStats.map((stat) => ({
        value: viewMode === 'all' ? stat.total : stat.active,
        name: stat.label.name,
        itemStyle: {
          color: colorNameToHex(stat.label.color, '80') || '#808080',
          borderColor: colorNameToHex(stat.label.color) || '#808080',
          borderWidth: 1,
          borderRadius: [0, 4, 4, 0]
        },
        emphasis: {
          itemStyle: {
            color: colorNameToHex(stat.label.color) || '#808080',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 10
          }
        }
      })),
      barWidth: '60%',
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(42, 42, 42, 0.3)',
        borderRadius: [0, 4, 4, 0]
      },
      label: {
        show: true,
        position: 'right',
        color: '#9ca3af',
        fontSize: 11,
        formatter: '{c}'
      }
    }]
  };

  // Dynamic height based on number of labels
  const chartHeight = Math.max(200, labelStats.length * 40 + 40);

  return (
    <ReactECharts
      option={option}
      style={{ height: `${chartHeight}px`, width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}

export default React.memo(LabelDistribution);
