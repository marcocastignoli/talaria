import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { type Hash } from 'viem';
import { useViemClient } from '@/lib/rpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddressLink } from '@/components/AddressLink';
import { HexValue } from '@/components/HexValue';
import { InfoRow } from '@/components/InfoRow';
import { ClearSigning } from '@/lib/clear-signing/ClearSigning';

export function TxDetail() {
  const { hash, chainId } = useParams();
  const client = useViemClient();
  const txHash = hash as Hash | undefined;

  const txQuery = useQuery({
    queryKey: ['tx', chainId, txHash],
    enabled: !!client && !!txHash,
    queryFn: async () => {
      if (!client || !txHash) throw new Error('No client');
      const [tx, receipt] = await Promise.all([
        client.getTransaction({ hash: txHash }),
        client
          .getTransactionReceipt({ hash: txHash })
          .catch(() => null),
      ]);
      return { tx, receipt };
    },
  });

  if (!txHash) return <div>Missing transaction hash.</div>;

  if (txQuery.isLoading) {
    return <div className="text-sm text-[var(--color-fg-muted)]">Loading transaction…</div>;
  }

  if (txQuery.isError || !txQuery.data) {
    return (
      <div className="text-sm text-red-600">
        Could not load transaction: {String(txQuery.error)}
      </div>
    );
  }

  const { tx, receipt } = txQuery.data;
  const success = receipt?.status === 'success';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">
          Transaction
        </div>
        <HexValue value={tx.hash} truncate={false} className="text-sm break-all" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clear signing</CardTitle>
        </CardHeader>
        <CardContent>
          <ClearSigning
            txData={{
              from: tx.from,
              to: tx.to ?? null,
              data: tx.input ?? '0x',
              value: tx.value,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--color-border)]">
          <InfoRow label="From">
            <AddressLink address={tx.from} />
          </InfoRow>
          {tx.to && (
            <InfoRow label="To">
              <AddressLink address={tx.to} />
            </InfoRow>
          )}
          <InfoRow label="Value">
            <span className="font-mono">{tx.value.toString()} wei</span>
          </InfoRow>
          {receipt && (
            <>
              <InfoRow label="Status">
                <span
                  className={
                    success ? 'text-green-600 dark:text-green-400' : 'text-red-600'
                  }
                >
                  {success ? 'Success' : 'Reverted'}
                </span>
              </InfoRow>
              <InfoRow label="Gas used">
                <span className="font-mono">{receipt.gasUsed.toString()}</span>
              </InfoRow>
              <InfoRow label="Block">
                <span className="font-mono">{receipt.blockNumber.toString()}</span>
              </InfoRow>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
