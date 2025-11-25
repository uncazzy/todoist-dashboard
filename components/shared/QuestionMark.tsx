import React, { memo } from 'react';
import { BsQuestionCircle } from 'react-icons/bs';

interface QuestionMarkProps {
  content: string;
  tooltipId?: string;
}

/**
 * QuestionMark component - displays a help icon with tooltip
 * Clickable on mobile for better UX (touch devices can tap to see tooltip)
 */
const QuestionMark: React.FC<QuestionMarkProps> = memo(({ content, tooltipId = 'dashboard-tooltip' }) => (
  <button
    type="button"
    className="inline-flex items-center justify-center ml-2 text-warm-gray hover:text-white cursor-help focus:outline-none focus:text-white"
    data-tooltip-id={tooltipId}
    data-tooltip-content={content}
    aria-label={content}
  >
    <BsQuestionCircle className="w-4 h-4" />
  </button>
));

QuestionMark.displayName = 'QuestionMark';

export default QuestionMark;
