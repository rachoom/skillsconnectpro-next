export const customerPlanBenefits: Record<string, string[]> = {
  free: [
    'Account registration and private project access',
    'Basic AI Project Assistant',
    '1 project photo analysis',
    'Materials estimates and editable itemised lists',
    'Find and compare suitable local artisans',
    '1 active project workspace',
    'Working project budget and expense records',
    'Save project details and photos',
    'Up to 5 project documents (5 MB each, 25 MB per project)',
    'Upload receipts as project documents',
  ],
  basic_30: [
    'Everything in Free, with expanded limits',
    '2 project photo analyses (instead of 1)',
    '1 active project workspace',
    'Up to 20 project documents (instead of 5)',
    'Up to 10 MB per document and 200 MB per project',
    'More room to save quotes, receipts and work photos',
    'Editable itemised materials lists and estimates',
    'Track expenses and keep your working budget updated',
    'Review provider replies and contact your chosen artisan',
    '30-day once-off pass — no automatic renewal',
  ],
  project_pass_90: [
    'Everything in Basic, with higher limits',
    '5 project photo analyses',
    'Up to 3 active projects',
    'Up to 50 project documents per project',
    'Up to 10 MB per document and 500 MB per project',
    'More room for receipts, quotes and work photos',
    'Project milestones and progress tracking',
    'Editable materials, expenses and working budgets',
    'Review provider replies and contact your chosen artisan',
    '90-day once-off pass — no automatic renewal',
  ],
};

export const customerPlanThemes = {
  free: {
    accent: '#4ade80',
    card: 'border-[#39d98a]/65 bg-[linear-gradient(145deg,rgba(10,70,43,.72),rgba(7,20,14,.94))]',
    price: 'text-[#65f3a7]',
    badge: 'border-[#39d98a]/50 bg-[#0d5c39]/70 text-[#8bf6bc]',
    button: 'bg-[#52e69a] text-[#052516] hover:bg-[#7af0b2]',
    panel: 'bg-[linear-gradient(135deg,rgba(57,217,138,.92),rgba(19,125,78,.96))] text-[#052516]',
    check: 'text-[#65f3a7]',
  },
  basic_30: {
    accent: '#4da3ff',
    card: 'border-[#4da3ff]/65 bg-[linear-gradient(145deg,rgba(10,52,99,.78),rgba(7,18,31,.96))]',
    price: 'text-[#7bc0ff]',
    badge: 'border-[#4da3ff]/50 bg-[#0d4b8d]/70 text-[#9cd0ff]',
    button: 'bg-[#4da3ff] text-[#031a31] hover:bg-[#78bcff]',
    panel: 'bg-[linear-gradient(135deg,rgba(77,163,255,.96),rgba(20,94,178,.98))] text-[#061a31]',
    check: 'text-[#67b6ff]',
  },
  project_pass_90: {
    accent: '#ffd75f',
    card: 'border-[#ffd75f]/85 bg-[linear-gradient(145deg,#f9ca32_0%,#dcae19_100%)] text-[#241b00]',
    price: 'text-[#ffe17a]',
    badge: 'border-[#ffd75f]/45 bg-[#151005] text-[#ffe17a]',
    button: 'bg-[#ffd75f] text-[#211800] hover:bg-[#ffe58f] shadow-[0_14px_34px_rgba(255,215,95,.16)]',
    panel: 'bg-[linear-gradient(135deg,rgba(255,215,95,.98),rgba(221,169,21,.98))] text-[#281d00]',
    check: 'text-[#ffd75f]',
  },
} as const;

export const providerPlanThemes = {
  starter: {
    card: 'border-[#d6c27b]/48 bg-[linear-gradient(145deg,rgba(31,34,27,.88),rgba(8,12,9,.98))]',
    price: 'text-[#f5e7a8]',
    badge: 'border-[#d6c27b]/40 bg-[#17150c]/80 text-[#f8e9aa]',
    button: 'bg-[#f3efe3] text-[#17150c] hover:bg-white',
    panel: 'bg-[linear-gradient(135deg,#f3efe3,#c9bc87)] text-[#17150c]',
    check: 'text-[#e6d57e]',
  },
  growth: {
    card: 'border-[#ffd75f]/80 bg-[linear-gradient(145deg,rgba(72,55,10,.76),rgba(12,11,7,.98))]',
    price: 'text-[#ffe17a]',
    badge: 'border-[#ffd75f]/50 bg-[#171107]/85 text-[#ffe17a]',
    button: 'bg-[#ffd75f] text-[#211800] hover:bg-[#ffe58f] shadow-[0_14px_34px_rgba(255,215,95,.17)]',
    panel: 'bg-[linear-gradient(135deg,#ffd75f,#c99b16)] text-[#211800]',
    check: 'text-[#ffd75f]',
  },
  pro: {
    card: 'border-[#e3c36d]/65 bg-[linear-gradient(145deg,rgba(55,41,17,.82),rgba(11,9,6,.98))]',
    price: 'text-[#f6d982]',
    badge: 'border-[#e3c36d]/45 bg-[#20180b]/80 text-[#f8dc89]',
    button: 'bg-[#e7c665] text-[#211800] hover:bg-[#f8dd89]',
    panel: 'bg-[linear-gradient(135deg,#e7c665,#a87a16)] text-[#211800]',
    check: 'text-[#e7c665]',
  },
  'lead-pack-4': {
    card: 'border-white/20 bg-[linear-gradient(145deg,rgba(28,31,27,.84),rgba(8,12,9,.98))]',
    price: 'text-[#f1e6bd]',
    badge: 'border-white/18 bg-white/[.05] text-[#f1e6bd]',
    button: 'bg-[#f3efe3] text-[#17150c] hover:bg-white',
    panel: 'bg-[linear-gradient(135deg,#f3efe3,#bdb28e)] text-[#17150c]',
    check: 'text-[#e1d3a0]',
  },
  'lead-pack-10': {
    card: 'border-[#d9bd62]/55 bg-[linear-gradient(145deg,rgba(48,37,12,.80),rgba(9,10,7,.98))]',
    price: 'text-[#f5d979]',
    badge: 'border-[#d9bd62]/40 bg-[#181309]/80 text-[#f5d979]',
    button: 'bg-[#e5c55f] text-[#211800] hover:bg-[#f4d97d]',
    panel: 'bg-[linear-gradient(135deg,#e5c55f,#a47919)] text-[#211800]',
    check: 'text-[#e5c55f]',
  },
  'lead-pack-25': {
    card: 'border-[#ffd75f]/70 bg-[linear-gradient(145deg,rgba(67,51,10,.82),rgba(10,10,7,.98))]',
    price: 'text-[#ffe17a]',
    badge: 'border-[#ffd75f]/45 bg-[#171107]/85 text-[#ffe17a]',
    button: 'bg-[#ffd75f] text-[#211800] hover:bg-[#ffe58f]',
    panel: 'bg-[linear-gradient(135deg,#ffd75f,#b88714)] text-[#211800]',
    check: 'text-[#ffd75f]',
  },
} as const;

export function customerTheme(code: string) {
  return customerPlanThemes[code as keyof typeof customerPlanThemes] ?? customerPlanThemes.basic_30;
}

export function providerTheme(slug: string) {
  return providerPlanThemes[slug as keyof typeof providerPlanThemes] ?? providerPlanThemes.starter;
}
