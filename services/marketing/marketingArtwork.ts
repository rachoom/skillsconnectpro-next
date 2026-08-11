import React from 'react';
import type { MarketingAssetVariant, MarketingCampaignRow } from './marketingAssist';

export type MarketingArtworkProvider = {
  profile_image?: string | null;
  image_url?: string | null;
  portfolio?: string[] | null;
  portfolio_images?: string[] | null;
  portfolio_urls?: string[] | null;
  proof_of_work?: string[] | null;
  services?: string[] | null;
  years_experience?: number | null;
  experience?: number | string | null;
  description?: string | null;
  bio?: string | null;
  verified?: boolean | null;
  isVerified?: boolean | null;
};

type ArtworkInput = {
  campaign: MarketingCampaignRow;
  variant: MarketingAssetVariant;
  origin: string;
  phone: string;
  provider?: MarketingArtworkProvider | null;
};

type ArtworkResult = {
  width: number;
  height: number;
  element: React.ReactElement;
};

const h = React.createElement;
const GOLD = '#F7C843';
const GOLD_LIGHT = '#FFE08A';
const GOLD_DEEP = '#9D7115';
const BLACK = '#060604';
const BLACK_SOFT = '#0D0B08';
const PANEL = '#15120D';
const CREAM = '#FFF9EB';
const WHITE = '#FFFFFF';
const MUTED = '#C8C0B2';
const MUTED_DARK = '#817A6F';

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function absoluteUrl(origin: string, value: string | null | undefined): string | null {
  const trimmed = clean(value);
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
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

function firstImage(origin: string, values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const url = absoluteUrl(origin, value);
    if (url) return url;
  }
  return null;
}

function artworkImages(input: ArtworkInput): { portrait: string; work: string } {
  const provider = input.provider;
  const p = input.campaign.provider_snapshot;
  const arrays = [
    provider?.portfolio_images,
    provider?.portfolio_urls,
    provider?.portfolio,
    provider?.proof_of_work,
  ].flatMap((items) => Array.isArray(items) ? items : []);

  const portrait = firstImage(input.origin, [provider?.profile_image, p.imageUrl, provider?.image_url])
    || fallbackImage(p.category, input.origin);
  let work = firstImage(input.origin, [...arrays, provider?.image_url, p.imageUrl])
    || fallbackImage(p.category, input.origin);

  if (work === portrait) work = fallbackImage(p.category, input.origin);
  return { portrait, work };
}

function logo(origin: string, size = 50) {
  return h('img', {
    src: `${origin}/logo-new.svg`,
    width: size,
    height: size,
    style: { objectFit: 'contain' },
  });
}

function brandLockup(origin: string, compact = false) {
  return h('div', {
    style: { display: 'flex', alignItems: 'center', gap: compact ? 9 : 12 },
  },
    logo(origin, compact ? 38 : 48),
    h('div', { style: { display: 'flex', flexDirection: 'column' } },
      h('div', {
        style: {
          color: CREAM,
          fontSize: compact ? 20 : 25,
          fontWeight: 900,
          letterSpacing: -0.7,
        },
      }, 'SkillsConnect Pro'),
      h('div', {
        style: {
          color: GOLD,
          fontSize: compact ? 8 : 9,
          fontWeight: 900,
          letterSpacing: 2.2,
          textTransform: 'uppercase',
        },
      }, 'Local professionals. Connected.'),
    ),
  );
}

function badge(text: string, filled = false) {
  return h('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '9px 14px',
      borderRadius: 999,
      border: `1px solid ${GOLD}`,
      background: filled ? GOLD : 'rgba(6,6,4,0.66)',
      color: filled ? BLACK : GOLD,
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
    },
  }, text);
}

function formatPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (/^27\d{9}$/.test(digits)) return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return phone || 'View profile for contact';
}

function providerNameSize(name: string, large: number, medium: number, small: number): number {
  if (name.length > 27) return small;
  if (name.length > 19) return medium;
  return large;
}

