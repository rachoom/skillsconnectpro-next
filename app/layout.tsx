import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillsConnectPro | East Rand Specialist Network',
  description: 'Connect with verified, top-tier artisans in your area instantly. 100% Free to search.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Add the warning suppression here!
    <html lang="en" suppressHydrationWarning>
  <body suppressHydrationWarning>{children}</body>
</html>
    
  );
}