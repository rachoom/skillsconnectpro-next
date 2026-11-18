'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle } from 'lucide-react';

export function CustomerCheckoutForm({ planCode }: { planCode: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startPayment() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/payments/payfast/customer-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: planCode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to start secure checkout.');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payload.paymentUrl;
      for (const [name, value] of Object.entries(payload.fields || {})) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start secure checkout.');
      setLoading(false);
    }
  }

  return (
    <div className="mt-7">
      {error && <p role="alert" className="rounded-xl border border-[#ef6a5c]/30 bg-[#3a1512] px-4 py-3 text-sm font-semibold text-[#ffc0b9]">{error}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={startPayment}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffd75f] px-4 py-4 text-sm font-black text-[#211800] transition hover:bg-[#ffe58f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <><LoaderCircle className="animate-spin" size={18} /> Opening secure checkout…</> : <>Continue to PayFast <ArrowRight size={18} /></>}
      </button>
      <p className="mt-4 text-center text-xs leading-5 text-white/45">
        By continuing, you agree to the <Link href="/terms" className="font-bold text-[#ffe17a] underline">Skills Connect Pro terms</Link>.
      </p>
    </div>
  );
}
