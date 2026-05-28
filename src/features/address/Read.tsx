import { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Abi, AbiFunction, Address } from 'viem';
import { useViemClient } from '@/lib/rpc';
import { useContract } from '@/lib/sourcify/useContract';
import { Card, CardContent } from '@/components/ui/card';
import { AbiFunctionForm } from '@/components/abi/AbiFunctionForm';
import { formatAbiResult } from '@/components/abi/parseAbiInput';
import { cn } from '@/lib/cn';

interface ReadProps {
  chainId: number;
  address: Address;
}

export function Read({ chainId, address }: ReadProps) {
  const { data } = useContract(chainId, address);
  const abi = (data?.abi as Abi | undefined) ?? null;

  const fns = useMemo<AbiFunction[]>(() => {
    if (!abi) return [];
    return abi.filter(
      (item): item is AbiFunction =>
        item.type === 'function' &&
        (item.stateMutability === 'view' || item.stateMutability === 'pure'),
    );
  }, [abi]);

  if (!abi) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-[var(--color-fg-muted)] text-center">
          No ABI available — this contract isn't verified by Sourcify.
        </CardContent>
      </Card>
    );
  }
  if (fns.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-[var(--color-fg-muted)] text-center">
          No read functions in this contract's ABI.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {fns.map((fn) => (
        <ReadFunctionItem key={fn.name + fn.inputs.length} fn={fn} chainId={chainId} address={address} />
      ))}
    </div>
  );
}

function ReadFunctionItem({
  fn,
  chainId: _chainId,
  address,
}: {
  fn: AbiFunction;
  chainId: number;
  address: Address;
}) {
  const client = useViemClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const call = async (args: unknown[]) => {
    if (!client) {
      setError('No RPC client');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const out = await client.readContract({
        address,
        abi: [fn] as Abi,
        functionName: fn.name,
        args: args as readonly unknown[],
      });
      setResult(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-[var(--color-surface-2)]/60 transition-colors rounded-t-xl"
        >
          <ChevronRight
            size={14}
            className={cn(
              'shrink-0 text-[var(--color-fg-muted)] transition-transform',
              open && 'rotate-90',
            )}
          />
          <span className="font-mono text-[var(--color-fg)]">{fn.name}</span>
          <span className="text-xs text-[var(--color-fg-muted)] truncate">
            ({fn.inputs.map((i) => i.type).join(', ')})
            {fn.outputs && fn.outputs.length > 0 && (
              <>
                {' → '}
                {fn.outputs.map((o) => o.type).join(', ')}
              </>
            )}
          </span>
        </button>
        {open && (
          <div className="p-4 pt-2 border-t border-[var(--color-border)]">
            <AbiFunctionForm
              fn={fn}
              onCall={call}
              loading={loading}
              errorMessage={error}
              buttonLabel="Read"
            />
            {result !== null && !loading && (
              <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                <div className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)] mb-1">
                  Result
                </div>
                <pre className="whitespace-pre-wrap break-all text-xs font-mono text-[var(--color-fg)]">
                  {Array.isArray(result)
                    ? result.map(formatAbiResult).join('\n')
                    : formatAbiResult(result)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
