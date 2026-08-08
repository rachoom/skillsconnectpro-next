import React from 'react';
import type { MarketingAssetVariant, MarketingCampaignRow } from './marketingAssist';

type ArtworkInput = {
  campaign: MarketingCampaignRow;
  variant: MarketingAssetVariant;
  origin: string;
  phone: string;
};

type ArtworkResult = {
  width: number;
  height: number;
  element: React.ReactElement;
};

const h = React.createElement;
const GOLD = '#F6C84C';
const GOLD_SOFT = '#B58A2A';
const BLACK = '#0B0906';
const PANEL = '#17130D';
const CREAM = '#FFF8E8';
const MUTED = '#BDB6A8';

function absoluteUrl(origin: string, value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

function fallbackImage(category: string, origin: string): string {
  const key = category.toLowerCase();
  let path = '/artisans/hero-welder.jpg';
  if (key.includes('plumb')) path = '/artisans/Cards/Plumbing.png';
  else if (key.includes('electric')) path = '/artisans/Cards/Electrician.png';
  else if (key.includes('build')) path = '/artisans/Cards/builders.png';
  else if (key.includes('carpent')) path = '/artisans/Cards/Carpenter.png';
  else if (key.includes('mechan')) path = '/artisans/Cards/Mechanic.png';
  else if (key.includes('paint')) path = '/artisans/Cards/Painter.png';
  else if (key.includes('clean')) path = '/artisans/Cards/Cleaners.png';
  else if (key.includes('weld')) path = '/artisans/Cards/Welders.png';
  else if (key.includes('til')) path = '/artisans/Cards/Tilers.png';
  return `${origin}${path}`;
}

function logo(origin: string) {
  return h('img', {
    src: `${origin}/logo-new.svg`,
    width: 74,
    height: 74,
    style: { objectFit: 'contain' },
  });
}

function brandLockup(origin: string, compact = false) {
  return h('div', {
    style: { display: 'flex', alignItems: 'center', gap: compact ? 14 : 18 },
  },
    logo(origin),
    h('div', { style: { display: 'flex', flexDirection: 'column' } },
      h('div', { style: { color: CREAM, fontSize: compact ? 27 : 34, fontWeight: 900, letterSpacing: -1 } }, 'SkillsConnect Pro'),
      h('div', { style: { color: GOLD, fontSize: compact ? 12 : 15, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' } }, 'Local professionals. Connected.'),
    ),
  );
}

function heroImage(src: string, width: number, height: number, radius: number) {
  return h('div', {
    style: {
      width,
      height,
      borderRadius: radius,
      overflow: 'hidden',
      border: `3px solid ${GOLD_SOFT}`,
      display: 'flex',
      background: PANEL,
    },
  }, h('img', { src, width, height, style: { objectFit: 'cover', width: '100%', height: '100%' } }));
}

function badge(text: string) {
  return h('div', {
    style: {
      display: 'flex',
      padding: '10px 16px',
      borderRadius: 999,
      border: `1px solid ${GOLD_SOFT}`,
      background: 'rgba(246,200,76,0.10)',
      color: GOLD,
      fontSize: 14,
      fontWeight: 900,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  }, text);
}

function poster(input: ArtworkInput, imageSrc: string): ArtworkResult {
  const { campaign, origin, phone } = input;
  const copy = campaign.creative_copy;
  const p = campaign.provider_snapshot;
  return {
    width: 1080,
    height: 1350,
    element: h('div', { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: BLACK, color: CREAM, padding: 64, position: 'relative', overflow: 'hidden' } },
      h('div', { style: { position: 'absolute', width: 520, height: 520, borderRadius: 520, background: 'rgba(246,200,76,0.10)', top: -260, right: -180 } }),
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 } }, brandLockup(origin, true), badge(p.verified ? 'Verified Pro' : 'Local Pro')),
      h('div', { style: { display: 'flex', flex: 1, gap: 48, alignItems: 'center', zIndex: 2, paddingTop: 54 } },
        h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, maxWidth: 565 } },
          h('div', { style: { color: GOLD, fontSize: 19, fontWeight: 900, letterSpacing: 4, marginBottom: 24 } }, copy.eyebrow),
          h('div', { style: { color: CREAM, fontSize: 72, lineHeight: 0.95, fontWeight: 950, letterSpacing: -4, marginBottom: 28 } }, copy.headline),
          h('div', { style: { color: GOLD, fontSize: 25, fontWeight: 850, lineHeight: 1.2, marginBottom: 24 } }, copy.serviceLine),
          h('div', { style: { color: MUTED, fontSize: 26, lineHeight: 1.35, marginBottom: 38 } }, copy.subheadline),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, padding: '22px 26px', borderLeft: `5px solid ${GOLD}`, background: PANEL } },
            h('div', { style: { color: CREAM, fontSize: 20, fontWeight: 850 } }, `WhatsApp / Call: ${phone || 'See SkillsConnect Pro profile'}`),
            h('div', { style: { color: MUTED, fontSize: 17 } }, p.location),
          ),
        ),
        heroImage(imageSrc, 350, 500, 44),
      ),
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(246,200,76,0.28)', paddingTop: 26, zIndex: 2 } },
        h('div', { style: { color: MUTED, fontSize: 17, fontWeight: 700 } }, copy.cta),
        h('div', { style: { color: GOLD, fontSize: 17, fontWeight: 900 } }, copy.brandLine),
      ),
    ),
  };
}

