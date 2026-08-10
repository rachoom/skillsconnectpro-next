'use client';

import { useEffect, useState } from 'react';
import { MarketplaceLifecyclePanel } from './MarketplaceLifecyclePanel';

const normalise = (value: string | null | undefined) =>
  String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Keeps the lifecycle panel in sync with the customer dashboard.
 *
 * Before contact release the lifecycle endpoint intentionally returns no
 * controls. Once contact is released, the panel must be remounted immediately
 * when the customer taps "Open job controls" rather than waiting for a full
 * browser refresh.
 */
export const MarketplaceLifecycleHost = () => {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let timeout = 0;

    const scrollToControls = () => {
      const controls = document.getElementById('job-status-controls');
      if (!controls) return false;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      controls.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });

      window.setTimeout(() => {
        const firstAction = controls.querySelector<HTMLElement>('button:not([disabled]), a[href]');
        firstAction?.focus({ preventScroll: true });
      }, reducedMotion ? 0 : 450);

      return true;
    };

    const openControls = () => {
      if (scrollToControls()) return;

      setRevision((current) => current + 1);
      observer?.disconnect();
      observer = new MutationObserver(() => {
        if (scrollToControls()) observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => observer?.disconnect(), 8000);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('button, a') : null;
      if (!target) return;
      const label = normalise(target.textContent);
      if (label.includes('open job controls')) openControls();
    };

    const onOpenRequest = () => openControls();
    const onDashboardUpdated = () => setRevision((current) => current + 1);

    document.addEventListener('click', onClick, true);
    window.addEventListener('marketplace-open-job-controls', onOpenRequest);
    window.addEventListener('customer-dashboard-updated', onDashboardUpdated);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('marketplace-open-job-controls', onOpenRequest);
      window.removeEventListener('customer-dashboard-updated', onDashboardUpdated);
      observer?.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  return <MarketplaceLifecyclePanel key={revision} />;
};
