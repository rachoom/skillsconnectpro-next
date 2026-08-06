export const IntakeHeroAlignment = () => (
  <style>{`
    /*
     * The intake borrows the launch hero's visual language: bold editorial type,
     * warm gold details and one calm glass surface over visible trade imagery.
     */
    body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
      object-position: 54% center !important;
      filter: saturate(.92) contrast(1.03) brightness(.97) !important;
      transform: scale(1.015) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_overlay'] {
      background:
        linear-gradient(180deg, rgba(7,12,9,.09), rgba(11,8,6,.23)),
        radial-gradient(circle at 12% 4%, rgba(245,197,24,.07), transparent 27rem),
        radial-gradient(circle at 90% 45%, rgba(47,103,74,.08), transparent 32rem) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_texture'] {
      opacity: .045 !important;
    }

    body[data-scp-surface='intake'] main > div {
      width: min(calc(100% - 4.5rem), 46rem) !important;
      max-width: none !important;
      padding: 1.7rem 0 5rem !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] {
      border-color: rgba(220,185,130,.18) !important;
      background: rgba(7,13,10,.72) !important;
      color: #f5f0e3 !important;
      box-shadow: 0 18px 46px -34px rgba(0,0,0,.96) !important;
      backdrop-filter: blur(22px) saturate(112%) !important;
      -webkit-backdrop-filter: blur(22px) saturate(112%) !important;
    }

    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] button,
    body[data-scp-surface='intake'] nav[aria-label='Job request navigation'] a:not([href*='wa.me']) {
      border-color: rgba(220,185,130,.24) !important;
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
      border: 1px solid rgba(220,185,130,.16) !important;
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
      border: 1px solid rgba(220,185,130,.28) !important;
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
      color: #d9bb83 !important;
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
        rgba(245,197,24,.08) 35%,
        rgba(255,225,88,.72) 49%,
        rgba(255,250,224,.28) 52%,
        rgba(245,197,24,.08) 66%,
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
      background: #ffe158;
      box-shadow: 0 0 12px rgba(255,225,88,.72);
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
      border: 1px solid rgba(220,185,130,.22);
      border-radius: .8rem;
      background: rgba(220,185,130,.11);
      color: #dfc08c !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 16px 34px -25px rgba(0,0,0,.95);
      filter: none !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child h1 {
      max-width: 42rem;
      margin: 1.35rem auto 0 !important;
      color: #f0cd7d !important;
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
      border: 1px solid rgba(220,185,130,.34) !important;
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
      border: 1px solid rgba(220,185,130,.48) !important;
      background: rgba(246,239,226,.06) !important;
      color: #f5f0e3 !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.045), 0 16px 36px -28px rgba(0,0,0,.9) !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > div[class~='grid'] > button > span:first-child {
      flex: 0 0 auto;
      border: 1px solid rgba(220,185,130,.2) !important;
      background: rgba(220,185,130,.12) !important;
      color: #d9b98d !important;
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
      color: #ead7aa !important;
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
      border-color: rgba(220,185,130,.25) !important;
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
      filter: saturate(.78) contrast(1.02) brightness(1.01) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_overlay'] {
      background:
        linear-gradient(180deg, rgba(239,231,216,.16), rgba(226,216,197,.3)),
        radial-gradient(circle at 12% 4%, rgba(245,197,24,.075), transparent 27rem) !important;
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

    @keyframes intake-system-breathe {
      0%, 100% {
        border-color: rgba(220,185,130,.28);
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
        filter: saturate(.94) contrast(1.03) brightness(.99) !important;
      }

      body[data-scp-surface='intake'] main > div {
        width: calc(100% - 2rem) !important;
        padding-top: 1rem !important;
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
        filter: saturate(.78) contrast(1.01) brightness(1.02) !important;
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
