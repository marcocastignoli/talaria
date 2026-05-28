import { User, Box, UserCog, Coins, Image as ImageIcon, Layers, Vault } from 'lucide-react';
import { typeMeta, type EnhancedAddressType } from '@/lib/identity/addressType';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

interface AddressTypeAvatarProps {
  type: EnhancedAddressType | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_PX: Record<NonNullable<AddressTypeAvatarProps['size']>, { box: number; icon: number }> = {
  sm: { box: 24, icon: 12 },
  md: { box: 36, icon: 18 },
  lg: { box: 48, icon: 24 },
};

const STYLE: Record<EnhancedAddressType, { icon: typeof User; color: string }> = {
  eoa: {
    icon: User,
    color: 'bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]',
  },
  contract: {
    icon: Box,
    color: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  },
  delegated: {
    icon: UserCog,
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  erc20: {
    icon: Coins,
    color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  erc721: {
    icon: ImageIcon,
    color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  },
  erc1155: {
    icon: Layers,
    color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  },
  erc4626: {
    icon: Vault,
    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
};

export function AddressTypeAvatar({
  type,
  size = 'md',
  className,
}: AddressTypeAvatarProps) {
  const { box, icon } = SIZE_PX[size];

  if (type === undefined) {
    return (
      <div
        className={cn(
          'rounded-full bg-[var(--color-surface-2)] animate-pulse',
          className,
        )}
        style={{ width: box, height: box }}
      />
    );
  }

  const { icon: Icon, color } = STYLE[type];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-full shrink-0',
              color,
              className,
            )}
            style={{ width: box, height: box }}
          >
            <Icon size={icon} />
          </div>
        </TooltipTrigger>
        <TooltipContent>{typeMeta[type].label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
