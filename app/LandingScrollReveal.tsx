'use client';

import { useEffect } from 'react';

type RevealKind = 'heading' | 'item' | 'block' | 'footer';

export const LandingScrollReveal = () => {
  useEffect(() => {
    const main = document.querySelector('main');
    const root = main?.parentElement as HTMLElement | null;
    if (!main || !root) return;

    const targets: HTMLElement[] = [];

    const collect = (selector: string, kind: RevealKind, staggerMs = 0) => {
      Array.from(document.querySelectorAll<HTMLElement>(selector)).forEach((element, index) => {
        element.dataset.scrollReveal = kind;
        element.style.setProperty('--scroll-delay', `${staggerMs ? Math.min(index, 5) * staggerMs : 0}ms`);
        element.removeAttribute('data-scroll-visible');
        targets.push(element);
      });
    };

    // Headings and explanatory copy.
    collect('#services > div:first-child', 'heading');
    collect('#how-it-works > div:first-child', 'heading');
    collect('#support > div:first-child', 'heading');

    // Repeated cards/items reveal in short cascades as each group enters view.
    collect('#services a[href^="/get-help?service="]', 'item', 65);
    collect('main > section:nth-of-type(3) > div > div', 'item', 80);
    collect('#how-it-works article', 'item', 80);
    collect('#support details', 'item', 70);

    // Larger conversion blocks should arrive as complete composed surfaces.
    collect('main > section:nth-of-type(5)', 'block');
    collect('main > section:nth-of-type(6)', 'block');
    collect('#support > div:last-child', 'block');
    collect('main > footer', 'footer');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.dataset.scrollReady = 'true';

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((element) => {
        element.dataset.scrollVisible = 'true';
      });
      return () => {
        delete root.dataset.scrollReady;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.dataset.scrollVisible = 'true';
          observer.unobserve(element);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    targets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      delete root.dataset.scrollReady;
    };
  }, []);

  return null;
};
