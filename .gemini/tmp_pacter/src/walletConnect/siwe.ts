import {
  createSIWEConfig,
  SIWECreateMessageArgs,
  formatMessage,
  SIWESession,
  SIWEVerifyMessageArgs,
} from '@web3modal/siwe';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { getCsrfToken, getSession, signIn, signOut } from 'next-auth/react';
import { cookieStorage, createStorage } from 'wagmi';
import { createPublicClient, http, defineChain } from 'viem';
import { switchChain, getChainId } from '@wagmi/core';

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) throw new Error('Project ID is not defined');

// Define Polygon Amoy Testnet custom chain
export const polygonAmoyTestnet = defineChain({
  id: 80002,
  name: 'Polygon Amoy Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'POL',
    symbol: 'POL',
  },
  rpcUrls: {
    default: { http: ['https://rpc-amoy.polygon.technology/'] },
  },
  blockExplorers: {
    default: {
      name: 'Polygon Amoy Explorer',
      url: 'https://amoy.polygonscan.com/',
    },
  },
  testnet: true,
});

export const metadata = {
  name: 'Pakt',
  description: 'Programmable trust, agent-powered verification, and Polygon-native streaming payouts for collaborative work.',
  url: 'https://Pakt.vercel.app/', // origin must match your domain & subdomain
  icons: ['https://raw.githubusercontent.com/shreyan001/Pakts/refs/heads/main/public/logo.png'],
};

export const publicClient = createPublicClient({
  chain: polygonAmoyTestnet,
  transport: http(),
});

// Helper function to validate and switch to correct chain
export const validateAndSwitchChain = async (): Promise<boolean> => {
  try {
    const currentChainId = getChainId(config);

    if (currentChainId !== polygonAmoyTestnet.id) {
      // Prompt user to switch to Polygon Amoy Testnet
      const switchResult = await switchChain(config, {
        chainId: polygonAmoyTestnet.id,
      });

      return switchResult.id === polygonAmoyTestnet.id;
    }

    return true;
  } catch (error) {
    console.error('Failed to switch chain:', error);
    return false;
  }
};

// Helper function to extract numeric chain ID from EIP-155 format
export const parseChainId = (chainId: string | number): number => {
  if (typeof chainId === 'number') return chainId;

  // Handle EIP-155 format (e.g., "eip155:5115" -> 5115)
  if (chainId.includes(':')) {
    return parseInt(chainId.split(':')[1], 10);
  }

  return parseInt(chainId, 10);
};

// Create wagmiConfig
const chains = [polygonAmoyTestnet] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export const siweConfig = createSIWEConfig({
  getMessageParams: async () => {
    // First check current chain without switching
    const currentChainId = getChainId(config);

    if (currentChainId !== polygonAmoyTestnet.id) {
      throw new Error(`Wrong network detected. Please switch to Polygon Amoy Testnet (Chain ID: ${polygonAmoyTestnet.id}) first, then try signing in again.`);
    }

    return {
      domain: typeof window !== 'undefined' ? window.location.host : '',
      uri: typeof window !== 'undefined' ? window.location.origin : '',
      chains: [polygonAmoyTestnet.id],
      statement: 'Please sign with your account on Polygon Amoy Testnet',
    };
  },
  createMessage: ({ address, ...args }: SIWECreateMessageArgs) =>
    formatMessage(args, address),
  getNonce: async () => {
    // Strict chain validation before getting nonce
    const currentChainId = getChainId(config);
    if (currentChainId !== polygonAmoyTestnet.id) {
      throw new Error(`Authentication blocked: Wrong network detected. Current: ${currentChainId}, Required: ${polygonAmoyTestnet.id}. Please switch to Polygon Amoy Testnet first.`);
    }

    const nonce = await getCsrfToken();
    if (!nonce) {
      throw new Error('Failed to get nonce!');
    }

    return nonce;
  },
  getSession: async () => {
    const session = await getSession();
    if (!session) {
      throw new Error('Failed to get session!');
    }

    const { address, chainId } = session as unknown as SIWESession;

    // Ensure chainId is properly formatted for the session
    const numericChainId = typeof chainId === 'number' ? chainId : parseChainId(String(chainId));

    return { address, chainId: numericChainId };
  },
  verifyMessage: async ({ message, signature }: SIWEVerifyMessageArgs) => {
    try {
      // Validate chain before verification
      const currentChainId = getChainId(config);
      if (currentChainId !== polygonAmoyTestnet.id) {
        console.error(`Wrong chain for verification. Expected: ${polygonAmoyTestnet.id}, Got: ${currentChainId}`);
        return false;
      }

      const success = await signIn('credentials', {
        message,
        redirect: false,
        signature,
        callbackUrl: '/protected',
      });

      return Boolean(success?.ok);
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  },
  signOut: async () => {
    try {
      await signOut({
        redirect: false,
      });

      return true;
    } catch (error) {
      return false;
    }
  },
});