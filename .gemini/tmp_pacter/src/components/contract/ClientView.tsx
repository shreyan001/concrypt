'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, CheckCircle2, AlertCircle, Loader2, ExternalLink, Download, Clock } from 'lucide-react'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { type Hash } from 'viem'
import { createAndDepositOrder, waitForTransaction, approvePayment } from '@/lib/contracts/paktClient'
import { generateOrderHash } from '@/lib/contracts/orderHash'
import { getCurrentNetwork } from '@/lib/contracts/config'
import {
  fundTimeLockedEscrow,
  startTimeLockedService,
  openTimeLockedArbitration,
  getTimeLockedEscrowSummary,
  waitForTimeLockedReceipt as waitForTimeLockedEscrowReceipt,
  type TimeLockedEscrowSummary,
  DEFAULT_TIMELOCKED_ARBITRATION_ADDRESS,
  DEFAULT_TIMELOCKED_DEFI_VAULT_ADDRESS,
} from '@/lib/contracts/timeLockedEscrowClient'

interface ClientViewProps {
  contract: any
  onContractUpdate?: () => void
}

interface TimeLockedProps {
  contract: any
  onContractUpdate?: () => void
}

function TimeLockedClientView({ contract, onContractUpdate }: TimeLockedProps) {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { address } = useAccount()

  const escrowAddress = contract?.timeLockedEscrow?.contractAddress as `0x${string}` | undefined
  const providerAddress = contract?.timeLockedEscrow?.provider?.walletAddress as string | undefined
  const arbitrationAddress = contract?.timeLockedEscrow?.arbitrationContract ?? DEFAULT_TIMELOCKED_ARBITRATION_ADDRESS
  const vaultAddress = contract?.timeLockedEscrow?.vaultAddress ?? DEFAULT_TIMELOCKED_DEFI_VAULT_ADDRESS

  const [summary, setSummary] = useState<TimeLockedEscrowSummary | null>(null)
  const [fundStatus, setFundStatus] = useState<TxStatus>('idle')
  const [startStatus, setStartStatus] = useState<TxStatus>('idle')
  const [arbitrationStatus, setArbitrationStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<Hash | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isClient = useMemo(() => {
    if (!address || !contract?.timeLockedEscrow?.client) return false
    return address.toLowerCase() === contract.timeLockedEscrow.client.toLowerCase()
  }, [address, contract?.timeLockedEscrow?.client])

  useEffect(() => {
    if (!publicClient || !escrowAddress) {
      setSummary(null)
      return
    }

    let cancelled = false
    async function loadSummary() {
      try {
        const info = await getTimeLockedEscrowSummary(publicClient, escrowAddress)
        if (!cancelled) {
          setSummary(info)
        }
      } catch (err) {
        console.error('Failed to load time-locked summary', err)
        if (!cancelled) {
          setSummary(null)
        }
      }
    }

    loadSummary()
    const interval = setInterval(loadSummary, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [publicClient, escrowAddress, fundStatus, startStatus])

  async function handleFund(amount: string) {
    if (!walletClient || !publicClient || !escrowAddress) {
      setError('Wallet not connected or escrow unavailable')
      return
    }

    setFundStatus('pending')
    setError(null)

    try {
      const hash = await fundTimeLockedEscrow(walletClient, escrowAddress, amount)
      setTxHash(hash)
      setFundStatus('confirming')

      const receipt = await waitForTimeLockedEscrowReceipt(publicClient, hash)
      if (receipt.status !== 'success') {
        throw new Error('Funding transaction reverted')
      }

      setFundStatus('success')
      if (onContractUpdate) onContractUpdate()
    } catch (err: any) {
      console.error('Funding error', err)
      setError(err?.message ?? 'Failed to fund escrow')
      setFundStatus('error')
    }
  }

  async function handleStartService() {
    if (!walletClient || !publicClient || !escrowAddress) {
      setError('Wallet not connected or escrow unavailable')
      return
    }

    setStartStatus('pending')
    setError(null)

    try {
      const hash = await startTimeLockedService(walletClient, escrowAddress)
      setTxHash(hash)
      setStartStatus('confirming')

      const receipt = await waitForTimeLockedEscrowReceipt(publicClient, hash)
      if (receipt.status !== 'success') {
        throw new Error('Start service transaction reverted')
      }

      setStartStatus('success')
      if (onContractUpdate) onContractUpdate()
    } catch (err: any) {
      console.error('Start service error', err)
      setError(err?.message ?? 'Failed to start service')
      setStartStatus('error')
    }
  }

  async function handleArbitration() {
    if (!walletClient || !publicClient || !escrowAddress) {
      setError('Wallet not connected or escrow unavailable')
      return
    }

    setArbitrationStatus('pending')
    setError(null)

    try {
      const hash = await openTimeLockedArbitration(walletClient, escrowAddress)
      setTxHash(hash)
      setArbitrationStatus('confirming')

      const receipt = await waitForTimeLockedEscrowReceipt(publicClient, hash)
      if (receipt.status !== 'success') {
        throw new Error('Arbitration transaction reverted')
      }

      setArbitrationStatus('success')
      if (onContractUpdate) onContractUpdate()
    } catch (err: any) {
      console.error('Arbitration error', err)
      setError(err?.message ?? 'Failed to open arbitration')
      setArbitrationStatus('error')
    }
  }

  if (!isClient) {
    return (
      <Alert className="border-orange-500/50 bg-orange-500/10">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-orange-300 text-sm">
          Connect with the client wallet to manage this time-locked escrow.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4" /> Service Overview
        </h3>
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-300 space-y-2">
          <div className="flex justify-between">
            <span>Provider</span>
            <span>{contract?.timeLockedEscrow?.provider?.name || 'Unknown Provider'}</span>
          </div>
          <div className="flex justify-between">
            <span>Provider Wallet</span>
            <span className="text-indigo-300 break-all">{providerAddress}</span>
          </div>
          <div className="flex justify-between">
            <span>Arbitration Contract</span>
            <a
              href={`https://amoy.polygonscan.com/address/${arbitrationAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-300 hover:text-indigo-200"
            >
              {arbitrationAddress}
            </a>
          </div>
          <div className="flex justify-between">
            <span>Vault Address</span>
            <a
              href={`https://amoy.polygonscan.com/address/${vaultAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-300 hover:text-indigo-200"
            >
              {vaultAddress}
            </a>
          </div>
          <div className="flex justify-between">
            <span>Escrow Contract</span>
            <a
              href={`https://amoy.polygonscan.com/address/${escrowAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-300 hover:text-indigo-200"
            >
              {escrowAddress}
            </a>
          </div>
          {summary && (
            <>
              <div className="flex justify-between">
                <span>Funded Amount</span>
                <span>{summary.fundedAmountFormatted} POL</span>
              </div>
              <div className="flex justify-between">
                <span>Vault Balance</span>
                <span>{summary.vaultBalanceFormatted} POL</span>
              </div>
              <div className="flex justify-between">
                <span>Service Started</span>
                <span>
                  {summary.startTimestamp === BigInt(0)
                    ? 'Not started'
                    : new Date(Number(summary.startTimestamp) * 1000).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {error && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Wallet className="w-4 h-4" /> Fund Escrow
        </h3>
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
          <p className="text-xs text-slate-400">
            Top-up the escrow balance. This mock action funds with 0.25 POL to simulate partial payments.
          </p>
          <Button
            onClick={() => handleFund('0.25')}
            disabled={fundStatus === 'pending' || fundStatus === 'confirming'}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {fundStatus === 'pending' || fundStatus === 'confirming' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {fundStatus === 'pending' ? 'Confirm in wallet...' : 'Awaiting confirmation...'}
              </>
            ) : (
              'Add 0.25 POL to Escrow'
            )}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4" /> Start Service Window
        </h3>
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
          <p className="text-xs text-slate-400">
            Trigger the time-lock countdown once the provider confirms infrastructure readiness.
          </p>
          <Button
            onClick={handleStartService}
            disabled={startStatus === 'pending' || startStatus === 'confirming' || summary?.startTimestamp !== BigInt(0)}
            variant="outline"
            className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
          >
            {summary?.startTimestamp && summary.startTimestamp !== BigInt(0)
              ? 'Service Already Started'
              : startStatus === 'pending' || startStatus === 'confirming'
                ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {startStatus === 'pending' ? 'Confirm in wallet...' : 'Waiting for confirmation...'}
                  </>
                )
                : 'Start Service Clock'}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Escalation
        </h3>
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
          <p className="text-xs text-slate-400">
            Escalate the contract to arbitration if service quality violates the SLA. This invokes the on-chain arbitration contract recorded in the template.
          </p>
          <Button
            onClick={handleArbitration}
            disabled={arbitrationStatus === 'pending' || arbitrationStatus === 'confirming'}
            variant="destructive"
            className="w-full"
          >
            {arbitrationStatus === 'pending' || arbitrationStatus === 'confirming' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {arbitrationStatus === 'pending' ? 'Confirm in wallet...' : 'Submitting arbitration...'}
              </>
            ) : (
              'Open Arbitration Case'
            )}
          </Button>
        </div>
      </section>

      {txHash && (
        <Alert className="border-green-500/50 bg-green-500/10 text-xs">
          Latest transaction: {txHash}
        </Alert>
      )}
    </div>
  )
}

// Simple Alert component inline
const Alert = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative w-full rounded-lg border p-4 ${className}`} role="alert">
    {children}
  </div>
)

const AlertDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
)

type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

export default function ClientView({ contract, onContractUpdate }: ClientViewProps) {
  const isTimeLocked = Boolean(contract?.timeLockedEscrow)

  return (
    <Card className="border-slate-700 bg-slate-800/50 font-mono">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white font-mono">
          <Wallet className="w-5 h-5" />
          {isTimeLocked ? 'Client Dashboard — Time-Locked Service' : 'Client Dashboard'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 font-mono">
        {isTimeLocked ? (
          <TimeLockedClientView contract={contract} onContractUpdate={onContractUpdate} />
        ) : (
          <MilestoneClientView contract={contract} onContractUpdate={onContractUpdate} />
        )}
      </CardContent>
    </Card>
  )
}

function MilestoneClientView({ contract, onContractUpdate }: ClientViewProps) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // Log when component receives updates
  useEffect(() => {
    console.log('📊 ClientView received contract update:', {
      stage: contract?.currentStage,
      depositStatus: contract?.escrow?.deposit?.deposited,
      milestoneStatus: contract?.milestones?.[0]?.status
    })
  }, [contract])

  const [orderHash, setOrderHash] = useState<Hash | null>(null)
  const [isGeneratingHash, setIsGeneratingHash] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'confirming' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<Hash | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingBackend, setIsUpdatingBackend] = useState(false)

  // Check if deposit is already completed
  const isDepositCompleted = contract?.escrow?.deposit?.deposited === true
  const hasOrderHash = contract?.escrow?.deposit?.orderHash || contract?.escrow?.orderHash

  // FOR TESTING: Use small amounts (0.1 POL for ₹1,00,000)
  // In production, use actual contract amounts
  const escrowAmount = '0.1' // 0.1 POL for testing
  const totalAmount = '0.1' // Total 0.1 POL (same as escrowAmount)
  const inrAmount = '100000' // ₹1,00,000 for display

  // Get freelancer address
  const freelancerAddress = contract?.parties?.freelancer?.walletAddress

  // Generate or fetch orderHash on component mount
  useEffect(() => {
    async function initializeOrderHash() {
      // First, try to get existing order hash from contract
      if (hasOrderHash) {
        console.log('Using existing order hash from contract:', hasOrderHash)
        setOrderHash(hasOrderHash as Hash)
        return
      }

      // If no order hash exists and we have the required addresses, generate one
      if (!address || !freelancerAddress) {
        console.log('Waiting for wallet connection...')
        return
      }

      setIsGeneratingHash(true)
      try {
        console.log('Generating new order hash for:', { client: address, freelancer: freelancerAddress })

        // Generate orderHash using the utility function
        const hash = generateOrderHash(address, freelancerAddress as `0x${string}`)
        console.log('Generated order hash:', hash)
        setOrderHash(hash)

        // Update backend with the generated orderHash
        const response = await fetch(`/api/contracts`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contract.id,
            escrow: {
              ...contract.escrow,
              orderHash: hash,
              deposit: {
                ...contract.escrow?.deposit,
                orderHash: hash,
              }
            }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save order hash to backend')
        }

        console.log('Order hash saved to backend successfully')
      } catch (err) {
        console.error('Error generating/saving orderHash:', err)
        setError('Failed to generate order hash')
      } finally {
        setIsGeneratingHash(false)
      }
    }

    initializeOrderHash()
  }, [address, freelancerAddress, hasOrderHash, contract])

  // Handle deposit to smart contract
  async function handleDeposit() {
    if (!walletClient || !publicClient || !orderHash || !freelancerAddress) {
      setError('Wallet not connected or missing order information')
      return
    }

    setIsDepositing(true)
    setDepositStatus('pending')
    setError(null)

    try {
      // Call createAndDepositOrder from PaktClient
      const hash = await createAndDepositOrder(walletClient, {
        orderHash,
        freelancerAddress: freelancerAddress as `0x${string}`,
        escrowAmount: escrowAmount,
        projectName: contract.name || 'Pakt Contract',
      })

      setTxHash(hash)
      setDepositStatus('confirming')

      // Wait for transaction confirmation
      const receipt = await waitForTransaction(publicClient, hash)

      if (receipt.status === 'success') {
        setDepositStatus('success')

        // Update backend with deposit information
        await updateBackendAfterDeposit(hash, orderHash)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Deposit error:', err)
      setError(err.message || 'Failed to deposit funds')
      setDepositStatus('error')
    } finally {
      setIsDepositing(false)
    }
  }

  // Update backend after successful deposit
  async function updateBackendAfterDeposit(transactionHash: Hash, orderHash: Hash) {
    setIsUpdatingBackend(true)
    try {
      console.log('Updating backend after deposit:', {
        contractId: contract.id,
        transactionHash,
        orderHash
      })

      const updateData = {
        id: contract.id,
        currentStage: 'Work in Progress',
        escrow: {
          ...contract.escrow,
          orderHash: orderHash, // Save order hash at escrow level
          deposit: {
            deposited: true,
            depositedAmount: totalAmount,
            depositedAt: new Date().toISOString(),
            transactionHash: transactionHash,
            orderHash: orderHash, // Also save at deposit level
          }
        },
        stageHistory: [
          ...(contract.stageHistory || []),
          {
            stage: 'Escrow Deposited',
            timestamp: new Date().toISOString(),
            triggeredBy: 'client',
            note: `Client deposited ${totalAmount} POL tokens to escrow`,
            transactionHash: transactionHash,
          },
          {
            stage: 'Work in Progress',
            timestamp: new Date().toISOString(),
            triggeredBy: 'system',
            note: 'Freelancer can now begin work on the project',
          }
        ]
      }

      console.log('Sending update to backend:', JSON.stringify(updateData, null, 2))

      const response = await fetch(`/api/contracts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend update failed:', errorText)
        throw new Error('Failed to update backend')
      }

      const result = await response.json()
      console.log('Backend updated successfully:', result)
      console.log('Order hash saved:', orderHash)

      // Reload the page to show updated status
      setTimeout(() => {
        window.location.reload()
      }, 2000) // Wait 2 seconds to show success message

    } catch (err) {
      console.error('Error updating backend:', err)
      // Don't show error to user since deposit was successful
    } finally {
      setIsUpdatingBackend(false)
    }
  }

  // Retry deposit
  function handleRetry() {
    setDepositStatus('idle')
    setError(null)
    setTxHash(null)
  }

  // Get block explorer URL
  const network = getCurrentNetwork()
  const explorerUrl = txHash ? `${network.blockExplorer}/tx/${txHash}` : null

  return (
    <>
      {/* Deposit Status */}
      {isDepositCompleted ? (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">
            Escrow deposit completed successfully!
            {contract.escrow?.deposit?.transactionHash && (
              <a
                href={`${network.blockExplorer}/tx/${contract.escrow.deposit.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1 text-green-300 hover:text-green-200 underline"
              >
                View Transaction <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Deposit Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Deposit Escrow Funds</h3>

            <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Project Payment</span>
                <span className="text-white font-medium">{escrowAmount} POL</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between">
                <span className="text-white font-semibold">Total Deposit</span>
                <span className="text-white font-bold text-lg">{totalAmount} POL</span>
              </div>
            </div>

            {/* INR Equivalent */}
            <div className="text-sm text-slate-400">
              ≈ ₹{parseInt(inrAmount).toLocaleString('en-IN')} INR (Test Amount)
            </div>

            {/* Order Hash Info */}
            {orderHash && (
              <div className="text-xs text-slate-500 break-all">
                Order Hash: {orderHash}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && depositStatus === 'error' && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {depositStatus === 'success' && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-400">
                Deposit successful! Updating contract status...
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-green-300 hover:text-green-200 underline"
                  >
                    View Transaction <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Deposit Button */}
          <div className="space-y-2">
            <Button
              onClick={handleDeposit}
              disabled={isDepositing || isGeneratingHash || !orderHash || !walletClient || depositStatus === 'success'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              size="lg"
            >
              {isGeneratingHash ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing Order...
                </>
              ) : isDepositing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {depositStatus === 'pending' && 'Confirm in Wallet...'}
                  {depositStatus === 'confirming' && 'Confirming Transaction...'}
                </>
              ) : isUpdatingBackend ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Contract...
                </>
              ) : depositStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Deposit Complete
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit {totalAmount} POL to Escrow
                </>
              )}
            </Button>

            {depositStatus === 'error' && (
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Retry Deposit
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-slate-400 space-y-2">
            <p className="font-medium text-slate-300">What happens next:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>You deposit funds to the smart contract escrow</li>
              <li>Funds are locked securely on the blockchain</li>
              <li>Freelancer begins work on the project</li>
              <li>You review and approve completed work</li>
              <li>Funds are released to freelancer upon approval</li>
            </ol>
          </div>
        </>
      )}

      {/* Post-Deposit Workflow */}
      {isDepositCompleted && <PostDepositWorkflow contract={contract} orderHash={orderHash} onUpdate={onContractUpdate} />}
    </>
  )
}

// Post-Deposit Workflow Component
function PostDepositWorkflow({ contract, orderHash, onUpdate }: { contract: any; orderHash: Hash | null; onUpdate?: () => void }) {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [isApprovingPayment, setIsApprovingPayment] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'pending' | 'confirming' | 'success' | 'error'>('idle')
  const [approvalTxHash, setApprovalTxHash] = useState<Hash | null>(null)
  const [approvalError, setApprovalError] = useState<string | null>(null)

  // Get milestone/deliverable data from contract
  const milestone = contract?.milestones?.[0] // First milestone for now
  const deliverableSubmitted = milestone?.deliverable?.submitted === true
  const agentVerified = milestone?.verification?.agentVerified === true
  const paymentApproved = milestone?.payment?.approved === true
  // IMPORTANT: Only show deployment URL to client, NOT GitHub URL (that's confidential source code)
  const deploymentUrl = milestone?.deliverable?.deploymentUrl || null
  const storageHash = milestone?.deliverable?.storage?.storageHash || milestone?.verification?.storageHash || null

  // Determine current state
  const currentState = !deliverableSubmitted
    ? 'awaiting_submission'
    : !agentVerified
      ? 'awaiting_verification'
      : 'ready_for_review'

  // Handle payment approval
  async function handleApprovePayment() {
    if (!walletClient || !publicClient || !orderHash) {
      setApprovalError('Wallet not connected or missing order information')
      return
    }

    setIsApprovingPayment(true)
    setApprovalStatus('pending')
    setApprovalError(null)

    try {
      // Call approvePayment from PaktClient
      const hash = await approvePayment(walletClient, orderHash)
      setApprovalTxHash(hash)
      setApprovalStatus('confirming')

      // Wait for confirmation
      const receipt = await waitForTransaction(publicClient, hash)

      if (receipt.status === 'success') {
        setApprovalStatus('success')

        // Update backend
        await updateBackendAfterApproval(hash)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Approval error:', err)
      setApprovalError(err.message || 'Failed to approve payment')
      setApprovalStatus('error')
    } finally {
      setIsApprovingPayment(false)
    }
  }

  // Update backend after approval
  async function updateBackendAfterApproval(transactionHash: Hash) {
    try {
      console.log('📝 Updating backend after payment approval...')

      const updateData = {
        id: contract.id,
        currentStage: 'Payment Approved',
        milestones: contract.milestones.map((m: any, idx: number) =>
          idx === 0 ? {
            ...m,
            status: 'COMPLETED', // Update milestone status
            review: {
              ...m.review,
              clientReviewed: true,
              reviewedAt: new Date().toISOString(),
              approved: true,
            },
            payment: {
              ...m.payment,
              approved: true,
              approvedAt: new Date().toISOString(),
              transactionHash: transactionHash,
            }
          } : m
        ),
        stageHistory: [
          ...(contract.stageHistory || []),
          {
            stage: 'Payment Approved',
            timestamp: new Date().toISOString(),
            triggeredBy: 'client',
            note: 'Client approved payment release',
            transactionHash: transactionHash,
          }
        ],
        lastUpdated: new Date().toISOString()
      }

      console.log('📤 Sending update:', JSON.stringify(updateData, null, 2))

      const response = await fetch(`/api/contracts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Backend update failed:', errorText)
        throw new Error('Failed to update backend')
      }

      const result = await response.json()
      console.log('✅ Backend updated successfully:', result)

      // Trigger parent component refresh if callback provided
      if (onUpdate) {
        console.log('🔄 Triggering parent refresh...')
        onUpdate()
      }

      // Reload page to show updated status
      setTimeout(() => {
        console.log('🔄 Reloading page...')
        window.location.reload()
      }, 2000)
    } catch (err) {
      console.error('❌ Error updating backend:', err)
      // Still reload to try to show updated state
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }

  const network = getCurrentNetwork()

  return (
    <div className="space-y-4">
      {/* State 1: Awaiting Freelancer Submission */}
      {currentState === 'awaiting_submission' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Awaiting Deliverable</h3>
          <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <p className="text-slate-300">Waiting for freelancer to submit their work...</p>
            </div>

            {/* Inactive URL display */}
            <div className="space-y-2 opacity-50">
              <p className="text-sm text-slate-400">Deployment URL</p>
              <div className="bg-slate-800 rounded p-3 border border-slate-700">
                <p className="text-slate-500 text-sm">No URL submitted yet</p>
              </div>
            </div>

            {/* Inactive buttons */}
            <div className="flex gap-2">
              <Button disabled className="flex-1" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Test Website
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400">
                The freelancer will submit their work when ready. You'll be notified to review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* State 2: Awaiting AI Verification */}
      {currentState === 'awaiting_verification' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">AI Verification in Progress</h3>
          <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <p className="text-slate-300">AI agent is verifying the deliverable...</p>
            </div>

            <Alert className="border-blue-500/50 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                Automated verification checks are running. This usually takes 1-2 minutes.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* State 3: Ready for Review (Active State) */}
      {currentState === 'ready_for_review' && approvalStatus !== 'success' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Review Deliverable</h3>

          {/* Verification Success */}
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
              ✓ AI verification passed - Deliverable is ready for your review
            </AlertDescription>
          </Alert>

          <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
            {/* Active URL display - ONLY deployment URL, NO GitHub */}
            {deploymentUrl && (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Live Deployment</p>
                <div className="bg-slate-800 rounded p-3 border border-indigo-500/30">
                  <p className="text-indigo-300 text-sm break-all">{deploymentUrl}</p>
                </div>
                <Button
                  onClick={() => window.open(deploymentUrl, '_blank')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Test Live Website
                </Button>
              </div>
            )}

            {/* Verification Info */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-slate-300 font-medium">AI Verification Complete</p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>✓ Code authenticity verified</li>
                    <li>✓ Deployment connection confirmed</li>
                    <li>✓ Files securely stored on POL network</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Note about source code access */}
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                <strong>Source Code Access:</strong> After you approve payment, you'll receive a download link to access the complete source code from POL decentralized storage.
              </AlertDescription>
            </Alert>

            {/* Comments/Feedback section */}
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Your Feedback (Optional)</p>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm min-h-[100px] focus:border-indigo-500 focus:outline-none"
                placeholder="Add any comments or feedback about the deliverable..."
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-700">
              <Button
                onClick={handleApprovePayment}
                disabled={isApprovingPayment}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isApprovingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {approvalStatus === 'pending' && 'Confirm in Wallet...'}
                    {approvalStatus === 'confirming' && 'Confirming...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve & Release Payment
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-orange-500 text-orange-400 hover:bg-orange-500/10"
                disabled={isApprovingPayment}
              >
                Request Changes
              </Button>
            </div>

            {/* Error display */}
            {approvalError && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  {approvalError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* State 4: Payment Approved */}
      {(approvalStatus === 'success' || paymentApproved) && (
        <div className="space-y-4">
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
              Payment approved successfully! Freelancer can now withdraw funds.
              {approvalTxHash && (
                <a
                  href={`${network.blockExplorer}/tx/${approvalTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-green-300 hover:text-green-200 underline"
                >
                  View Transaction <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </AlertDescription>
          </Alert>

          {/* Download Source Code from POL */}
          {storageHash && (
            <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
              <h4 className="text-lg font-semibold text-white">Download Project Files</h4>

              <Alert className="border-indigo-500/50 bg-indigo-500/10">
                <AlertCircle className="h-4 w-4 text-indigo-400" />
                <AlertDescription className="text-indigo-300 text-sm">
                  Source code is securely stored on POL decentralized storage network.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="bg-slate-800 rounded p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Storage Hash</p>
                  <p className="text-slate-300 text-xs font-mono break-all">{storageHash}</p>
                </div>

                <Button
                  onClick={async () => {
                    try {
                      setApprovalError(null)

                      // Use our new download API endpoint
                      const response = await fetch('/api/download', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rootHash: storageHash })
                      })

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Download failed');
                      }

                      // Create a download link for the binary response
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Pakt_project_${contract.id}.zip`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (err: any) {
                      console.error('Download error:', err);
                      setApprovalError('Failed to download from filecoin storage: ' + err.message);
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Source Code from POL
                </Button>

                {deploymentUrl && (
                  <Button
                    onClick={() => window.open(deploymentUrl, '_blank')}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Live Deployment
                  </Button>
                )}
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">What you're downloading:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Complete source code repository</li>
                  <li>Verification metadata</li>
                  <li>Commit history and timestamps</li>
                  <li>AI verification proof</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
