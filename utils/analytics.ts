/**
 * Analytics utility for Umami event tracking
 *
 * This module provides type-safe event tracking for understanding user interactions.
 * All tracking is anonymous and complies with the privacy policy.
 *
 * Usage:
 *   import { trackEvent, trackFilterChange, trackChartInteraction } from '@/utils/analytics';
 *   trackEvent('button_click', { button: 'export' });
 */

// Extend Window interface to include umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

// Event categories for organization
export type EventCategory =
  | 'filter'
  | 'export'
  | 'chart'
  | 'customization'
  | 'navigation'
  | 'task_list'
  | 'mobile'
  | 'data';

// Specific event names for type safety
export type EventName =
  // Filter events
  | 'filter_date_preset'
  | 'filter_date_custom'
  | 'filter_date_clear'
  | 'filter_project_change'
  | 'filter_reset_all'
  // Export events
  | 'export_modal_open'
  | 'export_section_toggle'
  | 'export_select_all'
  | 'export_deselect_all'
  | 'export_start'
  | 'export_complete'
  // Chart events
  | 'chart_view_change'
  | 'chart_timeframe_change'
  | 'chart_interaction'
  // Customization events
  | 'customize_modal_open'
  | 'customize_section_toggle'
  | 'customize_select_all'
  | 'customize_deselect_all'
  | 'customize_save'
  // Navigation events
  | 'nav_sign_in'
  | 'nav_sign_out'
  | 'nav_recurring_page'
  | 'nav_legal_page'
  | 'nav_back_to_dashboard'
  // Task list events
  | 'task_list_timeframe_change'
  | 'task_list_print'
  | 'task_list_paginate'
  // Mobile events
  | 'mobile_fab_open'
  | 'mobile_controls_close'
  // Data events
  | 'data_refresh'
  | 'data_load_complete';

// Type-safe event data based on event name
interface EventDataMap {
  // Filter events
  filter_date_preset: { preset: string };
  filter_date_custom: { days_range: number };
  filter_date_clear: Record<string, never>;
  filter_project_change: { project_count: number; action: 'add' | 'remove' | 'clear' };
  filter_reset_all: Record<string, never>;

  // Export events
  export_modal_open: Record<string, never>;
  export_section_toggle: { section: string; enabled: boolean };
  export_select_all: Record<string, never>;
  export_deselect_all: Record<string, never>;
  export_start: { section_count: number };
  export_complete: { section_count: number };

  // Chart events
  chart_view_change: { chart: string; view: string };
  chart_timeframe_change: { chart: string; timeframe: string };
  chart_interaction: { chart: string; action: string };

  // Customization events
  customize_modal_open: Record<string, never>;
  customize_section_toggle: { section: string; visible: boolean };
  customize_select_all: Record<string, never>;
  customize_deselect_all: Record<string, never>;
  customize_save: { visible_count: number };

  // Navigation events
  nav_sign_in: Record<string, never>;
  nav_sign_out: Record<string, never>;
  nav_recurring_page: Record<string, never>;
  nav_legal_page: Record<string, never>;
  nav_back_to_dashboard: { from: string };

  // Task list events
  task_list_timeframe_change: { list: string; timeframe: string };
  task_list_print: { list: string };
  task_list_paginate: { list: string; direction: 'next' | 'prev'; page: number };

  // Mobile events
  mobile_fab_open: Record<string, never>;
  mobile_controls_close: Record<string, never>;

  // Data events
  data_refresh: Record<string, never>;
  data_load_complete: { task_count: number };
}

/**
 * Check if Umami is available
 */
function isUmamiAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.umami?.track === 'function';
}

/**
 * Track a generic event with optional data
 * Use the more specific tracking functions when possible for type safety
 */
export function trackEvent<T extends EventName>(
  eventName: T,
  eventData?: EventDataMap[T]
): void {
  if (!isUmamiAvailable()) {
    // In development, log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, eventData);
    }
    return;
  }

  try {
    // Convert data to Umami-compatible format (all values must be primitives)
    const data = eventData as Record<string, string | number | boolean> | undefined;
    window.umami!.track(eventName, data);
  } catch (error) {
    // Silently fail - analytics should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics Error]', error);
    }
  }
}

// ============================================================================
// Convenience functions for common tracking scenarios
// ============================================================================

/**
 * Track date range filter changes
 */
export function trackDateFilter(
  type: 'preset' | 'custom' | 'clear',
  data?: { preset?: string; daysRange?: number }
): void {
  if (type === 'preset' && data?.preset) {
    trackEvent('filter_date_preset', { preset: data.preset });
  } else if (type === 'custom' && data?.daysRange !== undefined) {
    trackEvent('filter_date_custom', { days_range: data.daysRange });
  } else if (type === 'clear') {
    trackEvent('filter_date_clear', {});
  }
}

