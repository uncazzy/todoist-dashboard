import { Tooltip } from 'react-tooltip';

interface Filter {
  id: 'today' | 'week' | 'month';
  label: string;
  icon: string;
  tooltip: string;
}

interface TimeFrameProps {
  currentFilter: Filter['id'];
  handleFilterClick: (filterId: Filter['id']) => void;
  numOfTasks: number;
}

export default function TimeFrame({
  currentFilter,
  handleFilterClick,
  numOfTasks,
}: TimeFrameProps) {
  const filters: Filter[] = [
    { id: 'today', label: 'Today', icon: '📅', tooltip: 'Tasks completed today' },
    { id: 'week', label: 'This week', icon: '📅', tooltip: 'Tasks completed in the last 7 days' },
    { id: 'month', label: 'This month', icon: '📅', tooltip: 'Tasks completed in the last 30 days' }
  ];

  return (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {filters.map((filter, index) => (
        <div key={filter.id} className="flex items-center">
          {index > 0 && (
            <div className="text-gray-700 mx-2">/</div>
          )}
          <button
            onClick={() => handleFilterClick(filter.id)}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              currentFilter === filter.id
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-gray-500 hover:text-gray-400 hover:bg-gray-800'
            }`}
            data-tooltip-id="timeframe-tooltip"
            data-tooltip-content={filter.tooltip}
          >
            <span className="flex items-center space-x-1">
              {currentFilter === filter.id && (
                <span className="text-sm">{filter.icon}</span>
              )}
              <span>{filter.label}</span>
              {currentFilter === filter.id && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">
                  {numOfTasks}
                </span>
              )}
            </span>
          </button>
        </div>
      ))}
      <Tooltip id="timeframe-tooltip" />
    </div>
  );
}
