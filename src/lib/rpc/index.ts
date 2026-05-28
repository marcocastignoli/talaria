import { useMemo } from 'react';
import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet } from 'viem/chains';
import { JsonRpcProvider } from 'ethers';
import { useSettings } from '@/lib/settings/store';

export function useViemClient(): PublicClient | null {
  const rpcUrl = useSettings((s) => s.rpcUrl);
  return useMemo(() => {
    if (!rpcUrl) return null;
    return createPublicClient({ transport: http(rpcUrl) });
  }, [rpcUrl]);
}

export function useMainnetViemClient(): PublicClient {
  const mainnetRpcUrl = useSettings((s) => s.mainnetRpcUrl);
  return useMemo(
    () => createPublicClient({ chain: mainnet, transport: http(mainnetRpcUrl) }),
    [mainnetRpcUrl],
  );
}

export function useEthersProvider(): JsonRpcProvider | null {
  const rpcUrl = useSettings((s) => s.rpcUrl);
  return useMemo(() => (rpcUrl ? new JsonRpcProvider(rpcUrl) : null), [rpcUrl]);
}
