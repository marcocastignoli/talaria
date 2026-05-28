import { useQuery } from '@tanstack/react-query';
import { parseAbi, type Address } from 'viem';
import { useViemClient } from '@/lib/rpc';

export interface ErcInterfaces {
  erc20: boolean;
  erc721: boolean;
  erc1155: boolean;
  erc4626: boolean;
}

// ERC-165 interface IDs
const ERC721_INTERFACE_ID = '0x80ac58cd' as const;
const ERC1155_INTERFACE_ID = '0xd9b67a26' as const;

const PROBE_ABI = parseAbi([
  'function supportsInterface(bytes4) view returns (bool)',
  'function decimals() view returns (uint8)',
  'function asset() view returns (address)',
]);

export function useErcInterfaces(address: Address | null | undefined) {
  const client = useViemClient();

  return useQuery<ErcInterfaces>({
    queryKey: ['ercInterfaces', address],
    enabled: !!client && !!address,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!client || !address) throw new Error('No client / address');
      const results = await client.multicall({
        // Multicall3 is deployed at this deterministic CREATE2 address on
        // every EVM chain that has it. Our PublicClient doesn't carry chain
        // metadata, so we tell viem the address explicitly.
        multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
        allowFailure: true,
        contracts: [
          {
            address,
            abi: PROBE_ABI,
            functionName: 'supportsInterface',
            args: [ERC721_INTERFACE_ID],
          },
          {
            address,
            abi: PROBE_ABI,
            functionName: 'supportsInterface',
            args: [ERC1155_INTERFACE_ID],
          },
          {
            address,
            abi: PROBE_ABI,
            functionName: 'asset',
          },
          {
            address,
            abi: PROBE_ABI,
            functionName: 'decimals',
          },
        ],
      });

      const erc721 = results[0].status === 'success' && results[0].result === true;
      const erc1155 = results[1].status === 'success' && results[1].result === true;
      const erc4626 =
        results[2].status === 'success' &&
        typeof results[2].result === 'string' &&
        (results[2].result as string).startsWith('0x');
      // ERC-20 doesn't reliably implement ERC-165, but decimals() returning uint8
      // is a strong signal. Many ERC-721 also have decimals (always 0 or revert),
      // so prefer 721 detection over 20 if both fire.
      const decimalsOk =
        results[3].status === 'success' && typeof results[3].result === 'number';
      const erc20 = decimalsOk && !erc721 && !erc1155;

      return { erc20, erc721, erc1155, erc4626 };
    },
  });
}
