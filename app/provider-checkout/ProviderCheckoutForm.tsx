'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle } from 'lucide-react';

type Plan = { slug: string; name: string; price: string; kind: 'subscription' | 'lead_pack' };

export function ProviderCheckoutForm({ plan, providerId }: { plan: Plan; providerId?: string }) {
  const [identity, setIdentity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startPayment() {
    setError(null); setLoading(true);
    try {
      const response = await fetch('/api/payments/payfast/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan: plan.slug, providerId, providerIdentity: identity }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to start secure checkout.');
      const form = document.createElement('form'); form.method = 'POST'; form.action = payload.paymentUrl;
      for (const [name, value] of Object.entries(payload.fields || {})) { const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = String(value); form.appendChild(input); }
      document.body.appendChild(form); form.submit();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start secure checkout.'); setLoading(false);
    }
  }

  return <div className="mt-7">
    {!providerId && <label className="block text-sm font-bold text-[#3d483c]">Email or mobile number used when you joined Skills Connect Pro<input value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder="you@example.com or 071 234 5678" className="mt-2 w-full rounded-xl border border-[#cfc49e] bg-white px-4 py-3 text-[#172016] outline-none ring-[#d4a90a] focus:ring-2" /></label>}
    {plan.kind === 'subscription' && <p className="mt-4 text-sm leading-6 text-[#625a42]">Monthly plans are securely collected by card through Payfast. You can cancel future renewals at any time under the provider billing terms.</p>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-[#b83d35]/30 bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[#93261f]">{error}</p>}
    <button type="button" disabled={loading || (!providerId && !identity.trim())} onClick={startPayment} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#172016] px-4 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><LoaderCircle className="animate-spin" size={18} /> Opening secure checkout…</> : <>Continue to Payfast <ArrowRight size={18} /></>}</button>
    <p className="mt-4 text-center text-xs leading-5 text-[#6d6a59]">By continuing, you agree to the <Link href="/terms" className="font-bold underline">Provider Billing Terms</Link>. Provider access changes only after Payfast confirms the payment.</p>
  </div>;
}
