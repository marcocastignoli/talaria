import { Link, useParams } from 'react-router';
import { useAddressLabel, pickPrimaryLabel } from '@/lib/identity/useAddressLabel';
import { useSettings } from '@/lib/settings/store';
import { truncateAddress } from '@/lib/identity/friendlyName';
import { cn } from '@/lib/cn';
import { Copy } from './Copy';

interface AddressLinkProps {
  address: string;
  chainId?: number;
  className?: string;
  showCopy?: boolean;
  disableLink?: boolean;
}

export function AddressLink({
  address,
  chainId,
  className,
  showCopy = true,
  disableLink = false,
}: AddressLinkProps) {
  const params = useParams();
  const displayStyle = useSettings((s) => s.displayStyle);
  const { data: label, isLoading } = useAddressLabel(address);

  const resolvedChainId = chainId ?? (params.chainId ? Number(params.chainId) : undefined);

  const truncated = truncateAddress(address);
  const { primary, secondary } = pickPrimaryLabel(label, displayStyle);

  const inner = (
    <span
      title={secondary || undefined}
      className={cn(
        'font-medium',
        displayStyle === 'raw' ? 'font-mono text-sm' : 'text-sm',
      )}
    >
      {isLoading && displayStyle !== 'raw' ? truncated : primary}
    </span>
  );

  const linkable = !disableLink && resolvedChainId !== undefined;

  return (
    <span className={cn('inline-flex items-center gap-1.5 min-w-0', className)}>
      {linkable ? (
        <Link
          to={`/chain/${resolvedChainId}/address/${address}`}
          className="hover:underline truncate"
        >
          {inner}
        </Link>
      ) : (
        <span className="truncate">{inner}</span>
      )}
      {showCopy && <Copy value={address} />}
    </span>
  );
}
