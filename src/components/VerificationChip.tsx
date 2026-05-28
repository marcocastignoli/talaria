import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  ShieldQuestion,
} from 'lucide-react';
import { Link } from 'react-router';
import { useContract } from '@/lib/sourcify/useContract';
import { useReVerification, useReVerifyEnabled } from '@/lib/sourcify/useReVerification';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

interface VerificationChipProps {
  chainId: number;
  address: string;
}

export function VerificationChip({ chainId, address }: VerificationChipProps) {
  const contract = useContract(chainId, address);
  const reEnabled = useReVerifyEnabled(address);
  const re = useReVerification(chainId, address, contract.data, { enabled: reEnabled });

  let icon: React.ReactNode;
  let label: string;
  let tooltip: string;
  let color: string;

  if (contract.isLoading) {
    icon = <Loader2 size={12} className="animate-spin" />;
    label = 'Checking';
    tooltip = 'Checking Sourcify…';
    color = 'bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]';
  } else if (contract.isError) {
    icon = <ShieldQuestion size={12} />;
    label = 'Sourcify error';
    tooltip = 'Could not reach Sourcify.';
    color = 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  } else if (!contract.data || !contract.isVerified) {
    icon = <ShieldOff size={12} />;
    label = 'Not verified';
    tooltip = 'No verified source on Sourcify for this contract.';
    color = 'bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]';
  } else if (re.status === 'verifying') {
    icon = <Loader2 size={12} className="animate-spin" />;
    label = 'Verifying locally';
    tooltip = 'Sourcify verified. Re-verifying source against on-chain bytecode in the browser…';
    color = 'bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]';
  } else if (re.status === 'perfect') {
    icon = <ShieldCheck size={12} />;
    label = 'Verified';
    tooltip = 'Sourcify match + locally re-verified (byte-for-byte).';
    color = 'bg-green-500/15 text-green-700 dark:text-green-400';
  } else if (re.status === 'partial') {
    icon = <ShieldCheck size={12} />;
    label = 'Partial match';
    tooltip = 'Sourcify match + locally re-verified (ignoring metadata hashes).';
    color = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  } else if (re.status === 'mismatch') {
    icon = <ShieldAlert size={12} />;
    label = 'Bytecode mismatch';
    tooltip =
      'Sourcify reports a match but local re-compilation does not produce the on-chain bytecode. Treat this contract with caution.';
    color = 'bg-red-500/15 text-red-700 dark:text-red-300';
  } else if (re.status === 'error') {
    icon = <ShieldAlert size={12} />;
    label = 'Re-verify failed';
    tooltip = `Could not re-verify locally: ${
      re.error instanceof Error ? re.error.message : String(re.error)
    }. Sourcify still reports a match.`;
    color = 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  } else if (contract.isFullMatch) {
    icon = <ShieldCheck size={12} />;
    label = 'Verified';
    tooltip = 'Full match on Sourcify (byte-for-byte including metadata).';
    color = 'bg-green-500/15 text-green-700 dark:text-green-400';
  } else {
    icon = <ShieldCheck size={12} />;
    label = 'Partial match';
    tooltip = 'Partial match on Sourcify (matches ignoring metadata hashes).';
    color = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }

  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium select-none',
        color,
      )}
    >
      {icon}
      {label}
    </span>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {contract.isVerified ? (
            <Link
              to={`/chain/${chainId}/address/${address}?tab=verification`}
              className="no-underline"
            >
              {chip}
            </Link>
          ) : (
            <span>{chip}</span>
          )}
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
