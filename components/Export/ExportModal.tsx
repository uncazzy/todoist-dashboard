/**
 * Export Modal Component
 * Modal for selecting sections and triggering export
 */

import React, { useState, useEffect } from 'react';
import { HiX, HiDownload, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { useExportManager } from '../../hooks/useExportManager';

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
    if (newSelected.has(sectionId)) {
      newSelected.delete(sectionId);
    } else {
      newSelected.add(sectionId);
    }
    setSelectedSections(newSelected);
  };

  // Select all sections
  const selectAll = () => {
    setSelectedSections(new Set(sections.map((s) => s.id)));
  };

  // Deselect all sections
  const deselectAll = () => {
    setSelectedSections(new Set());
  };

  // Handle export
  const handleExport = async () => {
    if (selectedSections.size === 0) {
      return;
    }

    await startExport(Array.from(selectedSections));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Export Dashboard
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Select the sections you want to include in your export
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
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
                  className="text-sm px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                >
                  Deselect All
                </button>
                <div className="ml-auto text-sm text-gray-400">
                  {selectedSections.size} of {sections.length} selected
                </div>
              </div>

              {/* Section List */}
              <div className="space-y-2">
                {sections.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No exportable sections found. Please wait for the dashboard to load.
                  </div>
                ) : (
                  sections.map((section) => (
                    <label
                      key={section.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSections.has(section.id)}
                        onChange={() => toggleSection(section.id)}
                        className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                      />
                      <span className="flex-1 text-gray-200 group-hover:text-white transition-colors">
                        {section.label}
                      </span>
                      {section.chartInstances.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
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
                  <HiCheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                ) : exportProgress?.stage === 'error' ? (
                  <HiXCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                ) : (
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div
                      className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
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

                <p className="text-gray-400">{exportProgress?.message}</p>

                {exportProgress?.stage !== 'error' && exportProgress?.stage !== 'complete' && (
                  <div className="mt-6 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                      style={{ width: `${exportProgress?.percent || 0}%` }}
                    ></div>
                  </div>
                )}

                {exportProgress?.stage === 'complete' && (
                  <p className="text-sm text-gray-400 mt-4">
                    Your dashboard has been downloaded as an HTML file.
                  </p>
                )}

                {exportProgress?.stage === 'error' && (
                  <button
                    onClick={handleClose}
                    className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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
          <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
            <div className="text-sm text-gray-400">
              Export format: Static HTML file
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={selectedSections.size === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
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
