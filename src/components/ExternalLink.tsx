import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
  showIcon?: boolean;
}

export function ExternalLink({
  href,
  children,
  className,
  showIcon = true,
  ...rest
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline',
        className,
      )}
      {...rest}
    >
      {children}
      {showIcon && <ExternalLinkIcon size={10} className="opacity-70" />}
    </a>
  );
}
