import { useQuery } from '@tanstack/react-query';
import { type Address, type Hash, parseAbiItem } from 'viem';
import { useViemClient } from '@/lib/rpc';

const BLOCK_RANGE = 9990n; // stay under common ~10k cap

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
);

export interface TransferRow {
  txHash: Hash;
  blockNumber: bigint;
  tokenAddress: Address;
  from: Address;
  to: Address;
  direction: 'in' | 'out';
}

export function useTokenTransfers(address: Address | null | undefined) {
  const client = useViemClient();

  return useQuery({
    queryKey: ['tokenTransfers', address],
    enabled: !!client && !!address,
    staleTime: 1000 * 30,
    queryFn: async (): Promise<{
      rows: TransferRow[];
      blockRange: { from: bigint; to: bigint };
      truncated: boolean;
    }> => {
      if (!client || !address) throw new Error('No client / address');
      const latest = await client.getBlockNumber();
      const fromBlock = latest > BLOCK_RANGE ? latest - BLOCK_RANGE : 0n;

      const [outLogs, inLogs] = await Promise.all([
        client.getLogs({
          event: TRANSFER_EVENT,
          args: { from: address },
          fromBlock,
          toBlock: latest,
        }),
        client.getLogs({
          event: TRANSFER_EVENT,
          args: { to: address },
          fromBlock,
          toBlock: latest,
        }),
      ]);

      const decode = (logs: typeof outLogs, direction: 'in' | 'out'): TransferRow[] =>
        logs
          .filter((l) => l.args.from !== undefined && l.args.to !== undefined)
          .map((l) => ({
            txHash: l.transactionHash,
            blockNumber: l.blockNumber,
            tokenAddress: l.address,
            from: l.args.from!,
            to: l.args.to!,
            direction,
          }));

      const rows = [...decode(outLogs, 'out'), ...decode(inLogs, 'in')];

      rows.sort((a, b) =>
        b.blockNumber === a.blockNumber ? 0 : b.blockNumber > a.blockNumber ? 1 : -1,
      );
      const seen = new Set<Hash>();
      const unique: TransferRow[] = [];
      for (const r of rows) {
        if (seen.has(r.txHash)) continue;
        seen.add(r.txHash);
        unique.push(r);
      }

      const truncated = unique.length > 50;
      return {
        rows: unique.slice(0, 50),
        blockRange: { from: fromBlock, to: latest },
        truncated,
      };
    },
  });
}
