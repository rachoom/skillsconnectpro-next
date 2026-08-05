'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export const MarketplaceVisualConsistency = () => {
  const pathname = usePathname();

  useEffect(() => {
    const surface = pathname.startsWith('/provider-opportunity/')
      ? 'provider'
      : pathname === '/get-help'
        ? 'intake'
        : pathname.startsWith('/project/')
          ? 'customer'
          : '';

    if (surface) document.body.dataset.scpSurface = surface;
    else delete document.body.dataset.scpSurface;

    return () => delete document.body.dataset.scpSurface;
  }, [pathname]);

  return (
    <style>{`
      body[data-scp-surface='provider'],
      body[data-scp-surface='intake'],
      body[data-scp-surface='customer'] {
        overscroll-behavior-x: none;
      }

      body[data-scp-surface='provider'] main {
        background:
          radial-gradient(circle at 10% 0%, rgba(54, 104, 73, .28), transparent 28rem),
          radial-gradient(circle at 90% 30%, rgba(245, 197, 24, .12), transparent 24rem),
          #20120b !important;
      }

      body[data-scp-surface='provider'] input,
      body[data-scp-surface='provider'] textarea,
      body[data-scp-surface='provider'] select {
        border: 2px solid #78936f !important;
        background: #fffdf4 !important;
        color: #172019 !important;
        caret-color: #172019 !important;
      }

      body[data-scp-surface='provider'] input::placeholder,
      body[data-scp-surface='provider'] textarea::placeholder {
        color: #687365 !important;
        opacity: 1 !important;
      }

      body[data-scp-surface='provider'] button,
      body[data-scp-surface='provider'] a,
      body[data-scp-surface='intake'] button,
      body[data-scp-surface='intake'] a,
      body[data-scp-surface='customer'] button,
      body[data-scp-surface='customer'] a {
        min-height: 46px;
        touch-action: manipulation;
      }

      body[data-scp-surface='intake'] [data-entry-recommended='true'] {
        border-color: #f5c518 !important;
        box-shadow: 0 0 0 4px rgba(245,197,24,.24), 0 16px 36px -22px rgba(245,197,24,.8) !important;
      }

      body[data-scp-surface='intake'] textarea,
      body[data-scp-surface='intake'] input,
      body[data-scp-surface='intake'] select {
        color: #182019;
      }

      @media (max-width: 640px) {
        body[data-scp-surface='provider'] main,
        body[data-scp-surface='intake'] main,
        body[data-scp-surface='customer'] main {
          overflow-x: hidden;
        }

        body[data-scp-surface='provider'] input,
        body[data-scp-surface='provider'] textarea,
        body[data-scp-surface='provider'] select,
        body[data-scp-surface='intake'] input,
        body[data-scp-surface='intake'] textarea,
        body[data-scp-surface='intake'] select {
          font-size: 16px !important;
        }

        body[data-scp-surface='provider'] button,
        body[data-scp-surface='provider'] a,
        body[data-scp-surface='intake'] button,
        body[data-scp-surface='intake'] a,
        body[data-scp-surface='customer'] button,
        body[data-scp-surface='customer'] a {
          min-height: 48px;
        }
      }
    `}</style>
  );
};
