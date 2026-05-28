import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createPublicClient, http } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/lib/settings/store';

export function SetupWizard() {
  const navigate = useNavigate();
  const setRpcUrl = useSettings((s) => s.setRpcUrl);
  const setLastVisitedChainId = useSettings((s) => s.setLastVisitedChainId);

  const [url, setUrl] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedChainId, setDetectedChainId] = useState<number | null>(null);

  const validate = async (rpcUrl: string): Promise<number> => {
    const client = createPublicClient({ transport: http(rpcUrl, { timeout: 8000 }) });
    const chainId = await client.getChainId();
    return Number(chainId);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setValidating(true);
    setError(null);
    try {
      const chainId = await validate(url);
      setDetectedChainId(chainId);
      setRpcUrl(url);
      setLastVisitedChainId(chainId);
      navigate(`/chain/${chainId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not reach RPC: ${err.message}`
          : 'Could not reach the RPC endpoint.',
      );
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-surface-2)]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <img src="/talaria.svg" alt="Talaria" className="size-12 mb-3" />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Talaria</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1 max-w-xs">
            A friendly EVM browser. Point it at any RPC endpoint to get started.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="glass rounded-xl p-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="rpc">RPC endpoint</Label>
            <Input
              id="rpc"
              type="url"
              required
              placeholder="https://ethereum-rpc.publicnode.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              autoFocus
            />
            <p className="text-xs text-[var(--color-fg-muted)]">
              Public, private, or self-hosted. Stored locally.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          {detectedChainId !== null && !error && (
            <div className="text-sm text-[var(--color-fg-muted)]">
              Detected chainId: <span className="font-mono">{detectedChainId}</span>
            </div>
          )}

          <Button type="submit" disabled={!url || validating}>
            {validating ? 'Connecting…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
