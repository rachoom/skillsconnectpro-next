'use client';

import { ArrowLeft, ArrowRight, Check, CircleDollarSign, Clock3, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type BriefPage = 1 | 2;

type Snapshot = {
  title: string;
  category: string;
};

function scrollBriefIntoView(card: HTMLElement) {
  window.setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 30);
}

export function ProjectBriefUXEnhancer() {
  const [card, setCard] = useState<HTMLElement | null>(null);
  const [progressHost, setProgressHost] = useState<HTMLElement | null>(null);
  const [navigationHost, setNavigationHost] = useState<HTMLElement | null>(null);
  const [page, setPage] = useState<BriefPage>(1);
  const [snapshot, setSnapshot] = useState<Snapshot>({ title: '', category: '' });
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sync = () => {
      const next = document.querySelector<HTMLElement>("[data-intake-card='brief']");
      if (next !== cardRef.current) {
        cardRef.current = next;
        setCard(next);
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!card) {
      setProgressHost(null);
      setNavigationHost(null);
      return;
    }

    card.dataset.briefEnhanced = 'true';
    card.dataset.briefPage = String(page);
    card.style.scrollMarginTop = '5.5rem';

    const directChildren = Array.from(card.children) as HTMLElement[];
    const summaryGrid = card.querySelector<HTMLElement>('[data-intake-summary]');
    const choiceGrid = card.querySelector<HTMLElement>('[data-intake-choice-grid]');
    const nativeNavigation = card.querySelector<HTMLElement>('[data-intake-stage-navigation]');
    const safety = card.querySelector<HTMLElement>('[data-intake-safety]');
    const title = card.querySelector<HTMLElement>('h1');
    const category = card.querySelector<HTMLElement>('[data-intake-category]');

    directChildren.forEach((element) => {
      if (!element.dataset.briefEnhancerHost && element !== nativeNavigation) {
        element.dataset.briefSection = '1';
      }
    });

    const likelyIssue = summaryGrid?.nextElementSibling as HTMLElement | null;
    const urgencyLabel = choiceGrid?.previousElementSibling as HTMLElement | null;
    [likelyIssue, urgencyLabel, choiceGrid].forEach((element) => {
      if (element) element.dataset.briefSection = '2';
    });

    if (nativeNavigation) nativeNavigation.dataset.briefNativeNavigation = 'true';
    if (safety) safety.dataset.briefSafety = 'true';

    let progress = card.querySelector<HTMLElement>('[data-brief-enhancer-progress-host]');
    if (!progress) {
      progress = document.createElement('div');
      progress.dataset.briefEnhancerHost = 'true';
      progress.dataset.briefEnhancerProgressHost = 'true';
      const firstButton = card.querySelector(':scope > button');
      if (firstButton?.nextSibling) card.insertBefore(progress, firstButton.nextSibling);
      else card.prepend(progress);
    }

    let navigation = card.querySelector<HTMLElement>('[data-brief-enhancer-navigation-host]');
    if (!navigation) {
      navigation = document.createElement('div');
      navigation.dataset.briefEnhancerHost = 'true';
      navigation.dataset.briefEnhancerNavigationHost = 'true';
      if (nativeNavigation) card.insertBefore(navigation, nativeNavigation);
      else card.append(navigation);
    }

    setSnapshot({
      title: title?.textContent?.trim() || 'Your project',
      category: category?.textContent?.trim() || 'Project',
    });
    setProgressHost(progress);
    setNavigationHost(navigation);
  }, [card]);

  useEffect(() => {
    if (!card) return;
    card.dataset.briefPage = String(page);
  }, [card, page]);

  const goToPage = (nextPage: BriefPage) => {
    setPage(nextPage);
    if (card) scrollBriefIntoView(card);
  };

  const continueToLocation = () => {
    if (!card) return;
    const nativeNext = card.querySelector<HTMLButtonElement>("[data-brief-native-navigation] button:last-child");
    nativeNext?.click();
  };

  return (
    <>
      <style>{`
        body[data-scp-surface='intake'] [data-intake-card='brief'][data-brief-enhanced='true'] {
          --brief-red: #ff6b6b;
          --brief-orange: #ffad4d;
          --brief-green: #58d68d;
          --brief-blue: #57a8ff;
          --brief-violet: #a98cff;
          overflow: hidden;
          min-height: min(760px, calc(100svh - 8.6rem));
          padding-bottom: 1.25rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'][data-brief-page='1'] > [data-brief-section='2'],
        body[data-scp-surface='intake'] [data-intake-card='brief'][data-brief-page='2'] > [data-brief-section='1'],
        body[data-scp-surface='intake'] [data-intake-card='brief'] > [data-brief-native-navigation='true'] {
          display: none !important;
        }

        body[data-scp-surface='intake'] [data-brief-enhancer-progress-host] {
          margin: 0 0 1.15rem !important;
        }

        body[data-scp-surface='intake'] [data-brief-progress] {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: .65rem;
          padding: .55rem;
          border: 1px solid var(--intake-line) !important;
          border-radius: .9rem;
          background: color-mix(in srgb, var(--intake-field) 86%, transparent) !important;
        }

        body[data-scp-surface='intake'] [data-brief-progress] > span {
          width: 1.4rem;
          height: 1px;
          background: var(--intake-line-strong);
        }

        body[data-scp-surface='intake'] [data-brief-progress] button {
          display: flex;
          min-height: 2.75rem;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          border: 1px solid transparent !important;
          border-radius: .7rem !important;
          background: transparent !important;
          color: var(--intake-muted) !important;
          font-size: .75rem;
          font-weight: 850;
        }

        body[data-scp-surface='intake'] [data-brief-progress] button[data-active='true'] {
          border-color: var(--intake-yellow) !important;
          background: var(--intake-yellow) !important;
          color: #090909 !important;
          box-shadow: 0 8px 24px rgba(245,197,24,.16) !important;
        }

        body[data-scp-surface='intake'] [data-brief-progress] button > span:first-child {
          display: inline-flex;
          width: 1.55rem;
          height: 1.55rem;
          align-items: center;
          justify-content: center;
          border: 1px solid currentColor;
          border-radius: 999px;
          font-size: .7rem;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary] {
          grid-template-columns: repeat(3, minmax(0,1fr)) !important;
          gap: .65rem !important;
          margin-top: 1rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] {
          min-height: 7.25rem;
          padding: .9rem !important;
          border: 1px solid var(--intake-line) !important;
          border-radius: .9rem !important;
          background: var(--intake-field) !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1) {
          border-color: color-mix(in srgb, var(--brief-orange) 62%, var(--intake-line)) !important;
          background: color-mix(in srgb, var(--brief-orange) 10%, var(--intake-field)) !important;
        }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2) {
          border-color: color-mix(in srgb, var(--brief-green) 58%, var(--intake-line)) !important;
          background: color-mix(in srgb, var(--brief-green) 9%, var(--intake-field)) !important;
        }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) {
          border-color: color-mix(in srgb, var(--brief-blue) 58%, var(--intake-line)) !important;
          background: color-mix(in srgb, var(--brief-blue) 9%, var(--intake-field)) !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1) > span,
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1) > div:first-of-type { color: var(--brief-orange) !important; }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2) > span,
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2) > div:first-of-type { color: var(--brief-green) !important; }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > span,
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > div:first-of-type { color: var(--brief-blue) !important; }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-brief-safety='true'] {
          border-color: color-mix(in srgb, var(--brief-red) 58%, var(--intake-line)) !important;
          background: color-mix(in srgb, var(--brief-red) 8%, var(--intake-field)) !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'][data-brief-page='2'] {
          background:
            radial-gradient(circle at 92% 8%, rgba(169,140,255,.10), transparent 20rem),
            radial-gradient(circle at 4% 88%, rgba(87,168,255,.08), transparent 18rem),
            var(--intake-panel) !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'][data-brief-page='2'] > [data-brief-section='2']:first-of-type {
          margin-top: .5rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] {
          grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          gap: .75rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button {
          min-height: 5.25rem;
          padding: .9rem !important;
          border-width: 1px !important;
          border-radius: .9rem !important;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:nth-child(1) {
          border-color: color-mix(in srgb, var(--brief-red) 58%, var(--intake-line)) !important;
          background: color-mix(in srgb, var(--brief-red) 7%, var(--intake-field)) !important;
        }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:nth-child(2) {
          border-color: color-mix(in srgb, var(--brief-orange) 60%, var(--intake-line)) !important;
          background: color-mix(in srgb, var(--brief-orange) 7%, var(--intake-field)) !important;
        }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:nth-child(3) {
          border-color: color-mix(in srgb, var(--intake-yellow) 70%, var(--intake-line)) !important;
          background: color-mix(in srgb, var(--intake-yellow) 6%, var(--intake-field)) !important;
        }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:nth-child(4) {
          border-color: color-mix(in srgb, var(--brief-violet) 60%, var(--intake-line)) !important;
          background: color-mix(in srgb, var(--brief-violet) 7%, var(--intake-field)) !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:has(svg) {
          transform: translateY(-1px);
          color: #090909 !important;
          box-shadow: 0 10px 28px rgba(0,0,0,.18) !important;
        }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:nth-child(1):has(svg) { background: var(--brief-red) !important; border-color: var(--brief-red) !important; }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:nth-child(2):has(svg) { background: var(--brief-orange) !important; border-color: var(--brief-orange) !important; }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:nth-child(3):has(svg) { background: var(--intake-yellow) !important; border-color: var(--intake-yellow) !important; }
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button:nth-child(4):has(svg) { background: var(--brief-violet) !important; border-color: var(--brief-violet) !important; }

        body[data-scp-surface='intake'] [data-brief-enhancer-navigation-host] {
          margin-top: 1.15rem;
          padding-top: 1rem;
          border-top: 1px solid var(--intake-line);
        }

        body[data-scp-surface='intake'] [data-brief-nav] {
          display: grid;
          grid-template-columns: minmax(0,.8fr) minmax(0,1.35fr);
          gap: .7rem;
        }

        body[data-scp-surface='intake'] [data-brief-nav] button {
          display: flex;
          min-height: 3.4rem;
          align-items: center;
          justify-content: center;
          gap: .55rem;
          padding: .7rem 1rem;
          border: 1px solid var(--intake-line-strong) !important;
          border-radius: .8rem !important;
          font-size: .82rem;
          font-weight: 900;
        }

        body[data-scp-surface='intake'] [data-brief-nav] [data-secondary] {
          background: var(--intake-button) !important;
          color: var(--intake-button-text) !important;
        }

        body[data-scp-surface='intake'] [data-brief-nav] [data-primary] {
          border-color: var(--intake-yellow) !important;
          background: var(--intake-yellow) !important;
          color: #090909 !important;
        }

        body[data-scp-surface='intake'] [data-brief-page-note] {
          margin: 0 0 .75rem !important;
          color: var(--intake-muted) !important;
          font-size: .72rem;
          text-align: center;
        }

        @media (max-width: 640px) {
          body[data-scp-surface='intake'] [data-intake-card='brief'][data-brief-enhanced='true'] {
            min-height: calc(100svh - 7.25rem);
            padding: 1rem !important;
            border-radius: 1.15rem !important;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] > button:first-child {
            min-height: 2.45rem !important;
            margin-bottom: .75rem !important;
            padding: .45rem .7rem !important;
            font-size: .68rem !important;
          }

          body[data-scp-surface='intake'] [data-brief-progress] {
            gap: .35rem;
            padding: .35rem;
          }

          body[data-scp-surface='intake'] [data-brief-progress] > span {
            width: .7rem;
          }

          body[data-scp-surface='intake'] [data-brief-progress] button {
            min-height: 2.55rem;
            padding-inline: .45rem;
            font-size: .68rem;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] h1 {
            margin-top: .55rem !important;
            font-size: clamp(1.7rem, 8vw, 2.3rem) !important;
            line-height: 1.02 !important;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] h1 + p {
            margin-top: .65rem !important;
            font-size: .82rem !important;
            line-height: 1.45rem !important;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary] {
            grid-template-columns: repeat(3,minmax(0,1fr)) !important;
            gap: .45rem !important;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] {
            min-height: 6.2rem;
            padding: .65rem !important;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span svg {
            width: 17px;
            height: 17px;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:first-of-type {
            margin-top: .55rem !important;
            font-size: .55rem !important;
            letter-spacing: .08em !important;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:last-child {
            margin-top: .25rem !important;
            font-size: .7rem !important;
            line-height: 1rem !important;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] {
            grid-template-columns: 1fr !important;
            gap: .55rem !important;
          }

          body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-choice-grid] > button {
            min-height: 4rem;
            padding: .7rem .8rem !important;
          }

          body[data-scp-surface='intake'] [data-brief-nav] {
            grid-template-columns: 1fr 1.35fr;
            position: sticky;
            bottom: .65rem;
            z-index: 10;
            padding: .5rem;
            border: 1px solid var(--intake-line);
            border-radius: .9rem;
            background: color-mix(in srgb, var(--intake-panel) 94%, transparent);
            box-shadow: 0 15px 35px rgba(0,0,0,.28);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
          }

          body[data-scp-surface='intake'] [data-brief-nav] button {
            min-height: 3.15rem;
            padding: .55rem .65rem;
            font-size: .72rem;
          }
        }
      `}</style>

      {progressHost && createPortal(
        <div data-brief-progress aria-label="Project brief pages">
          <button type="button" data-active={page === 1} aria-current={page === 1 ? 'step' : undefined} onClick={() => goToPage(1)}>
            <span>{page > 1 ? <Check size={12} /> : '1'}</span>
            <span>Project snapshot</span>
          </button>
          <span aria-hidden="true" />
          <button type="button" data-active={page === 2} aria-current={page === 2 ? 'step' : undefined} onClick={() => goToPage(2)}>
            <span>2</span>
            <span>Timing & urgency</span>
          </button>
        </div>,
        progressHost,
      )}

      {navigationHost && createPortal(
        <div>
          <p data-brief-page-note>
            {page === 1 ? 'Check the project snapshot, then confirm how soon you need help.' : `${snapshot.category} · ${snapshot.title}`}
          </p>
          <div data-brief-nav>
            {page === 1 ? (
              <>
                <button type="button" data-secondary onClick={() => card?.querySelector<HTMLButtonElement>(':scope > button')?.click()}>
                  <ArrowLeft size={17} /> Edit
                </button>
                <button type="button" data-primary onClick={() => goToPage(2)}>
                  Choose timing <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <>
                <button type="button" data-secondary onClick={() => goToPage(1)}>
                  <ArrowLeft size={17} /> Summary
                </button>
                <button type="button" data-primary onClick={continueToLocation}>
                  Add location <ArrowRight size={17} />
                </button>
              </>
            )}
          </div>
        </div>,
        navigationHost,
      )}
    </>
  );
}
