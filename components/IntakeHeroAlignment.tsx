export const IntakeHeroAlignment = () => (
  <style>{`
    /*
     * Skills Connect Pro intake system
     * Light: pure white, black and brand yellow.
     * Dark: pure black, white and brand yellow.
     */
    body[data-scp-surface='intake'] {
      --intake-yellow: #f5c518;
      --intake-black: #0b0a09;
      --intake-white: #ffffff;
      --intake-dark-line: rgba(255, 255, 255, .14);
      --intake-dark-muted: rgba(255, 255, 255, .7);
      --intake-light-line: rgba(11, 10, 9, .14);
      --intake-light-muted: rgba(11, 10, 9, .68);
      background: var(--intake-black) !important;
      font-family: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif;
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
      color: var(--intake-white) !important;
    }

    body[data-scp-surface='intake'] main > div {
      width: min(calc(100% - 2rem), 42rem) !important;
      max-width: none !important;
      padding: 1rem 0 4.5rem !important;
    }

    body[data-scp-surface='intake'] main .font-black {
      font-weight: 700 !important;
    }

    body[data-scp-surface='intake'] main :is(h1, h2, h3) {
      color: var(--intake-white) !important;
      font-weight: 700 !important;
      letter-spacing: -.035em !important;
      text-shadow: none !important;
    }

    body[data-scp-surface='intake'] main :is(p, small, label, span):not([class*='text-red']):not([class*='text-amber']) {
      color: var(--intake-dark-muted) !important;
    }

    body[data-scp-surface='intake'] main strong {
      color: var(--intake-white) !important;
    }

    /* Flat navigation, with the form—not the chrome—remaining dominant. */
    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-bottom: 1px solid var(--intake-dark-line) !important;
      background: var(--intake-black) !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a, button) {
      border-color: var(--intake-dark-line) !important;
      background: transparent !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a[href*='wa.me'] {
      border-color: var(--intake-black) !important;
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a, button) * {
      color: inherit !important;
    }

    /* Compact progress: labels and a single active yellow marker. */
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
      min-height: 3.15rem;
      padding: .55rem .3rem !important;
      border: 0 !important;
      border-radius: .75rem !important;
      background: transparent !important;
      color: var(--intake-dark-muted) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-complete='true'] {
      color: var(--intake-white) !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] * {
      color: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > [data-intake-progress] > div[data-active='true'] {
      border: 0 !important;
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
      box-shadow: none !important;
    }

    /* One quiet surface grammar for every stage. */
    body[data-scp-surface='intake'] :is(
      [data-intake-stage='describe'],
      [data-intake-stage='clarify'],
      [data-intake-card='brief'],
      [data-intake-card='form'],
      [data-intake-stage='done'],
      main > div > section:not([class~='space-y-5'])
    ) {
      border: 1px solid var(--intake-dark-line) !important;
      border-radius: 1.25rem !important;
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      animation: intake-card-enter .2s ease-out both;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'],
    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='done'],
    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='confirm'] > [data-intake-card] {
      border: 1px solid var(--intake-dark-line) !important;
      border-radius: 1.25rem !important;
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] [class*='IntakeVisualShell_content'] main > div > section[data-intake-stage='clarify'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] [class*='IntakeVisualShell_content'] main > div > section[data-intake-stage='done'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] [class*='IntakeVisualShell_content'] main > div > section[data-intake-stage='confirm'] > [data-intake-card] {
      border-color: var(--intake-dark-line) !important;
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='describe'] {
      overflow: hidden !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='describe']::before,
    body[data-scp-surface='intake'] [data-intake-stage='describe']::after {
      display: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-heading] {
      padding: 1.45rem 1.35rem .8rem !important;
      border: 0 !important;
      background: transparent !important;
      text-align: left !important;
    }

    /* Defeat the retired image/glass layer at each inner section. */
    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage='describe'] > [data-intake-quickstart-heading],
    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage='describe'] > [data-intake-quickstart-body] {
      border-color: var(--intake-dark-line) !important;
      background: transparent !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage] :is(h1, h2, h3, strong),
    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-card] :is(h1, h2, h3, strong) {
      color: var(--intake-white) !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-heading] > div > p:first-child,
    body[data-scp-surface='intake'] main [class*='uppercase'][class*='tracking-widest'] {
      color: var(--intake-yellow) !important;
      letter-spacing: .12em !important;
    }

    body[data-scp-surface='intake'] [data-intake-quickstart-heading] h1 {
      max-width: 16ch;
      margin-top: .75rem !important;
      font-size: clamp(2rem, 8vw, 2.8rem) !important;
      line-height: 1.04 !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > [data-intake-stage='describe'] > [data-intake-quickstart-heading] h1 {
      color: var(--intake-white) !important;
      text-shadow: none !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > [data-intake-stage='describe'] > [data-intake-quickstart-heading] p {
      color: var(--intake-dark-muted) !important;
      text-shadow: none !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > [data-intake-stage='describe'] > [data-intake-quickstart-heading] > div > p:first-child {
      color: var(--intake-yellow) !important;
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

    body[data-scp-surface='intake'] [data-intake-quickstart-body] {
      padding: .9rem 1.35rem 1.35rem !important;
    }

    /* Inputs are flat and legible; focus is the only moment that adds yellow. */
    body[data-scp-surface='intake'] [data-intake-composer] {
      overflow: hidden;
      border: 1px solid var(--intake-dark-line) !important;
      border-radius: .9rem !important;
      background: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] main :is(textarea, input:not([type='file']), select) {
      border: 1px solid var(--intake-dark-line) !important;
      border-radius: .8rem !important;
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
      caret-color: var(--intake-yellow) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] main textarea {
      min-height: 7.75rem !important;
    }

    body[data-scp-surface='intake'] main :is(textarea, input)::placeholder {
      color: rgba(255, 255, 255, .48) !important;
      opacity: 1 !important;
    }

    body[data-scp-surface='intake'] main :is(textarea, input, select):focus {
      border-color: var(--intake-yellow) !important;
      box-shadow: 0 0 0 2px rgba(245, 197, 24, .22) !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer] textarea {
      min-height: 7.75rem !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] {
      min-height: 3rem;
      padding: .4rem .5rem !important;
      border-top: 1px solid var(--intake-dark-line) !important;
      background: transparent !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] button {
      min-height: 2.25rem;
      padding: 0 .7rem;
      border: 0 !important;
      border-radius: .6rem !important;
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] button.is-listening {
      color: var(--intake-yellow) !important;
    }

    body[data-scp-surface='intake'] [data-intake-composer-tools] button * {
      color: inherit !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-composer-tools] button span {
      color: var(--intake-white) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage='describe'] [data-intake-composer] [data-intake-composer-tools] button :is(span, svg) {
      color: var(--intake-white) !important;
    }

    body[data-scp-surface='intake'] [data-intake-photo-preview] {
      overflow: hidden;
      border: 1px solid var(--intake-dark-line) !important;
      border-radius: .9rem !important;
      background: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] [data-intake-photo-preview] > div {
      padding: .5rem .8rem;
      color: var(--intake-white) !important;
    }

    /* Primary actions are black with yellow type in both themes. */
    body[data-scp-surface='intake'] :is(
      [data-intake-continue],
      [data-intake-stage-navigation] button:last-child,
      [data-intake-stage='clarify'] > div:last-of-type > button:not(:first-child),
      [data-intake-stage='done'] a
    ) {
      min-height: 3.25rem;
      border: 1px solid var(--intake-black) !important;
      border-radius: .75rem !important;
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] :is(
      [data-intake-continue],
      [data-intake-stage-navigation] button:last-child,
      [data-intake-stage='clarify'] > div:last-of-type > button:not(:first-child),
      [data-intake-stage='done'] a
    ):hover:not(:disabled) {
      color: var(--intake-white) !important;
      transform: translateY(-1px);
    }

    body[data-scp-surface='intake'] :is(button, a):disabled {
      cursor: not-allowed;
      opacity: .42 !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage-navigation] {
      padding-top: 1rem;
      border-top: 1px solid var(--intake-dark-line) !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage-navigation] button:first-child,
    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > button:first-child,
    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type > button:first-child {
      border: 1px solid var(--intake-dark-line) !important;
      border-radius: .75rem !important;
      background: transparent !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
    }

    /* Questions, choices and summary blocks stay visually secondary. */
    body[data-scp-surface='intake'] [data-intake-question],
    body[data-scp-surface='intake'] [data-intake-summary-card],
    body[data-scp-surface='intake'] [data-intake-summary],
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button,
    body[data-scp-surface='intake'] [data-intake-question] button,
    body[data-scp-surface='intake'] [data-intake-card] > div[class*='border'] {
      border-color: var(--intake-dark-line) !important;
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] {
      border: 1px solid var(--intake-dark-line) !important;
      border-radius: .9rem !important;
      padding: 1.1rem !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] [data-intake-question] {
      border: 1px solid var(--intake-dark-line) !important;
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] [data-intake-question] p[class*='font-black'],
    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] [data-intake-question] button > span:first-child {
      color: var(--intake-white) !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] [class*='IntakeVisualShell_content'] main > div > section[data-intake-stage='clarify'] [data-intake-question] :is(p[class*='font-black'], button > span:first-child) {
      color: var(--intake-white) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] > div:first-of-type > span {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] button,
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button {
      border: 1px solid var(--intake-dark-line) !important;
      border-radius: .7rem !important;
    }

    body[data-scp-surface='intake'] :is(
      [data-intake-question] button,
      [data-intake-choice-grid] > button
    )[data-selected='true'],
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button:has(svg) {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    body[data-scp-surface='intake'] :is(
      [data-intake-question] button,
      [data-intake-choice-grid] > button
    )[data-selected='true'] *,
    body[data-scp-surface='intake'] [data-intake-choice-grid] > button:has(svg) * {
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
      color: var(--intake-dark-muted) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage='describe'] [data-intake-assurance] {
      border: 0 !important;
      background: transparent !important;
      color: var(--intake-dark-muted) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [role='alert'],
    body[data-scp-surface='intake'] [class*='text-red'],
    body[data-scp-surface='intake'] [class*='text-amber'] {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    /* Light theme: a true white canvas with no cream or off-white surfaces. */
    html[data-scp-theme='light'] body[data-scp-surface='intake'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] {
      background: var(--intake-white) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-color: var(--intake-light-line) !important;
      background: var(--intake-white) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a, button) {
      border-color: var(--intake-light-line) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a[href*='wa.me'] {
      border-color: var(--intake-black) !important;
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-progress] > div {
      color: var(--intake-light-muted) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-progress] > div[data-complete='true'] {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > [data-intake-progress] > div[data-active='true'] {
      border: 0 !important;
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] :is(
      [data-intake-stage='describe'],
      [data-intake-stage='clarify'],
      [data-intake-card='brief'],
      [data-intake-card='form'],
      [data-intake-stage='done'],
      main > div > section:not([class~='space-y-5'])
    ) {
      border-color: var(--intake-light-line) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='done'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='confirm'] > [data-intake-card] {
      border: 1px solid var(--intake-light-line) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
      box-shadow: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage='describe'] > [data-intake-quickstart-heading],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage='describe'] > [data-intake-quickstart-body] {
      border-color: var(--intake-light-line) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage] :is(h1, h2, h3, strong),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-card] :is(h1, h2, h3, strong) {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(h1, h2, h3, strong) {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(p, small, label, span):not([class*='text-red']):not([class*='text-amber']) {
      color: var(--intake-light-muted) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-quickstart-heading] > div > p:first-child,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main [class*='uppercase'][class*='tracking-widest'] {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > [data-intake-stage='describe'] > [data-intake-quickstart-heading] h1 {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > [data-intake-stage='describe'] > [data-intake-quickstart-heading] p {
      color: var(--intake-light-muted) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > [data-intake-stage='describe'] > [data-intake-quickstart-heading] > div > p:first-child {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-quickstart-icon],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child > span,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-question] > div:first-of-type > span:first-child {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-composer],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(textarea, input:not([type='file']), select),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-photo-preview],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-question],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-summary-card],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-summary],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-choice-grid] > button,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-question] button,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-card] > div[class*='border'] {
      border-color: var(--intake-light-line) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-composer-tools] {
      border-color: var(--intake-light-line) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] [data-intake-question] {
      border: 1px solid var(--intake-light-line) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
      box-shadow: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] [data-intake-question] button {
      border-color: var(--intake-light-line) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] [data-intake-question] p[class*='font-black'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] [data-intake-question] button > span:first-child {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main > div > section[data-intake-stage='clarify'] > div:first-of-type > span {
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage='describe'] [data-intake-assurance] {
      border: 0 !important;
      background: transparent !important;
      color: var(--intake-light-muted) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-composer] textarea {
      background: transparent !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(textarea, input:not([type='file']), select) {
      color: var(--intake-black) !important;
      caret-color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(textarea, input)::placeholder {
      color: rgba(11, 10, 9, .5) !important;
      opacity: 1 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-composer-tools] button {
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-composer-tools] button span {
      color: var(--intake-white) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_shell'] main [data-intake-stage='describe'] [data-intake-composer] [data-intake-composer-tools] button :is(span, svg) {
      color: var(--intake-white) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage-navigation] {
      border-color: var(--intake-light-line) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage-navigation] button:first-child,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage='clarify'] > button:first-child,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type > button:first-child {
      border-color: var(--intake-light-line) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] :is(
      [data-intake-question] button,
      [data-intake-choice-grid] > button
    )[data-selected='true'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-choice-grid] > button:has(svg) {
      border-color: var(--intake-yellow) !important;
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [role='alert'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='text-red'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='text-amber'] {
      border-color: var(--intake-black) !important;
      background: var(--intake-yellow) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] {
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-color: var(--intake-dark-line) !important;
      background: var(--intake-black) !important;
      color: var(--intake-white) !important;
      box-shadow: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] {
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-color: var(--intake-light-line) !important;
      background: var(--intake-white) !important;
      color: var(--intake-black) !important;
      box-shadow: none !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a, button, span, svg) {
      color: var(--intake-white) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] :is(a, button, span, svg) {
      color: var(--intake-black) !important;
    }

    html[data-scp-theme] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a[href*='wa.me'],
    html[data-scp-theme] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a[href*='wa.me'] :is(span, svg) {
      background: var(--intake-black) !important;
      color: var(--intake-yellow) !important;
    }

    @keyframes intake-card-enter {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 480px) {
      body[data-scp-surface='intake'] main > div {
        width: min(calc(100% - 1.25rem), 42rem) !important;
        padding-top: .7rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-quickstart-heading],
      body[data-scp-surface='intake'] [data-intake-quickstart-body],
      body[data-scp-surface='intake'] [data-intake-stage='clarify'],
      body[data-scp-surface='intake'] [data-intake-card] {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div {
        min-height: 2.9rem;
        padding: .4rem .15rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div span:last-child {
        display: none;
      }

      body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type {
        gap: .5rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-of-type > button:first-child {
        padding-inline: .8rem !important;
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
