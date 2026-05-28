import { CheckCircle2, Loader2, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';
import { useContract } from '@/lib/sourcify/useContract';
import { useReVerification, useReVerifyEnabled } from '@/lib/sourcify/useReVerification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow } from '@/components/InfoRow';
import { ExternalLink } from '@/components/ExternalLink';

interface VerificationProps {
  chainId: number;
  address: string;
}

function MatchBadge({ status }: { status: 'exact_match' | 'match' | null }) {
  if (status === 'exact_match') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
        <CheckCircle2 size={12} /> Exact match
      </span>
    );
  }
  if (status === 'match') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={12} /> Partial match
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-fg-muted)]">
      <ShieldOff size={12} /> No match
    </span>
  );
}

export function Verification({ chainId, address }: VerificationProps) {
  const { data, isLoading, isError, error, isVerified, isFullMatch } = useContract(
    chainId,
    address,
  );
  const reEnabled = useReVerifyEnabled(address);
  const re = useReVerification(chainId, address, data, { enabled: reEnabled });

  if (isLoading) {
    return <div className="text-sm text-[var(--color-fg-muted)]">Loading verification…</div>;
  }

  if (isError) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
        Could not reach Sourcify: {String(error)}
      </div>
    );
  }

  if (!data || !isVerified) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-[var(--color-fg-muted)] text-center">
          This contract isn't verified by Sourcify. Submit it at{' '}
          <ExternalLink href="https://sourcify.dev">sourcify.dev</ExternalLink>.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          icon={<ShieldCheck size={14} />}
          color="green"
          label={isFullMatch ? 'Verified by Sourcify (exact)' : 'Verified by Sourcify (partial)'}
        />
        {re.status === 'verifying' && (
          <Badge
            icon={<Loader2 size={14} className="animate-spin" />}
            color="gray"
            label="Verifying locally…"
          />
        )}
        {re.status === 'perfect' && (
          <Badge icon={<ShieldCheck size={14} />} color="green" label="Locally re-verified (exact)" />
        )}
        {re.status === 'partial' && (
          <Badge icon={<ShieldCheck size={14} />} color="green" label="Locally re-verified (partial)" />
        )}
        {re.status === 'mismatch' && (
          <Badge icon={<ShieldAlert size={14} />} color="red" label="Local bytecode mismatch" />
        )}
        {re.status === 'error' && (
          <Badge
            icon={<ShieldAlert size={14} />}
            color="amber"
            label="Local re-verify failed"
          />
        )}
        {re.status === 'idle' && (
          <Badge icon={<ShieldAlert size={14} />} color="gray" label="Local re-verify idle" />
        )}
      </div>

      {re.status === 'error' && re.error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <span className="font-medium">Local re-verification failed:</span>{' '}
          {re.error instanceof Error ? re.error.message : String(re.error)}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Match details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--color-border)] py-1">
          <InfoRow label="Runtime bytecode">
            <MatchBadge status={data.runtimeMatch} />
          </InfoRow>
          <InfoRow label="Creation bytecode">
            <MatchBadge status={data.creationMatch} />
          </InfoRow>
          <InfoRow label="Verified at">
            <span className="font-mono text-xs">
              {new Date(data.verifiedAt).toLocaleString()}
            </span>
          </InfoRow>
        </CardContent>
      </Card>

      {data.compilation && (
        <Card>
          <CardHeader>
            <CardTitle>Compilation</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--color-border)] py-1">
            <InfoRow label="Language">{data.compilation.language}</InfoRow>
            <InfoRow label="Compiler">{data.compilation.compiler}</InfoRow>
            <InfoRow label="Version">
              <span className="font-mono text-xs">{data.compilation.compilerVersion}</span>
            </InfoRow>
            <InfoRow label="Contract">{data.compilation.fullyQualifiedName}</InfoRow>
            {data.compilation.compilerSettings?.optimizer && (
              <InfoRow label="Optimizer">
                {data.compilation.compilerSettings.optimizer.enabled ? (
                  <>
                    Enabled, {data.compilation.compilerSettings.optimizer.runs} runs
                  </>
                ) : (
                  'Disabled'
                )}
              </InfoRow>
            )}
            {data.compilation.compilerSettings?.evmVersion && (
              <InfoRow label="EVM target">
                {data.compilation.compilerSettings.evmVersion}
              </InfoRow>
            )}
          </CardContent>
        </Card>
      )}

      {data.proxyResolution?.isProxy && (
        <Card>
          <CardHeader>
            <CardTitle>Proxy</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--color-border)] py-1">
            <InfoRow label="Proxy type">
              {data.proxyResolution.proxyType ?? 'detected'}
            </InfoRow>
            {data.proxyResolution.implementations &&
              data.proxyResolution.implementations.length > 0 && (
                <InfoRow label="Implementation">
                  <div className="flex flex-col gap-0.5">
                    {data.proxyResolution.implementations.map((impl, i) => (
                      <a
                        key={i}
                        href={`/chain/${chainId}/address/${impl.address}`}
                        className="text-[var(--color-accent)] hover:underline font-mono text-xs"
                      >
                        {impl.name ? `${impl.name} · ` : ''}
                        {impl.address}
                      </a>
                    ))}
                  </div>
                </InfoRow>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Badge({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'green' | 'gray' | 'amber' | 'red';
}) {
  const colors = {
    green: 'bg-green-500/15 text-green-700 dark:text-green-400',
    gray: 'bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    red: 'bg-red-500/15 text-red-700 dark:text-red-300',
  };
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ' +
        colors[color]
      }
    >
      {icon}
      {label}
    </span>
  );
}
