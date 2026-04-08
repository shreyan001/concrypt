/**
 * Smart Contract Configuration
 * Optimized for Concrypt Protocol on Base Sepolia.
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

export const NETWORKS: Record<string, NetworkConfig> = {
  BaseSepolia: {
    chainId: 11142220,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org/',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

export function getCurrentNetwork(): NetworkConfig {
  return NETWORKS.BaseSepolia;
}

/**
 * Contract addresses
 */
export const HANDOVER_CONTRACT_ADDRESS: Address = '0x9f57Bb86Ded01B3ad3cc3f6cb37DA290B07AB7af';
export const TOKEN_ADDRESS: Address = '0x128Fb6c5229Cad52c2Bf3E8B245aC47EA5d9DB0D';

export function getContractAddress(): Address {
  return HANDOVER_CONTRACT_ADDRESS;
}

export function getTokenAddress(): Address {
  return TOKEN_ADDRESS;
}

export const TX_CONFIG = {
  CONFIRMATION_BLOCKS: 1,
  TIMEOUT_MS: 60000,
} as const;
