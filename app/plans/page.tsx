import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, FolderKanban, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { providerPlans } from '@/app/provider-plans/planCatalog';

export const metadata: Metadata = {
  title: 'Plans | Skills Connect Pro',
  description: 'Customer project plans and provider access plans for Skills Connect Pro.',
};

const customerPlans = [
  { code: 'free', name: 'Free', price: 'R0', period: 'to get started', description: 'A practical starting point for understanding one job and taking the first step.', button: 'Start a project', featured: false, features: ['Account registration', 'Basic AI Project Assistant', '1 project photo analysis', 'Basic materials calculation', '1 hardware quotation request', 'Find suitable artisans', '1 active project', 'Basic project budget', 'Limited expense tracking and receipt storage'] },
  { code: 'basic_30', name: 'Basic', price: 'R29', period: 'for 30 days', description: 'For a single project that needs clearer planning, costs and documents in one place.', button: 'Choose Basic', featured: false, features: ['Everything in Free', '2 project photo analyses', 'Full materials calculations', '3 hardware quotation requests', '1 active project', 'Expense tracking', 'Limited receipt storage', 'Limited artisan collaboration', 'Basic project budget'] },
  { code: 'project_pass_90', name: 'Home Project Pass', price: 'R79', period: 'for 90 days', description: 'The complete project workspace for homeowners coordinating a bigger build or renovation.', button: 'Choose Project Pass', featured: true, features: ['Everything in Basic', '5 project photo analyses', '10 hardware quotation requests', '3 active projects', 'Advanced project budget', 'Expanded receipt storage', 'Project timeline and milestones', 'Project reports', 'Collaborate with artisans', 'Project document export'] },
];

