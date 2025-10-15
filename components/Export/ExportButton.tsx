/**
 * Export Button Component
 * Button to trigger the export modal
 */

import React from 'react';
import { HiDownload } from 'react-icons/hi';

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ExportButton({ onClick, disabled = false }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-white hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Export Dashboard"
    >
      <HiDownload className="w-4 h-4" />
      <span className="hidden sm:inline">Export</span>
    </button>
  );
}
