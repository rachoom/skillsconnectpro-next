import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ClientWrapper from './ClientWrapper';
import { MarketplaceLandingPage } from '../components/MarketplaceLandingPage';
import polishStyles from './HomeVisualPolish.module.css';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: 'Skills Connect Pro | Your Local Home-Services Assistant',
  description: 'Describe, photograph or speak about a home-service job. Skills Connect Pro prepares a clear request, invites suitable local providers and helps you manage the job from start to finish.',
  openGraph: {
    title: 'Skills Connect Pro | Your Local Home-Services Assistant',
    description: 'Show us the job, compare provider responses and manage the work through one guided local marketplace.',
    images: [{ url: '/artisans/hero-welder.jpg', width: 1200, height: 630 }],
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

  return (
    <div className={polishStyles.scope}>
      <MarketplaceLandingPage />
    </div>
  );
}
