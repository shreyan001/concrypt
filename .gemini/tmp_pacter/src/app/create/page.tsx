"use client";

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import CreateChat from '@/components/create/CreateChat';
import CreateDiagram from '@/components/create/CreateDiagram';
import { FlowType, GraphState } from '@/lib/types';

export default function CreatePage() {
  const [flowType, setFlowType] = useState<FlowType>("info");
  const [currentStage, setCurrentStage] = useState(0);
  const [stageData, setStageData] = useState<Record<string, any>>({});
  const [graphState, setGraphState] = useState<GraphState | undefined>(undefined);
  const [contractProgress, setContractProgress] = useState<number | undefined>(undefined);

  const handleStageDataUpdate = (data: any) => {
    setStageData(prev => ({ ...prev, ...data }));
  };

  const handleGraphStateUpdate = async (newGraphState: GraphState, progress: number) => {
    setGraphState(newGraphState);
    setContractProgress(progress);
    
    // Contract generation now happens inline in CreateChat component
    // No redirect needed - everything stays in the chat interface
  };

  const handleStageClick = (stageIndex: number) => {
    // Allow navigation to previous stages only
    if (stageIndex <= currentStage) {
      setCurrentStage(stageIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-800">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <div className="flex w-full max-w-7xl gap-8 items-center">
          {/* Chat Panel - Left Side */}
          <div className="flex-1 min-w-0">
            <CreateChat 
              flowType={flowType}
              currentStage={currentStage}
              setCurrentStage={setCurrentStage}

              onStageDataUpdate={(data) => setStageData(data)}
              onGraphStateUpdate={handleGraphStateUpdate}
            />
          </div>
          
          {/* Diagram Panel - Right Side */}
          <div className="w-80 flex-shrink-0">
            <CreateDiagram 
              flowType={flowType}
              currentStage={currentStage}
              onStageClick={handleStageClick}
              graphState={graphState}
              contractProgress={contractProgress}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-8 py-3 bg-slate-900/60 border-t border-slate-700/50 backdrop-blur-sm">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono max-w-7xl mx-auto">
          <span>Current Flow: {flowType === 'info' ? 'Information Collection' : 'Contract Execution'}</span>
          <span>Stage: {currentStage + 1} | Data: {Object.keys(stageData).length} items</span>
          <span>Pakt v1.0 | Legal + Smart Contract Escrow</span>
        </div>
      </div>
    </div>
  );
}