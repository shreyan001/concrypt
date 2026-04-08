"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const router = useRouter();

  const handleCreateContract = () => {
    router.push('/create');
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a202c] text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-[#4299e1] to-[#3182ce] text-white border-0 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Powered by POL Compute & Storage
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-[#ffd700] to-[#4299e1] bg-clip-text text-transparent">
              Pakt
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-4 font-mono">
              Programmable Trust Protocol
            </p>

            <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Autonomous agreements. Verifiable enforcement. No intermediaries.
              <br />
              Turn every satoshi into a smart contract—AI-verified escrows for anything digital.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                onClick={handleCreateContract}
                className="bg-gradient-to-r from-[#4299e1] to-[#3182ce] hover:from-[#ffd700] hover:to-[#f6ad55] hover:text-black text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                <span>Create Contract</span>
                <ArrowRight className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-xl"
              >
                View Demo
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-[#4299e1]" />
                <h3 className="text-xl font-semibold mb-2">Trustless Escrow</h3>
                <p className="text-gray-300 text-sm">
                  AI-enforced contract verification with automated payouts and asset transfers.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-[#ffd700]" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered Logic</h3>
                <p className="text-gray-300 text-sm">
                  Custom, templatized contract logic deployed without full redeploys.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 mx-auto mb-4 text-[#3182ce]" />
                <h3 className="text-xl font-semibold mb-2">Audit Ready</h3>
                <p className="text-gray-300 text-sm">
                  All logs, evidence, and outputs stored on-chain with full transparency.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#4299e1] mb-2">100%</div>
              <div className="text-gray-400 text-sm">Trustless</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#ffd700] mb-2">0%</div>
              <div className="text-gray-400 text-sm">Platform Fees</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#3182ce] mb-2">24/7</div>
              <div className="text-gray-400 text-sm">AI Monitoring</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">∞</div>
              <div className="text-gray-400 text-sm">Use Cases</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}