const comparisonRows = [
  ['Account registration', 'Included', 'Included', 'Included'], ['Basic AI Project Assistant', 'Included', 'Included', 'Included'], ['Project photo analysis', '1', '2', '5'], ['Materials calculations', 'Basic', 'Full', 'Full'], ['Hardware quotation requests', '1', '3', '10'], ['Find artisans', 'Included', 'Included', 'Included'], ['Active projects', '1', '1', '3'], ['Project budget', 'Basic', 'Basic', 'Advanced'], ['Expense tracking', 'Limited', 'Included', 'Included'], ['Receipt storage', 'Limited', 'Limited', 'Expanded'], ['Project timeline', '—', '—', 'Included'], ['Milestone management', '—', '—', 'Included'], ['Project reports', '—', '—', 'Included'], ['Collaborate with artisans', '—', 'Limited', 'Included'], ['Project document export', '—', 'Limited', 'Included'],
];

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams;
  const providerQuery = provider && /^\d+$/.test(provider) ? `?provider=${encodeURIComponent(provider)}` : '';
  const subscriptions = providerPlans.filter((plan) => plan.kind === 'subscription');
  const packs = providerPlans.filter((plan) => plan.kind === 'lead_pack');

  return <main className="min-h-screen bg-[#0b120c] text-[#f8f3e5]">
    <nav className="border-b border-white/15 px-4 py-4 md:px-8"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <Link href="/" aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={188} height={50} priority /></Link>
      <div className="hidden items-center gap-5 text-sm font-bold text-white/75 md:flex"><a href="#homeowners" className="hover:text-white">For homeowners</a><a href="#providers" className="hover:text-white">For providers</a></div>
      <Link href="/my-projects" className="rounded-xl border border-[#ffd75f]/45 px-3 py-2 text-xs font-black text-[#ffd75f] transition hover:bg-[#ffd75f] hover:text-[#241b00]">My Projects</Link>
    </div></nav>

    <section className="mx-auto max-w-6xl px-4 pb-12 pt-14 text-center md:px-8 md:pb-16 md:pt-20">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#ffd75f]/40 bg-[#ffd75f]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ffd75f]"><Sparkles size={14} /> One platform, two sides of the job</div>
      <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">Plans that keep a project moving.</h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">Plan your work, understand costs and connect with the right local professional. Providers can then choose the access that suits their business.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><a href="#homeowners" className="rounded-xl bg-[#ffd75f] px-5 py-3 text-sm font-black text-[#241b00]">Explore project plans</a><a href="#providers" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white">Provider access</a></div>
    </section>

    <section id="homeowners" className="scroll-mt-5 border-y border-white/10 bg-black/20 px-4 py-12 md:px-8 md:py-16"><div className="mx-auto max-w-6xl">
      <div className="max-w-2xl"><div className="flex items-center gap-2 text-[#ffd75f]"><FolderKanban size={19} /><span className="text-xs font-black uppercase tracking-[0.16em]">For homeowners</span></div><h2 className="mt-3 text-3xl font-black md:text-4xl">A project workspace that grows with the job.</h2><p className="mt-3 text-sm leading-6 text-white/70">Every project begins with the free tools. Choose more space and stronger planning support only when you need it.</p></div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">{customerPlans.map((plan) => <article key={plan.name} className={`relative rounded-[1.7rem] border p-6 ${plan.featured ? 'border-[#ffd75f] bg-[#f9ca32] text-[#241b00] shadow-2xl shadow-[#f9ca32]/10' : 'border-white/15 bg-white/[0.06]'}`}>
        {plan.featured && <span className="absolute -top-3 left-6 rounded-full bg-[#141006] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#ffd75f]">Best value</span>}
        <p className={`text-xs font-black uppercase tracking-[0.16em] ${plan.featured ? 'text-[#5c4300]' : 'text-[#ffd75f]'}`}>{plan.name === 'Home Project Pass' ? 'Complete workspace' : 'Project workspace'}</p>
        <h3 className="mt-4 text-3xl font-black">{plan.name}</h3><p className="mt-3 text-4xl font-black">{plan.price}<span className="text-sm font-bold"> {plan.period}</span></p><p className={`mt-4 text-sm leading-6 ${plan.featured ? 'text-[#513d10]' : 'text-white/70'}`}>{plan.description}</p>
        <ul className="mt-6 space-y-2.5 text-sm leading-5">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 shrink-0" size={16} />{feature}</li>)}</ul><Link href={plan.code === 'free' ? '/assistant' : `/customer-checkout?plan=${plan.code}`} className={`mt-7 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black ${plan.featured ? 'bg-[#141006] text-[#ffd75f]' : 'bg-[#ffd75f] text-[#241b00]'}`}>{plan.button}<ArrowRight size={17} /></Link>
      </article>)}</div>
      <div className="mt-10 overflow-x-auto rounded-[1.7rem] border border-white/15 bg-white/[0.04]"><table className="min-w-[720px] w-full text-left text-sm"><caption className="caption-top px-6 pb-4 pt-6 text-left text-xl font-black">Compare project-plan access</caption><thead className="border-y border-white/10 text-xs uppercase tracking-[0.12em] text-white/60"><tr><th className="px-6 py-4">Feature</th><th className="px-4 py-4">Free</th><th className="px-4 py-4">Basic</th><th className="px-4 py-4 text-[#ffd75f]">Home Project Pass</th></tr></thead><tbody>{comparisonRows.map(([feature, free, basic, pass]) => <tr key={feature} className="border-b border-white/10 last:border-0"><th scope="row" className="px-6 py-3.5 font-bold text-white">{feature}</th><td className="px-4 py-3.5 text-white/70">{free}</td><td className="px-4 py-3.5 text-white/70">{basic}</td><td className="px-4 py-3.5 font-bold text-[#ffe698]">{pass}</td></tr>)}</tbody></table></div>
      <p className="mt-5 text-xs leading-5 text-white/50">Project plans provide private planning and workspace access. A provider may still need to inspect the site before confirming work, price or construction detail.</p>
    </div></section>

    <section id="providers" className="scroll-mt-5 px-4 py-12 md:px-8 md:py-16"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><div className="flex items-center gap-2 text-[#ffd75f]"><UsersRound size={19} /><span className="text-xs font-black uppercase tracking-[0.16em]">For providers</span></div><h2 className="mt-3 text-3xl font-black md:text-4xl">A simple route to suitable local work.</h2><p className="mt-3 text-sm leading-6 text-white/70">Approved providers begin with three customer opportunities on us. Continue with the access option that fits your pace of work.</p></div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">{subscriptions.map((plan) => <article key={plan.slug} className={`relative rounded-[1.7rem] border p-6 ${plan.name === 'Growth' ? 'border-[#ffd75f] bg-[#f9ca32] text-[#241b00]' : 'border-white/15 bg-white/[0.06]'}`}>
        {plan.name === 'Growth' && <span className="absolute -top-3 left-6 rounded-full bg-[#141006] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#ffd75f]">Most popular</span>}
        <p className={`text-xs font-black uppercase tracking-[0.14em] ${plan.name === 'Growth' ? 'text-[#5c4300]' : 'text-[#ffd75f]'}`}>{plan.audience}</p><h3 className="mt-4 text-3xl font-black">{plan.name}</h3><p className="mt-2 text-4xl font-black">{plan.price}<span className="text-sm font-bold"> / month</span></p><ul className="mt-6 space-y-2.5 text-sm leading-5">{plan.included.slice(0, 4).map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 shrink-0" size={16} />{feature}</li>)}</ul><Link href={`/provider-plans/${plan.slug}${providerQuery}`} className={`mt-7 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black ${plan.name === 'Growth' ? 'bg-[#141006] text-[#ffd75f]' : 'bg-[#ffd75f] text-[#241b00]'}`}>Explore {plan.name}<ArrowRight size={17} /></Link>
      </article>)}</div>
      <div className="mt-6 rounded-[1.7rem] border border-white/15 bg-white/[0.06] p-6 md:flex md:items-center md:justify-between md:gap-10 md:p-8"><div><div className="flex items-center gap-2 text-[#ffd75f]"><ShieldCheck size={18} /><span className="text-xs font-black uppercase tracking-[0.14em]">Flexible lead packs</span></div><h3 className="mt-3 text-2xl font-black">Prefer to top up only when you need to?</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Use lead credits when your capacity and appetite for new work changes.</p></div><div className="mt-5 grid grid-cols-3 gap-2 md:mt-0">{packs.map((pack) => <Link key={pack.slug} href={`/provider-plans/${pack.slug}${providerQuery}`} className="rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-center text-xs font-bold transition hover:border-[#ffd75f] hover:bg-[#ffd75f]/10"><span className="block text-[#ffd75f]">{pack.price}</span><span className="mt-1 block text-white/75">{pack.name}</span></Link>)}</div></div>
    </div></section>
  </main>;
}
