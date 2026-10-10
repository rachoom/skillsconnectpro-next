import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, CircleCheckBig, LockKeyhole, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getProviderPlan, providerPlans } from '../planCatalog';

export function generateStaticParams() {
  return providerPlans.map((plan) => ({ plan: plan.slug }));
}

export default async function ProviderPlanDetailPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan: slug } = await params;
  const plan = getProviderPlan(slug);
  if (!plan) notFound();

  const isSubscription = plan.kind === 'subscription';
  const nextStep = isSubscription ? 'Secure monthly checkout' : 'Secure once-off checkout';

  return (
    <main className="min-h-screen bg-[#0b120c] text-[#f8f3e5]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Link href="/provider-plans" className="inline-flex items-center gap-2 text-sm font-bold text-[#ffd75f]"><ArrowLeft size={17} /> All provider options</Link>
        <Link href="/" className="text-xs font-black uppercase tracking-[0.16em] text-white/70">Skills Connect Pro</Link>
      </nav>

      <section className="border-y border-white/10 bg-[linear-gradient(120deg,#1b2a17_0%,#10190f_52%,#4d3907_150%)] px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#ffd75f]"><Sparkles size={15} /> {plan.audience}</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">{plan.headline}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{plan.summary}</p>
          </div>
          <aside className="rounded-[1.7rem] border border-[#ffd75f]/50 bg-[#ffd75f] p-6 text-[#251b00] shadow-2xl shadow-black/25">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#6b4c00]">{plan.cadence}</p>
            <p className="mt-3 text-5xl font-black">{plan.price}</p>
            <p className="mt-2 text-sm font-bold">{isSubscription ? 'Provider access that continues beyond your three free leads.' : 'Lead access that you use at your own pace.'}</p>
            <Link href={`/provider-checkout?plan=${plan.slug}`} className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#161106] px-4 py-4 text-sm font-black text-[#ffd75f]">{nextStep}<ArrowRight size={18} /></Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd75f]">What this gives you</p><h2 className="mt-4 text-3xl font-black md:text-4xl">Built around the moment a good lead arrives.</h2></div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">{plan.benefits.map((benefit, index) => <article key={benefit.title} className="rounded-2xl border border-white/15 bg-white/[0.045] p-6"><span className="flex size-9 items-center justify-center rounded-xl bg-[#ffd75f] text-sm font-black text-[#302200]">0{index + 1}</span><h3 className="mt-5 text-xl font-black">{benefit.title}</h3><p className="mt-3 text-sm leading-6 text-white/70">{benefit.description}</p></article>)}</div>
      </section>

      <section className="bg-[#f8f3e5] px-4 py-14 text-[#172016] md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#796000]">Included in {plan.name}</p><h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">No vague promises. Just the access you need to put your skills forward.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#52604e]">Skills Connect Pro starts in Ekurhuleni and is being built to make strong local service businesses easier to discover, assess and choose.</p></div><ul className="grid gap-3 sm:grid-cols-2">{plan.included.map((item) => <li key={item} className="flex items-center gap-3 rounded-xl border border-[#d8d0ae] bg-white px-4 py-4 text-sm font-bold"><CircleCheckBig className="shrink-0 text-[#9b7800]" size={19} />{item}</li>)}</ul></div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20"><div className="rounded-[1.8rem] border border-white/15 bg-white/[0.05] p-6 md:p-9"><div className="grid gap-7 md:grid-cols-3"><div className="flex gap-3"><LockKeyhole className="mt-1 shrink-0 text-[#ffd75f]" size={21} /><p className="text-sm leading-6 text-white/75"><strong className="block text-white">Your customers stay private</strong>Contact details remain protected until the customer chooses a provider.</p></div><div className="flex gap-3"><MapPin className="mt-1 shrink-0 text-[#ffd75f]" size={21} /><p className="text-sm leading-6 text-white/75"><strong className="block text-white">Rooted locally</strong>The network begins in Ekurhuleni and grows with the people using it.</p></div><div className="flex gap-3"><ShieldCheck className="mt-1 shrink-0 text-[#ffd75f]" size={21} /><p className="text-sm leading-6 text-white/75"><strong className="block text-white">You stay in control</strong>Review the job context, then choose whether it fits your time and skills.</p></div></div><Link href={`/provider-checkout?plan=${plan.slug}`} className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#ffd75f] px-5 py-4 text-sm font-black text-[#2d2100]">Continue to secure checkout <ArrowRight size={18} /></Link></div></section>
    </main>
  );
}
