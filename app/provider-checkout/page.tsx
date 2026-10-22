import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, Check, CreditCard, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { getProviderPlan } from '../provider-plans/planCatalog';
import { ProviderCheckoutForm } from './ProviderCheckoutForm';
import { providerTheme } from '@/services/planPresentation';

export default async function ProviderCheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; provider?: string }> }) {
  const { plan: slug, provider } = await searchParams;
  const plan = slug ? getProviderPlan(slug) : undefined;
  const providerId = provider && /^\d+$/.test(provider) ? provider : undefined;
  const theme = plan ? providerTheme(plan.slug) : providerTheme('starter');

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#071009] px-4 py-5 text-[#fff8e8] md:px-8 md:py-8">
      <Image src="/artisans/hero-welder.jpg" alt="Skilled provider working" fill priority className="-z-20 object-cover object-center opacity-40" sizes="100vw" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(112deg,rgba(4,11,7,.98),rgba(5,13,8,.91)_48%,rgba(5,12,7,.76))]" />
      <div className="absolute left-[-9rem] top-28 -z-10 size-[30rem] rounded-full bg-[#ffd75f]/10 blur-3xl" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-2">
        <Link href={plan ? `/provider-plans/${plan.slug}` : '/provider-plans'} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.05] px-3.5 py-2.5 text-sm font-bold text-white/85 backdrop-blur-xl transition hover:border-[#ffd75f]/70 hover:text-[#ffe17a]"><ArrowLeft size={17} /> Provider options</Link>
        <Link href="/" className="text-xs font-black uppercase tracking-[0.16em] text-[#ffe17a]">Skills Connect Pro</Link>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[1.08fr_.92fr] lg:py-14">
        <section className="rounded-[2rem] border border-white/20 bg-white/[.075] p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] ${theme.badge}`}><Sparkles size={13} /> Secure provider access</div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-white/50">Make room for better-fit work</p>
              <h1 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-.035em] text-[#fff8e8] md:text-5xl">{plan ? `${plan.name} is ready when you are.` : 'Choose the access that suits your work.'}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-base">Pay securely through Payfast. Provider access activates automatically after Payfast verifies the payment—never just because a browser redirected.</p>
            </div>
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border shadow-lg ${theme.panel}`}><CreditCard size={22} /></span>
          </div>

          {plan && <div className="mt-8 border-t border-white/12 pt-7">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-white/50">Everything included in {plan.name}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {plan.included.map((item) => <li key={item} className="flex gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm leading-5 text-white/82"><Check className={`mt-0.5 shrink-0 ${theme.check}`} size={16} />{item}</li>)}
            </ul>
          </div>}
          {plan ? <div className="mt-8 border-t border-white/12 pt-7"><ProviderCheckoutForm plan={{ slug: plan.slug, name: plan.name, price: plan.price, kind: plan.kind }} providerId={providerId} /></div> : <Link href="/provider-plans" className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd75f] px-4 py-4 text-sm font-black text-[#241b00] shadow-[0_14px_32px_rgba(255,215,95,.18)] transition hover:-translate-y-0.5">Review provider options <BriefcaseBusiness size={18} /></Link>}
        </section>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-[#11190f]/85 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className={`border-b border-white/12 p-6 ${theme.panel}`}>
              <p className="text-[10px] font-black uppercase tracking-[.17em] text-[#664900]">Your provider access</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">{plan?.name ?? 'Choose a plan'}</h2>
              {plan && <p className="mt-3 text-4xl font-black">{plan.price}</p>}
            </div>
            <div className="p-6"><p className="text-sm font-black text-white">Built for a working week, not a confusing subscription maze.</p><div className="mt-5 space-y-4 text-sm"><div className="flex items-center justify-between gap-4"><span className="text-white/60">Payment partner</span><span className="font-black text-white">Payfast</span></div><div className="flex items-center justify-between gap-4"><span className="text-white/60">Activation</span><span className="font-black text-[#ffe17a]">After verification</span></div><div className="flex items-center justify-between gap-4"><span className="text-white/60">First leads</span><span className="font-black text-white">3 complimentary</span></div></div></div>
          </div>
          <div className="rounded-[1.6rem] border border-white/15 bg-white/[.055] p-5 backdrop-blur-xl"><div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-[#ffe17a]" size={20} /><div><h2 className="font-black text-white">Your card stays protected</h2><p className="mt-2 text-sm leading-6 text-white/65">Payment details are entered on Payfast&apos;s secure checkout, not stored by Skills Connect Pro.</p></div></div></div>
          <div className="rounded-[1.6rem] border border-white/15 bg-white/[.055] p-5 backdrop-blur-xl"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#ffe17a]" size={20} /><p className="text-sm leading-6 text-white/70"><strong className="block text-white">You decide what fits</strong>Review the job context, then choose whether the opportunity suits your skills and capacity.</p></div></div>
        </aside>
      </div>
    </main>
  );
}
