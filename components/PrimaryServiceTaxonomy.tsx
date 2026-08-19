'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

const HOMEPAGE_REPLACEMENTS = [
  {
    from: 'Building & renovations',
    to: 'Cleaning',
    image: '/artisans/Cards/Cleaners.png',
  },
  {
    from: 'Carpentry',
    to: 'Mechanics',
    image: '/artisans/Cards/Mechanic.png',
  },
] as const;

function replaceHomepageCards() {
  const cards = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('#services a[href*="/get-help?service="]'),
  );

  for (const card of cards) {
    const label = card.querySelector<HTMLElement>('strong');
    const current = label?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const replacement = HOMEPAGE_REPLACEMENTS.find((item) => item.from === current);
    if (!replacement) continue;

    card.setAttribute('href', `/get-help?service=${encodeURIComponent(replacement.to)}`);
    if (label) label.textContent = replacement.to;

    const image = card.querySelector<HTMLImageElement>('img');
    if (image) {
      image.removeAttribute('srcset');
      image.setAttribute('src', replacement.image);
      image.setAttribute('alt', `${replacement.to} service`);
    }

    card.dataset.primaryService = replacement.to.toLowerCase();
  }
}

function replaceAdminCategoryOptions() {
  const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'));

  for (const select of selects) {
    const options = Array.from(select.options);
    const hasMechanics = options.some((option) => option.value === 'Mechanics');
    const hasCleaners = options.some((option) => option.value === 'Cleaners' || option.value === 'Cleaning');

    const builders = options.find((option) => option.value === 'Builders');
    if (builders) {
      if (hasMechanics) builders.remove();
      else {
        builders.value = 'Mechanics';
        builders.textContent = 'Mechanics';
      }
    }

    const carpenters = Array.from(select.options).find((option) => option.value === 'Carpenters');
    if (carpenters) {
      if (hasCleaners) carpenters.remove();
      else {
        carpenters.value = 'Cleaners';
        carpenters.textContent = 'Cleaners';
      }
    }
  }
}

function removeLegacyPromotedCards() {
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
  for (const image of images) {
    const src = image.getAttribute('src') || '';
    if (!src.includes('/artisans/Cards/builders.png') && !src.includes('/artisans/Cards/Carpenter.png')) {
      continue;
    }

    const card = image.closest<HTMLElement>('a, button');
    if (!card || card.closest('#services')) continue;

    const pageHasReplacement = src.includes('builders.png')
      ? Boolean(document.querySelector('img[src*="/artisans/Cards/Mechanic.png"]'))
      : Boolean(document.querySelector('img[src*="/artisans/Cards/Cleaners.png"]'));

    if (pageHasReplacement) card.style.display = 'none';
  }
}

export const PrimaryServiceTaxonomy = () => {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const apply = () => {
      if (pathname === '/') replaceHomepageCards();
      if (pathname === '/marketplace-admin') replaceAdminCategoryOptions();
      removeLegacyPromotedCards();
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
};
