import { type FC, type ReactNode } from 'react';
import type { DisplayField, DisplayFieldGroup } from '@ethereum-sourcify/clear-signing';
import { isFieldGroup } from '@ethereum-sourcify/clear-signing';
import { useClearSigningModel, type ClearSigningTxData } from './useClearSigningModel';
import { useAddressLabel, pickPrimaryLabel } from '@/lib/identity/useAddressLabel';
import { useSettings } from '@/lib/settings/store';
import { truncateAddress } from '@/lib/identity/friendlyName';

interface ClearSigningSummaryProps {
  txData: ClearSigningTxData;
  chainId: number | undefined;
  fallback?: ReactNode;
}

const MAX_VALUE_FIELDS = 3;

function isAddressLike(s: unknown): s is string {
  return typeof s === 'string' && /^0x[0-9a-fA-F]{40}$/.test(s);
}

function flattenFields(
  items: ReadonlyArray<DisplayField | DisplayFieldGroup> | undefined,
): DisplayField[] {
  if (!items) return [];
  const out: DisplayField[] = [];
  for (const it of items) {
    if (isFieldGroup(it)) {
      for (const sub of it.fields) out.push(sub);
    } else {
      out.push(it);
    }
  }
  return out;
}

function addressFromField(f: DisplayField): string | null {
  // Prefer the resolver-supplied raw address; fall back to the displayed value
  // when it's still a hex address (i.e., neither ENS nor local name resolved).
  if (isAddressLike(f.rawAddress)) return f.rawAddress;
  if (isAddressLike(f.value)) return f.value;
  return null;
}

/**
 * Inline address rendering for the summary line — resolves to ENS / token
 * name / friendly name (honoring the displayStyle setting), same hierarchy as
 * <AddressLink> but without the link wrapper or copy button.
 */
function SummaryAddress({ address }: { address: string }) {
  const { data: label } = useAddressLabel(address);
  const displayStyle = useSettings((s) => s.displayStyle);
  const { primary } = pickPrimaryLabel(label, displayStyle);
  return <>{primary || truncateAddress(address)}</>;
}

/**
 * For a non-address field, render its displayed value. If the value happens
 * to be an address (shouldn't normally) or contains hex noise, truncate it.
 */
function fieldDisplayValue(field: DisplayField): string | null {
  const v = field.value;
  if (!v || typeof v !== 'string') return null;
  if (field.fieldType === 'bytes' && v.startsWith('0x') && v.length > 14) {
    return `${v.slice(0, 10)}…`;
  }
  return v;
}

/**
 * Compact one-line summary of a transaction, suitable for tx list rows.
 * Reads as a sentence: `<contractName>: <intent> <values…> to <address>`.
 */
export const ClearSigningSummary: FC<ClearSigningSummaryProps> = ({
  txData,
  chainId,
  fallback,
}) => {
  const { data: model, isLoading } = useClearSigningModel(txData, chainId);

  if (isLoading) {
    return (
      <span className="inline-block h-3 w-32 rounded bg-[var(--color-surface-3)] animate-pulse" />
    );
  }

  if (!model) return <>{fallback ?? null}</>;

  if (model.interpolatedIntent !== undefined) {
    return <span className="truncate">{model.interpolatedIntent}</span>;
  }

  const contractName = model.metadata?.contractName;
  const intent = typeof model.intent === 'string' ? model.intent : undefined;
  const prefix = [contractName, intent].filter(Boolean).join(': ');

  const flat = flattenFields(model.fields);

  const addressFields: string[] = [];
  const valueParts: string[] = [];
  for (const f of flat) {
    const addr = f.fieldType === 'address' ? addressFromField(f) : null;
    if (addr) {
      addressFields.push(addr);
    } else {
      const v = fieldDisplayValue(f);
      if (v) valueParts.push(v);
    }
  }

  const trimmedValues = valueParts.slice(0, MAX_VALUE_FIELDS).join(' ');
  const firstAddress = addressFields[0] ?? null;
  const extraAddresses = addressFields.slice(1);

  const hasAnything = !!prefix || !!trimmedValues || !!firstAddress;
  if (!hasAnything) return <>{fallback ?? null}</>;

  return (
    <span className="truncate">
      {prefix && (
        <span className="text-[var(--color-fg-muted)]">{prefix}</span>
      )}
      {prefix && (trimmedValues || firstAddress) && ' '}
      {trimmedValues && <span>{trimmedValues}</span>}
      {firstAddress && (
        <>
          <span className="text-[var(--color-fg-muted)]">
            {trimmedValues ? ' to ' : ' '}
          </span>
          <SummaryAddress address={firstAddress} />
        </>
      )}
      {extraAddresses.map((addr, i) => (
        <span key={i}>
          <span className="text-[var(--color-fg-muted)]">, </span>
          <SummaryAddress address={addr} />
        </span>
      ))}
    </span>
  );
};
