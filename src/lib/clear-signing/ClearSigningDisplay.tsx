import { useState, type FC, type ReactNode } from 'react';
import type {
  DisplayField,
  DisplayFieldGroup,
  DisplayModel,
  EmbeddedCalldata,
  Warning,
} from '@ethereum-sourcify/clear-signing';
import { isFieldGroup } from '@ethereum-sourcify/clear-signing';
import { Link } from 'react-router';
import { AddressLink } from '@/components/AddressLink';
import { ExternalLink } from '@/components/ExternalLink';
import { HexValue } from '@/components/HexValue';
import { InfoRow } from '@/components/InfoRow';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

interface ClearSigningDisplayProps {
  model: DisplayModel;
  to?: string;
  chainId?: number;
}

const isHexAddress = (s: string | undefined): s is string =>
  typeof s === 'string' && /^0x[0-9a-fA-F]{40}$/.test(s);

const WarningBanner: FC<{ warnings: Warning[] }> = ({ warnings }) => (
  <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
    <div className="font-semibold">Warnings</div>
    <ul className="mt-1 list-inside list-disc space-y-0.5">
      {warnings.map((w, i) => (
        <li key={i}>
          <span className="font-mono text-xs opacity-80">{w.code}</span>{' '}
          <span>{w.message}</span>
        </li>
      ))}
    </ul>
  </div>
);

const FieldWarning: FC<{ warning: Warning }> = ({ warning }) => {
  // Suppress UNKNOWN_ADDRESS — our AddressLink shows a friendly name.
  if (warning.code === 'UNKNOWN_ADDRESS') return null;
  return (
    <span className="mt-0.5 block text-xs text-amber-600 dark:text-amber-400">
      ⚠ {warning.message}
    </span>
  );
};

const NamedAddressLink: FC<{
  address: string;
  chainId?: number;
  children: ReactNode;
}> = ({ address, chainId, children }) => (
  <Link
    to={`/chain/${chainId ?? 1}/address/${address}`}
    className="text-[var(--color-accent)] hover:underline"
  >
    {children}
  </Link>
);

const FieldValue: FC<{ field: DisplayField; chainId?: number }> = ({ field, chainId }) => {
  switch (field.fieldType) {
    case 'address': {
      const linkTarget = isHexAddress(field.rawAddress)
        ? field.rawAddress
        : isHexAddress(field.value)
          ? field.value
          : undefined;
      const valueIsAddress = isHexAddress(field.value);
      const showRawBelow =
        field.rawAddress !== undefined && field.rawAddress !== field.value;

      return (
        <div className="flex flex-col gap-0.5">
          {linkTarget !== undefined ? (
            valueIsAddress ? (
              <AddressLink address={linkTarget} chainId={chainId} />
            ) : (
              <NamedAddressLink address={linkTarget} chainId={chainId}>
                {field.value}
              </NamedAddressLink>
            )
          ) : (
            <span className={valueIsAddress ? 'font-mono' : ''} title={field.value}>
              {field.value}
            </span>
          )}
          {showRawBelow && (
            <span className="text-xs">
              <AddressLink address={field.rawAddress!} chainId={chainId} />
            </span>
          )}
          {field.tokenAddress !== undefined && isHexAddress(field.tokenAddress) && (
            <span className="text-xs text-[var(--color-fg-muted)]">
              Token: <AddressLink address={field.tokenAddress} chainId={chainId} />
            </span>
          )}
        </div>
      );
    }
    case 'bytes':
      return <HexValue value={field.value} />;
    default:
      return (
        <div className="flex flex-col gap-0.5">
          <span>{field.value}</span>
          {field.tokenAddress !== undefined && isHexAddress(field.tokenAddress) && (
            <span className="text-xs text-[var(--color-fg-muted)]">
              Token: <AddressLink address={field.tokenAddress} chainId={chainId} />
            </span>
          )}
        </div>
      );
  }
};

const EmbeddedCallChip: FC<{
  embedded: EmbeddedCalldata;
  rawValue: string;
  chainId?: number;
}> = ({ embedded, rawValue, chainId }) => {
  const [open, setOpen] = useState(false);
  const model = embedded.display;
  const contractName = model.metadata?.contractName;
  const intentStr = typeof model.intent === 'string' ? model.intent : undefined;

  let summary: string | undefined;
  if (model.interpolatedIntent !== undefined) summary = model.interpolatedIntent;
  else if (contractName !== undefined || intentStr !== undefined) {
    summary = [contractName, intentStr].filter(Boolean).join(': ');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {summary !== undefined ? (
          <span className="text-[var(--color-fg)]">{summary}</span>
        ) : (
          <HexValue value={rawValue} />
        )}
        <DialogTrigger asChild>
          <button
            type="button"
            className="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Details →
          </button>
        </DialogTrigger>
      </span>
      <DialogContent>
        <DialogTitle>Embedded Call</DialogTitle>
        {embedded.callee !== undefined && isHexAddress(embedded.callee) && (
          <div className="flex items-baseline gap-1 text-xs text-[var(--color-fg-muted)]">
            <span>Target:</span>
            <AddressLink address={embedded.callee} chainId={embedded.chainId ?? chainId} />
          </div>
        )}
        {embedded.chainId !== undefined && (
          <div className="text-xs text-amber-700 dark:text-amber-400">
            Cross-chain call — chain ID:{' '}
            <span className="font-semibold">{embedded.chainId}</span>
          </div>
        )}
        <ClearSigningDisplay
          model={model}
          to={embedded.callee}
          chainId={embedded.chainId ?? chainId}
        />
      </DialogContent>
    </Dialog>
  );
};

