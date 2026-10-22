import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PremiumLanding } from '../components/PremiumLanding';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const HERO_SOCIAL_IMAGE = '/mzansi-services-hero-v2.webp';

export const metadata: Metadata = {
  title: 'Skills Connect Pro | Mzansi Skilled Services',
  description: 'Turn your home ideas into real results. Plan projects, understand materials and costs, and connect with suitable local professionals through Skills Connect Pro.',
  openGraph: {
    title: 'Skills Connect Pro | Mzansi Skilled Services',
    description: 'Turn your home ideas into real results with clearer project planning, materials and cost guidance, and suitable local professionals.',
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
