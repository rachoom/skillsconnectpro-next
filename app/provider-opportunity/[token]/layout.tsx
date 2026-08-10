import type { ReactNode } from 'react';
import { IBM_Plex_Sans } from 'next/font/google';
import ThemeShell from './theme-shell';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function ProviderOpportunityLayout({ children }: { children: ReactNode }) {
  return <ThemeShell fontClassName={ibmPlexSans.className}>{children}</ThemeShell>;
}
