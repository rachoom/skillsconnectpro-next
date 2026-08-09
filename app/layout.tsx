import type { Metadata } from 'next';
import { AdminMarketingAssist } from '../components/AdminMarketingAssist';
import { CompletedProjectSummary } from '../components/CompletedProjectSummary';
import { CustomerCompletionAction } from '../components/CustomerCompletionAction';
import { CustomerDashboardAutoScroll } from '../components/CustomerDashboardAutoScroll';
import { FeedbackSubmissionAutoClose } from '../components/FeedbackSubmissionAutoClose';
import { IntakeHeroAlignment } from '../components/IntakeHeroAlignment';
import { LaunchThemeRepair } from '../components/LaunchThemeRepair';
import { MarketplaceAdminAuthGate } from '../components/MarketplaceAdminAuthGate';
import { MarketplaceFeedbackLauncher } from '../components/MarketplaceFeedbackLauncher';
import { MarketplaceLifecycleHost } from '../components/MarketplaceLifecycleHost';
import { MarketplaceVisualConsistency } from '../components/MarketplaceVisualConsistency';
import { ThemeDetailOverrides } from '../components/ThemeDetailOverrides';
import { ThemeModeToggle } from '../components/ThemeModeToggle';
import { ThemeSurfacePolish } from '../components/ThemeSurfacePolish';
import { SiteDesignAuditPolish } from '../components/SiteDesignAuditPolish';
import './globals.css';

const themeInitialiser = `
  (function () {
    try {
      var saved = window.localStorage.getItem('scp-theme');
      var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
      document.documentElement.dataset.scpTheme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.scpTheme = 'dark';
      document.documentElement.style.colorScheme = 'dark';
    }
  })();
`;

const surfaceInitialiser = `
  (function () {
    var path = window.location.pathname;
    var surface = path.indexOf('/provider-opportunity/') === 0
      ? 'provider'
      : path === '/get-help'
        ? 'intake'
        : path.indexOf('/project/') === 0
          ? 'customer'
          : path === '/'
            ? 'home'
            : path.indexOf('/browse-providers') === 0
              ? 'directory'
              : path === '/join'
                ? 'join'
                : path === '/estimator'
                  ? 'estimator'
                  : '';
    if (surface) document.body.dataset.scpSurface = surface;
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL('https://www.skillsconnectpro.co.za'),
  manifest: '/manifest.json',
  title: 'Skills Connect Pro | Your Local Home-Services Assistant',
  description: 'Describe, photograph or speak about a home-service job. Skills Connect Pro prepares a clear request, invites suitable local providers and helps you manage the job from start to finish.',
  openGraph: {
    title: 'Skills Connect Pro | Your Local Home-Services Assistant',
    description: 'Show us the job, compare suitable provider responses and manage the work through one guided local marketplace.',
    url: 'https://www.skillsconnectpro.co.za',
    siteName: 'Skills Connect Pro',
    images: [
      {
        url: '/artisans/hero-welder.jpg',
        width: 1200,
        height: 630,
        alt: 'Skills Connect Pro guided local home-services marketplace',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skills Connect Pro | Your Local Home-Services Assistant',
    description: 'Describe the job, compare provider responses and manage the work through one guided service.',
    images: ['/artisans/hero-welder.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitialiser }} />
      </head>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: surfaceInitialiser }} />
        {children}
        <MarketplaceAdminAuthGate />
        <AdminMarketingAssist />
        <MarketplaceVisualConsistency />
        <ThemeDetailOverrides />
        <ThemeSurfacePolish />
        <LaunchThemeRepair />
        <SiteDesignAuditPolish />
        <IntakeHeroAlignment />
        <CompletedProjectSummary />
        <MarketplaceLifecycleHost />
        <CustomerCompletionAction />
        <CustomerDashboardAutoScroll />
        <FeedbackSubmissionAutoClose />
        <MarketplaceFeedbackLauncher />
        <ThemeModeToggle />
      </body>
    </html>
  );
}
