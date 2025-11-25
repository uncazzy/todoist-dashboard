/**
 * Visibility Modal Component
 * Modal for customizing which dashboard sections are visible
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiX } from 'react-icons/hi';
import { useExportManager } from '../../hooks/useExportManager';
import SectionCheckboxList from './SectionCheckboxList';

interface VisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleSections: string[];
  onVisibleSectionsChange: (sections: string[]) => void;
}

export default function VisibilityModal({
  isOpen,
  onClose,
  visibleSections,
  onVisibleSectionsChange,
}: VisibilityModalProps) {
  const { sections } = useExportManager();
  const [selectedForVisibility, setSelectedForVisibility] = useState<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  // Initialize visibility selections from props when modal opens
  useEffect(() => {
    if (isOpen && sections.length > 0) {
      // If visibleSections is empty, all are visible
      const visible =
        visibleSections.length === 0
          ? new Set(sections.map((s) => s.id))
          : new Set(visibleSections);
      setSelectedForVisibility(visible);
      hasInitialized.current = true;
    }
  }, [isOpen, sections, visibleSections]);

  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen]);

  // Handle save visibility changes
  const handleSave = useCallback(() => {
    const visibleIds = Array.from(selectedForVisibility);
    // If all selected, store empty array (means "all visible")
    const toSave = visibleIds.length === sections.length ? [] : visibleIds;
    onVisibleSectionsChange(toSave);
    onClose();
  }, [selectedForVisibility, sections.length, onVisibleSectionsChange, onClose]);

  // Toggle function
  const toggleVisibility = (id: string) => {
    const newSet = new Set(selectedForVisibility);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForVisibility(newSet);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-warm-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-warm-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-border">
          <div>
            <h2 className="text-2xl font-bold text-white">Customize Dashboard</h2>
            <p className="text-sm text-warm-gray mt-1">
              Choose which sections to display
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-warm-gray hover:text-white transition-colors"
            aria-label="Close"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <SectionCheckboxList
            sections={sections}
            selectedIds={selectedForVisibility}
            onToggle={toggleVisibility}
            onSelectAll={() => setSelectedForVisibility(new Set(sections.map((s) => s.id)))}
            onDeselectAll={() => setSelectedForVisibility(new Set())}
            emptyMessage="No sections found. Please wait for the dashboard to load."
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-warm-border bg-warm-hover">
          <div className="text-sm text-warm-gray">
            {selectedForVisibility.size} of {sections.length} sections visible
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-warm-gray hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedForVisibility.size === 0}
              className="px-6 py-2 bg-warm-peach hover:opacity-90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
