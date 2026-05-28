import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { type Address, type Hash } from 'viem';
import { ArrowDownLeft, ArrowUpRight, ArrowRight, Loader2 } from 'lucide-react';
import { useViemClient } from '@/lib/rpc';
import { useBlockTimestamp } from '@/lib/rpc/useBlockTimestamp';
import { useTokenTransfers } from '@/lib/transfers/useTokenTransfers';
import {
  useContractEmittedTransfersInfinite,
  type ContractTransferRow,
  type TransferKind,
} from '@/lib/transfers/useContractEmittedTransfers';
import { Button } from '@/components/ui/button';
import { useErcInterfaces } from '@/lib/erc/detect';
import { useErc20Info } from '@/lib/erc/useErc20Info';
import { useErc721Info } from '@/lib/erc/useErc721Info';
import { useAddressLabel, pickPrimaryLabel } from '@/lib/identity/useAddressLabel';
import { useSettings } from '@/lib/settings/store';
import { useQueries } from '@tanstack/react-query';
import { ClearSigningSummary } from '@/lib/clear-signing/ClearSigningSummary';
import { AddressLink } from '@/components/AddressLink';
import { formatRelativeTime, formatAbsoluteTime } from '@/lib/time';
import { formatTokenAmount } from '@/lib/erc/format';
import { truncateAddress } from '@/lib/identity/friendlyName';
import { Card, CardContent } from '@/components/ui/card';

interface TransactionsProps {
  address: Address;
  chainId: number;
}

export function Transactions({ address, chainId }: TransactionsProps) {
  const { data: ercs } = useErcInterfaces(address);
  const isErc20Like = !!(ercs?.erc20 || ercs?.erc4626);
  const isErc721 = !!ercs?.erc721;

  if (isErc20Like) {
    return <TokenContractTransfers address={address} chainId={chainId} kind="erc20" />;
  }
  if (isErc721) {
    return <TokenContractTransfers address={address} chainId={chainId} kind="erc721" />;
  }
  return <AddressActivity address={address} chainId={chainId} />;
}

/* ---------------------------------------------------------------------- */
/* EOA / non-token-contract view: who sent/received tokens to/from this addr */
/* ---------------------------------------------------------------------- */

