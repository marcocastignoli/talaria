import { useSettings } from '@/lib/settings/store';

// Match types per Sourcify v2 API.
// - 'exact_match': byte-for-byte match including metadata
// - 'match': matches when metadata/auxdata are ignored (partial)
// - null: no match
export type MatchStatus = 'exact_match' | 'match' | null;

export interface CompilationInfo {
  language: 'Solidity' | 'Vyper';
  compiler: string;
  compilerVersion: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compilerSettings: any;
  name: string;
  fullyQualifiedName: string;
}

export interface SourcifyBytecodeSub {
  onchainBytecode?: `0x${string}`;
  recompiledBytecode?: `0x${string}`;
  // others available but not used yet
}

export interface ProxyResolutionInfo {
  isProxy: boolean;
  proxyType?: string;
  implementations?: { address: string; name?: string }[];
}

export interface SourcifyContract {
  chainId: number;
  address: string;
  runtimeMatch: MatchStatus;
  creationMatch: MatchStatus;
  verifiedAt: string;
  matchId?: string;
  abi?: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  sources?: Record<string, { content: string }>;
  compilation?: CompilationInfo;
  runtimeBytecode?: SourcifyBytecodeSub;
  creationBytecode?: SourcifyBytecodeSub;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stdJsonInput?: any;
  proxyResolution?: ProxyResolutionInfo;
}

export interface SourcifyError {
  customCode: string;
  message: string;
  errorId: string;
}

/**
 * Sourcify v2 contract endpoint.
 * Pass a list of field names per the swagger docs (e.g. 'runtimeMatch', 'sources',
 * 'metadata', 'compilation', 'runtimeBytecode.onchainBytecode'). Pass ['all'] to get everything.
 * Returns `null` when the contract isn't verified (404).
 */
export async function fetchSourcifyContract(
  serverUrl: string,
  chainId: number,
  address: string,
  fields: string[],
): Promise<SourcifyContract | null> {
  const base = serverUrl.replace(/\/$/, '');
  const qs = new URLSearchParams({ fields: fields.join(',') }).toString();
  const url = `${base}/v2/contract/${chainId}/${address}?${qs}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  const body = await res.json();
  if (!res.ok) {
    const err = body as SourcifyError;
    throw new Error(`Sourcify ${res.status}: ${err.message ?? 'unknown error'}`);
  }
  return body as SourcifyContract;
}

export function useSourcifyServerUrl(): string {
  return useSettings((s) => s.sourcifyServerUrl);
}
