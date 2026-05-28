import { useQuery } from '@tanstack/react-query';
import { parseAbi, type Address } from 'viem';
import { useViemClient } from '@/lib/rpc';

const ERC4626_ABI = parseAbi([
  'function asset() view returns (address)',
  'function totalAssets() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

export interface Erc4626Info {
  asset?: Address;
  totalAssets?: bigint;
  totalSupply?: bigint;
  decimals?: number;
}

export function useErc4626Info(address: Address | null | undefined, enabled = true) {
  const client = useViemClient();
  return useQuery<Erc4626Info>({
    queryKey: ['erc4626Info', address],
    enabled: !!client && !!address && enabled,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!client || !address) throw new Error('No client');
      const r = await client.multicall({
        multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
        allowFailure: true,
        contracts: [
          { address, abi: ERC4626_ABI, functionName: 'asset' },
          { address, abi: ERC4626_ABI, functionName: 'totalAssets' },
          { address, abi: ERC4626_ABI, functionName: 'totalSupply' },
          { address, abi: ERC4626_ABI, functionName: 'decimals' },
        ],
      });
      return {
        asset: r[0].status === 'success' ? (r[0].result as Address) : undefined,
        totalAssets: r[1].status === 'success' ? (r[1].result as bigint) : undefined,
        totalSupply: r[2].status === 'success' ? (r[2].result as bigint) : undefined,
        decimals: r[3].status === 'success' ? Number(r[3].result) : undefined,
      };
    },
  });
}
