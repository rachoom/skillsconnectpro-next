'use client';

import { useEffect, useState } from 'react';
import styles from './HeroSmileVideo.module.css';

const VIDEO_PARTS = [
  '/hero-video/part-00.txt',
  '/hero-video/part-01.txt',
  '/hero-video/part-02.txt',
  '/hero-video/part-03.txt',
  '/hero-video/part-04.txt',
  '/hero-video/part-05.txt',
];

export function HeroSmileVideo() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (reducedMotion.matches || connection.connection?.saveData) return;

    let active = true;
    let objectUrl: string | null = null;

    Promise.all(
      VIDEO_PARTS.map(async (path) => {
        const response = await fetch(path, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`Hero video asset failed: ${path}`);
        return response.text();
      }),
    )
      .then((parts) => {
        const binary = window.atob(parts.join(''));
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }

        objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
        if (active) setSrc(objectUrl);
      })
      .catch(() => {
        // The existing hero still remains visible as a graceful fallback.
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  if (!src) return null;

  return (
    <video
      className={styles.video}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
    />
  );
}
