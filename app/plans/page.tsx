import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  HardHat,
  ImageIcon,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { providerPlans } from '@/app/provider-plans/planCatalog';
import { hardwareQuotesEnabled } from '@/services/hardwareFeature';

export const metadata: Metadata = {
  title: 'Plans | Skills Connect Pro',
  description: 'Customer project plans and provider access plans for Skills Connect Pro.',
};

type PlanVisual = {
  icon: ComponentType<{ size?: number; className?: string }>;
  image: string;
  eyebrow: string;
  outcome: string;
};

const customerPlans: Array<{
  code: string; name: string; price: string; period: string; description: string; button: string; featured: boolean; features: string[]; visual: PlanVisual;
}> = [
  {
    code: 'free', name: 'Free', price: 'R0', period: 'to get started', description: 'A practical starting point for understanding one job and taking the first step.', button: 'Start a project', featured: false,
    features: ['Account registration', 'Basic AI Project Assistant', '1 project photo analysis', 'Basic materials calculation', ...(hardwareQuotesEnabled() ? ['Hardware quotation requests'] : []), 'Find suitable artisans', '1 active project', 'Basic project budget', 'Limited expense tracking and receipt storage'],
    visual: { icon: Sparkles, image: '/mzansi-services-hero-v2.webp', eyebrow: 'Start with clarity', outcome: 'Turn a problem into a clear next step.' },
  },
  {
    code: 'basic_30', name: 'Basic', price: 'R29', period: 'for 30 days', description: 'For a single project that needs clearer planning, costs and documents in one place.', button: 'Choose Basic', featured: false,
    features: ['Everything in Free', '2 project photo analyses', 'Full materials calculations', '1 active project', 'Expense tracking', 'Limited receipt storage', 'Limited artisan collaboration', 'Basic project budget'],
    visual: { icon: ClipboardCheck, image: '/calculator-planning-desk.jpg', eyebrow: 'Bring the numbers together', outcome: 'Costs, materials and project details—kept together.' },
  },
  {
    code: 'project_pass_90', name: 'Home Project Pass', price: 'R79', period: 'for 90 days', description: 'The complete project workspace for homeowners coordinating a bigger build or renovation.', button: 'Choose Project Pass', featured: true,
    features: ['Everything in Basic', '5 project photo analyses', '3 active projects', 'Advanced project budget', 'Expanded receipt storage', 'Project timeline and milestones', 'Project reports', 'Collaborate with artisans', 'Project document export'],
    visual: { icon: HardHat, image: '/Cards/builders.png', eyebrow: 'Your complete project command centre', outcome: 'Stay in control from first idea to final handover.' },
  },
];

const comparisonRows = [
  ['Account registration', 'Included', 'Included', 'Included'], ['Basic AI Project Assistant', 'Included', 'Included', 'Included'], ['Project photo analysis', '1', '2', '5'], ['Materials calculations', 'Basic', 'Full', 'Full'], ...(hardwareQuotesEnabled() ? [['Hardware quotation requests', 'Included', 'Included', 'Included']] : []), ['Find artisans', 'Included', 'Included', 'Included'], ['Active projects', '1', '1', '3'], ['Project budget', 'Basic', 'Basic', 'Advanced'], ['Expense tracking', 'Limited', 'Included', 'Included'], ['Receipt storage', 'Limited', 'Limited', 'Expanded'], ['Project timeline', '—', '—', 'Included'], ['Milestone management', '—', '—', 'Included'], ['Project reports', '—', '—', 'Included'], ['Collaborate with artisans', '—', 'Limited', 'Included'], ['Project document export', '—', 'Limited', 'Included'],
];

