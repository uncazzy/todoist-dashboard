import React from 'react';
import { IoMdTrendingDown, IoMdTrendingUp } from 'react-icons/io';
import { getKarmaLevel } from '../../utils/karma';
import { ActiveTask } from '../../types';

interface QuickStatsProps {
  activeTasks: ActiveTask[];
  projectCount: number;
  totalCompletedTasks: number;
  karma: number;
  karmaTrend: string;
  karmaRising: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({
  activeTasks,
  projectCount,
  totalCompletedTasks,
  karma,
  karmaTrend,
  karmaRising,
}) => {
  const colorClassMap = {
    'warm-peach': 'text-warm-peach',
    'warm-blue': 'text-warm-blue',
    'warm-sage': 'text-warm-sage',
  } as const;

  const stats = [
    {
      label: 'Active Tasks',
      value: activeTasks.length,
      color: 'warm-peach',
    },
    {
      label: 'Active Projects',
      value: projectCount,
      color: 'warm-blue',
    },
    {
      label: 'Completed Tasks',
      value: totalCompletedTasks,
      color: 'warm-sage',
    },
    {
      label: 'Karma Score',
      value: karma || 0,
      color: 'warm-peach',
      subtitle: getKarmaLevel(karma || 0),
      trend: karmaTrend !== 'none' ? (karmaRising ? 'up' : 'down') : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-warm-card rounded-2xl p-6 border border-warm-border hover:bg-warm-hover hover:shadow-lg transition-all"
        >
          <h3 className="text-sm text-warm-gray mb-3 font-medium">{stat.label}</h3>
          <div className="flex items-center gap-3">
            <div
              className={`text-4xl font-semibold ${
                colorClassMap[stat.color as keyof typeof colorClassMap] ?? 'text-warm-blue'
              }`}
            >
              {stat.value}
            </div>
            {stat.trend && (
              <div className={stat.trend === 'up' ? 'text-warm-sage' : 'text-warm-peach'}>
                {stat.trend === 'up' ? <IoMdTrendingUp size={24} /> : <IoMdTrendingDown size={24} />}
              </div>
            )}
          </div>
          {stat.subtitle && (
            <p className="text-xs text-warm-gray mt-2">{stat.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default React.memo(QuickStats);
