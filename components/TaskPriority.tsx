import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { ActiveTask } from '../types';

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
  1: '#9CA3AF',  // warm-gray for p4
  2: '#8BB4E8',  // warm-blue for p3
  3: '#FF9B71',  // warm-peach for p2
  4: '#FF7A3D',  // darker warm-peach for p1
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
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
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f3f4f6'
      },
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
        borderColor: '#0D0D0D',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outer',
        formatter: '{b}: {c}',
        color: '#9ca3af',
        fontSize: 11
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 12,
          color: '#f3f4f6'
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
