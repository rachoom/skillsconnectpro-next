'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './AppIntro.module.css';

const SESSION_KEY = 'scp:intro-seen:v1';

type AppIntroProps = { onReveal?: () => void };

export function AppIntro({ onReveal }: AppIntroProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [staticMode, setStaticMode] = useState(false);
  const autoTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);

  const remember = () => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Storage can be unavailable in hardened/private browser modes.
    }
  };

  const dismiss = () => {
    if (exiting) return;
    remember();
    onReveal?.();
    setExiting(true);
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    exitTimer.current = window.setTimeout(() => setVisible(false), 620);
  };

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
        setVisible(false);
        return;
      }
    } catch {
      // Continue with the intro when session storage is unavailable.
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = navigator as Navigator & { connection?: { saveData?: boolean } };
    const shouldStayStatic = reducedMotion || Boolean(connection.connection?.saveData);
    setStaticMode(shouldStayStatic);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (shouldStayStatic) {
      autoTimer.current = window.setTimeout(dismiss, 3000);
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    };
    // dismiss is intentionally stable for the lifetime of this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) document.body.style.overflow = '';
  }, [visible]);

  if (!visible) return null;

  return (
    <section
      className={styles.intro}
      data-exiting={exiting ? 'true' : 'false'}
      aria-label="Welcome to Skills Connect Pro"
    >
      <div className={styles.goldLine} aria-hidden="true" />

      <button type="button" className={styles.skip} onClick={dismiss} aria-label="Skip introduction">
        Skip <X size={15} aria-hidden="true" />
      </button>

      <div className={styles.copy}>
        <Image
          src="/logo-new.svg"
          alt="Skills Connect Pro"
          width={260}
          height={70}
          priority
          className={styles.logo}
        />

        <span className={styles.eyebrow}>LOCAL HELP · ONE SMART CONNECTION</span>
        <h1>Your next job starts with the right connection.</h1>
        <p>
          Repairs, maintenance and home projects — connect with local service providers
          through one simple request.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={dismiss}>
            Get connected <ArrowRight size={19} aria-hidden="true" />
          </button>
          <Link href="/join" className={styles.provider} onClick={remember}>
            <BriefcaseBusiness size={17} aria-hidden="true" />
            Join as provider
          </Link>
        </div>

        <span className={styles.tagline}>LOCAL PEOPLE. REAL SKILLS. BRIGHTER OPPORTUNITIES.</span>
      </div>

      <div className={styles.media}>
        <div className={styles.mediaGlow} aria-hidden="true" />
        {staticMode ? (
          <Image
            src="/intro/skillsconnect-intro-poster.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 820px) 100vw, 50vw"
            className={styles.poster}
          />
        ) : (
          <video
            className={styles.video}
            src="/intro/skillsconnect-intro.mp4"
            poster="/intro/skillsconnect-intro-poster.jpg"
            autoPlay
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onEnded={() => {
              autoTimer.current = window.setTimeout(dismiss, 1350);
            }}
            onError={() => {
              setStaticMode(true);
              autoTimer.current = window.setTimeout(dismiss, 3000);
            }}
          />
        )}
        <div className={styles.mobileShade} aria-hidden="true" />
      </div>

      <div className={styles.progress} aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
