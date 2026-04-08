// SPDX-License-Identifier: MIT
/**
 * Helpers for interacting with `TimeboxInferenceEscrowV2` contracts.
 *
 * These contracts represent time-based service escrows where the client funds
 * up-front and the provider claims funds over time. Agent-only controls such as
 * pause/resume are intentionally omitted from this helper set.
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
import { TIMELOCKED_ESCROW_ABI } from "./timeLockedEscrowABI";

export const DEFAULT_TIMELOCKED_ARBITRATION_ADDRESS: Address = "0x259829717EbCe11350c37CB9B5d8f38Cb42E0988";
export const DEFAULT_TIMELOCKED_DEFI_VAULT_ADDRESS: Address = "0xa570E01A19A4bE995f5A27498b22eC6CbC2F1283";

export interface TimeLockedEscrowSummary {
  address: Address;
  client: Address;
  provider: Address;
  agent: Address;
  arbitrationContract: Address;
  durationSeconds: bigint;
  accumulatedPausedSeconds: bigint;
  startTimestamp: bigint;
  lastClaimedTimestamp: bigint;
  fundedAmount: bigint;
  fundedAmountFormatted: string;
  vaultBalance: bigint;
  vaultBalanceFormatted: string;
  escrowBalance: bigint;
  escrowBalanceFormatted: string;
  paused: boolean;
  pausedAt: bigint;
}

/**
 * Load primary info and balances required for dashboard displays.
 */
export async function getTimeLockedEscrowSummary(
  publicClient: PublicClient,
  escrowAddress: Address
): Promise<TimeLockedEscrowSummary> {
  const [client, provider, agent, arbitration, duration, accumulatedPaused] =
    await Promise.all([
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "client",
      }) as Promise<Address>,
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "provider",
      }) as Promise<Address>,
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "agent",
      }) as Promise<Address>,
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "arbitrationContract",
      }) as Promise<Address>,
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "durationSeconds",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "accumulatedPausedSeconds",
      }) as Promise<bigint>,
    ]);

  const [startTimestamp, lastClaimedTimestamp, fundedAmount, vaultBalance] =
    await Promise.all([
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "startTimestamp",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "lastClaimedTimestamp",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "fundedAmount",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: escrowAddress,
        abi: TIMELOCKED_ESCROW_ABI,
        functionName: "vaultBalance",
      }) as Promise<bigint>,
    ]);

  const [escrowBalance, paused, pausedAt] = await Promise.all([
    publicClient.readContract({
      address: escrowAddress,
      abi: TIMELOCKED_ESCROW_ABI,
      functionName: "escrowBalance",
    }) as Promise<bigint>,
    publicClient.readContract({
      address: escrowAddress,
      abi: TIMELOCKED_ESCROW_ABI,
      functionName: "paused",
    }) as Promise<boolean>,
    publicClient.readContract({
      address: escrowAddress,
      abi: TIMELOCKED_ESCROW_ABI,
      functionName: "pausedAt",
    }) as Promise<bigint>,
  ]);

  return {
    address: escrowAddress,
    client,
    provider,
    agent,
    arbitrationContract: arbitration,
    durationSeconds: duration,
    accumulatedPausedSeconds: accumulatedPaused,
    startTimestamp,
    lastClaimedTimestamp,
    fundedAmount,
    fundedAmountFormatted: formatEther(fundedAmount),
    vaultBalance,
    vaultBalanceFormatted: formatEther(vaultBalance),
    escrowBalance,
    escrowBalanceFormatted: formatEther(escrowBalance),
    paused,
    pausedAt,
  };
}

/**
 * Client adds more time/funds (amount in POL) and optionally extends duration.
 */
export async function renewTimeLockedEscrow(
  walletClient: WalletClient,
  escrowAddress: Address,
  params: { amountPOL: string; extraSeconds: bigint }
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: TIMELOCKED_ESCROW_ABI,
    functionName: "renew",
    args: [params.extraSeconds],
    value: parseEther(params.amountPOL),
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Client funds the escrow without changing duration.
 */
export async function fundTimeLockedEscrow(
  walletClient: WalletClient,
  escrowAddress: Address,
  amountPOL: string
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: TIMELOCKED_ESCROW_ABI,
    functionName: "fund",
    value: parseEther(amountPOL),
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Client starts the service timeline (enables provider claims).
 */
export async function startTimeLockedService(
  walletClient: WalletClient,
  escrowAddress: Address
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: TIMELOCKED_ESCROW_ABI,
    functionName: "startService",
    args: [],
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Provider claims accrued payment (includes 1% bonus from vault withdrawal).
 */
export async function claimTimeLockedPayment(
  walletClient: WalletClient,
  escrowAddress: Address
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: TIMELOCKED_ESCROW_ABI,
    functionName: "claim",
    args: [],
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Any party (client/freelancer/agent) can escalate; useful for UI flows.
 */
export async function openTimeLockedArbitration(
  walletClient: WalletClient,
  escrowAddress: Address
): Promise<Hash> {
  return walletClient.writeContract({
    address: escrowAddress,
    abi: TIMELOCKED_ESCROW_ABI,
    functionName: "openArbitration",
    args: [],
    account: walletClient.account,
    chain: undefined,
  });
}

/**
 * Compute off-chain claimable amount estimate for display.
 */
export async function estimateClaimableAmount(
  publicClient: PublicClient,
  escrowAddress: Address,
  referenceTimestamp?: number
): Promise<{ claimableWei: bigint; claimableFormatted: string }> {
  const summary = await getTimeLockedEscrowSummary(publicClient, escrowAddress);
  if (summary.startTimestamp === BigInt(0)) {
    return { claimableWei: BigInt(0), claimableFormatted: "0" };
  }

  const now = BigInt(referenceTimestamp ?? Math.floor(Date.now() / 1000));
  const effectiveNow = summary.paused
    ? summary.pausedAt
    : now > summary.startTimestamp
      ? now
      : summary.startTimestamp;

  const endTime =
    summary.startTimestamp + summary.durationSeconds + summary.accumulatedPausedSeconds;
  const cappedNow = effectiveNow > endTime ? endTime : effectiveNow;
  if (cappedNow <= summary.lastClaimedTimestamp) {
    return { claimableWei: BigInt(0), claimableFormatted: "0" };
  }

  const elapsed = cappedNow - summary.lastClaimedTimestamp;
  if (elapsed === BigInt(0) || summary.durationSeconds === BigInt(0)) {
    return { claimableWei: BigInt(0), claimableFormatted: "0" };
  }

  let claimable = (summary.fundedAmount * elapsed) / summary.durationSeconds;
  if (claimable > summary.vaultBalance) {
    claimable = summary.vaultBalance;
  }

  return {
    claimableWei: claimable,
    claimableFormatted: formatEther(claimable),
  };
}

export async function waitForTimeLockedReceipt(
  publicClient: PublicClient,
  hash: Hash
): Promise<TransactionReceipt> {
  return publicClient.waitForTransactionReceipt({ hash });
}
