'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAccount } from 'wagmi'
import ContractDisplay from './ContractDisplay'
import ContractSignatures from './ContractSignatures'
import ClientView from './ClientView'
import FreelancerView from './FreelancerView'

interface ContractChatProps {
  contract: any
  currentStage: number
  onContractUpdate: () => void
}

export default function ContractChat({ 
  contract, 
  currentStage,
  onContractUpdate 
}: ContractChatProps) {
  const { address, isConnected } = useAccount()
  const contractScrollRef = useRef<HTMLDivElement>(null)
  const [showFullContract, setShowFullContract] = useState(false)

  const isClient = address?.toLowerCase() === contract.parties.client.walletAddress.toLowerCase()
  const isFreelancer = address?.toLowerCase() === contract.parties.freelancer.walletAddress?.toLowerCase()
  const bothSigned = contract.signatures.bothSigned

  const getCurrentPrompt = () => {
    if (!bothSigned) {
      return 'Contract signatures required from both parties'
    }
    
    const prompts: Record<string, string> = {
      'Signatures Pending': 'Waiting for signatures from both parties',
      'Awaiting Deposit': 'Client needs to deposit funds into escrow',
      'Escrow Deposited': 'Funds secured. Work can begin.',
      'Work in Progress': 'Freelancer is working on deliverables',
      'Submission': 'Freelancer has submitted work for review',
      'Review': 'Client is reviewing the submitted work',
      'Milestone Released': 'Payment released to freelancer',
      'Contract Closed': 'Contract completed successfully'
    }

    return prompts[contract.currentStage] || 'Contract in progress'
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-600/50">
      {/* Current Status Card */}
      <div className="p-3.5 border-b border-slate-600/50 bg-gradient-to-r from-emerald-500/15 to-teal-600/15 flex-shrink-0">
        <div className="flex items-start space-x-2.5">
          <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-mono">📄</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-mono font-medium text-sm">
                {contract.name}
              </h3>
              <span className="text-emerald-400 text-xs font-mono">
                {contract.currentStage}
              </span>
            </div>
            <p className="text-slate-300 text-xs font-mono mb-2">
              {getCurrentPrompt()}
            </p>
            
            <div className="flex items-center justify-between">
              {isConnected && (
                <div className="text-xs font-mono">
                  {isClient && <span className="text-blue-400">You are the Client</span>}
                  {isFreelancer && <span className="text-purple-400">You are the Freelancer</span>}
                  {!isClient && !isFreelancer && <span className="text-amber-400">You are viewing this contract</span>}
                </div>
              )}
              {bothSigned && (
                <button
                  onClick={() => setShowFullContract(!showFullContract)}
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-mono"
                >
                  {showFullContract ? 'Hide' : 'View'} Contract Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!isConnected ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 text-center max-w-md">
            <div className="mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#4299e1] to-[#3182ce] rounded-full mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-xs font-mono font-bold text-white mb-2">Connect Your Wallet</p>
              <p className="text-gray-300 text-xs font-mono leading-relaxed">
                Please connect your wallet to interact with this contract.
              </p>
            </div>
          </div>
        </div>
      ) : bothSigned ? (
        /* After Both Signatures - Show Only Role-Based View */
        <div className="flex-1 overflow-y-auto p-3 min-h-0" ref={contractScrollRef}>
          {/* Optional Contract Details (collapsible) */}
          {showFullContract && (
            <div className="mb-4 bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-slate-200 font-mono text-sm font-semibold">Contract Details</h4>
                <button
                  onClick={() => setShowFullContract(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              </div>
              <ContractDisplay contract={contract} />
            </div>
          )}

          {/* Main Role-Based View */}
          {isClient && <ClientView contract={contract} onContractUpdate={onContractUpdate} />}
          {isFreelancer && <FreelancerView contract={contract} onContractUpdate={onContractUpdate} />}
          {!isClient && !isFreelancer && (
            <div className="flex items-center justify-center h-full">
              <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 text-center max-w-md">
                <p className="text-xs font-mono text-slate-300">
                  You are not a party to this contract. Only the client and freelancer can perform actions.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Before Signatures - Show Contract Details + Signatures */
        <>
          {/* Scrollable Contract Details */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0" ref={contractScrollRef}>
            <ContractDisplay contract={contract} />
          </div>

          {/* Fixed Signatures Section at Bottom */}
          <div className="border-t border-slate-600/50 p-3 flex-shrink-0 bg-slate-800/60">
            <ContractSignatures 
              contract={contract} 
              onSignaturesComplete={onContractUpdate}
            />
          </div>
        </>
      )}
    </div>
  )
}
