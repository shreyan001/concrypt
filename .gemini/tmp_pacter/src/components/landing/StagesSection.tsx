"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  FileText,
  Cpu,
  Settings,
  Database,
  CheckCircle,
  DollarSign,
  ArrowRight
} from 'lucide-react';

const stages = [
  {
    id: 1,
    title: "User Starts Chat",
    description: "Contract terms, assets, and milestones are gathered conversationally through our AI interface.",
    icon: MessageSquare,
    color: "from-[#4299e1] to-[#3182ce]",
    details: ["Natural language input", "Smart term extraction", "Interactive clarification"]
  },
  {
    id: 2,
    title: "Template Selection",
    description: "The best-fit agent template is chosen: Freelance, Wager, Domain Swap, License, or Rental.",
    icon: FileText,
    color: "from-[#3182ce] to-[#2b6cb0]",
    details: ["AI-powered matching", "Custom templates", "Flexible configurations"]
  },
  {
    id: 3,
    title: "INFT Instantiation",
    description: "ERC-7857 INFT created with dynamic, encrypted agent metadata for secure execution.",
    icon: Cpu,
    color: "from-[#2b6cb0] to-[#1e40af]",
    details: ["Blockchain deployment", "Encrypted metadata", "Upgradeable logic"]
  },
  {
    id: 4,
    title: "Agent Provisioning",
    description: "TEE-secured credentials and tools are provisioned with linked wallet functionality.",
    icon: Settings,
    color: "from-[#1e40af] to-[#1d4ed8]",
    details: ["TEE security", "Credential management", "Wallet integration"]
  },
  {
    id: 5,
    title: "Evidence Logging",
    description: "Every artifact is logged to filecoin storage with Merkle proofs for complete transparency.",
    icon: Database,
    color: "from-[#1d4ed8] to-[#2563eb]",
    details: ["Immutable storage", "Merkle proofs", "Audit trails"]
  },
  {
    id: 6,
    title: "Verification & Enforcement",
    description: "AI agent validates evidence and enforces logic—all TEE-verifiable via POL Compute.",
    icon: CheckCircle,
    color: "from-[#2563eb] to-[#3b82f6]",
    details: ["Automated validation", "TEE verification", "Smart enforcement"]
  },
  {
    id: 7,
    title: "Settlement",
    description: "Funds and assets are auto-released; the INFT lifecycle continues for reuse or transfer.",
    icon: DollarSign,
    color: "from-[#3b82f6] to-[#4299e1]",
    details: ["AutoPOL settlement", "Asset release", "Lifecycle management"]
  }
];

export default function StagesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#1a202c] to-[#2d3748]">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-[#ffd700] to-[#f6ad55] text-black border-0 px-4 py-2">
              Process Flow
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How Pakt Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From conversation to settlement, experience the future of programmable trust through our 7-stage process.
            </p>
          </div>

          {/* Stages Grid */}
          <div className="space-y-8">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isEven = index % 2 === 0;

              return (
                <div key={stage.id} className={`flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'} gap-8`}>
                  {/* Stage Card */}
                  <div className="flex-1">
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-2">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stage.color} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <Badge variant="outline" className="text-[#4299e1] border-[#4299e1] mb-2">
                              Stage {stage.id}
                            </Badge>
                            <CardTitle className="text-xl">{stage.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-4 leading-relaxed">
                          {stage.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {stage.details.map((detail, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-white/10 text-gray-300 border-0">
                              {detail}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Connector Arrow */}
                  {index < stages.length - 1 && (
                    <div className="hidden md:flex items-center justify-center">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${stage.color} flex items-center justify-center shadow-lg`}>
                        <ArrowRight className={`w-8 h-8 text-white ${isEven ? '' : 'rotate-180'}`} />
                      </div>
                    </div>
                  )}

                  {/* Stage Number (Mobile) */}
                  <div className="md:hidden">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stage.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {stage.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-[#4299e1]/20 to-[#3182ce]/20 rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Experience Programmable Trust?
              </h3>
              <p className="text-gray-300 mb-6">
                Start your first autonomous agreement in minutes, not days.
              </p>
              <div className="flex justify-center">
                <Badge className="bg-gradient-to-r from-[#ffd700] to-[#f6ad55] text-black px-6 py-2 text-sm font-semibold">
                  Build on trust, not on hope
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}