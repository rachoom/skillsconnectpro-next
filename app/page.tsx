import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
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
  const inviteId = typeof params.invite === 'string' ? params.invite : null;

  // Old public profile links now enter the controlled provider-discovery layer
  // instead of exposing direct provider contact details.
  if (profileId) redirect(`/browse-providers?provider=${encodeURIComponent(profileId)}`);

  // Numeric legacy claim IDs do not prove profile ownership. Route all old
  // claim links through the reviewed provider application flow.
  if (claimId || inviteId) redirect('/join');

  return <PremiumLanding />;
}
