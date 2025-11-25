/**
 * Visibility Button Component
 * Eye icon button to trigger the visibility customization modal
 */

import React from 'react';
import { HiEye } from 'react-icons/hi';

interface VisibilityButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function VisibilityButton({ onClick, disabled = false }: VisibilityButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-warm-hover border border-warm-border rounded-lg hover:bg-warm-card hover:border-warm-peach focus:outline-none focus:ring-2 focus:ring-warm-peach focus:ring-offset-2 focus:ring-offset-warm-black transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
      aria-label="Customize Dashboard"
    >
      <HiEye className="w-4 h-4" />
      <span>Customize</span>
    </button>
  );
}
