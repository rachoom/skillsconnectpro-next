"use client";

import React, { useState, useEffect } from 'react';
import { DownloadIcon } from './Icons';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Clock3, MapPin, ShieldCheck } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function HeroSection() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const quickFilters = ['Plumbers', 'Electricians', 'Builders', 'Mechanics', 'Roofing'];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    installPrompt?.prompt();
  };

  return (
    <main className="scp-shell overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/og-image.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
          aria-hidden="true"
        >
          <source src="/download.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0f0c09]/70 to-[#070503]"></div>
        <div className="absolute inset-0 bg-hex-pattern-dark opacity-35"></div>
      </div>

      <section className="relative z-10 scp-container pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="scp-card p-6 sm:p-8 md:p-12">
          <p className="scp-kicker mb-5">Trusted Local Network</p>
          <h1 className="scp-heading-xl text-white max-w-4xl">
            Find Verified Pros Faster. Hire with <span className="text-brand-yellow">Real Confidence.</span>
          </h1>
          <p className="scp-text-lg mt-6 max-w-3xl">
            Skills Connect Pro helps households and businesses find vetted artisans quickly, compare profiles, and take action via call, WhatsApp, or direct profile links.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href="/?profile=1" className="scp-btn scp-btn-primary">
              Explore Profiles
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link href="/blog" className="scp-btn scp-btn-secondary">
              Read Safety Guides
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {quickFilters.map((filter) => (
              <button key={filter} type="button" className="scp-chip" aria-label={`Search ${filter}`}>
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-brand-yellow text-xs font-black uppercase tracking-[0.15em]">Verified Listings</p>
              <p className="text-white text-sm mt-1.5 leading-relaxed">Manual partner verification helps reduce low-trust matches.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-brand-yellow text-xs font-black uppercase tracking-[0.15em]">Fast Contact</p>
              <p className="text-white text-sm mt-1.5 leading-relaxed">Call and WhatsApp actions are one-tap on mobile devices.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-brand-yellow text-xs font-black uppercase tracking-[0.15em]">Local Relevance</p>
              <p className="text-white text-sm mt-1.5 leading-relaxed">Location-aware results for East Rand and broader Gauteng areas.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 scp-container pb-20 md:pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="scp-card scp-card-hover p-6">
            <ShieldCheck className="w-6 h-6 text-brand-yellow mb-4" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">Trust-First Discovery</h2>
            <p className="scp-text-body mt-3">Profiles surface proof points and essential contact details before users commit.</p>
          </article>
          <article className="scp-card scp-card-hover p-6">
            <MapPin className="w-6 h-6 text-brand-yellow mb-4" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">Location Intent</h2>
            <p className="scp-text-body mt-3">Your most useful local matches appear quickly with less scrolling and less friction.</p>
          </article>
          <article className="scp-card scp-card-hover p-6">
            <Clock3 className="w-6 h-6 text-brand-yellow mb-4" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">Action in Seconds</h2>
            <p className="scp-text-body mt-3">One consistent action model across the app makes conversion paths predictable.</p>
          </article>
        </div>

        <div className="mt-10 scp-card p-6 sm:p-8 md:p-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div>
            <p className="scp-kicker mb-2">Built For Mobile</p>
            <h3 className="scp-heading-lg text-white">Better readability, spacing, and tap targets across every viewport.</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <BadgeCheck className="w-5 h-5 text-brand-yellow" aria-hidden="true" />
            Responsive audit pass applied to key landing and profile views.
          </div>
        </div>
      </section>

      {installPrompt && (
        <button
          onClick={handleInstallClick}
          className="scp-btn scp-btn-primary fixed bottom-6 right-6 z-[90] h-14 w-14 !p-0 !rounded-full shadow-2xl"
          title="Install Skills Connect Pro"
          aria-label="Install Skills Connect Pro"
        >
          <DownloadIcon />
        </button>
      )}
    </main>
  );
}