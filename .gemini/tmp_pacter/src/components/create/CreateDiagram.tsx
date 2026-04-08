"use client";

import React from 'react';
import { CreateDiagramProps, StageStatus, GraphState } from '@/lib/types';
import { FLOW_METADATA } from '@/lib/flows';
import StageNode from './StageNode';

interface EnhancedCreateDiagramProps extends CreateDiagramProps {
  graphState?: GraphState;
  contractProgress?: number;
}

export default function CreateDiagram({ 
  flowType, 
  currentStage, 
  onStageClick,
  graphState,
  contractProgress 
}: EnhancedCreateDiagramProps) {
  
  const flowData = FLOW_METADATA[flowType];
  const stages = flowData.stages;
  const descriptions = flowData.stageDescriptions;

  const getStageStatus = (index: number): StageStatus => {
    // Use graph state information if available
    if (graphState && graphState.stageIndex !== undefined) {
      const graphStageIndex = graphState.stageIndex;
      
      if (index < graphStageIndex) return 'completed';
      if (index === graphStageIndex) {
        // Check if current stage is complete based on graph state
        return graphState.isStageComplete ? 'completed' : 'active';
      }
      return 'pending';
    }
    
    // Fallback to original logic
    if (index < currentStage) return 'completed';
    if (index === currentStage) return 'active';
    return 'pending';
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-160px)] bg-gray-800/30 rounded-xl backdrop-blur-sm border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-[#4299e1]/10 to-[#2b6cb0]/10 flex-shrink-0">
        <h2 className="text-white font-mono font-medium text-sm">Contract Flow</h2>
        <p className="text-gray-300 text-xs font-mono mt-1">
          {flowType === 'execution' ? 'Contract Execution Process' : 'Information Collection Process'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] h-1.5 rounded-full transition-all duration-500"
            style={{ 
              width: `${contractProgress !== undefined 
                ? contractProgress 
                : (currentStage / stages.length) * 100}%` 
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400 font-mono">
            Step {graphState?.stageIndex !== undefined ? graphState.stageIndex + 1 : currentStage + 1}
          </span>
          <span className="text-xs text-gray-400 font-mono">{stages.length} Steps</span>
        </div>
        {contractProgress !== undefined && (
          <div className="mt-1 text-center">
            <span className="text-xs text-[#4299e1] font-mono">
              {contractProgress.toFixed(1)}% Complete
            </span>
          </div>
        )}
      </div>

      {/* Stages */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <StageNode
              key={stage}
              stage={stage}
              status={getStageStatus(index)}
              index={index}
              isLast={index === stages.length - 1}
              description={descriptions?.[stage]}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-gray-700 flex justify-between items-center flex-shrink-0">
        <button
          onClick={() => onStageClick?.(Math.max(currentStage - 1, 0))}
          disabled={currentStage <= 0}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-mono text-xs transition-colors"
        >
          Previous
        </button>
        
        <div className="text-xs text-gray-400 font-mono">
          {currentStage + 1} of {stages.length}
        </div>
        
        <button
          onClick={() => onStageClick?.(Math.min(currentStage + 1, stages.length - 1))}
          disabled={currentStage >= stages.length - 1}
          className="px-3 py-1.5 bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-mono text-xs transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );
}