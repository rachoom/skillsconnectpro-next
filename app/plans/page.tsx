import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  HardHat,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { providerPlans } from '@/app/provider-plans/planCatalog';
import { hardwareQuotesEnabled } from '@/services/hardwareFeature';
import { customerPlanBenefits, customerTheme, providerTheme } from '@/services/planPresentation';

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
    code: 'free', name: 'Free', price: 'R0', period: 'to get started', description: 'A practical starting point for understanding one job and taking the first step.', button: 'Start for free', featured: false,
    features: [...customerPlanBenefits.free, ...(hardwareQuotesEnabled() ? ['Hardware quotation requests'] : [])],
    visual: { icon: Sparkles, image: '/mzansi-services-hero-v2.webp', eyebrow: 'Get started', outcome: 'Turn a problem into a clear next step.' },
  },
  {
    code: 'basic_30', name: 'Basic', price: 'R29', period: 'for 30 days', description: 'More photo analyses and four times the document slots for a focused project. Same easy tools, more room to use them.', button: 'Choose Basic', featured: false,
    features: [...customerPlanBenefits.basic_30, ...(hardwareQuotesEnabled() ? ['Hardware quotation requests'] : [])],
    visual: { icon: ClipboardCheck, image: '/calculator-planning-desk.jpg', eyebrow: 'For a focused project', outcome: 'Keep costs, materials and project details together.' },
  },
  {
    code: 'project_pass_90', name: 'Home Project Pass', price: 'R79', period: 'for 90 days', description: 'More active projects, more analyses, more document storage and milestone management for a longer project.', button: 'Choose Project Pass', featured: true,
    features: [...customerPlanBenefits.project_pass_90, ...(hardwareQuotesEnabled() ? ['Hardware quotation requests'] : [])],
    visual: { icon: HardHat, image: '/Cards/builders.png', eyebrow: 'Best value', outcome: 'Stay in control from first idea to final handover.' },
  },
];

const customerPlanBackgrounds: Record<string, string> = {
  free: '/plan-backgrounds/plan-starter.webp',
  basic_30: '/plan-backgrounds/plan-lead4.webp',
  project_pass_90: '/plan-backgrounds/plan-lead10.webp',
};

const providerPlanVisuals: Record<string, { image: string; icon: PlanVisual['icon']; wash: string; glow: string }> = {
  starter: { image: '/plan-backgrounds/plan-starter.webp', icon: HardHat, wash: 'bg-[radial-gradient(circle_at_12%_12%,rgba(45,212,191,.24),transparent_17rem),linear-gradient(180deg,rgba(0,10,7,.12),rgba(0,8,5,.82))]', glow: 'shadow-[0_22px_70px_rgba(45,212,191,.13)]' },
  growth: { image: '/plan-backgrounds/plan-growth.webp', icon: Sparkles, wash: 'bg-[radial-gradient(circle_at_12%_12%,rgba(167,139,250,.25),transparent_17rem),linear-gradient(180deg,rgba(13,5,28,.08),rgba(10,4,23,.84))]', glow: 'shadow-[0_22px_70px_rgba(167,139,250,.15)]' },
  pro: { image: '/plan-backgrounds/plan-pro.webp', icon: BadgeCheck, wash: 'bg-[radial-gradient(circle_at_12%_12%,rgba(251,146,60,.25),transparent_17rem),linear-gradient(180deg,rgba(26,9,2,.08),rgba(19,7,2,.84))]', glow: 'shadow-[0_22px_70px_rgba(251,146,60,.14)]' },
  'lead-pack-4': { image: '/plan-backgrounds/plan-lead4.webp', icon: Gauge, wash: 'bg-[radial-gradient(circle_at_18%_10%,rgba(56,189,248,.27),transparent_15rem),linear-gradient(180deg,rgba(3,15,27,.08),rgba(3,13,23,.82))]', glow: 'shadow-[0_18px_55px_rgba(56,189,248,.13)]' },
  'lead-pack-10': { image: '/plan-backgrounds/plan-lead10.webp', icon: ClipboardCheck, wash: 'bg-[radial-gradient(circle_at_18%_10%,rgba(244,114,182,.24),transparent_15rem),linear-gradient(180deg,rgba(25,5,14,.06),rgba(20,5,12,.84))]', glow: 'shadow-[0_18px_55px_rgba(244,114,182,.13)]' },
  'lead-pack-25': { image: '/plan-backgrounds/plan-lead25.webp', icon: UsersRound, wash: 'bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,.24),transparent_15rem),linear-gradient(180deg,rgba(3,18,22,.07),rgba(3,15,19,.84))]', glow: 'shadow-[0_18px_55px_rgba(34,211,238,.13)]' },
};

