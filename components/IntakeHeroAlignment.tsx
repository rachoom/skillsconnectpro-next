export const IntakeHeroAlignment = () => (
  <style>{`
    /*
     * Final intake art direction:
     * the page image supplies atmosphere while every form stage uses one calm,
     * solid surface matching the launch hero's brown-and-cream language.
     */
    body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
      filter: saturate(.72) contrast(1.04) brightness(.78) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_overlay'] {
      background:
        linear-gradient(180deg, rgba(18,11,7,.3), rgba(18,11,7,.5)),
        radial-gradient(circle at 12% 5%, rgba(245,197,24,.055), transparent 28rem) !important;
    }

    body[data-scp-surface='intake'] [class*='IntakeVisualShell_texture'] {
      opacity: .055 !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2),
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']):not([class~='space-y-5']),
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div {
      background: #1d120c !important;
      background-image: none !important;
      color: #f5f0e3 !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden']::before,
    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden']::after {
      content: none !important;
      display: none !important;
      background: none !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] {
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main h1,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main h2,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main h3,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main strong {
      color: #f5f0e3 !important;
      text-shadow: 0 5px 30px rgba(0,0,0,.3) !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main p:not([class*='text-red']):not([class*='text-amber']),
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main small {
      color: rgba(245,240,227,.7) !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main section [class*='uppercase'][class*='tracking-widest']:not([class*='text-red']):not([class*='text-amber']) {
      color: #f5c518 !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main textarea,
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main input:not([type='file']),
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main select {
      border-color: rgba(220,185,130,.5) !important;
      background: #120b07 !important;
      color: #f5f0e3 !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main [class*='bg-white'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main [class*='bg-[#faf9f4]'],
    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main [class*='bg-[#e8eee2]'] {
      border-color: rgba(220,185,130,.28) !important;
      background: #291a11 !important;
      color: #f5f0e3 !important;
      background-image: none !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] {
      background: rgba(18,11,7,.82) !important;
      background-image: none !important;
    }

    html[data-scp-theme='dark'] body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] > div[class*='bg-[#f5c518]'] {
      border-color: rgba(245,197,24,.48) !important;
      background: #2b1a10 !important;
      color: #ffe069 !important;
      background-image: none !important;
    }

    body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2) > button:last-child,
    body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']) > button[class~='w-full'] {
      background: #f5c518 !important;
      background-image: none !important;
      color: #171006 !important;
    }

    /* Light mode uses the same single-surface idea in warm cream. */
    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
      filter: saturate(.72) contrast(1.02) brightness(1.03) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_overlay'] {
      background:
        linear-gradient(180deg, rgba(245,240,227,.2), rgba(245,240,227,.42)),
        radial-gradient(circle at 12% 5%, rgba(245,197,24,.045), transparent 28rem) !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:first-child,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='overflow-hidden'] > div:nth-child(2),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section:not([class~='overflow-hidden']):not([class~='space-y-5']),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] > div {
      background: #f5f0e3 !important;
      background-image: none !important;
      color: #2b1a10 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > section[class~='space-y-5'] {
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main h1,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main h2,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main h3,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main strong {
      color: #2b1a10 !important;
      text-shadow: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main p:not([class*='text-red']):not([class*='text-amber']),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main small {
      color: #62574d !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main section [class*='uppercase'][class*='tracking-widest']:not([class*='text-red']):not([class*='text-amber']) {
      color: #7b5016 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main textarea,
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main input:not([type='file']),
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main select {
      border-color: rgba(104,65,27,.58) !important;
      background: #fffdf7 !important;
      color: #2b1a10 !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main [class*='bg-white'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main [class*='bg-[#faf9f4]'],
    html[data-scp-theme='light'] body[data-scp-surface='intake'] main [class*='bg-[#e8eee2]'] {
      border-color: rgba(104,65,27,.4) !important;
      background: #fffaf0 !important;
      color: #2b1a10 !important;
      background-image: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] {
      background: rgba(245,240,227,.88) !important;
      background-image: none !important;
    }

    html[data-scp-theme='light'] body[data-scp-surface='intake'] main > div > div[class~='grid-cols-3'] > div[class*='bg-[#f5c518]'] {
      border-color: rgba(118,80,25,.55) !important;
      background: #f4e5b5 !important;
      color: #5d3b0d !important;
      background-image: none !important;
    }

    @media (max-width: 640px) {
      body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
        object-position: 58% center !important;
        filter: saturate(.74) contrast(1.03) brightness(.82) !important;
      }

      html[data-scp-theme='light'] body[data-scp-surface='intake'] [class*='IntakeVisualShell_background'] img {
        filter: saturate(.72) contrast(1.01) brightness(1.04) !important;
      }
    }
  `}</style>
);
