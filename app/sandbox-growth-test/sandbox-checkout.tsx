'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, FlaskConical, CheckCircle2 } from 'lucide-react';

export function GrowthSandboxCheckout() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const candidate = params.get('test') || '';
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    if (/^[a-f0-9]{64}$/.test(candidate)) setToken(candidate);
  }, []);

  async function openSandbox() {
    setError(''); setLoading(true);
    try {
      const response = await fetch('/api/sandbox-growth-test/checkout', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ testToken: token }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not start sandbox checkout');
      const url = new URL(result.paymentUrl);
      if (url.origin !== 'https://sandbox.payfast.co.za') throw new Error('Unsafe payment destination. No payment submitted.');
      const form = document.createElement('form');
      form.method = 'POST'; form.action = url.href;
      for (const [name, value] of Object.entries(result.fields || {})) {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = name; input.value = String(value);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open sandbox payment');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09150f] px-5 py-10 text-[#f9f5e9]">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-[#dfbe4d]/30 bg-[#14271d] p-7 shadow-2xl sm:p-10">
        <div className="flex items-center gap-3 text-sm font-extrabold tracking-widest text-[#f8d44c]"><FlaskConical size={22} /> SANDBOX TEST ONLY</div>
        <h1 className="mt-6 text-4xl font-black tracking-tight">Growth plan payment test</h1>
        <p className="mt-4 text-base leading-7 text-white/75">This isolated Skills Connect Pro test uses a synthetic provider record. It does not sign you up as an artisan or change an existing account.</p>
        <div className="mt-7 rounded-2xl border border-[#e4bf4d]/40 bg-black/20 p-5">
          <div className="flex items-center justify-between"><span className="text-xl font-bold">Growth</span><strong className="text-3xl text-[#f8d44c]">R99</strong></div>
          <p className="mt-2 text-sm text-white/65">Simulated monthly subscription • 40 paid responses</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#b6e6bc]"><CheckCircle2 size={17}/> Staging database, not the production marketplace</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-[#b6e6bc]"><ShieldCheck size={17}/> Only sandbox.payfast.co.za is allowed</div>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/30 bg-red-900/30 p-4 text-sm text-red-100">{error}</p>}
        {!token && <p className="mt-5 rounded-xl border border-amber-300/30 bg-amber-900/20 p-4 text-sm text-amber-100">This link is missing its temporary test authorization. Open the full link provided in the chat.</p>}
        <button disabled={!token || loading} onClick={openSandbox}
          className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#ffcf24] px-5 py-4 font-extrabold text-[#1e2114] disabled:cursor-not-allowed disabled:opacity-40">
          {loading ? 'Opening PayFast sandbox…' : 'Start simulated Growth payment'} <ArrowRight size={20}/>
        </button>
        <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-white/60"><LockKeyhole className="mt-1 shrink-0 text-[#f8d44c]" size={17}/> Before completing payment, verify the browser address begins with https://sandbox.payfast.co.za. Do not enter real card credentials.</p>
      </section>
    </main>
  );
}
