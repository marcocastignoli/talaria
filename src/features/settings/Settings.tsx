import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSettings, type DisplayStyle, type Theme } from '@/lib/settings/store';

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-[var(--color-surface-2)] p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={
            'px-3 py-1 text-sm rounded-md transition-colors ' +
            (value === opt.value
              ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-sm'
              : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]')
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Settings() {
  const s = useSettings();
  const [resetConfirm, setResetConfirm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
          <CardDescription>How Talaria talks to the network and Sourcify.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rpc">Chain RPC URL</Label>
            <Input
              id="rpc"
              value={s.rpcUrl}
              onChange={(e) => s.setRpcUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mainnetRpc">Mainnet RPC (for ENS)</Label>
            <Input
              id="mainnetRpc"
              value={s.mainnetRpcUrl}
              onChange={(e) => s.setMainnetRpcUrl(e.target.value)}
            />
            <p className="text-xs text-[var(--color-fg-muted)]">
              Used for ENS reverse-resolution even when the primary chain isn't mainnet.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sourcify">Sourcify server URL</Label>
            <Input
              id="sourcify"
              value={s.sourcifyServerUrl}
              onChange={(e) => s.setSourcifyServerUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ipfs">IPFS gateway</Label>
            <Input
              id="ipfs"
              value={s.ipfsGateway}
              onChange={(e) => s.setIpfsGateway(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenderly</CardTitle>
          <CardDescription>
            Required for the Simulate button (added in Phase 4).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tnd-key">API key</Label>
            <Input
              id="tnd-key"
              type="password"
              autoComplete="off"
              value={s.tenderly.apiKey}
              onChange={(e) => s.setTenderly({ apiKey: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tnd-account">Account slug</Label>
              <Input
                id="tnd-account"
                value={s.tenderly.account}
                onChange={(e) => s.setTenderly({ account: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tnd-project">Project slug</Label>
              <Input
                id="tnd-project"
                value={s.tenderly.project}
                onChange={(e) => s.setTenderly({ project: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label>Address style</Label>
              <p className="text-xs text-[var(--color-fg-muted)]">
                ENS is always preferred when available. This controls the fallback.
              </p>
            </div>
            <SegmentedControl<DisplayStyle>
              value={s.displayStyle}
              onChange={s.setDisplayStyle}
              options={[
                { value: 'friendly', label: 'Friendly' },
                { value: 'raw', label: 'Raw' },
              ]}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>Theme</Label>
            <SegmentedControl<Theme>
              value={s.theme}
              onChange={s.setTheme}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behavior</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="dwell">Re-verification dwell</Label>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Seconds to wait on a contract page before kicking off local re-verification. 0 = eager.
              </p>
            </div>
            <Input
              id="dwell"
              type="number"
              min={0}
              max={30}
              step={1}
              className="w-24"
              value={Math.round(s.reverifyDwellMs / 1000)}
              onChange={(e) => s.setReverifyDwellMs(Number(e.target.value) * 1000)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>Default block tag</Label>
            <SegmentedControl
              value={s.defaultBlockTag}
              onChange={s.setDefaultBlockTag}
              options={[
                { value: 'latest', label: 'Latest' },
                { value: 'finalized', label: 'Finalized' },
                { value: 'safe', label: 'Safe' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 text-sm">
            <div>Talaria — friendly EVM browser</div>
            <div className="text-xs text-[var(--color-fg-muted)]">version 0.0.1</div>
          </div>
          {resetConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-fg-muted)]">Sure?</span>
              <Button variant="destructive" size="sm" onClick={() => s.resetAll()}>
                Reset all
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setResetConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setResetConfirm(true)}>
              Reset to defaults
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
