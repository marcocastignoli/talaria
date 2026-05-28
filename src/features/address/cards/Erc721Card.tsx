import type { Address } from 'viem';
import { Image as ImageIcon } from 'lucide-react';
import { useErc721Info } from '@/lib/erc/useErc721Info';
import { formatCount } from '@/lib/erc/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow } from '@/components/InfoRow';

interface Erc721CardProps {
  address: Address;
}

export function Erc721Card({ address }: Erc721CardProps) {
  const { data, isLoading } = useErc721Info(address);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon size={14} className="text-[var(--color-accent)]" />
          ERC-721 NFT collection
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-[var(--color-border)] py-1">
        {isLoading || !data ? (
          <div className="text-sm text-[var(--color-fg-muted)] py-2">Loading…</div>
        ) : (
          <>
            {data.name && <InfoRow label="Name">{data.name}</InfoRow>}
            {data.symbol && (
              <InfoRow label="Symbol">
                <span className="font-mono">{data.symbol}</span>
              </InfoRow>
            )}
            {data.totalSupply !== undefined && (
              <InfoRow label="Total supply">
                <span className="font-mono">{formatCount(data.totalSupply)}</span>
              </InfoRow>
            )}
            {data.totalSupply === undefined && (
              <InfoRow label="Total supply">
                <span className="text-[var(--color-fg-muted)] italic">
                  not exposed
                </span>
              </InfoRow>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
