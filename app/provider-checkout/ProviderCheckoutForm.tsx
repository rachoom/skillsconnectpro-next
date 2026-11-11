'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, CreditCard, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { providerTheme } from '@/services/planPresentation';

type Plan = { slug: string; name: string; price: string; kind: 'subscription' | 'lead_pack' };

export function ProviderCheckoutForm({ plan }: { plan: Plan }) {
  const theme = providerTheme(plan.slug);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startPayment() {
    setError(null); setLoading(true);
    try {
      const response = await fetch('/api/payments/payfast/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan: plan.slug }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to start secure checkout.');
      const form = document.createElement('form'); form.method = 'POST'; form.action = payload.paymentUrl;
      for (const [name, value] of Object.entries(payload.fields || {})) { const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = String(value); form.appendChild(input); }
      document.body.appendChild(form); form.submit();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start secure checkout.'); setLoading(false);
    }
  }

  return (
    <div className="mt-1">
      <div className="rounded-[1.35rem] border border-[#f5c518]/25 bg-[linear-gradient(120deg,rgba(245,197,24,.11),rgba(255,255,255,.025))] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.17em] text-[#e9c86d]">Your selected plan</p>
            <p className="mt-2 text-xl font-black tracking-tight text-white">{plan.name}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#beb7a6]">
              {plan.kind === 'subscription' ? 'Automatically renewing monthly subscription' : 'Once-off lead credit purchase'}
            </p>
          </div>
          <p className={`text-3xl font-black tracking-tight ${theme.price}`}>{plan.price}
            <span className="block text-right text-[11px] font-bold tracking-normal text-[#cfc6b0]">
              {plan.kind === 'subscription' ? 'every month' : 'one payment'}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-[#d5d0c5] sm:p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={19} className={`mt-0.5 shrink-0 ${theme.check}`} aria-hidden="true" />
          <p>Linked to your <strong className="text-white">signed-in, approved artisan account</strong>. You are not paying on behalf of another provider.</p>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck size={19} className={`mt-0.5 shrink-0 ${theme.check}`} aria-hidden="true" />
          <p>Your plan becomes active only after <strong className="text-white">PayFast verifies payment</strong>, not merely when the checkout page returns.</p>
        </div>
        {plan.kind === 'subscription' ? (
          <div className="flex items-start gap-3">
            <CreditCard size={19} className={`mt-0.5 shrink-0 ${theme.check}`} aria-hidden="true" />
            <p><strong className="text-white">Recurring payment:</strong> {plan.price} is charged monthly until you cancel future renewals from your Artisan Business Workspace. Your paid access remains subject to the subscription terms.</p>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <CreditCard size={19} className={`mt-0.5 shrink-0 ${theme.check}`} aria-hidden="true" />
            <p>This is a <strong className="text-white">once-off payment</strong>, with no automatic renewal.</p>
          </div>
        )}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-[#ff998f]/35 bg-[#74211d]/35 px-4 py-3 text-sm font-semibold text-[#ffd2cc]">{error}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={startPayment}
        className={`mt-5 flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[1rem] px-4 py-4 text-base font-black shadow-[0_16px_36px_rgba(0,0,0,.28)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 ${theme.button}`}
      >
        {loading ? <><LoaderCircle className="animate-spin" size={20} /> Opening secure checkout…</> : <><LockKeyhole size={19} /> Continue securely to PayFast <ArrowRight size={19} /></>}
      </button>
      <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-[#bbb3a1]">
        <LockKeyhole className={`mt-0.5 shrink-0 ${theme.check}`} size={14} aria-hidden="true" />
        <span>Payment details are entered with PayFast. By continuing, you agree to the <Link href="/terms" className="font-bold text-[#ffe08c] underline underline-offset-2">Provider Billing Terms</Link>. Responding to opportunities does not guarantee a job.</span>
      </p>
    </div>
  );
}
