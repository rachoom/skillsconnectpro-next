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
    audience: 'For providers ready to go beyond three free opportunities', headline: 'Keep responding when the right jobs arrive.',
    summary: 'Monthly access to respond to suitable customer opportunities after your three complimentary leads. The standard provider tools are available to all approved artisans.',
    benefits: [
      { title: 'Continue responding to opportunities', description: 'Your active monthly access removes the three-free-lead response gate for suitable invitations.' },
      { title: 'Understand the job before responding', description: 'See the customer brief, area, timing and available project images where supplied.' },
      { title: 'Send a clear professional response', description: 'Share availability, estimated arrival, a site-visit fee or preliminary estimate.' },
    ],
    included: [
      'Access beyond three complimentary opportunities while your subscription is active',
      'Suitable invitations based on trade, location and availability',
      'Available customer brief and project images',
      'Availability, site-visit, estimate and message response options',
      'Customer contact released only after the customer selects you',
      'Existing Artisan Business Workspace tools',
      'Access period: one month after each verified payment',
      'Renewal and cancellation arrangements are subject to Payfast and the provider billing terms',
    ],
  },
  {
    slug: 'growth', code: 'growth_monthly', name: 'Growth', price: 'R99', cadence: 'per month', kind: 'subscription',
    audience: 'For providers considering a higher monthly tier', headline: 'Choose Growth with clear expectations.',
    summary: 'The same currently available marketplace-response tools as Starter. Additional Growth-only lead quotas, visibility and priority features are not yet enabled.',
    benefits: [
      { title: 'Ongoing opportunity access', description: 'Continue responding to suitable invitations while your subscription remains active.' },
      { title: 'Structured responses', description: 'Share timing, site visits and preliminary estimates using the existing provider interface.' },
      { title: 'An established workspace', description: 'Use the existing Artisan Business Workspace to review invitations and submitted responses.' },
    ],
    included: [
      'All currently available Starter marketplace and workspace capabilities',
      'Standard invitation matching — no paid priority ranking currently applied',
      'No separate Growth-specific lead allowance is currently enforced',
      'Customer contact released only after customer selection',
      'Access period: one month after each verified payment',
      'Renewal and cancellation arrangements are subject to Payfast and the provider billing terms',
    ],
  },
  {
    slug: 'pro', code: 'pro_monthly', name: 'Pro', price: 'R199', cadence: 'per month', kind: 'subscription',
    audience: 'For established providers assessing Pro access', headline: "Explore Pro with full visibility of today's features.",
    summary: 'The same currently available marketplace-response and business-workspace tools as Starter and Growth. Priority ranking and advanced team features are not yet enabled.',
    benefits: [
      { title: 'Respond to suitable jobs', description: 'Access and respond to standard marketplace invitations while your subscription is active.' },
      { title: 'Review project details', description: 'Use existing brief, images, area and schedule information before responding.' },
      { title: 'Keep work organised', description: 'Use the established Artisan Business Workspace tools; advanced team permissions are not yet included.' },
    ],
    included: [
      'All currently available Growth and Starter capabilities',
      'Existing Artisan Business Workspace for approved providers',
      'Standard marketplace matching — no Pro-only priority ranking currently applied',
      'No separate Pro-specific lead allowance is currently enforced',
      'No advanced multi-artisan team collaboration yet',
      'Access period: one month after each verified payment',
      'Renewal and cancellation arrangements are subject to Payfast and the provider billing terms',
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
