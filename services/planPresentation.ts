export const customerPlanBenefits: Record<string, string[]> = {
  free: [
    'Account registration and private project access',
    'Basic AI Project Assistant',
    '1 project photo analysis',
    'Basic materials calculation',
    'Find and compare suitable local artisans',
    '1 active project',
    'Basic project budget',
    'Save project details and photos',
    'Up to 5 project documents (5 MB each, 25 MB per project)',
    'Limited expense and receipt tracking',
  ],
  basic_30: [
    'Everything in Free',
    '2 project photo analyses',
    'Full materials calculations with itemised lists',
    '1 active project workspace',
    'Expense tracking',
    'Store receipts and project documents',
    'Up to 20 project documents (10 MB each, 200 MB per project)',
    'Milestones and progress tracking',
    'Basic artisan collaboration',
    'Basic project budget and cost record',
  ],
  project_pass_90: [
    'Everything in Basic',
    '5 project photo analyses',
    'Up to 3 active projects',
    'Advanced project budget and cost tracking',
    'Expanded receipt and document storage',
    'Up to 50 project documents per project (10 MB each, 500 MB per project)',
    'Project timeline and milestones',
    'Project reports and handover record',
    'Collaborate with artisans across the project',
    'Project document export',
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
  starter: {
    card: 'border-[#2dd4bf]/65 bg-[linear-gradient(145deg,rgba(9,87,82,.72),rgba(5,23,22,.96))]',
    price: 'text-[#5eead4]',
    badge: 'border-[#2dd4bf]/45 bg-[#0f766e]/35 text-[#7ff3e2]',
    button: 'bg-[#2dd4bf] text-[#032b28] hover:bg-[#5eead4]',
    panel: 'bg-[linear-gradient(135deg,#2dd4bf,#0f766e)] text-[#032b28]',
    check: 'text-[#5eead4]',
  },
  growth: {
    card: 'border-[#a78bfa]/70 bg-[linear-gradient(145deg,rgba(78,50,135,.80),rgba(22,13,42,.96))]',
    price: 'text-[#c4b5fd]',
    badge: 'border-[#a78bfa]/45 bg-[#6d28d9]/30 text-[#d8ccff]',
    button: 'bg-[#a78bfa] text-[#1e1234] hover:bg-[#c4b5fd]',
    panel: 'bg-[linear-gradient(135deg,#a78bfa,#6d28d9)] text-[#1e1234]',
    check: 'text-[#c4b5fd]',
  },
  pro: {
    card: 'border-[#fb923c]/70 bg-[linear-gradient(145deg,rgba(129,61,18,.80),rgba(42,21,8,.96))]',
    price: 'text-[#fdba74]',
    badge: 'border-[#fb923c]/45 bg-[#c2410c]/30 text-[#fed7aa]',
    button: 'bg-[#fb923c] text-[#341506] hover:bg-[#fdba74]',
    panel: 'bg-[linear-gradient(135deg,#fb923c,#c2410c)] text-[#341506]',
    check: 'text-[#fdba74]',
  },
  'lead-pack-4': {
    card: 'border-[#38bdf8]/60 bg-[linear-gradient(145deg,rgba(12,74,110,.72),rgba(7,23,34,.96))]',
    price: 'text-[#7dd3fc]',
    badge: 'border-[#38bdf8]/45 bg-[#0369a1]/30 text-[#bae6fd]',
    button: 'bg-[#38bdf8] text-[#052535] hover:bg-[#7dd3fc]',
    panel: 'bg-[linear-gradient(135deg,#38bdf8,#0369a1)] text-[#052535]',
    check: 'text-[#7dd3fc]',
  },
  'lead-pack-10': {
    card: 'border-[#f472b6]/60 bg-[linear-gradient(145deg,rgba(131,24,67,.72),rgba(42,9,25,.96))]',
    price: 'text-[#f9a8d4]',
    badge: 'border-[#f472b6]/45 bg-[#be185d]/30 text-[#fbcfe8]',
    button: 'bg-[#f472b6] text-[#3d0a22] hover:bg-[#f9a8d4]',
    panel: 'bg-[linear-gradient(135deg,#f472b6,#be185d)] text-[#3d0a22]',
    check: 'text-[#f9a8d4]',
  },
  'lead-pack-25': {
    card: 'border-[#22d3ee]/60 bg-[linear-gradient(145deg,rgba(14,116,144,.72),rgba(5,34,41,.96))]',
    price: 'text-[#67e8f9]',
    badge: 'border-[#22d3ee]/45 bg-[#0e7490]/30 text-[#a5f3fc]',
    button: 'bg-[#22d3ee] text-[#063039] hover:bg-[#67e8f9]',
    panel: 'bg-[linear-gradient(135deg,#22d3ee,#0e7490)] text-[#063039]',
    check: 'text-[#67e8f9]',
  },
} as const;

export function customerTheme(code: string) {
  return customerPlanThemes[code as keyof typeof customerPlanThemes] ?? customerPlanThemes.basic_30;
}

export function providerTheme(slug: string) {
  return providerPlanThemes[slug as keyof typeof providerPlanThemes] ?? providerPlanThemes.starter;
}
