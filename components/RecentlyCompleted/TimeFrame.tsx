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
            <div className="text-warm-border mx-2">/</div>
          )}
          <button
            onClick={() => handleFilterClick(filter.id)}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              currentFilter === filter.id
                ? 'bg-warm-peach/20 text-warm-peach'
                : 'text-warm-gray hover:text-white hover:bg-warm-hover'
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
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-warm-sage/20 text-warm-sage">
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
