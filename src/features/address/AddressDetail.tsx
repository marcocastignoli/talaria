import { useParams, useSearchParams } from 'react-router';
import { type Address, isAddress, getAddress } from 'viem';
import { useAddressType } from '@/lib/identity/useAddressType';
import { useAddressLabel } from '@/lib/identity/useAddressLabel';
import { useSettings } from '@/lib/settings/store';
import { useErcInterfaces } from '@/lib/erc/detect';
import type { EnhancedAddressType } from '@/lib/identity/addressType';
import { AddressTypeAvatar } from '@/components/AddressTypeAvatar';
import { Copy } from '@/components/Copy';
import { truncateAddress } from '@/lib/identity/friendlyName';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Overview } from './Overview';
import { Transactions } from './Transactions';
import { Source } from './Source';
import { Verification } from './Verification';
import { Read } from './Read';
import { Write } from './Write';
import { VerificationChip } from '@/components/VerificationChip';
import { Card, CardContent } from '@/components/ui/card';

export function AddressDetail() {
  const { addr, chainId: chainIdParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';
  const setTab = (next: string) => {
    setSearchParams(
      (sp) => {
        const out = new URLSearchParams(sp);
        if (next === 'overview') out.delete('tab');
        else out.set('tab', next);
        return out;
      },
      { replace: true },
    );
  };
  const displayStyle = useSettings((s) => s.displayStyle);

  const normalized =
    addr && isAddress(addr) ? (getAddress(addr) as Address) : null;
  const chainId = chainIdParam ? Number(chainIdParam) : undefined;

  const { data: label } = useAddressLabel(normalized ?? undefined);
  const tokenSymbol = label?.tokenSymbol ?? null;
  const { data: typeInfo } = useAddressType(normalized ?? undefined);
  const { data: ercs } = useErcInterfaces(
    typeInfo?.type === 'contract' ? (normalized ?? undefined) : null,
  );

  const enhancedType: EnhancedAddressType | undefined = (() => {
    if (!typeInfo) return undefined;
    if (typeInfo.type !== 'contract') return typeInfo.type;
    if (ercs?.erc4626) return 'erc4626';
    if (ercs?.erc721) return 'erc721';
    if (ercs?.erc1155) return 'erc1155';
    if (ercs?.erc20) return 'erc20';
    return 'contract';
  })();

  if (!normalized) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-red-600 text-center">
          Invalid address.
        </CardContent>
      </Card>
    );
  }

  const truncated = truncateAddress(normalized);
  const primary =
    displayStyle === 'raw'
      ? truncated
      : (label?.ensName ?? label?.tokenName ?? label?.friendlyName ?? truncated);

  const isContract = typeInfo?.type === 'contract';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <AddressTypeAvatar type={enhancedType} size="lg" />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-xl font-semibold tracking-tight truncate">{primary}</div>
            {tokenSymbol && displayStyle !== 'raw' && (
              <span className="text-xs font-mono text-[var(--color-fg-muted)] shrink-0">
                {tokenSymbol}
              </span>
            )}
            {isContract && chainId !== undefined && (
              <VerificationChip chainId={chainId} address={normalized} />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)] font-mono">
            <span className="truncate">{normalized}</span>
            <Copy value={normalized} />
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {isContract && (
            <>
              <TabsTrigger value="source">Source</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </>
          )}
        </TabsList>
        <TabsContent value="overview">
          {chainId !== undefined ? (
            <Overview address={normalized} chainId={chainId} />
          ) : (
            <Overview address={normalized} chainId={1} />
          )}
        </TabsContent>
        <TabsContent value="transactions">
          {chainId !== undefined ? (
            <Transactions address={normalized} chainId={chainId} />
          ) : (
            <div className="text-sm text-[var(--color-fg-muted)]">Missing chain id.</div>
          )}
        </TabsContent>
        {isContract && chainId !== undefined && (
          <>
            <TabsContent value="source">
              <Source chainId={chainId} address={normalized} />
            </TabsContent>
            <TabsContent value="read">
              <Read chainId={chainId} address={normalized} />
            </TabsContent>
            <TabsContent value="write">
              <Write chainId={chainId} address={normalized} />
            </TabsContent>
            <TabsContent value="verification">
              <Verification chainId={chainId} address={normalized} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
