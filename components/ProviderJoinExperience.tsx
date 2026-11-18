'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, BriefcaseBusiness, House, MessagesSquare, ShieldCheck } from 'lucide-react';
import { QuickOnboard } from './QuickOnboard';
import styles from './ProviderJoinExperience.module.css';

export const ProviderJoinExperience = () => {
  const router = useRouter();

  useEffect(() => {
    // Mobile visitors from WhatsApp should land on the photo onboarding action.
    // Leave desktop and links targeting another page anchor unchanged.
    if (window.innerWidth >= 1024) return;
    if (window.location.hash && window.location.hash !== '#provider-camera-assistant') return;

    const timer = window.setTimeout(() => {
      const assistant = document.getElementById('provider-camera-assistant');
      // Keep the provider photo and camera action together in the first view.
      const application = assistant?.closest('[data-provider-application]') ?? assistant;
      application?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <Link href="/" className={styles.home}>
            <span className={styles.iconBadge}><House size={17} aria-hidden="true" /></span> Home
          </Link>
          <Image src="/logo-new.svg" alt="Skills Connect Pro" width={165} height={46} />
        </header>

        <section className={styles.layout}>
          <div className={styles.copy}>
            <div className={styles.eyebrow}>
              <BriefcaseBusiness size={16} aria-hidden="true" /> Join the provider network
            </div>
            <h1>
              Receive relevant local opportunities. Build a verified work record.
            </h1>
            <p className={styles.description}>
              Add your basic service details now. Skills Connect Pro reviews provider applications before profiles and marketplace opportunities become active.
            </p>

            <div className={styles.benefits}>
              {[
                { icon: ShieldCheck, text: 'Customer contact details remain protected until selection' },
                { icon: MessagesSquare, text: 'Respond only to opportunities that fit your service' },
                { icon: BadgeCheck, text: 'Completed jobs can build verified marketplace reputation' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className={styles.benefit}>
                  <span className={styles.iconBadge}><Icon size={20} aria-hidden="true" /></span><span>{text}</span>
                </div>
              ))}
            </div>

            <div className={styles.reviewNote}>
              <span className={styles.iconBadge}><ShieldCheck size={19} aria-hidden="true" /></span>
              <span>Provider applications are reviewed. Joining does not guarantee immediate activation or a specific number of opportunities.</span>
            </div>
          </div>

          <div className={styles.application} data-provider-application>
            <div className={styles.visual}>
              <Image src="/artisans/provider-join-workshop.webp" alt="Two local skilled professionals reviewing a phone outside their workshop" fill priority unoptimized sizes="(min-width: 1024px) 480px, 100vw" />
            </div>
            <QuickOnboard isDarkMode onComplete={() => router.push('/')} />
          </div>
        </section>
      </div>
    </main>
  );
};
