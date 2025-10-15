/**
 * Export Helper Utilities - ID-Based Matching Version
 * Robust chart capture and matching using unique IDs
 */

import { EChartsInstance } from 'echarts-for-react';
import * as echarts from 'echarts/core';

export interface ExportSection {
  id: string;
  label: string;
  element: HTMLElement | null;
  chartInstances: EChartsInstance[];
}

interface CapturedChart {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
}

const EXPORT_ID_ATTR = 'data-export-chart-id';
let chartIdCounter = 0;

/**
 * Assign unique IDs to all chart containers in an element
 * This allows us to match containers between original and cloned DOM
 */
function assignChartIds(element: HTMLElement): void {
  // Strategy 1: Find divs with _echarts_instance_ attribute (all ECharts add this)
  const echartsContainers = element.querySelectorAll('[_echarts_instance_]');
  echartsContainers.forEach(container => {
    if (!(container instanceof HTMLElement)) return;
    if (container.getAttribute(EXPORT_ID_ATTR)) return; // Already has ID

    const instance = echarts.getInstanceByDom(container);
    if (instance) {
      container.setAttribute(EXPORT_ID_ATTR, `chart-${chartIdCounter++}`);
    }
  });

  // Strategy 2: Find canvases and check their parents (ReactECharts pattern)
  const canvases = element.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    const container = canvas.parentElement;
    if (container && !container.getAttribute(EXPORT_ID_ATTR)) {
      const instance = echarts.getInstanceByDom(container);
      if (instance) {
        container.setAttribute(EXPORT_ID_ATTR, `chart-${chartIdCounter++}`);
      }
    }
  });

  // Strategy 3: Handle regular SVGs (non-ECharts like D3 word cloud)
  // Skip SVGs inside interactive elements that will be removed
  const svgs = element.querySelectorAll('svg');
  svgs.forEach(svg => {
    const container = svg.parentElement;
    if (container && !container.getAttribute(EXPORT_ID_ATTR)) {
      // Check if this SVG is part of an ECharts instance
      const isECharts = echarts.getInstanceByDom(container);

      // Skip if SVG is inside any interactive element (checks all ancestors)
      const isInteractive = svg.closest('button, input, select') !== null;

      if (!isECharts && !isInteractive) {
        container.setAttribute(EXPORT_ID_ATTR, `svg-${chartIdCounter++}`);
      }
    }
  });
}

/**
 * Remove all export IDs from an element
 */
function cleanupChartIds(element: HTMLElement): void {
  const elementsWithIds = element.querySelectorAll(`[${EXPORT_ID_ATTR}]`);
  elementsWithIds.forEach(el => {
    el.removeAttribute(EXPORT_ID_ATTR);
  });
}

/**
 * Collect ALL CSS including <style> tags AND <link> stylesheets
 * This fixes icon colors and layout by including Tailwind CSS
 */
export async function collectAllStyles(): Promise<string> {
  const styles: string[] = [];

  // Collect inline <style> tags
  const styleTags = document.querySelectorAll('style');
  styleTags.forEach(style => {
    if (style.textContent) {
      styles.push(style.textContent);
    }
  });

  // Fetch and inline <link rel="stylesheet"> tags (this is where Tailwind lives)
  const linkTags = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');

  for (const link of Array.from(linkTags)) {
    try {
      const response = await fetch(link.href);
      if (response.ok) {
        const cssText = await response.text();
        styles.push(`/* Inlined from ${link.href} */\n${cssText}`);
      }
    } catch (error) {
      console.warn('Could not inline stylesheet:', link.href);
    }
  }

  return styles.join('\n\n');
}

/**
 * Robust ECharts capture with proper sizing
 */
async function captureEChartsRobust(
  instance: EChartsInstance,
  container: HTMLElement
): Promise<CapturedChart | null> {
  try {
    const chartId = container.getAttribute(EXPORT_ID_ATTR);
    if (!chartId) {
      console.warn('Chart container missing export ID');
      return null;
    }

    // Wait for layout and resize
    await new Promise(r => requestAnimationFrame(r));
    instance.resize();
    await new Promise(r => requestAnimationFrame(r));

    const dom = instance.getDom() as HTMLElement;
    const rect = dom.getBoundingClientRect();

    // Get dimensions
    const width = rect.width || container.clientWidth || 800;
    const height = rect.height || container.clientHeight || 400;

    // Resolve background color
    let bg = '#1f2937'; // default dark gray
    let el: HTMLElement | null = container;
    while (el && el !== document.documentElement) {
      const bgColor = window.getComputedStyle(el).backgroundColor;
      if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
        bg = bgColor;
        break;
      }
      el = el.parentElement;
    }

    const dataUrl = instance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: bg,
    });

    return { id: chartId, dataUrl, width, height };
  } catch (error) {
    console.error('Failed to capture chart:', error);
    return null;
  }
}

