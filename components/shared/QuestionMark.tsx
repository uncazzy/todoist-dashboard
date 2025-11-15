import React, { memo } from 'react';
import { BsQuestionCircle } from 'react-icons/bs';

interface QuestionMarkProps {
  content: string;
}

const QuestionMark: React.FC<QuestionMarkProps> = memo(({ content }) => (
  <BsQuestionCircle
    className="inline-block ml-2 text-warm-gray hover:text-white cursor-help"
    data-tooltip-id="dashboard-tooltip"
    data-tooltip-content={content}
  />
));

QuestionMark.displayName = 'QuestionMark';

export default QuestionMark;
