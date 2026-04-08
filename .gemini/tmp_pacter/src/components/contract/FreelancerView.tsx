'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Briefcase, CheckCircle2, AlertCircle, Loader2, ExternalLink, Github, Upload } from 'lucide-react'
import { useAccount } from 'wagmi'
import { withdrawFunds, waitForTransaction } from '@/lib/contracts/paktClient'
import { useWalletClient, usePublicClient } from 'wagmi'
import { type Hash } from 'viem'
import { getCurrentNetwork } from '@/lib/contracts/config'
import VerificationModal from './VerificationModal'

interface FreelancerViewProps {
  contract: any
  onContractUpdate?: () => void
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

export default function FreelancerView({ contract, onContractUpdate }: FreelancerViewProps) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [githubUrl, setGithubUrl] = useState('')
  const [deploymentUrl, setDeploymentUrl] = useState('')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Log when component receives updates
  React.useEffect(() => {
    console.log('📊 FreelancerView received contract update:', {
      stage: contract?.currentStage,
      milestoneStatus: contract?.milestones?.[0]?.status,
      paymentApproved: contract?.milestones?.[0]?.payment?.approved,
      paymentReleased: contract?.milestones?.[0]?.payment?.released
    })
  }, [contract])

  // Verification modal state
  type VerificationStep = {
    id: string
    title: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    details?: string
    link?: string
  }

  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    { id: 'github', title: 'Verifying GitHub Repository', status: 'pending', details: '' },
    { id: 'download', title: 'Downloading Repository', status: 'pending', details: '' },
    { id: 'upload', title: 'Verifying Deliverable', status: 'pending', details: '' },
    { id: 'sign', title: 'Agent Signing On-Chain', status: 'pending', details: '' },
    { id: 'complete', title: 'Finalizing Verification', status: 'pending', details: '' },
  ])
  const [currentVerificationStep, setCurrentVerificationStep] = useState(0)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'pending' | 'confirming' | 'success' | 'error'>('idle')
  const [withdrawTxHash, setWithdrawTxHash] = useState<Hash | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  // Check if user is the freelancer
  const isFreelancer = address?.toLowerCase() === contract?.parties?.freelancer?.walletAddress?.toLowerCase()

  // Get milestone data
  const milestone = contract?.milestones?.[0] // First milestone
  const deliverableSubmitted = milestone?.deliverable?.submitted === true
  const agentVerified = milestone?.verification?.agentVerified === true
  const paymentApproved = milestone?.payment?.approved === true
  const paymentReleased = milestone?.payment?.released === true

  // Get order hash
  const orderHash = contract?.escrow?.orderHash || contract?.escrow?.deposit?.orderHash

  const isTimeLockedContract = contract?.timeLockedEscrow?.contractAddress
  if (isTimeLockedContract) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 font-mono">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white font-mono">
            <Briefcase className="w-5 h-5" />
            Freelancer Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono space-y-3">
          <Alert className="border-indigo-500/50 bg-indigo-500/10">
            <AlertCircle className="h-4 w-4 text-indigo-400" />
            <AlertDescription className="text-indigo-300">
              This contract is configured as a time-locked inference agreement. Please use the provider dashboard to manage accrual claims.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Determine current state
  const currentState = !deliverableSubmitted
    ? 'ready_to_submit'
    : !agentVerified
      ? 'awaiting_verification'
      : !paymentApproved
        ? 'awaiting_approval'
        : !paymentReleased
          ? 'ready_to_withdraw'
          : 'completed'

  // Update verification step
  function updateVerificationStep(stepId: string, status: 'processing' | 'completed' | 'error', details?: string, link?: string) {
    setVerificationSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, details, link } : step
    ))

    // Update current step index
    const stepIndex = verificationSteps.findIndex(s => s.id === stepId)
    if (stepIndex !== -1) {
      setCurrentVerificationStep(stepIndex)
    }
  }

  // Handle deliverable submission
  async function handleSubmitDeliverable() {
    if (!githubUrl.trim()) {
      setSubmitError('GitHub URL is required')
      return
    }

    if (!orderHash) {
      setSubmitError('Order hash not found. Please ensure escrow has been deposited.')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('submitting')
    setSubmitError(null)
    setVerificationError(null)

    // Reset and show modal
    setVerificationSteps([
      { id: 'github', title: 'Verifying GitHub Repository', status: 'pending', details: '' },
      { id: 'download', title: 'Downloading Repository', status: 'pending', details: '' },
      { id: 'upload', title: 'Verifying Deliverable', status: 'pending', details: '' },
      { id: 'sign', title: 'Agent Signing On-Chain', status: 'pending', details: '' },
      { id: 'complete', title: 'Finalizing Verification', status: 'pending', details: '' },
    ])
    setCurrentVerificationStep(0)
    setShowVerificationModal(true)

    try {
      // STEP 1: GitHub Verification
      updateVerificationStep('github', 'processing', 'Checking repository accessibility...')

      const githubResponse = await fetch('/api/verify/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUrl: githubUrl.trim(),
          deploymentUrl: deploymentUrl.trim() || null,
        })
      })

      const githubResult = await githubResponse.json()
      if (!githubResponse.ok) {
        throw new Error(githubResult.error || 'GitHub verification failed')
      }

      updateVerificationStep(
        'github',
        'completed',
        `Repository verified: ${githubResult.owner}/${githubResult.repo}`,
        githubResult.githubUrl
      )

      // STEP 2: Skip storage upload (deliverable is already on GitHub)
      // The GitHub verification provides all necessary information
      updateVerificationStep('upload', 'processing', 'Using GitHub repository as deliverable source...')

      // Since the code is on GitHub, we can skip the separate storage upload
      // and use the GitHub data directly
      const storageResult = {
        storageHash: githubResult.commitSha, // Use commit SHA as storage hash
        storageTxHash: githubResult.commitSha, // Use commit SHA as tx hash
        note: 'Repository verified on GitHub'
      }

      updateVerificationStep(
        'upload',
        'completed',
        `Verified via GitHub: ${githubResult.commitSha?.substring(0, 12)}...`,
        githubResult.githubUrl
      )

      // STEP 3: Agent Signs On-Chain
      updateVerificationStep('sign', 'processing', 'Agent signing verification on-chain...')

      const verificationDetails = JSON.stringify({
        verifiedBy: 'Pakt-AI-Agent',
        verifiedAt: new Date().toISOString(),
        method: 'GitHub verification',
        githubRepo: githubUrl.trim(),
        storageHash: githubResult.rootHash,
        storageTxHash: githubResult.txHash
      })

      const agentResponse = await fetch('/api/verify/agent-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderHash: orderHash,
          verificationDetails: verificationDetails,
        })
      })

      const agentResult = await agentResponse.json()
      if (!agentResponse.ok) {
        throw new Error(agentResult.error || 'Agent signing failed')
      }

      // Build proper explorer URL
      const explorerUrl = agentResult.transactionHash && agentResult.transactionHash !== 'Already verified'
        ? `https://amoy.polygonscan.com/tx/${agentResult.transactionHash}`
        : undefined

      updateVerificationStep(
        'sign',
        'completed',
        agentResult.alreadyVerified
          ? 'Already verified (skipped)'
          : `Transaction: ${agentResult.transactionHash?.substring(0, 20)}...`,
        explorerUrl
      )

      // STEP 4: Finalize - Update Contract
      updateVerificationStep('complete', 'processing', 'Updating contract state...')

      const finalizeResponse = await fetch('/api/verify/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          githubUrl: githubUrl.trim(),
          deploymentUrl: deploymentUrl.trim() || null,
          comments: comments.trim() || null,
          githubVerification: githubResult,
          storageResult: { storageHash: githubResult.rootHash, storageTxHash: githubResult.txHash }, // Pass rootHash and txHash
          agentApproval: agentResult,
        })
      })

      const finalizeResult = await finalizeResponse.json()
      if (!finalizeResponse.ok) {
        throw new Error(finalizeResult.error || 'Failed to finalize verification')
      }

      updateVerificationStep('complete', 'completed', 'Verification complete - ready for client review')

      // Verification complete!
      setSubmitStatus('success')

      console.log('✅ Verification complete! Triggering contract update...')

      // Trigger immediate contract update
      if (onContractUpdate) {
        setTimeout(() => {
          console.log('Calling onContractUpdate to refresh contract data...')
          onContractUpdate()
        }, 1000) // Wait 1 second for backend to finish updating
      }

    } catch (err: any) {
      console.error('Submit error:', err)
      const errorMessage = err.message || 'Failed to submit deliverable'
      setSubmitError(errorMessage)
      setVerificationError(errorMessage)
      setSubmitStatus('error')

      // Mark current step as error
      const currentStep = verificationSteps.find(s => s.status === 'processing')
      if (currentStep) {
        updateVerificationStep(currentStep.id, 'error', errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle fund withdrawal
  async function handleWithdrawFunds() {
    if (!walletClient || !publicClient || !orderHash) {
      setWithdrawError('Wallet not connected or missing order information')
      return
    }

    setIsWithdrawing(true)
    setWithdrawStatus('pending')
    setWithdrawError(null)

    try {
      // Call withdrawFunds from PaktClient
      const hash = await withdrawFunds(walletClient, orderHash as Hash)
      setWithdrawTxHash(hash)
      setWithdrawStatus('confirming')

      // Wait for confirmation
      const receipt = await waitForTransaction(publicClient, hash)

      if (receipt.status === 'success') {
        setWithdrawStatus('success')

        // Update backend
        await updateBackendAfterWithdrawal(hash)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Withdrawal error:', err)
      setWithdrawError(err.message || 'Failed to withdraw funds')
      setWithdrawStatus('error')
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Update backend after withdrawal
  async function updateBackendAfterWithdrawal(transactionHash: Hash) {
    try {
      console.log('📝 Updating backend after withdrawal...')

      const updateData = {
        id: contract.id,
        currentStage: 'Contract Completed',
        milestones: contract.milestones.map((m: any, idx: number) =>
          idx === 0 ? {
            ...m,
            status: 'COMPLETED', // Ensure milestone status is COMPLETED
            payment: {
              ...m.payment,
              approved: true, // Keep approved status
              released: true, // Mark as released
              releasedAt: new Date().toISOString(),
              transactionHash: transactionHash,
            }
          } : m
        ),
        stageHistory: [
          ...(contract.stageHistory || []),
          {
            stage: 'Contract Completed',
            timestamp: new Date().toISOString(),
            triggeredBy: 'freelancer',
            note: 'Freelancer withdrew payment - Contract completed successfully',
            transactionHash: transactionHash,
          }
        ],
        lastUpdated: new Date().toISOString()
      }

      console.log('📤 Sending withdrawal update:', JSON.stringify(updateData, null, 2))

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
      if (onContractUpdate) {
        console.log('🔄 Triggering parent refresh...')
        onContractUpdate()
      }

      // Reload page to show completed status
      setTimeout(() => {
        console.log('🔄 Reloading page to show completion...')
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

  if (!isFreelancer) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 font-mono">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white font-mono">
            <Briefcase className="w-5 h-5" />
            Freelancer Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono">
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-400">
              Connect with the freelancer wallet to access this dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        steps={verificationSteps}
        currentStep={currentVerificationStep}
        error={verificationError}
      />

      <Card className="border-slate-700 bg-slate-800/50 font-mono">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white font-mono">
            <Briefcase className="w-5 h-5" />
            Freelancer Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 font-mono">
          {/* State 1: Ready to Submit */}
          {currentState === 'ready_to_submit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white font-mono">Submit Your Work</h3>

              <div className="bg-slate-900/50 rounded-lg p-6 space-y-4 border border-slate-700">
                {/* GitHub URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="github-url" className="text-slate-300 font-mono text-sm">
                    GitHub Repository URL *
                  </Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="github-url"
                      type="url"
                      placeholder="https://github.com/username/repository"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white focus:border-indigo-500 font-mono text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-mono">Public repository required for verification</p>
                </div>

                {/* Deployment URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="deployment-url" className="text-slate-300 font-mono text-sm">
                    Deployment URL (Optional)
                  </Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="deployment-url"
                      type="url"
                      placeholder="https://your-app.vercel.app"
                      value={deploymentUrl}
                      onChange={(e) => setDeploymentUrl(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white focus:border-indigo-500 font-mono text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-mono">Live deployment for client testing</p>
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-slate-300 font-mono text-sm">
                    Additional Comments (Optional)
                  </Label>
                  <textarea
                    id="comments"
                    placeholder="Describe your implementation, any special features, or notes for the client..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm min-h-[100px] focus:border-indigo-500 focus:outline-none font-mono"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Error Display */}
                {submitError && submitStatus === 'error' && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400 font-mono text-sm">
                      {submitError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Display */}
                {submitStatus === 'success' && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-400 font-mono text-sm">
                      ✅ Verification complete! Updating contract status...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitDeliverable}
                  disabled={isSubmitting || !githubUrl.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-mono"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {submitStatus === 'submitting' && 'Verifying & Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit for Verification
                    </>
                  )}
                </Button>

                {/* Instructions */}
                <div className="text-sm text-slate-400 space-y-2 pt-4 border-t border-slate-700">
                  <p className="font-medium text-slate-300 font-mono">What happens next:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2 font-mono text-xs">
                    <li>GitHub repository verified for authenticity</li>
                    <li>Deployment connection validated (if provided)</li>
                    <li>Repository verified and commit tracked</li>
                    <li>Agent approves milestone on-chain</li>
                    <li>Client reviews and approves payment</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* State 2: Awaiting Verification */}
          {currentState === 'awaiting_verification' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white font-mono">Verification in Progress</h3>

              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                <AlertDescription className="text-blue-300 font-mono text-sm">
                  AI agent is verifying your deliverable. This usually takes 2-5 minutes.
                </AlertDescription>
              </Alert>

              <div className="bg-slate-900/50 rounded-lg p-6 space-y-4 border border-slate-700">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-mono">Submitted GitHub URL</p>
                  <div className="bg-slate-800 rounded p-3 border border-slate-700">
                    <p className="text-indigo-300 text-sm break-all font-mono">
                      {milestone?.deliverable?.githubUrl || 'Loading...'}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-slate-400 font-mono">
                  <p className="font-medium text-slate-300 mb-2">Verification checks:</p>
                  <ul className="space-y-1 ml-4 text-xs">
                    <li>• Repository accessibility</li>
                    <li>• Deployment connection (if provided)</li>
                    <li>• Code authenticity</li>
                    <li>• File storage on POL network</li>
                    <li>• On-chain approval by agent</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* State 3: Under Review by Client */}
          {currentState === 'awaiting_approval' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white font-mono">📋 Under Review by Client</h3>

              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400 font-mono text-sm">
                  ✅ Verification passed! Your work is under client review.
                </AlertDescription>
              </Alert>

              <div className="bg-slate-900/50 rounded-lg p-6 space-y-4 border border-slate-700">
                <div className="flex items-center gap-3 bg-indigo-900/20 rounded-lg p-4 border border-indigo-500/30">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
                  <p className="text-slate-200 font-mono text-sm font-medium">
                    🔄 Waiting for client to review and approve payment...
                  </p>
                </div>

                {/* Deliverable Info */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-white font-semibold mb-3 text-sm font-mono">Your Submission:</p>
                  <div className="space-y-2 text-xs font-mono">
                    {milestone?.deliverable?.githubUrl && (
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400">GitHub Repository:</span>
                        <a
                          href={milestone.deliverable.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-300 hover:text-indigo-200 break-all underline"
                        >
                          {milestone.deliverable.githubUrl}
                        </a>
                      </div>
                    )}
                    {milestone?.deliverable?.deploymentUrl && (
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400">Live Deployment:</span>
                        <a
                          href={milestone.deliverable.deploymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-300 hover:text-indigo-200 break-all underline"
                        >
                          {milestone.deliverable.deploymentUrl}
                        </a>
                      </div>
                    )}
                    {milestone?.deliverable?.submittedAt && (
                      <div className="pt-2 border-t border-slate-700">
                        <span className="text-slate-400">Submitted: </span>
                        <span className="text-slate-300">{new Date(milestone.deliverable.submittedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-slate-400 font-mono bg-slate-800/30 rounded-lg p-4">
                  <p className="font-medium text-slate-300 mb-2">💡 What the client can see:</p>
                  <ul className="space-y-1 ml-4 text-xs">
                    <li>✓ Your live deployment (if provided)</li>
                    <li>✓ Verification proof from AI agent</li>
                    <li>✓ Your additional comments</li>
                    <li>✓ AI verification details</li>
                  </ul>
                </div>

                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300 font-mono text-xs">
                    💰 The client is reviewing your work. Once approved, you'll be able to withdraw your payment immediately.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* State 4: Ready to Withdraw */}
          {currentState === 'ready_to_withdraw' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white font-mono">🎉 Payment Approved!</h3>

              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400 font-mono text-sm">
                  ✅ Client approved your work! You can now withdraw your payment.
                </AlertDescription>
              </Alert>

              <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg p-6 space-y-4 border border-green-500/30">
                {/* Payment Details */}
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-medium font-mono text-sm mb-3">Payment Details</h4>
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-slate-400">Escrow Amount</span>
                    <span className="text-green-400 font-bold">0.09 POL</span>
                  </div>
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-slate-400">INR Equivalent</span>
                    <span className="text-green-400 font-bold">≈ ₹90,000</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between">
                    <span className="text-white font-semibold font-mono">Total Withdrawal</span>
                    <span className="text-green-400 font-bold text-lg font-mono">0.09 POL</span>
                  </div>
                </div>

                {/* Approval Info */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-300 font-medium font-mono text-sm">Client Approval Received</p>
                      <p className="text-slate-400 text-xs font-mono mt-1">
                        Your work has been reviewed and approved. Funds are ready for withdrawal.
                      </p>
                      {milestone?.payment?.approvedAt && (
                        <p className="text-slate-500 text-xs font-mono mt-1">
                          Approved: {new Date(milestone.payment.approvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {withdrawError && withdrawStatus === 'error' && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-400 font-mono text-sm">
                      {withdrawError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Display */}
                {withdrawStatus === 'success' && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-400 font-mono text-sm">
                      ✅ Withdrawal successful! Funds have been transferred to your wallet.
                      {withdrawTxHash && (
                        <a
                          href={`${network.blockExplorer}/tx/${withdrawTxHash}`}
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

                {/* Withdraw Button */}
                <Button
                  onClick={handleWithdrawFunds}
                  disabled={isWithdrawing || withdrawStatus === 'success'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-mono text-lg py-6"
                  size="lg"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {withdrawStatus === 'pending' && 'Confirm in Wallet...'}
                      {withdrawStatus === 'confirming' && 'Processing Withdrawal...'}
                    </>
                  ) : withdrawStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Withdrawal Complete
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Withdraw 0.09 POL Now
                    </>
                  )}
                </Button>

                {withdrawStatus === 'error' && (
                  <Button
                    onClick={() => {
                      setWithdrawStatus('idle')
                      setWithdrawError(null)
                      setWithdrawTxHash(null)
                    }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 font-mono"
                  >
                    Retry Withdrawal
                  </Button>
                )}

                {/* Instructions */}
                <div className="text-xs text-slate-400 font-mono space-y-1 pt-4 border-t border-slate-700">
                  <p className="font-medium text-slate-300">What happens when you withdraw:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>0.09 POL tokens transferred to your wallet</li>
                    <li>Contract marked as completed</li>
                    <li>Transaction recorded on blockchain</li>
                    <li>Project officially finished</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* State 5: Completed */}
          {currentState === 'completed' && (
            <div className="space-y-4">
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400 font-mono text-sm">
                  ✅ Contract completed successfully! Payment has been withdrawn.
                  {withdrawTxHash && (
                    <a
                      href={`${network.blockExplorer}/tx/${withdrawTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-green-300 hover:text-green-200 underline"
                    >
                      View Transaction <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
