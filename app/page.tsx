import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ClientWrapper from './ClientWrapper';
import { MarketplaceLandingPage } from '../components/MarketplaceLandingPage';
import { LandingScrollReveal } from './LandingScrollReveal';
import polishStyles from './HomeVisualPolish.module.css';
import headerStyles from './HeaderGlassPolish.module.css';
import lightContrastStyles from './LightThemeContrastPolish.module.css';
import motionStyles from './LandingMotionPolish.module.css';
import scrollStyles from './LandingScrollReveal.module.css';
import heroUpgradeStyles from './HeroUpgrade.module.css';
import heroCompatibilityStyles from './HeroCompatibilityFix.module.css';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: 'Skills Connect Pro | Home Improvement & Local Services',
  description: 'Tell us what needs fixing, improving or building. Skills Connect Pro prepares a clear project, connects you with suitable local professionals and helps you compare responses with confidence.',
  openGraph: {
    title: 'Skills Connect Pro | Home Improvement & Local Services',
    description: 'From repairs and maintenance to renovations and improvements, start one guided home project and compare suitable local providers with confidence.',
    images: [{ url: 'https://images.pexels.com/photos/14074835/pexels-photo-14074835.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1920&h=1080', width: 1200, height: 630 }],
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
    <div className={`${polishStyles.scope} ${headerStyles.scope} ${lightContrastStyles.scope} ${motionStyles.motion} ${scrollStyles.scope} ${heroUpgradeStyles.scope} ${heroCompatibilityStyles.scope}`}>
      <LandingScrollReveal />
      <MarketplaceLandingPage />
    </div>
  );
}
