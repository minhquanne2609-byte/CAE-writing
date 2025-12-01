import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <Info
        className="w-4 h-4 text-teal-600 cursor-pointer hover:text-teal-800 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div className="absolute z-50 w-64 p-2 mt-2 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-xl -left-28 bottom-full mb-2">
          {content}
          <div className="absolute w-2 h-2 bg-slate-800 rotate-45 -bottom-1 left-1/2 transform -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};
