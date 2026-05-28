import { Copy } from './Copy';
import { cn } from '@/lib/cn';

interface HexValueProps {
  value: string;
  className?: string;
  showCopy?: boolean;
  truncate?: boolean;
}

export function HexValue({ value, className, showCopy = true, truncate = true }: HexValueProps) {
  const display =
    truncate && value.length > 16 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-sm', className)}>
      <span title={value}>{display}</span>
      {showCopy && <Copy value={value} />}
    </span>
  );
}