/**
 * Track project filter changes
 */
export function trackProjectFilter(
  projectCount: number,
  action: 'add' | 'remove' | 'clear'
): void {
  trackEvent('filter_project_change', { project_count: projectCount, action });
}

/**
 * Track chart interactions
 */
export function trackChartInteraction(
  chartName: string,
  action: 'view_change' | 'timeframe_change' | 'hover' | 'click',
  value?: string
): void {
  if (action === 'view_change') {
    trackEvent('chart_view_change', { chart: chartName, view: value || '' });
  } else if (action === 'timeframe_change') {
    trackEvent('chart_timeframe_change', { chart: chartName, timeframe: value || '' });
  } else {
    trackEvent('chart_interaction', { chart: chartName, action });
  }
}

/**
 * Track export actions
 */
export function trackExport(
  action: 'open' | 'toggle_section' | 'select_all' | 'deselect_all' | 'start' | 'complete',
  data?: { section?: string; enabled?: boolean; sectionCount?: number }
): void {
  switch (action) {
    case 'open':
      trackEvent('export_modal_open', {});
      break;
    case 'toggle_section':
      if (data?.section !== undefined && data?.enabled !== undefined) {
        trackEvent('export_section_toggle', { section: data.section, enabled: data.enabled });
      }
      break;
    case 'select_all':
      trackEvent('export_select_all', {});
      break;
    case 'deselect_all':
      trackEvent('export_deselect_all', {});
      break;
    case 'start':
      if (data?.sectionCount !== undefined) {
        trackEvent('export_start', { section_count: data.sectionCount });
      }
      break;
    case 'complete':
      if (data?.sectionCount !== undefined) {
        trackEvent('export_complete', { section_count: data.sectionCount });
      }
      break;
  }
}

/**
 * Track customization modal actions
 */
export function trackCustomization(
  action: 'open' | 'toggle_section' | 'select_all' | 'deselect_all' | 'save',
  data?: { section?: string; visible?: boolean; visibleCount?: number }
): void {
  switch (action) {
    case 'open':
      trackEvent('customize_modal_open', {});
      break;
    case 'toggle_section':
      if (data?.section !== undefined && data?.visible !== undefined) {
        trackEvent('customize_section_toggle', { section: data.section, visible: data.visible });
      }
      break;
    case 'select_all':
      trackEvent('customize_select_all', {});
      break;
    case 'deselect_all':
      trackEvent('customize_deselect_all', {});
      break;
    case 'save':
      if (data?.visibleCount !== undefined) {
        trackEvent('customize_save', { visible_count: data.visibleCount });
      }
      break;
  }
}

/**
 * Track task list interactions
 */
export function trackTaskList(
  listName: string,
  action: 'timeframe_change' | 'print' | 'paginate',
  data?: { timeframe?: string; direction?: 'next' | 'prev'; page?: number }
): void {
  switch (action) {
    case 'timeframe_change':
      if (data?.timeframe) {
        trackEvent('task_list_timeframe_change', { list: listName, timeframe: data.timeframe });
      }
      break;
    case 'print':
      trackEvent('task_list_print', { list: listName });
      break;
    case 'paginate':
      if (data?.direction && data?.page !== undefined) {
        trackEvent('task_list_paginate', {
          list: listName,
          direction: data.direction,
          page: data.page
        });
      }
      break;
  }
}

/**
 * Track navigation events
 */
export function trackNavigation(
  destination: 'sign_in' | 'sign_out' | 'recurring' | 'legal' | 'dashboard',
  from?: string
): void {
  switch (destination) {
    case 'sign_in':
      trackEvent('nav_sign_in', {});
      break;
    case 'sign_out':
      trackEvent('nav_sign_out', {});
      break;
    case 'recurring':
      trackEvent('nav_recurring_page', {});
      break;
    case 'legal':
      trackEvent('nav_legal_page', {});
      break;
    case 'dashboard':
      trackEvent('nav_back_to_dashboard', { from: from || 'unknown' });
      break;
  }
}

/**
 * Track mobile control interactions
 */
export function trackMobile(action: 'fab_open' | 'controls_close'): void {
  if (action === 'fab_open') {
    trackEvent('mobile_fab_open', {});
  } else {
    trackEvent('mobile_controls_close', {});
  }
}

/**
 * Track data loading events
 */
export function trackData(action: 'refresh' | 'load_complete', taskCount?: number): void {
  if (action === 'refresh') {
    trackEvent('data_refresh', {});
  } else if (action === 'load_complete' && taskCount !== undefined) {
    trackEvent('data_load_complete', { task_count: taskCount });
  }
}
