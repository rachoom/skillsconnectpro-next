/**
 * Final cross-site visual quality layer.
 *
 * The application contains a mixture of legacy Tailwind surfaces and newer
 * CSS-module experiences. Keeping this small compatibility layer in one place
 * makes the theme contract explicit while those older surfaces are gradually
 * migrated to shared tokens.
 */
export const SiteDesignAuditPolish = () => (
  <style>{`
    :root {
      --scp-gold: #f5c518;
      --scp-gold-deep: #765000;
      --scp-forest: #173827;
      --scp-forest-strong: #102a1d;
      --scp-espresso: #2b1a10;
      --scp-ink: #172019;
      --scp-muted: #556158;
      --scp-ivory: #f5f0e3;
      --scp-paper: #fffdf7;
      --scp-line: #9aa99b;
    }

    html {
      -webkit-text-size-adjust: 100%;
      text-rendering: optimizeLegibility;
    }

    body {
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    ::selection {
      background: var(--scp-gold);
      color: #171006;
    }

    button,
    a,
    input,
    textarea,
    select,
    summary {
      touch-action: manipulation;
    }

    /* A visible focus ring that works on both the darkest and palest surfaces. */
    :where(a, button, input, textarea, select, summary):focus-visible {
      outline: 3px solid var(--scp-gold) !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(23, 56, 39, .28) !important;
    }

    html[data-scp-theme='light'] body {
      background: #ede7da;
      color: var(--scp-ink);
    }

    /* Directory: restore the labels and navigation that became pale-on-pale. */
    html[data-scp-theme='light'] body[data-scp-surface='directory'] header a:first-child {
      color: var(--scp-ink) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] main > section > div:first-child > span,
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='resultsHeading'] span,
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='searchPanel'] label > span {
      color: var(--scp-gold-deep) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='searchPanel'] {
      border: 1px solid rgba(23, 56, 39, .28) !important;
      background: rgba(255, 253, 247, .92) !important;
      box-shadow: 0 20px 48px -38px rgba(23, 56, 39, .38) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='searchField'] {
      border: 2px solid #6f8172 !important;
      background: #fff !important;
      color: var(--scp-ink) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='searchField'] input,
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='searchField'] select,
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='loading'] {
      color: #34433a !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='searchField'] input::placeholder {
      color: #68736b !important;
      opacity: 1 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='cardBody'] > strong,
    html[data-scp-theme='light'] body[data-scp-surface='directory'] [class*='reputationRow'] span {
      color: #6b4a00 !important;
    }

    /* Join: use a dark brand rail where the white logo and onboarding copy live. */
    html[data-scp-theme='light'] body[data-scp-surface='join'] header {
      border-color: rgba(245, 197, 24, .24) !important;
      background: linear-gradient(135deg, #12271b, #213d2d) !important;
      box-shadow: 0 20px 46px -34px rgba(16, 42, 29, .65) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='join'] header a {
      color: #fffdf7 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='join'] main > div > section > div:first-child > div:first-child {
      border-color: rgba(118, 80, 0, .36) !important;
      background: rgba(245, 197, 24, .12) !important;
      color: #765000 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='join'] main > div > section > div:first-child > div:last-child {
      border: 1px solid rgba(40, 102, 68, .3) !important;
      background: #dce9dc !important;
      color: #214632 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='join'] main > div > section > div:first-child > div:last-child * {
      color: #214632 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='join'] main > div > section > div:last-child {
      border: 1px solid rgba(245, 197, 24, .34) !important;
      background: linear-gradient(155deg, #1b3a2a, #10271c) !important;
      box-shadow: 0 30px 70px -40px rgba(16, 42, 29, .72) !important;
    }

    /* Estimator: a confident green instrument panel on a calm light canvas. */
    html[data-scp-theme='light'] body[data-scp-surface='estimator'] main > div > div:first-child p {
      color: #5c695f !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='estimator'] main > div > div:first-child h1 {
      color: var(--scp-forest-strong) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='estimator'] div.relative.z-10 {
      border: 1px solid rgba(245, 197, 24, .38) !important;
      background:
        radial-gradient(circle at 100% 0%, rgba(245, 197, 24, .1), transparent 20rem),
        linear-gradient(145deg, #1c3b2b, #10271c) !important;
      color: #fffdf7 !important;
      box-shadow: 0 30px 72px -36px rgba(16, 42, 29, .72) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='estimator'] main > div > div.relative.z-10 h2,
    html[data-scp-theme='light'] body[data-scp-surface='estimator'] main > div > div.relative.z-10 h3 {
      color: #fffdf7 !important;
    }

    /* Light intake: preserve strong contrast without using bright gold as body copy. */
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main h1,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main h2,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main h3 {
      color: #233c2c !important;
      text-shadow: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='background'] img {
      filter: saturate(.92) contrast(1.02) brightness(1) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='overlay'] {
      background:
        linear-gradient(180deg, rgba(239, 232, 217, .12), rgba(228, 219, 201, .22)),
        radial-gradient(circle at 15% 5%, rgba(245, 197, 24, .06), transparent 28rem),
        radial-gradient(circle at 86% 42%, rgba(47, 103, 74, .04), transparent 34rem) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main textarea,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main input,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main select {
      border-color: #765636 !important;
      background: #fffef9 !important;
      color: #201a15 !important;
    }

    /* Content density and touch ergonomics on phones. */
    @media (max-width: 640px) {
      body[data-scp-surface] :where(button, a, input, select) {
        min-height: 48px;
      }

      body[data-scp-surface] :where(input, textarea, select) {
        font-size: 16px !important;
      }

      body[data-scp-surface='home'] [class*='navInner'],
      body[data-scp-surface='directory'] [class*='headerInner'] {
        min-height: 62px;
      }

      body[data-scp-surface='home'] [class*='hero'] {
        min-height: auto;
        padding-top: 3.25rem;
        padding-bottom: 3.25rem;
      }

      body[data-scp-surface='home'] [class*='heroCopy'] h1 {
        font-size: clamp(2.65rem, 13vw, 4rem) !important;
      }

      body[data-scp-surface='home'] [class*='section'],
      body[data-scp-surface='home'] [class*='tradeSection'] {
        padding-top: 3.25rem;
        padding-bottom: 3.25rem;
      }

      body[data-scp-surface='directory'] [class*='intro'] {
        padding-top: 2.25rem;
      }

      body[data-scp-surface='directory'] [class*='intro'] h1 {
        font-size: clamp(2.35rem, 12vw, 3.15rem) !important;
      }

      body[data-scp-surface='directory'] [class*='searchPanel'] {
        padding: .85rem !important;
      }

      body[data-scp-surface='join'] main {
        padding-inline: .75rem !important;
      }

      body[data-scp-surface='join'] header {
        padding-inline: .8rem !important;
      }

      body[data-scp-surface='join'] header img {
        width: 132px !important;
        height: auto !important;
      }

      body[data-scp-surface='join'] main section {
        padding-top: 1.6rem !important;
      }

      body[data-scp-surface='join'] main h1 {
        font-size: clamp(2.35rem, 11vw, 3.25rem) !important;
      }

      body[data-scp-surface='join'] main section > div:last-child > div {
        min-height: auto !important;
        padding: 1rem !important;
      }

      body[data-scp-surface='join'] main section > div:last-child > div > div {
        padding: 1.35rem !important;
        border-radius: 1.6rem !important;
      }

      body[data-scp-surface='estimator'] main {
        padding-top: 5rem !important;
        padding-bottom: 6rem !important;
      }

      body[data-scp-surface='estimator'] main > div {
        padding-inline: .75rem !important;
      }

      body[data-scp-surface='estimator'] div.relative.z-10 {
        padding: 1.2rem !important;
        border-radius: 1.5rem !important;
      }

      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
        padding-inline: .75rem !important;
      }

      body[data-scp-surface='intake'] main > div {
        width: min(100% - 1rem, 60rem) !important;
      }

      body[data-scp-surface='intake'] main > div > section {
        border-radius: 1.45rem !important;
      }

      body[data-scp-surface='intake'] main h1 {
        font-size: clamp(2.2rem, 11vw, 3.2rem) !important;
      }

      body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] {
        gap: .35rem !important;
      }

      body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] > div {
        min-width: 0;
        padding: .65rem .35rem !important;
      }

      body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] > div span,
      body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] > div strong {
        font-size: .62rem !important;
        letter-spacing: .08em !important;
      }

      [data-scp-theme-location='floating'] {
        bottom: max(.65rem, env(safe-area-inset-bottom)) !important;
        left: max(.65rem, env(safe-area-inset-left)) !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }
    }
  `}</style>
);
