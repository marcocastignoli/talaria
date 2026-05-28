import { useQuery } from '@tanstack/react-query';
import { parseAbi, type Address } from 'viem';
import { useViemClient } from '@/lib/rpc';

const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
]);

export interface Erc20Info {
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: bigint;
}

export function useErc20Info(address: Address | null | undefined, enabled = true) {
  const client = useViemClient();
  return useQuery<Erc20Info>({
    queryKey: ['erc20Info', address],
    enabled: !!client && !!address && enabled,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!client || !address) throw new Error('No client');
      const r = await client.multicall({
        multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
        allowFailure: true,
        contracts: [
          { address, abi: ERC20_ABI, functionName: 'name' },
          { address, abi: ERC20_ABI, functionName: 'symbol' },
          { address, abi: ERC20_ABI, functionName: 'decimals' },
          { address, abi: ERC20_ABI, functionName: 'totalSupply' },
        ],
      });
      return {
        name: r[0].status === 'success' ? (r[0].result as string) : undefined,
        symbol: r[1].status === 'success' ? (r[1].result as string) : undefined,
        decimals: r[2].status === 'success' ? Number(r[2].result) : undefined,
        totalSupply: r[3].status === 'success' ? (r[3].result as bigint) : undefined,
      };
    },
  });
}
