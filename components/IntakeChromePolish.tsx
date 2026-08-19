export function IntakeChromePolish() {
  return (
    <style>{`
      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
        padding-inline: .8rem !important;
      }

      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] > div {
        width: min(100%, 68rem) !important;
        max-width: 68rem !important;
      }

      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-action] {
        min-height: 3rem !important;
        gap: .55rem !important;
        padding: .35rem .75rem .35rem .4rem !important;
        border-radius: 999px !important;
        border: 1px solid var(--intake-line) !important;
        background: color-mix(in srgb, var(--intake-panel) 94%, transparent) !important;
        color: var(--intake-text) !important;
        box-shadow: 0 8px 24px rgba(0,0,0,.12) !important;
        font-size: .78rem !important;
        font-weight: 850 !important;
        letter-spacing: -.01em !important;
        text-transform: none !important;
        transition: transform .18s ease, box-shadow .18s ease, filter .18s ease !important;
      }

      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-icon] {
        display: inline-flex;
        width: 2.15rem;
        height: 2.15rem;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: color-mix(in srgb, var(--intake-yellow) 13%, var(--intake-field));
        color: var(--intake-yellow);
      }

      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-action='help'] {
        border-color: var(--intake-yellow) !important;
        background: var(--intake-yellow) !important;
        color: #090909 !important;
        box-shadow: 0 10px 28px rgba(245,197,24,.18) !important;
      }

      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-action='help'] [data-intake-nav-icon] {
        background: #090909;
        color: var(--intake-yellow);
      }

      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-action]:hover {
        transform: translateY(-1px);
      }

      body[data-scp-surface='intake'] [data-intake-stage='clarify'] > button:first-child {
        display: none !important;
      }

      body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:first-of-type {
        align-items: flex-start !important;
      }

      body[data-scp-surface='intake'] [data-intake-question-counter] {
        display: inline-flex !important;
        min-height: 2.7rem;
        align-items: center;
        gap: .55rem;
        padding: .35rem .8rem .35rem .38rem !important;
        border: 1px solid color-mix(in srgb, var(--intake-yellow) 52%, var(--intake-line)) !important;
        border-radius: 999px !important;
        background: color-mix(in srgb, var(--intake-yellow) 8%, var(--intake-field)) !important;
        color: var(--intake-text) !important;
        box-shadow: none !important;
        font-size: .72rem !important;
        font-weight: 850 !important;
        letter-spacing: 0 !important;
        line-height: 1 !important;
        text-transform: none !important;
        white-space: nowrap;
      }

      body[data-scp-surface='intake'] [data-intake-question-counter]::before {
        content: 'Q';
        display: inline-flex;
        width: 1.9rem;
        height: 1.9rem;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: var(--intake-yellow);
        color: #090909;
        font-size: .72rem;
        font-weight: 950;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-question-counter] {
        background: #fff9df !important;
        border-color: #e2c84e !important;
        color: #17130a !important;
      }

      @media (max-width: 640px) {
        body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
          padding-inline: .55rem !important;
        }

        body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] > div {
          min-height: 3.7rem !important;
          padding-block: .3rem !important;
        }

        body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-action] {
          min-height: 2.75rem !important;
          padding: .3rem .65rem .3rem .35rem !important;
          font-size: .72rem !important;
        }

        body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-icon] {
          width: 1.95rem;
          height: 1.95rem;
        }

        body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:first-of-type {
          display: grid !important;
          grid-template-columns: minmax(0,1fr) auto;
          gap: .8rem !important;
          align-items: start !important;
        }

        body[data-scp-surface='intake'] [data-intake-question-counter] {
          min-height: 2.45rem;
          padding: .3rem .65rem .3rem .32rem !important;
          font-size: .66rem !important;
        }

        body[data-scp-surface='intake'] [data-intake-question-counter]::before {
          width: 1.7rem;
          height: 1.7rem;
          font-size: .65rem;
        }
      }

      @media (max-width: 420px) {
        body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-label] {
          display: none;
        }

        body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-action] {
          width: 2.85rem;
          min-width: 2.85rem;
          padding: .3rem !important;
          justify-content: center;
        }

        body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] [data-intake-nav-icon] {
          width: 2.1rem;
          height: 2.1rem;
        }

        body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:first-of-type {
          grid-template-columns: 1fr;
        }

        body[data-scp-surface='intake'] [data-intake-question-counter] {
          justify-self: start;
        }
      }
    `}</style>
  );
}
