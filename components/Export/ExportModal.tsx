/**
 * Export Modal Component
 * Modal for selecting sections and triggering export
 */

import React, { useState, useEffect } from 'react';
import { HiX, HiDownload, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { useExportManager } from '../../hooks/useExportManager';
import { trackExport } from '@/utils/analytics';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { sections, startExport, exportProgress, isExporting } = useExportManager();
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const hasInitialized = React.useRef(false);

  // Initialize with all sections selected (only on first load)
  useEffect(() => {
    if (sections.length > 0 && selectedSections.size === 0 && !hasInitialized.current) {
      setSelectedSections(new Set(sections.map((s) => s.id)));
      hasInitialized.current = true;
    }
  }, [sections, selectedSections.size]);

  // Handle closing modal
  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  // Toggle section selection
  const toggleSection = (sectionId: string) => {
    const newSelected = new Set(selectedSections);
    const wasSelected = newSelected.has(sectionId);
    if (wasSelected) {
      newSelected.delete(sectionId);
    } else {
      newSelected.add(sectionId);
    }
    setSelectedSections(newSelected);

    // Track section toggle
    const section = sections.find(s => s.id === sectionId);
    trackExport('toggle_section', { section: section?.label || sectionId, enabled: !wasSelected });
  };

  // Select all sections
  const selectAll = () => {
    setSelectedSections(new Set(sections.map((s) => s.id)));
    trackExport('select_all');
  };

  // Deselect all sections
  const deselectAll = () => {
    setSelectedSections(new Set());
    trackExport('deselect_all');
  };

  // Handle export
  const handleExport = async () => {
    if (selectedSections.size === 0) {
      return;
    }

    trackExport('start', { sectionCount: selectedSections.size });
    await startExport(Array.from(selectedSections));
  };

  // Track export completion
  useEffect(() => {
    if (exportProgress?.stage === 'complete') {
      trackExport('complete', { sectionCount: selectedSections.size });
    }
  }, [exportProgress?.stage, selectedSections.size]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-warm-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-warm-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-border">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Export Dashboard
            </h2>
            <p className="text-sm text-warm-gray mt-1">
              Select the sections you want to include in your export
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="text-warm-gray hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isExporting && !exportProgress ? (
            <>
              {/* Quick Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAll}
                  className="text-sm px-3 py-1 rounded-lg bg-warm-hover hover:bg-warm-card text-white transition-colors border border-warm-border"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm px-3 py-1 rounded-lg bg-warm-hover hover:bg-warm-card text-white transition-colors border border-warm-border"
                >
                  Deselect All
                </button>
                <div className="ml-auto text-sm text-warm-gray">
                  {selectedSections.size} of {sections.length} selected
                </div>
              </div>

              {/* Section List */}
              <div className="space-y-2">
                {sections.length === 0 ? (
                  <div className="text-center py-8 text-warm-gray">
                    No exportable sections found. Please wait for the dashboard to load.
                  </div>
                ) : (
                  sections.map((section) => (
                    <label
                      key={section.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-warm-hover hover:bg-warm-card cursor-pointer transition-colors group border border-warm-border"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSections.has(section.id)}
                        onChange={() => toggleSection(section.id)}
                        className="w-5 h-5 rounded border-warm-border text-warm-peach focus:ring-2 focus:ring-warm-peach focus:ring-offset-2 focus:ring-offset-warm-card"
                      />
                      <span className="flex-1 text-white transition-colors">
                        {section.label}
                      </span>
                      {section.chartInstances.length > 0 && (
                        <span className="text-xs text-warm-gray bg-warm-black px-2 py-1 rounded border border-warm-border">
                          {section.chartInstances.length} chart{section.chartInstances.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </>
          ) : (
            // Progress View
            <div className="py-8">
              <div className="text-center mb-8">
                {exportProgress?.stage === 'complete' ? (
                  <HiCheckCircle className="w-16 h-16 mx-auto text-warm-sage mb-4" />
                ) : exportProgress?.stage === 'error' ? (
                  <HiXCircle className="w-16 h-16 mx-auto text-warm-peach mb-4" />
                ) : (
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-warm-border rounded-full"></div>
                    <div
                      className="absolute inset-0 border-4 border-warm-peach rounded-full border-t-transparent animate-spin"
                      style={{
                        clipPath: `polygon(0 0, 100% 0, 100% ${exportProgress?.percent || 0}%, 0 ${exportProgress?.percent || 0}%)`,
                      }}
                    ></div>
                  </div>
                )}

                <h3 className="text-xl font-semibold text-white mb-2">
                  {exportProgress?.stage === 'complete'
                    ? 'Export Complete!'
                    : exportProgress?.stage === 'error'
                    ? 'Export Failed'
                    : 'Exporting...'}
                </h3>

                <p className="text-warm-gray">{exportProgress?.message}</p>

                {exportProgress?.stage !== 'error' && exportProgress?.stage !== 'complete' && (
                  <div className="mt-6 w-full bg-warm-hover rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-warm-peach h-full transition-all duration-300"
                      style={{ width: `${exportProgress?.percent || 0}%` }}
                    ></div>
                  </div>
                )}

                {exportProgress?.stage === 'complete' && (
                  <p className="text-sm text-warm-gray mt-4">
                    Your dashboard has been downloaded as an HTML file.
                  </p>
                )}

                {exportProgress?.stage === 'error' && (
                  <button
                    onClick={handleClose}
                    className="mt-6 px-6 py-2 bg-warm-peach hover:opacity-90 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExporting && !exportProgress && (
          <div className="flex items-center justify-between p-6 border-t border-warm-border bg-warm-hover">
            <div className="text-sm text-warm-gray">
              Export format: Static HTML file
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-warm-gray hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={selectedSections.size === 0}
                className="flex items-center gap-2 px-6 py-2 bg-warm-peach hover:opacity-90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiDownload className="w-5 h-5" />
                Export as HTML
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
