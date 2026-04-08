/**
 * Pakt Escrow Client - Frontend Contract Interactions
 *
 * This module provides Viem-based functions for interacting with the
 * PaktEscrowV2 smart contract from the frontend.
 */

import {
  type WalletClient,
  type PublicClient,
  type Hash,
  type Address,
  parseEther,
  formatEther,
  type TransactionReceipt,
} from "viem";
import { Pakt_ABI, OrderState } from "./paktABI";
import { getContractAddress, TX_CONFIG } from "./config";

/**
 * Parameters for creating an escrow order
 */
export interface CreateOrderParams {
  orderHash: Hash; // Fetched from backend
  freelancerAddress: Address;
  escrowAmount: string; // in POL tokens (e.g., "1.5")
  projectName: string;
}

/**
 * Order details returned from the contract
 */
export interface Order {
  orderHash: Hash;
  initiator: Address;
  freelancer: Address;
  escrowAmount: bigint;
  projectName: string;
  currentState: OrderState;
  createdTimestamp: bigint;
  verifiedTimestamp: bigint;
  completedTimestamp: bigint;
  verificationDetails: string;
}

/**
 * Formatted order details for display
 */
export interface FormattedOrder
  extends Omit<
    Order,
    | "escrowAmount"
    | "createdTimestamp"
    | "verifiedTimestamp"
    | "completedTimestamp"
  > {
  escrowAmount: string; // Formatted as string
  totalAmount: string;
  createdTimestamp: number;
  verifiedTimestamp: number;
  completedTimestamp: number;
  createdAt: Date;
  verifiedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Create and fund an escrow order on the blockchain
 *
 * This function is called by the client after both parties have signed the contract.
 * The orderHash should be fetched from the backend API first.
 *
 * @param walletClient - Viem wallet client from the user's connected wallet
 * @param params - Order parameters including orderHash from backend
 * @returns Transaction hash
 *
 * @example
 * ```typescript
 * const txHash = await createAndDepositOrder(walletClient, {
 *   orderHash: '0xabc...', // From backend API
 *   freelancerAddress: '0x123...',
 *   escrowAmount: '1.5',
 *   projectName: 'Web Development Project'
 * });
 * ```
 */
export async function createAndDepositOrder(
  walletClient: WalletClient,
  params: CreateOrderParams
): Promise<Hash> {
  try {
    const {
      orderHash,
      freelancerAddress,
      escrowAmount,
      projectName,
    } = params;

    // Validate inputs
    if (
      !orderHash ||
      orderHash ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      throw new Error("Invalid order hash");
    }
    if (
      !freelancerAddress ||
      freelancerAddress === "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error("Invalid freelancer address");
    }
    if (!projectName || projectName.trim() === "") {
      throw new Error("Project name is required");
    }

    // Convert amount to wei
    const escrowWei = parseEther(escrowAmount);

    console.log("Creating escrow order:", {
      orderHash,
      freelancerAddress,
      escrowAmount: escrowAmount + " POL",
      projectName,
    });

    // Get contract address
    const contractAddress = getContractAddress();

    // Call the smart contract
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: Pakt_ABI,
      functionName: "createAndDeposit",
      args: [orderHash, freelancerAddress, escrowWei, projectName],
      value: escrowWei, // Send native POL tokens
      account: walletClient.account,
      chain: undefined, // Use wallet's current chain
    });

    console.log("Order created! Transaction hash:", hash);
    return hash;
  } catch (error: any) {
    console.error("Error creating order:", error);

    // Parse common errors
    if (error.message?.includes("insufficient funds")) {
      throw new Error(
        "Insufficient POL tokens in wallet. Please add funds and try again."
      );
    }
    if (error.message?.includes("Order already exists")) {
      throw new Error("This order has already been created on the blockchain.");
    }
    if (error.message?.includes("user rejected")) {
      throw new Error("Transaction was rejected by user.");
    }

    throw new Error(
      `Failed to create order: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Get order details from the blockchain
 *
 * @param publicClient - Viem public client
 * @param orderHash - The unique order identifier
 * @returns Order details
 *
 * @example
 * ```typescript
 * const order = await getOrderDetails(publicClient, '0xabc...');
 * console.log('Order state:', order.currentState);
 * ```
 */
export async function getOrderDetails(
  publicClient: PublicClient,
  orderHash: Hash
): Promise<Order> {
  try {
    const contractAddress = getContractAddress();

    const order = (await publicClient.readContract({
      address: contractAddress,
      abi: Pakt_ABI,
      functionName: "getOrder",
      args: [orderHash],
    })) as any;

    return {
      orderHash: order.orderHash,
      initiator: order.initiator,
      freelancer: order.freelancer,
      escrowAmount: order.escrowAmount,
      projectName: order.projectName,
      currentState: order.currentState as OrderState,
      createdTimestamp: order.createdTimestamp,
      verifiedTimestamp: order.verifiedTimestamp,
      completedTimestamp: order.completedTimestamp,
      verificationDetails: order.verificationDetails,
    };
  } catch (error: any) {
    console.error("Error fetching order:", error);

    if (error.message?.includes("Order does not exist")) {
      throw new Error(
        "Order not found on blockchain. It may not have been created yet."
      );
    }

    throw new Error(
      `Failed to get order details: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Get formatted order details for display in UI
 *
 * @param publicClient - Viem public client
 * @param orderHash - The unique order identifier
 * @returns Formatted order details
 */
export async function getFormattedOrderDetails(
  publicClient: PublicClient,
  orderHash: Hash
): Promise<FormattedOrder> {
  const order = await getOrderDetails(publicClient, orderHash);

  const escrowAmount = formatEther(order.escrowAmount);
  const totalAmount = formatEther(order.escrowAmount);

  return {
    ...order,
    escrowAmount,
    totalAmount,
    createdTimestamp: Number(order.createdTimestamp),
    verifiedTimestamp: Number(order.verifiedTimestamp),
    completedTimestamp: Number(order.completedTimestamp),
    createdAt: new Date(Number(order.createdTimestamp) * 1000),
    verifiedAt:
      order.verifiedTimestamp > BigInt(0)
        ? new Date(Number(order.verifiedTimestamp) * 1000)
        : null,
    completedAt:
      order.completedTimestamp > BigInt(0)
        ? new Date(Number(order.completedTimestamp) * 1000)
        : null,
  };
}

/**
 * Approve payment after agent verification
 *
 * This function is called by the client after reviewing the verified deliverables.
 * Can only be called when order is in VERIFIED state.
 *
 * @param walletClient - Viem wallet client
 * @param orderHash - The unique order identifier
 * @returns Transaction hash
 *
 * @example
 * ```typescript
 * const txHash = await approvePayment(walletClient, '0xabc...');
 * ```
 */
export async function approvePayment(
  walletClient: WalletClient,
  orderHash: Hash
): Promise<Hash> {
  try {
    const contractAddress = getContractAddress();

    console.log("Approving payment for order:", orderHash);

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: Pakt_ABI,
      functionName: "approvePayment",
      args: [orderHash],
      account: walletClient.account,
      chain: undefined, // Use wallet's current chain
    });

    console.log("Payment approved! Transaction hash:", hash);
    return hash;
  } catch (error: any) {
    console.error("Error approving payment:", error);

    if (error.message?.includes("Order must be verified")) {
      throw new Error(
        "Order must be verified by the agent before payment can be approved."
      );
    }
    if (error.message?.includes("Caller is not the initiator")) {
      throw new Error(
        "Only the client who created the order can approve payment."
      );
    }
    if (error.message?.includes("user rejected")) {
      throw new Error("Transaction was rejected by user.");
    }

    throw new Error(
      `Failed to approve payment: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Withdraw funds after payment approval
 *
 * This function is called by the freelancer after the client approves payment.
 * Can only be called when order is in APPROVED state.
 *
 * @param walletClient - Viem wallet client
 * @param orderHash - The unique order identifier
 * @returns Transaction hash
 *
 * @example
 * ```typescript
 * const txHash = await withdrawFunds(walletClient, '0xabc...');
 * ```
 */
export async function withdrawFunds(
  walletClient: WalletClient,
  orderHash: Hash
): Promise<Hash> {
  try {
    const contractAddress = getContractAddress();

    console.log("Withdrawing funds for order:", orderHash);

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: Pakt_ABI,
      functionName: "withdrawFunds",
      args: [orderHash],
      account: walletClient.account,
      chain: undefined, // Use wallet's current chain
    });

    console.log("Funds withdrawn! Transaction hash:", hash);
    return hash;
  } catch (error: any) {
    console.error("Error withdrawing funds:", error);

    if (error.message?.includes("Payment not approved")) {
      throw new Error(
        "Payment must be approved by the client before funds can be withdrawn."
      );
    }
    if (error.message?.includes("Caller is not the freelancer")) {
      throw new Error(
        "Only the freelancer can withdraw funds from this order."
      );
    }
    if (error.message?.includes("user rejected")) {
      throw new Error("Transaction was rejected by user.");
    }

    throw new Error(
      `Failed to withdraw funds: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Wait for a transaction to be confirmed
 *
 * @param publicClient - Viem public client
 * @param hash - Transaction hash
 * @param confirmations - Number of confirmations to wait for (default: 1)
 * @returns Transaction receipt
 *
 * @example
 * ```typescript
 * const receipt = await waitForTransaction(publicClient, txHash);
 * console.log('Transaction confirmed in block:', receipt.blockNumber);
 * ```
 */
export async function waitForTransaction(
  publicClient: PublicClient,
  hash: Hash,
  confirmations: number = 1
): Promise<TransactionReceipt> {
  try {
    console.log("Waiting for transaction confirmation:", hash);

    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
        timeout: TX_CONFIG.TIMEOUT_MS, // Use configured timeout
      });

      console.log("Transaction confirmed:", {
        blockNumber: receipt.blockNumber,
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted");
      }
      return receipt;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.warn(`Transaction ${hash} timed out after ${TX_CONFIG.TIMEOUT_MS / 1000} seconds.`);
        throw new Error(`Transaction ${hash} timed out.`);
      }
      throw error;
    }

  } catch (error: any) {
    console.error("Error waiting for transaction:", error);

    if (error.message?.includes("timeout")) {
      throw new Error(
        "Transaction confirmation timeout. Please check the block explorer."
      );
    }

    throw new Error(`Transaction failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Check if an order exists on the blockchain
 *
 * @param publicClient - Viem public client
 * @param orderHash - The unique order identifier
 * @returns True if order exists, false otherwise
 */
export async function orderExists(
  publicClient: PublicClient,
  orderHash: Hash
): Promise<boolean> {
  try {
    const order = await getOrderDetails(publicClient, orderHash);
    // If createdTimestamp is 0, order doesn't exist
    return order.createdTimestamp > BigInt(0);
  } catch (error) {
    return false;
  }
}

/**
 * Get the current state of an order
 *
 * @param publicClient - Viem public client
 * @param orderHash - The unique order identifier
 * @returns Current order state
 */
export async function getOrderState(
  publicClient: PublicClient,
  orderHash: Hash
): Promise<OrderState> {
  const order = await getOrderDetails(publicClient, orderHash);
  return order.currentState;
}

/**
 * Check if user can perform an action on an order
 *
 * @param publicClient - Viem public client
 * @param orderHash - The unique order identifier
 * @param userAddress - Address of the user
 * @param action - Action to check ('approve' | 'withdraw')
 * @returns True if user can perform action
 */
export async function canPerformAction(
  publicClient: PublicClient,
  orderHash: Hash,
  userAddress: Address,
  action: "approve" | "withdraw"
): Promise<{ canPerform: boolean; reason?: string }> {
  try {
    const order = await getOrderDetails(publicClient, orderHash);

    if (action === "approve") {
      // Only initiator can approve
      if (order.initiator.toLowerCase() !== userAddress.toLowerCase()) {
        return {
          canPerform: false,
          reason: "Only the client can approve payment",
        };
      }
      // Order must be in VERIFIED state
      if (order.currentState !== OrderState.VERIFIED) {
        return {
          canPerform: false,
          reason: "Order must be verified before approval",
        };
      }
      return { canPerform: true };
    }

    if (action === "withdraw") {
      // Only freelancer can withdraw
      if (order.freelancer.toLowerCase() !== userAddress.toLowerCase()) {
        return {
          canPerform: false,
          reason: "Only the freelancer can withdraw funds",
        };
      }
      // Order must be in APPROVED state
      if (order.currentState !== OrderState.APPROVED) {
        return {
          canPerform: false,
          reason: "Payment must be approved before withdrawal",
        };
      }
      return { canPerform: true };
    }

    return { canPerform: false, reason: "Unknown action" };
  } catch (error: any) {
    return { canPerform: false, reason: error.message };
  }
}
