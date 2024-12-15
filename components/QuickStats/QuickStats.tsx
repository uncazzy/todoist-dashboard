import React from 'react';
import { IoMdTrendingDown, IoMdTrendingUp } from 'react-icons/io';
import { getKarmaLevel } from '../../utils/karma';

interface QuickStatsProps {
  activeTasks: any[];
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
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition-transform">
        <h3 className="text-gray-400 text-sm sm:text-base mb-2">Active Tasks</h3>
        <div className="text-2xl sm:text-3xl font-bold text-blue-400">
          {activeTasks.length}
        </div>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition-transform">
        <h3 className="text-gray-400 text-sm sm:text-base mb-2">Active Projects</h3>
        <div className="text-2xl sm:text-3xl font-bold text-blue-400">
          {projectCount}
        </div>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition-transform">
        <h3 className="text-gray-400 text-sm sm:text-base mb-2">Completed Tasks</h3>
        <div className="text-2xl sm:text-3xl font-bold text-purple-400">
          {totalCompletedTasks}
        </div>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition-transform">
        <h3 className="text-gray-400 text-sm sm:text-base mb-2">Karma Score</h3>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {karma || 0}
            </div>
            {karmaTrend !== 'none' && (
              <div className={`text-xl ${karmaRising ? 'text-green-500' : 'text-red-500'}`}>
                {karmaRising ? <IoMdTrendingUp /> : <IoMdTrendingDown />}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {getKarmaLevel(karma || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