function serviceNoun(category: string): string {
  const cleanCategory = (category || 'Local professional').trim();
  const key = cleanCategory.toLowerCase();
  if (key.includes('paint')) return 'Painting';
  if (key.includes('plumb')) return 'Plumbing';
  if (key.includes('electric')) return 'Electrical';
  if (key.includes('build')) return 'Building';
  if (key.includes('carpent')) return 'Carpentry';
  if (key.includes('clean')) return 'Cleaning';
  if (key.includes('mechan')) return 'Mechanical';
  if (key.includes('weld')) return 'Welding';
  if (key.includes('til')) return 'Tiling';
  if (key.includes('landscap') || key.includes('garden')) return 'Landscaping';
  if (key.includes('cater') || key.includes('chef')) return 'Catering';
  if (key.includes('hair')) return 'Hair';
  if (key.includes('beaut')) return 'Beauty';
  return cleanCategory.replace(/s$/i, '');
}

function professionalHeadline(category: string): string {
  return `Professional ${serviceNoun(category)} Services`;
}

function experienceYears(provider: MarketingArtworkProvider | null | undefined): number | null {
  if (!provider) return null;
  const values: number[] = [];
  const direct = Number(provider.years_experience ?? 0);
  const legacy = Number(provider.experience ?? 0);
  if (Number.isFinite(direct) && direct > 0) values.push(direct);
  if (Number.isFinite(legacy) && legacy > 0) values.push(legacy);

  for (const text of [provider.description, provider.bio]) {
    const match = clean(text).match(/(\d{1,2})\s*\+?\s*years?/i);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) values.push(parsed);
    }
  }

  return values.length ? Math.max(...values) : null;
}

function defaultServices(category: string): string[] {
  const key = category.toLowerCase();
  if (key.includes('paint')) return ['Interior Painting', 'Exterior Painting', 'Wall Preparation', 'Repainting', 'Finishing'];
  if (key.includes('plumb')) return ['Leak Repairs', 'Geysers', 'Drain Cleaning', 'Installations', 'Maintenance'];
  if (key.includes('electric')) return ['Fault Finding', 'Wiring', 'DB Boards', 'Installations', 'Repairs'];
  if (key.includes('build')) return ['Renovations', 'Extensions', 'Brickwork', 'Plastering', 'General Building'];
  if (key.includes('carpent')) return ['Built-in Units', 'Doors', 'Cabinetry', 'Repairs', 'Custom Woodwork'];
  if (key.includes('clean')) return ['Home Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Move-in / Out', 'General Cleaning'];
  if (key.includes('mechan')) return ['Engine Repairs', 'Clutch Repairs', 'Suspension', 'Servicing', 'General Repairs'];
  if (key.includes('weld')) return ['Gates', 'Security Steel', 'Repairs', 'Fabrication', 'Custom Welding'];
  if (key.includes('til')) return ['Floor Tiling', 'Wall Tiling', 'Bathrooms', 'Kitchens', 'Tile Repairs'];
  if (key.includes('landscap') || key.includes('garden')) return ['Garden Care', 'Landscaping', 'Lawn Care', 'Clean-ups', 'Maintenance'];
  if (key.includes('cater') || key.includes('chef')) return ['Prepared Meals', 'Events', 'Platters', 'Fresh Dishes', 'Private Catering'];
  if (key.includes('hair') || key.includes('beaut')) return ['Styling', 'Treatments', 'Appointments', 'Special Occasions', 'Personal Care'];
  return ['Professional Service', 'Repairs', 'Installations', 'Maintenance', 'Local Support'];
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function serviceItems(provider: MarketingArtworkProvider | null | undefined, category: string): string[] {
  const categoryKey = category.toLowerCase().replace(/s$/i, '');
  const raw = (provider?.services ?? [])
    .map((item) => titleCase(clean(item)))
    .filter(Boolean)
    .filter((item, index, all) => all.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index)
    .filter((item) => item.toLowerCase().replace(/s$/i, '') !== categoryKey);

  if (raw.length >= 3) return [...raw, ...defaultServices(category)].slice(0, 5);
  return defaultServices(category);
}

function shortLocation(location: string, max = 3): string {
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= max) return parts.join(', ');
  return `${parts.slice(0, max).join(', ')} + ${parts.length - max} more`;
}

