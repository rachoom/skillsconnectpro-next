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
const GOLD = '#F7C843';
const GOLD_DEEP = '#A97C18';
const BLACK = '#070604';
const BLACK_SOFT = '#100D08';
const PANEL = '#17130C';
const CREAM = '#FFF8E8';
const MUTED = '#C8C0B2';
const MUTED_DARK = '#8F887B';

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

function logo(origin: string, size = 54) {
  return h('img', {
    src: `${origin}/logo-new.svg`,
    width: size,
    height: size,
    style: { objectFit: 'contain' },
  });
}

function brandLockup(origin: string, compact = false, dark = true) {
  return h('div', {
    style: { display: 'flex', alignItems: 'center', gap: compact ? 10 : 14 },
  },
    logo(origin, compact ? 42 : 52),
    h('div', { style: { display: 'flex', flexDirection: 'column' } },
      h('div', {
        style: {
          color: dark ? CREAM : BLACK,
          fontSize: compact ? 21 : 27,
          fontWeight: 900,
          letterSpacing: -0.7,
        },
      }, 'SkillsConnect Pro'),
      h('div', {
        style: {
          color: GOLD,
          fontSize: compact ? 8 : 10,
          fontWeight: 900,
          letterSpacing: 2.4,
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
      padding: '10px 16px',
      borderRadius: 999,
      border: `1px solid ${GOLD}`,
      background: filled ? GOLD : 'rgba(7,6,4,0.60)',
      color: filled ? BLACK : GOLD,
      fontSize: 12,
      fontWeight: 950,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  }, text);
}

function formatPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (/^27\d{9}$/.test(digits)) return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return phone || 'View SkillsConnect Pro profile';
}

function providerNameSize(name: string, large: number, medium: number, small: number): number {
  if (name.length > 26) return small;
  if (name.length > 18) return medium;
  return large;
}

function serviceNoun(category: string): string {
  const clean = (category || 'Local professional').trim();
  const key = clean.toLowerCase();
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
  if (key.includes('cater')) return 'Catering';
  if (key.includes('hair')) return 'Hair';
  if (key.includes('beaut')) return 'Beauty';
  return clean.replace(/s$/i, '');
}

function serviceHeadline(category: string): string {
  return `Professional ${serviceNoun(category)} Services`;
}

function needHeadline(category: string): string {
  const noun = serviceNoun(category);
  if (noun === 'Painting') return 'Need a Painter?';
  if (noun === 'Plumbing') return 'Need a Plumber?';
  if (noun === 'Electrical') return 'Need an Electrician?';
  if (noun === 'Building') return 'Need a Builder?';
  if (noun === 'Carpentry') return 'Need a Carpenter?';
  if (noun === 'Cleaning') return 'Need a Cleaner?';
  if (noun === 'Mechanical') return 'Need a Mechanic?';
  if (noun === 'Welding') return 'Need a Welder?';
  if (noun === 'Tiling') return 'Need a Tiler?';
  return `Need ${noun}?`;
}

function fullBleedImage(src: string) {
  return h('img', {
    src,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  });
}

function goldRule(width: number | string = '100%') {
  return h('div', {
    style: {
      width,
      height: 3,
      background: `linear-gradient(90deg, ${GOLD}, rgba(247,200,67,0.12))`,
    },
  });
}

function contactBlock(phone: string, compact = false) {
  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? 3 : 6,
      borderRadius: compact ? 18 : 24,
      background: GOLD,
      color: BLACK,
      padding: compact ? '14px 18px' : '18px 24px',
    },
  },
    h('div', {
      style: {
        fontSize: compact ? 9 : 11,
        fontWeight: 950,
        letterSpacing: 2.2,
        textTransform: 'uppercase',
      },
    }, 'WhatsApp / Call'),
    h('div', {
      style: {
        fontSize: compact ? 24 : 32,
        fontWeight: 950,
        letterSpacing: -0.8,
      },
    }, formatPhone(phone)),
  );
}

