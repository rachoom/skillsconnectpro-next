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
    price: 'text-[#241b00]',
    badge: 'border-[#5a4300]/30 bg-[#191207] text-[#ffe17a]',
    button: 'bg-[#171107] text-[#ffe17a] hover:bg-[#302408]',
    panel: 'bg-[linear-gradient(135deg,rgba(255,215,95,.98),rgba(221,169,21,.98))] text-[#281d00]',
    check: 'text-[#483300]',
  },
} as const;

export const providerPlanThemes = {
  'starter': {
    card: 'border-[#b49457]/65 bg-[linear-gradient(146deg,rgba(176,142,77,.20),rgba(23,22,19,.96)_42%,rgba(11,11,11,.99)_100%)] text-[#fbf7eb]',
    price: 'text-[#dec88a]',
    badge: 'border-[#b49457]/55 bg-[#f5c518]/10 text-[#dec88a]',
    button: 'bg-[#f5c518] text-[#17120a] hover:bg-[#ffdd55]',
    panel: 'bg-[linear-gradient(132deg,#ffe18a_0%,#f5c518_52%,#d4a21c_100%)] text-[#1f1806]',
    check: 'text-[#f5c518]',
  },
  'growth': {
    card: 'border-[#f5c518]/65 bg-[linear-gradient(146deg,rgba(245,197,24,.16),rgba(23,22,19,.96)_42%,rgba(11,11,11,.99)_100%)] text-[#fbf7eb]',
    price: 'text-[#ffe49a]',
    badge: 'border-[#f5c518]/55 bg-[#f5c518]/10 text-[#ffe49a]',
    button: 'bg-[#f5c518] text-[#17120a] hover:bg-[#ffdd55]',
    panel: 'bg-[linear-gradient(132deg,#ffe18a_0%,#f5c518_52%,#d4a21c_100%)] text-[#1f1806]',
    check: 'text-[#f5c518]',
  },
  'pro': {
    card: 'border-[#e1b969]/65 bg-[linear-gradient(146deg,rgba(195,146,65,.22),rgba(23,22,19,.96)_42%,rgba(11,11,11,.99)_100%)] text-[#fbf7eb]',
    price: 'text-[#f9d98b]',
    badge: 'border-[#e1b969]/55 bg-[#f5c518]/10 text-[#f9d98b]',
    button: 'bg-[#f5c518] text-[#17120a] hover:bg-[#ffdd55]',
    panel: 'bg-[linear-gradient(132deg,#ffe18a_0%,#f5c518_52%,#d4a21c_100%)] text-[#1f1806]',
    check: 'text-[#f5c518]',
  },
  'lead-pack-4': {
    card: 'border-[#b49457]/65 bg-[linear-gradient(146deg,rgba(176,142,77,.17),rgba(23,22,19,.96)_42%,rgba(11,11,11,.99)_100%)] text-[#fbf7eb]',
    price: 'text-[#e7cd90]',
    badge: 'border-[#b49457]/55 bg-[#f5c518]/10 text-[#e7cd90]',
    button: 'bg-[#f5c518] text-[#17120a] hover:bg-[#ffdd55]',
    panel: 'bg-[linear-gradient(132deg,#ffe18a_0%,#f5c518_52%,#d4a21c_100%)] text-[#1f1806]',
    check: 'text-[#f5c518]',
  },
  'lead-pack-10': {
    card: 'border-[#dfb765]/65 bg-[linear-gradient(146deg,rgba(195,146,65,.19),rgba(23,22,19,.96)_42%,rgba(11,11,11,.99)_100%)] text-[#fbf7eb]',
    price: 'text-[#f6d790]',
    badge: 'border-[#dfb765]/55 bg-[#f5c518]/10 text-[#f6d790]',
    button: 'bg-[#f5c518] text-[#17120a] hover:bg-[#ffdd55]',
    panel: 'bg-[linear-gradient(132deg,#ffe18a_0%,#f5c518_52%,#d4a21c_100%)] text-[#1f1806]',
    check: 'text-[#f5c518]',
  },
  'lead-pack-25': {
    card: 'border-[#f5c518]/65 bg-[linear-gradient(146deg,rgba(245,197,24,.14),rgba(23,22,19,.96)_42%,rgba(11,11,11,.99)_100%)] text-[#fbf7eb]',
    price: 'text-[#ffe49a]',
    badge: 'border-[#f5c518]/55 bg-[#f5c518]/10 text-[#ffe49a]',
    button: 'bg-[#f5c518] text-[#17120a] hover:bg-[#ffdd55]',
    panel: 'bg-[linear-gradient(132deg,#ffe18a_0%,#f5c518_52%,#d4a21c_100%)] text-[#1f1806]',
    check: 'text-[#f5c518]',
  },
} as const;

export function customerTheme(code: string) {
  return customerPlanThemes[code as keyof typeof customerPlanThemes] ?? customerPlanThemes.basic_30;
}

export function providerTheme(slug: string) {
  return providerPlanThemes[slug as keyof typeof providerPlanThemes] ?? providerPlanThemes.starter;
}
