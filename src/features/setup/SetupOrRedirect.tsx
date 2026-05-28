import { Navigate } from 'react-router';
import { useSettings } from '@/lib/settings/store';

export function SetupOrRedirect() {
  const rpcUrl = useSettings((s) => s.rpcUrl);
  const lastChainId = useSettings((s) => s.lastVisitedChainId);
  if (!rpcUrl) return <Navigate to="/setup" replace />;
  if (lastChainId !== null) return <Navigate to={`/chain/${lastChainId}`} replace />;
  return <Navigate to="/setup" replace />;
}
