'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { QuickOnboard } from './QuickOnboard';

export const ProviderJoinExperience = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(47,103,74,0.28),transparent_30rem),radial-gradient(circle_at_90%_30%,rgba(245,197,24,0.12),transparent_24rem),#120b07] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-wider text-white/75">
            <ArrowLeft size={17} /> Home
          </Link>
          <Image src="/logo-new.svg" alt="Skills Connect Pro" width={165} height={46} />
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">
              <Sparkles size={15} /> Join the provider network
            </div>
            <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Receive relevant local opportunities. Build a verified work record.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Add your basic service details now. Skills Connect Pro reviews provider applications before profiles and marketplace opportunities become active.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                'Customer contact details remain protected until selection',
                'Respond only to opportunities that fit your service',
                'Completed jobs can build verified marketplace reputation',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75 backdrop-blur-xl">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={19} /> {item}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-xs leading-6 text-emerald-50/75">
              <ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={19} />
              Provider applications are reviewed. Joining does not guarantee immediate activation or a specific number of opportunities.
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-[#0d2117]/85 shadow-2xl shadow-black/45 backdrop-blur-2xl">
            <QuickOnboard isDarkMode onComplete={() => router.push('/')} />
          </div>
        </section>
      </div>
    </main>
  );
};
