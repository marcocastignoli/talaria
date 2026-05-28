import { useMemo, useState, lazy, Suspense } from 'react';
import { useContract } from '@/lib/sourcify/useContract';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';

const MonacoEditor = lazy(async () => {
  const mod = await import('@monaco-editor/react');
  return { default: mod.default };
});

interface SourceProps {
  chainId: number;
  address: string;
}

function languageFor(path: string): string {
  if (path.endsWith('.sol')) return 'solidity';
  if (path.endsWith('.vy') || path.endsWith('.vyper')) return 'python';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.yul')) return 'sol';
  return 'plaintext';
}

export function Source({ chainId, address }: SourceProps) {
  const { data, isLoading, isError } = useContract(chainId, address);

  const sources = data?.sources;
  const fileNames = useMemo(() => (sources ? Object.keys(sources).sort() : []), [sources]);
  const [selected, setSelected] = useState<string | null>(null);

  const currentFile = selected ?? fileNames[0] ?? null;

  if (isLoading) {
    return (
      <div className="text-sm text-[var(--color-fg-muted)]">Loading source…</div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-[var(--color-fg-muted)] text-center">
          Source not available — this contract isn't verified by Sourcify.
        </CardContent>
      </Card>
    );
  }

  if (!sources || fileNames.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-[var(--color-fg-muted)] text-center">
          No source files returned by Sourcify.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 min-h-0">
      <Card className="overflow-hidden">
        <CardContent className="p-1.5 max-h-[calc(100vh-260px)] overflow-y-auto">
          <div className="flex flex-col">
            {fileNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelected(name)}
                className={cn(
                  'text-left px-2 py-1.5 rounded-md text-xs font-mono truncate transition-colors',
                  currentFile === name
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]',
                )}
                title={name}
              >
                {name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-0 h-[calc(100vh-260px)]">
          {currentFile && (
            <Suspense
              fallback={
                <div className="p-4 text-sm text-[var(--color-fg-muted)]">
                  Loading editor…
                </div>
              }
            >
              <MonacoEditor
                height="100%"
                language={languageFor(currentFile)}
                value={sources[currentFile]?.content ?? ''}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'none',
                  smoothScrolling: true,
                }}
              />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
