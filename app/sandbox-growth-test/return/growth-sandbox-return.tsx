'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock3, AlertTriangle, ShieldCheck } from 'lucide-react';

export function GrowthSandboxReturn({ reference, cancelled }: { reference: string | null; cancelled: boolean }) {
  const [status, setStatus] = useState<'processing' | 'confirmed' | 'cancelled' | 'error'>('processing');
  const [checked, setChecked] = useState(0);
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!reference || status !== 'processing' || checked >= 12) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/sandbox-growth-test/status?payment=' + encodeURIComponent(reference), {
          credentials: 'same-origin', cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Verification temporarily unavailable');
        if (data.status === 'confirmed') { setStatus('confirmed'); setActive(data.active === true); }
        else if (data.status === 'cancelled') setStatus('cancelled');
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Verification temporarily unavailable');
      } finally { setChecked(n => n + 1); }
    }, checked === 0 ? 300 : 5000);
    return () => clearTimeout(timer);
  }, [reference, status, checked]);
  const verified = status === 'confirmed' && active;
  return <main className="min-h-screen bg-[#09150f] px-4 py-12 text-white">
    <div className="mx-auto max-w-xl rounded-[2rem] border border-[#efc749]/30 bg-[#17251a] p-8">
      <p className="text-sm font-black uppercase tracking-widest text-[#f8d44c]">Skills Connect Pro · Sandbox only</p>
      <div className="mt-7 text-[#ffda3b]">
        {verified ? <CheckCircle2 size={65}/> : <Clock3 size={65}/>}
      </div>
      <h1 className="mt-5 text-3xl font-extrabold">{verified ? 'Growth activated successfully' : cancelled ? 'Sandbox checkout returned as cancelled' : 'Verifying your simulated payment'}</h1>
      <p className="mt-5 leading-7 text-white/75">
        {verified ? 'PayFast notification recorded, and the staging Growth provider now has 40 paid responses.'
        : 'A browser return does not prove payment completion. We are checking the PayFast notification and the staging entitlement. Please do not repeat the payment until it is verified.'}
      </p>
      {!verified && <div className="mt-6 rounded-xl border border-white/15 p-4 text-sm">
        <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#f8d44c]"/> Verified notification required</div>
        <p className="mt-2 text-white/60">{checked >= 12 ? 'Verification took longer than expected.' : 'Status checks: ' + checked + ' / 12'}</p>
      </div>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-amber-300/30 p-4 text-sm text-amber-200">{error}</p>}
      {!reference && <p className="mt-5 text-amber-200">No reference was provided by the checkout.</p>}
      <Link href="/sandbox-growth-test" className="mt-7 inline-flex rounded-xl border border-[#f8d44c]/40 px-5 py-3 font-bold text-[#f8d44c]">Back to sandbox test</Link>
    </div>
  </main>;
}