function icon(type: 'phone' | 'pin' | 'shield' | 'star', size = 28, color = BLACK) {
  const paths: Record<string, string> = {
    phone: 'M7.2 3.5 9.6 7.7 7.9 9.1c.9 2 2.7 3.8 4.7 4.7l1.4-1.8 4.3 2.5c.4.2.6.7.5 1.1-.8 2.8-2.7 4.3-5 4.3C7.9 19.9 4.1 16.1 4.1 11.4c0-2.3 1.5-4.2 3.1-5.1-.4-.7-.4-1.9 0-2.8Z',
    pin: 'M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Zm0-8.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z',
    shield: 'M12 2 20 5v6c0 5.1-3.3 9.3-8 11-4.7-1.7-8-5.9-8-11V5l8-3Zm-1.2 13.6 5.5-5.5-1.4-1.4-4.1 4.1-2-2-1.4 1.4 3.4 3.4Z',
    star: 'm12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9L12 2.8Z',
  };
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: color,
    style: { display: 'flex' },
  }, h('path', { d: paths[type] }));
}

function iconBox(type: 'phone' | 'pin' | 'shield' | 'star', small = false) {
  const size = small ? 44 : 54;
  return h('div', {
    style: {
      display: 'flex',
      width: size,
      height: size,
      borderRadius: small ? 12 : 15,
      background: GOLD,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  }, icon(type, small ? 22 : 28));
}

function contactBar(phone: string, compact = false) {
  return h('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: compact ? 13 : 18,
      borderRadius: 999,
      border: `2px solid ${GOLD}`,
      background: 'rgba(5,5,3,0.88)',
      padding: compact ? '11px 18px 11px 11px' : '14px 28px 14px 14px',
    },
  },
    iconBox('phone', compact),
    h('div', { style: { display: 'flex', alignItems: 'baseline', gap: compact ? 12 : 17 } },
      h('div', {
        style: {
          color: GOLD_LIGHT,
          fontSize: compact ? 17 : 23,
          fontWeight: 950,
          letterSpacing: 2.5,
          textTransform: 'uppercase',
        },
      }, 'Call / WhatsApp'),
      h('div', {
        style: {
          color: WHITE,
          fontSize: compact ? 25 : 34,
          fontWeight: 850,
          letterSpacing: 1.2,
        },
      }, formatPhone(phone)),
    ),
  );
}

function trustItem(type: 'shield' | 'star' | 'pin', label: string, value: string, compact = false) {
  return h('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: compact ? 10 : 13,
      minWidth: 0,
    },
  },
    iconBox(type, true),
    h('div', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
      h('div', { style: { color: MUTED, fontSize: compact ? 8 : 10, fontWeight: 900, letterSpacing: 1.6, textTransform: 'uppercase' } }, label),
      h('div', { style: { color: CREAM, fontSize: compact ? 15 : 18, fontWeight: 900 } }, value),
    ),
  );
}

