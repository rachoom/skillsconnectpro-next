export const IntakeHeroAlignment = () => (
  <style>{`
    body[data-scp-surface='intake'] {
      --intake-yellow: #f5c518;
      --intake-bg: #060606;
      --intake-panel: #12110e;
      --intake-field: #0a0a09;
      --intake-text: #ffffff;
      --intake-muted: #aeaeae;
      --intake-faint: #858585;
      --intake-line: #75601a;
      --intake-line-strong: #a88618;
      --intake-button: #18150b;
      --intake-shadow: 0 26px 68px rgba(0,0,0,.52);
      margin: 0;
      background: var(--intake-bg) !important;
      color: var(--intake-text) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] {
      --intake-bg: #ffffff;
      --intake-panel: #ffffff;
      --intake-field: #ffffff;
      --intake-text: #111111;
      --intake-muted: #5f5f5f;
      --intake-faint: #8a8a8a;
      --intake-line: #cfcfcf;
      --intake-line-strong: #8b8b8b;
      --intake-button: #111111;
      --intake-shadow: 0 22px 54px rgba(17,17,17,.10);
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'],
    body[data-scp-surface='intake'] main {
      min-height: 100svh;
      overflow: visible !important;
      background: var(--intake-bg) !important;
      color: var(--intake-text) !important;
    }

    body[data-scp-surface='intake'] main > div {
      width: min(calc(100% - 4rem), 68rem) !important;
      max-width: none !important;
      padding: .85rem 0 5.5rem !important;
    }

    /* Option 2 command bar */
    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      position: sticky;
      top: 0;
      z-index: 95;
      border: 0 !important;
      background: color-mix(in srgb, var(--intake-bg) 94%, transparent) !important;
      color: var(--intake-text) !important;
      box-shadow: none !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] > div {
      max-width: 68rem !important;
      min-height: 4.8rem !important;
      padding-block: .75rem;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a,button) {
      min-height: 2.9rem;
      border: 1px solid var(--intake-line) !important;
      border-radius: .75rem !important;
      background: var(--intake-panel) !important;
      color: var(--intake-text) !important;
      box-shadow: 0 8px 24px rgba(0,0,0,.14) !important;
      font-size: .8rem !important;
      letter-spacing: 0 !important;
      text-transform: none !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a[href*='wa.me'] {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-yellow) !important;
      color: #090909 !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a,button):focus-visible,
    body[data-scp-surface='intake'] main :is(a,button,input,select,textarea):focus-visible {
      outline: 3px solid var(--intake-yellow) !important;
      outline-offset: 3px !important;
    }

    /* Bordered three-step rail with a yellow active underline. */
    body[data-scp-surface='intake'] [data-intake-progress] {
      position: relative;
      gap: 0 !important;
      min-height: 4.5rem;
      margin-bottom: 1.35rem !important;
      overflow: hidden;
      border: 1px solid var(--intake-line) !important;
      border-radius: .9rem !important;
      background: var(--intake-panel) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div {
      position: relative;
      display: flex;
      min-width: 0;
      align-items: center;
      justify-content: center;
      gap: .7rem;
      padding: .8rem .55rem !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: var(--intake-muted) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div + div::before {
      content: '';
      position: absolute;
      top: 1.25rem;
      bottom: 1.25rem;
      left: 0;
      width: 1px;
      background: var(--intake-line);
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true']::after {
      content: '';
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: 2px;
      background: var(--intake-yellow);
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div > div:first-child {
      margin: 0 !important;
      color: inherit !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div span:first-child {
      width: 2.25rem;
      height: 2.25rem;
      border-color: var(--intake-line-strong) !important;
      font-size: .9rem;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'],
    body[data-scp-surface='intake'] [data-intake-progress] > div[data-complete='true'] {
      color: var(--intake-text) !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] span:first-child,
    body[data-scp-surface='intake'] [data-intake-progress] > div[data-complete='true'] span:first-child {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-yellow) !important;
      color: #090909 !important;
      box-shadow: 0 0 22px rgba(245,197,24,.20);
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div > div:first-child > span:last-child {
      color: var(--intake-faint) !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] > div:first-child > span:last-child {
      color: var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div > div:last-child {
      margin: 0 !important;
      color: inherit !important;
      font-size: .9rem !important;
    }

    /* Shared premium panel */
    body[data-scp-surface='intake'] :is(
      [data-intake-stage='describe'],
      [data-intake-stage='clarify'],
      [data-intake-card='brief'],
      [data-intake-card='form'],
      [data-intake-stage='done']
    ) {
      position: relative;
      border: 1px solid var(--intake-line) !important;
      border-radius: 1.7rem !important;
      background: var(--intake-panel) !important;
      color: var(--intake-text) !important;
      box-shadow: var(--intake-shadow) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      animation: intake-panel-enter .28s ease-out both;
    }

    body[data-scp-surface='intake'] [data-intake-stage='describe'] {
      overflow: hidden !important;
      padding: 1.65rem 2.15rem 1.35rem !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='describe']::before,
    body[data-scp-surface='intake'] [data-intake-stage='describe']::after {
      display: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-heading] {
      display: grid;
      grid-template-columns: 3.55rem minmax(0, 1fr) minmax(17rem, 35%);
      align-items: center;
      gap: 1.25rem;
      min-height: 12.5rem;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      color: var(--intake-text) !important;
      text-align: left !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-icon],
    body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child > span {
      display: inline-flex;
      width: 3.55rem;
      height: 3.55rem;
      align-items: center;
      justify-content: center;
      align-self: start;
      border-radius: .85rem;
      background: var(--intake-yellow) !important;
      color: #090909 !important;
      box-shadow: 0 8px 24px rgba(245,197,24,.16);
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-copy] {
      align-self: center;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-copy] > p:first-child,
    body[data-scp-surface='intake'] [data-intake-card='brief'] > p:first-of-type,
    body[data-scp-surface='intake'] [data-intake-stage='done'] > p:first-of-type {
      color: var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] main :is(h1,h2,h3,strong) {
      color: var(--intake-text) !important;
      text-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-heading] h1 {
      max-width: 11ch;
      margin-top: .65rem !important;
      font-size: clamp(2.65rem, 5vw, 4rem) !important;
      font-weight: 900 !important;
      line-height: .98 !important;
      letter-spacing: -.055em !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-copy] > p:last-child {
      max-width: 32rem;
      color: var(--intake-muted) !important;
      font-size: 1rem;
      font-weight: 500 !important;
    }

    body[data-scp-surface='intake'] [data-intake-illustration] {
      position: relative;
      width: 100%;
      min-height: 12.5rem;
      align-self: stretch;
      background: url('/intake-request-illustration.png') center / min(26rem, 142%) auto no-repeat;
      filter: drop-shadow(0 18px 24px rgba(0,0,0,.30));
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-illustration] {
      background-image: url('/intake-request-illustration-light.png');
      filter: drop-shadow(0 18px 22px rgba(17,17,17,.10));
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-body] {
      padding: 0 !important;
    }

    /* Composer from Option 2 */
    body[data-scp-surface='intake'] [data-intake-composer] {
      overflow: hidden;
      border: 1px solid var(--intake-line-strong) !important;
      border-radius: 1rem !important;
      background: var(--intake-field) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] main :is(textarea,input:not([type='file']),select) {
      min-height: 3.25rem;
      border: 1px solid var(--intake-line-strong) !important;
      border-radius: .75rem !important;
      background: var(--intake-field) !important;
      color: var(--intake-text) !important;
      caret-color: var(--intake-yellow) !important;
      box-shadow: none !important;
      font-size: 1rem !important;
    }

    body[data-scp-surface='intake'] main :is(textarea,input)::placeholder {
      color: var(--intake-faint) !important;
      opacity: 1 !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer] textarea {
      min-height: 6.5rem !important;
      border: 0 !important;
      border-radius: 0 !important;
      padding: 1.15rem 1.3rem .5rem !important;
      background: transparent !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] {
      display: flex;
      min-height: 3.7rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: .55rem 1rem .75rem !important;
      border: 0 !important;
      background: transparent !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] button {
      display: inline-flex;
      min-height: 2.65rem;
      align-items: center;
      gap: .45rem;
      padding: 0 .85rem;
      border: 1px solid var(--intake-line) !important;
      border-radius: .65rem !important;
      background: var(--intake-button) !important;
      color: var(--intake-text) !important;
      box-shadow: none !important;
      font-size: .8rem;
      font-weight: 700;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] button.is-listening {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-yellow) !important;
      color: #090909 !important;
    }

    body[data-scp-surface='intake'] [data-intake-character-count] {
      color: var(--intake-muted) !important;
      font-size: .78rem;
    }

    body[data-scp-surface='intake'] [data-intake-photo-preview] {
      overflow: hidden;
      border: 1px solid var(--intake-line-strong) !important;
      border-radius: 1rem !important;
      background: var(--intake-field) !important;
    }

    body[data-scp-surface='intake'] [data-intake-photo-preview] > div {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .65rem 1rem;
      color: var(--intake-muted) !important;
      font-size: .8rem;
    }

    body[data-scp-surface='intake'] [data-intake-continue],
    body[data-scp-surface='intake'] [data-intake-stage-navigation] button:last-child,
    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type > button:not(:first-child),
    body[data-scp-surface='intake'] [data-intake-stage='done'] > a {
      min-height: 3.25rem;
      border: 1px solid var(--intake-yellow) !important;
      border-radius: .75rem !important;
      background: var(--intake-yellow) !important;
      color: #090909 !important;
      box-shadow: none !important;
      font-weight: 900 !important;
      transition: transform .18s ease, filter .18s ease;
    }

    body[data-scp-surface='intake'] [data-intake-continue]:hover,
    body[data-scp-surface='intake'] [data-intake-stage-navigation] button:last-child:hover,
    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type > button:not(:first-child):hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
    }

    body[data-scp-surface='intake'] :is(button,a):disabled {
      cursor: not-allowed;
      filter: grayscale(.35);
      opacity: .48 !important;
    }

    body[data-scp-surface='intake'] [data-intake-assurance] {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .45rem;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      color: var(--intake-muted) !important;
      font-size: .72rem;
      text-align: center;
    }

    body[data-scp-surface='intake'] [data-intake-assurance] svg {
      color: var(--intake-yellow) !important;
    }

    /* Clarify and submit inherit the same contrast system. */
    body[data-scp-surface='intake'] [data-intake-stage='clarify'],
    body[data-scp-surface='intake'] [data-intake-card] {
      padding: 1.65rem 2rem !important;
    }

    body[data-scp-surface='intake'] main :is(p,small,label,span):not([class*='text-red']):not([class*='text-amber']) {
      color: var(--intake-muted);
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > button:first-child,
    body[data-scp-surface='intake'] [data-intake-card='brief'] > button:first-child,
    body[data-scp-surface='intake'] [data-intake-stage-navigation] button:first-child {
      min-height: 2.8rem;
      border: 1px solid var(--intake-line) !important;
      border-radius: .7rem !important;
      background: var(--intake-button) !important;
      color: var(--intake-text) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:first-of-type > span,
    body[data-scp-surface='intake'] [data-intake-card='brief'] > span {
      border: 1px solid var(--intake-line) !important;
      background: var(--intake-button) !important;
      color: var(--intake-muted) !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] [aria-label$='through clarification'] > div:last-child {
      background: var(--intake-line) !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] [aria-label$='through clarification'] > div:last-child > span {
      background: var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] [data-intake-question],
    body[data-scp-surface='intake'] [data-intake-summary-card],
    body[data-scp-surface='intake'] [data-intake-card] .bg-white,
    body[data-scp-surface='intake'] [data-intake-card] [class*='bg-[#e8eee2]'] {
      border-color: var(--intake-line) !important;
      background: var(--intake-field) !important;
      color: var(--intake-text) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] {
      border-width: 1px !important;
      border-radius: 1rem !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] > div:first-of-type > span:first-child {
      background: var(--intake-yellow) !important;
      color: #090909 !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] button,
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button {
      border: 1px solid var(--intake-line) !important;
      background: var(--intake-field) !important;
      color: var(--intake-text) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] button[data-selected='true'],
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button:has(svg) {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-yellow) !important;
      color: #090909 !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] button[data-selected='true'] *,
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button:has(svg) * {
      color: #090909 !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage-navigation] {
      padding-top: 1.1rem;
      border-top: 1px solid var(--intake-line) !important;
    }

    body[data-scp-surface='intake'] [data-intake-summary-card] > span,
    body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child > span {
      color: #090909 !important;
    }

    body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child p,
    body[data-scp-surface='intake'] [data-intake-card='brief'] > p:not(:first-of-type),
    body[data-scp-surface='intake'] [data-intake-card] small {
      color: var(--intake-muted) !important;
    }

    body[data-scp-surface='intake'] [role='alert'],
    body[data-scp-surface='intake'] [class*='text-red'],
    body[data-scp-surface='intake'] [class*='text-amber'] {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-yellow) !important;
      color: #090909 !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='done'] {
      text-align: center;
    }

    body[data-scp-surface='intake'] [data-intake-stage='done'] > span {
      background: var(--intake-yellow) !important;
      color: #090909 !important;
    }

    body[data-scp-surface='intake'] main input[type='checkbox'] {
      accent-color: var(--intake-yellow) !important;
    }

    /* Theme switch matches the selected reference. */
    body[data-scp-surface='intake'] button[data-scp-theme-location='floating'] {
      border: 1px solid var(--intake-line) !important;
      border-radius: 999px !important;
      background: var(--intake-panel) !important;
      color: var(--intake-text) !important;
      box-shadow: 0 10px 30px rgba(0,0,0,.24) !important;
      backdrop-filter: blur(12px) !important;
    }

    body[data-scp-surface='intake'] button[data-scp-theme-location='floating'] svg {
      color: var(--intake-yellow) !important;
    }

    @keyframes intake-panel-enter {
      from { opacity: 0; transform: translateY(7px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 760px) {
      body[data-scp-surface='intake'] main > div {
        width: min(calc(100% - 1.25rem), 68rem) !important;
        padding-top: .45rem !important;
      }

      body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] > div {
        min-height: 4rem !important;
        padding-block: .4rem;
      }

      body[data-scp-surface='intake'] [data-intake-progress] {
        min-height: 4rem;
        margin-bottom: .75rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div {
        flex-direction: column;
        gap: .2rem;
        padding: .55rem .15rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div span:first-child {
        width: 1.85rem;
        height: 1.85rem;
        font-size: .76rem;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div > div:first-child > span:last-child {
        display: none;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div > div:last-child {
        font-size: .72rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-stage='describe'] {
        padding: 1.15rem !important;
        border-radius: 1.3rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-quickstart-heading] {
        grid-template-columns: 2.8rem minmax(0, 1fr) 8.5rem;
        gap: .75rem;
        min-height: 9.5rem;
      }

      body[data-scp-surface='intake'] [data-intake-quickstart-icon] {
        width: 2.8rem;
        height: 2.8rem;
      }

      body[data-scp-surface='intake'] [data-intake-quickstart-heading] h1 {
        margin-top: .35rem !important;
        font-size: clamp(2rem, 9.6vw, 3rem) !important;
      }

      body[data-scp-surface='intake'] [data-intake-quickstart-copy] > p:first-child {
        font-size: .62rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-quickstart-copy] > p:last-child {
        font-size: .83rem !important;
        line-height: 1.35rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-illustration] {
        min-height: 8.2rem;
      }

      body[data-scp-surface='intake'] [data-intake-illustration] {
        background-size: 12.5rem auto;
      }

      body[data-scp-surface='intake'] [data-intake-stage='clarify'],
      body[data-scp-surface='intake'] [data-intake-card] {
        padding: 1.2rem !important;
        border-radius: 1.3rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-composer] textarea {
        min-height: 7.2rem !important;
      }
    }

    @media (max-width: 480px) {
      body[data-scp-surface='intake'] [data-intake-quickstart-heading] {
        grid-template-columns: 2.65rem minmax(0, 1fr);
        min-height: 0;
        padding-bottom: 1rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-illustration] {
        display: none;
      }

      body[data-scp-surface='intake'] [data-intake-quickstart-heading] h1 {
        max-width: 12ch;
        font-size: clamp(1.9rem, 9vw, 2.45rem) !important;
      }

      body[data-scp-surface='intake'] [data-intake-composer-tools] {
        gap: .4rem;
        padding-inline: .65rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-composer-tools] button {
        padding-inline: .65rem;
      }

      body[data-scp-surface='intake'] [data-intake-assurance] {
        align-items: flex-start;
        font-size: .68rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      body[data-scp-surface='intake'] * {
        animation-duration: .01ms !important;
        transition-duration: .01ms !important;
      }
    }
  `}</style>
);
