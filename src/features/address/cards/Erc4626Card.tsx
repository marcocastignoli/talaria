import type { Address } from 'viem';
import { Vault } from 'lucide-react';
import { useErc4626Info } from '@/lib/erc/useErc4626Info';
import { useErc20Info } from '@/lib/erc/useErc20Info';
import { formatTokenAmount } from '@/lib/erc/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow } from '@/components/InfoRow';
import { AddressLink } from '@/components/AddressLink';

interface Erc4626CardProps {
  address: Address;
  chainId: number;
}

export function Erc4626Card({ address, chainId }: Erc4626CardProps) {
  const { data, isLoading } = useErc4626Info(address);
  const { data: asset } = useErc20Info(data?.asset);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Vault size={14} className="text-[var(--color-accent)]" />
          ERC-4626 vault
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-[var(--color-border)] py-1">
        {isLoading || !data ? (
          <div className="text-sm text-[var(--color-fg-muted)] py-2">Loading…</div>
        ) : (
          <>
            {data.asset && (
              <InfoRow label="Underlying asset">
                <div className="flex flex-col gap-0.5">
                  <AddressLink address={data.asset} chainId={chainId} />
                  {asset?.symbol && (
                    <span className="text-xs text-[var(--color-fg-muted)] font-mono">
                      {asset.symbol}
                      {asset.name && ` · ${asset.name}`}
                    </span>
                  )}
                </div>
              </InfoRow>
            )}
            {data.totalAssets !== undefined && asset?.decimals !== undefined && (
              <InfoRow label="Total assets">
                <span className="font-mono">
                  {formatTokenAmount(data.totalAssets, asset.decimals, asset.symbol)}
                </span>
              </InfoRow>
            )}
            {data.totalSupply !== undefined && data.decimals !== undefined && (
              <InfoRow label="Shares outstanding">
                <span className="font-mono">
                  {formatTokenAmount(data.totalSupply, data.decimals)}
                </span>
              </InfoRow>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
