/**
 * Contract Service
 * 
 * Handles contract generation and backend upload for Polygon network
 */

import { CollectedContractData, InferenceInput } from '@/lib/types';
import { generateIndianFreelanceContract } from '@/lib/contracts/contractGenerator';
import { generateOrderHash } from '@/lib/contracts/orderHash';
// OGComputeService removed - causes Next.js build issues with child_process

export interface ContractCreationResult {
  success: boolean;
  contractId: string;
  contractHash: string;
  contractText: string;
  verificationProof?: any;
  error?: string;
}

/**
 * Create a contract from collected data
 * This orchestrates the entire contract creation flow
 */
export async function createContract(
  collectedData: CollectedContractData
): Promise<ContractCreationResult> {
  try {
    console.log('Starting contract creation...', collectedData);

    // Step 1: Generate contract hash (order ID)
    const contractHash = generateOrderHash(
      collectedData.clientInfo.walletAddress as `0x${string}`,
      '0x0000000000000000000000000000000000000000' as `0x${string}` // Freelancer TBD
    );

    // Step 2: Generate SIMPLE base contract (without crypto/escrow clauses)
    const { generateSimpleContract } = await import('@/lib/contracts/contractGenerator');
    const baseLegalContract = generateSimpleContract(collectedData);

    // Step 3: Use simple contract (user can enhance it later)
    const finalContractText = baseLegalContract;
    const verificationProof = null;

    console.log('Using simple contract template (user can enhance with crypto/escrow clauses)');
    // Note: Enhanced version with crypto/escrow clauses can be added via "Enhance Contract" button

    // Step 4: Prepare backend data
    const contractData = prepareBackendData(
      collectedData,
      contractHash,
      finalContractText,
      verificationProof
    );

    // Step 5: Upload to backend
    const contractId = await uploadToBackend(contractData);

    return {
      success: true,
      contractId,
      contractHash,
      contractText: finalContractText,
      verificationProof
    };

  } catch (error) {
    console.error('Contract creation failed:', error);
    return {
      success: false,
      contractId: '',
      contractHash: '',
      contractText: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Prepare data in backend format
 */
function prepareBackendData(
  collectedData: CollectedContractData,
  contractHash: string,
  contractText: string,
  verificationProof: any
) {
  const now = new Date().toISOString();

  return {
    id: `contract_${Date.now()}`,
    contractHash,
    name: `${collectedData.projectInfo.projectName} Contract`,
    projectType: 'freelance_project',
    description: collectedData.projectInfo.projectDescription,

    currentStage: 'Signatures Pending',
    flowType: 'execution',

    jurisdiction: {
      country: 'India',
      countryCode: 'IN',
      legalFramework: 'Indian Contract Act, 1872',
      disputeResolution: 'Indian Courts/Arbitration',
      applicableLaws: [
        'Indian Contract Act',
        'Information Technology Act',
        'Goods and Services Tax Act'
      ],
      timezone: 'Asia/Kolkata'
    },

    parties: {
      client: {
        name: collectedData.clientInfo.clientName,
        email: collectedData.clientInfo.email,
        walletAddress: collectedData.clientInfo.walletAddress,
        role: 'CLIENT',
        location: {
          country: 'India',
          state: '',
          city: ''
        }
      },
      freelancer: {
        name: 'To Be Determined',
        email: '',
        walletAddress: '0x0000000000000000000000000000000000000000',
        role: 'FREELANCER',
        skills: [],
        location: {
          country: 'India',
          state: '',
          city: ''
        }
      }
    },

    signatures: {
      client: {
        signed: false,
        signedAt: null,
        signature: null
      },
      freelancer: {
        signed: false,
        signedAt: null,
        signature: null
      },
      bothSigned: false
    },

    escrow: {
      amounts: {
        inr: {
          totalAmount: collectedData.financialInfo.totalEscrowAmount.toString(),
          currency: collectedData.financialInfo.currency,
          exchangeRateAt: now,
          exchangeRate: '1.00'
        },
        'POL': {
          totalAmount: collectedData.financialInfo.polEquivalent.toString(),
          currency: 'POL',
          network: 'polygon-amoy-testnet'
        }
      },
      contractAddress: '0x0000000000000000000000000000000000000000',

      deposit: {
        deposited: false,
        depositedAmount: '0',
        depositedAt: null,
        transactionHash: null
      },

      fees: {
        platformFee: {
          inr: collectedData.financialInfo.platformFees.toString(),
          POL: Math.floor(collectedData.financialInfo.platformFees / 10).toString()
        },
        storageFee: {
          inr: collectedData.financialInfo.escrowFee.toString(),
          POL: Math.floor(collectedData.financialInfo.escrowFee / 10).toString()
        },
        totalFees: {
          inr: (collectedData.financialInfo.platformFees + collectedData.financialInfo.escrowFee).toString(),
          POL: Math.floor((collectedData.financialInfo.platformFees + collectedData.financialInfo.escrowFee) / 10).toString()
        }
      }
    },

    storage: {
      contractDocument: {
        rootHash: contractHash,
        fileName: `${collectedData.projectInfo.projectName.replace(/\s+/g, '_')}_contract.pdf`,
        uploadedAt: now,
        uploadedBy: collectedData.clientInfo.walletAddress,
        fileSize: `${Math.ceil(contractText.length / 1024)}KB`
      }
    },

    projectDetails: {
      deliverables: collectedData.projectInfo.deliverables,
      timeline: collectedData.projectInfo.timeline,
      startDate: now.split('T')[0],
      endDate: calculateEndDate(collectedData.projectInfo.timeline)
    },

    legalContract: {
      contractText,
      generatedAt: now,
      generatedBy: verificationProof ? 'POL_Compute_TEE' : 'Pakt_Generator',
      storageRootHash: contractHash,
      verificationProof: verificationProof || {
        type: 'NONE',
        hash: contractHash,
        timestamp: now
      }
    },

    milestones: [],
    currentMilestone: null,

    // Agent info (for AI verification - no longer uses iNFT)
    agentInfo: {
      verificationEnabled: true,
      lastAction: null
    },

    stageHistory: [
      {
        stage: 'Information Collection',
        timestamp: collectedData.metadata.createdAt,
        triggeredBy: 'user',
        note: 'User provided project details'
      },
      {
        stage: 'Contract Generated',
        timestamp: now,
        triggeredBy: 'system',
        note: 'Legal contract generated'
      },
      {
        stage: 'Signatures Pending',
        timestamp: now,
        triggeredBy: 'system',
        note: 'Contract created and awaiting signatures'
      }
    ],

    shareableLink: '',
    createdAt: now,
    lastUpdated: now,
    status: 'ACTIVE'
  };
}

/**
 * Calculate end date from timeline string
 */
function calculateEndDate(timeline: string): string {
  const now = new Date();

  // Parse timeline (e.g., "2 weeks", "30 days", "1 month")
  const match = timeline.match(/(\d+)\s*(day|week|month)/i);

  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('day')) {
      now.setDate(now.getDate() + value);
    } else if (unit.startsWith('week')) {
      now.setDate(now.getDate() + (value * 7));
    } else if (unit.startsWith('month')) {
      now.setMonth(now.getMonth() + value);
    }
  } else {
    // Default to 30 days
    now.setDate(now.getDate() + 30);
  }

  return now.toISOString().split('T')[0];
}

/**
 * Upload contract data to backend
 */
async function uploadToBackend(contractData: any): Promise<string> {
  try {
    console.log('Uploading contract to backend...', contractData.id);

    const response = await fetch('/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contractData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend upload failed:', response.status, errorText);
      throw new Error(`Backend upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Contract uploaded to backend successfully:', result);

    if (!result.success) {
      throw new Error('Backend returned success: false');
    }

    return contractData.id;
  } catch (error) {
    console.error('Backend upload error:', error);
    throw error; // Don't swallow the error - let it propagate
  }
}
