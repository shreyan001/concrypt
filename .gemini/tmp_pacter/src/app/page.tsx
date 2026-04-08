"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-mono">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-r from-[#4299e1] to-[#3182ce] rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-[#4299e1]">Pakt</h1>
          <p className="text-gray-300 text-lg mb-8">
            Programmable Trust Protocol – Autonomous agreements powered by AI agents
          </p>
          <Button 
            onClick={() => router.push('/create')}
            className="bg-gradient-to-r from-[#4299e1] to-[#3182ce] text-white hover:from-[#3182ce] hover:to-[#2c5aa0] rounded-xl px-8 py-3 font-mono shadow-2xl border-0"
          >
            Create Contract
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-[#4299e1] font-mono">AI-Powered</CardTitle>
              <CardDescription className="text-gray-300 font-mono">
                Autonomous AI agents handle contract verification and enforcement
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-[#4299e1] font-mono">Trustless</CardTitle>
              <CardDescription className="text-gray-300 font-mono">
                No intermediaries - programmable trust with verifiable enforcement
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-[#4299e1] font-mono">Secure</CardTitle>
              <CardDescription className="text-gray-300 font-mono">
                TEE-secured execution with transparent audit trails
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Process */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-8 font-mono text-[#4299e1]">How it works</h2>
          <div className="flex justify-center items-center space-x-4 flex-wrap">
            <Badge variant="outline" className="rounded-full px-4 py-2 font-mono bg-white/5 border-white/20 text-white">
              1. Define Agreement
            </Badge>
            <span className="text-gray-400">→</span>
            <Badge variant="outline" className="rounded-full px-4 py-2 font-mono bg-white/5 border-white/20 text-white">
              2. AI Agent Deployment
            </Badge>
            <span className="text-gray-400">→</span>
            <Badge variant="outline" className="rounded-full px-4 py-2 font-mono bg-white/5 border-white/20 text-white">
              3. Autonomous Enforcement
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
