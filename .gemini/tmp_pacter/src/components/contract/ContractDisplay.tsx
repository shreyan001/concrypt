'use client'

import React from 'react'

import { FileText, DollarSign, Scale, MapPin, Calendar } from 'lucide-react'

interface ContractDisplayProps {
    contract: any
}

export default function ContractDisplay({ contract }: ContractDisplayProps) {
    if (!contract) return null

    return (
        <div className="space-y-3 text-xs">
            {/* Contract Header */}
            <div className="bg-slate-700/80 rounded-lg p-3 border border-slate-600/30">
                <h3 className="font-semibold text-slate-100 mb-2">{contract.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>
                        <span className="text-slate-500">Contract ID:</span>
                        <p className="text-[10px] break-all text-slate-300">{contract.id}</p>
                    </div>
                    <div>
                        <span className="text-slate-500">Status:</span>
                        <p className="text-slate-300">{contract.status}</p>
                    </div>
                </div>
                <p className="mt-2 text-slate-400">{contract.description}</p>
            </div>

            {/* Parties Information */}
            <div className="bg-slate-700/80 rounded-lg p-3 border border-slate-600/30">
                <h4 className="font-semibold mb-2 text-slate-100">Parties</h4>
                <div className="grid grid-cols-2 gap-3">
                    {/* Client */}
                    <div className="p-2 bg-slate-800/50 rounded border border-slate-600/20">
                        <h5 className="font-semibold mb-1 text-blue-400">Client</h5>
                        <div className="space-y-0.5 text-slate-400">
                            <p className="text-slate-300">{contract.parties.client.name}</p>
                            <p className="text-slate-400">{contract.parties.client.email}</p>
                            <p className="text-[10px] break-all text-slate-500">{contract.parties.client.walletAddress}</p>
                            {contract.parties.client.location && (
                                <div className="flex items-center gap-1 text-slate-400 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{contract.parties.client.location.city || contract.parties.client.location.country}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Freelancer */}
                    <div className="p-2 bg-slate-800/50 rounded border border-slate-600/20">
                        <h5 className="font-semibold mb-1 text-purple-400">Freelancer</h5>
                        <div className="space-y-0.5 text-slate-400">
                            <p className="text-slate-300">{contract.parties.freelancer.name || 'To Be Determined'}</p>
                            <p className="text-slate-400">{contract.parties.freelancer.email || 'Pending'}</p>
                            {contract.parties.freelancer.walletAddress && contract.parties.freelancer.walletAddress !== '0x0000000000000000000000000000000000000000' && (
                                <p className="text-[10px] break-all text-slate-500">{contract.parties.freelancer.walletAddress}</p>
                            )}
                            {contract.parties.freelancer.location && (
                                <div className="flex items-center gap-1 text-slate-400 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{contract.parties.freelancer.location.city || contract.parties.freelancer.location.country}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Details */}
            <div className="bg-slate-700/80 rounded-lg p-3 border border-slate-600/30">
                <h4 className="font-semibold mb-2 text-slate-100 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Financial Details
                </h4>
                <div className="space-y-2 text-slate-400">
                    <div className="flex justify-between">
                        <span>Total Amount (INR):</span>
                        <span className="text-slate-200 font-semibold">₹{contract.escrow.amounts.inr.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total Amount (POL):</span>
                        <span className="text-slate-200 font-semibold">{contract.escrow.amounts['POL']?.totalAmount || 'N/A'} POL</span>
                    </div>
                    <div className="pt-2 border-t border-slate-600/30">
                        <p className="text-slate-500 mb-1">Fee Breakdown:</p>
                        <div className="space-y-1 pl-2">
                            <div className="flex justify-between">
                                <span>Platform Fee:</span>
                                <span>₹{contract.escrow.fees.platformFee.inr}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Storage Fee:</span>
                                <span>₹{contract.escrow.fees.storageFee.inr}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-slate-300 pt-1 border-t border-slate-600/20">
                                <span>Total Fees:</span>
                                <span>₹{contract.escrow.fees.totalFees.inr}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Details */}
            <div className="bg-slate-700/80 rounded-lg p-3 border border-slate-600/30">
                <h4 className="font-semibold mb-2 text-slate-100 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Project Details
                </h4>
                <div className="space-y-2 text-slate-400">
                    <div>
                        <span className="text-slate-500">Timeline:</span>
                        <span className="text-slate-300 ml-1">{contract.projectDetails.timeline}</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-500">Start:</span>
                            <span className="text-slate-300">{new Date(contract.projectDetails.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-500">End:</span>
                            <span className="text-slate-300">{new Date(contract.projectDetails.endDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Deliverables:</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-2">
                            {contract.projectDetails.deliverables.map((item: string, idx: number) => (
                                <li key={idx} className="text-slate-300">{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Jurisdiction & Legal */}
            {contract.jurisdiction && (
                <div className="bg-slate-700/80 rounded-lg p-3 border border-slate-600/30">
                    <h4 className="font-semibold mb-2 text-slate-100 flex items-center gap-1">
                        <Scale className="w-4 h-4" />
                        Jurisdiction & Legal Framework
                    </h4>
                    <div className="space-y-2 text-slate-400">
                        <div>
                            <span className="text-slate-500">Country:</span>
                            <span className="text-slate-300 ml-1">{contract.jurisdiction.country}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Legal Framework:</span>
                            <p className="text-slate-300 mt-0.5">{contract.jurisdiction.legalFramework}</p>
                        </div>
                        <div>
                            <span className="text-slate-500">Dispute Resolution:</span>
                            <p className="text-slate-300 mt-0.5">{contract.jurisdiction.disputeResolution}</p>
                        </div>
                        {contract.jurisdiction.applicableLaws && contract.jurisdiction.applicableLaws.length > 0 && (
                            <div>
                                <p className="text-slate-500 mb-1">Applicable Laws:</p>
                                <ul className="list-disc list-inside space-y-0.5 pl-2">
                                    {contract.jurisdiction.applicableLaws.map((law: string, idx: number) => (
                                        <li key={idx} className="text-slate-300">{law}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Legal Contract Text */}
            {contract.legalContract && contract.legalContract.contractText && (
                <div className="bg-slate-700/80 rounded-lg p-3 border border-slate-600/30">
                    <h4 className="font-semibold mb-2 text-slate-100">Legal Contract</h4>
                    <div className="bg-slate-800/50 rounded p-2 max-h-64 overflow-y-auto border border-slate-600/20">
                        <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-mono">
                            {contract.legalContract.contractText}
                        </pre>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500">
                        <p>Generated: {new Date(contract.legalContract.generatedAt).toLocaleString()}</p>
                        <p>By: {contract.legalContract.generatedBy}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
