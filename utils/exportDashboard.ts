/**
 * Main Export Pipeline - ID-Based Matching Version
 * Robust chart capture with proper container matching
 */

import { format } from 'date-fns';
import {
  ExportSection,
  collectAllStyles,
  captureCharts,
  captureSvgs,
  replaceVisualizationsInClone,
  removeInteractiveElements,
  collectComputedStyles,
  applyCollectedStyles,
  buildHtmlDocument,
  downloadHtml,
  wrapSectionWithSpacing,
  cleanupExportIds,
} from './exportHelpers';

export interface ExportProgress {
  stage: 'idle' | 'charts' | 'packaging' | 'finalizing' | 'complete' | 'error';
  message: string;
  percent: number;
}

export interface ExportOptions {
  selectedSectionIds: string[];
  onProgress?: (progress: ExportProgress) => void;
}

/**
 * Main export function with ID-based matching
 */
export async function exportDashboard(
  sections: ExportSection[],
  options: ExportOptions
): Promise<void> {
  const { selectedSectionIds, onProgress } = options;

  try {
    const sectionsToExport = sections.filter((section) =>
      selectedSectionIds.includes(section.id)
    );

    if (sectionsToExport.length === 0) {
      throw new Error('No sections selected for export');
    }

    // Stage 1: Capture visualizations
    if (onProgress) {
      onProgress({
        stage: 'charts',
        message: 'Capturing charts and visualizations...',
        percent: 10,
      });
    }

    const processedSections: string[] = [];

    for (let i = 0; i < sectionsToExport.length; i++) {
      const section = sectionsToExport[i];

      if (!section || !section.element) {
        console.warn(`Section ${section?.id || i} has no element, skipping`);
        continue;
      }

      // Capture from ORIGINAL element (IDs are assigned inside these functions)
      const charts = await captureCharts(section.element);
      const svgs = await captureSvgs(section.element);

      // CRITICAL: Collect computed styles from ORIGINAL element while it's IN THE DOM
      const computedStyles = collectComputedStyles(section.element);

      // Clone AFTER collecting styles (IDs are now on original)
      const clonedSection = section.element.cloneNode(true) as HTMLElement;

      // Apply collected styles to clone to ensure text visibility
      applyCollectedStyles(clonedSection, computedStyles);

      // Replace in clone using ID matching
      replaceVisualizationsInClone(clonedSection, charts, svgs);

      // Remove interactive elements
      removeInteractiveElements(clonedSection);

      // Wrap with spacing
      const wrappedSection = wrapSectionWithSpacing(clonedSection.outerHTML);
      processedSections.push(wrappedSection);

      // Clean up IDs from original element
      cleanupExportIds(section.element);

      if (onProgress) {
        const percent = 10 + Math.floor((i / sectionsToExport.length) * 40);
        onProgress({
          stage: 'charts',
          message: `Processing section ${i + 1} of ${sectionsToExport.length}...`,
          percent,
        });
      }
    }

    // Stage 2: Collect CSS
    if (onProgress) {
      onProgress({
        stage: 'packaging',
        message: 'Collecting styles...',
        percent: 60,
      });
    }

    const styles = await collectAllStyles();

    // Stage 3: Build and download
    if (onProgress) {
      onProgress({
        stage: 'finalizing',
        message: 'Building export file...',
        percent: 85,
      });
    }

    const bodyContent = processedSections.join('\n');
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
    const timestampFilename = format(new Date(), 'yyyy-MM-dd-HHmm');

    const htmlContent = buildHtmlDocument('Todoist Dashboard Export', styles, bodyContent, timestamp);

    downloadHtml(htmlContent, `todoist-dashboard-${timestampFilename}.html`);

    if (onProgress) {
      onProgress({
        stage: 'complete',
        message: 'Export complete!',
        percent: 100,
      });
    }
  } catch (error) {
    console.error('Export failed:', error);

    if (onProgress) {
      onProgress({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Export failed',
        percent: 0,
      });
    }

    throw error;
  }
}

/**
 * Validate section is ready
 */
export function isSectionReady(section: ExportSection): boolean {
  if (!section.element) return false;
  if (!document.body.contains(section.element)) return false;
  if (section.element.children.length === 0) return false;
  return true;
}

/**
 * Get export summary
 */
export function getExportSummary(sections: ExportSection[]): string {
  const sectionNames = sections.map((s) => s.label).join(', ');
  return `Exporting ${sections.length} section${sections.length !== 1 ? 's' : ''}: ${sectionNames}`;
}
