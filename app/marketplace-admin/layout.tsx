import type { ReactNode } from 'react';
import ResetMarketplaceDataControl from './ResetMarketplaceDataControl';

export default function MarketplaceAdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ResetMarketplaceDataControl />
    </>
  );
}
