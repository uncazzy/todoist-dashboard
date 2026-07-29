import React from 'react';
import ReactECharts from 'echarts-for-react';
import { colorNameToHex } from "@/utils/projectUtils";
import type { EChartsOption } from 'echarts';
import type { CallbackDataParams } from '../types/echarts';
import { ProjectData, TodoistColor } from '../types';
import escapeHtml from '@/utils/escapeHtml';
import Spinner from './shared/Spinner';
import { CHART_TOOLTIP, AXIS_LABEL, AXIS_LINE, SPLIT_LINE } from '../utils/chartTheme';

interface ProjectWithStats extends ProjectData {
  completedTasksCount: number;
}

interface CompletedTasksByProjectProps {
  projectData: ProjectWithStats[];
  loading?: boolean;
}

function CompletedTasksByProject({ projectData, loading }: CompletedTasksByProjectProps) {
  if (!projectData || loading) {
    return (
      <div className="flex items-center justify-center h-[240px]">
        <Spinner />
      </div>
    );
  }

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      ...CHART_TOOLTIP,
      borderWidth: 1,
      formatter: function(params: CallbackDataParams | CallbackDataParams[]): string {
        const data = Array.isArray(params) ? params[0] : params;
        if (!data || typeof data.value === 'undefined' || !data.name) {
          return '';
        }
        const safeName = escapeHtml(data.name);
        return `${safeName}<br/>Completed Tasks: ${data.value}`;
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: projectData.map(project => project.name),
      axisLabel: {
        ...AXIS_LABEL,
        fontSize: 11,
        rotate: 45,
        overflow: 'break'
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
      axisLabel: {
        ...AXIS_LABEL,
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          ...SPLIT_LINE.lineStyle,
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
      type: 'bar',
      data: projectData.map((project) => ({
        value: project.completedTasksCount,
        name: project.name,
        itemStyle: {
          color: colorNameToHex(project.color as TodoistColor, '80') || '#808080',
          borderColor: colorNameToHex(project.color as TodoistColor) || '#808080',
          borderWidth: 1,
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: colorNameToHex(project.color as TodoistColor) || '#808080',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 10
          }
        }
      })),
      barWidth: '60%',
      barGap: '30%',
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(42, 42, 42, 0.3)',  // warm-border with transparency
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '400px', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}

export default React.memo(CompletedTasksByProject);
