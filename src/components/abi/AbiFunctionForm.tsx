import { useState, type ReactNode } from 'react';
import type { AbiFunction } from 'viem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { parseAbiInput, AbiParseError } from './parseAbiInput';

interface AbiFunctionFormProps {
  fn: AbiFunction;
  onCall: (args: unknown[]) => void | Promise<void>;
  loading?: boolean;
  errorMessage?: string | null;
  buttonLabel?: string;
  buttonDisabled?: boolean;
  buttonHint?: ReactNode;
  children?: ReactNode;
}

export function AbiFunctionForm({
  fn,
  onCall,
  loading = false,
  errorMessage = null,
  buttonLabel = 'Call',
  buttonDisabled = false,
  buttonHint,
  children,
}: AbiFunctionFormProps) {
  const [values, setValues] = useState<string[]>(() => fn.inputs.map(() => ''));
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});

  const update = (i: number, v: string) => {
    setValues((prev) => prev.map((x, j) => (j === i ? v : x)));
    setFieldErrors((prev) => {
      if (!(i in prev)) return prev;
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };

  const submit = async () => {
    const errs: Record<number, string> = {};
    const args: unknown[] = [];
    fn.inputs.forEach((inp, i) => {
      try {
        args.push(parseAbiInput(inp.type, inp.name || `arg${i}`, values[i] ?? ''));
      } catch (e) {
        if (e instanceof AbiParseError) errs[i] = e.message;
        else errs[i] = String(e);
      }
    });
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    await onCall(args);
  };

  return (
    <div className="flex flex-col gap-3">
      {fn.inputs.length === 0 && (
        <div className="text-xs text-[var(--color-fg-muted)]">No inputs</div>
      )}
      {fn.inputs.map((inp, i) => (
        <div key={i} className="flex flex-col gap-1">
          <Label className="text-xs">
            <span className="text-[var(--color-fg)]">{inp.name || `arg${i}`}</span>{' '}
            <span className="text-[var(--color-fg-muted)] font-mono">{inp.type}</span>
          </Label>
          <Input
            value={values[i] ?? ''}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholderFor(inp.type)}
            spellCheck={false}
            autoComplete="off"
          />
          {fieldErrors[i] && (
            <div className="text-xs text-red-600">{fieldErrors[i]}</div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3 mt-1">
        <Button onClick={submit} disabled={loading || buttonDisabled}>
          {loading ? '…' : buttonLabel}
        </Button>
        {buttonHint}
      </div>
      {errorMessage && (
        <div className="text-xs text-red-600 whitespace-pre-wrap break-all">
          {errorMessage}
        </div>
      )}
      {children}
    </div>
  );
}

function placeholderFor(type: string): string {
  if (type === 'address') return '0x…';
  if (type === 'bool') return 'true / false';
  if (type === 'string') return '';
  if (type.startsWith('bytes')) return '0x…';
  if (type.startsWith('uint') || type.startsWith('int')) return '0';
  if (type.endsWith(']')) return '["...","..."]';
  return '';
}
