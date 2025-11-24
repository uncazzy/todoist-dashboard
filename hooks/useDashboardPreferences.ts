import { useState, useCallback, useRef, useEffect } from 'react';
import type { DashboardPreferences, DateRange } from '@/types';

const STORAGE_KEY = 'todoist_dashboard_preferences';
const SCHEMA_VERSION = 1;
const SAVE_DEBOUNCE_MS = 300;

// Default preferences
const DEFAULT_PREFERENCES: DashboardPreferences = {
  selectedProjectIds: [],
  dateRange: {
    start: null,
    end: null,
    preset: 'all',
  },
  version: SCHEMA_VERSION,
};

/**
 * Loads preferences from localStorage
 * Handles errors gracefully and falls back to defaults
 */
function loadPreferences(): DashboardPreferences {
  // Check if localStorage is available (fails in private browsing)
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored);

    // Validate schema version
    if (parsed.version !== SCHEMA_VERSION) {
      console.warn('Dashboard preferences schema mismatch, resetting to defaults');
      return DEFAULT_PREFERENCES;
    }

    // Deserialize date strings to Date objects
    const rawDateRange =
      parsed.dateRange && typeof parsed.dateRange === 'object'
        ? parsed.dateRange
        : { start: null, end: null, preset: 'all' };

    const dateRange: DateRange = {
      start: rawDateRange.start ? new Date(rawDateRange.start) : null,
      end: rawDateRange.end ? new Date(rawDateRange.end) : null,
      preset: rawDateRange.preset || 'all',
    };

    // Validate dates are not invalid
    if (dateRange.start && isNaN(dateRange.start.getTime())) {
      dateRange.start = null;
    }
    if (dateRange.end && isNaN(dateRange.end.getTime())) {
      dateRange.end = null;
    }

    return {
      selectedProjectIds: Array.isArray(parsed.selectedProjectIds)
        ? parsed.selectedProjectIds
        : [],
      dateRange,
      version: SCHEMA_VERSION,
    };
  } catch (error) {
    console.error('Failed to load dashboard preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Saves preferences to localStorage
 * Handles errors gracefully (quota exceeded, etc.)
 */
function savePreferences(preferences: DashboardPreferences): void {
  // Check if localStorage is available
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    // Serialize dates to ISO strings
    const toSave = {
      ...preferences,
      dateRange: {
        ...preferences.dateRange,
        start: preferences.dateRange.start
          ? preferences.dateRange.start.toISOString()
          : null,
        end: preferences.dateRange.end
          ? preferences.dateRange.end.toISOString()
          : null,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    // Handle quota exceeded or other localStorage errors
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to save dashboard preferences:', error);
    }
  }
}

/**
 * Hook for managing dashboard preferences with localStorage persistence
 *
 * Features:
 * - Auto-loads from localStorage on mount
 * - Auto-saves changes to localStorage (debounced)
 * - Handles localStorage errors gracefully
 * - Validates and sanitizes loaded data
 *
 * @returns Object with preferences, updatePreferences, and clearPreferences
 */
export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState<DashboardPreferences>(loadPreferences);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function
  const debouncedSave = useCallback((prefs: DashboardPreferences) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      savePreferences(prefs);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Updates preferences (shallow merge) and saves to localStorage
   */
  const updatePreferences = useCallback(
    (updates: Partial<DashboardPreferences>) => {
      setPreferences(prev => {
        const updated = {
          ...prev,
          ...updates,
          version: SCHEMA_VERSION,
        };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave]
  );

  /**
   * Clears all preferences and resets to defaults
   */
  const clearPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    updatePreferences,
    clearPreferences,
  };
}
