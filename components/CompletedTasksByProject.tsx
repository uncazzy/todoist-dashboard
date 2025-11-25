import React from 'react';
import ReactECharts from 'echarts-for-react';
import { colorNameToHex } from "@/utils/projectUtils";
import * as echarts from 'echarts/core';
import {
  TooltipComponentOption,
  GridComponentOption
} from 'echarts/components';
import { BarSeriesOption } from 'echarts/charts';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import { ProjectData, TodoistColor } from '../types';
import escapeHtml from '@/utils/escapeHtml';

type ECOption = echarts.ComposeOption<
  TooltipComponentOption | GridComponentOption | BarSeriesOption
>;

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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
      </div>
    );
  }

  const option: ECOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f3f4f6'
      },
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
        color: '#9ca3af',
        fontSize: 11,
        rotate: 45,
        overflow: 'break'
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
