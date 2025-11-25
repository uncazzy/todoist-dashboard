/**
 * Mobile Controls Bottom Sheet
 * A slide-up sheet containing dashboard filter controls
 * Features swipe-to-close gesture, spring animations, and full accessibility support
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo, useReducedMotion } from 'framer-motion';
import { HiX } from 'react-icons/hi';

interface MobileControlsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function MobileControlsSheet({
  isOpen,
  onClose,
  children,
}: MobileControlsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Create animation variants based on reduced motion preference
  const sheetVariants = useMemo(
    () => ({
      hidden: { y: '100%' },
      visible: {
        y: 0,
        transition: shouldReduceMotion
          ? { duration: 0 }
          : { type: 'spring', damping: 30, stiffness: 300 },
      },
      exit: {
        y: '100%',
        transition: shouldReduceMotion
          ? { duration: 0 }
          : { type: 'spring', damping: 30, stiffness: 300 },
      },
    }),
    [shouldReduceMotion]
  );

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management and body scroll lock
  useEffect(() => {
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    let previousOverflow = '';

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus the close button after animation
      focusTimer = setTimeout(() => {
        const closeButton = sheetRef.current?.querySelector<HTMLElement>(
          '[data-close-button]'
        );
        closeButton?.focus();
      }, 100);
    } else {
      previousFocusRef.current?.focus();
    }

    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      if (isOpen) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [isOpen]);

  // Focus trap - keep Tab navigation within the sheet
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (!focusables || focusables.length <= 1) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!first || !last) return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Handle drag end for swipe-to-close
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged down more than 100px or with high velocity
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 sm:hidden"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] bg-warm-card rounded-t-2xl border border-warm-border border-b-0 shadow-2xl flex flex-col sm:hidden"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-controls-title"
          >
            {/* Header with Title + Close Button */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
              <h2
                id="mobile-controls-title"
                className="text-base font-semibold text-white"
              >
                Filters & Actions
              </h2>
              <button
                data-close-button
                onClick={onClose}
                className="p-2 -mr-2 text-warm-gray hover:text-white rounded-lg hover:bg-warm-hover transition-colors focus:outline-none focus:ring-2 focus:ring-warm-peach focus:ring-offset-2 focus:ring-offset-warm-card"
                aria-label="Close"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            {/* Drag Handle - decorative only */}
            <div
              className="py-2 cursor-grab active:cursor-grabbing flex-shrink-0"
              aria-hidden="true"
            >
              <div className="w-10 h-1 bg-warm-border rounded-full mx-auto" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
