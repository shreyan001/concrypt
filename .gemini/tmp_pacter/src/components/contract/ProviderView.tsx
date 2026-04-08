'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, Loader2, Server, Wallet } from 'lucide-react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import type { Hash } from 'viem'
import {
  claimTimeLockedPayment,
  estimateClaimableAmount,
  getTimeLockedEscrowSummary,
  renewTimeLockedEscrow,
  type TimeLockedEscrowSummary,
  waitForTimeLockedReceipt,
} from '@/lib/contracts/timeLockedEscrowClient'
import { getDeFiVaultAddress } from '@/lib/contracts/config'

interface ProviderViewProps {
  contract: any
  onContractUpdate?: () => void
}

type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

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

export default function ProviderView({ contract, onContractUpdate }: ProviderViewProps) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [escrowSummary, setEscrowSummary] = useState<TimeLockedEscrowSummary | null>(null)
  const [claimableDisplay, setClaimableDisplay] = useState<string>('0')

  const [claimStatus, setClaimStatus] = useState<TxStatus>('idle')
  const [claimTxHash, setClaimTxHash] = useState<Hash | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)

  const [renewStatus, setRenewStatus] = useState<TxStatus>('idle')
  const [renewError, setRenewError] = useState<string | null>(null)

  const escrowAddress = contract?.timeLockedEscrow?.contractAddress as `0x${string}` | undefined
  const providerAddress = contract?.timeLockedEscrow?.provider?.walletAddress as string | undefined
  const vaultAddress = getDeFiVaultAddress()

  const isProvider = useMemo(() => {
    if (!address || !providerAddress) return false
    return address.toLowerCase() === providerAddress.toLowerCase()
  }, [address, providerAddress])

  useEffect(() => {
    if (!publicClient || !escrowAddress) {
      setEscrowSummary(null)
      setClaimableDisplay('0')
      return
    }

    let ignore = false
    async function loadEscrow() {
      try {
        const summary = await getTimeLockedEscrowSummary(publicClient, escrowAddress)
        if (ignore) return
        setEscrowSummary(summary)

        const claimInfo = await estimateClaimableAmount(publicClient, escrowAddress)
        if (ignore) return
        setClaimableDisplay(claimInfo.claimableFormatted)
      } catch (error) {
        console.error('Failed to load time-locked escrow summary', error)
        if (!ignore) {
          setEscrowSummary(null)
          setClaimableDisplay('0')
        }
      }
    }

    loadEscrow()
    return () => {
      ignore = true
    }
  }, [publicClient, escrowAddress, claimStatus, renewStatus])

  async function handleClaim() {
    if (!walletClient || !publicClient || !escrowAddress) {
      setClaimError('Wallet not connected or escrow unavailable')
      return
    }

    setClaimStatus('pending')
    setClaimError(null)

    try {
      const { claimableWei } = await estimateClaimableAmount(publicClient, escrowAddress)
      if (claimableWei === BigInt(0)) {
        throw new Error('No accrued amount available to claim yet')
      }

      const txHash = await claimTimeLockedPayment(walletClient, escrowAddress)
      setClaimTxHash(txHash)
      setClaimStatus('confirming')

      const receipt = await waitForTimeLockedReceipt(publicClient, txHash)
      if (receipt.status !== 'success') {
        throw new Error('Claim transaction reverted')
      }

      setClaimStatus('success')
      if (onContractUpdate) onContractUpdate()
    } catch (error: any) {
      console.error('Claim error', error)
      setClaimError(error?.message ?? 'Failed to claim payment')
      setClaimStatus('error')
    }
  }

  async function handleRenew() {
    if (!walletClient || !publicClient || !escrowAddress) {
      setRenewError('Wallet not connected or escrow unavailable')
      return
    }

    setRenewStatus('pending')
    setRenewError(null)

    try {
      const txHash = await renewTimeLockedEscrow(walletClient, escrowAddress, {
        amountPOL: '0.02',
        extraSeconds: BigInt(3600),
      })
      setRenewStatus('confirming')

      const receipt = await waitForTimeLockedReceipt(publicClient, txHash)
      if (receipt.status !== 'success') {
        throw new Error('Renewal transaction reverted')
      }

      setRenewStatus('success')
      if (onContractUpdate) onContractUpdate()
    } catch (error: any) {
      console.error('Renewal error', error)
      setRenewError(error?.message ?? 'Failed to renew service')
      setRenewStatus('error')
    }
  }

  if (!isProvider) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 font-mono">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white font-mono">
            <Server className="w-5 h-5" />
            Provider Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono">
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-400">
              Connect with the provider wallet to access this dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-700 bg-slate-800/60 font-mono">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Server className="w-5 h-5" />
          Provider Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4" /> Service Status
          </h3>
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-300 space-y-2">
            <div className="flex justify-between">
              <span>Service Started</span>
              <span>
                {contract?.timeLockedEscrow?.service?.startedAt
                  ? new Date(contract.timeLockedEscrow.service.startedAt).toLocaleString()
                  : 'Not started'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Duration</span>
              <span>{contract?.timeLockedEscrow?.service?.duration || '—'}</span>
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
            {escrowSummary && (
              <>
                <div className="flex justify-between">
                  <span>Funded Amount</span>
                  <span>{escrowSummary.fundedAmountFormatted} POL</span>
                </div>
                <div className="flex justify-between">
                  <span>Vault Balance</span>
                  <span>{escrowSummary.vaultBalanceFormatted} POL</span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Claim Accrued Payment
          </h3>
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Ready to claim</span>
              <span className="text-white font-semibold">{claimableDisplay} POL</span>
            </div>
            <p className="text-xs text-slate-400">
              Claim pro-rata payment accrued since the last withdrawal. Each claim includes the 1% vault bonus.
            </p>

            {claimError && claimStatus === 'error' && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  {claimError}
                </AlertDescription>
              </Alert>
            )}

            {claimStatus === 'success' && claimTxHash && (
              <Alert className="border-green-500/50 bg-green-500/10 text-xs">
                Claimed successfully. Transaction: {claimTxHash}
              </Alert>
            )}

            <Button
              onClick={handleClaim}
              disabled={claimStatus === 'pending' || claimStatus === 'confirming'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {claimStatus === 'pending' || claimStatus === 'confirming' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {claimStatus === 'pending' ? 'Confirm in wallet...' : 'Waiting for confirmation...'}
                </>
              ) : (
                'Claim Accrued Payment'
              )}
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4" /> Quick Renewal (mock)
          </h3>
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
            <p className="text-xs text-slate-400">
              Demonstration renewal action for UI flow testing. This reuses the claim transaction placeholder until backend scheduling API is connected.
            </p>

            {renewError && renewStatus === 'error' && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  {renewError}
                </AlertDescription>
              </Alert>
            )}

            {renewStatus === 'success' && (
              <Alert className="border-green-500/50 bg-green-500/10 text-xs">
                Renewal transaction completed.
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={handleRenew}
              disabled={renewStatus === 'pending' || renewStatus === 'confirming'}
              className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              {renewStatus === 'pending' || renewStatus === 'confirming' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {renewStatus === 'pending' ? 'Confirm in wallet...' : 'Processing transaction...'}
                </>
              ) : (
                'Renew Service Window'
              )}
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
