export function formatRelativeTime(timestampSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestampSeconds;
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestampSeconds * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year:
      new Date(timestampSeconds * 1000).getFullYear() === new Date().getFullYear()
        ? undefined
        : 'numeric',
  });
}

export function formatAbsoluteTime(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toLocaleString();
}
