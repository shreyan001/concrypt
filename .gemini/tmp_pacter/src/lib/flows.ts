// Flow definitions for the /create page workflows

import { FlowType } from './types';

export const INFORMATION_FLOW = [
  "Identity Selected",
  "Project Details Entered", 
  "Deliverables Defined",
  "Payment Terms Set",
  "Review Contract",
  "Contract Created"
] as const;

export const EXECUTION_FLOW = [
  "Signatures Pending",
  "Escrow Deposited", 
  "Work in Progress",
  "Submission",
  "Review",
  "Payment Approved",
  "Contract Completed"
] as const;

export type FlowStage = typeof INFORMATION_FLOW[number] | typeof EXECUTION_FLOW[number];

// Flow metadata for UI display
export const FLOW_METADATA = {
  info: {
    title: "Information Collection",
    description: "Gathering project details and generating contract draft",
    stages: INFORMATION_FLOW,
    stageDescriptions: {
      "Identity Selected": "Capture who is initiating the contract along with verified contact and wallet details.",
      "Project Details Entered": "Collect scope, timeline, and contextual notes for the build.",
      "Deliverables Defined": "Lay out milestones and submission checkpoints the agent will track.",
      "Payment Terms Set": "Confirm payment amount plus escrow type, arbitration partner, and vault opt-in preference.",
      "Review Contract": "Preview the compiled contract with monitoring targets before deployment.",
      "Contract Created": "Finalize generation and move the agreement to signing and escrow setup."
    },
    color: "blue"
  },
  execution: {
    title: "Contract Execution", 
    description: "Managing contract lifecycle from signatures to completion",
    stages: EXECUTION_FLOW,
    stageDescriptions: {
      "Signatures Pending": "Await signatures while routing escrow preferences into the deployment plan.",
      "Escrow Deposited": "Fund escrow and optionally park balances in the insured vault.",
      "Work in Progress": "Monitor milestone execution alongside any live service SLAs.",
      "Submission": "Review deliverable uploads and verification artifacts.",
      "Review": "Validate outcomes, arbitration hooks, and monitoring alerts before approval.",
      "Payment Approved": "Release funds per escrow logic including vault yield reconciliation.",
      "Contract Completed": "Close out the agreement and archive monitoring data."
    },
    color: "green"
  }
} as const;

// Helper functions
export function getStageIndex(stage: FlowStage, flowType: FlowType): number {
  const stages = flowType === "info" ? INFORMATION_FLOW : EXECUTION_FLOW;
  return stages.findIndex(s => s === stage);
}

export function getNextStage(currentStage: FlowStage, flowType: FlowType): FlowStage | null {
  const stages = flowType === "info" ? INFORMATION_FLOW : EXECUTION_FLOW;
  const currentIndex = getStageIndex(currentStage, flowType);
  
  if (currentIndex === -1 || currentIndex >= stages.length - 1) {
    return null;
  }
  
  return stages[currentIndex + 1] as FlowStage;
}

export function getPreviousStage(currentStage: FlowStage, flowType: FlowType): FlowStage | null {
  const stages = flowType === "info" ? INFORMATION_FLOW : EXECUTION_FLOW;
  const currentIndex = getStageIndex(currentStage, flowType);
  
  if (currentIndex <= 0) {
    return null;
  }
  
  return stages[currentIndex - 1] as FlowStage;
}