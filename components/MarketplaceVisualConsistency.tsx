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
          : pathname === '/'
            ? 'home'
            : pathname.startsWith('/browse-providers')
              ? 'directory'
              : pathname === '/join'
                ? 'join'
                : pathname === '/estimator'
                  ? 'estimator'
                  : '';

    if (surface) document.body.dataset.scpSurface = surface;
    else delete document.body.dataset.scpSurface;

    return () => {
      delete document.body.dataset.scpSurface;
    };
  }, [pathname]);

  return pathname === '/get-help' ? null : (
    <style>{`
      html[data-scp-theme='dark'] {
        color-scheme: dark;
        background: #120b07;
      }

      html[data-scp-theme='light'] {
        color-scheme: light;
        background: #efe8da;
      }

      body {
        transition: background-color 180ms ease, color 180ms ease;
      }

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

      html[data-scp-theme='light'] body[data-scp-surface='home'] {
        background: #efe8da;
        color: #172019;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] main {
        background:
          radial-gradient(circle at 0 22%, rgba(74, 118, 83, .12), transparent 32rem),
          radial-gradient(circle at 100% 52%, rgba(245, 197, 24, .12), transparent 28rem),
          #efe8da !important;
        color: #172019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='hero'] {
        color: #f5f0e3;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='tradeSection'],
      html[data-scp-theme='light'] body[data-scp-surface='home'] #how-it-works,
      html[data-scp-theme='light'] body[data-scp-surface='home'] #support {
        color: #172019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='tradeSection'] {
        background: linear-gradient(180deg, rgba(224, 236, 224, .72), rgba(245, 240, 227, .88)) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='sectionHeading'] p,
      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='stepCard'] p,
      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='choiceSection'] p,
      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='providerSection'] p,
      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='faqCard'] p {
        color: #5d685f !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='stepCard'],
      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='faqCard'] {
        border-color: rgba(52, 82, 61, .14) !important;
        background: rgba(255, 253, 247, .82) !important;
        color: #172019 !important;
        box-shadow: 0 24px 54px -38px rgba(45, 69, 50, .38) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='trustStrip'] {
        border-color: rgba(245, 197, 24, .3) !important;
        background: linear-gradient(135deg, #1d5b40, #123f2d) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='trustStrip'] span {
        color: #fffdf7 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='trustStrip'] svg {
        color: #ffd84d !important;
        stroke: #ffd84d !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='choiceSection'],
      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='providerSection'] {
        border-color: rgba(52, 82, 61, .17) !important;
        background: rgba(255, 253, 247, .84) !important;
        color: #172019 !important;
        box-shadow: 0 28px 64px -42px rgba(45, 69, 50, .38) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='home'] [class*='secondaryButton'] {
        border-color: rgba(45, 84, 58, .28) !important;
        background: #ffffff !important;
        color: #173827 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='directory'] main {
        background:
          radial-gradient(circle at 10% 0%, rgba(72, 116, 82, .14), transparent 30rem),
          #efe8da !important;
        color: #172019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='directory'] header {
        border-color: rgba(52, 82, 61, .12) !important;
        background: rgba(255, 253, 247, .9) !important;
        color: #172019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='privacyCard'],
      html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='searchPanel'],
      html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='card'],
      html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='empty'],
      html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='modal'] {
        border-color: rgba(52, 82, 61, .15) !important;
        background: rgba(255, 253, 247, .9) !important;
        color: #172019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='directory'] p,
      html[data-scp-theme='light'] body[data-scp-surface='directory'] small,
      html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='location'] {
        color: #5e695f !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='directory'] input,
      html[data-scp-theme='light'] body[data-scp-surface='directory'] select {
        border-color: #9faf9f !important;
        background: #ffffff !important;
        color: #172019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='join'] main {
        background:
          radial-gradient(circle at 10% 0%, rgba(72, 116, 82, .15), transparent 30rem),
          radial-gradient(circle at 90% 30%, rgba(245, 197, 24, .14), transparent 24rem),
          #efe8da !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='join'] header {
        border-color: rgba(52, 82, 61, .14) !important;
        background: rgba(255, 253, 247, .86) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='join'] main > div > section > div:first-child,
      html[data-scp-theme='light'] body[data-scp-surface='join'] header a {
        color: #172019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='join'] main > div > section > div:first-child p {
        color: #5f695f !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='join'] main > div > section > div:first-child > div:not(:first-child) > div {
        border-color: rgba(52, 82, 61, .14) !important;
        background: rgba(255, 253, 247, .72) !important;
        color: #314639 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='provider'] main,
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main,
      html[data-scp-theme='light'] body[data-scp-surface='estimator'] main {
        background:
          radial-gradient(circle at 10% 0%, rgba(72, 116, 82, .13), transparent 28rem),
          #edf1e9 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
        border-color: rgba(52, 82, 61, .14) !important;
        background: rgba(255, 253, 247, .9) !important;
        color: #172019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] button,
      html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a:not([href*='wa.me']) {
        border-color: rgba(52, 82, 61, .18) !important;
        background: rgba(255, 255, 255, .7) !important;
        color: #172019 !important;
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

      @media (prefers-reduced-motion: reduce) {
        body[data-scp-surface='home'] video {
          animation: none !important;
        }
      }
    `}</style>
  );
};
