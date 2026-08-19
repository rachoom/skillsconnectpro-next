'use client';

export function ProjectBriefSummaryCardPolish() {
  return (
    <style>{`
      body[data-scp-surface='intake'] [data-intake-card='brief'] > button:first-child {
        display: none !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-category] {
        position: relative;
        display: inline-flex !important;
        min-height: 2.2rem;
        align-items: center;
        gap: .5rem;
        padding: .45rem .8rem !important;
        border: 1px solid color-mix(in srgb, var(--intake-yellow) 72%, var(--intake-line)) !important;
        border-radius: 999px !important;
        background: color-mix(in srgb, var(--intake-yellow) 10%, var(--intake-field)) !important;
        color: var(--intake-text) !important;
        box-shadow: 0 6px 18px rgba(0,0,0,.06) !important;
        font-size: .65rem !important;
        font-weight: 900 !important;
        letter-spacing: .11em !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-category]::before {
        content: '';
        width: .48rem;
        height: .48rem;
        flex: 0 0 auto;
        border-radius: 999px;
        background: var(--intake-yellow);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--intake-yellow) 14%, transparent);
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-category] {
        border-color: #e2c84e !important;
        background: linear-gradient(180deg, #fffdf6, #fff8d9) !important;
        color: #17130a !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary] {
        grid-template-columns: repeat(3, minmax(0,1fr)) !important;
        gap: .75rem !important;
        margin-top: 1rem !important;
        perspective: none !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card],
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1),
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2),
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) {
        position: relative;
        isolation: isolate;
        min-height: 7.7rem !important;
        padding: 1rem !important;
        overflow: hidden;
        border: 1px solid var(--intake-line) !important;
        border-radius: 1rem !important;
        background:
          linear-gradient(145deg, color-mix(in srgb, var(--intake-panel) 96%, white 4%), var(--intake-panel)) !important;
        color: var(--intake-text) !important;
        box-shadow:
          0 12px 28px rgba(0,0,0,.10),
          inset 0 1px 0 rgba(255,255,255,.07) !important;
        transform: none !important;
        transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]::before {
        content: '';
        position: absolute;
        top: 0;
        left: .9rem;
        right: .9rem;
        height: 3px;
        border-radius: 0 0 999px 999px;
        background: var(--intake-yellow);
        opacity: .92;
        pointer-events: none;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]::after {
        content: none !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1) > span,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2) > span,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > span {
        display: inline-flex !important;
        width: 2.45rem;
        height: 2.45rem;
        align-items: center;
        justify-content: center;
        border: 1px solid color-mix(in srgb, var(--intake-yellow) 56%, var(--intake-line)) !important;
        border-radius: 999px;
        background: color-mix(in srgb, var(--intake-yellow) 12%, var(--intake-field)) !important;
        color: var(--intake-yellow) !important;
        box-shadow: none !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span *,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1) > span,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2) > span,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > span {
        color: var(--intake-yellow) !important;
        stroke: currentColor !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:first-of-type,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1) > div:first-of-type,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2) > div:first-of-type,
      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > div:first-of-type {
        margin-top: .8rem !important;
        color: var(--intake-muted) !important;
        font-size: .62rem !important;
        font-weight: 900 !important;
        letter-spacing: .12em !important;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:last-child {
        margin-top: .32rem !important;
        color: var(--intake-text) !important;
        font-size: .98rem !important;
        font-weight: 900 !important;
        line-height: 1.22rem !important;
        letter-spacing: -.018em;
      }

      body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:hover {
        border-color: color-mix(in srgb, var(--intake-yellow) 55%, var(--intake-line)) !important;
        transform: translateY(-1px) !important;
        box-shadow:
          0 15px 32px rgba(0,0,0,.13),
          inset 0 1px 0 rgba(255,255,255,.08) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card],
      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(1),
      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(2),
      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) {
        border-color: #dedbd0 !important;
        background: linear-gradient(145deg, #ffffff, #fbfaf6) !important;
        box-shadow:
          0 12px 28px rgba(30,26,15,.08),
          inset 0 1px 0 #ffffff !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span {
        border-color: #ead36e !important;
        background: #fff8d9 !important;
        color: #c79a00 !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span * {
        color: #c79a00 !important;
      }

      @media (max-width: 640px) {
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary] {
          grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          gap: .6rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] {
          min-height: 6.35rem !important;
          padding: .78rem !important;
          border-radius: .9rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) {
          grid-column: 1 / -1;
          display: grid !important;
          min-height: 4.75rem !important;
          grid-template-columns: auto minmax(0,1fr);
          grid-template-rows: auto auto;
          column-gap: .75rem;
          align-items: center;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span {
          width: 2.15rem;
          height: 2.15rem;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > span svg {
          width: 16px;
          height: 16px;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:first-of-type {
          margin-top: .62rem !important;
          font-size: .54rem !important;
          line-height: .72rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card] > div:last-child {
          margin-top: .22rem !important;
          font-size: .78rem !important;
          line-height: 1.03rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > span {
          grid-row: 1 / 3;
          margin: 0 !important;
        }

        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > div:first-of-type,
        body[data-scp-surface='intake'] [data-intake-card='brief'] [data-intake-summary-card]:nth-child(3) > div:last-child {
          margin-top: 0 !important;
        }
      }
    `}</style>
  );
}
