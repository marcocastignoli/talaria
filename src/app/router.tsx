import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './layout';
import { SetupOrRedirect } from '@/features/setup/SetupOrRedirect';
import { SetupWizard } from '@/features/setup/SetupWizard';
import { Settings } from '@/features/settings/Settings';
import { TxDetail } from '@/features/transaction/TxDetail';
import { AddressDetail } from '@/features/address/AddressDetail';
import { ChainHome } from '@/features/chain/ChainHome';

const basename = (import.meta.env.BASE_URL as string).replace(/\/$/, '') || undefined;

export const router = createBrowserRouter(
  [
    { path: '/', element: <SetupOrRedirect /> },
    { path: '/setup', element: <SetupWizard /> },
    {
      element: <AppLayout />,
      children: [
        { path: '/settings', element: <Settings /> },
        { path: '/chain/:chainId', element: <ChainHome /> },
        { path: '/chain/:chainId/tx/:hash', element: <TxDetail /> },
        { path: '/chain/:chainId/address/:addr', element: <AddressDetail /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  { basename },
);
