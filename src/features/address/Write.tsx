import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Loader2, ShieldAlert } from 'lucide-react';
import type { Abi, AbiFunction, Address, Hash } from 'viem';
import { useAccount, useWriteContract, useChainId } from 'wagmi';
import { useContract } from '@/lib/sourcify/useContract';
import { useReVerification, useReVerifyEnabled } from '@/lib/sourcify/useReVerification';
import { Card, CardContent } from '@/components/ui/card';
import { AbiFunctionForm } from '@/components/abi/AbiFunctionForm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface WriteProps {
  chainId: number;
  address: Address;
}

export function Write({ chainId, address }: WriteProps) {
  const { data } = useContract(chainId, address);
  const reEnabled = useReVerifyEnabled(address);
  const re = useReVerification(chainId, address, data, { enabled: reEnabled });
  const account = useAccount();
  const walletChainId = useChainId();

  const abi = (data?.abi as Abi | undefined) ?? null;

  const fns = useMemo<AbiFunction[]>(() => {
    if (!abi) return [];
    return abi.filter(
      (item): item is AbiFunction =>
        item.type === 'function' &&
        item.stateMutability !== 'view' &&
        item.stateMutability !== 'pure',
    );
  }, [abi]);

  const mismatch = re.status === 'mismatch';
  const chainMismatch = account.isConnected && walletChainId !== chainId;

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
          No write functions in this contract's ABI.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {mismatch && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 px-3 py-2 text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Bytecode mismatch</div>
            Sourcify's source doesn't reproduce the on-chain bytecode. Writes are blocked
            for safety. Inspect the Verification tab for details.
          </div>
        </div>
      )}
      {!account.isConnected && (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-fg-muted)]">
          Connect a wallet to sign transactions.
        </div>
      )}
      {chainMismatch && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          Your wallet is on chain {walletChainId}, but this contract is on chain {chainId}.
          Switch chains in your wallet to send transactions.
        </div>
      )}

      {fns.map((fn) => (
        <WriteFunctionItem
          key={fn.name + fn.inputs.length}
          fn={fn}
          chainId={chainId}
          address={address}
          walletConnected={account.isConnected && !chainMismatch}
          mismatch={mismatch}
          verifying={re.status === 'verifying'}
        />
      ))}
    </div>
  );
}

function WriteFunctionItem({
  fn,
  chainId,
  address,
  walletConnected,
  mismatch,
  verifying,
}: {
  fn: AbiFunction;
  chainId: number;
  address: Address;
  walletConnected: boolean;
  mismatch: boolean;
  verifying: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [confirmEarlySend, setConfirmEarlySend] = useState(false);
  const { writeContractAsync, isPending, error } = useWriteContract();

  const isPayable = fn.stateMutability === 'payable';

  const call = async (args: unknown[]) => {
    if (verifying && !confirmEarlySend) {
      setConfirmEarlySend(true);
      return;
    }
    setConfirmEarlySend(false);
    setTxHash(null);
    try {
      const hash = await writeContractAsync({
        address,
        abi: [fn] as Abi,
        functionName: fn.name,
        args: args as readonly unknown[],
        ...(isPayable ? { value: 0n } : {}),
      });
      setTxHash(hash);
    } catch {
      // error surfaced via useWriteContract's `error`
    }
  };

  const sendDisabled = !walletConnected || mismatch;

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
            {isPayable && <span className="ml-1.5 text-amber-600">payable</span>}
          </span>
        </button>
        {open && (
          <div className="p-4 pt-2 border-t border-[var(--color-border)]">
            {confirmEarlySend && verifying && (
              <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-3 py-2 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" />
                <div className="flex-1 flex flex-col gap-2">
                  <div>Still verifying locally. Recommended to wait a few seconds.</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmEarlySend(false)}
                    >
                      Wait
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setConfirmEarlySend(false)}
                    >
                      Proceed anyway
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <AbiFunctionForm
              fn={fn}
              onCall={call}
              loading={isPending}
              errorMessage={error instanceof Error ? error.message : null}
              buttonLabel="Send"
              buttonDisabled={sendDisabled}
              buttonHint={
                verifying ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
                    <span className="size-2 rounded-full bg-[var(--color-accent)]/40 animate-pulse" />
                    Verifying locally…
                  </span>
                ) : null
              }
            />
            {txHash && (
              <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)] mb-1">
                  Transaction sent
                </div>
                <Link
                  to={`/chain/${chainId}/tx/${txHash}`}
                  className="text-[var(--color-accent)] hover:underline font-mono text-xs break-all"
                >
                  {txHash}
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
