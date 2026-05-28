import { useQuery } from '@tanstack/react-query';
import { useViemClient } from '@/lib/rpc';

export function useBlockTimestamp(blockNumber: bigint | undefined) {
  const client = useViemClient();
  return useQuery({
    queryKey: ['blockTimestamp', blockNumber?.toString()],
    enabled: !!client && blockNumber !== undefined,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      if (!client || blockNumber === undefined) throw new Error('no client');
      const block = await client.getBlock({ blockNumber, includeTransactions: false });
      return Number(block.timestamp);
    },
  });
}
