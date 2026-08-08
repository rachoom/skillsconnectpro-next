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
