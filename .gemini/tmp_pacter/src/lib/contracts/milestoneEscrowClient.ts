// SPDX-License-Identifier: MIT
/**
 * Frontend helpers for interacting with `MilestoneEscrow` contracts.
 *
 * Contracts are instantiated dynamically with addresses fetched from the backend.
 * Functions here cover client and freelancer flows (agent-only actions such as
 * pausing or verification management are deliberately excluded).
 */

import {
  type Address,
  type Hash,
  type PublicClient,
  type TransactionReceipt,
  type WalletClient,
  formatEther,
  parseEther,
} from "viem";
import {
  MILESTONE_ESCROW_ABI,
  MilestoneEscrowState,
} from "./milestoneEscrowABI";

export const DEFAULT_ARBITRATION_ADDRESS: Address = "0x259829717EbCe11350c37CB9B5d8f38Cb42E0988";
export const DEFAULT_DEFI_VAULT_ADDRESS: Address = "0xa570E01A19A4bE995f5A27498b22eC6CbC2F1283";

export interface MilestoneInfo {
  id: number;
  amount: bigint;
  amountFormatted: string;
  description: string;
  verifiedByAgent: boolean;
  clientApproved: boolean;
  paid: boolean;
  verificationHash: string;
}

export interface MilestoneEscrowSummary {
  address: Address;
  client: Address;
  freelancer: Address;
  agent: Address;
  arbitrationContract: Address;
  storageFee: bigint;
  storageFeeFormatted: string;
  state: MilestoneEscrowState;
  milestones: MilestoneInfo[];
  vaultBalance: bigint;
  vaultBalanceFormatted: string;
  contractBalance: bigint;
  contractBalanceFormatted: string;
}

/**
 * Read core metadata and balances from a `MilestoneEscrow` instance.
 */
export async function getMilestoneEscrowSummary(
  publicClient: PublicClient,
  escrowAddress: Address
): Promise<MilestoneEscrowSummary> {
  const [client, freelancer, agent, arbitration, storageFee, stateRaw] =
    await Promise.all([
      publicClient.readContract({
        address: escrowAddress,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "client",
      }) as Promise<Address>,
      publicClient.readContract({
        address: escrowAddress,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "freelancer",
      }) as Promise<Address>,
      publicClient.readContract({
        address: escrowAddress,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "agent",
      }) as Promise<Address>,
      publicClient.readContract({
        address: escrowAddress,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "arbitrationContract",
      }) as Promise<Address>,
      publicClient.readContract({
        address: escrowAddress,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "storageFee",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: escrowAddress,
        abi: MILESTONE_ESCROW_ABI,
        functionName: "state",
      }) as Promise<number>,
    ]);

  const [vaultBalance, contractBalance, milestones] = await Promise.all([
    publicClient.readContract({
      address: escrowAddress,
      abi: MILESTONE_ESCROW_ABI,
      functionName: "vaultBalanceOfEscrow",
    }) as Promise<bigint>,
    publicClient.readContract({
      address: escrowAddress,
      abi: MILESTONE_ESCROW_ABI,
      functionName: "contractBalance",
    }) as Promise<bigint>,
    getMilestones(publicClient, escrowAddress),
  ]);

  return {
    address: escrowAddress,
    client,
    freelancer,
    agent,
    arbitrationContract: arbitration,
    storageFee,
    storageFeeFormatted: formatEther(storageFee),
    state: stateRaw as MilestoneEscrowState,
    milestones,
    vaultBalance,
    vaultBalanceFormatted: formatEther(vaultBalance),
    contractBalance,
    contractBalanceFormatted: formatEther(contractBalance),
  };
}

/**
 * Fetch all milestone structs and format their POL amounts for UI usage.
 */
export async function getMilestones(
  publicClient: PublicClient,
  escrowAddress: Address
): Promise<MilestoneInfo[]> {
  const count = (await publicClient.readContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "milestoneCount",
  })) as bigint;

  const result: MilestoneInfo[] = [];
  const length = Number(count);
  for (let i = 0; i < length; i++) {
    const milestone = (await publicClient.readContract({
      address: escrowAddress,
      abi: MILESTONE_ESCROW_ABI,
      functionName: "milestones",
      args: [BigInt(i)],
    })) as readonly [
      bigint,
      string,
      boolean,
      boolean,
      boolean,
      string
    ];

    result.push({
      id: i,
      amount: milestone[0],
      amountFormatted: formatEther(milestone[0]),
      description: milestone[1],
      verifiedByAgent: milestone[2],
      clientApproved: milestone[3],
      paid: milestone[4],
      verificationHash: milestone[5],
    });
  }

  return result;
}

/**
 * Client-side: fund the escrow by depositing native POL.
 */
export async function fundMilestoneEscrow(
  walletClient: WalletClient,
  escrowAddress: Address,
  amountPOL: string
): Promise<Hash> {
  const value = parseEther(amountPOL);
  return walletClient.writeContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "fund",
    value,
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Client-side: append a new milestone definition before work starts.
 */
export async function addMilestone(
  walletClient: WalletClient,
  escrowAddress: Address,
  params: { amountPOL: string; description: string }
): Promise<Hash> {
  const amountWei = parseEther(params.amountPOL);
  return walletClient.writeContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "addMilestone",
    args: [amountWei, params.description],
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Agent already verified milestone; client now approves payout.
 */
export async function approveMilestone(
  walletClient: WalletClient,
  escrowAddress: Address,
  milestoneId: number
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "approveMilestone",
    args: [BigInt(milestoneId)],
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Freelancer-side: withdraw an approved milestone (including 1% vault bonus).
 */
export async function claimMilestone(
  walletClient: WalletClient,
  escrowAddress: Address,
  milestoneId: number
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "claimMilestone",
    args: [BigInt(milestoneId)],
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Either client or freelancer can escalate to dispute.
 */
export async function openMilestoneDispute(
  walletClient: WalletClient,
  escrowAddress: Address
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "openDispute",
    args: [],
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Pushes remaining funds to the arbitration contract (DISPUTED state only).
 */
export async function sendMilestoneEscrowToArbitration(
  walletClient: WalletClient,
  escrowAddress: Address
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "sendToArbitration",
    args: [],
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Helper: wait for a milestone-related transaction to finalize.
 */
export async function waitForMilestoneReceipt(
  publicClient: PublicClient,
  hash: Hash
): Promise<TransactionReceipt> {
  return publicClient.waitForTransactionReceipt({ hash });
}

/**
 * Fetch only the current state enum.
 */
export async function getMilestoneEscrowState(
  publicClient: PublicClient,
  escrowAddress: Address
): Promise<MilestoneEscrowState> {
  const state = (await publicClient.readContract({
    address: escrowAddress,
    abi: MILESTONE_ESCROW_ABI,
    functionName: "state",
  })) as number;
  return state as MilestoneEscrowState;
}
