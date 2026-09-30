import type { Metadata } from 'next';
import { CompletedProjectSummary } from '../components/CompletedProjectSummary';
import { CustomerCompletionAction } from '../components/CustomerCompletionAction';
import { CustomerDashboardAutoScroll } from '../components/CustomerDashboardAutoScroll';
import { FeedbackSubmissionAutoClose } from '../components/FeedbackSubmissionAutoClose';
import { IntakeHeroAlignment } from '../components/IntakeHeroAlignment';
import { LaunchThemeRepair } from '../components/LaunchThemeRepair';
import { MarketplaceFeedbackLauncher } from '../components/MarketplaceFeedbackLauncher';
import { MarketplaceLifecycleHost } from '../components/MarketplaceLifecycleHost';
import { MarketplaceVisualConsistency } from '../components/MarketplaceVisualConsistency';
import { PrimaryServiceTaxonomy } from '../components/PrimaryServiceTaxonomy';
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
                  : path === '/assistant'
                    ? 'assistant'
                  : '';
    if (surface) document.body.dataset.scpSurface = surface;
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL('https://www.skillsconnectpro.co.za'),
  manifest: '/manifest.json',
  title: 'Skills Connect Pro | Mzansi Skilled Services',
  description: 'Describe, photograph or speak about the service you need. Skills Connect Pro helps customers across Ekurhuleni reach suitable local providers through one guided marketplace.',
  openGraph: {
    title: 'Skills Connect Pro | Mzansi Skilled Services',
    description: 'From mechanics and artisans to everyday services, show us the job and connect with suitable local providers across Ekurhuleni.',
    url: 'https://www.skillsconnectpro.co.za',
    siteName: 'Skills Connect Pro',
    images: [
      {
        url: '/artisans/hero-welder.jpg',
        width: 1200,
        height: 630,
        alt: 'Skills Connect Pro Mzansi skilled-services marketplace',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skills Connect Pro | Mzansi Skilled Services',
    description: 'Describe the job, compare suitable responses and connect with local service providers across Ekurhuleni.',
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
        <PrimaryServiceTaxonomy />
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
