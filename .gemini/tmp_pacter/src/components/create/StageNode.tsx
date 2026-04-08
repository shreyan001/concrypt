"use client";

import React from 'react';
import { StageNodeProps } from '@/lib/types';

export default function StageNode({ 
  stage, 
  status, 
  index, 
  isLast = false,
  description
}: StageNodeProps) {
  
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] border-[#2b6cb0]',
          text: 'text-[#4299e1]',
          icon: '✓'
        };
      case 'active':
        return {
          circle: 'bg-gradient-to-r from-yellow-400 to-orange-500 border-yellow-400 shadow-lg shadow-yellow-400/50',
          text: 'text-yellow-400',
          icon: '●'
        };
      case 'pending':
      default:
        return {
          circle: 'bg-gray-600 border-gray-500 border-dashed',
          text: 'text-gray-400',
          icon: '○'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="relative flex items-start space-x-3">
      {/* Stage Circle */}
      <div className={`
        relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0
        ${status === 'completed'
          ? 'bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] border-[#4299e1]' 
          : status === 'active'
            ? 'bg-gray-800 border-[#4299e1] ring-2 ring-[#4299e1]/30' 
            : 'bg-gray-800 border-gray-600'
        }
      `}>
        {status === 'completed' ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <span className={`text-xs font-mono font-medium ${
            status === 'active' ? 'text-[#4299e1]' : 'text-gray-400'
          }`}>
            {index + 1}
          </span>
        )}
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div className={`
          absolute left-3 top-6 w-0.5 h-6 -translate-x-0.5
          ${status === 'completed' ? 'bg-gradient-to-b from-[#4299e1] to-[#2b6cb0]' : 'bg-gray-600'}
        `} />
      )}

      {/* Stage Content */}
      <div className="flex-1 min-w-0 pb-3">
        <h3 className={`text-sm font-mono font-medium ${
          status === 'active' ? 'text-white' : status === 'completed' ? 'text-gray-200' : 'text-gray-400'
        }`}>
          {stage}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-gray-500 font-mono leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Status Badge */}
        <div className="mt-2">
          <span className={`
            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono
            ${status === 'completed'
              ? 'bg-green-900/30 text-green-400 border border-green-700' 
              : status === 'active'
                ? 'bg-blue-900/30 text-blue-400 border border-blue-700' 
                : 'bg-gray-800/30 text-gray-500 border border-gray-700'
            }
          `}>
            {status === 'completed' ? 'Completed' : status === 'active' ? 'In Progress' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
}