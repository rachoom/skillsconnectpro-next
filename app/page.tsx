import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PremiumLanding } from '../components/PremiumLanding';
import { ClaimProfile } from '../components/ClaimProfile';

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

function isLegacyNumericClaim(value: string | null): boolean {
  return Boolean(value && /^\d+$/.test(value));
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const profileId = typeof params.profile === 'string' ? params.profile : null;
  const claimId = typeof params.claim === 'string' ? params.claim : null;
  const inviteId = typeof params.invite === 'string' ? params.invite : null;

  // Old public profile links now enter the controlled provider-discovery layer
  // instead of exposing direct provider contact details.
  if (profileId) redirect(`/browse-providers?provider=${encodeURIComponent(profileId)}`);

  // Legacy numeric claim/invite IDs did not prove profile ownership, so those
  // still go through the reviewed provider application flow.
  if (isLegacyNumericClaim(claimId) || isLegacyNumericClaim(inviteId)) {
    redirect('/join');
  }

  // Secure claim tokens are random, hashed server-side and must open the
  // provider consent page rather than being mistaken for 1-Click Join.
  if (claimId || inviteId) {
    return <ClaimProfile />;
  }

  return <PremiumLanding />;
}