const FieldLabel: FC<{ field: DisplayField }> = ({ field }) => {
  if (field.embeddedCalldata === undefined) return <>{field.label}</>;
  return (
    <>
      {field.label}{' '}
      <span className="inline-block whitespace-nowrap rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
        Embedded Call
      </span>
    </>
  );
};

const FieldRow: FC<{ field: DisplayField; chainId?: number }> = ({ field, chainId }) => (
  <InfoRow label={<FieldLabel field={field} />}>
    {field.embeddedCalldata !== undefined ? (
      <EmbeddedCallChip
        embedded={field.embeddedCalldata}
        rawValue={field.value}
        chainId={chainId}
      />
    ) : (
      <FieldValue field={field} chainId={chainId} />
    )}
    {field.warning !== undefined && <FieldWarning warning={field.warning} />}
  </InfoRow>
);

const FieldGroupDisplay: FC<{ group: DisplayFieldGroup; chainId?: number }> = ({
  group,
  chainId,
}) => (
  <div className="py-2">
    {group.label !== undefined && (
      <div className="mb-1 flex items-center gap-2">
        <h4 className="text-sm font-semibold text-[var(--color-fg)]">{group.label}</h4>
        {group.warning !== undefined && <FieldWarning warning={group.warning} />}
      </div>
    )}
    {group.warning !== undefined && group.label === undefined && (
      <FieldWarning warning={group.warning} />
    )}
    {group.fields.length > 0 ? (
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 sm:px-4">
        {group.fields.map((f, i) => (
          <FieldRow key={i} field={f} chainId={chainId} />
        ))}
      </div>
    ) : (
      group.warning === undefined && (
        <p className="text-xs italic text-[var(--color-fg-muted)]">Empty</p>
      )
    )}
  </div>
);

const IntentDisplay: FC<{ intent: string | Record<string, string> }> = ({ intent }) => {
  if (typeof intent === 'string') return <span>{intent}</span>;
  return (
    <dl className="space-y-1">
      {Object.entries(intent).map(([k, v]) => (
        <div key={k} className="flex gap-2 text-sm">
          <dt className="font-medium text-[var(--color-fg-muted)]">{k}:</dt>
          <dd className="text-[var(--color-fg)]">{v}</dd>
        </div>
      ))}
    </dl>
  );
};

const RawCalldataDisplay: FC<{ fallback: { selector: string; args: string[] } }> = ({
  fallback,
}) => (
  <div className="space-y-2">
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
      Raw calldata fallback
    </div>
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-sm">
      <InfoRow label="Selector">
        <HexValue value={fallback.selector} />
      </InfoRow>
      {fallback.args.length > 0 && (
        <InfoRow label="Arguments">
          <ol className="list-inside list-decimal space-y-1">
            {fallback.args.map((a, i) => (
              <li key={i} className="text-xs">
                <HexValue value={a} />
              </li>
            ))}
          </ol>
        </InfoRow>
      )}
    </div>
  </div>
);

export const ClearSigningDisplay: FC<ClearSigningDisplayProps> = ({ model, to, chainId }) => {
  const hasCardContent =
    model.metadata?.contractName !== undefined ||
    model.interpolatedIntent !== undefined ||
    model.intent !== undefined ||
    (model.fields !== undefined && model.fields.length > 0);

  return (
    <div className="space-y-4">
      {model.warnings !== undefined && model.warnings.length > 0 && (
        <WarningBanner warnings={model.warnings} />
      )}

      {hasCardContent && (
        <div className={cn('rounded-md')}>
          <div className="divide-y divide-[var(--color-border)]">
            {model.metadata?.contractName !== undefined && (
              <InfoRow label="Interacting with">
                {to !== undefined && isHexAddress(to) ? (
                  <NamedAddressLink address={to} chainId={chainId}>
                    {model.metadata.contractName}
                  </NamedAddressLink>
                ) : (
                  <span className="text-[var(--color-accent)]">
                    {model.metadata.contractName}
                  </span>
                )}
              </InfoRow>
            )}

            {model.interpolatedIntent !== undefined ? (
              <InfoRow label="Intent">
                <span className="text-[var(--color-fg)]">{model.interpolatedIntent}</span>
              </InfoRow>
            ) : (
              model.intent !== undefined && (
                <InfoRow label="Intent">
                  <span className="text-[var(--color-fg)]">
                    <IntentDisplay intent={model.intent} />
                  </span>
                </InfoRow>
              )
            )}

            {model.fields?.map((f, i) =>
              isFieldGroup(f) ? (
                <FieldGroupDisplay key={i} group={f} chainId={chainId} />
              ) : (
                <FieldRow key={i} field={f} chainId={chainId} />
              ),
            )}
          </div>

          {model.metadata !== undefined &&
            (model.metadata.owner !== undefined ||
              model.metadata.info?.url !== undefined ||
              model.metadata.info?.deploymentDate !== undefined) && (
              <div className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-fg-muted)] space-y-0.5">
                {model.metadata.owner !== undefined && (
                  <div>
                    <span className="font-medium">Owner:</span> {model.metadata.owner}
                  </div>
                )}
                {model.metadata.info?.deploymentDate !== undefined && (
                  <div>
                    <span className="font-medium">Deployed:</span>{' '}
                    {model.metadata.info.deploymentDate}
                  </div>
                )}
                {model.metadata.info?.url !== undefined && (
                  <div>
                    <span className="font-medium">URL:</span>{' '}
                    <ExternalLink href={model.metadata.info.url}>
                      {model.metadata.info.url}
                    </ExternalLink>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {model.rawCalldataFallback !== undefined && (
        <RawCalldataDisplay fallback={model.rawCalldataFallback} />
      )}
    </div>
  );
};
