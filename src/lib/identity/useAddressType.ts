import { useQuery } from '@tanstack/react-query';
import { getAddress, isAddress, type Address } from 'viem';
import { useViemClient } from '@/lib/rpc';
import { detectAddressType, type AddressTypeInfo } from './addressType';

export function useAddressType(address: string | undefined): {
  data: AddressTypeInfo | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const client = useViemClient();
  const normalized = address && isAddress(address) ? (getAddress(address) as Address) : null;

  const query = useQuery({
    queryKey: ['addressType', normalized],
    queryFn: async () => {
      if (!client || !normalized) throw new Error('No client / address');
      return detectAddressType(client, normalized);
    },
    enabled: !!client && !!normalized,
    staleTime: 1000 * 60 * 5,
  });

  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
