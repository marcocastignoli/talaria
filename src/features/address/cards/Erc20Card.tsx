import type { Address } from 'viem';
import { Coins } from 'lucide-react';
import { useErc20Info } from '@/lib/erc/useErc20Info';
import { formatTokenAmount } from '@/lib/erc/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow } from '@/components/InfoRow';

interface Erc20CardProps {
  address: Address;
}

export function Erc20Card({ address }: Erc20CardProps) {
  const { data, isLoading } = useErc20Info(address);

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Coins size={14} className="text-[var(--color-accent)]" />
            ERC-20 Token
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-fg-muted)]">
          Loading…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Coins size={14} className="text-[var(--color-accent)]" />
          ERC-20 Token
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-[var(--color-border)] py-1">
        {data.name && <InfoRow label="Name">{data.name}</InfoRow>}
        {data.symbol && (
          <InfoRow label="Symbol">
            <span className="font-mono">{data.symbol}</span>
          </InfoRow>
        )}
        {data.decimals !== undefined && (
          <InfoRow label="Decimals">
            <span className="font-mono">{data.decimals}</span>
          </InfoRow>
        )}
        {data.totalSupply !== undefined && (
          <InfoRow label="Total supply">
            <span className="font-mono">
              {formatTokenAmount(data.totalSupply, data.decimals, data.symbol)}
            </span>
          </InfoRow>
        )}
      </CardContent>
    </Card>
  );
}
