'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BadgeCheck, Camera, CheckCircle2, FileText, Images, ScanText, ShieldCheck, Sparkles } from 'lucide-react';
import { QuickOnboard } from './QuickOnboard';

const steps = [
  { title: 'Snap your details', detail: 'A business card, flyer or handwritten note.', icon: Camera },
  { title: 'AI reads the note', detail: 'We fill in your details for you.', icon: ScanText },
  { title: 'Show your work', detail: 'Add up to 3 photos of completed jobs.', icon: Images },
  { title: 'Submit for review', detail: 'Confirm your details and apply.', icon: BadgeCheck },
];

export const ProviderJoinExperience = () => {
  const router = useRouter();

  useEffect(() => {
    // Keep the QR / WhatsApp experience focused on the registration action.
    if (window.innerWidth >= 1024) return;
    if (window.location.hash && window.location.hash !== '#provider-camera-assistant') return;
    const timer = window.setTimeout(() => {
      document.getElementById('provider-camera-assistant')?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    }, 160);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="scp-join-page min-h-screen bg-[radial-gradient(circle_at_90%_3%,#fbe7a9_0%,transparent_38%),radial-gradient(circle_at_0%_60%,#dcebdc_0%,transparent_35%),#f7f2e8] px-3 py-4 text-[#162d22] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex min-h-16 items-center justify-between gap-2 rounded-[1.25rem] border border-[#143d2d]/10 bg-[#123527] px-4 py-3 shadow-lg shadow-[#133023]/15 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-white/85 hover:text-white">
            <ArrowLeft size={17} /> Home
          </Link>
          <Image src="/logo-new.svg" alt="Skills Connect Pro" width={178} height={45} className="max-w-[58vw] object-contain" priority />
        </header>

        <section className="grid gap-6 pb-10 pt-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-start lg:gap-10 lg:pt-12">
          <div className="scp-join-content lg:pt-6">
            <div className="scp-join-badge inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-100/80 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#705010]">
              <Sparkles size={15} /> Join the local provider network
            </div>
            <h1 className="scp-join-title mt-5 max-w-xl text-[2.35rem] font-black leading-[1.07] tracking-[-0.05em] sm:text-5xl lg:text-[3.55rem]">
              Your skills deserve <span className="scp-join-title-accent text-[#bd8a00]">more opportunities.</span>
            </h1>
            <p className="scp-join-description mt-5 max-w-lg text-[15px] leading-7 text-[#436356] sm:text-base">
              Show us what you do. Snap a photo of your business details, let AI help fill in your application,
              and add photos of work you are proud of.
            </p>

            <div className="scp-join-story mt-6 flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/75 p-3 shadow-sm">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-emerald-900 sm:h-28 sm:w-28">
                <Image src="/artisans/hero-welder.jpg" alt="Skilled artisan at work" fill sizes="112px" className="object-cover" />
              </div>
              <div>
                <p className="scp-join-story-kicker text-xs font-black uppercase tracking-[0.13em] text-[#ba8500]">Real people. Real skills.</p>
                <p className="scp-join-story-title mt-1 text-sm font-bold leading-5">Plumbers, painters, builders, electricians, cleaners and more.</p>
                <p className="scp-join-story-caption mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#366953]"><CheckCircle2 size={15} /> Local opportunities after approval</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-lg bg-[#123527] p-2 text-amber-300"><FileText size={19} /></span>
                <h2 className="scp-join-process-title text-base font-black">How joining works</h2>
                <ArrowRight size={17} className="text-[#b48b17]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {steps.map(({ title, detail, icon: Icon }, index) => (
                  <div key={title} className="scp-join-step-card rounded-2xl border border-[#1b4b38]/10 bg-white/85 p-4 shadow-[0_8px_20px_rgba(22,65,39,0.05)]">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f9e8a7] text-[#174332]"><Icon size={23} strokeWidth={2.1} /></span>
                      <span className="scp-join-step-number text-xs font-black text-[#bba66b]">0{index + 1}</span>
                    </div>
                    <h3 className="scp-join-step-heading text-[13px] font-black sm:text-sm">{title}</h3>
                    <p className="scp-join-step-copy mt-1 text-xs leading-5 text-[#648074]">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="scp-join-disclaimer mt-5 flex items-start gap-2 text-xs leading-5 text-[#557065]">
              <ShieldCheck size={18} className="shrink-0 text-[#2b7051]" />
              Every application is reviewed. Joining does not guarantee immediate activation or a particular number of opportunities.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-[#1b4d35]/25 bg-[#103223] shadow-[0_28px_70px_rgba(11,45,31,0.25)] sm:rounded-[2rem]">
            <QuickOnboard isDarkMode onComplete={() => router.push('/')} />
          </div>
        </section>
      </div>
    </main>
  );
};
