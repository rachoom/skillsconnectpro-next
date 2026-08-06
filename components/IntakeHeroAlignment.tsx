export const IntakeHeroAlignment = () => (
  <style>{`
    /*
     * The intake borrows the launch hero's visual language: bold editorial type,
     * warm gold details and one calm glass surface over visible trade imagery.
     */
    body[data-scp-surface='intake'] {
      --intake-brand-gold: #f5c518;
      --intake-brand-gold-rgb: 245, 197, 24;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
      object-position: 54% center !important;
      filter: none !important;
      transform: scale(1.015) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_overlay'] {
      background: transparent !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_texture'] {
      opacity: .018 !important;
    }

    body[data-scp-surface='intake'] main > div {
      width: min(calc(100% - 4.5rem), 46rem) !important;
      max-width: none !important;
      padding: 1.7rem 0 5rem !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-color: rgba(var(--intake-brand-gold-rgb),.2) !important;
      background: rgba(7,13,10,.72) !important;
      color: #f5f0e3 !important;
      box-shadow: 0 18px 46px -34px rgba(0,0,0,.96) !important;
      backdrop-filter: blur(22px) saturate(112%) !important;
      -webkit-backdrop-filter: blur(22px) saturate(112%) !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] button,
    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a:not([href*='wa.me']) {
      border-color: rgba(var(--intake-brand-gold-rgb),.26) !important;
      background: rgba(246,239,226,.055) !important;
      color: rgba(245,240,227,.84) !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a[href*='wa.me'] {
      border: 1px solid rgba(255,225,88,.55) !important;
      background: linear-gradient(135deg, #ffe05a, #f5c518) !important;
      color: #171006 !important;
      box-shadow: 0 12px 28px -18px rgba(245,197,24,.72) !important;
    }

    /* Quiet, segmented progress markers keep the form itself visually dominant. */
    body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] {
      gap: .5rem !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      padding: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] > div {
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.18) !important;
      background: rgba(7,13,10,.62) !important;
      color: rgba(245,240,227,.46) !important;
      box-shadow: 0 12px 28px -24px rgba(0,0,0,.9) !important;
      backdrop-filter: blur(15px) !important;
      -webkit-backdrop-filter: blur(15px) !important;
    }

    body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] > div[class*='bg-[#f5c518]'] {
      border-color: rgba(245,197,24,.52) !important;
      background: rgba(245,197,24,.14) !important;
      color: #f6d66b !important;
      box-shadow:
        inset 0 -2px 0 rgba(245,197,24,.42),
        0 15px 32px -25px rgba(245,197,24,.58) !important;
    }

    /* Shared glass panel used by every stage of the intake. */
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='space-y-5']),
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div {
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.3) !important;
      background:
        radial-gradient(circle at 92% 0%, rgba(245,197,24,.055), transparent 18rem),
        linear-gradient(148deg, rgba(13,20,17,.83), rgba(15,14,13,.79)) !important;
      color: #f5f0e3 !important;
      box-shadow:
        0 34px 78px -38px rgba(0,0,0,.96),
        inset 0 1px 0 rgba(255,255,255,.065) !important;
      backdrop-filter: blur(20px) saturate(112%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(112%) !important;
      animation: intake-system-breathe 7s ease-in-out infinite;
    }

    body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] {
      border: 0 !important;
      background: transparent !important;
      padding: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div,
    body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']):not([class~='space-y-5']) {
      border-radius: 2rem !important;
    }

    body[data-scp-surface='intake'] main h1,
    body[data-scp-surface='intake'] main h2,
    body[data-scp-surface='intake'] main h3,
    body[data-scp-surface='intake'] main strong {
      color: #f7f1e6 !important;
    }

    body[data-scp-surface='intake'] main p:not([class*='text-red']):not([class*='text-amber']),
    body[data-scp-surface='intake'] main small {
      color: rgba(255,252,245,.84) !important;
    }

    body[data-scp-surface='intake'] main section [class*='uppercase'][class*='tracking-widest']:not([class*='text-red']):not([class*='text-amber']) {
      color: var(--intake-brand-gold) !important;
    }

    /* Opening screen: one continuous panel, matching the supplied reference. */
    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] {
      isolation: isolate;
      overflow: hidden !important;
      border-radius: 2.2rem !important;
    }

    /* A slow current traces the edge while a tiny status lamp suggests readiness. */
    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden']::before {
      content: '' !important;
      display: block !important;
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;
      padding: 1px;
      border-radius: inherit;
      background: linear-gradient(
        108deg,
        transparent 10%,
        rgba(var(--intake-brand-gold-rgb),.08) 35%,
        rgba(255,225,88,.72) 49%,
        rgba(255,250,224,.28) 52%,
        rgba(var(--intake-brand-gold-rgb),.08) 66%,
        transparent 91%
      );
      background-position: 180% 0;
      background-size: 240% 100%;
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
      animation: intake-edge-current 9s linear infinite;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden']::after {
      content: '' !important;
      display: block !important;
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 6;
      width: .32rem;
      height: .32rem;
      pointer-events: none;
      border-radius: 999px;
      background: var(--intake-brand-gold);
      box-shadow: 0 0 12px rgba(var(--intake-brand-gold-rgb),.72);
      animation: intake-status-pulse 3.2s ease-in-out infinite;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) {
      border: 0 !important;
      background: transparent !important;
      color: #f5f0e3 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child {
      padding: 2.4rem 2rem .95rem !important;
      text-align: center;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child::after {
      content: none !important;
      display: none !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child > svg {
      display: block;
      box-sizing: content-box;
      width: 1.45rem;
      height: 1.45rem;
      margin: 0 auto;
      padding: .72rem;
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.28);
      border-radius: .8rem;
      background: rgba(var(--intake-brand-gold-rgb),.11);
      color: var(--intake-brand-gold) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 16px 34px -25px rgba(0,0,0,.95);
      filter: none !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child h1 {
      max-width: 42rem;
      margin: 1.35rem auto 0 !important;
      color: var(--intake-brand-gold) !important;
      font-size: clamp(2.65rem, 8vw, 4.55rem) !important;
      line-height: .98 !important;
      letter-spacing: -.052em !important;
      text-shadow: 0 5px 26px rgba(0,0,0,.42) !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child p {
      max-width: 38rem;
      margin: 1rem auto 0 !important;
      color: rgba(255,252,245,.9) !important;
      font-size: clamp(.92rem, 2vw, 1.08rem);
      font-weight: 500 !important;
      line-height: 1.65 !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) {
      padding: 1.35rem 2rem 2.2rem !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) label > span {
      color: #f2eee5 !important;
      font-size: .8rem !important;
      letter-spacing: .04em !important;
    }

    body[data-scp-surface='intake'] main textarea,
    body[data-scp-surface='intake'] main input:not([type='file']):not([type='checkbox']),
    body[data-scp-surface='intake'] main select {
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.34) !important;
      background: rgba(6,12,9,.58) !important;
      color: #f6f0e5 !important;
      caret-color: #f5c518 !important;
      box-shadow: inset 0 1px 2px rgba(0,0,0,.28), 0 16px 34px -30px rgba(0,0,0,.9) !important;
    }

    body[data-scp-surface='intake'] main textarea {
      min-height: 12rem;
      border-radius: 1rem !important;
    }

    body[data-scp-surface='intake'] main textarea::placeholder,
    body[data-scp-surface='intake'] main input::placeholder {
      color: rgba(255,252,245,.56) !important;
      opacity: 1 !important;
    }

    body[data-scp-surface='intake'] main textarea:focus,
    body[data-scp-surface='intake'] main input:focus,
    body[data-scp-surface='intake'] main select:focus {
      border-color: rgba(245,197,24,.78) !important;
      box-shadow: 0 0 0 3px rgba(245,197,24,.1), 0 18px 40px -30px rgba(0,0,0,.96) !important;
    }

    body[data-scp-surface='intake'] main :is(input,textarea,select)[class*='border-red'] {
      border-color: rgba(248,113,113,.9) !important;
      background: rgba(69,10,10,.34) !important;
    }

    /* Voice and photograph controls retain the reference's outlined two-card layout. */
    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: .85rem !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button {
      min-width: 0;
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.44) !important;
      background: rgba(246,239,226,.06) !important;
      color: #f5f0e3 !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.045), 0 16px 36px -28px rgba(0,0,0,.9) !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button > span:first-child {
      flex: 0 0 auto;
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.24) !important;
      background: rgba(var(--intake-brand-gold-rgb),.12) !important;
      color: var(--intake-brand-gold) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.045) !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button[class*='border-red'] {
      border-color: rgba(248,113,113,.72) !important;
      background: rgba(127,29,29,.22) !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button[class*='border-red'] > span:first-child {
      border-color: rgba(248,113,113,.34) !important;
      background: rgba(239,68,68,.8) !important;
      color: white !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > p {
      border: 0 !important;
      background: transparent !important;
      padding: .35rem 1rem .2rem !important;
      color: rgba(255,252,245,.8) !important;
    }

    /* The dark outlined action mirrors the reference while retaining the site's gold identity. */
    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > button:last-child,
    body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']) > button[class~='w-full'],
    body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div button[class~='w-full'] {
      border: 1px solid rgba(255,225,88,.78) !important;
      background: linear-gradient(135deg, rgba(245,197,24,.12), rgba(6,12,9,.82) 38%, rgba(18,20,17,.9)) !important;
      color: var(--intake-brand-gold) !important;
      box-shadow:
        0 0 0 1px rgba(245,197,24,.08),
        0 0 25px rgba(245,197,24,.14),
        inset 0 1px 0 rgba(255,255,255,.065) !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > button:last-child:hover,
    body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']) > button[class~='w-full']:hover,
    body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div button[class~='w-full']:hover {
      border-color: #ffe05a !important;
      background: linear-gradient(135deg, rgba(245,197,24,.2), rgba(8,14,10,.9) 42%, rgba(24,23,18,.94)) !important;
      box-shadow: 0 0 30px rgba(245,197,24,.22), inset 0 1px 0 rgba(255,255,255,.08) !important;
      transform: translateY(-1px);
    }

    /* Inner question, summary and consent surfaces use lower-opacity companion cards. */
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section [class*='bg-white'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#faf9f4]'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#e8eee2]'] {
      border-color: rgba(var(--intake-brand-gold-rgb),.25) !important;
      background: rgba(246,239,226,.055) !important;
      color: #f5f0e3 !important;
      background-image: none !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.035) !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section button[class*='bg-[#dfe8d6]'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#dfe8d6]'] {
      border-color: rgba(245,197,24,.5) !important;
      background: rgba(245,197,24,.13) !important;
      color: #f2d46c !important;
    }

    /* Light theme keeps the same composition in warm, translucent ivory. */
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
      filter: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_overlay'] {
      background: transparent !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section:not([class~='space-y-5']),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div {
      border-color: rgba(92,56,25,.44) !important;
      background:
        radial-gradient(circle at 92% 0%, rgba(245,197,24,.09), transparent 18rem),
        linear-gradient(148deg, rgba(255,252,243,.9), rgba(241,231,213,.86)) !important;
      color: #271b13 !important;
      box-shadow: 0 30px 70px -42px rgba(72,45,22,.58), inset 0 1px 0 rgba(255,255,255,.86) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) {
      border: 0 !important;
      background: transparent !important;
      color: #271b13 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main :is(h1,h2,h3,strong) {
      color: #271b13 !important;
      text-shadow: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main p:not([class*='text-red']):not([class*='text-amber']),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main small {
      color: #62584f !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child h1 {
      color: #765019 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child > svg {
      border-color: rgba(118,80,25,.35);
      background: rgba(118,80,25,.1);
      color: #765019 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) label > span {
      color: #30251c !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main textarea,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main input:not([type='file']):not([type='checkbox']),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main select {
      border-color: rgba(104,65,27,.52) !important;
      background: rgba(255,254,249,.84) !important;
      color: #271b13 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main textarea::placeholder,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main input::placeholder {
      color: #82786d !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section [class*='bg-white'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#faf9f4]'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section [class*='bg-[#e8eee2]'] {
      border-color: rgba(104,65,27,.4) !important;
      background: rgba(255,253,247,.68) !important;
      color: #271b13 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > p {
      color: #62584f !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-color: rgba(92,56,25,.3) !important;
      background: rgba(255,251,241,.76) !important;
      color: #271b13 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] button,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a:not([href*='wa.me']) {
      border-color: rgba(92,56,25,.28) !important;
      background: rgba(255,255,255,.48) !important;
      color: #271b13 !important;
    }

    /*
     * Final form system: a focused guided console. One visual grammar now
     * governs description, clarification, review, contact and completion.
     */
    body[data-scp-surface='intake'] main {
      background: transparent !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] {
      position: relative;
      gap: .4rem !important;
      padding: .4rem !important;
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.2) !important;
      border-radius: 1rem !important;
      background: rgba(5,11,8,.68) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.045), 0 18px 48px -36px #000 !important;
      backdrop-filter: blur(18px) saturate(115%) !important;
      -webkit-backdrop-filter: blur(18px) saturate(115%) !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div {
      min-height: 3.55rem;
      padding: .62rem .45rem !important;
      border: 1px solid transparent !important;
      border-radius: .75rem !important;
      background: transparent !important;
      color: rgba(255,252,245,.42) !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-complete='true'] {
      color: rgba(var(--intake-brand-gold-rgb),.72) !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div[data-active='true'] {
      border-color: rgba(var(--intake-brand-gold-rgb),.42) !important;
      background: linear-gradient(145deg, rgba(var(--intake-brand-gold-rgb),.18), rgba(var(--intake-brand-gold-rgb),.07)) !important;
      color: var(--intake-brand-gold) !important;
      box-shadow: inset 0 -2px 0 rgba(var(--intake-brand-gold-rgb),.45), 0 12px 28px -22px rgba(var(--intake-brand-gold-rgb),.7) !important;
    }

    body[data-scp-surface='intake'] [data-intake-progress] > div span[class*='rounded-full'] {
      border-color: currentColor !important;
      background: rgba(255,255,255,.035) !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage] h1 {
      color: var(--intake-brand-gold) !important;
      text-wrap: balance;
    }

    html[data-scp-theme] body[data-scp-surface='intake'] main > div > section[data-intake-stage] h1 {
      color: var(--intake-brand-gold) !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] {
      overflow: hidden;
      padding: clamp(1.25rem, 4vw, 2rem) !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:nth-of-type(1) > span {
      flex: 0 0 auto;
      white-space: nowrap;
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > button:first-child,
    body[data-scp-surface='intake'] [data-intake-card='brief'] > button:first-child {
      min-height: 2.75rem;
      padding: 0 .85rem;
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.22);
      border-radius: .75rem;
      background: rgba(255,255,255,.035);
      color: rgba(255,252,245,.72) !important;
      transition: border-color .2s ease, background .2s ease, color .2s ease;
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] > button:first-child:hover,
    body[data-scp-surface='intake'] [data-intake-card='brief'] > button:first-child:hover {
      border-color: rgba(var(--intake-brand-gold-rgb),.48);
      background: rgba(var(--intake-brand-gold-rgb),.08);
      color: var(--intake-brand-gold) !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] {
      position: relative;
      min-inline-size: 0;
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.26) !important;
      border-radius: 1.25rem !important;
      background:
        linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025)),
        rgba(4,10,7,.46) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.055), 0 22px 50px -38px #000 !important;
      animation: intake-question-arrive .32s ease-out both;
    }

    body[data-scp-surface='intake'] [data-intake-question] > div:first-of-type > span:first-child {
      background: var(--intake-brand-gold) !important;
      color: #171006 !important;
      box-shadow: 0 0 0 4px rgba(var(--intake-brand-gold-rgb),.08), 0 8px 22px -12px rgba(var(--intake-brand-gold-rgb),.9);
    }

    body[data-scp-surface='intake'] [data-intake-question] button {
      border: 1px solid rgba(255,255,255,.14) !important;
      background: rgba(255,255,255,.045) !important;
      color: rgba(255,252,245,.88) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.035) !important;
      transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] button:hover {
      transform: translateY(-1px);
      border-color: rgba(var(--intake-brand-gold-rgb),.46) !important;
      background: rgba(var(--intake-brand-gold-rgb),.07) !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] button[data-selected='true'] {
      border-color: rgba(var(--intake-brand-gold-rgb),.82) !important;
      background: linear-gradient(135deg, rgba(var(--intake-brand-gold-rgb),.2), rgba(var(--intake-brand-gold-rgb),.09)) !important;
      color: #fff9e7 !important;
      box-shadow: 0 0 0 2px rgba(var(--intake-brand-gold-rgb),.08), 0 14px 34px -24px rgba(var(--intake-brand-gold-rgb),.75), inset 0 1px 0 rgba(255,255,255,.075) !important;
    }

    body[data-scp-surface='intake'] [data-intake-question] button > span:last-child {
      border-color: rgba(255,255,255,.28) !important;
      color: transparent;
    }

    body[data-scp-surface='intake'] [data-intake-question] button[data-selected='true'] > span:last-child {
      border-color: var(--intake-brand-gold) !important;
      background: var(--intake-brand-gold) !important;
      color: #171006 !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main [data-intake-question] button[data-selected='true'] {
      border-color: rgba(var(--intake-brand-gold-rgb),.92) !important;
      background: linear-gradient(135deg, rgba(var(--intake-brand-gold-rgb),.3), rgba(var(--intake-brand-gold-rgb),.13)) !important;
      color: #fffdf5 !important;
      box-shadow: 0 0 0 2px rgba(var(--intake-brand-gold-rgb),.1), 0 16px 36px -24px rgba(var(--intake-brand-gold-rgb),.9) !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main [data-intake-question] button[data-selected='true'] > span:last-child {
      border-color: var(--intake-brand-gold) !important;
      background: var(--intake-brand-gold) !important;
      color: #171006 !important;
      box-shadow: 0 0 14px rgba(var(--intake-brand-gold-rgb),.28);
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] button[class*='bg-[#f5c518]'],
    body[data-scp-surface='intake'] [data-intake-card='form'] button[class*='bg-[#f5c518]'],
    body[data-scp-surface='intake'] [data-intake-stage='done'] a[class*='bg-[#f5c518]'] {
      border: 1px solid #ffe36d !important;
      background: linear-gradient(135deg, #ffe05a, var(--intake-brand-gold) 58%, #d9a900) !important;
      color: #171006 !important;
      box-shadow: 0 0 0 1px rgba(var(--intake-brand-gold-rgb),.1), 0 0 28px rgba(var(--intake-brand-gold-rgb),.18), 0 10px 0 -6px #9b7600 !important;
      transition: transform .18s ease, filter .18s ease, box-shadow .18s ease !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='clarify'] button[class*='bg-[#f5c518]']:hover,
    body[data-scp-surface='intake'] [data-intake-card='form'] button[class*='bg-[#f5c518]']:hover,
    body[data-scp-surface='intake'] [data-intake-stage='done'] a[class*='bg-[#f5c518]']:hover {
      filter: brightness(1.05);
      transform: translateY(-1px);
      box-shadow: 0 0 34px rgba(var(--intake-brand-gold-rgb),.28), 0 11px 0 -6px #9b7600 !important;
    }

    body[data-scp-surface='intake'] button:disabled {
      cursor: not-allowed;
      filter: saturate(.35) !important;
      transform: none !important;
      box-shadow: none !important;
    }

    body[data-scp-surface='intake'] [data-intake-card] {
      overflow: hidden;
    }

    body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child {
      align-items: flex-start !important;
    }

    body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child > span:first-child {
      flex: 0 0 auto;
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.42);
      background: rgba(var(--intake-brand-gold-rgb),.12) !important;
      color: var(--intake-brand-gold) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 14px 28px -22px rgba(var(--intake-brand-gold-rgb),.8);
    }

    body[data-scp-surface='intake'] [data-intake-card='form'] h2 {
      color: #fff9ed !important;
      font-size: clamp(1.25rem, 4vw, 1.55rem) !important;
      line-height: 1.15;
    }

    body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child p {
      margin-top: .3rem;
      line-height: 1.55 !important;
    }

    body[data-scp-surface='intake'] [data-intake-summary-card] {
      min-width: 0;
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.2) !important;
      background: linear-gradient(145deg, rgba(255,255,255,.065), rgba(255,255,255,.025)) !important;
    }

    body[data-scp-surface='intake'] [data-intake-summary-card] > span {
      display: flex;
      width: 2.35rem;
      height: 2.35rem;
      align-items: center;
      justify-content: center;
      border-radius: .75rem;
      background: rgba(var(--intake-brand-gold-rgb),.1);
      color: var(--intake-brand-gold) !important;
    }

    body[data-scp-surface='intake'] [data-intake-choice-grid] button {
      min-height: 5rem;
      border: 1px solid rgba(255,255,255,.14) !important;
      border-radius: 1rem !important;
      background: rgba(255,255,255,.04) !important;
      color: rgba(255,252,245,.86) !important;
      transition: border-color .18s ease, background .18s ease, transform .18s ease !important;
    }

    body[data-scp-surface='intake'] [data-intake-choice-grid] button[class*='bg-[#dfe8d6]'] {
      border-color: rgba(var(--intake-brand-gold-rgb),.78) !important;
      background: rgba(var(--intake-brand-gold-rgb),.15) !important;
      color: #fff9e8 !important;
      box-shadow: 0 12px 32px -24px rgba(var(--intake-brand-gold-rgb),.75) !important;
    }

    body[data-scp-surface='intake'] main :is(input, textarea, select) {
      min-height: 3.55rem;
      font-size: 1rem !important;
      transition: border-color .18s ease, box-shadow .18s ease, background .18s ease !important;
    }

    body[data-scp-surface='intake'] main input[type='checkbox'] {
      flex: 0 0 auto;
      width: 1.25rem !important;
      height: 1.25rem !important;
      accent-color: var(--intake-brand-gold) !important;
    }

    body[data-scp-surface='intake'] :is(button, a, input, textarea, select):focus-visible {
      outline: 2px solid var(--intake-brand-gold) !important;
      outline-offset: 3px !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='done'] {
      border-color: rgba(var(--intake-brand-gold-rgb),.44) !important;
      background:
        radial-gradient(circle at 50% 0%, rgba(var(--intake-brand-gold-rgb),.12), transparent 22rem),
        linear-gradient(148deg, rgba(7,16,11,.9), rgba(13,15,13,.87)) !important;
      color: #fff9ed !important;
    }

    body[data-scp-surface='intake'] [data-intake-stage='done'] > span:first-child {
      border: 1px solid rgba(var(--intake-brand-gold-rgb),.55);
      background: rgba(var(--intake-brand-gold-rgb),.14) !important;
      color: var(--intake-brand-gold) !important;
      box-shadow: 0 0 38px rgba(var(--intake-brand-gold-rgb),.16);
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-stage] h1 {
      color: var(--intake-brand-gold) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-question],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [data-intake-summary-card] {
      border-color: rgba(104,65,27,.34) !important;
      background: rgba(255,253,247,.72) !important;
      color: #271b13 !important;
    }

    @keyframes intake-question-arrive {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes intake-system-breathe {
      0%, 100% {
        border-color: rgba(var(--intake-brand-gold-rgb),.3);
        box-shadow: 0 34px 78px -38px rgba(0,0,0,.96), inset 0 1px 0 rgba(255,255,255,.065);
      }
      50% {
        border-color: rgba(255,225,88,.43);
        box-shadow: 0 34px 78px -38px rgba(0,0,0,.96), 0 0 24px rgba(245,197,24,.09), inset 0 1px 0 rgba(255,255,255,.08);
      }
    }

    @keyframes intake-edge-current {
      from { background-position: 180% 0; }
      to { background-position: -80% 0; }
    }

    @keyframes intake-status-pulse {
      0%, 100% { opacity: .38; transform: scale(.82); }
      50% { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 640px) {
      body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
        object-position: 59% center !important;
        filter: none !important;
      }

      body[data-scp-surface='intake'] main > div {
        width: calc(100% - 2rem) !important;
        padding-top: 1rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] {
        margin-bottom: .85rem !important;
        padding: .3rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div {
        min-height: 2.8rem;
        padding: .48rem .25rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div > div:first-child > span:last-child {
        display: none;
      }

      body[data-scp-surface='intake'] [data-intake-progress] > div > div:last-child {
        font-size: .7rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-stage='clarify'],
      body[data-scp-surface='intake'] [data-intake-card] {
        border-radius: 1.5rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-question] {
        padding: 1rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-question] button {
        min-height: 3.6rem;
      }

      body[data-scp-surface='intake'] [data-intake-stage='clarify'] > div:last-child > div:nth-last-child(2) {
        align-items: stretch;
      }

      body[data-scp-surface='intake'] [data-intake-card='form'] > div:first-child {
        gap: .75rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-summary] {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: .5rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-summary-card] {
        padding: .8rem !important;
      }

      body[data-scp-surface='intake'] [data-intake-summary-card] > span {
        width: 2rem;
        height: 2rem;
      }

      body[data-scp-surface='intake'] [data-intake-summary-card] > div:last-child {
        overflow-wrap: anywhere;
        font-size: .72rem !important;
        line-height: 1.35;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] {
        border-radius: 1.7rem !important;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child {
        padding: 1.75rem 1.05rem .7rem !important;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child h1 {
        margin-top: 1rem !important;
        font-size: clamp(2.2rem, 12vw, 3.35rem) !important;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child p {
        font-size: .88rem !important;
        line-height: 1.55 !important;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) {
        padding: 1.05rem 1rem 1.35rem !important;
      }

      body[data-scp-surface='intake'] main textarea {
        min-height: 10.75rem;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button {
        gap: .65rem !important;
        padding: .75rem !important;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button > span:first-child {
        width: 2.35rem !important;
        height: 2.35rem !important;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button strong {
        font-size: .76rem !important;
      }

      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button small {
        font-size: .68rem !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
        filter: none !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
        transform: none !important;
      }

      html[data-scp-theme] body[data-scp-surface='intake'] main > div > section,
      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden']::before,
      body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden']::after {
        animation: none !important;
      }
    }
  `}</style>
);
