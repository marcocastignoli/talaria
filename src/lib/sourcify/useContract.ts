import { useQuery } from '@tanstack/react-query';
import { getAddress, isAddress } from 'viem';
import { fetchSourcifyContract, useSourcifyServerUrl, type SourcifyContract } from './api';

const FIELDS = [
  'runtimeMatch',
  'creationMatch',
  'verifiedAt',
  'matchId',
  'abi',
  'metadata',
  'sources',
  'compilation',
  'runtimeBytecode.onchainBytecode',
  'runtimeBytecode.recompiledBytecode',
  'creationBytecode.onchainBytecode',
  'creationBytecode.recompiledBytecode',
  'stdJsonInput',
  'proxyResolution',
];

export interface UseContractResult {
  data: SourcifyContract | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isVerified: boolean;
  isFullMatch: boolean;
  isPartialMatch: boolean;
}

export function useContract(
  chainId: number | undefined,
  address: string | undefined,
): UseContractResult {
  const serverUrl = useSourcifyServerUrl();
  const normalized = address && isAddress(address) ? getAddress(address) : null;

  const query = useQuery({
    queryKey: ['sourcify', serverUrl, chainId, normalized],
    enabled: !!serverUrl && !!chainId && !!normalized,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      if (!chainId || !normalized) throw new Error('Missing chainId/address');
      return fetchSourcifyContract(serverUrl, chainId, normalized, FIELDS);
    },
  });

  const data = query.data;
  const isVerified =
    !!data && (data.runtimeMatch !== null || data.creationMatch !== null);
  const isFullMatch =
    data?.runtimeMatch === 'exact_match' || data?.creationMatch === 'exact_match';
  const isPartialMatch = isVerified && !isFullMatch;

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isVerified,
    isFullMatch,
    isPartialMatch,
  };
}
