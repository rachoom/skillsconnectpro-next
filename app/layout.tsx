import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.skillsconnectpro.co.za'),
  manifest: '/manifest.json',
  title: 'Skills Connect Pro | Free Directory for Kasi Artisans',
  description: 'Looking for skilled plumbers, builders, electricians, or mechanics? Skills Connect Pro is the free online directory connecting you with local kasi talent.',
  openGraph: {
    title: 'Skills Connect Pro | Free Kasi Artisan Directory',
    description: 'Find and book skilled plumbers, electricians, builders, and mechanics in your area. Fast, local, and reliable.',
    url: 'https://www.skillsconnectpro.co.za',
    siteName: 'Skills Connect Pro',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Skills Connect Pro - Kasi Artisan Directory',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skills Connect Pro | Free Kasi Artisan Directory',
    description: 'Find and book local kasi artisans instantly.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}