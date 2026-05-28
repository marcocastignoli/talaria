import { useState } from 'react';
import { Check, Copy as CopyIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CopyProps {
  value: string;
  className?: string;
  size?: number;
}

export function Copy({ value, className, size = 12 }: CopyProps) {
  const [copied, setCopied] = useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // swallow — clipboard permissions denied
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={copied ? 'Copied' : 'Copy'}
      className={cn(
        'inline-flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors',
        className,
      )}
    >
      {copied ? <Check size={size} /> : <CopyIcon size={size} />}
    </button>
  );
}
