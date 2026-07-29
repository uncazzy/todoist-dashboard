import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ActiveTask } from '../types';
import Spinner from './shared/Spinner';
import { CHART_TOOLTIP, WARM_GRAY, WARM_BLUE, WARM_PEACH, WARM_PEACH_DARK, WARM_BLACK, TEXT_PRIMARY } from '../utils/chartTheme';

interface TaskPriorityProps {
  activeTasks: ActiveTask[];
  loading?: boolean;
}

interface PriorityColors {
  [key: number]: string;
}

interface PriorityLabels {
  [key: number]: string;
}

interface ChartDataItem {
  value: number;
  name: string;
  itemStyle: {
    color: string;
  };
  color: string;
}

const PRIORITY_COLORS: PriorityColors = {
  1: WARM_GRAY,
  2: WARM_BLUE,
  3: WARM_PEACH,
  4: WARM_PEACH_DARK,
};

const PRIORITY_LABELS: PriorityLabels = {
  1: 'P4 (Normal)',
  2: 'P3 (Low)',
  3: 'P2 (Medium)',
  4: 'P1 (High)',
};

const TaskPriority: React.FC<TaskPriorityProps> = ({ activeTasks, loading }) => {
  if (!activeTasks || loading) {
    return (
      <div className="flex items-center justify-center h-[240px]">
        <Spinner />
      </div>
    );
  }

  // Count tasks by priority
  const priorityCounts = activeTasks.reduce<Record<number, number>>((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {});

  // Create data array for the chart
  const data: ChartDataItem[] = Object.entries(PRIORITY_LABELS).map(([priority, label]) => ({
    value: priorityCounts[Number(priority)] || 0,
    name: label,
    itemStyle: {
      color: PRIORITY_COLORS[Number(priority)] || '#000000'  // Provide a default color
    },
    color: PRIORITY_COLORS[Number(priority)] || '#000000'  // Add color property
  }));

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      ...CHART_TOOLTIP,
      borderWidth: 1,
      formatter: (params: any) => {
        const percent = ((params.value / activeTasks.length) * 100).toFixed(1);
        return `${params.name}<br/>Tasks: ${params.value} (${percent}%)`;
      }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: WARM_BLACK,
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outer',
        formatter: '{b}: {c}',
        color: WARM_GRAY,
        fontSize: 11
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 12,
          color: TEXT_PRIMARY
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      data: data
    }]
  };

  return (
    <div className="w-full h-[300px]">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        theme="dark"
      />
    </div>
  );
};

export default TaskPriority;
