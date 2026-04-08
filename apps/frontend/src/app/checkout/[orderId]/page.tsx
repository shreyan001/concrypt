'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Clock, AlertCircle, CheckCircle, ExternalLink, Activity, Wallet } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { HANDOVER_CONTRACT_ADDRESS, TOKEN_ADDRESS } from '@/lib/contracts/config'

// Simplified ABI for the checkout
const IACP_ABI = [
  { name: "fund", type: "function", inputs: [{ name: "j", type: "uint256" }, { name: "e", type: "uint256" }, { name: "o", type: "bytes" }], outputs: [] }
] as const;

const ERC20_ABI = [
  { name: "approve", type: "function", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ name: "", type: "bool" }] }
] as const;

export default function CheckoutPage() {
  const { orderId } = useParams()
  const { address, isConnected } = useAccount()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (orderId) {
      fetch(`http://localhost:3001/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data)
          setLoading(false)
        })
        .catch(err => {
          console.error("Failed to fetch order", err)
          setLoading(false)
        })
    }
  }, [orderId])

  const handleApprove = async () => {
    if (!order) return
    const amount = parseUnits(order.job.budget, 6)
    writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [HANDOVER_CONTRACT_ADDRESS, amount],
    })
  }

  const handleFund = async () => {
    if (!order || !order.onChainJobId) return
    const amount = parseUnits(order.job.budget, 6)
    writeContract({
      address: HANDOVER_CONTRACT_ADDRESS,
      abi: IACP_ABI,
      functionName: "fund",
      args: [BigInt(order.onChainJobId), amount, "0x"],
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-spin text-purple-500" size={32} />
          <p className="tracking-widest uppercase text-xs font-black">Architecting Deal...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={32} />
          <p className="text-xl font-bold">Order Not Found</p>
          <p className="text-slate-500 mt-2">Check the backend vault or URL.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-mono p-4 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Concrypt <span className="text-slate-600">Checkout</span></h1>
              <p className="text-purple-500 text-xs font-black tracking-widest uppercase">Agreement #{orderId}</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 bg-black border border-slate-800 p-2 rounded-xl">
            {/* @ts-ignore */}
            <w3m-button />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">

            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
              <CardHeader className="border-b border-slate-800/50 pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">
                  <Clock className="text-purple-500" size={20} /> Agreement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Service Description</p>
                  <p className="text-lg font-bold text-slate-200 leading-tight">{order.job.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Escrow Amount</p>
                    <p className="text-2xl font-black text-white">{order.job.budget} <span className="text-slate-600 text-sm">pUSDC</span></p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Network</p>
                    <p className="text-lg font-bold text-slate-200 flex items-center gap-2 uppercase tracking-tighter">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      Base Sepolia
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 p-4 rounded-xl border border-slate-800 space-y-2 text-[10px] uppercase font-black tracking-tighter">
                  <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500">Provider</span>
                    <span className="text-purple-400 font-mono">{order.job.provider}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Evaluator</span>
                    <span className="text-purple-400 font-mono">{order.job.evaluator}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strategic Rubric Section */}
            <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/20 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-6 text-purple-500/10 group-hover:text-purple-500/20 transition-all">
                <Shield size={140} strokeWidth={1} />
              </div>
              <h3 className="text-sm font-black text-purple-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <Zap size={18} className="fill-purple-400" /> AI STRATEGIC VERIFICATION RUBRIC
              </h3>
              <div className="space-y-4 relative z-10">
                {order.strategy.rubric.split('\n').map((line: string, i: number) => (
                  <div key={i} className="flex gap-4 text-slate-300 text-sm leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                    <CheckCircle className="text-purple-500 shrink-0 mt-0.5" size={18} />
                    <p className="font-bold">{line}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex items-center gap-3 text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
                <div className="w-8 h-[1px] bg-slate-800"></div>
                Powered by Gemini 1.5 Flash Integrity Engine
              </div>
            </div>

          </div>

          {/* Action Sidebar */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl sticky top-8">
              <CardHeader className="border-b border-slate-800/50 pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Escrow Module</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">

                {!isConnected ? (
                  <div className="text-center py-10 bg-black/40 rounded-2xl border border-slate-800 border-dashed">
                    <Wallet className="mx-auto mb-4 text-slate-600" size={40} strokeWidth={1.5} />
                    <p className="text-slate-500 text-[10px] mb-6 uppercase font-black tracking-widest px-4">Connect wallet to authorize and fund escrow</p>
                    <div className="flex justify-center">
                      <w3m-button />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                      <p className="text-[10px] text-blue-400 font-bold leading-relaxed uppercase tracking-tighter">
                        Authorization required: You are locking <b>{order.job.budget} pUSDC</b> in the Concrypt Protocol escrow.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleApprove}
                        disabled={isConfirming}
                        className="w-full h-16 bg-white text-black hover:bg-slate-200 font-black rounded-xl text-xs uppercase tracking-widest shadow-xl transition-all"
                      >
                        {isConfirming ? (
                          <span className="flex items-center gap-2 animate-pulse">Processing...</span>
                        ) : (
                          "1. Authorize Token"
                        )}
                      </Button>

                      <Button
                        onClick={handleFund}
                        disabled={!isSuccess || !order.onChainJobId}
                        className="w-full h-16 bg-purple-600 text-white hover:bg-purple-500 font-black rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 disabled:opacity-30 disabled:shadow-none transition-all"
                      >
                        2. Fund Escrow
                      </Button>
                    </div>

                    {isSuccess && (
                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center justify-center gap-3 text-[10px] text-green-400 font-black uppercase tracking-widest">
                        <CheckCircle size={18} /> Token Approved
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-800/50">
                  <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-black tracking-widest mb-3">
                    <span>Evaluator Agent</span>
                    <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active</span>
                  </div>
                  <p className="text-[9px] text-slate-600 leading-relaxed font-bold">
                    THE EVALUATOR AGENT AUTONOMOUSLY MONITORS FOR FUNDING. VERIFICATION PIPELINE TRIGGERED ON BLOCK FINALITY.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
