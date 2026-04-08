/**
 * Order Hash Generation and Validation Utilities
 * 
 * Provides functions to generate unique order hashes for escrow orders
 * and validate their format.
 */

import type { Address, Hash } from 'viem';
import { keccak256, toBytes, toHex } from 'viem';

/**
 * Generate a unique order hash for an escrow order
 * 
 * The hash is generated from:
 * - Initiator address
 * - Freelancer address
 * - Current timestamp
 * - Random value
 * 
 * @param initiatorAddress - Address of the client creating the order
 * @param freelancerAddress - Address of the freelancer
 * @returns A unique bytes32 hash
 */
export function generateOrderHash(
  initiatorAddress: Address,
  freelancerAddress: Address
): Hash {
  // Generate timestamp and random components
  const timestamp = Date.now();
  const randomValue = Math.random().toString(36).substring(2, 15);
  
  // Create a unique string combining all components
  const hashInput = `${initiatorAddress.toLowerCase()}-${freelancerAddress.toLowerCase()}-${timestamp}-${randomValue}`;
  
  // Convert to bytes and hash with keccak256
  const bytes = toBytes(hashInput);
  const hash = keccak256(bytes);
  
  return hash;
}

/**
 * Validate that a string is a valid bytes32 hash
 * 
 * @param hash - The hash to validate
 * @returns True if valid, false otherwise
 */
export function isValidOrderHash(hash: string): hash is Hash {
  // Check if it starts with 0x
  if (!hash.startsWith('0x')) {
    return false;
  }
  
  // Check if it's exactly 66 characters (0x + 64 hex chars)
  if (hash.length !== 66) {
    return false;
  }
  
  // Check if all characters after 0x are valid hex
  const hexPart = hash.slice(2);
  return /^[0-9a-fA-F]{64}$/.test(hexPart);
}

/**
 * Format an order hash for display (shortened version)
 * 
 * @param hash - The full order hash
 * @param prefixLength - Number of characters to show at start (default: 6)
 * @param suffixLength - Number of characters to show at end (default: 4)
 * @returns Formatted hash like "0x1234...5678"
 */
export function formatOrderHash(
  hash: Hash,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!isValidOrderHash(hash)) {
    return hash;
  }
  
  const prefix = hash.slice(0, 2 + prefixLength); // Include '0x'
  const suffix = hash.slice(-suffixLength);
  
  return `${prefix}...${suffix}`;
}

/**
 * Generate a deterministic order hash from contract ID
 * Useful for linking database records to on-chain orders
 * 
 * @param contractId - The database contract ID
 * @param initiatorAddress - Address of the client
 * @param freelancerAddress - Address of the freelancer
 * @returns A deterministic bytes32 hash
 */
export function generateDeterministicOrderHash(
  contractId: string,
  initiatorAddress: Address,
  freelancerAddress: Address
): Hash {
  const hashInput = `${contractId}-${initiatorAddress.toLowerCase()}-${freelancerAddress.toLowerCase()}`;
  const bytes = toBytes(hashInput);
  return keccak256(bytes);
}

/**
 * Verify that an order hash matches the expected format and addresses
 * 
 * @param orderHash - The order hash to verify
 * @param initiatorAddress - Expected initiator address
 * @param freelancerAddress - Expected freelancer address
 * @returns True if the hash is valid and could have been generated for these addresses
 */
export function verifyOrderHashFormat(
  orderHash: Hash,
  initiatorAddress?: Address,
  freelancerAddress?: Address
): boolean {
  // First check basic format
  if (!isValidOrderHash(orderHash)) {
    return false;
  }
  
  // If addresses provided, we can't verify the exact hash
  // (since it includes timestamp and random), but we can verify format
  // This is mainly for type checking
  if (initiatorAddress && freelancerAddress) {
    // Ensure addresses are valid
    if (!initiatorAddress.startsWith('0x') || !freelancerAddress.startsWith('0x')) {
      return false;
    }
    if (initiatorAddress.length !== 42 || freelancerAddress.length !== 42) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create a mock order hash for testing
 * 
 * @param seed - Optional seed for deterministic generation
 * @returns A valid order hash
 */
export function createMockOrderHash(seed?: string): Hash {
  const input = seed || `mock-${Date.now()}-${Math.random()}`;
  const bytes = toBytes(input);
  return keccak256(bytes);
}

/**
 * Extract metadata from order hash (if possible)
 * Note: This only works for deterministic hashes, not random ones
 * 
 * @param orderHash - The order hash
 * @returns Metadata object or null if not extractable
 */
export function extractOrderHashMetadata(orderHash: Hash): {
  isValid: boolean;
  length: number;
  prefix: string;
  suffix: string;
} {
  return {
    isValid: isValidOrderHash(orderHash),
    length: orderHash.length,
    prefix: orderHash.slice(0, 10),
    suffix: orderHash.slice(-8),
  };
}
