'use client';

import { useEffect } from 'react';

const HERO_VIDEO_PARTS = Array.from(
  { length: 8 },
  (_, index) => `/media/hero-parts/part-${String(index).padStart(2, '0')}.bin`,
);

type NetworkInformation = {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

export function HeroVideoInjector() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
    if (reduceMotion || saveData) return;

    const hero = document.querySelector<HTMLElement>('main > section:first-of-type');
    if (!hero || hero.querySelector('[data-hero-video]')) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    const poster = hero.querySelector<HTMLImageElement>('img');
    poster?.setAttribute('data-hero-poster', 'true');

    const video = document.createElement('video');
    video.setAttribute('data-hero-video', 'true');
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.tabIndex = -1;
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('disablepictureinpicture', '');

    const markReady = () => video.setAttribute('data-hero-video-ready', 'true');
    video.addEventListener('canplay', markReady, { once: true });

    if (poster) poster.insertAdjacentElement('afterend', video);
    else hero.prepend(video);

    const loadVideo = async () => {
      try {
        const buffers = await Promise.all(
          HERO_VIDEO_PARTS.map(async (src) => {
            const response = await fetch(src, { cache: 'force-cache' });
            if (!response.ok) throw new Error(`Failed to load ${src}`);
            return response.arrayBuffer();
          }),
        );

        if (cancelled) return;

        objectUrl = URL.createObjectURL(new Blob(buffers, { type: 'video/mp4' }));
        video.src = objectUrl;
        await video.play();
      } catch {
        // Keep the dusk still visible if loading or autoplay is unavailable.
      }
    };

    void loadVideo();

    return () => {
      cancelled = true;
      video.removeEventListener('canplay', markReady);
      video.pause();
      video.remove();
      poster?.removeAttribute('data-hero-poster');
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return null;
}
