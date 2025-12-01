/**
 * Mobile Controls FAB (Floating Action Button)
 * A floating button that opens the mobile controls bottom sheet
 * Only visible on mobile devices (below sm: breakpoint)
 * Respects reduced motion preferences
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HiAdjustments } from 'react-icons/hi';
import { trackMobile } from '@/utils/analytics';

interface MobileControlsFABProps {
  onClick: () => void;
  hasActiveFilters: boolean;
}

export default function MobileControlsFAB({
  onClick,
  hasActiveFilters,
}: MobileControlsFABProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleClick = () => {
    trackMobile('fab_open');
    onClick();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-haspopup="dialog"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-warm-peach rounded-full shadow-lg flex items-center justify-center sm:hidden focus:outline-none focus:ring-2 focus:ring-warm-peach focus:ring-offset-2 focus:ring-offset-warm-black"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 400, damping: 25 }
      }
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      aria-label={
        hasActiveFilters
          ? 'Open filter controls (filters active)'
          : 'Open filter controls'
      }
    >
      <HiAdjustments className="w-6 h-6 text-white" />

      {/* Active filter indicator dot - larger for visibility */}
      {hasActiveFilters && (
        <motion.span
          className="absolute -top-1 -right-1 w-4 h-4 bg-warm-sage rounded-full border-2 border-warm-black"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 500, damping: 25 }
          }
        />
      )}
    </motion.button>
  );
}