function serviceStrip(items: string[], compact = false) {
  return h('div', {
    style: {
      display: 'flex',
      width: '100%',
      borderTop: `1px solid rgba(247,200,67,0.35)`,
      borderBottom: `1px solid rgba(247,200,67,0.35)`,
      background: 'rgba(6,6,4,0.78)',
    },
  }, ...items.map((item, index) => h('div', {
    key: `${item}-${index}`,
    style: {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: compact ? 5 : 8,
      minHeight: compact ? 82 : 112,
      padding: compact ? '10px 7px' : '14px 9px',
      borderRight: index === items.length - 1 ? 'none' : `1px solid rgba(247,200,67,0.35)`,
      textAlign: 'center',
    },
  },
    h('div', {
      style: {
        display: 'flex',
        width: compact ? 28 : 36,
        height: compact ? 28 : 36,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${GOLD}`,
        color: GOLD,
        fontSize: compact ? 10 : 12,
        fontWeight: 950,
      },
    }, String(index + 1).padStart(2, '0')),
    h('div', {
      style: {
        color: CREAM,
        fontSize: compact ? 10 : 13,
        fontWeight: 900,
        lineHeight: 1.15,
        textTransform: 'uppercase',
      },
    }, item),
  )));
}

function poster(input: ArtworkInput, portrait: string, work: string): ArtworkResult {
  const { campaign, origin, phone, provider } = input;
  const p = campaign.provider_snapshot;
  const years = experienceYears(provider);
  const services = serviceItems(provider, p.category);
  const nameSize = providerNameSize(p.name, 72, 62, 53);

  return {
    width: 1080,
    height: 1350,
    element: h('div', {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: BLACK,
        color: CREAM,
        position: 'relative',
        overflow: 'hidden',
      },
    },
      h('img', { src: work, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38 } }),
      h('div', { style: { position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(90deg, rgba(4,4,3,0.98) 0%, rgba(4,4,3,0.88) 45%, rgba(4,4,3,0.42) 72%, rgba(4,4,3,0.82) 100%)' } }),
      h('div', { style: { position: 'absolute', top: -180, right: -130, width: 510, height: 510, borderRadius: 999, border: `2px solid rgba(247,200,67,0.48)` } }),
      h('div', { style: { position: 'absolute', top: -120, right: -75, width: 390, height: 390, borderRadius: 999, background: 'rgba(247,200,67,0.07)' } }),

      h('div', { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '52px 56px 42px', zIndex: 2 } },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
          brandLockup(origin, true),
          badge(p.verified || provider?.verified || provider?.isVerified ? 'Verified Professional' : 'Local Professional'),
        ),

        h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', gap: 38, paddingTop: 34 } },
          h('div', { style: { display: 'flex', width: 405, height: 690, position: 'relative', alignItems: 'flex-end' } },
            h('div', { style: { position: 'absolute', left: -56, top: 18, width: 470, height: 690, borderRadius: '0 270px 270px 0', border: `3px solid ${GOLD}`, overflow: 'hidden', background: BLACK_SOFT, display: 'flex' } },
              h('img', { src: portrait, style: { width: '100%', height: '100%', objectFit: 'cover' } }),
              h('div', { style: { position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(0deg, rgba(3,3,2,0.68) 0%, rgba(3,3,2,0.05) 48%, rgba(3,3,2,0.18) 100%)' } }),
            ),
            years ? h('div', { style: { position: 'absolute', left: 22, bottom: 28, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(6,6,4,0.86)', border: `1px solid ${GOLD}`, borderRadius: 16, padding: '12px 16px' } },
              icon('star', 20, GOLD),
              h('div', { style: { display: 'flex', color: CREAM, fontSize: 16, fontWeight: 900 } }, `${years}+ Years Experience`),
            ) : null,
          ),

          h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', paddingTop: 4 } },
            h('div', { style: { color: GOLD, fontSize: 15, fontWeight: 950, letterSpacing: 3.7, textTransform: 'uppercase', marginBottom: 14 } }, professionalHeadline(p.category)),
            h('div', { style: { color: GOLD_LIGHT, fontSize: nameSize, lineHeight: 0.93, fontWeight: 950, letterSpacing: -3.4, textTransform: 'uppercase', marginBottom: 22 } }, p.name),
            h('div', { style: { width: 210, height: 3, display: 'flex', background: `linear-gradient(90deg, ${GOLD}, rgba(247,200,67,0.10))`, marginBottom: 22 } }),
            h('div', { style: { color: WHITE, fontSize: 25, lineHeight: 1.25, fontWeight: 800, marginBottom: 19 } }, campaign.creative_copy.subheadline),
            h('div', { style: { color: MUTED, fontSize: 17, lineHeight: 1.32, marginBottom: 27 } }, `Serving ${shortLocation(p.location, 4)}`),
            contactBar(phone, true),
          ),
        ),

        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 18 } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 18 } },
            h('div', { style: { display: 'flex', flex: 1, height: 1, background: 'rgba(247,200,67,0.35)' } }),
            h('div', { style: { color: GOLD, fontSize: 13, fontWeight: 950, letterSpacing: 3, textTransform: 'uppercase' } }, 'Services'),
            h('div', { style: { display: 'flex', flex: 1, height: 1, background: 'rgba(247,200,67,0.35)' } }),
          ),
          serviceStrip(services),
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 3 } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, color: MUTED, fontSize: 13, fontWeight: 750 } }, icon('pin', 18, GOLD), shortLocation(p.location, 3)),
            h('div', { style: { color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 2.1, textTransform: 'uppercase' } }, 'Supported by SkillsConnect Pro'),
          ),
        ),
      ),
    ),
  };
}

function businessCard(input: ArtworkInput, portrait: string, work: string): ArtworkResult {
  const { campaign, origin, phone, provider } = input;
  const p = campaign.provider_snapshot;
  const years = experienceYears(provider);
  const services = serviceItems(provider, p.category).slice(0, 3);
  const nameSize = providerNameSize(p.name, 56, 48, 41);

  return {
    width: 1200,
    height: 675,
    element: h('div', {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        background: BLACK,
        color: CREAM,
        position: 'relative',
        overflow: 'hidden',
      },
    },
      h('div', { style: { display: 'flex', width: '54%', height: '100%', flexDirection: 'column', padding: '42px 48px 36px', zIndex: 3, background: 'linear-gradient(105deg, rgba(6,6,4,1) 0%, rgba(8,7,5,0.99) 83%, rgba(8,7,5,0.2) 100%)' } },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
          badge(p.verified || provider?.verified || provider?.isVerified ? 'Verified Pro' : 'Local Pro', true),
          years ? h('div', { style: { color: MUTED, fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' } }, `${years}+ years experience`) : null,
        ),
        h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' } },
          h('div', { style: { color: GOLD, fontSize: 13, fontWeight: 950, letterSpacing: 2.9, textTransform: 'uppercase', marginBottom: 10 } }, professionalHeadline(p.category)),
          h('div', { style: { color: WHITE, fontSize: nameSize, fontWeight: 950, lineHeight: 0.95, letterSpacing: -2.6, textTransform: 'uppercase', marginBottom: 17 } }, p.name),
          h('div', { style: { display: 'flex', width: 190, height: 3, background: GOLD, marginBottom: 20 } }),
          h('div', { style: { color: MUTED, fontSize: 17, fontWeight: 750, lineHeight: 1.3, marginBottom: 21 } }, campaign.creative_copy.subheadline),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 } },
            ...services.map((item) => h('div', { key: item, style: { display: 'flex', alignItems: 'center', gap: 10, color: CREAM, fontSize: 15, fontWeight: 850 } },
              h('div', { style: { display: 'flex', width: 8, height: 8, borderRadius: 99, background: GOLD } }), item,
            )),
          ),
          contactBar(phone, true),
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 9, color: MUTED, fontSize: 12, fontWeight: 750 } },
          icon('pin', 17, GOLD), shortLocation(p.location, 3),
        ),
      ),

      h('div', { style: { position: 'absolute', right: 0, top: 0, width: '52%', height: '100%', display: 'flex', background: BLACK_SOFT } },
        h('img', { src: work, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.58 } }),
        h('div', { style: { position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(90deg, rgba(6,6,4,0.92) 0%, rgba(6,6,4,0.26) 36%, rgba(6,6,4,0.42) 100%)' } }),
        h('div', { style: { position: 'absolute', right: 38, bottom: 34, width: 280, height: 370, borderRadius: '150px 150px 30px 30px', overflow: 'hidden', border: `2px solid ${GOLD}`, display: 'flex', background: BLACK } },
          h('img', { src: portrait, style: { width: '100%', height: '100%', objectFit: 'cover' } }),
          h('div', { style: { position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(0deg, rgba(4,4,3,0.55), transparent 52%)' } }),
        ),
        h('div', { style: { position: 'absolute', right: 31, top: 29, display: 'flex' } }, brandLockup(origin, true)),
      ),

      h('div', { style: { position: 'absolute', left: '52.2%', top: -70, width: 4, height: 830, background: GOLD, transform: 'rotate(10deg)', zIndex: 4 } }),
    ),
  };
}

function whatsappStatus(input: ArtworkInput, portrait: string, work: string): ArtworkResult {
  const { campaign, origin, phone, provider } = input;
  const p = campaign.provider_snapshot;
  const years = experienceYears(provider);
  const services = serviceItems(provider, p.category);
  const nameSize = providerNameSize(p.name, 86, 74, 62);

  return {
    width: 1080,
    height: 1920,
    element: h('div', {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: BLACK,
        color: CREAM,
        position: 'relative',
        overflow: 'hidden',
      },
    },
      h('img', { src: work, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.42 } }),
      h('div', { style: { position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(180deg, rgba(4,4,3,0.50) 0%, rgba(4,4,3,0.86) 47%, rgba(4,4,3,0.99) 72%, rgba(4,4,3,1) 100%)' } }),

      h('div', { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '58px 58px 46px', zIndex: 2 } },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
          brandLockup(origin, true),
          badge('WhatsApp Status'),
        ),

        h('div', { style: { display: 'flex', height: 780, position: 'relative', marginTop: 42 } },
          h('div', { style: { position: 'absolute', right: -58, top: 0, width: 650, height: 760, borderRadius: '330px 0 0 330px', overflow: 'hidden', borderLeft: `3px solid ${GOLD}`, display: 'flex', background: BLACK_SOFT } },
            h('img', { src: portrait, style: { width: '100%', height: '100%', objectFit: 'cover' } }),
            h('div', { style: { position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(90deg, rgba(4,4,3,0.62) 0%, rgba(4,4,3,0.03) 45%, rgba(4,4,3,0.15) 100%)' } }),
          ),
          h('div', { style: { position: 'absolute', left: 0, top: 130, width: 540, display: 'flex', flexDirection: 'column', zIndex: 3 } },
            h('div', { style: { color: GOLD, fontSize: 17, fontWeight: 950, letterSpacing: 3.6, textTransform: 'uppercase', marginBottom: 18 } }, professionalHeadline(p.category)),
            h('div', { style: { color: WHITE, fontSize: nameSize, lineHeight: 0.9, fontWeight: 950, letterSpacing: -4.2, textTransform: 'uppercase', marginBottom: 24 } }, p.name),
            h('div', { style: { display: 'flex', width: 190, height: 4, background: GOLD, marginBottom: 24 } }),
            h('div', { style: { color: CREAM, fontSize: 27, fontWeight: 800, lineHeight: 1.28, maxWidth: 485 } }, campaign.creative_copy.subheadline),
          ),
          years ? h('div', { style: { position: 'absolute', right: 22, bottom: 38, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 17px', background: 'rgba(6,6,4,0.88)', border: `1px solid ${GOLD}`, borderRadius: 15 } },
            icon('star', 21, GOLD),
            h('div', { style: { display: 'flex', color: CREAM, fontSize: 17, fontWeight: 900 } }, `${years}+ Years Experience`),
          ) : null,
        ),

        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 23, marginTop: -12 } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 18 } },
            h('div', { style: { display: 'flex', flex: 1, height: 1, background: 'rgba(247,200,67,0.35)' } }),
            h('div', { style: { color: GOLD, fontSize: 16, fontWeight: 950, letterSpacing: 3.2, textTransform: 'uppercase' } }, 'Services'),
            h('div', { style: { display: 'flex', flex: 1, height: 1, background: 'rgba(247,200,67,0.35)' } }),
          ),
          serviceStrip(services),
          h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 18, padding: '6px 10px 0' } },
            trustItem('shield', 'Status', p.verified || provider?.verified || provider?.isVerified ? 'Verified Pro' : 'Local Pro'),
            trustItem('star', 'Experience', years ? `${years}+ Years` : 'Trusted Service'),
            trustItem('pin', 'Service Area', shortLocation(p.location, 1)),
          ),
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 10 } }, contactBar(phone, false)),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 18, paddingTop: 3 } },
            h('div', { style: { display: 'flex', flex: 1, height: 1, background: 'rgba(247,200,67,0.30)' } }),
            h('div', { style: { color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 2.5, textTransform: 'uppercase' } }, 'Supported by SkillsConnect Pro'),
            h('div', { style: { display: 'flex', flex: 1, height: 1, background: 'rgba(247,200,67,0.30)' } }),
          ),
        ),
      ),
    ),
  };
}

export function buildMarketingArtwork(input: ArtworkInput): ArtworkResult {
  const { portrait, work } = artworkImages(input);
  if (input.variant === 'business_card') return businessCard(input, portrait, work);
  if (input.variant === 'whatsapp_status') return whatsappStatus(input, portrait, work);
  return poster(input, portrait, work);
}
