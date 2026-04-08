"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Code,
  Globe,
  Gamepad2,
  Music,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const useCases = [
  {
    id: 1,
    title: "Freelance Milestone Contracts",
    description: "Automated milestone payouts without Upwork or Fiverr fees. AI validates work completion and releases payments.",
    icon: Code,
    color: "from-[#4299e1] to-[#3182ce]",
    features: ["GitHub integration", "Milestone tracking", "Automated payouts", "Zero platform fees"],
    innovation: "Automated milestone validation with web/code/file proofs"
  },
  {
    id: 2,
    title: "Domain/Asset Swaps",
    description: "Safe, peer-to-peer domain transfers without costly brokers. Agent-controlled verification and registry status checks.",
    icon: Globe,
    color: "from-[#10b981] to-[#059669]",
    features: ["Registry verification", "Escrow protection", "Instant transfers", "Oracle integration"],
    innovation: "TEE-owned accounts for seamless asset transfers"
  },
  {
    id: 3,
    title: "Peer-to-Peer Wagers",
    description: "Trustless online betting with transparent outcome verification. Create social wagers for anything verifiable online.",
    icon: Gamepad2,
    color: "from-[#f59e0b] to-[#d97706]",
    features: ["Social betting", "Oracle verification", "Pooled stakes", "Template rewards"],
    innovation: "Extensible wager templates with shareable logic"
  },
  {
    id: 4,
    title: "Digital Licensing/Royalties",
    description: "Programmable license management with autoPOL royalty distribution. Handle access, usage tracking, and payments.",
    icon: Music,
    color: "from-[#8b5cf6] to-[#7c3aed]",
    features: ["Usage tracking", "Royalty streams", "Access control", "Cross-market enforcement"],
    innovation: "Programmable license logic with audit trails"
  },
  {
    id: 5,
    title: "NFT/Asset Rentals",
    description: "Time-based asset lending with automated access management. Secure borrowing and lending with guaranteed returns.",
    icon: Smartphone,
    color: "from-[#ef4444] to-[#dc2626]",
    features: ["Time-based access", "Automated returns", "Clawback protection", "Digital property support"],
    innovation: "Programmable access management for any digital asset"
  }
];

export default function UseCasesSection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/create');
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#2d3748] to-[#1a2332]">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border-0 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Hero Use Cases
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Pakt Enables
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              From freelance contracts to digital licensing, Pakt transforms how we handle digital agreements.
              Experience trustless escrow, AI-enforced verification, and automated settlements.
            </p>
          </div>

          {/* Use Cases Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;

              return (
                <Card key={useCase.id} className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${useCase.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Features */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-[#4299e1] mb-2">Key Features:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {useCase.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-[#10b981]" />
                            <span className="text-xs text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Innovation */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <h4 className="text-sm font-semibold text-[#ffd700] mb-1">Innovation:</h4>
                      <p className="text-xs text-gray-300">{useCase.innovation}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Use Cases */}
          <div className="bg-gradient-to-r from-[#1a2332]/80 to-[#2d3748]/80 rounded-2xl p-8 border border-white/20 mb-16">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">
              And Many More Possibilities...
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="text-gray-300">
                <div className="text-lg font-semibold text-[#4299e1] mb-1">Business</div>
                <div className="text-sm">API quotas, SaaS subscriptions, group fundraising</div>
              </div>
              <div className="text-gray-300">
                <div className="text-lg font-semibold text-[#10b981] mb-1">Gaming & Events</div>
                <div className="text-sm">Gaming rewards, hackathon bounties, event ticketing</div>
              </div>
              <div className="text-gray-300">
                <div className="text-lg font-semibold text-[#f59e0b] mb-1">Education & Data</div>
                <div className="text-sm">Learning credentials, data exchange, influencer marketing</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-[#4299e1]/20 to-[#3182ce]/20 rounded-2xl p-8 border border-white/20">
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Build Your First Autonomous Agreement?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Join the future of digital collaboration. Create trustless, AI-enforced contracts in minutes.
              </p>
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-[#4299e1] to-[#3182ce] hover:from-[#ffd700] hover:to-[#f6ad55] hover:text-black text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg mx-auto"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}