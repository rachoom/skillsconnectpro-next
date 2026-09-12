import type { ReactNode } from 'react';
import AdminDispatchAlertMonitor from './AdminDispatchAlertMonitor';
import ResetMarketplaceDataControl from './ResetMarketplaceDataControl';
import WhatsAppReadinessControl from './WhatsAppReadinessControl';

export default function MarketplaceAdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdminDispatchAlertMonitor />
      <WhatsAppReadinessControl />
      <ResetMarketplaceDataControl />
    </>
  );
}
