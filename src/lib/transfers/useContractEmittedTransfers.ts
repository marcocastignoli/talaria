import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { type Address, type Hash, parseAbiItem } from 'viem';
import { useViemClient } from '@/lib/rpc';

const ERC20_TRANSFER = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
);
const ERC721_TRANSFER = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
);

// Small enough chunk that even the most active tokens stay under any RPC
// log-per-response cap (~20k on QuickNode). 5 blocks ≈ 60s on mainnet.
const PAGE_BLOCKS = 5n;

export type TransferKind = 'erc20' | 'erc721';

export interface ContractTransferRow {
  txHash: Hash;
  logIndex: number;
  blockNumber: bigint;
  from: Address;
  to: Address;
  // For ERC-20 this is the value (uint256). For ERC-721 this is the tokenId.
  amount: bigint;
}

interface ContractTransferPage {
  rows: ContractTransferRow[];
  fromBlock: bigint;
  toBlock: bigint;
  nextCursor: bigint | null;
}

export function useContractEmittedTransfersInfinite(
  address: Address | null | undefined,
  kind: TransferKind,
) {
  const client = useViemClient();
  const event = kind === 'erc721' ? ERC721_TRANSFER : ERC20_TRANSFER;
  const argField = kind === 'erc721' ? 'tokenId' : 'value';

  return useInfiniteQuery({
    queryKey: ['contractEmittedTransfers', address, kind],
    enabled: !!client && !!address,
    staleTime: 1000 * 30,
    retry: false,
    initialPageParam: undefined as bigint | undefined,
    queryFn: async ({ pageParam }): Promise<ContractTransferPage> => {
      if (!client || !address) throw new Error('No client / address');
      const toBlock = pageParam ?? (await client.getBlockNumber());
      const fromBlock = toBlock > PAGE_BLOCKS ? toBlock - PAGE_BLOCKS : 0n;

      const logs = await client.getLogs({
        address,
        event,
        fromBlock,
        toBlock,
      });

      const rows: ContractTransferRow[] = logs
        .filter((l) => l.args.from !== undefined && l.args.to !== undefined)
        .map((l) => {
          const args = l.args as Record<string, unknown>;
          const amountRaw = args[argField];
          return {
            txHash: l.transactionHash,
            logIndex: l.logIndex,
            blockNumber: l.blockNumber,
            from: l.args.from!,
            to: l.args.to!,
            amount: (typeof amountRaw === 'bigint' ? amountRaw : 0n) as bigint,
          };
        });

      // Newest first within the chunk.
      rows.sort((a, b) =>
        b.blockNumber === a.blockNumber
          ? b.logIndex - a.logIndex
          : b.blockNumber > a.blockNumber
            ? 1
            : -1,
      );

      return {
        rows,
        fromBlock,
        toBlock,
        nextCursor: fromBlock > 0n ? fromBlock - 1n : null,
      };
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useLatestBlockNumber() {
  const client = useViemClient();
  return useQuery({
    queryKey: ['latestBlockNumber'],
    enabled: !!client,
    staleTime: 1000 * 10,
    queryFn: async () => {
      if (!client) throw new Error('No client');
      return client.getBlockNumber();
    },
  });
}
