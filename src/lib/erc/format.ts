import { formatUnits } from 'viem';

export function formatTokenAmount(
  amount: bigint | undefined,
  decimals: number | undefined,
  symbol?: string,
): string {
  if (amount === undefined) return '—';
  const formatted =
    decimals === undefined ? amount.toString() : formatUnits(amount, decimals);
  // Add thousands separator to the integer part.
  const [int, frac] = formatted.split('.');
  const grouped = Number(int).toLocaleString('en-US');
  const rendered = frac ? `${grouped}.${trimTrailingZeros(frac)}` : grouped;
  return symbol ? `${rendered} ${symbol}` : rendered;
}

function trimTrailingZeros(frac: string): string {
  const trimmed = frac.replace(/0+$/, '');
  return trimmed || '0';
}

export function formatCount(amount: bigint | undefined): string {
  if (amount === undefined) return '—';
  return amount.toLocaleString('en-US');
}
