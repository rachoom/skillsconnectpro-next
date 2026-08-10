'use client';

import Link from 'next/link';
import { ArrowLeft, Home, LifeBuoy } from 'lucide-react';

export const IntakeNavigation = () => {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign('/');
  };

  return (
    <nav className="sticky top-0 z-[95] border-b border-white/10 bg-[#172119]/95 px-3 py-2 text-white shadow-lg backdrop-blur-xl sm:px-5" aria-label="Job request navigation">
      <div className="mx-auto flex min-h-12 max-w-4xl items-center justify-between gap-2">
        <button
          type="button"
          onClick={goBack}
          className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-black uppercase tracking-wider text-white/85"
        >
          <ArrowLeft size={17} /> Back
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-black uppercase tracking-wider text-white/85"
          >
            <Home size={17} /> <span className="hidden sm:inline">Home</span>
          </Link>
          <a
            href="https://wa.me/27697026088"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-2 rounded-xl bg-[#f5c518] px-3 text-xs font-black uppercase tracking-wider text-black"
          >
            <LifeBuoy size={17} /> <span className="hidden sm:inline">Help</span>
          </a>
        </div>
      </div>
      <style>{`
        body[data-scp-surface='intake'] main > div > header:first-child { display: none !important; }
      `}</style>
    </nav>
  );
};
