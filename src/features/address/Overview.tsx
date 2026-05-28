import { type Address, formatEther } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { useViemClient } from '@/lib/rpc';
import { useAddressType } from '@/lib/identity/useAddressType';
import { typeMeta } from '@/lib/identity/addressType';
import { useAddressLabel } from '@/lib/identity/useAddressLabel';
import { useErcInterfaces } from '@/lib/erc/detect';
import { Erc20Card } from './cards/Erc20Card';
import { Erc721Card } from './cards/Erc721Card';
import { Erc1155Card } from './cards/Erc1155Card';
import { Erc4626Card } from './cards/Erc4626Card';
import { Card, CardContent } from '@/components/ui/card';
import { InfoRow } from '@/components/InfoRow';
import { AddressLink } from '@/components/AddressLink';
import { HexValue } from '@/components/HexValue';

interface OverviewProps {
  address: Address;
  chainId: number;
}

export function Overview({ address, chainId }: OverviewProps) {
  const client = useViemClient();
  const { data: typeInfo } = useAddressType(address);
  const { data: label } = useAddressLabel(address);
  const { data: ercs } = useErcInterfaces(typeInfo?.type === 'contract' ? address : null);
  const special = label?.special;

  const onchainQuery = useQuery({
    queryKey: ['addressOnchain', address],
    enabled: !!client,
    queryFn: async () => {
      if (!client) throw new Error('No client');
      const [balance, nonce] = await Promise.all([
        client.getBalance({ address }),
        client.getTransactionCount({ address }),
      ]);
      return { balance, nonce };
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {ercs?.erc4626 && <Erc4626Card address={address} chainId={chainId} />}
      {ercs?.erc20 && !ercs.erc4626 && <Erc20Card address={address} />}
      {ercs?.erc4626 && <Erc20Card address={address} />}
      {ercs?.erc721 && <Erc721Card address={address} />}
      {ercs?.erc1155 && <Erc1155Card />}
      <Card>
      <CardContent className="divide-y divide-[var(--color-border)] py-1">
        <InfoRow label="Address">
          <HexValue value={address} truncate={false} className="break-all" />
        </InfoRow>
        <InfoRow label="Type">
          <div className="flex flex-col gap-0.5">
            <span className="text-[var(--color-fg)]">
              {special ? special.name : typeInfo ? typeMeta[typeInfo.type].label : '…'}
            </span>
            <span className="text-xs text-[var(--color-fg-muted)]">
              {special?.description ?? (typeInfo ? typeMeta[typeInfo.type].sentence : '')}
            </span>
          </div>
        </InfoRow>
        {typeInfo?.type === 'delegated' && typeInfo.delegateTarget && (
          <InfoRow label="Delegate target">
            <AddressLink address={typeInfo.delegateTarget} />
          </InfoRow>
        )}
        <InfoRow label="Balance">
          {onchainQuery.data ? (
            <span className="font-mono">{formatEther(onchainQuery.data.balance)} ETH</span>
          ) : (
            <span className="text-[var(--color-fg-muted)]">…</span>
          )}
        </InfoRow>
        {typeInfo?.type !== 'contract' && (
          <InfoRow label="Nonce">
            {onchainQuery.data ? (
              <span className="font-mono">{onchainQuery.data.nonce}</span>
            ) : (
              <span className="text-[var(--color-fg-muted)]">…</span>
            )}
          </InfoRow>
        )}
      </CardContent>
      </Card>
    </div>
  );
}