function poster(input: ArtworkInput, imageSrc: string): ArtworkResult {
  const { campaign, origin, phone } = input;
  const copy = campaign.creative_copy;
  const p = campaign.provider_snapshot;
  const nameSize = providerNameSize(p.name, 76, 66, 56);

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
      h('div', {
        style: {
          height: 735,
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
        },
      },
        fullBleedImage(imageSrc),
        h('div', {
          style: {
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(7,6,4,0.22) 0%, rgba(7,6,4,0.08) 38%, rgba(7,6,4,0.96) 100%)',
          },
        }),
        h('div', {
          style: {
            position: 'absolute',
            top: 42,
            left: 50,
            right: 50,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
        },
          brandLockup(origin, true),
          badge(p.verified ? 'Verified Pro' : 'Local Pro'),
        ),
        h('div', {
          style: {
            position: 'absolute',
            left: 54,
            right: 54,
            bottom: 48,
            display: 'flex',
            flexDirection: 'column',
          },
        },
          h('div', {
            style: {
              color: GOLD,
              fontSize: 16,
              fontWeight: 950,
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 16,
            },
          }, serviceHeadline(p.category)),
          h('div', {
            style: {
              color: CREAM,
              fontSize: nameSize,
              lineHeight: 0.95,
              fontWeight: 950,
              letterSpacing: -3.2,
              maxWidth: 850,
              textShadow: '0 4px 24px rgba(0,0,0,0.55)',
            },
          }, p.name),
        ),
      ),

      h('div', {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '44px 54px 42px',
          position: 'relative',
          background: `linear-gradient(135deg, ${BLACK_SOFT} 0%, ${BLACK} 72%)`,
        },
      },
        h('div', {
          style: {
            position: 'absolute',
            right: -150,
            top: -170,
            width: 410,
            height: 410,
            borderRadius: 410,
            border: '50px solid rgba(247,200,67,0.055)',
          },
        }),
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            gap: 38,
            position: 'relative',
            zIndex: 2,
          },
        },
          h('div', {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              paddingRight: 14,
            },
          },
            h('div', {
              style: {
                color: CREAM,
                fontSize: 43,
                lineHeight: 1.02,
                fontWeight: 950,
                letterSpacing: -1.8,
                marginBottom: 15,
              },
            }, needHeadline(p.category)),
            h('div', {
              style: {
                color: MUTED,
                fontSize: 23,
                lineHeight: 1.35,
                maxWidth: 560,
              },
            }, copy.subheadline),
          ),
          contactBlock(phone),
        ),
        h('div', { style: { marginTop: 32, marginBottom: 22 } }, goldRule()),
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 30,
            position: 'relative',
            zIndex: 2,
          },
        },
          h('div', { style: { display: 'flex', flexDirection: 'column', maxWidth: 680 } },
            h('div', {
              style: {
                color: GOLD,
                fontSize: 11,
                fontWeight: 950,
                letterSpacing: 2.6,
                textTransform: 'uppercase',
                marginBottom: 8,
              },
            }, 'Service area'),
            h('div', {
              style: {
                color: CREAM,
                fontSize: 19,
                lineHeight: 1.35,
                fontWeight: 750,
              },
            }, p.location),
          ),
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              textAlign: 'right',
            },
          },
            h('div', { style: { color: MUTED_DARK, fontSize: 11, fontWeight: 800 } }, 'Professionally promoted by'),
            h('div', { style: { color: GOLD, fontSize: 15, fontWeight: 950 } }, 'SkillsConnect Pro'),
          ),
        ),
      ),
    ),
  };
}

function businessCard(input: ArtworkInput, imageSrc: string): ArtworkResult {
  const { campaign, origin, phone } = input;
  const p = campaign.provider_snapshot;
  const copy = campaign.creative_copy;
  const nameSize = providerNameSize(p.name, 58, 50, 43);

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
      h('div', {
        style: {
          width: 515,
          height: '100%',
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
        },
      },
        fullBleedImage(imageSrc),
        h('div', {
          style: {
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(7,6,4,0.02) 45%, rgba(7,6,4,0.88) 100%)',
          },
        }),
        h('div', {
          style: {
            position: 'absolute',
            left: 28,
            bottom: 28,
            display: 'flex',
          },
        }, badge(p.verified ? 'Verified professional' : 'Local professional', true)),
      ),

      h('div', {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '42px 48px 38px 20px',
          position: 'relative',
        },
      },
        h('div', {
          style: {
            position: 'absolute',
            right: -80,
            top: -105,
            width: 290,
            height: 290,
            borderRadius: 290,
            background: 'rgba(247,200,67,0.055)',
          },
        }),
        brandLockup(origin, true),
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2,
            marginTop: 6,
          },
        },
          h('div', {
            style: {
              color: GOLD,
              fontSize: 12,
              fontWeight: 950,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 11,
            },
          }, serviceHeadline(p.category)),
          h('div', {
            style: {
              fontSize: nameSize,
              lineHeight: 0.98,
              fontWeight: 950,
              letterSpacing: -2.4,
              marginBottom: 13,
              maxWidth: 590,
            },
          }, p.name),
          h('div', {
            style: {
              color: MUTED,
              fontSize: 18,
              lineHeight: 1.35,
              maxWidth: 560,
            },
          }, copy.subheadline),
        ),
        h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 24, zIndex: 2 } },
          h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
            h('div', {
              style: {
                color: GOLD,
                fontSize: 9,
                fontWeight: 950,
                letterSpacing: 2.2,
                textTransform: 'uppercase',
                marginBottom: 5,
              },
            }, 'Serving'),
            h('div', {
              style: {
                color: CREAM,
                fontSize: 14,
                lineHeight: 1.3,
                fontWeight: 750,
                maxWidth: 360,
              },
            }, p.location),
            h('div', {
              style: {
                color: MUTED_DARK,
                fontSize: 10,
                marginTop: 10,
              },
            }, 'Promoted by SkillsConnect Pro'),
          ),
          contactBlock(phone, true),
        ),
      ),
      h('div', {
        style: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 500,
          width: 4,
          background: `linear-gradient(180deg, rgba(247,200,67,0), ${GOLD}, rgba(247,200,67,0))`,
        },
      }),
    ),
  };
}

