import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import {
  TooltipComponentOption,
  GridComponentOption
} from 'echarts/components';
import { LineSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { CallbackDataParams } from 'echarts/types/dist/shared';

type ECOption = echarts.ComposeOption<
  TooltipComponentOption | GridComponentOption | LineSeriesOption
>;

interface TrendChartProps {
  data: number[];
  labels: string[];
  height?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, labels, height = 200 }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();

  useEffect(() => {
    // Only proceed if we have valid data and DOM element
    if (!chartRef.current || !Array.isArray(data) || !Array.isArray(labels)) return;

    // Initialize ECharts instance if it doesn't exist
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, {
        renderer: CanvasRenderer
      });
    }

    // Chart options
    const option: ECOption = {
      grid: {
        top: 15,
        right: 10,
        bottom: 20,
        left: 30,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: {
          lineStyle: { color: '#4B5563' }
        },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 10,
          interval: 'auto'
        }
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: { color: '#374151' }
        },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 10
        }
      },
      series: [
        {
          data: data,
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#8BB4E8',  // warm-blue
            width: 3
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(139, 180, 232, 0.5)' },  // warm-blue with opacity
              { offset: 1, color: 'rgba(139, 180, 232, 0.0)' }
            ])
          }
        }
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        borderColor: '#4B5563',
        textStyle: { color: '#E5E7EB' },
        formatter: function(params: CallbackDataParams | CallbackDataParams[]): string {
          const data = Array.isArray(params) ? params[0] : params;
          if (!data || typeof data.value === 'undefined' || !data.name) {
            return '';
          }
          return `${data.name}: ${data.value} tasks`;
        }
      }
    };

    // Set the options
    chartInstance.current.setOption(option);

    // Handle resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = undefined;
      }
    };
  }, [data, labels]);

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />;
};

export default TrendChart;
