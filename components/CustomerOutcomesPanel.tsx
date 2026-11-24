'use client';

import { useEffect, useState } from 'react';

type Outcomes = {
  submitted: number; invited: number; sent: number; delivered: number; viewed: number;
  responded: number; selected: number; released: number; reported: number; completed: number;
  cancelled: number; failedProjects: number; invitations: number; failedInvitations: number;
};

const STAGES: Array<[keyof Outcomes, string]> = [
  ['submitted', 'Projects submitted'], ['invited', 'Projects with invitations'],
  ['sent', 'At least one invitation sent'], ['delivered', 'At least one invitation delivered'],
  ['viewed', 'At least one invitation viewed'], ['responded', 'Provider response received'],
  ['selected', 'Provider selected'], ['released', 'Contact details released'],
  ['completed', 'Project completed'],
];

function localDay(offset = 0) {
  return new Date(Date.now() + (2 * 60 * 60 * 1000) + offset * 86_400_000).toISOString().slice(0, 10);
}

export function CustomerOutcomesPanel({ adminKey }: { adminKey?: string }) {
  const [from, setFrom] = useState(() => localDay(-6));
  const [to, setTo] = useState(() => localDay());
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Outcomes | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    const query = new URLSearchParams({ from, to });
    fetch('/api/admin/customer-outcomes?' + query.toString(), {
      headers: adminKey ? { 'x-marketplace-admin-key': adminKey } : {},
      credentials: 'same-origin',
      cache: 'no-store', signal: controller.signal,
    }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load outcomes.');
      if (!controller.signal.aborted) setData(result);
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load outcomes.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [adminKey, from, to, revision]);

  const rate = (value: number) => data?.submitted ? Math.round(value / data.submitted * 100) + '%' : '—';
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Customer acquisition</p>
        <h2 className="mt-1 text-xl font-black">Customer outcomes</h2>
        <p className="mt-2 text-sm text-zinc-400">Follow projects created within the selected dates through their latest recorded marketplace outcomes.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-xs font-bold">From (SAST)
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="min-w-0 rounded-xl border border-white/20 bg-black/20 p-3 text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-bold">To (SAST)
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="min-w-0 rounded-xl border border-white/20 bg-black/20 p-3 text-sm" />
        </label>
        <button type="button" onClick={() => setRevision(value => value + 1)} className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-black">Refresh</button>
      </div>
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm">
        <strong>Attribution not yet available.</strong> Ad clicks, page arrivals, intake starts and pre-submission abandonment are not recorded here. Historical projects can include internal/pilot requests and cannot be attributed to individual campaigns.
      </div>
      {loading && <p role="status">Loading outcomes…</p>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {data && <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {([['submitted','Submitted'],['released','Contact released'],['completed','Completed'],['cancelled','Cancelled']] as const).map(([key,label]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-zinc-400">{label}</p><p className="mt-1 text-2xl font-black">{data[key]}</p>
              <p className="text-xs text-zinc-400">{rate(data[key])} of submitted</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="font-bold">Project-level outcomes</h3>
          {STAGES.map(([key,label]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm"><span>{label}</span><strong>{data[key]} · {rate(data[key])}</strong></div>
              <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-amber-400" style={{width: data.submitted ? Math.min(100,data[key]/data.submitted*100)+'%' : '0%'}} /></div>
            </div>
          ))}
          <p className="text-xs text-zinc-400">Stages reflect recorded timestamps or states; they need not be strictly sequential. Completion means the project is marked completed, not independently verified payment.</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4 text-sm">
          <h3 className="font-bold">Delivery and follow-up</h3>
          <p className="mt-2">Invitation records: {data.invitations}</p>
          <p>Currently failed invitations: {data.failedInvitations} across {data.failedProjects} projects</p>
          <p>Provider completion reports recorded: {data.reported}</p>
        </div>
      </>}
    </div>
  );
}
