import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillsConnectPro | East Rand Specialist Network',
  description: 'Connect with verified, top-tier artisans in your area instantly. 100% Free to search.',
  openGraph: {
    title: 'SkillsConnectPro | Verified Artisans in the East Rand',
    description: 'Find and book verified plumbers, electricians, welders and more in the Far East Rand. Fast, reliable, trusted.',
    url: 'https://www.skillsconnectpro.co.za',
    siteName: 'SkillsConnectPro',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SkillsConnectPro - East Rand Artisan Network',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillsConnectPro | Verified Artisans in the East Rand',
    description: 'Find and book verified artisans instantly.',
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