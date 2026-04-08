// Shared TypeScript types for the /create page

import { FlowStage } from './flows';

// Flow type definition
export type FlowType = "info" | "execution";

// Graph state interface for AI graph integration
export interface GraphState {
  stage?: string;
  currentFlowStage?: FlowStage;
  stageIndex?: number;
  progress?: number;
  isStageComplete?: boolean;
  nextStage?: FlowStage | null;
  validationErrors?: string[];
  formData?: any;
  contractId?: string;
  contractData?: any;
  data?: any;
  missingFields?: string[];
  confirmed?: boolean;
  operation?: string;
  result?: string;
  messages?: string[];
  stageData?: any;
  collectedFields?: {
    projectName?: boolean;
    clientName?: boolean;
    email?: boolean;
    paymentAmount?: boolean;
    projectDescription?: boolean;
    deadline?: boolean;
  };
  // POL Compute Integration
  inferenceReady?: boolean;
  collectedData?: CollectedContractData;
}

// Chat message types
export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  quickActions?: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  value: string;
  type: 'button' | 'select';
  options?: string[];
}

// Flow state management
export interface FlowState {
  currentFlow: FlowType;
  currentStage: number;
  stageData: Record<string, any>;
  isTransitioning: boolean;
}

// Stage status for visual representation
export type StageStatus = 'completed' | 'active' | 'pending';

export interface StageNodeProps {
  stage: FlowStage;
  status: StageStatus;
  index: number;
  isLast?: boolean;
  description?: string;
}

// Chat component props
export interface CreateChatProps {
  flowType: FlowType;
  currentStage: number;
  setCurrentStage: (stage: number) => void;
  onStageDataUpdate?: (data: any) => void;
  onGraphStateUpdate?: (graphState: GraphState, progress: number) => void;
}

// Diagram component props
export interface CreateDiagramProps {
  flowType: FlowType;
  currentStage: number;
  onStageClick?: (stageIndex: number) => void;
}

// Project data interfaces
export interface ProjectIdentity {
  userType: 'client' | 'freelancer';
  name: string;
  email: string;
  walletAddress?: string;
}

export interface ProjectDetails {
  title: string;
  description: string;
  category: string;
  estimatedDuration: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  milestonePayment: number;
}

export interface PaymentTerms {
  totalAmount: number;
  currency: 'ETH' | 'USDC' | 'DAI';
  milestones: Deliverable[];
  escrowPercentage: number;
}

export interface ContractData {
  identity: ProjectIdentity;
  project: ProjectDetails;
  deliverables: Deliverable[];
  payment: PaymentTerms;
  legalTerms?: string;
  smartContractAddress?: string;
}

// AI chat context
export interface ChatContext {
  currentQuestion: string;
  expectedInputType: 'text' | 'selection' | 'number' | 'date';
  validationRules?: any;
  nextStageCondition?: (data: any) => boolean;
}

// Component state interfaces
export interface CreatePageState {
  flowState: FlowState;
  contractData: Partial<ContractData>;
  chatHistory: Message[];
  isLoading: boolean;
  error?: string;
}

// ============================================================================
// POL Compute Integration Types
// ============================================================================

/**
 * Collected contract data from information collection phase
 * This matches the JSON structure returned by the agent
 */
export interface CollectedContractData {
  projectInfo: {
    projectName: string;
    projectDescription: string;
    timeline: string;
    deliverables: string[];
  };
  clientInfo: {
    clientName: string;
    email: string;
    walletAddress: string;
  };
  financialInfo: {
    paymentAmount: number;
    platformFees: number;
    escrowFee: number;
    totalEscrowAmount: number;
    currency: string;
    polEquivalent: number;
    feeBreakdown: {
      projectPayment: number;
      platformFee: number;
      escrowFee: number;
      total: number;
    };
  };
  escrowDetails: {
    escrowType: string;
    paymentMethod: string;
    releaseCondition: string;
    disputeResolution: string;
  };
  metadata: {
    createdAt: string;
    stage: string;
    version: string;
    platform: string;
    collectionComplete: boolean;
  };
}

/**
 * Input format for POL Compute secure inference
 */
export interface InferenceInput {
  prompt: string;
  context: CollectedContractData;
  template: string;
  verificationMode: 'TEE' | 'ZKP';
}

/**
 * Output from POL Compute secure inference
 */
export interface InferenceOutput {
  contractText: string;
  metadata: {
    generatedAt: number;
    model: string;
    verificationMode: string;
  };
  proof: VerificationProof;
}

/**
 * Verification proof from POL Compute
 */
export interface VerificationProof {
  type: 'TEE' | 'ZKP';
  hash: string;
  signature: string;
  timestamp: number;
  details: any;
}

/**
 * Props for InferenceView component
 */
export interface InferenceViewProps {
  collectedData: CollectedContractData | null;
  inferenceResult: string | null;
  verificationProof: VerificationProof | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}
