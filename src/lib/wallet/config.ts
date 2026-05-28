import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  optimism,
  base,
  type AppKitNetwork,
} from '@reown/appkit/networks';

// Public Reown Cloud project ID. Users can override via VITE_REOWN_PROJECT_ID.
// Free tier — used only to identify the dApp in Reown's relay.
const projectId =
  (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined) ||
  'b56e18d47c72ab683b10814fe9495694'; // placeholder dev ID

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  optimism,
  base,
];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  features: {
    analytics: false,
    socials: false,
    email: false,
  },
  metadata: {
    name: 'Talaria',
    description: 'EVM browser with clear-signing and trustless re-verification',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://talaria.app',
    icons: ['/talaria.svg'],
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
