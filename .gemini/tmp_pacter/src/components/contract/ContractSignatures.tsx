'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Circle, Loader2, PenTool } from 'lucide-react'
import { useAccount, useSignTypedData } from 'wagmi'

interface ContractSignaturesProps {
  contract: any
  onSignaturesComplete: () => void
}

export default function ContractSignatures({ contract, onSignaturesComplete }: ContractSignaturesProps) {
  const { address, isConnected, chain } = useAccount()
  const { signTypedData } = useSignTypedData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [freelancerInfo, setFreelancerInfo] = useState({
    name: '',
    email: ''
  })

  const isClient = address?.toLowerCase() === contract.parties.client.walletAddress.toLowerCase()

  // Freelancer can be identified by wallet OR if no freelancer is set yet and user is not the client
  const freelancerWalletSet = contract.parties.freelancer.walletAddress &&
    contract.parties.freelancer.walletAddress !== '0x0000000000000000000000000000000000000000'

  const isFreelancer = freelancerWalletSet
    ? address?.toLowerCase() === contract.parties.freelancer.walletAddress?.toLowerCase()
    : !isClient && isConnected // If no freelancer set and not client, assume this is the freelancer

  const clientSigned = contract.signatures.client.signed
  const freelancerSigned = contract.signatures.freelancer.signed
  const bothSigned = contract.signatures.bothSigned

  const needsFreelancerInfo = isFreelancer && (!contract.parties.freelancer.name || contract.parties.freelancer.name === 'To Be Determined')

  // Debug logging
  console.log('ContractSignatures Debug:', {
    address,
    isConnected,
    isClient,
    isFreelancer,
    freelancerWalletSet,
    needsFreelancerInfo,
    freelancerName: contract.parties.freelancer.name,
    freelancerWallet: contract.parties.freelancer.walletAddress
  })

  const handleSign = () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    setIsSubmitting(true)

    console.log('Starting signature process...', { address, chain: chain?.id })

    // EIP-712 typed data for signature
    signTypedData(
      {
        account: address,
        domain: {
          name: 'Pakt',
          version: '1',
          chainId: chain?.id || 16602,
          verifyingContract: (contract.escrow.contractAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`
        },
        types: {
          Contract: [
            { name: 'contractId', type: 'string' },
            { name: 'contractHash', type: 'bytes32' },
            { name: 'signer', type: 'address' },
            { name: 'role', type: 'string' },
            { name: 'timestamp', type: 'uint256' }
          ]
        },
        primaryType: 'Contract',
        message: {
          contractId: contract.id,
          contractHash: contract.contractHash as `0x${string}`,
          signer: address,
          role: isClient ? 'CLIENT' : 'FREELANCER',
          timestamp: BigInt(Math.floor(Date.now() / 1000))
        }
      },
      {
        onSuccess: async (signature) => {
          console.log('Signature obtained:', signature)

          try {

            // Submit signature to backend
            const payload: any = {
              signature,
              role: isClient ? 'client' : 'freelancer',
              walletAddress: address
            }

            // If freelancer needs to provide info
            if (needsFreelancerInfo) {
              payload.freelancerInfo = freelancerInfo
            }

            const response = await fetch(`/api/contracts/${contract.id}/sign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to submit signature')

            const result = await response.json()

            if (result.bothSigned) {
              onSignaturesComplete()
            } else {
              // Refresh page to show updated signature status
              window.location.reload()
            }
          } catch (error) {
            console.error('Backend submission error:', error)
            alert('Failed to submit signature to backend. Please try again.')
          } finally {
            setIsSubmitting(false)
          }
        },
        onError: (error) => {
          console.error('Signature error:', error)
          alert('Failed to sign contract. Please try again.')
          setIsSubmitting(false)
        }
      }
    )
  }

  if (bothSigned) {
    return (
      <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="text-emerald-400 font-mono font-medium text-sm">
              Contract Fully Signed
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Both parties have signed. Contract is now active.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <PenTool className="w-4 h-4 text-slate-300" />
        <h4 className="text-slate-100 font-mono font-medium text-sm">Contract Signatures</h4>
      </div>

      {/* Signature Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
          {clientSigned ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Circle className="w-4 h-4 text-slate-500" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-200 text-xs">Client</p>
            <p className="text-[10px] text-slate-400 truncate">{contract.parties.client.name}</p>
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] ${clientSigned
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-600/30 text-slate-400 border border-slate-600/30'
              }`}>
              {clientSigned ? 'Signed' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
          {freelancerSigned ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Circle className="w-4 h-4 text-slate-500" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-200 text-xs">Freelancer</p>
            <p className="text-[10px] text-slate-400 truncate">
              {contract.parties.freelancer.name || 'Awaiting'}
            </p>
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] ${freelancerSigned
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-600/30 text-slate-400 border border-slate-600/30'
              }`}>
              {freelancerSigned ? 'Signed' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg">
          <p className="text-xs text-amber-300 font-mono">
            Please connect your wallet to sign the contract.
          </p>
        </div>
      )}

      {/* Role Detection Debug Info */}
      {isConnected && (
        <div className="p-2 bg-slate-800/50 rounded border border-slate-600/20">
          <p className="text-[10px] text-slate-400 font-mono">
            Detected Role: {isClient ? '🔵 Client' : isFreelancer ? '🟣 Freelancer' : '👁️ Viewer'}
            {isFreelancer && needsFreelancerInfo && ' (Info Required)'}
          </p>
        </div>
      )}

      {/* Freelancer Info Collection */}
      {isConnected && needsFreelancerInfo && (
        <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
          <p className="text-xs font-medium text-slate-200 font-mono">Please provide your information:</p>
          <div className="space-y-2">
            <div>
              <Label htmlFor="name" className="text-xs text-slate-400">Full Name</Label>
              <Input
                id="name"
                value={freelancerInfo.name}
                onChange={(e) => setFreelancerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="mt-1 bg-slate-800/50 border-slate-600/50 text-slate-200 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs text-slate-400">Email</Label>
              <Input
                id="email"
                type="email"
                value={freelancerInfo.email}
                onChange={(e) => setFreelancerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                className="mt-1 bg-slate-800/50 border-slate-600/50 text-slate-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sign Button */}
      {isConnected && (isClient || isFreelancer) && (
        <div>
          {isClient && !clientSigned && (
            <Button
              onClick={handleSign}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-mono"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                'Sign as Client'
              )}
            </Button>
          )}
          {isFreelancer && !freelancerSigned && (
            <Button
              onClick={handleSign}
              disabled={isSubmitting || (needsFreelancerInfo && (!freelancerInfo.name || !freelancerInfo.email))}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-mono"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                'Sign as Freelancer'
              )}
            </Button>
          )}
        </div>
      )}

      {/* Not a party message */}
      {isConnected && !isClient && !isFreelancer && (
        <div className="p-3 bg-slate-700/50 border border-slate-600/30 rounded-lg">
          <p className="text-xs text-slate-400 font-mono text-center">
            You are not a party to this contract. Only the client and freelancer can sign.
          </p>
        </div>
      )}
    </div>
  )
}