const workspaceMoments: Array<{ icon: PlanVisual['icon']; title: string; text: string }> = [
  { icon: ImageIcon, title: 'Show the job', text: 'Use a photo or your own words to make the problem clearer.' },
  { icon: Gauge, title: 'See the numbers', text: 'Keep early material, budget and estimate thinking in one place.' },
  { icon: UsersRound, title: 'Move with confidence', text: 'Get ready to find suitable local professionals when you need them.' },
];

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams;
  const providerQuery = provider && /^\d+$/.test(provider) ? `?provider=${encodeURIComponent(provider)}` : '';
  const subscriptions = providerPlans.filter((plan) => plan.kind === 'subscription');
  const packs = providerPlans.filter((plan) => plan.kind === 'lead_pack');

  return <main className="min-h-screen overflow-hidden bg-[#071009] text-[#f8f3e5]">
    <nav className="relative z-20 border-b border-white/10 bg-[#071009]/75 px-4 py-3.5 backdrop-blur-xl md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <Link href="/" aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={188} height={50} priority /></Link>
      <div className="hidden items-center gap-6 text-sm font-bold text-white/65 md:flex"><a href="#homeowners" className="transition hover:text-[#ffe17a]">For homeowners</a><a href="#providers" className="transition hover:text-[#ffe17a]">For providers</a></div>
      <Link href="/my-projects" className="rounded-xl border border-[#ffd75f]/45 bg-[#ffd75f]/[.06] px-3.5 py-2.5 text-xs font-black text-[#ffe17a] transition hover:bg-[#ffd75f] hover:text-[#241b00]">My Projects</Link>
    </div></nav>

    <section className="relative isolate border-b border-white/10"><Image src="/calculator-planning-desk.jpg" alt="Project planning desk with drawings, tape measure and calculator" fill priority className="-z-20 object-cover object-center" sizes="100vw" /><div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(4,11,7,.98)_5%,rgba(5,13,8,.88)_47%,rgba(6,11,8,.58)_100%)]" /><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_18%,rgba(255,205,49,.22),transparent_22rem)]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-8 md:py-24 lg:grid-cols-[1.18fr_.82fr] lg:items-end"><div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-[#ffd75f]/35 bg-[#171a10]/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ffe17a] shadow-xl shadow-black/25 backdrop-blur-xl"><Sparkles size={14} /> The job, made clearer</div>
        <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#fff8e8] md:text-6xl">Choose the support that makes your next move feel simple.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 md:text-lg">From a quick AI second opinion to a full project workspace, Skills Connect Pro helps homeowners plan with more clarity—and helps local providers stay ready for suitable work.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href="#homeowners" className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd75f] px-5 py-3.5 text-sm font-black text-[#241b00] shadow-[0_14px_36px_rgba(255,215,95,.22)] transition hover:-translate-y-0.5">Homeowner project plans <ArrowRight size={18} /></a><a href="#providers" className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/20 px-5 py-3.5 text-sm font-black text-white backdrop-blur transition hover:border-[#ffe17a] hover:text-[#ffe17a]">Provider access plans</a></div>
      </div><aside className="rounded-[2rem] border border-white/20 bg-white/[.08] p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#ffe17a]">Made for real jobs</p><h2 className="mt-2 text-2xl font-black leading-tight">A calmer way to make the first decision.</h2></div><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#ffe17a]/35 bg-[#ffd75f]/15 text-[#ffe17a]"><FolderKanban size={21} /></span></div><div className="mt-6 grid gap-3"><div className="rounded-2xl border border-white/12 bg-black/20 px-4 py-3"><span className="text-xs font-black uppercase tracking-wider text-white/45">Start</span><p className="mt-1 text-sm font-bold text-white">Describe the job or add a photo</p></div><div className="rounded-2xl border border-white/12 bg-black/20 px-4 py-3"><span className="text-xs font-black uppercase tracking-wider text-white/45">Organise</span><p className="mt-1 text-sm font-bold text-white">Keep plans, numbers and documents together</p></div><div className="rounded-2xl border border-[#ffd75f]/30 bg-[#ffd75f]/10 px-4 py-3"><span className="text-xs font-black uppercase tracking-wider text-[#ffe17a]">When ready</span><p className="mt-1 text-sm font-bold text-white">Connect to the right local help</p></div></div></aside></div>
    </section>

    <section id="homeowners" className="relative scroll-mt-5 px-4 py-14 md:px-8 md:py-20"><div className="pointer-events-none absolute left-1/2 top-16 h-80 w-[min(90vw,68rem)] -translate-x-1/2 rounded-full bg-[#f9ca32]/[.09] blur-3xl" /><div className="relative mx-auto max-w-7xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-3xl"><div className="flex items-center gap-2 text-[#ffe17a]"><FolderKanban size={19} /><span className="text-xs font-black uppercase tracking-[0.16em]">For homeowners</span></div><h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-[#fff8e8] md:text-5xl">Your project has a home before the building starts.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">Use the free assistant to get your bearings. Upgrade only when the job needs more detail, more organisation or a stronger record of the work.</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[.045] px-4 py-3 text-sm text-white/70 backdrop-blur-xl"><ShieldCheck className="shrink-0 text-[#ffe17a]" size={20} /><span>Once-off project passes. No surprise recurring homeowner subscription.</span></div></div>

      <div className="mt-9 grid gap-4 lg:grid-cols-3">{customerPlans.map((plan) => { const Icon = plan.visual.icon; return <article key={plan.name} className={`group relative overflow-hidden rounded-[2rem] border p-2 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 ${plan.featured ? 'border-[#ffd75f]/85 bg-[linear-gradient(145deg,#f9ca32_0%,#dcae19_100%)] text-[#241b00] shadow-[#e8b91d]/20' : 'border-white/15 bg-white/[.055] text-[#f8f3e5] backdrop-blur-2xl'}`}>
        {plan.featured && <span className="absolute left-6 top-4 z-10 rounded-full bg-[#191207] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-[#ffe17a]">Best value</span>}
        <div className="relative h-44 overflow-hidden rounded-[1.55rem]"><Image src={plan.visual.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 32vw, 100vw" /><div className={`absolute inset-0 ${plan.featured ? 'bg-[linear-gradient(180deg,transparent,rgba(46,27,0,.78))]' : 'bg-[linear-gradient(180deg,rgba(3,10,5,.04),rgba(3,10,5,.88))]'}`} /><div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3"><div><p className={`text-[10px] font-black uppercase tracking-[.16em] ${plan.featured ? 'text-[#ffe78c]' : 'text-[#ffe17a]'}`}>{plan.visual.eyebrow}</p><p className="mt-1 text-sm font-bold leading-5 text-white">{plan.visual.outcome}</p></div><span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border ${plan.featured ? 'border-[#ffe17a]/60 bg-[#0f0c06]/70 text-[#ffe17a]' : 'border-white/25 bg-black/35 text-[#ffe17a]'} backdrop-blur`}><Icon size={19} /></span></div></div>
        <div className="px-4 pb-4 pt-5"><p className={`text-[11px] font-black uppercase tracking-[.16em] ${plan.featured ? 'text-[#674b00]' : 'text-[#ffe17a]'}`}>{plan.name === 'Home Project Pass' ? 'Complete workspace' : 'Project workspace'}</p><div className="mt-2 flex items-end justify-between gap-3"><h3 className="text-3xl font-black tracking-[-.035em]">{plan.name}</h3><p className="shrink-0 text-2xl font-black">{plan.price}<span className="ml-1 text-xs font-bold">{plan.period}</span></p></div><p className={`mt-4 min-h-12 text-sm leading-6 ${plan.featured ? 'text-[#553d08]' : 'text-white/68'}`}>{plan.description}</p><ul className="mt-5 space-y-2.5 text-sm leading-5">{plan.features.slice(0, 5).map((feature) => <li key={feature} className="flex gap-2.5"><Check className={`mt-0.5 shrink-0 ${plan.featured ? 'text-[#483300]' : 'text-[#ffe17a]'}`} size={16} />{feature}</li>)}</ul>{plan.features.length > 5 && <p className={`mt-4 text-xs font-bold ${plan.featured ? 'text-[#674b00]' : 'text-white/52'}`}>Plus {plan.features.length - 5} more workspace feature{plan.features.length - 5 === 1 ? '' : 's'} below.</p>}<Link href={plan.code === 'free' ? '/assistant' : `/customer-checkout?plan=${plan.code}`} className={`mt-6 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition ${plan.featured ? 'bg-[#171107] text-[#ffe17a] hover:bg-[#302408]' : 'bg-[#ffd75f] text-[#241b00] hover:bg-[#ffe17a]'}`}>{plan.button}<ArrowRight size={17} /></Link></div>
      </article>; })}</div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">{workspaceMoments.map((moment) => { const Icon = moment.icon; return <article key={moment.title} className="flex gap-4 rounded-2xl border border-white/12 bg-white/[.04] p-5 backdrop-blur-xl"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#ffd75f]/25 bg-[#ffd75f]/10 text-[#ffe17a]"><Icon size={19} /></span><div><h3 className="font-black text-white">{moment.title}</h3><p className="mt-1 text-sm leading-5 text-white/60">{moment.text}</p></div></article>; })}</div>

      <div className="mt-10 overflow-x-auto rounded-[2rem] border border-white/15 bg-[#101811]/70 shadow-xl shadow-black/20 backdrop-blur-2xl"><table className="min-w-[720px] w-full text-left text-sm"><caption className="caption-top px-6 pb-4 pt-6 text-left text-xl font-black text-[#fff8e8]">Compare project-plan access</caption><thead className="border-y border-white/10 text-xs uppercase tracking-[0.12em] text-white/55"><tr><th className="px-6 py-4">Feature</th><th className="px-4 py-4">Free</th><th className="px-4 py-4">Basic</th><th className="px-4 py-4 text-[#ffe17a]">Home Project Pass</th></tr></thead><tbody>{comparisonRows.map(([feature, free, basic, pass]) => <tr key={feature} className="border-b border-white/10 last:border-0"><th scope="row" className="px-6 py-3.5 font-bold text-white">{feature}</th><td className="px-4 py-3.5 text-white/62">{free}</td><td className="px-4 py-3.5 text-white/62">{basic}</td><td className="px-4 py-3.5 font-bold text-[#ffe698]">{pass}</td></tr>)}</tbody></table></div>
      <p className="mt-5 text-xs leading-5 text-white/45">Project plans provide private planning and workspace access. A provider may still need to inspect the site before confirming work, price or construction detail.</p>
    </div></section>

    <section id="providers" className="relative isolate scroll-mt-5 border-t border-white/10 px-4 py-14 md:px-8 md:py-20"><Image src="/artisans/hero-welder.jpg" alt="Skilled local provider at work" fill className="-z-20 object-cover object-center opacity-30" sizes="100vw" /><div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(5,13,8,.98),rgba(5,13,8,.87),rgba(5,13,8,.93))]" /><div className="relative mx-auto max-w-7xl"><div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-3xl"><div className="flex items-center gap-2 text-[#ffe17a]"><UsersRound size={19} /><span className="text-xs font-black uppercase tracking-[0.16em]">For providers</span></div><h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-[#fff8e8] md:text-5xl">A cleaner route to suitable local work.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">Approved providers begin with three customer opportunities on us. When you are ready for more, choose the access that matches your pace of work.</p></div><div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white/70 backdrop-blur-xl"><span className="font-black text-[#ffe17a]">3 complimentary leads</span><span className="mx-2 text-white/30">•</span>before choosing access</div></div>
      <div className="mt-9 grid gap-4 md:grid-cols-3">{subscriptions.map((plan) => <article key={plan.slug} className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl shadow-black/20 backdrop-blur-2xl transition hover:-translate-y-1 ${plan.name === 'Growth' ? 'border-[#ffd75f]/85 bg-[linear-gradient(145deg,rgba(255,215,95,.98),rgba(236,182,32,.96))] text-[#241b00] shadow-[#e8b91d]/20' : 'border-white/15 bg-[#0d1710]/80 text-[#f8f3e5]'}`}>
        {plan.name === 'Growth' && <span className="absolute -top-0 left-6 rounded-b-xl bg-[#191207] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ffe17a]">Most popular</span>}<p className={`text-[11px] font-black uppercase tracking-[0.14em] ${plan.name === 'Growth' ? 'text-[#674b00]' : 'text-[#ffe17a]'}`}>{plan.audience}</p><h3 className="mt-5 text-3xl font-black tracking-[-.035em]">{plan.name}</h3><p className="mt-3 text-4xl font-black">{plan.price}<span className="text-sm font-bold"> / month</span></p><div className={`mt-5 h-px ${plan.name === 'Growth' ? 'bg-[#4b3500]/30' : 'bg-white/15'}`} /><ul className="mt-5 space-y-3 text-sm leading-5">{plan.included.slice(0, 4).map((feature) => <li key={feature} className="flex gap-2.5"><Check className="mt-0.5 shrink-0" size={16} />{feature}</li>)}</ul><Link href={`/provider-plans/${plan.slug}${providerQuery}`} className={`mt-7 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black ${plan.name === 'Growth' ? 'bg-[#171107] text-[#ffe17a]' : 'bg-[#ffd75f] text-[#241b00]'}`}>Explore {plan.name}<ArrowRight size={17} /></Link>
      </article>)}</div>
      <div className="mt-6 rounded-[2rem] border border-white/15 bg-white/[.06] p-6 shadow-xl shadow-black/15 backdrop-blur-2xl md:flex md:items-center md:justify-between md:gap-10 md:p-8"><div><div className="flex items-center gap-2 text-[#ffe17a]"><BadgeCheck size={18} /><span className="text-xs font-black uppercase tracking-[0.14em]">Flexible lead packs</span></div><h3 className="mt-3 text-2xl font-black text-[#fff8e8]">Prefer to top up only when you need to?</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Use lead credits when your capacity and appetite for new work changes.</p></div><div className="mt-5 grid grid-cols-3 gap-2 md:mt-0">{packs.map((pack) => <Link key={pack.slug} href={`/provider-plans/${pack.slug}${providerQuery}`} className="rounded-2xl border border-white/15 bg-black/25 px-3 py-3.5 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:border-[#ffd75f] hover:bg-[#ffd75f]/10"><span className="block text-[#ffe17a]">{pack.price}</span><span className="mt-1 block text-white/75">{pack.name}</span></Link>)}</div></div>
    </div></section>

    <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-white/40 md:px-8"><span className="inline-flex items-center gap-2"><CalendarDays size={14} /> Project passes are once-off access periods; provider subscriptions and lead packs are shown separately.</span></footer>
  </main>;
}
