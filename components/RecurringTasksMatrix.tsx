import React, { useState, useMemo } from 'react';
import { ActiveTask, CompletedTask, ProjectData } from '../types';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { format, parseISO, eachDayOfInterval, subDays, differenceInDays, isToday } from 'date-fns';
import { BsCalendar3, BsCalendarWeek, BsCalendarMonth } from 'react-icons/bs';
import { IoMdTrendingUp, IoMdTrendingDown } from 'react-icons/io';

interface RecurringTasksMatrixProps {
  activeTasks: ActiveTask[];
  allCompletedTasks: CompletedTask[];
  projectData: ProjectData[];
}

type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'other';

interface TaskStats {
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
  lastCompleted: Date | null;
  streak: number;
  missedCount: number;
}

const RecurringTasksMatrix: React.FC<RecurringTasksMatrixProps> = ({
  activeTasks,
  allCompletedTasks,
  projectData,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<RecurringFrequency>('daily');

  // Determine task frequency from due string
  const getTaskFrequency = (dueString: string): RecurringFrequency => {
    const lower = dueString.toLowerCase();
    
    // Daily patterns
    if (lower.includes('every day') || lower.includes('daily')) {
      return 'daily';
    }
    
    // Weekly patterns
    if (
      lower.includes('every week') || 
      lower.includes('weekly') ||
      /every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(lower) ||
      lower.includes('every mon') ||
      lower.includes('every tue') ||
      lower.includes('every wed') ||
      lower.includes('every thu') ||
      lower.includes('every fri') ||
      lower.includes('every sat') ||
      lower.includes('every sun')
    ) {
      return 'weekly';
    }
    
    // Monthly patterns
    if (
      lower.includes('every month') || 
      lower.includes('monthly') ||
      /every (\d{1,2})(st|nd|rd|th)?( day)?( of)?( the)?( month)?/i.test(lower) || // matches "every 25th", "every 3rd", etc.
      /every (first|last|1st) day/i.test(lower) ||
      lower.includes('every last day') ||
      /every \d{1,2}$/i.test(lower) // matches "every 25", "every 3", etc. at the end of string
    ) {
      return 'monthly';
    }
    
    return 'other';
  };

  // Calculate detailed statistics for a task
  const calculateTaskStats = (
    completions: CompletedTask[],
    frequency: RecurringFrequency
  ): TaskStats => {
    const now = new Date();
    let expectedCount = 0;
    const sortedCompletions = [...completions].sort(
      (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    
    const lastCompleted = sortedCompletions.length > 0 && sortedCompletions[0]?.completed_at
      ? new Date(sortedCompletions[0].completed_at)
      : null;

    // Calculate expected completions based on frequency
    switch (frequency) {
      case 'daily':
        expectedCount = 30; // Last 30 days
        break;
      case 'weekly':
        expectedCount = 4; // Last 4 weeks
        break;
      case 'monthly':
        expectedCount = 3; // Last 3 months
        break;
      default:
        expectedCount = 1;
    }

    const recentCompletions = sortedCompletions.filter(c => {
      const completionDate = new Date(c.completed_at);
      const daysDiff = differenceInDays(now, completionDate);
      return daysDiff <= (frequency === 'daily' ? 30 : frequency === 'weekly' ? 28 : 90);
    });

    const completionRate = (recentCompletions.length / expectedCount) * 100;

    // Calculate trend
    const firstHalfCount = recentCompletions.filter(c => {
      const completionDate = new Date(c.completed_at);
      const daysDiff = differenceInDays(now, completionDate);
      return daysDiff > (frequency === 'daily' ? 15 : frequency === 'weekly' ? 14 : 45);
    }).length;

    const secondHalfCount = recentCompletions.length - firstHalfCount;
    const trend = secondHalfCount > firstHalfCount ? 'up' : 
                 secondHalfCount < firstHalfCount ? 'down' : 'stable';

    // Calculate streak
    let streak = 0;
    if (frequency === 'daily') {
      for (let i = 0; i < sortedCompletions.length; i++) {
        const completion = sortedCompletions[i];
        if (!completion?.completed_at) break;
        
        const currentDate = new Date(completion.completed_at);
        const expectedDate = subDays(now, i);
        
        if (format(currentDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
          streak++;
        } else break;
      }
    }

    // Calculate missed count
    const missedCount = expectedCount - recentCompletions.length;

    return {
      completionRate,
      trend,
      lastCompleted,
      streak,
      missedCount
    };
  };

  // Group and sort recurring tasks
  const recurringTasksData = useMemo(() => {
    const tasks = activeTasks
      .filter(task => task.due?.isRecurring)
      .map(task => {
        const frequency = getTaskFrequency(task.due?.string || '');
        const completions = allCompletedTasks.filter(ct => ct.task_id === task.id);
        
        // Extract day of week or month for sorting
        const getDayNumber = (dueString: string): number => {
          const lower = dueString.toLowerCase();
          // For weekly tasks, convert day names to numbers (0 = Sunday, 1 = Monday, etc.)
          const dayMap: { [key: string]: number } = {
            'sunday': 0, 'sun': 0,
            'monday': 1, 'mon': 1,
            'tuesday': 2, 'tue': 2,
            'wednesday': 3, 'wed': 3,
            'thursday': 4, 'thu': 4,
            'friday': 5, 'fri': 5,
            'saturday': 6, 'sat': 6
          };
          
          // Check for day of week
          for (const [day, num] of Object.entries(dayMap)) {
            if (lower.includes(day)) return num;
          }
          
          // Check for day of month
          const monthDayMatch = lower.match(/(\d{1,2})(st|nd|rd|th)?/);
          if (monthDayMatch?.[1]) {
            return parseInt(monthDayMatch[1], 10);
          }
          
          return 32; // Default to end for sorting
        };
        
        // Calculate statistics
        const stats = calculateTaskStats(completions, frequency);
        
        return {
          task,
          frequency,
          stats,
          project: projectData.find(p => p.id === task.projectId),
          sortOrder: getDayNumber(task.due?.string || '')
        };
      });

    // Sort tasks by frequency priority and then by day within each frequency
    return tasks.sort((a, b) => {
      const freqOrder = { daily: 0, weekly: 1, monthly: 2, other: 3 };
      if (freqOrder[a.frequency] !== freqOrder[b.frequency]) {
        return freqOrder[a.frequency] - freqOrder[b.frequency];
      }
      // Sort by day number within the same frequency
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      // Finally sort by completion rate
      return b.stats.completionRate - a.stats.completionRate;
    });
  }, [activeTasks, allCompletedTasks, projectData]);

  // Helper to format the frequency display
  const getFrequencyDisplay = (dueString: string, frequency: RecurringFrequency): string => {
    const lower = dueString.toLowerCase();
    
    // For weekly tasks, highlight the day
    if (frequency === 'weekly') {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (const day of days) {
        if (lower.includes(day)) {
          return `Every ${day.charAt(0).toUpperCase() + day.slice(1)}`;
        }
      }
    }
    
    // For monthly tasks, format the day
    if (frequency === 'monthly') {
      const monthMatch = lower.match(/(\d{1,2})(st|nd|rd|th)?/);
      if (monthMatch?.[1]) {
        const day = parseInt(monthMatch[1], 10);
        const suffix = monthMatch?.[2] || ['st', 'nd', 'rd'][day - 1] || 'th';
        return `Every ${day}${suffix}`;
      }
      if (lower.includes('last day')) {
        return 'Every last day';
      }
    }
    
    // Default to the original string
    return dueString;
  };

  const getFrequencyIcon = (frequency: RecurringFrequency) => {
    switch (frequency) {
      case 'daily':
        return <BsCalendar3 className="w-4 h-4" />;
      case 'weekly':
        return <BsCalendarWeek className="w-4 h-4" />;
      case 'monthly':
        return <BsCalendarMonth className="w-4 h-4" />;
      default:
        return <BsCalendar3 className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <IoMdTrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <IoMdTrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get completion data for the selected task
  const completionData = useMemo(() => {
    if (!selectedTaskId) return [];

    const selectedTask = recurringTasksData.find(t => t.task.id === selectedTaskId);
    if (!selectedTask) return [];

    // Determine date range based on frequency
    const endDate = new Date();
    const startDate = (() => {
      switch (selectedTask.frequency) {
        case 'daily':
          return subDays(endDate, 29); // 30 days
        case 'weekly':
          return subDays(endDate, 27); // 4 weeks
        case 'monthly':
          return subDays(endDate, 89); // 3 months
        default:
          return subDays(endDate, 29);
      }
    })();

    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const taskCompletions = allCompletedTasks.filter(
      task => task.task_id === selectedTaskId
    );

    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isCompleted = taskCompletions.some(
        task => format(parseISO(task.completed_at), 'yyyy-MM-dd') === dateStr
      );
      return [dateStr, isCompleted ? 1 : 0];
    });
  }, [selectedTaskId, allCompletedTasks, recurringTasksData]);

  // Chart options
  const chartOptions: EChartsOption = useMemo(() => {
    if (!completionData.length) return {};

    const selectedTask = recurringTasksData.find(t => t.task.id === selectedTaskId);
    const frequency = selectedTask?.frequency || 'daily';

    return {
      tooltip: {
        position: 'top',
        formatter: function (params: any) {
          const value = params.value;
          const dateStr = format(new Date(value[0]), 'MMM d, yyyy');
          return `${dateStr}: ${value[1] ? 'Completed' : 'Not completed'}`;
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '15%'
      },
      xAxis: {
        type: 'time',
        splitLine: {
          show: true,
          lineStyle: {
            color: '#303030'
          }
        },
        axisLabel: {
          formatter: (value: number) => {
            const date = new Date(value);
            return frequency === 'monthly' 
              ? format(date, 'MMM')
              : format(date, 'MMM d');
          }
        }
      },
      yAxis: {
        type: 'value',
        show: false,
        min: 0,
        max: 1
      },
      series: [{
        type: 'scatter',
        symbolSize: 16,
        data: completionData,
        itemStyle: {
          color: (params: any) => {
            return params.value[1] ? '#10B981' : '#374151';
          }
        }
      }]
    } as EChartsOption;
  }, [completionData, recurringTasksData, selectedTaskId]);

  if (recurringTasksData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No recurring tasks found
      </div>
    );
  }

  const filteredTasks = selectedFrequency === 'other'
    ? recurringTasksData.filter(t => !['daily', 'weekly', 'monthly'].includes(t.frequency))
    : recurringTasksData.filter(t => t.frequency === selectedFrequency);

  return (
    <div className="space-y-6">
      {/* Frequency Filter */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {(['daily', 'weekly', 'monthly', 'other'] as RecurringFrequency[]).map((freq) => (
            <button
              key={freq}
              onClick={() => setSelectedFrequency(freq)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFrequency === freq
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredTasks.map(({ task, frequency, stats, project }) => (
          <div
            key={task.id}
            className={`bg-gray-900 rounded-lg p-4 transition-all ${
              selectedTaskId === task.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {getFrequencyIcon(frequency)}
                  <h3 className="text-lg font-medium">{task.content}</h3>
                </div>
                <div className="flex items-center mt-1 space-x-2 text-sm text-gray-400">
                  <span>{project?.name || 'No Project'}</span>
                  <span>•</span>
                  <span>{getFrequencyDisplay(task.due?.string || '', frequency)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                className="ml-4 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {selectedTaskId === task.id ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-sm text-gray-400">Completion Rate</div>
                <div className="text-xl font-semibold flex items-center space-x-2">
                  <span>{Math.round(stats.completionRate)}%</span>
                  {getTrendIcon(stats.trend)}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-sm text-gray-400">Current Streak</div>
                <div className="text-xl font-semibold">
                  {stats.streak} {frequency === 'daily' ? 'days' : 'times'}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-sm text-gray-400">Missed</div>
                <div className="text-xl font-semibold">
                  {stats.missedCount} times
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-sm text-gray-400">Last Completed</div>
                <div className="text-xl font-semibold">
                  {stats.lastCompleted
                    ? isToday(stats.lastCompleted)
                      ? 'Today'
                      : format(stats.lastCompleted, 'MMM d')
                    : 'Never'}
                </div>
              </div>
            </div>

            {selectedTaskId === task.id && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Completion History ({frequency === 'monthly' ? 'Last 3 Months' : frequency === 'weekly' ? 'Last 4 Weeks' : 'Last 30 Days'})
                </h4>
                <div className="h-[200px]">
                  <ReactECharts
                    option={chartOptions}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <div className="flex justify-center mt-4 space-x-6 text-sm text-gray-400">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-700 rounded-sm mr-2"></div>
                    <span>Not Completed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringTasksMatrix;
