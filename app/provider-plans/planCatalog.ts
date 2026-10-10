export type ProviderPlan = {
  slug: string;
  code: string;
  name: string;
  price: string;
  cadence: string;
  kind: 'subscription' | 'lead_pack';
  audience: string;
  headline: string;
  summary: string;
  benefits: Array<{ title: string; description: string }>;
  included: string[];
};

export const providerPlans: ProviderPlan[] = [
  {
    slug: 'starter', code: 'starter_monthly', name: 'Starter', price: 'R49', cadence: 'per month', kind: 'subscription',
    audience: 'For providers building momentum', headline: 'Keep your next customer opportunity within reach.',
    summary: 'Starter is the simple step from trying the marketplace to using it as a dependable channel for new work.',
    benefits: [
      { title: 'Unlock new job opportunities', description: 'Continue opening suitable customer requests after your first three complimentary leads.' },
      { title: 'See the full job before you respond', description: 'View the customer brief, project images, area, timing and preliminary context in one focused workspace.' },
      { title: 'Reply professionally in minutes', description: 'Send availability, a site-visit option, an estimate range or a question without chasing details over multiple calls.' },
    ],
    included: ['Active provider access', 'Full opportunity briefs', 'Structured response tools', 'Monthly access, cancel any time'],
  },
  {
    slug: 'growth', code: 'growth_monthly', name: 'Growth', price: 'R99', cadence: 'per month', kind: 'subscription',
    audience: 'For providers ready for a steadier pipeline', headline: 'Turn good work into a more consistent flow of work.',
    summary: 'Growth is for the provider who wants Skills Connect Pro to become part of the weekly rhythm, not just a once-off source of work.',
    benefits: [
      { title: 'Keep responding when work is active', description: 'Stay open to suitable local opportunities instead of reaching a hard stop after your trial leads.' },
      { title: 'Build a stronger quote-ready routine', description: 'Use clear job information and structured replies to decide faster which work is worth taking on.' },
      { title: 'Designed for regular local service work', description: 'A practical home for plumbers, mechanics, electricians, cleaners and other skilled providers growing their name in the area.' },
    ],
    included: ['Everything in Starter', 'Ongoing provider access', 'Full job-response workspace', 'Built for regular local work'],
  },
  {
    slug: 'pro', code: 'pro_monthly', name: 'Pro', price: 'R199', cadence: 'per month', kind: 'subscription',
    audience: 'For established service businesses', headline: 'Give your business a serious home in the local skills economy.',
    summary: 'Pro is for teams and established independents who want a reliable digital front door for the work they are best at.',
    benefits: [
      { title: 'Keep your business ready for the right work', description: 'Maintain uninterrupted access to customer opportunities that fit your service category and operating area.' },
      { title: 'Protect your time with better context', description: 'Review the job information before committing your time, travel and team capacity.' },
      { title: 'A platform that grows with your business', description: 'Your provider access is ready for the richer matching, business tools and category expansion being built into Skills Connect Pro.' },
    ],
    included: ['Everything in Growth', 'Continuous provider access', 'Complete project context', 'Ready for future business tools'],
  },
  {
    slug: 'lead-pack-4', code: 'lead_pack_4', name: '4 lead credits', price: 'R99', cadence: 'once-off', kind: 'lead_pack',
    audience: 'For flexible top-ups', headline: 'Four more chances to win the right work.',
    summary: 'A small, once-off lead pack for providers who want flexibility without a monthly commitment.',
    benefits: [
      { title: 'Four unlocks when you need them', description: 'Use a credit only when you open and respond to a new customer opportunity.' },
      { title: 'No monthly plan required', description: 'Top up your access as your workload, capacity and appetite for new work changes.' },
      { title: 'The same complete workspace', description: 'Every unlocked opportunity includes the full brief and the tools to reply clearly.' },
    ],
    included: ['4 lead credits', 'One-time purchase', 'Full opportunity access', 'No monthly commitment'],
  },
  {
    slug: 'lead-pack-10', code: 'lead_pack_10', name: '10 lead credits', price: 'R199', cadence: 'once-off', kind: 'lead_pack',
    audience: 'For providers expecting a busy month', headline: 'Stay ready for the jobs worth taking.',
    summary: 'Ten lead credits for the provider who wants meaningful flexibility and a more confident runway for new work.',
    benefits: [
      { title: 'Ten new opportunity unlocks', description: 'Keep capacity available for the right customer jobs as they come through.' },
      { title: 'Control your pace', description: 'Use credits only when you choose to open a new opportunity and put your name forward.' },
      { title: 'Make decisions with the full picture', description: 'Review the job context before spending time on a visit, estimate or detailed reply.' },
    ],
    included: ['10 lead credits', 'One-time purchase', 'Flexible use', 'Full opportunity access'],
  },
  {
    slug: 'lead-pack-25', code: 'lead_pack_25', name: '25 lead credits', price: 'R399', cadence: 'once-off', kind: 'lead_pack',
    audience: 'For active service businesses', headline: 'A deeper pipeline for a business that is ready to move.',
    summary: 'Twenty-five lead credits for providers actively building a dependable flow of customer work.',
    benefits: [
      { title: 'A stronger runway of new work', description: 'Keep more opportunities available as you build out your customer pipeline.' },
      { title: 'Value that follows your capacity', description: 'Use credits over time, as and when a project fits your service and availability.' },
      { title: 'Focus on the jobs that fit', description: 'Get the context you need to decide quickly whether to reply, quote, visit or pass.' },
    ],
    included: ['25 lead credits', 'One-time purchase', 'Built for active providers', 'Full opportunity access'],
  },
];

export function getProviderPlan(slug: string): ProviderPlan | undefined {
  return providerPlans.find((plan) => plan.slug === slug);
}