function whatsappStatus(input: ArtworkInput, imageSrc: string): ArtworkResult {
  const { campaign, origin, phone } = input;
  const copy = campaign.creative_copy;
  const p = campaign.provider_snapshot;
  const nameSize = providerNameSize(p.name, 84, 74, 64);

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
      h('div', {
        style: {
          height: 1110,
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
        },
      },
        fullBleedImage(imageSrc),
        h('div', {
          style: {
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(7,6,4,0.35) 0%, rgba(7,6,4,0.06) 34%, rgba(7,6,4,0.35) 62%, rgba(7,6,4,1) 100%)',
          },
        }),
        h('div', {
          style: {
            position: 'absolute',
            top: 54,
            left: 58,
            right: 58,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
          brandLockup(origin, true),
          badge('Featured Today'),
        ),
        h('div', {
          style: {
            position: 'absolute',
            left: 58,
            right: 58,
            bottom: 68,
            display: 'flex',
            flexDirection: 'column',
          },
        },
          h('div', {
            style: {
              alignSelf: 'flex-start',
              background: GOLD,
              color: BLACK,
              padding: '10px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 950,
              letterSpacing: 2.4,
              textTransform: 'uppercase',
              marginBottom: 22,
            },
          }, serviceHeadline(p.category)),
          h('div', {
            style: {
              fontSize: nameSize,
              fontWeight: 950,
              lineHeight: 0.93,
              letterSpacing: -4.2,
              maxWidth: 860,
              textShadow: '0 5px 28px rgba(0,0,0,0.62)',
            },
          }, p.name),
        ),
      ),

      h('div', {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '34px 58px 52px',
          background: BLACK,
          position: 'relative',
        },
      },
        h('div', {
          style: {
            color: GOLD,
            fontSize: 50,
            lineHeight: 1,
            fontWeight: 950,
            letterSpacing: -2.2,
            marginBottom: 18,
          },
        }, needHeadline(p.category)),
        h('div', {
          style: {
            color: MUTED,
            fontSize: 27,
            lineHeight: 1.32,
            maxWidth: 850,
            marginBottom: 26,
          },
        }, copy.subheadline),
        h('div', { style: { marginBottom: 24 } }, goldRule()),
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 28,
          },
        },
          h('div', {
            style: {
              color: GOLD,
              fontSize: 11,
              fontWeight: 950,
              letterSpacing: 2.8,
              textTransform: 'uppercase',
              marginBottom: 8,
            },
          }, 'Available in'),
          h('div', {
            style: {
              color: CREAM,
              fontSize: 21,
              lineHeight: 1.35,
              fontWeight: 750,
            },
          }, p.location),
        ),
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 28,
            marginTop: 'auto',
          },
        },
          h('div', { style: { display: 'flex', flexDirection: 'column', maxWidth: 430 } },
            h('div', {
              style: {
                color: CREAM,
                fontSize: 20,
                fontWeight: 900,
                marginBottom: 7,
              },
            }, 'Save • Share • Recommend'),
            h('div', {
              style: {
                color: MUTED_DARK,
                fontSize: 13,
                lineHeight: 1.3,
              },
            }, 'Professionally promoted by SkillsConnect Pro'),
          ),
          contactBlock(phone),
        ),
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
