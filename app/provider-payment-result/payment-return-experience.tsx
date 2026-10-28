'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Check, CheckCircle2,
  Clock3, FileCheck2, LockKeyhole, RefreshCw, Search, ShieldCheck, Sparkles, XCircle,
} from 'lucide-react';

type PaymentState = 'processing' | 'confirmed' | 'cancelled';
type StatusPayload = {
  status: PaymentState;
  planName: string;
  planPrice: string | null;
  kind: 'subscription' | 'lead_pack';
  verified: boolean;
};

const demoPlans: Record<PaymentState, StatusPayload> = {
  processing: { status: 'processing', planName: 'Pro', planPrice: 'R199', kind: 'subscription', verified: false },
  confirmed: { status: 'confirmed', planName: 'Pro', planPrice: 'R199', kind: 'subscription', verified: true },
  cancelled: { status: 'cancelled', planName: 'Pro', planPrice: 'R199', kind: 'subscription', verified: false },
};

export function ProviderPaymentReturnExperience({
  paymentReference, cancelled = false, demoState,
}: {
  paymentReference?: string | null;
  cancelled?: boolean;
  demoState?: PaymentState;
}) {
  const [payment, setPayment] = useState<StatusPayload | null>(demoState ? demoPlans[demoState] : null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const refresh = useCallback(async () => {
    if (demoState || !paymentReference) return;
    setChecking(true);
    try {
      const response = await fetch('/api/payments/payfast/provider-status?payment=' +
        encodeURIComponent(paymentReference), { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) {
        if (response.status === 404) throw new Error('We could not find this payment reference. Please contact support if you have been charged.');
        throw new Error('We could not check your payment yet. Please try again.');
      }
      const data = await response.json() as StatusPayload;
      if (!['confirmed', 'processing', 'cancelled'].includes(data.status)) {
        throw new Error('We could not read the payment status. Try again shortly.');
      }
      setPayment(data);
      setCheckError(null);
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : 'Status temporarily unavailable.');
    } finally {
      setAttempts((count) => count + 1);
      setChecking(false);
    }
  }, [paymentReference, demoState]);

  useEffect(() => {
    if (demoState || !paymentReference || payment?.status === 'confirmed' || payment?.status === 'cancelled') return;
    if (attempts >= 12) return;
    const timer = setTimeout(() => { void refresh(); }, attempts === 0 ? 100 : 5000);
    return () => clearTimeout(timer);
  }, [attempts, demoState, paymentReference, payment?.status, refresh]);

  const status: PaymentState = payment?.status === 'confirmed'
    ? 'confirmed' : cancelled || payment?.status === 'cancelled' ? 'cancelled' : 'processing';
  const isConfirmed = status === 'confirmed';
  const isCancelled = status === 'cancelled';
  const isPending = status === 'processing';
  const badge = isConfirmed ? 'Payment verified · Access active'
    : isCancelled ? 'Checkout not completed' : 'Secure verification in progress';
  const headline = isConfirmed
    ? <>You are ready for <span className="text-[#F6CD39]">what comes next.</span></>
    : isCancelled
      ? <>Your next opportunity can <span className="text-[#F6CD39]">wait for you.</span></>
      : <>Almost there. <span className="text-[#F6CD39]">Good things are in motion.</span></>;
  const description = isConfirmed
    ? 'Your Payfast payment has been verified and your provider access is active. You can get back to reviewing suitable opportunities and responding with confidence.'
    : isCancelled
      ? 'This checkout was not completed. Nothing needs to be purchased right now. You can return to the provider plans whenever you are ready.'
      : 'You have returned from Payfast. We are checking the verified payment notification before activating your provider plan. You do not need to make another payment.';

  const steps = [
    { label: 'Checkout started', detail: 'Secure payment journey', icon: LockKeyhole, done: true },
    { label: isConfirmed ? 'Payment verified' : isCancelled ? 'Checkout cancelled' : 'Checking payment', detail: isConfirmed ? 'Payfast confirmation received' : isCancelled ? 'No completed checkout confirmed' : 'Awaiting verified Payfast notice', icon: isCancelled ? XCircle : ShieldCheck, done: isConfirmed },
    { label: isConfirmed ? 'Access activated' : 'Plan activation', detail: isConfirmed ? 'Ready to respond' : 'Only after verification', icon: BriefcaseBusiness, done: isConfirmed },
  ];

  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden bg-[#0a100d] px-4 pb-16 pt-5 text-[#F7F3E9] sm:px-6 md:pt-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_10%,rgba(238,191,29,.16),transparent_40%),radial-gradient(circle_at_0%_70%,rgba(49,99,56,.18),transparent_38%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-48 -z-10 h-96 w-96 rounded-full border border-[#e5c34c]/[.08]" />

      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Skills Connect Pro home">
            <span className="grid size-11 shrink-0 place-items-center rounded-[.9rem] bg-[#F5C518] text-[#14150d] shadow-[0_8px_25px_rgba(245,197,24,.14)]"><Search size={22} strokeWidth={2.6}/></span>
            <span className="truncate text-base font-extrabold tracking-tight sm:text-lg">Skills<span className="text-[#F5C518]">ConnectPro</span></span>
          </Link>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#d7d1bd] sm:text-xs"><ShieldCheck size={15} className="text-[#F5C518]"/> Secure checkout</span>
        </header>

        {demoState && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#F5C518]/30 bg-[#F5C518]/[.08] px-4 py-3 text-xs font-bold text-[#F6DC7C]" role="status">
            <span>DESIGN PREVIEW · Sample data only · No payment activity</span>
            <div className="ml-auto flex gap-2">
              {(['processing', 'confirmed', 'cancelled'] as const).map((option) => (
                <Link key={option} href={'/provider-payment-result-preview?state=' + option}
                  className={'rounded-lg px-2.5 py-1.5 capitalize ' + (option === demoState ? 'bg-[#F5C518] text-[#171507]' : 'border border-[#F5C518]/30 text-[#F6DC7C]')}>
                  {option}
                </Link>
              ))}
            </div>
          </div>
        )}

        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-[#e0c44a]/20 bg-[#151b16] shadow-[0_30px_100px_rgba(0,0,0,.3)] sm:mt-8 md:rounded-[2.6rem]">
          <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-40 size-[30rem] rounded-full bg-[radial-gradient(circle,rgba(245,197,24,.18),transparent_66%)]" />
          <div className="relative grid items-center gap-8 px-6 pb-10 pt-9 sm:px-10 sm:pt-12 md:grid-cols-[1.2fr_.8fr] md:gap-5 md:px-12 md:pb-14">
            <div>
              <div className={'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[.12em] sm:text-xs ' +
                (isConfirmed ? 'border-emerald-300/40 bg-emerald-300/[.09] text-emerald-200' :
                isCancelled ? 'border-[#f9aa9b]/30 bg-[#f9aa9b]/[.08] text-[#fbc4b8]' :
                'border-[#F5C518]/35 bg-[#F5C518]/[.09] text-[#F6DA6C]')}>
                {isConfirmed ? <CheckCircle2 size={15}/> : isCancelled ? <XCircle size={15}/> : <Clock3 size={15} className="animate-pulse"/>}
                {badge}
              </div>
              <p className="mt-7 text-xs font-extrabold uppercase tracking-[.22em] text-[#F1CE56]">SKILLS CONNECT PRO / PROVIDER ACCESS</p>
              <h1 className="mt-4 max-w-2xl text-[clamp(2.5rem,7vw,4.7rem)] font-black leading-[1.04] tracking-[-.055em]">
                {headline}
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-[#ced2c8] sm:text-base">{description}</p>
              {(payment?.planName || demoState) && (
                <div className="mt-7 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-[#F5C518]/20 bg-[#F5C518]/[.065] px-4 py-3 text-sm text-[#f6e3a1]">
                  <BadgeCheck size={19} className="shrink-0 text-[#F5C518]"/>
                  <span><strong>{payment?.planName ?? 'Provider'} plan</strong>{payment?.planPrice ? ' · ' + payment.planPrice : ''}</span>
                  <span className="text-[#b9b6a2]">{isConfirmed ? '· Active' : '· Not yet active'}</span>
                </div>
              )}
            </div>

            <div className="relative mx-auto grid h-56 w-full max-w-sm place-items-center overflow-hidden rounded-[2rem] border border-[#f1ca3a]/20 bg-[radial-gradient(circle_at_50%_45%,rgba(240,189,33,.18),rgba(8,17,11,.6)_66%)] sm:h-64 md:h-80" aria-hidden="true">
              <div className="absolute size-56 rounded-full border border-[#f6ca2d]/15 sm:size-60"/>
              <div className="absolute size-40 rounded-full border border-dashed border-[#f6ca2d]/25 sm:size-44"/>
              <div className={'relative grid size-28 place-items-center rounded-[2rem] border shadow-[0_20px_65px_rgba(0,0,0,.32)] sm:size-32 ' +
                (isConfirmed ? 'border-emerald-300/40 bg-[#173e2b] text-emerald-300' :
                isCancelled ? 'border-[#d9897b]/35 bg-[#3a2422] text-[#ffb8ad]' :
                'border-[#F5C518]/35 bg-[#302a11] text-[#F5C518]')}>
                {isConfirmed ? <Check size={58} strokeWidth={2.4}/> : isCancelled ? <XCircle size={57} strokeWidth={1.7}/> : <ShieldCheck size={59} strokeWidth={1.65}/>}
              </div>
              <span className="absolute bottom-5 text-[10px] font-bold uppercase tracking-[.22em] text-[#e2d5a5]">
                {isConfirmed ? 'Verified · Activated' : isCancelled ? 'No confirmed payment' : 'Verification first'}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Payment progress">
          {steps.map(({ label, detail, icon: Icon, done }, index) => (
            <div key={label} className={'flex items-start gap-3 rounded-[1.35rem] border p-4 sm:p-5 ' +
              (done ? 'border-[#F5C518]/25 bg-[#1c241a]' : 'border-white/10 bg-[#141914]')}>
              <span className={'grid size-11 shrink-0 place-items-center rounded-xl ' + (done ? 'bg-[#F5C518]/15 text-[#F5C518]' : 'bg-white/[.06] text-[#aeb9ac]')}>
                <Icon size={21} strokeWidth={1.9}/>
              </span>
              <div className="min-w-0"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.15em] text-[#e5c55d]">STEP 0{index+1}</p>
                <h2 className="text-sm font-extrabold text-[#f7f2e6] sm:text-base">{label}</h2>
                <p className="mt-1 text-xs leading-5 text-[#aeb9ac]">{detail}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-5 grid gap-5 rounded-[1.8rem] border border-white/10 bg-[#151b16] p-5 sm:p-7 md:grid-cols-[1.1fr_.9fr] md:items-center md:gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.15em] text-[#F5C518]"><Sparkles size={17}/> {isConfirmed ? 'WHAT HAPPENS NEXT' : isCancelled ? 'YOU ARE ALWAYS WELCOME BACK' : 'YOUR PAYMENT IS PROTECTED'}</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              {isConfirmed ? 'Your next job starts with a great response.' : isCancelled ? 'Choose the right time to continue.' : 'We will only unlock verified access.'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c2c8bd]">
              {isConfirmed ? 'Open your artisan workspace to review opportunities and your plan allowance. If you arrived from a WhatsApp job invitation, you can reopen that link.'
                : isCancelled ? 'Explore the available provider plans without losing your existing profile or free access.'
                : 'Payfast confirms the transaction privately with Skills Connect Pro. The browser return alone cannot activate paid benefits. If you have paid, please do not purchase again while verification is pending.'}
            </p>
            {checkError && !demoState && <p role="alert" className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[.08] p-3 text-sm text-[#f6dda1]">{checkError}</p>}
            {isPending && !demoState && attempts >= 12 && !checkError && (
              <p role="status" className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[.08] p-3 text-sm text-[#f6dda1]">
                Verification is taking longer than expected. Your payment is not yet confirmed in our system. Please do not pay again until the transaction is checked.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {isPending && paymentReference && !demoState ? (
              <button type="button" disabled={checking} onClick={() => { setAttempts(0); void refresh(); }}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#F5C518] px-5 py-4 text-sm font-extrabold text-[#191909] shadow-[0_12px_30px_rgba(245,197,24,.14)] transition hover:bg-[#ffdf4c] disabled:opacity-60">
                <RefreshCw size={18} className={checking ? 'animate-spin' : ''}/>
                {checking ? 'Checking securely…' : 'Check payment status'}
              </button>
            ) : (
              <Link href={isConfirmed ? '/artisan-business' : '/provider-plans'}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#F5C518] px-5 py-4 text-center text-sm font-extrabold text-[#191909] shadow-[0_12px_30px_rgba(245,197,24,.14)] transition hover:bg-[#ffdf4c]">
                {isConfirmed ? 'Open artisan workspace' : 'View provider plans'} <ArrowRight size={19}/>
              </Link>
            )}
            <Link href={isConfirmed ? '/provider-plans' : '/artisan-business'}
              className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[#dbd8c8] hover:text-[#F5C518]">
              {isConfirmed ? 'Explore other provider options' : 'Open artisan workspace'} <ArrowRight size={16}/>
            </Link>
          </div>
        </section>

        {!demoState && !paymentReference && (
          <p role="alert" className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/[.08] px-4 py-4 text-sm text-[#f6dda1]">
            This link does not contain a payment reference, so we cannot verify a specific transaction. Reopen the return link from your original checkout, or contact support if you have been charged.
          </p>
        )}
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#a7b1a5]">
          <span className="inline-flex items-center gap-2"><LockKeyhole size={14} className="text-[#F5C518]"/> Provider payments secured through Payfast</span>
          <Link href="/" className="inline-flex items-center gap-2 hover:text-white"><ArrowLeft size={14}/> Skills Connect Pro home</Link>
        </footer>
      </div>
    </main>
  );
}