/**
 * Capture all ECharts from element (both canvas and SVG rendered)
 */
export async function captureCharts(element: HTMLElement): Promise<CapturedChart[]> {
  // Wait a moment for any pending chart initializations
  await new Promise(r => setTimeout(r, 100));

  // First, assign IDs to all chart containers
  assignChartIds(element);

  const charts: CapturedChart[] = [];

  // Find all containers with export IDs
  const containers = element.querySelectorAll(`[${EXPORT_ID_ATTR}]`);

  for (const container of Array.from(containers)) {
    if (!(container instanceof HTMLElement)) continue;

    const chartId = container.getAttribute(EXPORT_ID_ATTR);
    if (!chartId || !chartId.startsWith('chart-')) continue;

    const instance = echarts.getInstanceByDom(container);
    if (instance) {
      const captured = await captureEChartsRobust(instance, container);
      if (captured) {
        charts.push(captured);
      } else {
        console.warn(`Failed to capture chart ${chartId}`);
      }
    } else {
      console.warn(`No ECharts instance found for container with ID ${chartId}`);
    }
  }

  return charts;
}

/**
 * Capture SVGs (non-ECharts like D3 word cloud)
 */
interface CapturedSvg {
  id: string;
  markup: string;
}

export async function captureSvgs(element: HTMLElement): Promise<CapturedSvg[]> {
  // Make sure IDs are assigned
  assignChartIds(element);

  // Check if there are any SVG text elements that indicate D3 word cloud
  const svgTexts = Array.from(element.querySelectorAll('svg text'));
  if (svgTexts.length > 30) { // Word cloud has MANY text elements (75-150), not just a few icons
    // Helper to check if words are properly spread out
    const isLayoutComplete = () => {
      const positions: number[] = [];
      svgTexts.forEach(el => {
        const transform = el.getAttribute('transform');
        if (transform) {
          // Extract X coordinate from transform="translate(x,y)rotate(angle)"
          const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
          if (match && match[1] && match[2]) {
            positions.push(parseFloat(match[1]), parseFloat(match[2]));
          }
        }
      });

      if (positions.length < 10) return false; // Not enough positioned yet

      // Calculate spread - if words are properly laid out, they should span a wide area
      const minPos = Math.min(...positions);
      const maxPos = Math.max(...positions);
      const spread = maxPos - minPos;

      // Word cloud should span at least 200px if properly laid out
      return spread > 200;
    };

    // Poll up to 5 times (2500ms max) waiting for layout to complete
    let attempts = 0;
    while (!isLayoutComplete() && attempts < 5) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }
  }

  const svgs: CapturedSvg[] = [];

  // Find all containers with SVG IDs (not chart IDs - those are ECharts)
  const containers = element.querySelectorAll(`[${EXPORT_ID_ATTR}]`);

  for (const container of Array.from(containers)) {
    if (!(container instanceof HTMLElement)) continue;

    const svgId = container.getAttribute(EXPORT_ID_ATTR);
    if (!svgId || !svgId.startsWith('svg-')) continue;

    const svg = container.querySelector('svg');
    if (!svg) continue;

    const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Copy viewBox if it exists
    if (svg.getAttribute('viewBox')) {
      clonedSvg.setAttribute('viewBox', svg.getAttribute('viewBox')!);
    }

    // Ensure dimensions are set
    if (!clonedSvg.getAttribute('width')) {
      clonedSvg.setAttribute('width', String(svg.clientWidth || 800));
    }
    if (!clonedSvg.getAttribute('height')) {
      clonedSvg.setAttribute('height', String(svg.clientHeight || 400));
    }

    // Inline styles for ALL elements (not just text)
    clonedSvg.querySelectorAll('*').forEach(el => {
      if (el instanceof SVGElement) {
        const computed = window.getComputedStyle(el);
        const existingStyle = el.getAttribute('style') || '';

        // Build comprehensive inline style
        const styleProps: string[] = [];

        // For text elements
        if (el.tagName === 'text' || el.tagName === 'tspan') {
          styleProps.push(`font-family:${computed.fontFamily}`);
          styleProps.push(`font-size:${computed.fontSize}`);
          styleProps.push(`fill:${computed.fill || computed.color}`);
          styleProps.push(`text-anchor:${computed.textAnchor}`);
          // Force full opacity for text elements (overrides D3 transitions)
          styleProps.push(`opacity:0.9`);
        }

        // For all elements - preserve fill and stroke
        if (computed.fill && computed.fill !== 'none') {
          styleProps.push(`fill:${computed.fill}`);
        }
        if (computed.stroke && computed.stroke !== 'none') {
          styleProps.push(`stroke:${computed.stroke}`);
        }
        // Only apply opacity for non-text elements
        if (el.tagName !== 'text' && el.tagName !== 'tspan') {
          if (computed.opacity && computed.opacity !== '1') {
            styleProps.push(`opacity:${computed.opacity}`);
          }
        }

        const newStyle = styleProps.join(';');
        el.setAttribute('style', existingStyle + ';' + newStyle);
      }
    });

    svgs.push({
      id: svgId,
      markup: clonedSvg.outerHTML
    });
  }

  return svgs;
}

