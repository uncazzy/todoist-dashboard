/**
 * Completion Trends Component
 * Displays Daily, Weekly, and Monthly task completion trends with charts
 */

import React, { memo } from 'react';
import { Tooltip } from 'react-tooltip';
import { BsQuestionCircle } from 'react-icons/bs';
import { calculateTaskAverages } from '../../utils/calculateTaskAverages';
import TrendChart from '../TrendChart';
import { CompletedTask } from '../../types';

type QuestionMarkProps = {
  content: string;
};

const QuestionMark: React.FC<QuestionMarkProps> = memo(({ content }) => (
  <BsQuestionCircle
    className="inline-block ml-2 text-warm-gray hover:text-white cursor-help"
    data-tooltip-id="trends-tooltip"
    data-tooltip-content={content}
  />
));

QuestionMark.displayName = 'QuestionMark';

type CompletionTrendsProps = {
  completedTasks: CompletedTask[];
  loading?: boolean;
};

const CompletionTrends: React.FC<CompletionTrendsProps> = ({ completedTasks, loading }) => {
  const taskAverages = calculateTaskAverages(completedTasks);

  return (
    <div className={`bg-warm-card border border-warm-border p-2 md:p-6 rounded-2xl ${loading ? 'opacity-50' : ''}`}>
      <h3 className="text-xl font-semibold mb-4 flex items-center text-white">
        Task Completion Trends
        <QuestionMark content="Historical trends of your task completion patterns" />
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Daily Trend */}
        <div>
          {loading || !taskAverages?.last24Hours ? (
            <div className="flex items-center justify-center h-[240px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-warm-gray">Daily</span>
                <div className="flex items-center">
                  <span className="text-warm-peach font-semibold mr-3">
                    {taskAverages.last24Hours.average} avg
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded cursor-help ${
                      taskAverages.last24Hours.percentChange >= 0
                        ? 'text-warm-sage bg-warm-sage/10'
                        : 'text-warm-peach bg-warm-peach/10'
                    }`}
                    data-tooltip-id="trends-tooltip"
                    data-tooltip-content={`${Math.abs(taskAverages.last24Hours.percentChange)}% ${
                      taskAverages.last24Hours.percentChange >= 0 ? 'above' : 'below'
                    } your daily average (comparing last 24 hours to 4-week average)`}
                  >
                    {taskAverages.last24Hours.percentChange >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(taskAverages.last24Hours.percentChange)}%
                  </span>
                </div>
              </div>
              <TrendChart
                data={taskAverages.last24Hours.history.data}
                labels={taskAverages.last24Hours.history.labels}
                height={180}
              />
            </>
          )}
        </div>

        {/* Weekly Trend */}
        <div>
          {loading || !taskAverages?.last7Days ? (
            <div className="flex items-center justify-center h-[240px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-warm-gray">Weekly</span>
                <div className="flex items-center">
                  <span className="text-warm-peach font-semibold mr-3">
                    {taskAverages.last7Days.average} avg
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded cursor-help ${
                      taskAverages.last7Days.percentChange >= 0
                        ? 'text-warm-sage bg-warm-sage/10'
                        : 'text-warm-peach bg-warm-peach/10'
                    }`}
                    data-tooltip-id="trends-tooltip"
                    data-tooltip-content={`${Math.abs(taskAverages.last7Days.percentChange)}% ${
                      taskAverages.last7Days.percentChange >= 0 ? 'above' : 'below'
                    } your weekly average (comparing last 7 days to 12-week average)`}
                  >
                    {taskAverages.last7Days.percentChange >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(taskAverages.last7Days.percentChange)}%
                  </span>
                </div>
              </div>
              <TrendChart
                data={taskAverages.last7Days.history.data}
                labels={taskAverages.last7Days.history.labels}
                height={180}
              />
            </>
          )}
        </div>

        {/* Monthly Trend */}
        <div>
          {loading || !taskAverages?.last30Days ? (
            <div className="flex items-center justify-center h-[240px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-warm-gray">Monthly</span>
                <div className="flex items-center">
                  <span className="text-warm-peach font-semibold mr-3">
                    {taskAverages.last30Days.average} avg
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded cursor-help ${
                      taskAverages.last30Days.percentChange >= 0
                        ? 'text-warm-sage bg-warm-sage/10'
                        : 'text-warm-peach bg-warm-peach/10'
                    }`}
                    data-tooltip-id="trends-tooltip"
                    data-tooltip-content={`${Math.abs(taskAverages.last30Days.percentChange)}% ${
                      taskAverages.last30Days.percentChange >= 0 ? 'above' : 'below'
                    } your monthly average (comparing last 30 days to 12-month average)`}
                  >
                    {taskAverages.last30Days.percentChange >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(taskAverages.last30Days.percentChange)}%
                  </span>
                </div>
              </div>
              <TrendChart
                data={taskAverages.last30Days.history.data}
                labels={taskAverages.last30Days.history.labels}
                height={180}
              />
            </>
          )}
        </div>
      </div>

      <Tooltip id="trends-tooltip" positionStrategy="fixed" openOnClick={true} className="z-50 max-w-xs text-center" />
    </div>
  );
};

export default memo(CompletionTrends);
