import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  SolidityMetadataContract,
  Verification,
  SourcifyChain,
} from '@ethereum-sourcify/lib-sourcify';
import { useSettings } from '@/lib/settings/store';
import { solc } from './solc';
import type { SourcifyContract } from './api';

export type ReVerificationStatus =
  | 'idle'
  | 'verifying'
  | 'perfect'
  | 'partial'
  | 'mismatch'
  | 'error';

export interface ReVerificationResult {
  status: ReVerificationStatus;
  runtimeMatch: 'perfect' | 'partial' | null;
  creationMatch: 'perfect' | 'partial' | null;
  error?: string;
}

const INTENT_TABS = new Set(['source', 'read', 'write', 'verification']);

/**
 * Returns true once the address has been dwelled on for `reverifyDwellMs`,
 * OR immediately if the URL tab is one of the intent-signal tabs.
 * Resets when the address changes.
 */
export function useReVerifyEnabled(address: string | null): boolean {
  const dwellMs = useSettings((s) => s.reverifyDwellMs);
  const [params] = useSearchParams();
  const tab = params.get('tab') ?? 'overview';
  const isIntent = INTENT_TABS.has(tab);

  const [dwellElapsed, setDwellElapsed] = useState(false);

  useEffect(() => {
    setDwellElapsed(false);
    if (!address) return;
    if (dwellMs <= 0) {
      setDwellElapsed(true);
      return;
    }
    const id = setTimeout(() => setDwellElapsed(true), dwellMs);
    return () => clearTimeout(id);
  }, [dwellMs, address]);

  return !!address && (isIntent || dwellElapsed);
}

export function useReVerification(
  chainId: number | undefined,
  address: string | null,
  contract: SourcifyContract | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const rpcUrl = useSettings((s) => s.rpcUrl);

  const isSolidity = contract?.compilation?.language === 'Solidity';

  const enabled =
    options.enabled !== false &&
    !!chainId &&
    !!address &&
    !!contract &&
    !!contract.sources &&
    !!contract.metadata &&
    !!rpcUrl &&
    isSolidity;

  const query = useQuery<ReVerificationResult>({
    queryKey: [
      'reVerification',
      chainId,
      address,
      contract?.matchId ?? contract?.verifiedAt ?? null,
    ],
    enabled,
    staleTime: 1000 * 60 * 60,
    retry: false,
    queryFn: async () => {
      if (!chainId || !address || !contract?.sources || !contract.metadata) {
        throw new Error('Missing inputs');
      }
      const sources = Object.entries(contract.sources).map(([path, v]) => ({
        path,
        content: v.content,
      }));
      const metadataContract = new SolidityMetadataContract(contract.metadata, sources);
      const compilation = await metadataContract.createCompilation(solc);
      const sourcifyChain = new SourcifyChain({
        name: `Chain ${chainId}`,
        chainId,
        rpcs: [{ rpc: rpcUrl }],
        supported: true,
      });
      const verification = new Verification(compilation, sourcifyChain, address);
      await verification.verify();
      const status = verification.status as {
        runtimeMatch: 'perfect' | 'partial' | null;
        creationMatch: 'perfect' | 'partial' | null;
      };
      const runtime = status.runtimeMatch;
      const creation = status.creationMatch;
      let overall: ReVerificationStatus;
      if (runtime === 'perfect' || creation === 'perfect') overall = 'perfect';
      else if (runtime === 'partial' || creation === 'partial') overall = 'partial';
      else overall = 'mismatch';
      return {
        status: overall,
        runtimeMatch: runtime,
        creationMatch: creation,
      };
    },
  });

  let status: ReVerificationStatus = 'idle';
  if (!enabled) status = 'idle';
  else if (query.isLoading || query.isFetching) status = 'verifying';
  else if (query.isError) status = 'error';
  else if (query.data) status = query.data.status;

  return {
    status,
    data: query.data,
    error: query.error,
    isLoading: query.isLoading || query.isFetching,
  };
}