function AddressActivity({ address, chainId }: { address: Address; chainId: number }) {
  const client = useViemClient();
  const { data, isLoading, isError, error } = useTokenTransfers(address);

  const txHashes = data?.rows.map((r) => r.txHash) ?? [];
  const txQueries = useQueries({
    queries: txHashes.map((hash) => ({
      queryKey: ['tx', chainId, hash],
      enabled: !!client,
      queryFn: async () => {
        if (!client) throw new Error('No client');
        return client.getTransaction({ hash });
      },
      staleTime: 1000 * 60 * 60,
    })),
  });

  if (isLoading) {
    return <div className="text-sm text-[var(--color-fg-muted)]">Loading transactions…</div>;
  }
  if (isError) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 px-3 py-2 text-sm text-red-800 dark:text-red-200">
        Couldn't fetch transfer history: {String(error)}
      </div>
    );
  }
  if (!data || data.rows.length === 0) {
    const range = data ? Number(data.blockRange.to - data.blockRange.from) : 0;
    return (
      <Card>
        <CardContent className="py-8 text-sm text-[var(--color-fg-muted)] text-center">
          No token transfers in the last ~{range.toLocaleString()} blocks. Native ETH
          transfers and non-token contract calls aren't indexed by standard JSON-RPC.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <RangeBanner from={data.blockRange.from} to={data.blockRange.to}>
        Token transfers (ERC-20/721) where this address is the sender or recipient.
      </RangeBanner>
      <Card>
        <CardContent className="divide-y divide-[var(--color-border)] py-0 px-2">
          {data.rows.map((row, i) => (
            <AddressActivityRow
              key={row.txHash}
              row={row}
              chainId={chainId}
              tx={txQueries[i]?.data}
              loading={txQueries[i]?.isLoading ?? false}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AddressActivityRow({
  row,
  chainId,
  tx,
  loading,
}: {
  row: {
    txHash: Hash;
    blockNumber: bigint;
    from: Address;
    to: Address;
    direction: 'in' | 'out';
  };
  chainId: number;
  tx:
    | Awaited<ReturnType<NonNullable<ReturnType<typeof useViemClient>>['getTransaction']>>
    | undefined;
  loading: boolean;
}) {
  const navigate = useNavigate();
  const counterparty = row.direction === 'out' ? row.to : row.from;
  const { data: timestamp } = useBlockTimestamp(row.blockNumber);

  const relative = timestamp ? formatRelativeTime(timestamp) : '';
  const absolute = timestamp ? formatAbsoluteTime(timestamp) : '';

  const txData = tx
    ? {
        from: tx.from,
        to: tx.to ?? null,
        data: tx.input ?? '0x',
        value: tx.value,
      }
    : null;

  const onRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    navigate(`/chain/${chainId}/tx/${row.txHash}`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/chain/${chainId}/tx/${row.txHash}`);
        }
      }}
      className="flex items-center gap-3 py-3 px-1 hover:bg-[var(--color-surface-2)]/80 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40"
    >
      <div
        className={
          row.direction === 'out'
            ? 'shrink-0 size-8 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 inline-flex items-center justify-center'
            : 'shrink-0 size-8 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 inline-flex items-center justify-center'
        }
        aria-hidden="true"
      >
        {row.direction === 'out' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        {loading || !txData ? (
          <span className="inline-block h-3.5 w-48 rounded bg-[var(--color-surface-3)] animate-pulse" />
        ) : (
          <div className="text-sm text-[var(--color-fg)] min-w-0">
            <ClearSigningSummary
              txData={txData}
              chainId={chainId}
              fallback={
                <span className="inline-flex items-baseline gap-1.5 min-w-0">
                  <span className="text-[var(--color-fg-muted)]">
                    {row.direction === 'out' ? 'Sent to' : 'Received from'}
                  </span>
                  <AddressLink
                    address={counterparty}
                    chainId={chainId}
                    showCopy={false}
                  />
                </span>
              }
            />
          </div>
        )}
      </div>
      <div
        className="shrink-0 text-xs text-[var(--color-fg-muted)] tabular-nums"
        title={absolute}
      >
        {relative || '…'}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Token-contract view: all Transfer events emitted by this contract       */
/* ---------------------------------------------------------------------- */

const INITIAL_COUNT = 5;
const PAGE_INCREMENT = 5;

function TokenContractTransfers({
  address,
  chainId,
  kind,
}: {
  address: Address;
  chainId: number;
  kind: TransferKind;
}) {
  const infinite = useContractEmittedTransfersInfinite(address, kind);
  const { data: erc20Info } = useErc20Info(address, kind === 'erc20');
  const { data: erc721Info } = useErc721Info(address, kind === 'erc721');
  const tokenInfo = kind === 'erc721' ? erc721Info : erc20Info;

  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);

  const allRows = useMemo<ContractTransferRow[]>(
    () => infinite.data?.pages.flatMap((p) => p.rows) ?? [],
    [infinite.data],
  );

  const visibleRows = allRows.slice(0, displayCount);
  const hasMoreInBuffer = allRows.length > displayCount;
  const canLoadMore = hasMoreInBuffer || infinite.hasNextPage === true;

  const onLoadMore = async () => {
    const newCount = displayCount + PAGE_INCREMENT;
    setDisplayCount(newCount);
    // Only fetch one more chunk per click — don't auto-loop on sparse contracts.
    if (
      allRows.length < newCount &&
      infinite.hasNextPage &&
      !infinite.isFetchingNextPage
    ) {
      await infinite.fetchNextPage();
    }
  };

  // First load
  if (infinite.isLoading) {
    return <div className="text-sm text-[var(--color-fg-muted)]">Loading transfers…</div>;
  }
  if (infinite.isError) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 px-3 py-2 text-sm text-red-800 dark:text-red-200">
        Couldn't fetch token transfers: {String(infinite.error)}
      </div>
    );
  }
  if (visibleRows.length === 0) {
    const oldest = infinite.data?.pages.at(-1)?.fromBlock;
    const newest = infinite.data?.pages[0]?.toBlock;
    return (
      <Card>
        <CardContent className="py-6 text-sm text-[var(--color-fg-muted)] text-center flex flex-col gap-3 items-center">
          <div>
            No Transfer events between blocks{' '}
            <span className="font-mono">{oldest?.toString()}</span> and{' '}
            <span className="font-mono">{newest?.toString()}</span>.
          </div>
          {canLoadMore && (
            <Button variant="outline" size="sm" onClick={onLoadMore} disabled={infinite.isFetchingNextPage}>
              {infinite.isFetchingNextPage && <Loader2 size={12} className="animate-spin" />}
              Load older blocks
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const newestBlock = infinite.data?.pages[0]?.toBlock;
  const oldestBlock = infinite.data?.pages.at(-1)?.fromBlock;

  return (
    <div className="flex flex-col gap-3">
      {newestBlock !== undefined && oldestBlock !== undefined && (
        <RangeBanner from={oldestBlock} to={newestBlock}>
          {tokenInfo?.symbol ? `${tokenInfo.symbol} ` : ''}Transfer events emitted by this contract.
        </RangeBanner>
      )}
      <Card>
        <CardContent className="divide-y divide-[var(--color-border)] py-0 px-2">
          {visibleRows.map((row) => (
            <TokenTransferRow
              key={`${row.txHash}-${row.logIndex}`}
              row={row}
              chainId={chainId}
              kind={kind}
              decimals={erc20Info?.decimals}
              symbol={tokenInfo?.symbol}
            />
          ))}
        </CardContent>
      </Card>
      {canLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={infinite.isFetchingNextPage}
          >
            {infinite.isFetchingNextPage && (
              <Loader2 size={12} className="animate-spin" />
            )}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function TokenTransferRow({
  row,
  chainId,
  kind,
  decimals,
  symbol,
}: {
  row: ContractTransferRow;
  chainId: number;
  kind: TransferKind;
  decimals: number | undefined;
  symbol: string | undefined;
}) {
  const navigate = useNavigate();
  const { data: timestamp } = useBlockTimestamp(row.blockNumber);
  const relative = timestamp ? formatRelativeTime(timestamp) : '';
  const absolute = timestamp ? formatAbsoluteTime(timestamp) : '';

  const onRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    navigate(`/chain/${chainId}/tx/${row.txHash}`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/chain/${chainId}/tx/${row.txHash}`);
        }
      }}
      className="flex items-center gap-3 py-3 px-1 hover:bg-[var(--color-surface-2)]/80 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40"
    >
      <div
        className="shrink-0 size-8 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] inline-flex items-center justify-center"
        aria-hidden="true"
      >
        <ArrowRight size={14} />
      </div>
      <div className="flex-1 min-w-0 text-sm text-[var(--color-fg)]">
        <TransferEndpoints from={row.from} to={row.to} chainId={chainId} />
      </div>
      <div className="shrink-0 text-sm tabular-nums font-mono">
        {kind === 'erc721'
          ? `#${row.amount.toString()}`
          : formatTokenAmount(row.amount, decimals, symbol)}
      </div>
      <div
        className="shrink-0 text-xs text-[var(--color-fg-muted)] tabular-nums ml-3"
        title={absolute}
      >
        {relative || '…'}
      </div>
    </div>
  );
}

function TransferEndpoints({
  from,
  to,
  chainId: _chainId,
}: {
  from: Address;
  to: Address;
  chainId: number;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5 min-w-0 truncate">
      <InlineAddress address={from} />
      <span className="text-[var(--color-fg-muted)]">→</span>
      <InlineAddress address={to} />
    </span>
  );
}

function InlineAddress({ address }: { address: Address }) {
  const { data: label } = useAddressLabel(address);
  const displayStyle = useSettings((s) => s.displayStyle);
  const { primary } = pickPrimaryLabel(label, displayStyle);
  return <span className="truncate">{primary || truncateAddress(address)}</span>;
}

/* ---------------------------------------------------------------------- */

function RangeBanner({
  from,
  to,
  children,
}: {
  from: bigint;
  to: bigint;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-fg-muted)]">
      {children} Blocks <span className="font-mono">{from.toString()}</span> to{' '}
      <span className="font-mono">{to.toString()}</span>.
    </div>
  );
}
