'use client'

import React from 'react'
import { EXECUTION_FLOW } from '@/lib/flows'
import StageNode from '../create/StageNode'
import { StageStatus } from '@/lib/types'

interface ContractDiagramProps {
  contract: any
  currentStage: number
}

export default function ContractDiagram({ contract, currentStage }: ContractDiagramProps) {
  const stages = EXECUTION_FLOW

  const getStageStatus = (index: number): StageStatus => {
    if (index < currentStage) return 'completed'
    if (index === currentStage) return 'active'
    return 'pending'
  }

  const getProgress = () => {
    return ((currentStage + 1) / stages.length) * 100
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-160px)] bg-gray-800/30 rounded-xl backdrop-blur-sm border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-[#4299e1]/10 to-[#2b6cb0]/10 flex-shrink-0">
        <h2 className="text-white font-mono font-medium text-sm">Contract Execution</h2>
        <p className="text-gray-300 text-xs font-mono mt-1">
          Track your contract progress
        </p>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400 font-mono">
            Step {currentStage + 1}
          </span>
          <span className="text-xs text-gray-400 font-mono">{stages.length} Steps</span>
        </div>
        <div className="mt-1 text-center">
          <span className="text-xs text-[#4299e1] font-mono">
            {getProgress().toFixed(1)}% Complete
          </span>
        </div>
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
            />
          ))}
        </div>
      </div>

      {/* Contract Info */}
      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between text-gray-400">
            <span>Status:</span>
            <span className="text-[#4299e1]">{contract.currentStage || stages[currentStage]}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Signatures:</span>
            <span className={contract.signatures?.bothSigned ? 'text-green-400' : 'text-amber-400'}>
              {contract.signatures?.bothSigned ? 'Complete ✓' : 'Pending'}
            </span>
          </div>
          {contract.escrow?.deposit?.deposited && (
            <div className="flex justify-between text-gray-400">
              <span>Escrow:</span>
              <span className="text-green-400">Deposited ✓</span>
            </div>
          )}
          {contract.milestones?.[0]?.deliverable?.submitted && (
            <div className="flex justify-between text-gray-400">
              <span>Deliverable:</span>
              <span className="text-green-400">Submitted ✓</span>
            </div>
          )}
          {contract.milestones?.[0]?.verification?.agentVerified && (
            <div className="flex justify-between text-gray-400">
              <span>Verification:</span>
              <span className="text-green-400">Verified ✓</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