const comparisonRows = [
  ['Account registration', 'Included', 'Included', 'Included'],
  ['AI Project Assistant', 'Included', 'Included', 'Included'],
  ['Project photo analyses', '1', '2', '5'],
  ['Active project workspaces', '1', '1', '3'],
  ['Documents per project', '5', '20', '50'],
  ['Maximum document size', '5 MB', '10 MB', '10 MB'],
  ['Storage per project', '25 MB', '200 MB', '500 MB'],
  ['Materials estimates and editable lists', 'Included', 'Included', 'Included'],
  ['Expense and budget records', 'Included', 'Included', 'Included'],
  ...(hardwareQuotesEnabled() ? [['Hardware quotation requests', '1', '3', '10']] : []),
  ['Find and contact artisans', 'Included', 'Included', 'Included'],
  ['Milestone management', '—', '—', 'Included'],
  ['Expanded pass duration', '—', '30 days', '90 days'],
];

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams;
  const providerQuery = provider && /^\d+$/.test(provider) ? `?provider=${encodeURIComponent(provider)}` : '';
  const subscriptions = providerPlans.filter((plan) => plan.kind === 'subscription');
  const packs = providerPlans.filter((plan) => plan.kind === 'lead_pack');

  return <main className="min-h-screen overflow-hidden bg-[#061008] text-[#f8f3e5]">
    <nav className="relative z-30 border-b border-white/10 bg-[#061008]/88 px-4 py-3.5 backdrop-blur-xl md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <Link href="/" aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={188} height={50} priority /></Link>
      <div className="hidden items-center gap-6 text-sm font-bold text-white/65 md:flex"><a href="#homeowners" className="transition hover:text-[#ffe17a]">Homeowner plans</a><a href="#providers" className="transition hover:text-[#ffe17a]">Provider plans</a></div>
      <Link href="/my-projects" className="rounded-xl border border-[#ffd75f]/45 bg-[#ffd75f]/[.06] px-3.5 py-2.5 text-xs font-black text-[#ffe17a] transition hover:bg-[#ffd75f] hover:text-[#241b00]">My Projects</Link>
    </div></nav>

    <section className="border-b border-white/10 px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd21f]">Skills Connect Pro</p>
        <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] text-white md:text-6xl">Plans</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">Choose the plan that fits how you use Skills Connect Pro.</p>
      </div>
    </section>

    <section id="homeowners" className="relative scroll-mt-5 px-4 py-14 md:px-8 md:py-20"><div className="pointer-events-none absolute left-1/2 top-16 h-80 w-[min(90vw,68rem)] -translate-x-1/2 rounded-full bg-[#f9ca32]/[.08] blur-3xl" /><div className="relative mx-auto max-w-7xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-3xl"><div className="flex items-center gap-2 text-[#ffe17a]"><FolderKanban size={19} /><span className="text-xs font-black uppercase tracking-[0.16em]">Homeowner plans</span></div><h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-[#fff8e8] md:text-5xl">Choose your project plan.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">Free, 30-day and 90-day options for different levels of project support.</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[.045] px-4 py-3 text-sm text-white/70 backdrop-blur-xl"><ShieldCheck className="shrink-0 text-[#ffe17a]" size={20} /><span>Once-off homeowner passes. No surprise recurring subscription.</span></div></div>

      <div className="mt-9 grid gap-4 lg:grid-cols-3">{customerPlans.map((plan) => {
        const Icon = plan.visual.icon;
        const theme = customerTheme(plan.code);
        const background = customerPlanBackgrounds[plan.code] ?? customerPlanBackgrounds.basic_30;
        return <article key={plan.name} className={`group relative isolate overflow-hidden rounded-[2rem] border p-2 shadow-2xl transition duration-300 hover:-translate-y-1 ${theme.card}`}>
          <Image src={background} alt="" fill className="-z-30 object-cover opacity-90 transition duration-700 group-hover:scale-105" sizes="(min-width:1024px) 33vw, 100vw" />
          <div className="-z-20 absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,6,.20),rgba(3,8,6,.80)_48%,rgba(2,6,4,.95))]" />
          <div className="-z-10 absolute inset-0 bg-[radial-gradient(circle_at_72%_8%,rgba(255,213,95,.30),transparent_14rem)]" />
          {plan.featured && <span className="absolute left-6 top-4 z-20 rounded-full border border-[#ffe17a]/45 bg-[#120e05]/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-[#ffe17a] backdrop-blur-xl">Best value</span>}
          <div className="relative flex min-h-[190px] flex-col justify-end overflow-hidden rounded-[1.55rem] border border-white/15 bg-black/15 p-5 backdrop-blur-[2px]">
            <div className="absolute -right-10 -top-12 size-40 rounded-full bg-[#ffd75f]/20 blur-3xl" />
            <div className="relative flex items-end justify-between gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#ffe17a]">{plan.visual.eyebrow}</p><p className="mt-2 max-w-[15rem] text-lg font-black leading-tight text-white">{plan.visual.outcome}</p></div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#ffe17a]/45 bg-[#080703]/55 text-[#ffd75f] shadow-[0_0_28px_rgba(255,215,95,.17)] backdrop-blur-xl"><Icon size={22} /></span>
            </div>
          </div>
          <div className="relative mt-2 rounded-[1.55rem] border border-white/12 bg-black/42 px-4 pb-4 pt-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-2xl">
            <p className={`text-[11px] font-black uppercase tracking-[.16em] ${theme.price}`}>{plan.name === 'Home Project Pass' ? 'Complete workspace' : 'Project workspace'}</p>
            <div className="mt-2 flex items-end justify-between gap-3"><h3 className="text-3xl font-black tracking-[-.035em] text-white">{plan.name}</h3><p className={`shrink-0 text-2xl font-black ${theme.price}`}>{plan.price}<span className="ml-1 text-xs font-bold text-white/65">{plan.period}</span></p></div>
            <p className="mt-4 min-h-12 text-sm leading-6 text-white/70">{plan.description}</p>
            <ul className="mt-5 space-y-2.5 text-sm leading-5 text-white/90">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check className={`mt-0.5 shrink-0 ${theme.check}`} size={16} />{feature}</li>)}</ul>
            <Link href={plan.code === 'free' ? '/assistant' : `/customer-checkout?plan=${plan.code}`} className={`mt-6 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition ${theme.button}`}>{plan.button}<ArrowRight size={17} /></Link>
          </div>
        </article>;
      })}</div>

      <div className="mt-10 overflow-x-auto rounded-[2rem] border border-white/15 bg-[#101811]/70 shadow-xl shadow-black/20 backdrop-blur-2xl"><table className="min-w-[720px] w-full text-left text-sm"><caption className="caption-top px-6 pb-4 pt-6 text-left text-xl font-black text-[#fff8e8]">Compare project-plan access</caption><thead className="border-y border-white/10 text-xs uppercase tracking-[0.12em] text-white/55"><tr><th className="px-6 py-4">Feature</th><th className="px-4 py-4 text-[#66efa8]">Free</th><th className="px-4 py-4 text-[#7bc0ff]">Basic</th><th className="px-4 py-4 text-[#ffe17a]">Home Project Pass</th></tr></thead><tbody>{comparisonRows.map(([feature, free, basic, pass]) => <tr key={feature} className="border-b border-white/10 last:border-0"><th scope="row" className="px-6 py-3.5 font-bold text-white">{feature}</th><td className="px-4 py-3.5 text-white/62">{free}</td><td className="px-4 py-3.5 text-white/62">{basic}</td><td className="px-4 py-3.5 font-bold text-[#ffe698]">{pass}</td></tr>)}</tbody></table></div>
      <p className="mt-5 text-xs leading-5 text-white/45">Project plans provide private planning and workspace access. A provider may still need to inspect the site before confirming work, price or construction detail.</p>
    </div></section>

    <section id="providers" className="relative scroll-mt-5 border-t border-white/10 px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[#ffe17a]"><UsersRound size={19} /><span className="text-xs font-black uppercase tracking-[0.16em]">Provider plans</span></div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-[#fff8e8] md:text-5xl">Choose your provider plan.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">Monthly subscriptions and flexible lead packs for different levels of provider access.</p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">{subscriptions.map((plan) => {
          const theme = providerTheme(plan.slug);
          const visual = providerPlanVisuals[plan.slug] ?? providerPlanVisuals.starter;
          const Icon = visual.icon;
          return <article key={plan.slug} className={`group relative isolate overflow-hidden rounded-[2rem] border p-2 transition hover:-translate-y-1 ${theme.card} ${visual.glow}`}>
            <Image src={visual.image} alt="" fill className="-z-30 object-cover opacity-95 transition duration-700 group-hover:scale-105" sizes="(min-width:768px) 33vw, 100vw" />
            <div className={`-z-20 absolute inset-0 ${visual.wash}`} /><div className="-z-10 absolute inset-0 bg-[radial-gradient(circle_at_75%_0%,rgba(255,215,95,.28),transparent_12rem)]" />
            {plan.name === 'Growth' && <span className="absolute left-6 top-0 z-20 rounded-b-xl border-x border-b border-[#ffe17a]/35 bg-[#120e05]/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ffe17a] backdrop-blur-xl">Most popular</span>}
            <div className="relative rounded-[1.55rem] border border-white/14 bg-black/38 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.09)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4"><div><p className={`text-[11px] font-black uppercase tracking-[0.14em] ${theme.price}`}>{plan.audience}</p><h3 className="mt-5 text-3xl font-black tracking-[-.035em] text-white">{plan.name}</h3></div><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#ffe17a]/45 bg-[#090703]/60 text-[#ffd75f] shadow-[0_0_30px_rgba(255,215,95,.18)] backdrop-blur-xl"><Icon size={22} /></span></div>
              <p className={`mt-3 text-4xl font-black ${theme.price}`}>{plan.price}<span className="text-sm font-bold text-white/65"> / month</span></p>
              <div className="mt-5 h-px bg-white/15" />
              <ul className="mt-5 space-y-3 text-sm leading-5 text-white/90">{plan.included.map((feature) => <li key={feature} className="flex gap-2.5"><Check className={`mt-0.5 shrink-0 ${theme.check}`} size={16} />{feature}</li>)}</ul>
              <Link href={`/provider-plans/${plan.slug}${providerQuery}`} className={`mt-7 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black ${theme.button}`}>Explore {plan.name}<ArrowRight size={17} /></Link>
            </div>
          </article>;
        })}</div>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/15 bg-white/[.04] p-5 shadow-xl shadow-black/20 backdrop-blur-2xl md:p-7">
          <div><div className="flex items-center gap-2 text-[#ffe17a]"><BadgeCheck size={18} /><span className="text-xs font-black uppercase tracking-[0.14em]">Flexible lead packs</span></div><h3 className="mt-3 text-2xl font-black text-[#fff8e8]">Prefer to top up only when you need to?</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Use lead credits when your capacity and appetite for new work changes.</p></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">{packs.map((pack) => {
            const theme = providerTheme(pack.slug);
            const visual = providerPlanVisuals[pack.slug] ?? providerPlanVisuals['lead-pack-4'];
            const Icon = visual.icon;
            return <Link key={pack.slug} href={`/provider-plans/${pack.slug}${providerQuery}`} className={`group/pack relative isolate min-h-[190px] overflow-hidden rounded-[1.5rem] border p-2 transition hover:-translate-y-1 ${theme.card} ${visual.glow}`}>
              <Image src={visual.image} alt="" fill className="-z-30 object-cover opacity-95 transition duration-700 group-hover/pack:scale-105" sizes="(min-width:768px) 33vw, 100vw" />
              <div className={`-z-20 absolute inset-0 ${visual.wash}`} /><div className="-z-10 absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,215,95,.25),transparent_10rem)]" />
              <div className="flex h-full min-h-[174px] flex-col justify-between rounded-[1.2rem] border border-white/14 bg-black/36 p-4 text-white backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3"><div><span className={`text-[10px] font-black uppercase tracking-[.15em] ${theme.price}`}>{pack.audience}</span><h4 className="mt-2 text-xl font-black leading-tight">{pack.name}</h4></div><span className="flex size-10 items-center justify-center rounded-xl border border-[#ffe17a]/45 bg-black/50 text-[#ffd75f]"><Icon size={18} /></span></div>
                <div className="mt-6 flex items-end justify-between gap-3"><span className={`text-2xl font-black ${theme.price}`}>{pack.price}</span><span className="inline-flex items-center gap-1 text-xs font-black text-white/80">View pack <ArrowRight size={15} /></span></div>
              </div>
            </Link>;
          })}</div>
        </div>
      </div>
    </section>

    <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-white/40 md:px-8">Homeowner project passes are once-off access periods. Provider subscriptions and lead packs are shown separately.</footer>
  </main>;
}
