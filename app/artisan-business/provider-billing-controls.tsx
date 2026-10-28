'use client';
import { useState } from 'react';

export function ProviderBillingControls({ plan, remaining, limit, periodEnd, cancellationPending }: {
  plan: string;
  remaining: number;
  limit: number;
  periodEnd: string | null;
  cancellationPending: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [cancelled, setCancelled] = useState(cancellationPending);
  const [notice, setNotice] = useState('');
  const end = periodEnd ? new Date(periodEnd).toLocaleDateString('en-ZA') : 'your current period end';

  async function cancelRenewal() {
    if (!window.confirm('Cancel future Payfast subscription payments? Your paid access continues until the end of the current period.')) return;
    setPending(true); setNotice('');
    try {
      const response = await fetch('/api/provider-billing/cancel', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cancellation was not confirmed.');
      setCancelled(true);
      setNotice('Future renewals cancelled. Current access continues until ' + end + '.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to cancel. Please contact support.');
    } finally { setPending(false); }
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#d5b94b]/40 bg-black/20 p-4">
      <h3 className="text-base font-bold">Your {plan} allowance</h3>
      <p className="mt-2 text-sm">Paid responses remaining: <strong>{remaining} of {limit}</strong>.</p>
      <p className="mt-1 text-xs opacity-70">Allowance resets after a verified monthly renewal. Access until {end}.</p>
      {cancelled ? <p className="mt-3 text-sm font-bold text-amber-300">Future renewals cancelled</p> :
      <button type="button" disabled={pending} onClick={cancelRenewal}
        className="mt-3 rounded-xl border border-amber-300/60 px-4 py-3 text-sm font-semibold text-amber-200 disabled:opacity-60">
        {pending ? 'Confirming cancellation…' : 'Cancel future renewals'}
      </button>}
      {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
    </div>
  );
}
