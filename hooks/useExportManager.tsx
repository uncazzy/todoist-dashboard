/**
 * Export Manager Hook
 * Manages registration of exportable sections and orchestrates the export process
 */

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import type { EChartsType } from 'echarts/core';
import { ExportSection } from '../utils/exportHelpers';
import { exportDashboard, ExportProgress } from '../utils/exportDashboard';

interface ExportManagerContextType {
  sections: ExportSection[];
  registerSection: (id: string, label: string, element: HTMLElement | null) => void;
  unregisterSection: (id: string) => void;
  registerChart: (sectionId: string, chartInstance: EChartsType) => void;
  startExport: (selectedSectionIds: string[]) => Promise<void>;
  exportProgress: ExportProgress | null;
  isExporting: boolean;
  forceRenderAll: boolean;
}

const ExportManagerContext = createContext<ExportManagerContextType | undefined>(undefined);

export function ExportProvider({ children }: { children: React.ReactNode }) {
  const [sections, setSections] = useState<ExportSection[]>([]);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [forceRenderAll, setForceRenderAll] = useState(false);
  const sectionsRef = useRef<Map<string, ExportSection>>(new Map());
  const resetTimeoutRef = useRef<number | null>(null);
  const pendingFlushRef = useRef(false);

  /**
   * Register a section for export
   * Uses a deferred flush so multiple registrations in the same render cycle
   * produce only a single setSections call, avoiding cascading re-renders.
   */
  const registerSection = useCallback((id: string, label: string, element: HTMLElement | null) => {
    const existing = sectionsRef.current.get(id);
    if (existing && existing.label === label && existing.element === element) return;

    sectionsRef.current.set(id, {
      id,
      label,
      element,
      chartInstances: existing?.chartInstances || [],
    });

    if (!pendingFlushRef.current) {
      pendingFlushRef.current = true;
      Promise.resolve().then(() => {
        pendingFlushRef.current = false;
        setSections(Array.from(sectionsRef.current.values()));
      });
    }
  }, []);

  /**
   * Unregister a section
   */
  const unregisterSection = useCallback((id: string) => {
    sectionsRef.current.delete(id);
    setSections(Array.from(sectionsRef.current.values()));
  }, []);

  /**
   * Register a chart instance for a specific section
   */
  const registerChart = useCallback((sectionId: string, chartInstance: EChartsType) => {
    const section = sectionsRef.current.get(sectionId);
    if (section) {
      // Check if this chart is already registered to avoid duplicates
      if (!section.chartInstances.includes(chartInstance)) {
        section.chartInstances.push(chartInstance);
        sectionsRef.current.set(sectionId, section);
        setSections(Array.from(sectionsRef.current.values()));
      }
    }
  }, []);

  /**
   * Force-render all lazy sections and wait for charts to initialize
   */
  const prepareForExport = useCallback(async () => {
    setForceRenderAll(true);
    // Wait for lazy sections to mount and charts to initialize
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }, []);

  /**
   * Start the export process
   */
  const startExport = useCallback(
    async (selectedSectionIds: string[]) => {
      setIsExporting(true);
      setExportProgress({
        stage: 'idle',
        message: 'Preparing export...',
        percent: 0,
      });

      try {
        await prepareForExport();
        await exportDashboard(Array.from(sectionsRef.current.values()), {
          selectedSectionIds,
          onProgress: setExportProgress,
        });
      } catch (error) {
        console.error('Export failed:', error);
        setExportProgress({
          stage: 'error',
          message: error instanceof Error ? error.message : 'Export failed',
          percent: 0,
        });
      } finally {
        setForceRenderAll(false);
        // Reset after a delay to show completion message
        resetTimeoutRef.current = window.setTimeout(() => {
          setIsExporting(false);
          setExportProgress(null);
          resetTimeoutRef.current = null;
        }, 2000);
      }
    },
    [prepareForExport]
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, []);

  const value: ExportManagerContextType = {
    sections,
    registerSection,
    unregisterSection,
    registerChart,
    startExport,
    exportProgress,
    isExporting,
    forceRenderAll,
  };

  return (
    <ExportManagerContext.Provider value={value}>
      {children}
    </ExportManagerContext.Provider>
  );
}

/**
 * Hook to access the export manager
 */
export function useExportManager() {
  const context = useContext(ExportManagerContext);
  if (!context) {
    throw new Error('useExportManager must be used within an ExportProvider');
  }
  return context;
}

/**
 * Hook to register a section for export
 * Usage: const ref = useExportSection('section-id', 'Section Label');
 */
export function useExportSection(id: string, label: string) {
  const { registerSection, unregisterSection } = useExportManager();

  // Use a callback ref to ensure we capture the element when it's mounted
  // Always register (even with null element) so lazy sections appear in export/visibility lists
  const callbackRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      registerSection(id, label, element);
    },
    [id, label, registerSection]
  );

  React.useEffect(() => {
    return () => {
      unregisterSection(id);
    };
  }, [id, unregisterSection]);

  return callbackRef;
}

/**
 * Hook to register a chart instance
 * Usage: const chartRef = useExportChart('section-id');
 *        <ReactECharts ref={chartRef} ... />
 */
export function useExportChart(sectionId: string) {
  const { registerChart } = useExportManager();
  const chartRef = useRef<any>(null);

  React.useEffect(() => {
    if (chartRef.current) {
      const echartInstance = chartRef.current.getEchartsInstance();
      if (echartInstance) {
        registerChart(sectionId, echartInstance);
      }
    }
  }, [sectionId, registerChart]);

  return chartRef;
}