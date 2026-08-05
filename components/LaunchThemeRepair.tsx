'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export const LaunchThemeRepair = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/get-help') return;

    const updateCopy = () => {
      const headings = Array.from(document.querySelectorAll('main h1'));
      const openingHeading = headings.find((heading) => heading.textContent?.trim() === 'Show us the job.');
      if (openingHeading) openingHeading.textContent = 'What do you need done?';

      const labels = Array.from(document.querySelectorAll('main label > span'));
      const descriptionLabel = labels.find((label) => label.textContent?.trim() === 'What do you need done?');
      if (descriptionLabel) descriptionLabel.textContent = 'Describe the job';

      const paragraphs = Array.from(document.querySelectorAll('main p'));
      const openingCopy = paragraphs.find((paragraph) =>
        paragraph.textContent?.includes('Describe what you need in your own words.'),
      );
      if (openingCopy) {
        openingCopy.textContent = 'Tell us what needs attention. We’ll turn it into a clear project request and guide you through the next steps.';
      }
    };

    updateCopy();
    const observer = new MutationObserver(updateCopy);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <style>{`
      /* Shared form voice: the same strong editorial typography used by the launch homepage. */
      body[data-scp-surface='intake'] main h1,
      body[data-scp-surface='intake'] main h2,
      body[data-scp-surface='intake'] main h3,
      body[data-scp-surface='customer'] main h1,
      body[data-scp-surface='customer'] main h2,
      body[data-scp-surface='customer'] main h3 {
        font-weight: 900 !important;
        letter-spacing: -.045em !important;
        line-height: 1.02 !important;
        text-wrap: balance;
      }

      body[data-scp-surface='intake'] main h1 {
        font-size: clamp(2.35rem, 8vw, 4.65rem) !important;
      }

      /* Dark intake: every stage is a brown/forest card rather than a leftover cream form. */
      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main {
        color: #f5efe3 !important;
      }

      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']),
      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div {
        border: 1px solid rgba(220,185,130,.36) !important;
        background:
          radial-gradient(circle at 100% 0%, rgba(245,197,24,.055), transparent 18rem),
          linear-gradient(145deg, rgba(31,22,17,.96), rgba(12,27,19,.95)) !important;
        color: #f5efe3 !important;
        box-shadow: 0 30px 72px -38px rgba(0,0,0,.94), inset 0 1px 0 rgba(255,255,255,.06) !important;
      }

      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']) :is(h1,h2,h3,strong),
      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div :is(h1,h2,h3,strong) {
        color: #fff8e9 !important;
      }

      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']) :is(p,small,label,span):not([class*='text-red']):not([class*='text-amber']),
      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div :is(p,small,label,span):not([class*='text-red']):not([class*='text-amber']) {
        color: rgba(245,239,227,.72) !important;
      }

      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section [class*='bg-white'],
      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#faf9f4]'],
      html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#e8eee2]'] {
        border-color: rgba(220,185,130,.3) !important;
        background: rgba(246,239,226,.065) !important;
        color: #f5efe3 !important;
      }

      /* Light intake: warm ivory, espresso type and stronger brown/gold construction lines. */
      html[data-scp-theme='light'] body[data-scp-surface='intake'] main {
        color: #261a12 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']),
      html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div {
        border: 2px solid rgba(91,55,24,.58) !important;
        background:
          radial-gradient(circle at 100% 0%, rgba(245,197,24,.1), transparent 19rem),
          linear-gradient(145deg, rgba(255,252,243,.98), rgba(244,234,214,.96)) !important;
        color: #261a12 !important;
        box-shadow: 0 28px 64px -36px rgba(78,47,21,.54), inset 0 1px 0 rgba(255,255,255,.96) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section :is(h1,h2,h3,strong) {
        color: #261a12 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section :is(p,small,label,span):not([class*='text-red']):not([class*='text-amber']) {
        color: #5b5147 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section [class*='bg-white'],
      html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#faf9f4]'],
      html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#e8eee2]'] {
        border-color: rgba(104,65,27,.52) !important;
        background: rgba(255,253,247,.96) !important;
        color: #261a12 !important;
        box-shadow: 0 15px 32px -27px rgba(78,47,21,.42) !important;
      }

      /* Customer record: switch the actual cards and all inherited text, not only the page background. */
      html[data-scp-theme='dark'] body[data-scp-surface='customer'] main {
        background:
          radial-gradient(circle at 8% 0%, rgba(47,103,74,.18), transparent 28rem),
          radial-gradient(circle at 96% 38%, rgba(245,197,24,.07), transparent 26rem),
          #100b08 !important;
        color: #f5efe3 !important;
      }

      html[data-scp-theme='dark'] body[data-scp-surface='customer'] main :is(h1,h2,h3,strong) {
        color: #fff8e9 !important;
      }

      html[data-scp-theme='dark'] body[data-scp-surface='customer'] main :is(p,small,span):not([class*='text-amber']):not([class*='text-emerald']):not([class*='text-red']) {
        color: rgba(245,239,227,.68) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='customer'] main {
        background:
          radial-gradient(circle at 8% 0%, rgba(245,197,24,.1), transparent 26rem),
          radial-gradient(circle at 95% 34%, rgba(47,103,74,.08), transparent 30rem),
          #f2ecdf !important;
        color: #261a12 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='customer'] main > div > header,
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main section > div[class*='rounded-'],
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main article,
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-white/'] {
        border-color: rgba(91,55,24,.36) !important;
        background: rgba(255,252,243,.94) !important;
        color: #261a12 !important;
        box-shadow: 0 22px 52px -38px rgba(78,47,21,.44), inset 0 1px 0 rgba(255,255,255,.95) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='customer'] main :is(h1,h2,h3,strong),
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-white'] {
        color: #261a12 !important;
        text-shadow: none !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='customer'] main :is(p,small,span):not([class*='text-amber']):not([class*='text-emerald']):not([class*='text-red']) {
        color: #62594f !important;
        text-shadow: none !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-amber'] {
        color: #815414 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='text-emerald'] {
        color: #176745 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-black/'],
      html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='bg-white/10'] {
        border-color: rgba(104,65,27,.25) !important;
        background: rgba(245,197,24,.1) !important;
        color: #493019 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='customer'] main [class*='border-dashed'] {
        border-color: rgba(91,55,24,.4) !important;
        background: rgba(255,252,243,.72) !important;
      }

      @media (max-width: 640px) {
        body[data-scp-surface='intake'] main h1 {
          font-size: clamp(2.2rem, 12vw, 3.5rem) !important;
        }

        html[data-scp-theme='light'] body[data-scp-surface='customer'] main > div > header,
        html[data-scp-theme='light'] body[data-scp-surface='customer'] main section > div[class*='rounded-'],
        html[data-scp-theme='light'] body[data-scp-surface='customer'] main article {
          background: rgba(255,252,243,.97) !important;
        }
      }
    `}</style>
  );
};
