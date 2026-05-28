import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { setLibSourcifyLogger } from '@ethereum-sourcify/lib-sourcify';
import { wagmiConfig } from '@/lib/wallet/config';
import { useSettings } from '@/lib/settings/store';

// Browser-friendly logger — keep lib-sourcify's default Pino out of the bundle path.
setLibSourcifyLogger({
  logLevel: 2,
  setLevel(level: number) {
    this.logLevel = level;
  },
  log(level: number, msg: string) {
    const my = (this as { logLevel: number }).logLevel;
    if (level > my) return;
    const fn = level === 0 ? console.error : level === 1 ? console.warn : console.log;
    fn('[lib-sourcify]', msg);
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeBridge({ children }: { children: ReactNode }) {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    if (theme === 'light') root.classList.add('theme-light');
    else if (theme === 'dark') root.classList.add('theme-dark');
    root.style.colorScheme = theme === 'system' ? '' : theme;
  }, [theme]);
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeBridge>{children}</ThemeBridge>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
