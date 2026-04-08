/**
 * Smart Contract Configuration
 * 
 * Centralized configuration for PaktEscrowV2 contract addresses,
 * network settings, and related constants.
 */

import type { Address } from 'viem';

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Polygon Network configurations
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/',
    blockExplorer: 'https://amoy.polygonscan.com/',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18,
    },
  },
  mainnet: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com/',
    blockExplorer: 'https://polygonscan.com/',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18,
    },
  },
};

/**
 * Get current network based on environment
 */
export function getCurrentNetwork(): NetworkConfig {
  const env = process.env.NEXT_PUBLIC_NETWORK_ENV || 'testnet';
  return NETWORKS[env] || NETWORKS.testnet;
}

/**
 * Contract addresses by network
 */
export const CONTRACT_ADDRESSES: Record<string, Address> = {
  testnet: (process.env.NEXT_PUBLIC_Pakt_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  mainnet: (process.env.NEXT_PUBLIC_Pakt_CONTRACT_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000') as Address,
};

/**
 * Address of the shared 1% bonus vault used by milestone/time-locked escrows
 */
export const DEFI_VAULT_ADDRESS: Address = (
  process.env.NEXT_PUBLIC_Pakt_DEFI_VAULT_ADDRESS ||
  '0xa570E01A19A4bE995f5A27498b22eC6CbC2F1283'
) as Address;

export function getDeFiVaultAddress(): Address {
  return DEFI_VAULT_ADDRESS;
}

/**
 * Get contract address for current network
 */
export function getContractAddress(): Address {
  const env = process.env.NEXT_PUBLIC_NETWORK_ENV || 'testnet';
  return CONTRACT_ADDRESSES[env] || CONTRACT_ADDRESSES.testnet;
}

/**
 * Fee configuration (percentages)
 */
export const FEE_CONFIG = {
  PLATFORM_FEE_PERCENT: 2.5, // 2.5%
  STORAGE_FEE_PERCENT: 0.5,  // 0.5%
  TOTAL_FEE_PERCENT: 3.0,    // 3.0%
} as const;

/**
 * Currency conversion configuration
 */
export const CURRENCY_CONFIG = {
  DEFAULT_INR_TO_POL_RATE: 85.0, // Default exchange rate (1 POL = 85 INR)
  DECIMALS: 18, // POL token decimals
  DISPLAY_DECIMALS: 4, // Decimals to show in UI
} as const;

/**
 * Transaction configuration
 */
export const TX_CONFIG = {
  CONFIRMATION_BLOCKS: 1, // Number of blocks to wait for confirmation
  TIMEOUT_MS: 60000, // Transaction timeout (60 seconds)
  MAX_RETRIES: 3, // Maximum retry attempts
  RETRY_DELAY_MS: 1000, // Initial retry delay
} as const;

/**
 * Verification configuration
 */
export const VERIFICATION_CONFIG = {
  GITHUB_API_TIMEOUT_MS: 30000, // GitHub API timeout
  DEPLOYMENT_CHECK_TIMEOUT_MS: 30000, // Deployment check timeout
  MAX_VERIFICATION_RETRIES: 2, // Maximum verification retry attempts
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  ORDER_CACHE_TTL_MS: 60000, // Order cache TTL (1 minute)
  STATE_CACHE_TTL_MS: 30000, // State cache TTL (30 seconds)
} as const;

/**
 * Validate contract configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check contract address
  const contractAddress = getContractAddress();
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    errors.push('Contract address not configured');
  }

  // Check RPC URL
  const network = getCurrentNetwork();
  if (!network.rpcUrl) {
    errors.push('RPC URL not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary() {
  const network = getCurrentNetwork();
  const contractAddress = getContractAddress();

  return {
    network: {
      name: network.name,
      chainId: network.chainId,
      rpcUrl: network.rpcUrl,
    },
    contract: {
      address: contractAddress,
    },
    defiVault: {
      address: DEFI_VAULT_ADDRESS,
    },
    fees: FEE_CONFIG,
    currency: CURRENCY_CONFIG,
  };
}
