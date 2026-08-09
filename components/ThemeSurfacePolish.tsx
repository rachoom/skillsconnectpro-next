'use client';

import { usePathname } from 'next/navigation';

export const ThemeSurfacePolish = () => {
  const pathname = usePathname();
  if (pathname === '/get-help') return null;

  return (
  <style>{`
    /* Shared intake typography: bold, direct headings with restrained gold hierarchy. */
    body[data-scp-surface='intake'] main h1,
    body[data-scp-surface='intake'] main h2,
    body[data-scp-surface='intake'] main h3 {
      letter-spacing: -.035em;
      text-wrap: balance;
    }

    body[data-scp-surface='intake'] main section [class*='uppercase'][class*='tracking-widest']:not([class*='text-red']):not([class*='text-amber']) {
      color: #dfc07b !important;
    }

    /* The confirmation step is a stack of cards. Remove the accidental pale inner panels in dark mode. */
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] {
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']):not([class~='space-y-5']) {
      border: 1px solid rgba(220, 185, 130, .34) !important;
      background:
        radial-gradient(circle at 100% 0%, rgba(245, 197, 24, .055), transparent 17rem),
        linear-gradient(145deg, rgba(27, 20, 16, .94), rgba(13, 27, 19, .92)) !important;
      color: #f5efe3 !important;
      box-shadow:
        0 30px 76px -40px rgba(0, 0, 0, .92),
        inset 0 1px 0 rgba(255, 255, 255, .055) !important;
      backdrop-filter: blur(22px) saturate(108%);
      -webkit-backdrop-filter: blur(22px) saturate(108%);
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div h1,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div h2,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div h3,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div strong,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']) h1,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']) h2,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']) h3 {
      color: #f7f0e4 !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div p:not([class*='text-red']):not([class*='text-amber']),
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div small {
      color: rgba(245, 239, 227, .68) !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div [class*='bg-white'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div [class*='bg-[#e8eee2]'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div [class*='bg-[#faf9f4]'] {
      border-color: rgba(220, 185, 130, .3) !important;
      background: rgba(246, 239, 226, .06) !important;
      color: #f5efe3 !important;
    }

    /* Light intake: warm ivory glass, strong espresso outlines and gold-brown hierarchy. */
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] {
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']):not([class~='space-y-5']) {
      border: 2px solid rgba(91, 55, 24, .52) !important;
      background:
        radial-gradient(circle at 100% 0%, rgba(245, 197, 24, .09), transparent 18rem),
        linear-gradient(145deg, rgba(255, 252, 243, .96), rgba(245, 236, 217, .93)) !important;
      color: #241b14 !important;
      box-shadow:
        0 28px 66px -38px rgba(79, 49, 23, .52),
        inset 0 1px 0 rgba(255, 255, 255, .96) !important;
      backdrop-filter: blur(20px) saturate(102%);
      -webkit-backdrop-filter: blur(20px) saturate(102%);
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section h1,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section h2,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section h3,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section strong {
      color: #241b14 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main section [class*='uppercase'][class*='tracking-widest']:not([class*='text-red']):not([class*='text-amber']) {
      color: #7b5016 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section p:not([class*='text-red']):not([class*='text-amber']),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section small {
      color: #5b574f !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div [class*='bg-white'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div [class*='bg-[#e8eee2]'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div [class*='bg-[#faf9f4]'] {
      border-color: rgba(104, 65, 27, .5) !important;
      background: rgba(255, 254, 249, .95) !important;
      color: #241b14 !important;
      box-shadow: 0 16px 34px -28px rgba(79, 49, 23, .42) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div [class*='bg-[#dfe8d6]'] {
      border-color: rgba(118, 80, 25, .62) !important;
      background: rgba(245, 197, 24, .16) !important;
      color: #65400d !important;
    }

    /* Customer dashboard light theme: change cards and typography, not only the page background. */
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main {
      background:
        radial-gradient(circle at 8% 0%, rgba(245, 197, 24, .1), transparent 25rem),
        radial-gradient(circle at 94% 35%, rgba(46, 104, 72, .09), transparent 30rem),
        #f2ecdf !important;
      color: #241b14 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main > div > header,
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main article,
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-white/'] {
      border-color: rgba(91, 55, 24, .34) !important;
      background: rgba(255, 252, 243, .9) !important;
      color: #241b14 !important;
      box-shadow:
        0 24px 56px -40px rgba(79, 49, 23, .46),
        inset 0 1px 0 rgba(255, 255, 255, .94) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='border-white/'] {
      border-color: rgba(91, 55, 24, .3) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-black/20'] {
      border: 1px solid rgba(91, 55, 24, .16);
      background: rgba(100, 64, 30, .065) !important;
      color: #241b14 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-white/10'] {
      border: 1px solid rgba(118, 80, 25, .24);
      background: rgba(245, 197, 24, .12) !important;
      color: #4d3419 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main h1,
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main h2,
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main h3,
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main strong,
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-white'] {
      color: #241b14 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-zinc-'] {
      color: #625d55 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-amber-300'] {
      color: #8b5b15 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-emerald-300'],
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-emerald-400'],
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-emerald-50'] {
      color: #176745 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-emerald-500/10'] {
      border-color: rgba(23, 103, 69, .42) !important;
      background: rgba(224, 241, 229, .92) !important;
      color: #173f2d !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-amber-400/10'] {
      border-color: rgba(118, 80, 25, .4) !important;
      background: rgba(252, 241, 198, .92) !important;
      color: #4d3419 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main button:not([class*='bg-amber-400']):not([class*='bg-[#25D366]']),
    html[data-scp-theme='light'] body[data-scp-surface='customer'] main a:not([class*='bg-amber-400']):not([class*='bg-[#25D366]']):not([class*='bg-white']) {
      color: #241b14;
    }

    html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='border-dashed'] {
      border-color: rgba(91, 55, 24, .36) !important;
      background: rgba(255, 252, 243, .56) !important;
    }

    @media (max-width: 640px) {
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main > div > header,
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main article,
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-white/'] {
        background: rgba(255, 252, 243, .94) !important;
      }
    }
  `}</style>
  );
};
