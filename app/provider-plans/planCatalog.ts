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
    audience: 'For providers ready to go beyond three free responses', headline: 'Stay ready for your next opportunity.',
    summary: 'Move beyond your first three complimentary responses with 15 paid opportunity replies each month. Make every response clear, professional and easy to manage.',
    benefits: [
      { title: '15 responses to keep you moving', description: 'A practical monthly allowance for responding to suitable jobs after your first three complimentary replies.' },
      { title: 'Reply with confidence', description: 'Review the job details, then share when you can attend, an arrival window and optional pricing.' },
      { title: 'Keep every opportunity organised', description: 'See incoming invitations and submitted responses from your Artisan Business Workspace.' },
    ],
    included: [
      '15 paid opportunity responses each month',
      'View local customer briefs and reference images',
      'Reply with availability and estimated arrival times',
      'Share site-visit fees and preliminary estimates',
      'Keep track of invitations and responses in one workspace',
      'Connect directly when the customer chooses you',
    ],
  },
  {
    slug: 'growth', code: 'growth_monthly', name: 'Growth', price: 'R99', cadence: 'per month', kind: 'subscription',
    audience: 'For providers with a growing workload', headline: 'More chances to put your skills to work.',
    summary: 'Step up to 40 paid responses per month. Everything you need to review suitable opportunities, respond professionally and keep your pipeline organised.',
    benefits: [
      { title: '40 responses each month', description: 'More monthly room to pursue projects that fit your trade, service areas and schedule.' },
      { title: 'Make a strong first impression', description: 'Send a clear reply with your availability, arrival time, site-visit fee or estimated price.' },
      { title: 'Keep work opportunities in view', description: 'Track invitations and your submitted responses from the existing artisan dashboard.' },
    ],
    included: [
      '40 paid opportunity responses each month',
      'Everything included with Starter',
      'Review job descriptions and customer photos when provided',
      'Choose suitable work across your registered service areas',
      'Send structured arrival and pricing details',
      'Track opportunities and responses from your artisan dashboard',
      'Connect directly when the customer chooses you',
    ],
  },
  {
    slug: 'pro', code: 'pro_monthly', name: 'Pro', price: 'R199', cadence: 'per month', kind: 'subscription',
    audience: 'For active artisans and established service businesses', headline: 'More capacity for more opportunities.',
    summary: 'Our largest monthly allowance: 100 paid responses to suitable customer opportunities. All the familiar provider tools, with room to respond at a higher volume.',
    benefits: [
      { title: '100 responses each month', description: 'Our highest monthly response allowance for businesses ready to consider more suitable customer requests.' },
      { title: 'Respond professionally in minutes', description: 'Review the brief and photos, then share availability, arrival times and optional estimates.' },
      { title: 'Stay on top of incoming work', description: 'Keep your invitations, response history and provider availability in your Artisan Business Workspace.' },
    ],
    included: [
      '100 paid opportunity responses each month',
      'Everything included with Growth and Starter',
      'Review customer project details and reference photos',
      'Choose opportunities that match your services and availability',
      'Send availability, site-visit fees and preliminary estimates',
      'Manage invitations and response history in your artisan workspace',
      'Connect directly when the customer chooses you',
    ],
  },
  {
    slug: 'lead-pack-4', code: 'lead_pack_4', name: '4 lead credits', price: 'R99', cadence: 'once-off', kind: 'lead_pack',
    audience: 'For flexible top-ups', headline: 'Four more chances to win the right work.',
    summary: 'A small, once-off lead pack for providers who want flexibility without a monthly commitment.',
    benefits: [
      { title: 'Four unlocks when you need them', description: 'A credit is used when you submit an eligible new customer-opportunity response after the free allowance.' },
      { title: 'No monthly plan required', description: 'Top up your access as your workload, capacity and appetite for new work changes.' },
      { title: 'The same complete workspace', description: 'Every unlocked opportunity includes the full brief and the tools to reply clearly.' },
    ],
    included: ['4 lead credits', 'One-time purchase', 'Full opportunity brief for each unlocked lead', 'Structured response tools', 'Credits are consumed on eligible submitted responses', 'No monthly commitment'],
  },
  {
    slug: 'lead-pack-10', code: 'lead_pack_10', name: '10 lead credits', price: 'R199', cadence: 'once-off', kind: 'lead_pack',
    audience: 'For providers expecting a busy month', headline: 'Stay ready for the jobs worth taking.',
    summary: 'Ten lead credits for the provider who wants meaningful flexibility and a more confident runway for new work.',
    benefits: [
      { title: 'Ten new opportunity unlocks', description: 'Keep capacity available for the right customer jobs as they come through.' },
      { title: 'Control your pace', description: 'A credit is consumed on an eligible submitted response, not merely when you view an invitation.' },
      { title: 'Make decisions with the full picture', description: 'Review the job context before spending time on a visit, estimate or detailed reply.' },
    ],
    included: ['10 lead credits', 'One-time purchase', 'Flexible use across suitable opportunities', 'Full opportunity briefs', 'Structured response tools', 'No monthly commitment'],
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
    included: ['25 lead credits', 'One-time purchase', 'Built for active providers', 'Full opportunity briefs', 'Structured response tools', 'Flexible use as capacity allows', 'No monthly commitment'],
  },
];

export function getProviderPlan(slug: string): ProviderPlan | undefined {
  return providerPlans.find((plan) => plan.slug === slug);
}
