import { useQuery } from '@tanstack/react-query';
import { parseAbi, type Address } from 'viem';
import { useViemClient } from '@/lib/rpc';

const ERC721_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
]);

export interface Erc721Info {
  name?: string;
  symbol?: string;
  totalSupply?: bigint;
}

export function useErc721Info(address: Address | null | undefined, enabled = true) {
  const client = useViemClient();
  return useQuery<Erc721Info>({
    queryKey: ['erc721Info', address],
    enabled: !!client && !!address && enabled,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!client || !address) throw new Error('No client');
      const r = await client.multicall({
        multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
        allowFailure: true,
        contracts: [
          { address, abi: ERC721_ABI, functionName: 'name' },
          { address, abi: ERC721_ABI, functionName: 'symbol' },
          { address, abi: ERC721_ABI, functionName: 'totalSupply' },
        ],
      });
      return {
        name: r[0].status === 'success' ? (r[0].result as string) : undefined,
        symbol: r[1].status === 'success' ? (r[1].result as string) : undefined,
        totalSupply: r[2].status === 'success' ? (r[2].result as bigint) : undefined,
      };
    },
  });
}
