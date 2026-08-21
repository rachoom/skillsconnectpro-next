import type { ReactNode } from 'react';
import AdminDispatchAlertMonitor from './AdminDispatchAlertMonitor';
import ResetMarketplaceDataControl from './ResetMarketplaceDataControl';

export default function MarketplaceAdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdminDispatchAlertMonitor />
      <ResetMarketplaceDataControl />
    </>
  );
}
