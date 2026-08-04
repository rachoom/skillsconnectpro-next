'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Camera, Sparkles } from 'lucide-react';

export const ProjectRequestLauncher = () => {
  const pathname = usePathname();
  if (pathname !== '/') return null;

  return (
    <Link
      href="/get-help"
      className="fixed bottom-4 left-1/2 z-[89] flex min-h-14 -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-black bg-[#f5c518] px-5 text-sm font-black text-black shadow-[0_8px_0_rgba(0,0,0,0.8),0_16px_35px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:-translate-x-1/2 active:translate-y-1 active:-translate-x-1/2 active:shadow-[0_4px_0_rgba(0,0,0,0.8)] sm:bottom-6 sm:min-h-16 sm:px-7 sm:text-base"
      aria-label="Describe or photograph a job and create a project request"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-black text-[#f5c518]">
        <Camera size={19} />
        <Sparkles className="absolute -right-1 -top-1" size={12} />
      </span>
      <span className="whitespace-nowrap">Show us the job</span>
      <ArrowRight size={19} strokeWidth={3} />
    </Link>
  );
};
