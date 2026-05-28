import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Settings as SettingsIcon } from 'lucide-react';
import { useSettings } from '@/lib/settings/store';
import { cn } from '@/lib/cn';

export function AppLayout() {
  const navigate = useNavigate();
  const rpcUrl = useSettings((s) => s.rpcUrl);
  const lastChainId = useSettings((s) => s.lastVisitedChainId);

  if (!rpcUrl) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-2)]">
      <header className="sticky top-0 z-30 glass">
        <div className="max-w-5xl mx-auto h-12 px-4 flex items-center justify-between">
          <Link
            to={lastChainId ? `/chain/${lastChainId}` : '/'}
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <img src="/talaria.svg" alt="" className="size-5" />
            Talaria
          </Link>
          <nav className="flex items-center gap-2">
            <appkit-button balance="hide" size="sm" />
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center justify-center size-8 rounded-md transition-colors',
                  isActive
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
                )
              }
              title="Settings"
            >
              <SettingsIcon size={16} />
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