/**
 * Replace charts and SVGs in cloned element using ID matching
 */
export function replaceVisualizationsInClone(
  clonedElement: HTMLElement,
  charts: CapturedChart[],
  svgs: CapturedSvg[]
): void {
  // Replace ECharts with images using ID matching
  for (const chart of charts) {
    const clonedContainer = clonedElement.querySelector(`[${EXPORT_ID_ATTR}="${chart.id}"]`);
    if (clonedContainer instanceof HTMLElement) {
      // Create image replacement
      const img = document.createElement('img');
      img.src = chart.dataUrl;
      img.alt = 'Chart';
      img.style.width = `${chart.width}px`;
      img.style.height = `${chart.height}px`;
      img.style.display = 'block';

      clonedContainer.innerHTML = '';
      clonedContainer.appendChild(img);
      clonedContainer.removeAttribute(EXPORT_ID_ATTR);

    } else {
      console.warn('Could not find cloned container for chart:', chart.id);
    }
  }

  // Replace SVGs with inline SVG markup using ID matching
  for (const svg of svgs) {
    const clonedContainer = clonedElement.querySelector(`[${EXPORT_ID_ATTR}="${svg.id}"]`);
    if (clonedContainer instanceof HTMLElement) {
      // Find the SVG element inside the container and replace it
      // DON'T replace container.innerHTML (that would delete text content!)
      const existingSvg = clonedContainer.querySelector('svg');
      if (existingSvg) {
        // Create a temporary div to parse the SVG markup
        const temp = document.createElement('div');
        temp.innerHTML = svg.markup;
        const newSvg = temp.querySelector('svg');

        if (newSvg) {
          // Replace just the SVG element, keeping other content (like text)
          existingSvg.replaceWith(newSvg);
        }
      }
      clonedContainer.removeAttribute(EXPORT_ID_ATTR);
    }
    // Skip SVGs not found in clone (they might be in elements that were removed)
  }
}

/**
 * Collect computed styles from an element IN THE DOM
 * Returns array of style objects indexed by element position in tree
 */
export function collectComputedStyles(element: HTMLElement): Record<string, string>[] {
  const allElements = element.querySelectorAll('*');
  const elements = [element, ...Array.from(allElements)];

  const styleArray: Record<string, string>[] = [];

  elements.forEach((el, index) => {
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) {
      styleArray[index] = {};
      return;
    }

    try {
      const computed = window.getComputedStyle(el);
      const styleProps: Record<string, string> = {};

      // Color - ALWAYS collect
      const color = computed.getPropertyValue('color');
      if (color) {
        styleProps.color = color;
      }

      // Background color
      const bgColor = computed.getPropertyValue('background-color');
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        styleProps.backgroundColor = bgColor;
      }

      // Font properties
      const fontSize = computed.getPropertyValue('font-size');
      if (fontSize) {
        styleProps.fontSize = fontSize;
      }

      const fontWeight = computed.getPropertyValue('font-weight');
      if (fontWeight) {
        styleProps.fontWeight = fontWeight;
      }

      const fontFamily = computed.getPropertyValue('font-family');
      if (fontFamily) {
        styleProps.fontFamily = fontFamily;
      }

      // Display
      const display = computed.getPropertyValue('display');
      if (display) {
        styleProps.display = display;
      }

      // Opacity
      const opacity = computed.getPropertyValue('opacity');
      if (opacity && opacity !== '1') {
        styleProps.opacity = opacity;
      }

      // Text alignment
      const textAlign = computed.getPropertyValue('text-align');
      if (textAlign && textAlign !== 'start') {
        styleProps.textAlign = textAlign;
      }

      styleArray[index] = styleProps;
    } catch (error) {
      console.warn('Failed to collect styles for element:', el, error);
      styleArray[index] = {};
    }
  });

  return styleArray;
}

