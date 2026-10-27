'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react';
import { providerTheme } from '@/services/planPresentation';

type Plan = { slug: string; name: string; price: string; kind: 'subscription' | 'lead_pack' };

export function ProviderCheckoutForm({ plan, providerId }: { plan: Plan; providerId?: string }) {
  const theme = providerTheme(plan.slug);
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

  return <div>
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/12 bg-black/20 px-4 py-4 text-sm"><div><p className="font-black text-white">{plan.name}</p><p className="mt-1 text-white/55">{plan.kind === 'subscription' ? 'Monthly provider access' : 'Once-off lead credits'}</p></div><p className={`shrink-0 text-xl font-black ${theme.price}`}>{plan.price}</p></div>
    {!providerId && <label className="mt-5 block text-sm font-bold text-white/82">Email or mobile number used when you joined Skills Connect Pro<input value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder="you@example.com or 071 234 5678" className="mt-2 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3.5 text-white placeholder:text-white/35 outline-none ring-[#ffd75f] transition focus:border-[#ffd75f]/60 focus:ring-2" /></label>}
    {plan.kind === 'subscription' && <p className="mt-4 rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm leading-6 text-white/65">Monthly plan checkout uses Payfast recurring billing. Access is granted only after verified payment. For renewal changes or cancellation, contact Skills Connect Pro support while self-service billing controls are being completed.</p>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-[#ff998f]/35 bg-[#74211d]/35 px-4 py-3 text-sm font-semibold text-[#ffd2cc]">{error}</p>}
    <button type="button" disabled={loading || (!providerId && !identity.trim())} onClick={startPayment} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${theme.button}`}>{loading ? <><LoaderCircle className="animate-spin" size={18} /> Opening secure checkout…</> : <>Continue securely to Payfast <ArrowRight size={18} /></>}</button>
    <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-white/48"><LockKeyhole className="mt-0.5 shrink-0 text-[#ffe17a]" size={14} /><span>By continuing, you agree to the <Link href="/terms" className="font-bold text-white/75 underline underline-offset-2">Provider Billing Terms</Link>. Provider access changes only after Payfast confirms the payment.</span></p>
  </div>;
}
