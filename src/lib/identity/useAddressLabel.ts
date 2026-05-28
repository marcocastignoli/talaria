import { useQuery } from '@tanstack/react-query';
import { getAddress, isAddress, parseAbi } from 'viem';
import { useMainnetViemClient, useViemClient } from '@/lib/rpc';
import { friendlyNameFor, truncateAddress } from './friendlyName';
import { lookupSpecialAddress } from './specialAddresses';

export type LabelType = 'special' | 'ens' | 'token' | 'generated' | 'raw';

export interface AddressLabel {
  address: string;
  ensName: string | null;
  tokenName: string | null;
  tokenSymbol: string | null;
  friendlyName: string;
  truncated: string;
  special: { name: string; description?: string } | null;
}

const NAME_ABI = parseAbi(['function name() view returns (string)']);
const SYMBOL_ABI = parseAbi(['function symbol() view returns (string)']);

export function useAddressLabel(address: string | undefined): {
  data: AddressLabel | undefined;
  isLoading: boolean;
} {
  const mainnet = useMainnetViemClient();
  const chainClient = useViemClient();
  const normalized = address && isAddress(address) ? getAddress(address) : null;

  const query = useQuery({
    queryKey: ['addressLabel', normalized, !!chainClient],
    queryFn: async (): Promise<AddressLabel> => {
      if (!normalized) throw new Error('Invalid address');
      const truncated = truncateAddress(normalized);
      const special = lookupSpecialAddress(normalized);
      if (special) {
        return {
          address: normalized,
          ensName: null,
          tokenName: null,
          tokenSymbol: null,
          friendlyName: special.name,
          truncated,
          special,
        };
      }
      const friendlyName = friendlyNameFor(normalized);

      const probes = await Promise.allSettled([
        mainnet.getEnsName({ address: normalized }),
        chainClient
          ? chainClient.readContract({
              address: normalized,
              abi: NAME_ABI,
              functionName: 'name',
            })
          : Promise.reject(new Error('no client')),
        chainClient
          ? chainClient.readContract({
              address: normalized,
              abi: SYMBOL_ABI,
              functionName: 'symbol',
            })
          : Promise.reject(new Error('no client')),
      ]);

      const ensName = probes[0].status === 'fulfilled' ? probes[0].value : null;
      const tokenName =
        probes[1].status === 'fulfilled' && typeof probes[1].value === 'string'
          ? probes[1].value
          : null;
      const tokenSymbol =
        probes[2].status === 'fulfilled' && typeof probes[2].value === 'string'
          ? probes[2].value
          : null;

      return {
        address: normalized,
        ensName,
        tokenName,
        tokenSymbol,
        friendlyName,
        truncated,
        special: null,
      };
    },
    enabled: !!normalized,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  return { data: query.data, isLoading: query.isLoading };
}

/**
 * Pick the best human-readable name for an address according to displayStyle.
 * Hierarchy: ENS > tokenName > friendly > truncated (friendly mode).
 * In raw mode, truncated is always primary.
 */
export function pickPrimaryLabel(
  label: AddressLabel | undefined,
  displayStyle: 'friendly' | 'raw',
): { primary: string; secondary: string } {
  if (!label) {
    return { primary: '', secondary: '' };
  }
  if (displayStyle === 'raw') {
    return {
      primary: label.truncated,
      secondary: label.ensName ?? label.tokenName ?? label.friendlyName,
    };
  }
  const primary =
    label.ensName ?? label.tokenName ?? label.friendlyName ?? label.truncated;
  return {
    primary,
    secondary: label.address,
  };
}