/**
 * Apply collected styles to a cloned element
 * The clone must have identical structure to the original
 */
export function applyCollectedStyles(
  element: HTMLElement,
  styleArray: Record<string, string>[]
): void {
  const allElements = element.querySelectorAll('*');
  const elements = [element, ...Array.from(allElements)];

  let styledCount = 0;

  elements.forEach((el, index) => {
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) return;

    const styleProps = styleArray[index];
    if (!styleProps || Object.keys(styleProps).length === 0) return;

    try {
      const existingStyle = el.getAttribute('style') || '';

      // Convert styleProps object to CSS string
      const newStyleParts: string[] = [];

      for (const [prop, value] of Object.entries(styleProps)) {
        // Convert camelCase to kebab-case
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        // Use !important for color to override any Tailwind classes
        if (cssProp === 'color' || cssProp === 'background-color') {
          newStyleParts.push(`${cssProp}:${value} !important`);
        } else {
          newStyleParts.push(`${cssProp}:${value}`);
        }
      }

      if (newStyleParts.length > 0) {
        const newStyle = newStyleParts.join(';');
        const combinedStyle = existingStyle + (existingStyle && !existingStyle.endsWith(';') ? ';' : '') + newStyle;
        el.setAttribute('style', combinedStyle);
        styledCount++;
      }
    } catch (error) {
      console.warn('Failed to apply styles to element:', el, error);
    }
  });
}

/**
 * Remove interactive elements
 */
export function removeInteractiveElements(element: HTMLElement): void {
  // Remove selects
  element.querySelectorAll('select').forEach(select => {
    const option = select.options[select.selectedIndex];
    if (option) {
      const span = document.createElement('span');
      span.className = select.className;
      span.textContent = option.textContent || '';
      select.parentNode?.replaceChild(span, select);
    } else {
      select.remove();
    }
  });

  // Remove buttons
  element.querySelectorAll('button').forEach(button => button.remove());

  // Remove inputs
  element.querySelectorAll('input').forEach(input => input.remove());

  // Convert links to non-interactive spans (preserves content and styling)
  element.querySelectorAll('a').forEach(link => {
    const div = document.createElement('div');
    div.className = link.className;
    div.innerHTML = link.innerHTML;
    // Copy inline styles if any
    if (link.hasAttribute('style')) {
      div.setAttribute('style', link.getAttribute('style') || '');
    }
    link.parentNode?.replaceChild(div, link);
  });
}

/**
 * Wrap section with proper spacing
 */
export function wrapSectionWithSpacing(sectionHtml: string): string {
  return `<div style="margin-bottom: 1.5rem;">${sectionHtml}</div>`;
}

/**
 * Build HTML document with proper spacing
 */
export function buildHtmlDocument(
  title: string,
  styles: string,
  bodyContent: string,
  timestamp: string
): string {
  // Preserve dark theme
  const htmlClass = document.documentElement.className;

  // Get body background color and text color from current page
  const bodyStyle = window.getComputedStyle(document.body);
  const textColor = bodyStyle.color || '#f3f4f6';

  return `<!DOCTYPE html>
<html lang="en" class="${htmlClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="export-timestamp" content="${timestamp}">
  <style>
    ${styles}

    /* Ensure proper text colors for dark theme */
    body {
      background: linear-gradient(to bottom right, #111827, #1f2937, #111827);
      color: ${textColor};
    }

    /* Additional spacing for export */
    .export-section {
      margin-bottom: 1.5rem;
    }

    /* Ensure proper spacing between grid items */
    .grid {
      gap: 1.5rem;
    }
  </style>
</head>
<body>
  <div style="min-height: 100vh; padding: 1.5rem;">
    <div style="max-width: 1280px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 2rem; border-bottom: 1px solid #374151; padding-bottom: 1rem;">
        <h1 style="color: #60a5fa; font-size: 1.5rem; margin: 0 0 0.5rem 0;">Todoist Dashboard Export</h1>
        <p style="color: #9ca3af; font-size: 0.875rem; margin: 0;">Generated on ${timestamp}</p>
      </div>

      ${bodyContent}

      <div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #374151; color: #6b7280; font-size: 0.75rem;">
        Exported from Todoist Dashboard
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Export helper to assign IDs (for use in main pipeline)
 */
export function assignExportIds(element: HTMLElement): void {
  assignChartIds(element);
}

/**
 * Export helper to cleanup IDs (for use in main pipeline)
 */
export function cleanupExportIds(element: HTMLElement): void {
  cleanupChartIds(element);
}

/**
 * Download HTML file
 */
export function downloadHtml(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
