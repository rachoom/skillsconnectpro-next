import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CircleCheckBig, LockKeyhole, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getProviderPlan, providerPlans } from '../planCatalog';

export function generateStaticParams() {
  return providerPlans.map((plan) => ({ plan: plan.slug }));
}

export default async function ProviderPlanDetailPage({ params, searchParams }: { params: Promise<{ plan: string }>; searchParams: Promise<{ provider?: string }> }) {
  const { plan: slug } = await params;
  const { provider } = await searchParams;
  const providerQuery = provider && /^\d+$/.test(provider) ? `&provider=${encodeURIComponent(provider)}` : '';
  const plan = getProviderPlan(slug);
  if (!plan) notFound();

  const isSubscription = plan.kind === 'subscription';
  const nextStep = isSubscription ? 'Secure monthly checkout' : 'Secure once-off checkout';

  return (
    <main className="min-h-screen overflow-hidden bg-[#071009] text-[#f8f3e5]">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <Image src="/artisans/hero-welder.jpg" alt="Skilled provider at work" fill priority className="-z-20 object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(102deg,rgba(4,11,7,.97),rgba(5,13,8,.88)_52%,rgba(15,18,9,.58))]" />
        <div className="absolute right-[-10rem] top-[-8rem] -z-10 size-[32rem] rounded-full bg-[#ffd75f]/15 blur-3xl" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <Link href="/provider-plans" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3.5 py-2.5 text-sm font-bold text-white/85 backdrop-blur-xl transition hover:border-[#ffd75f]/70 hover:text-[#ffe17a]"><ArrowLeft size={17} /> Provider options</Link>
          <Link href="/" className="text-xs font-black uppercase tracking-[0.16em] text-[#ffe17a]">Skills Connect Pro</Link>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-8 md:px-8 md:pb-20 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-[#ffd75f]/35 bg-[#171a10]/65 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffe17a] backdrop-blur-xl"><Sparkles size={14} /> {plan.audience}</div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-.045em] text-[#fff8e8] md:text-6xl">{plan.headline}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 md:text-lg">{plan.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3"><span className="rounded-xl border border-white/15 bg-white/[.07] px-4 py-3 text-sm font-bold text-white/80 backdrop-blur-xl">{plan.cadence}</span><span className="rounded-xl border border-[#ffd75f]/35 bg-[#ffd75f]/10 px-4 py-3 text-sm font-bold text-[#ffe17a]">Starts in Ekurhuleni</span></div>
          </div>

          <aside className="rounded-[2rem] border border-white/20 bg-white/[.10] p-2 shadow-2xl shadow-black/35 backdrop-blur-2xl">
            <div className="rounded-[1.55rem] bg-[linear-gradient(145deg,#ffe381_0%,#dba818_100%)] p-6 text-[#241b00]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#654800]">{plan.name}</p>
              <p className="mt-3 text-5xl font-black tracking-[-.045em]">{plan.price}</p>
              <p className="mt-3 text-sm font-bold leading-6">{isSubscription ? 'Keep provider access ready beyond the first three complimentary leads.' : 'Use lead access at the pace that works for your schedule.'}</p>
              <Link href={`/provider-checkout?plan=${plan.slug}${providerQuery}`} className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#171107] px-4 py-4 text-sm font-black text-[#ffe17a] shadow-lg shadow-[#513800]/20 transition hover:-translate-y-0.5">{nextStep}<ArrowRight size={18} /></Link>
            </div>
            <p className="px-4 py-4 text-center text-xs leading-5 text-white/60">Securely paid through Payfast. Access changes only after verified payment.</p>
          </aside>
        </div>
      </section>

      <section className="relative px-4 py-14 md:px-8 md:py-20"><div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[min(92vw,62rem)] -translate-x-1/2 rounded-full bg-[#f9ca32]/[.08] blur-3xl" /><div className="relative mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffe17a]">The value in the workday</p><h2 className="mt-4 text-3xl font-black tracking-[-.035em] text-[#fff8e8] md:text-4xl">Built around the moment a good lead arrives.</h2><p className="mt-4 text-sm leading-7 text-white/65">Everything is designed to help a provider understand the opportunity, make the call, and get back to doing the work.</p></div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">{plan.benefits.map((benefit, index) => <article key={benefit.title} className="rounded-[1.6rem] border border-white/15 bg-white/[.055] p-6 shadow-xl shadow-black/15 backdrop-blur-xl"><span className="flex size-10 items-center justify-center rounded-2xl border border-[#ffd75f]/35 bg-[#ffd75f]/10 text-sm font-black text-[#ffe17a]">0{index + 1}</span><h3 className="mt-5 text-xl font-black text-white">{benefit.title}</h3><p className="mt-3 text-sm leading-6 text-white/65">{benefit.description}</p></article>)}</div>
      </div></section>

      <section className="border-y border-[#2d3429] bg-[#f7f1df] px-4 py-14 text-[#172016] md:px-8 md:py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#796000]">Included in {plan.name}</p><h2 className="mt-4 text-3xl font-black leading-tight tracking-[-.035em] md:text-4xl">No vague promises. Just the access you need to put your skills forward.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#52604e]">Skills Connect Pro begins in Ekurhuleni and is designed to make strong local service businesses easier to discover, assess and choose.</p></div><ul className="grid gap-3 sm:grid-cols-2">{plan.included.map((item) => <li key={item} className="flex items-center gap-3 rounded-2xl border border-[#d8d0ae] bg-white px-4 py-4 text-sm font-bold shadow-sm"><CircleCheckBig className="shrink-0 text-[#9b7800]" size={19} />{item}</li>)}</ul></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20"><div className="rounded-[2rem] border border-white/15 bg-[linear-gradient(120deg,rgba(255,255,255,.08),rgba(255,255,255,.03))] p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl md:p-9"><div className="grid gap-7 md:grid-cols-3"><div className="flex gap-3"><LockKeyhole className="mt-1 shrink-0 text-[#ffd75f]" size={21} /><p className="text-sm leading-6 text-white/70"><strong className="block text-white">Customers stay private</strong>Contact details remain protected until the customer chooses a provider.</p></div><div className="flex gap-3"><MapPin className="mt-1 shrink-0 text-[#ffd75f]" size={21} /><p className="text-sm leading-6 text-white/70"><strong className="block text-white">Rooted locally</strong>The network begins in Ekurhuleni and grows with the people using it.</p></div><div className="flex gap-3"><ShieldCheck className="mt-1 shrink-0 text-[#ffd75f]" size={21} /><p className="text-sm leading-6 text-white/70"><strong className="block text-white">You stay in control</strong>Review the job context, then choose whether it fits your time and skills.</p></div></div><Link href={`/provider-checkout?plan=${plan.slug}${providerQuery}`} className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#ffd75f] px-5 py-4 text-sm font-black text-[#2d2100] shadow-[0_14px_32px_rgba(255,215,95,.18)] transition hover:-translate-y-0.5">Continue to secure checkout <ArrowRight size={18} /></Link></div></section>
    </main>
  );
}
