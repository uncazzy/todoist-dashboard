/**
 * Section Checkbox List Component
 * Reusable checkbox list for selecting dashboard sections
 */

import React from 'react';

interface Section {
  id: string;
  label: string;
  chartInstances?: unknown[];
}

interface SectionCheckboxListProps {
  sections: Section[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  emptyMessage?: string;
  showChartBadge?: boolean;
}

export default function SectionCheckboxList({
  sections,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  emptyMessage = 'No sections available.',
  showChartBadge = false,
}: SectionCheckboxListProps) {
  return (
    <>
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={onSelectAll}
          className="text-sm px-3 py-1 rounded-lg bg-warm-hover hover:bg-warm-card text-white transition-colors border border-warm-border"
        >
          Select All
        </button>
        <button
          onClick={onDeselectAll}
          className="text-sm px-3 py-1 rounded-lg bg-warm-hover hover:bg-warm-card text-white transition-colors border border-warm-border"
        >
          Deselect All
        </button>
        <div className="ml-auto text-sm text-warm-gray">
          {selectedIds.size} of {sections.length} selected
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-2">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-warm-gray">{emptyMessage}</div>
        ) : (
          sections.map((section) => (
            <label
              key={section.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-warm-hover hover:bg-warm-card cursor-pointer transition-colors group border border-warm-border"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(section.id)}
                onChange={() => onToggle(section.id)}
                className="w-5 h-5 rounded border-warm-border text-warm-peach focus:ring-2 focus:ring-warm-peach focus:ring-offset-2 focus:ring-offset-warm-card"
              />
              <span className="flex-1 text-white transition-colors">
                {section.label}
              </span>
              {showChartBadge && section.chartInstances && section.chartInstances.length > 0 && (
                <span className="text-xs text-warm-gray bg-warm-black px-2 py-1 rounded border border-warm-border">
                  {section.chartInstances.length} chart{section.chartInstances.length !== 1 ? 's' : ''}
                </span>
              )}
            </label>
          ))
        )}
      </div>
    </>
  );
}
