'use client';

import { useEffect } from 'react';

const HERO_VIDEO_SRC = '/media/skillsconnectpro-hero-loop.mp4';

export function HeroVideoInjector() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('main > section:first-of-type');
    if (!hero || hero.querySelector('[data-hero-video]')) return;

    const poster = hero.querySelector<HTMLImageElement>('img');
    poster?.setAttribute('data-hero-poster', 'true');

    const video = document.createElement('video');
    video.setAttribute('data-hero-video', 'true');
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.tabIndex = -1;
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('disablepictureinpicture', '');

    const source = document.createElement('source');
    source.src = HERO_VIDEO_SRC;
    source.type = 'video/mp4';
    video.appendChild(source);

    const markReady = () => video.setAttribute('data-hero-video-ready', 'true');
    video.addEventListener('canplay', markReady, { once: true });

    if (poster) poster.insertAdjacentElement('afterend', video);
    else hero.prepend(video);

    const playback = video.play();
    playback?.catch(() => {
      // The still image remains visible if a browser chooses not to autoplay.
    });

    return () => {
      video.removeEventListener('canplay', markReady);
      video.remove();
      poster?.removeAttribute('data-hero-poster');
    };
  }, []);

  return null;
}
