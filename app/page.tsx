import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ClientWrapper from './ClientWrapper';
import { PremiumLanding } from '../components/PremiumLanding';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const HERO_SOCIAL_IMAGE = '/artisans/hero-welder.jpg';

export const metadata: Metadata = {
  title: 'Skills Connect Pro | Mzansi Skilled Services',
  description: 'Describe, photograph or speak about the service you need. Connect with mechanics, artisans and suitable local providers through one guided Ekurhuleni marketplace, built to grow across Mzansi.',
  openGraph: {
    title: 'Skills Connect Pro | Mzansi Skilled Services',
    description: 'From mechanics and artisans to everyday services, find and connect with suitable local providers across Ekurhuleni through one guided marketplace.',
    images: [{ url: HERO_SOCIAL_IMAGE, width: 1200, height: 630 }],
    type: 'website',
  },
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const profileId = typeof params.profile === 'string' ? params.profile : null;
  const claimId = typeof params.claim === 'string' ? params.claim : null;

  // Old public profile links now enter the controlled provider-discovery layer
  // instead of exposing direct provider contact details.
  if (profileId) redirect(`/browse-providers?provider=${encodeURIComponent(profileId)}`);

  // The new public provider CTA uses the focused, mobile-first join experience.
  if (claimId === 'join') redirect('/join');

  // Preserve existing individual claim links while the dedicated provider
  // account portal is prepared for launch.
  if (claimId) return <ClientWrapper />;

  return <PremiumLanding />;
}
