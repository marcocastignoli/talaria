import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DisplayStyle = 'friendly' | 'raw';
export type Theme = 'system' | 'light' | 'dark';
export type BlockTag = 'latest' | 'finalized' | 'safe';

export interface TenderlyConfig {
  apiKey: string;
  account: string;
  project: string;
}

export interface SettingsState {
  rpcUrl: string;
  mainnetRpcUrl: string;
  sourcifyServerUrl: string;
  ipfsGateway: string;
  tenderly: TenderlyConfig;
  displayStyle: DisplayStyle;
  theme: Theme;
  reverifyDwellMs: number;
  defaultBlockTag: BlockTag;
  lastVisitedChainId: number | null;

  setRpcUrl: (url: string) => void;
  setMainnetRpcUrl: (url: string) => void;
  setSourcifyServerUrl: (url: string) => void;
  setIpfsGateway: (url: string) => void;
  setTenderly: (cfg: Partial<TenderlyConfig>) => void;
  setDisplayStyle: (s: DisplayStyle) => void;
  setTheme: (t: Theme) => void;
  setReverifyDwellMs: (ms: number) => void;
  setDefaultBlockTag: (t: BlockTag) => void;
  setLastVisitedChainId: (id: number | null) => void;
  resetAll: () => void;
}

const DEFAULTS = {
  rpcUrl: '',
  mainnetRpcUrl: 'https://ethereum-rpc.publicnode.com',
  sourcifyServerUrl: 'https://sourcify.dev/server',
  ipfsGateway: 'https://ipfs.io/ipfs/',
  tenderly: { apiKey: '', account: '', project: '' } satisfies TenderlyConfig,
  displayStyle: 'friendly' as DisplayStyle,
  theme: 'system' as Theme,
  reverifyDwellMs: 5000,
  defaultBlockTag: 'latest' as BlockTag,
  lastVisitedChainId: null as number | null,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setRpcUrl: (rpcUrl) => set({ rpcUrl }),
      setMainnetRpcUrl: (mainnetRpcUrl) => set({ mainnetRpcUrl }),
      setSourcifyServerUrl: (sourcifyServerUrl) => set({ sourcifyServerUrl }),
      setIpfsGateway: (ipfsGateway) => set({ ipfsGateway }),
      setTenderly: (cfg) => set((s) => ({ tenderly: { ...s.tenderly, ...cfg } })),
      setDisplayStyle: (displayStyle) => set({ displayStyle }),
      setTheme: (theme) => set({ theme }),
      setReverifyDwellMs: (reverifyDwellMs) => set({ reverifyDwellMs }),
      setDefaultBlockTag: (defaultBlockTag) => set({ defaultBlockTag }),
      setLastVisitedChainId: (lastVisitedChainId) => set({ lastVisitedChainId }),
      resetAll: () => set(DEFAULTS),
    }),
    { name: 'talaria-settings', version: 1 },
  ),
);

export function useIsSetupComplete() {
  return useSettings((s) => s.rpcUrl !== '');
}
