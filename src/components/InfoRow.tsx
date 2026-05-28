import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InfoRowProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

export function InfoRow({ label, children, className }: InfoRowProps) {
  return (
    <div className={cn('grid grid-cols-[180px_1fr] gap-4 py-2.5 items-start', className)}>
      <div className="text-sm text-[var(--color-fg-muted)]">{label}</div>
      <div className="text-sm text-[var(--color-fg)] min-w-0">{children}</div>
    </div>
  );
}
