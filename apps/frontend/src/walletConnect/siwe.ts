import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { BaseSepolia } from 'viem/chains';

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'PACTOR_PLACEHOLDER';

export const metadata = {
  name: 'Concrypt Protocol',
  description: 'The Integrity Layer for Agentic Commerce',
  url: 'https://Concrypt.xyz',
  icons: ['https://Concrypt.xyz/logo.png'],
};

// Create wagmiConfig
const chains = [BaseSepolia] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
});
