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

const journeySteps: Array<{ icon: PlanVisual['icon']; step: string; title: string; text: string; image: string; note: string }> = [
  { icon: ImageIcon, step: '01', title: 'Describe the job', text: 'Tell us what you need or add a photo. Start with what you know—we help make the problem clearer.', image: '/intake-request-illustration.png', note: 'Photo or plain language' },
  { icon: Gauge, step: '02', title: 'Get a clear plan', text: 'See materials, early costs, next steps and project information organised in one place.', image: '/calculator-planning-desk.jpg', note: 'Less guesswork, more clarity' },
  { icon: UsersRound, step: '03', title: 'Connect and move', text: 'When you are ready, reach suitable local professionals with the project context already prepared.', image: '/Cards/builders.png', note: 'Trusted local help' },
];

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams;
  const providerQuery = provider && /^\d+$/.test(provider) ? `?provider=${encodeURIComponent(provider)}` : '';
  const subscriptions = providerPlans.filter((plan) => plan.kind === 'subscription');
  const packs = providerPlans.filter((plan) => plan.kind === 'lead_pack');

  return <main className="min-h-screen overflow-hidden bg-[#061008] text-[#f8f3e5]">
    <nav className="relative z-30 border-b border-white/10 bg-[#061008]/88 px-4 py-3.5 backdrop-blur-xl md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <Link href="/" aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={188} height={50} priority /></Link>
      <div className="hidden items-center gap-6 text-sm font-bold text-white/65 md:flex"><a href="#how-it-works" className="transition hover:text-[#ffe17a]">How it works</a><a href="#homeowners" className="transition hover:text-[#ffe17a]">Homeowner plans</a><a href="#providers" className="transition hover:text-[#ffe17a]">Provider plans</a></div>
      <Link href="/my-projects" className="rounded-xl border border-[#ffd75f]/45 bg-[#ffd75f]/[.06] px-3.5 py-2.5 text-xs font-black text-[#ffe17a] transition hover:bg-[#ffd75f] hover:text-[#241b00]">My Projects</Link>
    </div></nav>

    <section className="relative isolate min-h-[720px] border-b border-white/10 lg:min-h-[760px]">
      <Image src="/mzansi-services-hero-v2.webp" alt="South African service professionals ready to help with local projects" fill priority className="-z-30 object-cover object-[68%_center]" sizes="100vw" />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(92deg,rgba(2,9,5,.99)_0%,rgba(3,13,7,.95)_35%,rgba(4,13,8,.72)_61%,rgba(3,10,6,.34)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_73%_20%,rgba(255,197,38,.28),transparent_22rem)]" />

      <div className="mx-auto grid min-h-[720px] max-w-7xl gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd21f] md:text-sm">Real projects. Real people. Real progress.</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.94] tracking-[-0.055em] text-white sm:text-6xl md:text-7xl">Turn your home ideas into <span className="text-[#ffd21f]">real results.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 md:text-xl md:leading-8">Plan with confidence, understand the numbers, keep your project organised and connect with trusted local professionals—all from one place.</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/assistant" className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd21f] px-6 py-4 text-sm font-black text-[#211800] shadow-[0_18px_45px_rgba(255,199,27,.26)] transition hover:-translate-y-0.5 hover:bg-[#ffe06b]">Start a project <ArrowRight size={18} /></Link>
            <a href="#homeowners" className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/25 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:border-[#ffd21f] hover:text-[#ffd21f]">View plans</a>
          </div>

          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/14 bg-black/30 p-4 backdrop-blur-xl"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#ffd21f]">Clear</p><p className="mt-1 text-sm font-bold text-white">Project planning</p></div>
            <div className="rounded-2xl border border-white/14 bg-black/30 p-4 backdrop-blur-xl"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#ffd21f]">Know</p><p className="mt-1 text-sm font-bold text-white">Materials & costs</p></div>
            <div className="rounded-2xl border border-white/14 bg-black/30 p-4 backdrop-blur-xl"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#ffd21f]">Connect</p><p className="mt-1 text-sm font-bold text-white">Local professionals</p></div>
          </div>
        </div>

        <div className="relative hidden min-h-[560px] lg:block">
          <div className="absolute bottom-5 right-0 w-[86%] overflow-hidden rounded-[2rem] border border-white/20 bg-black/35 p-3 shadow-2xl shadow-black/45 backdrop-blur-xl">
            <div className="relative h-[270px] overflow-hidden rounded-[1.5rem]">
              <Image src="/calculator-planning-desk.jpg" alt="Project plans, tools and cost planning" fill className="object-cover" sizes="40vw" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(3,9,5,.78))]" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#ffd21f]">Everything in one place</p>
                <p className="mt-1 max-w-sm text-xl font-black leading-tight text-white">Your plan, numbers and next move—kept together.</p>
              </div>
            </div>
          </div>

          <div className="absolute right-4 top-16 w-[250px] rotate-2 rounded-[1.6rem] bg-[#ffd84f] p-6 text-[#241900] shadow-[0_24px_60px_rgba(0,0,0,.4)]">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#6b5000]">Same home. Better plan.</p>
            <div className="mt-5 space-y-3 text-lg font-black leading-tight">
              <p>✓ Understand the job</p>
              <p>✓ Plan the budget</p>
              <p>✓ Keep records</p>
              <p>✓ Find the right pro</p>
              <p>✓ Get it done</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="how-it-works" className="relative scroll-mt-5 border-b border-white/10 bg-[#07140b] px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex w-fit items-center gap-2 rounded-full border border-[#ffd75f]/35 bg-[#ffd75f]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[#ffe17a]"><Sparkles size={13} /> The job, made clearer</div>
          <h2 className="mt-5 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">From problem to plan to pro—without the guesswork.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">Skills Connect Pro turns a vague idea or frustrating problem into a practical next step. Start simple. Add detail only when you need it.</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {journeySteps.map((item, index) => { const Icon = item.icon; return <article key={item.step} className="group relative overflow-hidden rounded-[2rem] border border-white/14 bg-[#0c1a10] shadow-2xl shadow-black/20">
            <div className="relative h-52 overflow-hidden">
              <Image src={item.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width:1024px) 33vw, 100vw" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,10,5,.02),rgba(3,10,5,.88))]" />
              <div className="absolute left-5 top-5 flex size-12 items-center justify-center rounded-full bg-[#ffd21f] text-sm font-black text-[#201700] shadow-xl">{item.step}</div>
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-white/85 backdrop-blur">{item.note}</span>
                <span className="flex size-10 items-center justify-center rounded-xl border border-[#ffd21f]/35 bg-black/45 text-[#ffd21f] backdrop-blur"><Icon size={19} /></span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-black tracking-[-.025em] text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{item.text}</p>
            </div>
            {index < journeySteps.length - 1 && <span className="absolute -right-4 top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#ffd21f] text-[#241900] shadow-xl lg:flex"><ArrowRight size={17} /></span>}
          </article>; })}
        </div>
      </div>
    </section>

    <section id="homeowners" className="relative scroll-mt-5 px-4 py-14 md:px-8 md:py-20"><div className="pointer-events-none absolute left-1/2 top-16 h-80 w-[min(90vw,68rem)] -translate-x-1/2 rounded-full bg-[#f9ca32]/[.08] blur-3xl" /><div className="relative mx-auto max-w-7xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-3xl"><div className="flex items-center gap-2 text-[#ffe17a]"><FolderKanban size={19} /><span className="text-xs font-black uppercase tracking-[0.16em]">Plans for every project</span></div><h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-[#fff8e8] md:text-5xl">Choose the support that fits the job.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 md:text-base">Start free if you simply need clarity. Step up when you want stronger planning, better records and a proper project workspace.</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[.045] px-4 py-3 text-sm text-white/70 backdrop-blur-xl"><ShieldCheck className="shrink-0 text-[#ffe17a]" size={20} /><span>Once-off homeowner passes. No surprise recurring subscription.</span></div></div>

      <div className="mt-9 grid gap-4 lg:grid-cols-3">{customerPlans.map((plan) => { const Icon = plan.visual.icon; const theme = customerTheme(plan.code); return <article key={plan.name} className={`group relative overflow-hidden rounded-[2rem] border p-2 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 ${theme.card}`}>
        {plan.featured && <span className="absolute left-6 top-4 z-10 rounded-full bg-[#191207] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-[#ffe17a]">Best value</span>}
        <div className="relative h-44 overflow-hidden rounded-[1.55rem]"><Image src={plan.visual.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 32vw, 100vw" /><div className={`absolute inset-0 ${plan.featured ? 'bg-[linear-gradient(180deg,transparent,rgba(46,27,0,.78))]' : 'bg-[linear-gradient(180deg,rgba(3,10,5,.04),rgba(3,10,5,.88))]'}`} /><div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3"><div><p className={`text-[10px] font-black uppercase tracking-[.16em] ${plan.featured ? 'text-[#ffe78c]' : 'text-[#ffe17a]'}`}>{plan.visual.eyebrow}</p><p className="mt-1 text-sm font-bold leading-5 text-white">{plan.visual.outcome}</p></div><span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border ${plan.featured ? 'border-[#ffe17a]/60 bg-[#0f0c06]/70 text-[#ffe17a]' : 'border-white/25 bg-black/35 text-[#ffe17a]'} backdrop-blur`}><Icon size={19} /></span></div></div>
        <div className="px-4 pb-4 pt-5"><p className={`text-[11px] font-black uppercase tracking-[.16em] ${plan.featured ? 'text-[#674b00]' : theme.price}`}>{plan.name === 'Home Project Pass' ? 'Complete workspace' : 'Project workspace'}</p><div className="mt-2 flex items-end justify-between gap-3"><h3 className="text-3xl font-black tracking-[-.035em]">{plan.name}</h3><p className="shrink-0 text-2xl font-black">{plan.price}<span className="ml-1 text-xs font-bold">{plan.period}</span></p></div><p className={`mt-4 min-h-12 text-sm leading-6 ${plan.featured ? 'text-[#553d08]' : 'text-white/68'}`}>{plan.description}</p><ul className="mt-5 space-y-2.5 text-sm leading-5">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check className={`mt-0.5 shrink-0 ${theme.check}`} size={16} />{feature}</li>)}</ul><Link href={plan.code === 'free' ? '/assistant' : `/customer-checkout?plan=${plan.code}`} className={`mt-6 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition ${theme.button}`}>{plan.button}<ArrowRight size={17} /></Link></div>
      </article>; })}</div>

      <div className="mt-10 overflow-x-auto rounded-[2rem] border border-white/15 bg-[#101811]/70 shadow-xl shadow-black/20 backdrop-blur-2xl"><table className="min-w-[720px] w-full text-left text-sm"><caption className="caption-top px-6 pb-4 pt-6 text-left text-xl font-black text-[#fff8e8]">Compare project-plan access</caption><thead className="border-y border-white/10 text-xs uppercase tracking-[0.12em] text-white/55"><tr><th className="px-6 py-4">Feature</th><th className="px-4 py-4 text-[#66efa8]">Free</th><th className="px-4 py-4 text-[#7bc0ff]">Basic</th><th className="px-4 py-4 text-[#ffe17a]">Home Project Pass</th></tr></thead><tbody>{comparisonRows.map(([feature, free, basic, pass]) => <tr key={feature} className="border-b border-white/10 last:border-0"><th scope="row" className="px-6 py-3.5 font-bold text-white">{feature}</th><td className="px-4 py-3.5 text-white/62">{free}</td><td className="px-4 py-3.5 text-white/62">{basic}</td><td className="px-4 py-3.5 font-bold text-[#ffe698]">{pass}</td></tr>)}</tbody></table></div>
      <p className="mt-5 text-xs leading-5 text-white/45">Project plans provide private planning and workspace access. A provider may still need to inspect the site before confirming work, price or construction detail.</p>
    </div></section>

    <section id="providers" className="relative scroll-mt-5 border-t border-white/10 px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/15 shadow-2xl shadow-black/30">
          <Image src="/artisans/hero-welder.jpg" alt="Skilled South African provider at work" fill className="-z-20 object-cover object-center" sizes="100vw" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,12,7,.98),rgba(5,16,9,.85)_54%,rgba(5,13,8,.42))]" />
          <div className="grid min-h-[420px] gap-8 p-6 md:p-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="flex w-fit items-center gap-2 rounded-full border border-[#ffd75f]/35 bg-black/30 px-4 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[#ffe17a] backdrop-blur"><UsersRound size={14} /> For providers ready for a steadier pipeline</div>
              <h2 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-.045em] text-white md:text-6xl">Good work deserves a more consistent flow of work.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">Approved providers start with three complimentary customer opportunities. When you are ready for more, choose the access that fits your pace and capacity.</p>
            </div>
            <div className="rounded-[1.7rem] border border-white/18 bg-black/35 p-5 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[.15em] text-[#ffe17a]">What you get</p>
              <div className="mt-4 grid gap-3 text-sm font-bold text-white">
                <p>✓ Better-fit local opportunities</p>
                <p>✓ Clear project context before you respond</p>
                <p>✓ Structured quote and availability tools</p>
                <p>✓ Protected customer contact until selection</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">{subscriptions.map((plan) => { const theme = providerTheme(plan.slug); return <article key={plan.slug} className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl shadow-black/20 backdrop-blur-2xl transition hover:-translate-y-1 ${theme.card}`}>
          {plan.name === 'Growth' && <span className="absolute left-6 top-0 rounded-b-xl bg-[#191207] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ffe17a]">Most popular</span>}<p className={`text-[11px] font-black uppercase tracking-[0.14em] ${theme.price}`}>{plan.audience}</p><h3 className="mt-5 text-3xl font-black tracking-[-.035em]">{plan.name}</h3><p className="mt-3 text-4xl font-black">{plan.price}<span className="text-sm font-bold"> / month</span></p><div className="mt-5 h-px bg-white/15" /><ul className="mt-5 space-y-3 text-sm leading-5">{plan.included.map((feature) => <li key={feature} className="flex gap-2.5"><Check className={`mt-0.5 shrink-0 ${theme.check}`} size={16} />{feature}</li>)}</ul><Link href={`/provider-plans/${plan.slug}${providerQuery}`} className={`mt-7 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black ${theme.button}`}>Explore {plan.name}<ArrowRight size={17} /></Link>
        </article>; })}</div>

        <div className="mt-6 rounded-[2rem] border border-white/15 bg-white/[.06] p-6 shadow-xl shadow-black/15 backdrop-blur-2xl md:flex md:items-center md:justify-between md:gap-10 md:p-8"><div><div className="flex items-center gap-2 text-[#ffe17a]"><BadgeCheck size={18} /><span className="text-xs font-black uppercase tracking-[0.14em]">Flexible lead packs</span></div><h3 className="mt-3 text-2xl font-black text-[#fff8e8]">Prefer to top up only when you need to?</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Use lead credits when your capacity and appetite for new work changes.</p></div><div className="mt-5 grid grid-cols-3 gap-2 md:mt-0">{packs.map((pack) => <Link key={pack.slug} href={`/provider-plans/${pack.slug}${providerQuery}`} className="rounded-2xl border border-white/15 bg-black/25 px-3 py-3.5 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:border-[#ffd75f] hover:bg-[#ffd75f]/10"><span className="block text-[#ffe17a]">{pack.price}</span><span className="mt-1 block text-white/75">{pack.name}</span></Link>)}</div></div>
      </div>
    </section>

    <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-white/40 md:px-8"><span className="inline-flex items-center gap-2"><CalendarDays size={14} /> Project passes are once-off access periods; provider subscriptions and lead packs are shown separately.</span></footer>
  </main>;
}
