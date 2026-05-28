import { useQuery } from '@tanstack/react-query';
import type {
  DisplayModel,
  RegistryIndex,
} from '@ethereum-sourcify/clear-signing';
import { format, fetchPrebuiltRegistryIndex } from '@ethereum-sourcify/clear-signing';
import { JsonRpcProvider } from 'ethers';
import { useEthersProvider } from '@/lib/rpc';
import { useSettings } from '@/lib/settings/store';

export interface ClearSigningTxData {
  from: string;
  to: string | null;
  data: `0x${string}`;
  value: bigint;
}

let cachedRegistryIndex: RegistryIndex | null | undefined;
let registryIndexPromise: Promise<RegistryIndex | null> | undefined;

function loadRegistryIndex(): Promise<RegistryIndex | null> {
  if (cachedRegistryIndex !== undefined) return Promise.resolve(cachedRegistryIndex);
  if (registryIndexPromise !== undefined) return registryIndexPromise;
  registryIndexPromise = fetchPrebuiltRegistryIndex()
    .then((idx) => {
      cachedRegistryIndex = idx;
      return idx;
    })
    .catch(() => {
      cachedRegistryIndex = null;
      return null;
    });
  return registryIndexPromise;
}

// Memoized externalDataProvider creation per (chainProvider, mainnetUrl) pair.
// The clear-signing library calls these many times during decode; pre-building
// the adapter keeps each row cheap.
import { createExternalDataProvider } from './externalDataProvider';

export function useClearSigningModel(
  txData: ClearSigningTxData | null | undefined,
  chainId: number | undefined,
) {
  const chainProvider = useEthersProvider();
  const mainnetRpcUrl = useSettings((s) => s.mainnetRpcUrl);

  return useQuery<DisplayModel | null>({
    queryKey: [
      'clearSigning',
      chainId,
      txData?.to ?? '',
      txData?.data ?? '0x',
      txData?.value?.toString() ?? '0',
      txData?.from ?? '',
    ],
    enabled: !!chainProvider && !!chainId && !!txData,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!chainProvider || !chainId || !txData) return null;
      const mainnetProvider = new JsonRpcProvider(mainnetRpcUrl);
      const registryIndex = await loadRegistryIndex();
      const result = await format(
        {
          chainId,
          to: txData.to ?? '',
          data: txData.data,
          value: txData.value === 0n ? undefined : txData.value,
          from: txData.from,
        },
        {
          externalDataProvider: createExternalDataProvider(chainProvider, mainnetProvider),
          descriptorResolverOptions:
            registryIndex !== null
              ? { type: 'github', index: registryIndex }
              : { type: 'github' },
        },
      );
      return result;
    },
  });
}
