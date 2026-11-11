import { redirect } from 'next/navigation';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, Check, CreditCard, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { getProviderPlan } from '../provider-plans/planCatalog';
import { ProviderCheckoutForm } from './ProviderCheckoutForm';
import { providerTheme } from '@/services/planPresentation';

export default async function ProviderCheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; provider?: string }> }) {
  const { plan: slug } = await searchParams;
  const plan = slug ? getProviderPlan(slug) : undefined;
  const { supabase, user } = await getAuthenticatedAccount();
  if (plan && !user) redirect('/sign-in?next=' + encodeURIComponent('/provider-checkout?plan=' + plan.slug));
  const { data: role } = user ? await supabase.from('account_roles')
    .select('linked_artisan_id').eq('user_id', user.id)
    .eq('role', 'artisan').eq('status', 'active').maybeSingle() : { data: null };
  const canCheckout = Boolean(role?.linked_artisan_id);
  const theme = plan ? providerTheme(plan.slug) : providerTheme('starter');

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#090909] text-[#f9f5ea]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_15%,rgba(245,197,24,.10),transparent_28rem),radial-gradient(circle_at_0%_62%,rgba(147,116,47,.08),transparent_32rem)]" />
      <nav className="border-b border-[#ad8d46]/20 bg-[#0b0b0b]/95 px-4 py-3.5 backdrop-blur-xl sm:px-7">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/" aria-label="Skills Connect Pro home" className="min-w-0">
            <Image src="/logo-new.svg" alt="Skills Connect Pro" width={190} height={50} priority className="h-auto w-[155px] sm:w-[190px]" />
          </Link>
          <Link href={plan ? `/provider-plans/${plan.slug}` : '/provider-plans'} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#f5c518]/30 px-3.5 text-xs font-bold text-[#f5e7c0] transition hover:border-[#f5c518] hover:bg-[#f5c518]/10 sm:text-sm"><ArrowLeft size={16} /> Back to plan</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-7 sm:px-7 md:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c518]">Provider membership · Secure checkout</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#c5a757]/30 bg-[#f5c518]/[.07] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#e6d39e]"><LockKeyhole size={14} /> Step 2 of 2 · Review &amp; pay</span>
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.04] tracking-[-.05em] text-white sm:text-5xl md:text-6xl">
          {plan ? <>Ready to grow with <span className={theme.price}>{plan.name}?</span></> : <>Choose the plan that <span className="text-[#f5c518]">works for you.</span></>}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#beb8aa] sm:text-base">
          Everything in one place. Review your membership, understand the payment terms and continue to PayFast only when you are ready.
        </p>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.88fr)] lg:gap-8">
          <section className="order-2 overflow-hidden rounded-[1.65rem] border border-[#a68a4b]/25 bg-[#141311] shadow-[0_25px_70px_rgba(0,0,0,.3)] lg:order-1" aria-label="Selected provider plan benefits">
            <div className="relative isolate min-h-56 overflow-hidden p-6 sm:p-8">
              <Image src="/artisans/hero-welder.jpg" alt="Skilled service provider at work" fill priority className="-z-20 object-cover object-center" sizes="(min-width:1024px) 55vw, 100vw" />
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,10,9,.98),rgba(10,10,9,.83)_58%,rgba(10,10,9,.38))]" />
              <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/35 bg-black/55 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-[#ffe28e]"><Sparkles size={14} /> Made for working professionals</span>
              <h2 className="mt-7 max-w-md text-3xl font-black leading-tight tracking-[-.04em] text-white">Your skills deserve <span className="text-[#f5c518]">more opportunities.</span></h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">Clear customer briefs. Professional responses. Your business, your pace.</p>
            </div>
            {plan ? (
              <div className="p-6 sm:p-8">
                <p className="text-[11px] font-black uppercase tracking-[.17em] text-[#f5c518]">What {plan.name} includes</p>
                <ul className="mt-5 grid gap-3.5">
                  {plan.included.slice(0, 6).map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#e4ddce]"><Check className="mt-0.5 shrink-0 text-[#f5c518]" size={19} aria-hidden="true" /> {item}</li>)}
                </ul>
                <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-[#aca698]">You choose which invitations to respond to. Plan limits control response allowances, not guaranteed jobs or customer selection.</p>
              </div>
            ) : (
              <div className="p-7"><p className="text-sm text-[#c5bdad]">Compare Starter, Growth, Pro, or once-off lead packs to choose the access you need.</p><Link href="/provider-plans" className="mt-5 inline-flex items-center gap-2 font-black text-[#f5c518]">Review provider plans <ArrowLeft size={17} /></Link></div>
            )}
          </section>

          <aside className="order-1 lg:sticky lg:top-6 lg:order-2" aria-label="Order summary and payment">
            <div className={`overflow-hidden rounded-[1.65rem] border shadow-[0_26px_80px_rgba(0,0,0,.38)] ${theme.card}`}>
              <div className="border-b border-white/20 bg-white/[.045] px-5 py-6 sm:px-7">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-[.18em] ${theme.price}`}>Your order summary</span>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${theme.badge}`}>{plan?.kind === 'subscription' ? 'Monthly membership' : 'Once-off'}</span>
                </div>
                <h2 className="mt-3 text-2xl font-black text-white">{plan?.name ?? 'Select a plan'}</h2>
                {plan && <div className="mt-4 flex items-end gap-2"><span className={`text-5xl font-black tracking-[-.05em] ${theme.price}`}>{plan.price}</span><span className="pb-1 text-sm font-semibold text-[#dbd1b9]">{plan.kind === 'subscription' ? 'per month' : 'once-off'}</span></div>}
                {plan && <p className="mt-3 text-xs leading-6 text-[#e1d8c1]">{plan.included[0]}</p>}
              </div>

              <div className="p-5 sm:p-7">
                {plan ? (canCheckout ? (
                  <ProviderCheckoutForm plan={{ slug: plan.slug, name: plan.name, price: plan.price, kind: plan.kind }} />
                ) : (
                  <div role="status" className="rounded-[1.2rem] border border-[#f5c518]/40 bg-[#f5c518]/[.07] p-5">
                    <div className="flex items-center gap-3"><ShieldCheck className="text-[#f5c518]" size={22} /><h3 className="text-lg font-black text-white">Link your approved artisan account first</h3></div>
                    <p className="mt-3 text-sm leading-6 text-[#e6dbba]">We only accept payment for the signed-in provider's approved account. Your plan will become available after approval and account linking.</p>
                    <div className="mt-5 grid gap-3">
                      <Link href="/artisan-business" className="rounded-xl bg-[#f5c518] px-4 py-3 text-center text-sm font-black text-[#181206]">Open Artisan Business Workspace</Link>
                      <Link href="/join" className="rounded-xl border border-[#f5c518]/35 px-4 py-3 text-center text-sm font-bold text-[#f5d77b]">Apply as a provider</Link>
                    </div>
                  </div>
                )) : <Link href="/provider-plans" className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#f5c518] px-4 py-3 font-black text-[#161007]">Choose a provider plan <BriefcaseBusiness size={18} /></Link>}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex gap-3 rounded-[1.2rem] border border-white/10 bg-white/[.035] p-4"><LockKeyhole size={19} className="mt-1 shrink-0 text-[#f5c518]" /><p className="text-xs leading-6 text-[#c8c0b2]"><strong className="block text-sm text-white">Secure PayFast checkout</strong>Your payment details are entered on PayFast's checkout, not collected by Skills Connect Pro.</p></div>
              <div className="flex gap-3 rounded-[1.2rem] border border-white/10 bg-white/[.035] p-4"><ShieldCheck size={19} className="mt-1 shrink-0 text-[#f5c518]" /><p className="text-xs leading-6 text-[#c8c0b2]"><strong className="block text-sm text-white">No access until verified</strong>Membership activates only after confirmed payment. Customer selection is never guaranteed.</p></div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
