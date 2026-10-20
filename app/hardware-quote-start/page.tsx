'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, PackageSearch, ShieldCheck } from 'lucide-react';

type EstimateContext = {
  description?: string;
  image?: string | null;
  service?: string;
  estimate?: {
    materials?: number;
    tools?: number;
    laborHours?: number;
    laborTotal?: number;
    trueCost?: number;
    materialsList?: Array<{ name?: string; quantity?: string; unitCost?: number; total?: number }>;
    estimateType?: string;
  };
};

const AREAS = ['Alberton','Benoni','Boksburg','Brakpan','Daveyton','Duduza','Germiston','Johannesburg','Katlehong','Kempton Park','Kwa-Thema','Nigel','Springs','Tembisa','Tsakane','Vosloorus'];

export default function HardwareQuoteStartPage() {
  const [context, setContext] = useState<EstimateContext | null>(null);
  const [area, setArea] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem('scp-hardware-quote-context');
      if (stored) setContext(JSON.parse(stored) as EstimateContext);
    } catch {
      setContext(null);
    }
  }, []);

  const submit = async () => {
    const deliveryArea = customArea.trim() || area;
    if (!context?.description || !deliveryArea) {
      setError(!context?.description ? 'Return to the calculator and create an estimate first.' : 'Choose or enter a delivery area.');
      return;
    }
    if (!context.estimate?.materialsList?.length) {
      setError('This estimate has no itemised materials. Return to the calculator and refine the estimate first.');
      return;
    }

    setError('');
    setWorking(true);
    const projectResponse = await fetch('/api/hardware/from-estimate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...context, deliveryArea }),
    });

    if (projectResponse.status === 401) {
      try { window.sessionStorage.setItem('scp-hardware-quote-context', JSON.stringify(context)); } catch {}
      window.location.href = '/sign-in?next=/hardware-quote-start';
      return;
    }

    const projectResult = await projectResponse.json().catch(() => ({}));
    if (!projectResponse.ok || !projectResult?.projectId) {
      setWorking(false);
      setError(projectResult?.error ?? 'Unable to save this procurement project.');
      return;
    }

    const quoteResponse = await fetch('/api/hardware/quote-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: projectResult.projectId, deliveryArea, notes }),
    });
    const quoteResult = await quoteResponse.json().catch(() => ({}));

    if (!quoteResponse.ok) {
      setWorking(false);
      if (quoteResponse.status === 403 && quoteResult?.upgradeUrl) {
        setError(`${quoteResult.error} Your project has been saved. Upgrade your plan to send another hardware quotation request.`);
        return;
      }
      setError(quoteResult?.error ?? 'The project was saved, but the hardware quotation request could not be sent.');
      return;
    }

    try { window.sessionStorage.removeItem('scp-hardware-quote-context'); } catch {}
    window.location.href = `/hardware-quotations/${quoteResult.id}`;
  };

  return (
    <main className="min-h-screen bg-[#080705] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/estimator" className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white"><ArrowLeft size={17}/> Back to calculator</Link>
          <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={185} height={48} /></Link>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#f9c62b]/35 bg-white/[0.05] p-6 sm:p-8">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#f9c62b]">Materials procurement</span>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Get Hardware Quotes</h1>
          <p className="mt-3 leading-7 text-white/70">Send the itemised materials from your AI Project Assistant estimate directly to participating hardware suppliers. You do not need to choose an artisan first.</p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
            <strong className="block">Project</strong>
            <p className="mt-1 text-sm text-white/65">{context?.description || 'No calculator estimate is loaded yet.'}</p>
            <p className="mt-2 text-xs text-[#f9c62b]">{context?.estimate?.materialsList?.length ?? 0} material item(s) ready to request.</p>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-white/65">Delivery area</span>
              <select value={area} onChange={(e) => { setArea(e.target.value); if (e.target.value) setCustomArea(''); }} className="w-full rounded-xl border border-white/15 bg-[#111] px-4 py-3 text-base text-white">
                <option value="">Choose area</option>{AREAS.map((item) => <option value={item} key={item}>{item}</option>)}<option value="other">Other area</option>
              </select>
            </label>
            {area === 'other' && <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-white/65">Town / suburb</span><input value={customArea} onChange={(e) => setCustomArea(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#111] px-4 py-3 text-base text-white" placeholder="Enter delivery area" /></label>}
            <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-white/65">Supplier note — optional</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-white/15 bg-[#111] px-4 py-3 text-base text-white" placeholder="Brand preferences, delivery notes, alternatives allowed..." /></label>
          </div>

          {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

          <button type="button" onClick={submit} disabled={working || !context} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f9c62b] px-5 py-4 font-black uppercase tracking-[0.12em] text-black disabled:opacity-50">
            {working ? <Loader2 className="animate-spin" size={19}/> : <PackageSearch size={19}/>} {working ? 'Preparing request…' : 'Request Hardware Quotations'}
          </button>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-5 text-white/60"><ShieldCheck className="mt-0.5 shrink-0 text-[#f9c62b]" size={17}/><span>Plan limits are checked securely on the server. The request shares the materials list and delivery area with invited hardware partners—not your private project workspace.</span></div>
        </section>
      </div>
    </main>
  );
}