function businessCard(input: ArtworkInput, imageSrc: string): ArtworkResult {
  const { campaign, origin, phone } = input;
  const copy = campaign.creative_copy;
  const p = campaign.provider_snapshot;
  return {
    width: 1200,
    height: 675,
    element: h('div', { style: { width: '100%', height: '100%', display: 'flex', background: BLACK, color: CREAM, padding: 54, position: 'relative', overflow: 'hidden' } },
      h('div', { style: { width: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, heroImage(imageSrc, 310, 500, 42)),
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 54, justifyContent: 'space-between' } },
        brandLockup(origin, true),
        h('div', { style: { display: 'flex', flexDirection: 'column' } },
          h('div', { style: { color: GOLD, fontSize: 18, fontWeight: 900, letterSpacing: 3, marginBottom: 14 } }, p.verified ? 'VERIFIED PROFESSIONAL' : 'LOCAL PROFESSIONAL'),
          h('div', { style: { fontSize: 64, fontWeight: 950, lineHeight: 0.96, letterSpacing: -3, marginBottom: 20 } }, p.name),
          h('div', { style: { color: GOLD, fontSize: 25, fontWeight: 850, marginBottom: 18 } }, p.category),
          h('div', { style: { color: MUTED, fontSize: 22, marginBottom: 12 } }, p.location),
          h('div', { style: { color: CREAM, fontSize: 26, fontWeight: 850 } }, `WhatsApp / Call: ${phone || 'View profile for contact'}`),
        ),
        h('div', { style: { color: MUTED, fontSize: 16, borderTop: '1px solid rgba(246,200,76,0.25)', paddingTop: 18 } }, copy.brandLine),
      ),
    ),
  };
}

function whatsappStatus(input: ArtworkInput, imageSrc: string): ArtworkResult {
  const { campaign, origin, phone } = input;
  const copy = campaign.creative_copy;
  const p = campaign.provider_snapshot;
  return {
    width: 1080,
    height: 1920,
    element: h('div', { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: BLACK, color: CREAM, padding: 72, position: 'relative', overflow: 'hidden' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, brandLockup(origin, true), badge('WhatsApp Status')),
      h('div', { style: { display: 'flex', flexDirection: 'column', marginTop: 80 } },
        h('div', { style: { color: GOLD, fontSize: 22, fontWeight: 900, letterSpacing: 4, marginBottom: 28 } }, copy.eyebrow),
        h('div', { style: { fontSize: 82, fontWeight: 950, lineHeight: 0.93, letterSpacing: -5, marginBottom: 32 } }, p.name),
        h('div', { style: { color: GOLD, fontSize: 32, fontWeight: 850, marginBottom: 26 } }, copy.serviceLine),
        h('div', { style: { color: MUTED, fontSize: 30, lineHeight: 1.35, marginBottom: 48 } }, copy.subheadline),
      ),
      h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' } }, heroImage(imageSrc, 760, 760, 64)),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', paddingTop: 42 } },
        h('div', { style: { color: CREAM, fontSize: 34, fontWeight: 900, textAlign: 'center' } }, `WhatsApp / Call: ${phone || 'Find this pro on SkillsConnect Pro'}`),
        h('div', { style: { color: GOLD, fontSize: 22, fontWeight: 850, textAlign: 'center' } }, copy.cta),
        h('div', { style: { color: MUTED, fontSize: 18, marginTop: 16 } }, copy.brandLine),
      ),
    ),
  };
}

export function buildMarketingArtwork(input: ArtworkInput): ArtworkResult {
  const imageSrc = absoluteUrl(input.origin, input.campaign.provider_snapshot.imageUrl)
    || fallbackImage(input.campaign.provider_snapshot.category, input.origin);
  if (input.variant === 'business_card') return businessCard(input, imageSrc);
  if (input.variant === 'whatsapp_status') return whatsappStatus(input, imageSrc);
  return poster(input, imageSrc);
}
