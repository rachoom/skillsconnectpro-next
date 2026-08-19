'use client';

export function ProjectBriefSummaryCardPolish() {
  return (
    <style>{`
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary] {
        gap: .8rem !important;
        perspective: 1100px;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] {
        position: relative;
        isolation: isolate;
        min-height: 8.15rem !important;
        padding: 1rem !important;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--intake-yellow) 52%, var(--intake-line)) !important;
        border-radius: 1.05rem !important;
        background:
          radial-gradient(circle at 84% 12%, rgba(245,197,24,.10), transparent 6.5rem),
          linear-gradient(155deg, color-mix(in srgb, var(--intake-panel) 97%, white 3%), var(--intake-panel)) !important;
        color: var(--intake-text) !important;
        box-shadow:
          0 6px 0 color-mix(in srgb, var(--intake-yellow) 38%, #6c5200),
          0 14px 26px rgba(0,0,0,.22),
          inset 0 1px 0 rgba(255,255,255,.08) !important;
        transform: translateY(-2px) rotateX(.35deg);
        transform-origin: center bottom;
        transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]::before {
        content: '';
        position: absolute;
        z-index: -1;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(120deg, rgba(255,255,255,.055), transparent 38%);
        pointer-events: none;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]::after {
        position: absolute;
        top: .9rem;
        right: .9rem;
        color: color-mix(in srgb, var(--intake-text) 26%, transparent);
        font-size: .58rem;
        font-weight: 900;
        letter-spacing: .14em;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1)::after { content: '01'; }
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2)::after { content: '02'; }
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3)::after { content: '03'; }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1),
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2),
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) {
        border-color: color-mix(in srgb, var(--intake-yellow) 52%, var(--intake-line)) !important;
        background:
          radial-gradient(circle at 84% 12%, rgba(245,197,24,.10), transparent 6.5rem),
          linear-gradient(155deg, color-mix(in srgb, var(--intake-panel) 97%, white 3%), var(--intake-panel)) !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span {
        display: inline-flex !important;
        width: 2.65rem;
        height: 2.65rem;
        align-items: center;
        justify-content: center;
        border: 1px solid color-mix(in srgb, var(--intake-yellow) 84%, #a27c00) !important;
        border-radius: 999px;
        background: var(--intake-yellow) !important;
        color: #090909 !important;
        box-shadow:
          0 4px 0 #9a7600,
          0 9px 18px rgba(245,197,24,.20) !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span *,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1) > span,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2) > span,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > span {
        color: #090909 !important;
        stroke: currentColor !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:first-of-type,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1) > div:first-of-type,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2) > div:first-of-type,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > div:first-of-type {
        margin-top: .9rem !important;
        color: var(--intake-yellow) !important;
        font-size: .64rem !important;
        font-weight: 900 !important;
        letter-spacing: .13em !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:last-child {
        margin-top: .35rem !important;
        color: var(--intake-text) !important;
        font-size: 1rem !important;
        font-weight: 850 !important;
        line-height: 1.25rem !important;
        letter-spacing: -.015em;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:hover {
        border-color: var(--intake-yellow) !important;
        transform: translateY(-4px) rotateX(.35deg);
        box-shadow:
          0 7px 0 color-mix(in srgb, var(--intake-yellow) 48%, #6c5200),
          0 18px 34px rgba(0,0,0,.25),
          inset 0 1px 0 rgba(255,255,255,.1) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] {
        border-color: #dfbf37 !important;
        background:
          radial-gradient(circle at 84% 12%, rgba(245,197,24,.16), transparent 6.5rem),
          linear-gradient(155deg, #ffffff, #fffdf5) !important;
        box-shadow:
          0 6px 0 #d7b119,
          0 15px 28px rgba(31,27,12,.13),
          inset 0 1px 0 #ffffff !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]::after {
        color: rgba(17,17,17,.22);
      }

      @media (max-width: 640px) {
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary] {
          gap: .55rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] {
          min-height: 7rem !important;
          padding: .72rem !important;
          border-radius: .9rem !important;
          box-shadow:
            0 4px 0 color-mix(in srgb, var(--intake-yellow) 42%, #6c5200),
            0 10px 18px rgba(0,0,0,.18),
            inset 0 1px 0 rgba(255,255,255,.07) !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span {
          width: 2.2rem;
          height: 2.2rem;
          box-shadow: 0 3px 0 #9a7600, 0 7px 13px rgba(245,197,24,.18) !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span svg {
          width: 16px;
          height: 16px;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:first-of-type {
          margin-top: .62rem !important;
          font-size: .52rem !important;
          line-height: .75rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:last-child {
          margin-top: .25rem !important;
          font-size: .72rem !important;
          line-height: .98rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]::after {
          top: .7rem;
          right: .65rem;
          font-size: .48rem;
        }
      }
    `}</style>
  );
}
