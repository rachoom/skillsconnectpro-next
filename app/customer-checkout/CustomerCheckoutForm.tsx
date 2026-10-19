'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle } from 'lucide-react';

type Plan = { code: string; name: string; priceCents: number; durationDays: number };

function money(value: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value / 100);
}

export function CustomerCheckoutForm({ plan }: { plan: Plan }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startPayment() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/payments/payfast/customer-checkout', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planCode: plan.code }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to start secure checkout.');
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payload.paymentUrl;
      for (const [name, value] of Object.entries(payload.fields || {})) {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = name; input.value = String(value); form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start secure checkout.');
      setLoading(false);
    }
  }

  return <div className="mt-7">
    <div className="rounded-2xl border border-[#e4d9b5] bg-[#fff9e8] p-4 text-sm leading-6 text-[#625a42]">You are purchasing <strong>{plan.name}</strong> for <strong>{money(plan.priceCents)}</strong>. This is a once-off {plan.durationDays}-day project-workspace pass; it does not create a recurring card subscription.</div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-[#b83d35]/30 bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[#93261f]">{error}</p>}
    <button type="button" disabled={loading} onClick={startPayment} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#172016] px-4 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><LoaderCircle className="animate-spin" size={18} /> Opening secure checkout…</> : <>Continue to Payfast <ArrowRight size={18} /></>}</button>
    <p className="mt-4 text-center text-xs leading-5 text-[#6d6a59]">By continuing, you agree to the <Link href="/terms" className="font-bold underline">Customer Project Plan Terms</Link>. Your plan activates only after Payfast verifies the payment.</p>
  </div>;
}
