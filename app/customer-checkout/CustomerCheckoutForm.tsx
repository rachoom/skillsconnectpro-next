'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react';

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
      form.method = 'POST'; form.action = payload.paymentUrl;
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

  return <div>
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/12 bg-black/20 px-4 py-4 text-sm"><div><p className="font-black text-white">{plan.name}</p><p className="mt-1 text-white/55">{plan.durationDays}-day once-off workspace pass</p></div><p className="shrink-0 text-xl font-black text-[#ffe17a]">{money(plan.priceCents)}</p></div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-[#ff998f]/35 bg-[#74211d]/35 px-4 py-3 text-sm font-semibold text-[#ffd2cc]">{error}</p>}
    <button type="button" disabled={loading} onClick={startPayment} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd75f] px-4 py-4 text-sm font-black text-[#241b00] shadow-[0_14px_32px_rgba(255,215,95,.18)] transition hover:-translate-y-0.5 hover:bg-[#ffe384] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><LoaderCircle className="animate-spin" size={18} /> Opening secure checkout…</> : <>Continue securely to Payfast <ArrowRight size={18} /></>}</button>
    <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-white/48"><LockKeyhole className="mt-0.5 shrink-0 text-[#ffe17a]" size={14} /><span>By continuing, you agree to the <Link href="/terms" className="font-bold text-white/75 underline underline-offset-2">Customer Project Plan Terms</Link>. Your plan activates only after Payfast verifies the payment.</span></p>
  </div>;
}
