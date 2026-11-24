'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Customer/provider job controls belong to job routes, not public entry pages.
// Keep SSR enabled and retain the existing mounting order on applicable routes.
const CompletedProjectSummary = dynamic(() => import('./CompletedProjectSummary').then((module) => module.CompletedProjectSummary));
const CustomerCompletionAction = dynamic(() => import('./CustomerCompletionAction').then((module) => module.CustomerCompletionAction));
const CustomerDashboardAutoScroll = dynamic(() => import('./CustomerDashboardAutoScroll').then((module) => module.CustomerDashboardAutoScroll));
const FeedbackSubmissionAutoClose = dynamic(() => import('./FeedbackSubmissionAutoClose').then((module) => module.FeedbackSubmissionAutoClose));
const MarketplaceFeedbackLauncher = dynamic(() => import('./MarketplaceFeedbackLauncher').then((module) => module.MarketplaceFeedbackLauncher));
const MarketplaceLifecycleHost = dynamic(() => import('./MarketplaceLifecycleHost').then((module) => module.MarketplaceLifecycleHost));

export function RouteScopedMarketplaceFeatures() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  const customer = parts.length === 2 && parts[0] === 'project';
  const provider = parts.length === 2 && parts[0] === 'provider-opportunity';

  if (!customer && !provider) return null;

  return (
    <>
      {customer && <CompletedProjectSummary />}
      <MarketplaceLifecycleHost />
      {customer && (
        <>
          <CustomerCompletionAction />
          <CustomerDashboardAutoScroll />
          <FeedbackSubmissionAutoClose />
          <MarketplaceFeedbackLauncher />
        </>
      )}
    </>
  );
}
