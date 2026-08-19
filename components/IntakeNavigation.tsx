'use client';

import Link from 'next/link';
import { ChevronLeft, House, MessageCircleQuestion, PencilLine } from 'lucide-react';
import { useEffect, useState } from 'react';

export const IntakeNavigation = () => {
  const [isEditingBrief, setIsEditingBrief] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIsEditingBrief(Boolean(document.querySelector("[data-intake-card='brief']")));
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, []);

  const goBack = () => {
    const brief = document.querySelector<HTMLElement>("[data-intake-card='brief']");
    const changeDescription = brief?.querySelector<HTMLButtonElement>(':scope > button:first-child');
    if (changeDescription) {
      changeDescription.click();
      return;
    }

    const clarifyBack = document.querySelector<HTMLButtonElement>("[data-intake-stage='clarify'] > button:first-child");
    if (clarifyBack) {
      clarifyBack.click();
      return;
    }

    const stageBack = document.querySelector<HTMLButtonElement>("[data-intake-stage='confirm'] [data-intake-stage-navigation] button:first-child");
    if (stageBack) {
      stageBack.click();
      return;
    }

    if (window.history.length > 1) window.history.back();
    else window.location.assign('/');
  };

  return (
    <nav className="sticky top-0 z-[95] border-b border-white/10 bg-[#172119]/95 px-3 py-2 text-white shadow-lg backdrop-blur-xl sm:px-5" aria-label="Job request navigation">
      <div className="mx-auto flex min-h-12 max-w-4xl items-center justify-between gap-2">
        <button
          type="button"
          onClick={goBack}
          data-intake-nav-action="back"
          data-intake-nav-mode={isEditingBrief ? 'edit-description' : 'back'}
          aria-label={isEditingBrief ? 'Change project description' : 'Go back'}
          className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-black uppercase tracking-wider text-white/85"
        >
          <span data-intake-nav-icon aria-hidden="true">{isEditingBrief ? <PencilLine size={17} /> : <ChevronLeft size={18} />}</span>
          <span data-intake-nav-label>{isEditingBrief ? 'Change description' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            data-intake-nav-action="home"
            aria-label="Home"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-black uppercase tracking-wider text-white/85"
          >
            <span data-intake-nav-icon aria-hidden="true"><House size={17} /></span>
            <span data-intake-nav-label>Home</span>
          </Link>
          <a
            href="https://wa.me/27697026088"
            target="_blank"
            rel="noreferrer"
            data-intake-nav-action="help"
            aria-label="Get help on WhatsApp"
            className="flex min-h-11 items-center gap-2 rounded-xl bg-[#f5c518] px-3 text-xs font-black uppercase tracking-wider text-black"
          >
            <span data-intake-nav-icon aria-hidden="true"><MessageCircleQuestion size={17} /></span>
            <span data-intake-nav-label>Help</span>
          </a>
        </div>
      </div>
      <style>{`
        body[data-scp-surface='intake'] main > div > header:first-child { display: none !important; }
      `}</style>
    </nav>
  );
};
