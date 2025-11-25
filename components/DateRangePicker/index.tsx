import React, { useState, useRef, useEffect, useMemo } from 'react';
import { HiOutlineChevronDown, HiCalendar, HiCheck, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { DateRange, DateRangePreset } from '@/types';
import { getDateRangeFromPreset, getPresetLabel } from '@/utils/dateRangePresets';
import styles from './DateRangePicker.module.css';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

// Preset options - defined outside component to prevent re-creation on every render
const PRESETS: readonly DateRangePreset[] = ['all', '7d', '30d', '90d', '6m', '1y'];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | null>(dateRange.start);
  const [customEnd, setCustomEnd] = useState<Date | null>(dateRange.end);
  const [error, setError] = useState<string | null>(null);

  // Check for reduced motion preference once on mount (not on every render)
  const [prefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update custom dates when dateRange changes externally
  useEffect(() => {
    if (dateRange.preset === 'custom') {
      setCustomStart(dateRange.start);
      setCustomEnd(dateRange.end);
    }
  }, [dateRange]);

  // Focus management when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Focus first preset button after dropdown renders
      const timeoutId = setTimeout(() => {
        const firstButton = dropdownRef.current?.querySelector('[role="menuitem"]') as HTMLButtonElement;
        firstButton?.focus();
      }, 100);

      // Clean up timeout if component unmounts or dropdown closes before timeout fires
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isOpen]);

  // Keyboard navigation for trigger button
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      triggerButtonRef.current?.focus();
    }
  };

  // Keyboard navigation for preset buttons
  const handlePresetKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % PRESETS.length;
      const nextButton = dropdownRef.current?.querySelectorAll('[role="menuitem"]')[nextIndex] as HTMLButtonElement;
      nextButton?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + PRESETS.length) % PRESETS.length;
      const prevButton = dropdownRef.current?.querySelectorAll('[role="menuitem"]')[prevIndex] as HTMLButtonElement;
      prevButton?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerButtonRef.current?.focus();
    } else if (e.key === 'Tab') {
      // Allow Tab to move to custom range section
      if (e.shiftKey && currentIndex === 0) {
        e.preventDefault();
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    }
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    const { start, end } = getDateRangeFromPreset(preset);
    onDateRangeChange({ start, end, preset });
    setError(null);
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleApplyCustomRange = () => {
    // Validate dates
    if (customStart && customEnd && customStart > customEnd) {
      setError('Start date must be before end date');
      return;
    }

    // Prevent future dates
    const now = new Date();
    if ((customStart && customStart > now) || (customEnd && customEnd > now)) {
      setError('Cannot select future dates');
      return;
    }

    setError(null);
    onDateRangeChange({
      start: customStart,
      end: customEnd,
      preset: 'custom',
    });
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const isActiveFilter = dateRange.preset !== 'all';

  // Button label - show actual dates for custom range
  const buttonLabel = useMemo(() => {
    if (dateRange.preset === 'custom' && dateRange.start && dateRange.end) {
      const startStr = dateRange.start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const endStr = dateRange.end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${startStr} - ${endStr}`;
    }
    return getPresetLabel(dateRange.preset);
  }, [dateRange]);

  // ARIA label for trigger button
  const triggerAriaLabel = useMemo(() => {
    return `Filter by date range, currently set to ${buttonLabel}`;
  }, [buttonLabel]);

  // Animation duration based on user's motion preference
  const animationDuration = prefersReducedMotion ? 0 : 0.2;

  return (
    <div className={`relative z-10 ${styles.dateRangePicker}`} ref={dropdownRef}>
      <button
        ref={triggerButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        className={`flex items-center gap-2 px-4 py-2.5 sm:py-2 text-sm rounded-lg transition-colors duration-200 border backdrop-blur-sm w-full sm:w-auto sm:min-w-[160px] sm:max-w-[280px] justify-between ${
          isActiveFilter
            ? 'bg-warm-peach/10 hover:bg-warm-peach/20 border-warm-peach text-warm-peach'
            : 'bg-warm-hover hover:bg-warm-card border-warm-border text-white'
        }`}
        aria-label={triggerAriaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex items-center gap-2 min-w-0">
          <HiCalendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{buttonLabel}</span>
        </div>
        <HiOutlineChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: animationDuration }}
            className="absolute left-0 sm:right-0 top-full mt-2 w-full sm:w-80 py-3 bg-warm-card rounded-lg shadow-lg border border-warm-border backdrop-blur-sm"
            role="menu"
            aria-label="Date range filter options"
          >
            {/* Preset Buttons */}
            <div className="px-3 space-y-1">
              {PRESETS.map((preset, index) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  onKeyDown={(e) => handlePresetKeyDown(e, index)}
                  role="menuitem"
                  aria-label={`${getPresetLabel(preset)} preset${dateRange.preset === preset ? ', selected' : ''}`}
                  className={`w-full text-left px-3 py-2.5 sm:py-2 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                    dateRange.preset === preset
                      ? 'bg-warm-peach text-white'
                      : 'text-white hover:bg-warm-hover'
                  }`}
                >
                  <span>{getPresetLabel(preset)}</span>
                  {dateRange.preset === preset && <HiCheck className="w-5 h-5 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* Clear Filter Button (only shown when filter is active) */}
            {isActiveFilter && (
              <>
                <div className="my-3 border-t border-warm-border" />
                <div className="px-3">
                  <button
                    onClick={() => {
                      handlePresetClick('all');
                    }}
                    role="menuitem"
                    className="w-full text-left px-3 py-2 text-warm-peach hover:bg-warm-hover rounded-lg transition-colors flex items-center gap-2"
                    aria-label="Clear date filter"
                  >
                    <HiX className="w-4 h-4" />
                    Clear Date Filter
                  </button>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="my-3 border-t border-warm-border" />

            {/* Custom Date Range */}
            <div className="px-3">
              <div className="text-warm-gray text-sm mb-2 font-medium">Custom Range</div>
              <div className="space-y-2">
                <div>
                  <label
                    id="start-date-label"
                    htmlFor="start-date-input"
                    className="text-xs text-warm-gray block mb-1"
                  >
                    Start Date
                  </label>
                  <DatePicker
                    id="start-date-input"
                    selected={customStart}
                    onChange={(date: Date | null) => {
                      setCustomStart(date);
                      setError(null);
                    }}
                    maxDate={new Date()}
                    dateFormat="MMM d, yyyy"
                    className="w-full px-3 py-2 bg-warm-hover border border-warm-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-warm-peach"
                    placeholderText="Select start date"
                    aria-labelledby="start-date-label"
                    aria-describedby="start-date-help"
                    {...({ calendarClassName: styles.customCalendar } as any)}
                  />
                  <span id="start-date-help" className="sr-only">
                    Use arrow keys to navigate calendar. Enter to select. Escape to close. Future dates are not allowed.
                  </span>
                </div>
                <div>
                  <label
                    id="end-date-label"
                    htmlFor="end-date-input"
                    className="text-xs text-warm-gray block mb-1"
                  >
                    End Date
                  </label>
                  <DatePicker
                    id="end-date-input"
                    selected={customEnd}
                    onChange={(date: Date | null) => {
                      setCustomEnd(date);
                      setError(null);
                    }}
                    minDate={customStart || undefined}
                    maxDate={new Date()}
                    dateFormat="MMM d, yyyy"
                    className="w-full px-3 py-2 bg-warm-hover border border-warm-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-warm-peach"
                    placeholderText="Select end date"
                    aria-labelledby="end-date-label"
                    aria-describedby="end-date-help"
                    {...({ calendarClassName: styles.customCalendar } as any)}
                  />
                  <span id="end-date-help" className="sr-only">
                    Use arrow keys to navigate calendar. Enter to select. Escape to close. Must be after start date. Future dates are not allowed.
                  </span>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="px-3 py-2 bg-warm-peach/10 border border-warm-peach/30 rounded-lg text-warm-peach text-sm flex items-start gap-2"
                  >
                    <HiX className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleApplyCustomRange}
                  disabled={!customStart || !customEnd}
                  className="w-full px-3 py-2 mt-2 bg-warm-peach hover:bg-warm-peach/90 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  aria-label="Apply custom date range"
                >
                  Apply Custom Range
                </button>
              </div>
            </div>

            {/* Screen reader announcement for date changes */}
            <div
              className="sr-only"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {isActiveFilter ? `Date filter applied: ${buttonLabel}` : 'Date filter cleared'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;
