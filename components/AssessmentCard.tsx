
import React from 'react';
import { SubscaleDefinition, FeedbackDetail } from '../types';
import { MessageSquareQuote, CheckCircle, AlertCircle } from 'lucide-react';

interface AssessmentCardProps {
  scale: SubscaleDefinition;
  value: number;
  onChange: (value: number) => void;
  aiFeedback?: FeedbackDetail;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({ scale, value, onChange, aiFeedback }) => {
  const getDescriptorForBand = (band: number) => {
    // Exact match
    const exact = scale.descriptors.find(d => d.band === band);
    if (exact) return exact;

    // Interpolated descriptions (2 and 4 share features of adjacent bands)
    if (band === 4) {
      return {
        band: 4,
        summary: 'Performance shares features of Bands 3 and 5.',
        details: ['Candidate demonstrates performance between Band 3 and Band 5.']
      };
    }
    if (band === 2) {
      return {
        band: 2,
        summary: 'Performance shares features of Bands 1 and 3.',
        details: ['Candidate demonstrates performance between Band 1 and Band 3.']
      };
    }
    return { band: 0, summary: 'Performance below Band 1.', details: [] };
  };

  const currentDescriptor = getDescriptorForBand(value);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{scale.name}</h3>
          <p className="text-sm text-slate-500">{scale.description}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-sm transition-colors duration-500 ${aiFeedback ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-teal-600 text-white'}`}>
          {value}
        </div>
      </div>

      <div className="p-6">
        <input
          type="range"
          min="0"
          max="5"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 mb-6"
        />
        <div className="flex justify-between text-xs text-slate-400 font-mono mb-4 px-1">
          <span>0</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>

        {aiFeedback && (
          <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-lg overflow-hidden">
            <div className="p-3 bg-indigo-100/50 border-b border-indigo-100 flex items-center gap-2">
               <MessageSquareQuote className="w-4 h-4 text-indigo-700" />
               <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Examiner Feedback</span>
            </div>
            
            <div className="p-4 space-y-4">
               <div>
                 <p className="text-sm text-indigo-900 leading-relaxed italic mb-3">"{aiFeedback.summary}"</p>
               </div>
               
               {aiFeedback.strengths.length > 0 && (
                 <div>
                   <h5 className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center">
                     <CheckCircle className="w-3 h-3 mr-1" /> Strengths
                   </h5>
                   <ul className="space-y-1">
                     {aiFeedback.strengths.map((str, i) => (
                       <li key={i} className="text-sm text-slate-700 flex items-start">
                         <span className="mr-2 text-green-500">•</span>
                         {str}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}

               {aiFeedback.weaknesses.length > 0 && (
                 <div>
                   <h5 className="text-xs font-bold text-rose-700 uppercase mb-2 flex items-center">
                     <AlertCircle className="w-3 h-3 mr-1" /> Improvements
                   </h5>
                   <ul className="space-y-1">
                     {aiFeedback.weaknesses.map((weak, i) => (
                       <li key={i} className="text-sm text-slate-700 flex items-start">
                         <span className="mr-2 text-rose-500">•</span>
                         {weak}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
            </div>
          </div>
        )}

        <div className="bg-teal-50 rounded-lg p-4 border border-teal-100 transition-all duration-300">
          <h4 className="font-semibold text-teal-900 mb-2 flex items-center">
            <span className="bg-teal-200 text-teal-800 text-xs px-2 py-0.5 rounded mr-2">Band {currentDescriptor.band} Criteria</span>
            <span className="text-sm">{currentDescriptor.summary}</span>
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {currentDescriptor.details.map((detail, idx) => (
              <li key={idx} className="text-sm text-teal-800 leading-relaxed">{detail}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
