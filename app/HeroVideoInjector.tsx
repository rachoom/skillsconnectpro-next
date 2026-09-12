'use client';

import { useEffect } from 'react';

const HERO_STATIC_IMAGE =
  'https://images.unsplash.com/photo-1757359056339-22968344cce6?auto=format&fit=crop&w=3200&q=92';

/**
 * Keeps the homepage hero lightweight: the approved dusk-house visual is a
 * static high-resolution image, while motion is concentrated in the final
 * highlighted phrase of the hero headline.
 *
 * The export name is retained so the existing homepage integration does not
 * need another compatibility layer.
 */
export function HeroVideoInjector() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('main > section:first-of-type');
    if (!hero) return;

    const image = hero.querySelector<HTMLImageElement>('img');
    const headline = hero.querySelector<HTMLHeadingElement>('h1');
    const accent = headline?.querySelector<HTMLElement>('span') ?? null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cancelled = false;
    let typingTimer = 0;
    let cursorTimer = 0;
    let imageObserver: MutationObserver | null = null;

    const originalImage = image
      ? {
          src: image.getAttribute('src'),
          srcset: image.getAttribute('srcset'),
          alt: image.getAttribute('alt'),
        }
      : null;

    const applyStaticImage = () => {
      if (!image) return;
      if (image.getAttribute('src') !== HERO_STATIC_IMAGE) image.setAttribute('src', HERO_STATIC_IMAGE);
      if (image.hasAttribute('srcset')) image.removeAttribute('srcset');
      image.setAttribute('alt', 'A high-end modern home illuminated at dusk');
      image.setAttribute('data-hero-static-house', 'true');
      image.style.position = 'absolute';
      image.style.inset = '0';
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.objectFit = 'cover';
    };

    applyStaticImage();

    if (image) {
      imageObserver = new MutationObserver(() => {
        if (cancelled) return;
        if (image.getAttribute('src') !== HERO_STATIC_IMAGE || image.hasAttribute('srcset')) {
          applyStaticImage();
        }
      });
      imageObserver.observe(image, { attributes: true, attributeFilter: ['src', 'srcset'] });
    }

    const originalAccent = accent?.textContent?.trim() ?? '';
    if (!accent || !originalAccent) {
      return () => {
        cancelled = true;
        imageObserver?.disconnect();
      };
    }

    headline?.setAttribute('aria-label', `${headline.textContent?.replace(originalAccent, '').trim()} ${originalAccent}`.trim());

    const caret = document.createElement('span');
    caret.setAttribute('aria-hidden', 'true');
    caret.setAttribute('data-hero-accent-caret', 'true');
    caret.textContent = '|';
    caret.style.color = '#f5c518';
    caret.style.fontWeight = '500';
    caret.style.marginLeft = '.06em';
    caret.style.textShadow = '0 0 14px rgba(245,197,24,.45)';
    accent.insertAdjacentElement('afterend', caret);

    if (reduceMotion) {
      accent.textContent = originalAccent;
      caret.remove();
    } else {
      let visible = 0;
      let deleting = false;

      const schedule = (delay: number) => {
        window.clearTimeout(typingTimer);
        typingTimer = window.setTimeout(tick, delay);
      };

      const tick = () => {
        if (cancelled) return;

        if (!deleting) {
          visible = Math.min(originalAccent.length, visible + 1);
          accent.textContent = originalAccent.slice(0, visible);
          if (visible >= originalAccent.length) {
            deleting = true;
            schedule(1750);
            return;
          }
          schedule(58);
          return;
        }

        visible = Math.max(0, visible - 1);
        accent.textContent = originalAccent.slice(0, visible);
        if (visible <= 0) {
          deleting = false;
          schedule(520);
          return;
        }
        schedule(32);
      };

      accent.textContent = '';
      schedule(420);
      cursorTimer = window.setInterval(() => {
        if (!cancelled && caret.isConnected) {
          caret.style.opacity = caret.style.opacity === '0' ? '1' : '0';
        }
      }, 520);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(typingTimer);
      window.clearInterval(cursorTimer);
      imageObserver?.disconnect();
      if (accent) accent.textContent = originalAccent;
      caret.remove();

      if (image && originalImage) {
        if (originalImage.src) image.setAttribute('src', originalImage.src);
        else image.removeAttribute('src');
        if (originalImage.srcset) image.setAttribute('srcset', originalImage.srcset);
        else image.removeAttribute('srcset');
        if (originalImage.alt !== null) image.setAttribute('alt', originalImage.alt);
        else image.removeAttribute('alt');
        image.removeAttribute('data-hero-static-house');
      }
    };
  }, []);

  return null;
}
