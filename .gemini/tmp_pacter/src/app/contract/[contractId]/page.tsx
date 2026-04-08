'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Navbar from '@/components/layout/Navbar'
import ContractChat from '@/components/contract/ContractChat'
import ContractDiagram from '@/components/contract/ContractDiagram'
import { Loader2 } from 'lucide-react'

export default function ContractPage() {
  const router = useRouter()
  const params = useParams()
  const { address, isConnected } = useAccount()
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStage, setCurrentStage] = useState(0)

  const contractId = params.contractId as string

  useEffect(() => {
    fetchContract()
    
    // Auto-refresh every 10 seconds to keep diagram updated (without loading state)
    const interval = setInterval(() => {
      console.log('Auto-refreshing contract data...')
      fetchContract(false) // Don't show loading spinner during auto-refresh
    }, 10000) // 10 seconds
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId])

  const fetchContract = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const response = await fetch(`/api/contracts?id=${contractId}`)
      
      if (!response.ok) {
        throw new Error('Contract not found')
      }

      const data = await response.json()
      setContract(data)
      
      // Set current stage based on contract status
      // EXECUTION_FLOW: ["Signatures Pending", "Escrow Deposited", "Work in Progress", "Submission", "Review", "Payment Approved", "Contract Completed"]
      let mappedStage = 0
      
      // Determine stage based on contract state and milestone data
      if (!data.signatures?.bothSigned) {
        // Step 0: Signatures Pending
        mappedStage = 0
      } else if (data.signatures?.bothSigned && !data.escrow?.deposit?.deposited) {
        // Step 1: Signatures complete, awaiting deposit
        mappedStage = 1
      } else if (data.escrow?.deposit?.deposited && !data.milestones?.[0]?.deliverable?.submitted) {
        // Step 2: Work in Progress (deposit complete, awaiting submission)
        mappedStage = 2
      } else if (data.milestones?.[0]?.deliverable?.submitted && !data.milestones?.[0]?.verification?.agentVerified) {
        // Step 3: Submission (AI Verification in progress)
        mappedStage = 3
      } else if (data.milestones?.[0]?.verification?.agentVerified && !data.milestones?.[0]?.payment?.approved) {
        // Step 4: Review (Client reviewing deliverable)
        mappedStage = 4
      } else if (data.milestones?.[0]?.payment?.approved && !data.milestones?.[0]?.payment?.released) {
        // Step 5: Payment Approved (awaiting withdrawal)
        mappedStage = 5
      } else if (data.milestones?.[0]?.payment?.released) {
        // Step 6: Contract Completed
        mappedStage = 6
      }
      
      console.log('Contract stage mapping:', { 
        currentStage: data.currentStage, 
        mappedStage,
        depositStatus: data.escrow?.deposit?.deposited,
        bothSigned: data.signatures?.bothSigned,
        deliverableSubmitted: data.milestones?.[0]?.deliverable?.submitted,
        agentVerified: data.milestones?.[0]?.verification?.agentVerified,
        paymentApproved: data.milestones?.[0]?.payment?.approved,
        paymentReleased: data.milestones?.[0]?.payment?.released
      })
      setCurrentStage(mappedStage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  const handleContractUpdate = () => {
    fetchContract(false) // Update without loading spinner
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-slate-300 font-mono text-sm">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-800">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
          <div className="max-w-md text-center p-8 bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-600/50">
            <p className="text-red-400 mb-4 font-mono text-sm">{error || 'Contract not found'}</p>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] text-white rounded-lg font-mono text-sm hover:opacity-90 transition-opacity"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-800">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <div className="flex w-full max-w-7xl gap-8 items-center">
          {/* Chat Panel - Left Side */}
          <div className="flex-1 min-w-0">
            <ContractChat 
              contract={contract}
              currentStage={currentStage}
              onContractUpdate={handleContractUpdate}
            />
          </div>
          
          {/* Diagram Panel - Right Side */}
          <div className="w-80 flex-shrink-0">
            <ContractDiagram 
              contract={contract}
              currentStage={currentStage}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-8 py-3 bg-slate-900/60 border-t border-slate-700/50 backdrop-blur-sm">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono max-w-7xl mx-auto">
          <span>Contract: {contract.name}</span>
          <span>Status: {contract.currentStage}</span>
          <span>Pakt v1.0 | Contract Execution</span>
        </div>
      </div>
    </div>
  )
}