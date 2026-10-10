import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';

const plans = [
  { name: 'Starter', price: 'R49', note: 'For providers building momentum', features: ['Keep receiving customer opportunities', 'Provider profile stays active', 'Best for getting started'] },
  { name: 'Growth', price: 'R99', note: 'For a steady stream of work', features: ['Everything in Starter', 'More visibility as the network grows', 'Built for active local teams'], featured: true },
  { name: 'Pro', price: 'R199', note: 'For established service businesses', features: ['Everything in Growth', 'Priority positioning', 'A stronger presence in your service area'] },
];

const packs = [
  ['4 lead credits', 'R99'],
  ['10 lead credits', 'R199'],
  ['25 lead credits', 'R399'],
];

function planMessage(plan: string) {
  return `Hi Skills Connect Pro, I would like to activate the ${plan} provider plan.`;
}

export default function ProviderPlansPage() {
  return (
    <main className="min-h-screen bg-[#0b120c] px-4 py-6 text-[#f8f3e5] md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between gap-4 border-b border-white/15 pb-5">
          <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#ffd75f]">Skills Connect Pro</Link>
          <Link href="/join" className="text-sm font-bold text-white/80 transition hover:text-white">Join as a provider</Link>
        </nav>

        <section className="py-14 text-center md:py-20">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#ffd75f]/40 bg-[#ffd75f]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ffd75f]"><Sparkles size={14} /> Provider access</div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">Build your next job pipeline with confidence.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">Every approved provider starts with three customer opportunities on us. Choose a plan whenever you are ready to keep the work coming.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative rounded-[1.7rem] border p-6 ${plan.featured ? 'border-[#ffd75f] bg-[#f9ca32] text-[#241b00] shadow-2xl shadow-[#f9ca32]/10' : 'border-white/15 bg-white/[0.06] text-white'}`}>
              {plan.featured && <span className="absolute -top-3 left-6 rounded-full bg-[#141006] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#ffd75f]">Most popular</span>}
              <p className={`text-sm font-bold ${plan.featured ? 'text-[#5c4300]' : 'text-[#ffd75f]'}`}>{plan.note}</p>
              <h2 className="mt-5 text-3xl font-black">{plan.name}</h2>
              <p className="mt-2 text-4xl font-black">{plan.price}<span className="text-sm font-bold"> / month</span></p>
              <ul className="mt-7 space-y-3 text-sm leading-5">
                {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 shrink-0" size={16} />{feature}</li>)}
              </ul>
              <a href={`https://wa.me/27697026088?text=${encodeURIComponent(planMessage(plan.name))}`} target="_blank" rel="noreferrer" className={`mt-8 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black ${plan.featured ? 'bg-[#141006] text-[#ffd75f]' : 'bg-[#ffd75f] text-[#241b00]'}`}>Choose {plan.name}<ArrowRight size={17} /></a>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[1.7rem] border border-white/15 bg-white/[0.06] p-6 md:flex md:items-center md:justify-between md:gap-10 md:p-8">
          <div><div className="flex items-center gap-2 text-[#ffd75f]"><ShieldCheck size={18} /><span className="text-xs font-black uppercase tracking-[0.14em]">Flexible lead packs</span></div><h2 className="mt-3 text-2xl font-black">Prefer to top up only when you need to?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Lead packs give you a straightforward way to unlock a set number of new customer opportunities.</p></div>
          <div className="mt-5 grid grid-cols-3 gap-2 md:mt-0">{packs.map(([name, price]) => <a key={name} href={`https://wa.me/27697026088?text=${encodeURIComponent(planMessage(name))}`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-center text-xs font-bold transition hover:border-[#ffd75f] hover:bg-[#ffd75f]/10"><span className="block text-[#ffd75f]">{price}</span><span className="mt-1 block text-white/75">{name}</span></a>)}</div>
        </section>
      </div>
    </main>
  );
}
