export const IntakeHeroAlignment = () => (
  <style>{`
    /*
     * Intake design system
     * Dark: black, dark brown, Skills Connect yellow.
     * Light: yellow, white, black.
     * The restrained palette intentionally removes the former image, glass and
     * green layers so the request journey feels calm, immediate and familiar.
     */
    body[data-scp-surface='intake'] {
      --intake-yellow: #f5c518;
      --intake-black: #0b0a09;
      --intake-brown: #21150f;
      --intake-white: #ffffff;
      background: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] {
      display: none !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] {
      min-height: 100svh;
      overflow: visible !important;
      background: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] main {
      min-height: 100svh;
      background: transparent !important;
      color: var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] main > div {
      width: min(calc(100% - 2rem), 42rem) !important;
      max-width: none !important;
      padding: 1.15rem 0 4.5rem !important;
    }

    /* Navigation stays functional but drops the frosted-glass treatment. */
    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-bottom: 1px solid var(--intake-yellow) !important;
      background: var(--intake-black) !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a,button) {
      border-color: var(--intake-yellow) !important;
      background: transparent !important;
      color: var(--intake-yellow) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a[href*='wa.me'] {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    /* The progress row is intentionally light: simple labels, no dashboard look. */
    body[data-scp-surface='intake'] [data-intake-progress] {
      gap: .35rem !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div {
      min-height: 3.55rem;
      border: 1px solid var(--intake-yellow) !important;
      border-radius: .85rem !important;
      background: transparent !important;
      color: var(--intake-yellow) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    /* One card grammar for every stage: opening, questions, review and submit. */
    body[data-scp-surface='intake'] :is(
      [data-intake-stage='describe'],
      [data-intake-stage='clarify'],
      [data-intake-card='brief'],
      [data-intake-card='form'],
      main > div > section:not([class~='space-y-5'])
    ) {
      border: 1px solid var(--intake-yellow) !important;
      border-radius: 1.35rem !important;
      background: var(--intake-brown) !important;
      color: var(--intake-yellow) !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      animation: intake-card-enter .22s ease-out both;
    }

    body[data-scp-surface='intake'] [data-intake-stage='describe'] {
      overflow: hidden !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='describe']::before,
    body[data-scp-surface='intake'] [data-intake-stage='describe']::after {
      display: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-heading] {
      padding: 1.5rem 1.35rem .9rem !important;
      border-bottom: 1px solid var(--intake-yellow) !important;
      background: transparent !important;
      text-align: left !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-icon],
    body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child > span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: .7rem;
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-heading] h1,
    body[data-scp-surface='intake'] main h1,
    body[data-scp-surface='intake'] main h2,
    body[data-scp-surface='intake'] main h3,
    body[data-scp-surface='intake'] main strong {
      color: var(--intake-yellow) !important;
      text-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-heading] h1 {
      margin-top: .8rem !important;
      max-width: 15ch;
      font-size: clamp(2rem, 9vw, 3rem) !important;
      line-height: 1 !important;
      letter-spacing: -.05em !important;
    }

    body[data-scp-surface='intake'] main :is(p,small,label,span):not([class*='text-red']):not([class*='text-amber']) {
      color: var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-body] {
      padding: 1rem 1.35rem 1.35rem !important;
    }

    /* The composer is the only prominent field on the opening screen. */
    body[data-scp-surface='intake'] [data-intake-composer] {
      overflow: hidden;
      border: 1px solid var(--intake-yellow) !important;
      border-radius: 1rem !important;
      background: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] main :is(textarea,input:not([type='file']),select) {
      border: 1px solid var(--intake-yellow) !important;
      border-radius: .8rem !important;
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
      caret-color: var(--intake-yellow) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] main textarea {
      min-height: 8.5rem !important;
    }

    body[data-scp-surface='intake'] main :is(textarea,input)::placeholder {
      color: var(--intake-yellow) !important;
      opacity: .55 !important;
    }

    body[data-scp-surface='intake'] main :is(textarea,input,select):focus {
      border-color: var(--intake-white) !important;
      box-shadow: 0 0 0 2px var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer] textarea {
      min-height: 8.5rem !important;
      border: 0 !important;
      border-radius: 0 !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] {
      min-height: 3.2rem;
      padding: .45rem .55rem !important;
      border-top: 1px solid var(--intake-yellow) !important;
      background: transparent !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] button {
      min-height: 2.25rem;
      padding: 0 .65rem;
      border: 1px solid var(--intake-yellow) !important;
      border-radius: .55rem !important;
      background: transparent !important;
      color: var(--intake-yellow) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] button.is-listening {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] [data-intake-photo-preview] {
      border: 1px solid var(--intake-yellow) !important;
      border-radius: 1rem !important;
      background: var(--intake-black) !important;
      overflow: hidden;
    }

    body[data-scp-surface='intake'] [data-intake-photo-preview] > div {
      padding: .5rem .8rem;
      color: var(--intake-yellow) !important;
    }

    /* The yellow button is the single, unmistakable next step. */
    body[data-scp-surface='intake'] :is([data-intake-continue], [data-intake-stage-navigation] button:last-child),
    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type > button:not(:first-child) {
      min-height: 3.25rem;
      border: 1px solid var(--intake-yellow) !important;
      border-radius: .8rem !important;
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] :is([data-intake-continue], [data-intake-stage-navigation] button:last-child):hover,
    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type > button:not(:first-child):hover {
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
      transform: translateY(-1px);
    }

    body[data-scp-surface='intake'] [data-intake-stage-navigation] {
      padding-top: 1rem;
      border-top: 1px solid var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage-navigation] button:first-child,
    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > button:first-child {
      border: 1px solid var(--intake-yellow) !important;
      border-radius: .8rem !important;
      background: transparent !important;
      color: var(--intake-yellow) !important;
      box-shadow: none !important;
    }

    /* Questions and selection cards retain the same simple black/yellow hierarchy. */
    body[data-scp-surface='intake'] [data-intake-question],
    body[data-scp-surface='intake'] [data-intake-summary-card],
    body[data-scp-surface='intake'] [data-intake-summary],
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button,
    body[data-scp-surface='intake'] [data-intake-question] button {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] {
      border: 1px solid var(--intake-yellow) !important;
      border-radius: 1rem !important;
      padding: 1.1rem !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] button,
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button {
      border: 1px solid var(--intake-yellow) !important;
      border-radius: .75rem !important;
    }

    body[data-scp-surface='intake'] :is([data-intake-question] button,[data-intake-choice-grid] > button)[data-selected='true'],
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button:has(svg) {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] > div:first-of-type > span:first-child {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-assurance] {
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      color: var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] [role='alert'],
    body[data-scp-surface='intake'] [class*='text-red'],
    body[data-scp-surface='intake'] [class*='text-amber'] {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    /* Light theme: yellow canvas, white cards, black content. */
    html[data-scp-theme='light'] body[data-scp-surface='intake'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] {
      background: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-color: var(--intake-black) !important;
      background: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a,button) {
      border-color: var(--intake-black) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a[href*='wa.me'] {
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-progress] > div {
      border-color: var(--intake-black) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] {
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] * {
      color: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] :is(
      [data-intake-stage='describe'],
      [data-intake-stage='clarify'],
      [data-intake-card='brief'],
      [data-intake-card='form'],
      main > div > section:not([class~='space-y-5'])
    ) {
      border-color: var(--intake-black) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-quickstart-heading],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-composer-tools],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage-navigation] {
      border-color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(h1,h2,h3,strong,p,small,label,span):not([class*='text-red']):not([class*='text-amber']) {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-quickstart-icon],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child > span {
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] :is([data-intake-composer],main :is(textarea,input:not([type='file']),select),[data-intake-photo-preview],[data-intake-question],[data-intake-summary-card],[data-intake-summary],[data-intake-choice-grid] > button,[data-intake-question] button) {
      border-color: var(--intake-black) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-composer] textarea,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(textarea,input:not([type='file']),select) {
      color: var(--intake-black) !important;
      caret-color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(textarea,input)::placeholder {
      color: var(--intake-black) !important;
      opacity: .48 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-composer-tools] button,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage-navigation] button:first-child,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage='clarify'] > button:first-child {
      border-color: var(--intake-black) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] :is([data-intake-continue],[data-intake-stage-navigation] button:last-child),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type > button:not(:first-child),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] :is([data-intake-question] button,[data-intake-choice-grid] > button)[data-selected='true'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-choice-grid] > button:has(svg) {
      border-color: var(--intake-black) !important;
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-question] > div:first-of-type > span:first-child {
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] :is([data-intake-question] button,[data-intake-choice-grid] > button)[data-selected='true'] *,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-choice-grid] > button:has(svg) * {
      color: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [role='alert'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='text-red'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='text-amber'] {
      border-color: var(--intake-black) !important;
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    @keyframes intake-card-enter {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 480px) {
      body[data-scp-surface='intake'] main > div {
        width: min(calc(100% - 1.25rem), 42rem) !important;
        padding-top: .75rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-quickstart-heading],
      body[data-scp-surface='intake'] [data-intake-quickstart-body],
      body[data-scp-surface='intake'] [data-intake-stage='clarify'],
      body[data-scp-surface='intake'] [data-intake-card] {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div {
        min-height: 3.15rem;
        padding: .45rem .2rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div span:last-child {
        display: none;
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
