'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

type LifecycleState = {
  projectStatus: string;
  completionConfirmedByCustomer: boolean;
  completionConfirmedAt: string | null;
};

const RECENT_COMPLETION_WINDOW_MS = 90_000;

/**
 * Treat a newly customer-confirmed completion as the end of the active
 * customer workspace. The project remains persisted in the marketplace, but
 * the browser leaves the secure active-project screen and returns to a clean
 * start state.
 *
 * The time window is deliberate: historical completed-project links remain
 * available later as records instead of redirecting forever.
 */
export const CustomerCompletionReset = () => {
  const pathname = usePathname();
  const projectId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length === 2 && parts[0] === 'project' ? parts[1] : '';
  }, [pathname]);

  const checkForFreshCompletion = useCallback(async () => {
    if (!projectId) return;

    const accessToken = new URLSearchParams(window.location.search).get('token')?.trim() ?? '';
    if (!accessToken) return;

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/lifecycle`, {
        headers: { 'x-project-access-token': accessToken },
        cache: 'no-store',
      });
      if (!response.ok) return;

      const payload = await response.json().catch(() => null);
      const lifecycle = payload?.lifecycle as LifecycleState | undefined;
      if (!lifecycle?.completionConfirmedByCustomer || lifecycle.projectStatus !== 'completed') return;

      const confirmedAt = lifecycle.completionConfirmedAt
        ? new Date(lifecycle.completionConfirmedAt).getTime()
        : Number.NaN;
      if (!Number.isFinite(confirmedAt)) return;

      const age = Date.now() - confirmedAt;
      if (age < 0 || age > RECENT_COMPLETION_WINDOW_MS) return;

      // Full navigation intentionally clears the active project component tree,
      // and replace() prevents the browser Back button from reopening the just-
      // completed active workspace.
      window.location.replace('/');
    } catch {
      // Completion itself has already been persisted. A transient reset check
      // must never interfere with the customer's completed-job confirmation.
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    void checkForFreshCompletion();

    const onDashboardUpdated = () => void checkForFreshCompletion();
    window.addEventListener('customer-dashboard-updated', onDashboardUpdated);

    // Covers completion through the main lifecycle panel, which currently
    // performs a short reload after a successful customer confirmation.
    const timer = window.setInterval(() => void checkForFreshCompletion(), 1800);

    return () => {
      window.removeEventListener('customer-dashboard-updated', onDashboardUpdated);
      window.clearInterval(timer);
    };
  }, [checkForFreshCompletion, projectId]);

  return null;
};
