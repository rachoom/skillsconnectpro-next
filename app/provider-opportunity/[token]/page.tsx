'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useParams } from 'next/navigation';

type Opportunity = {
  invitationId: string;
  providerId: number;
  status: string;
  responseDeadline: string | null;
  providerSnapshot: Record<string, unknown>;
  project: {
    id: string;
    title: string;
    customerDescription: string;
    aiSummary: string | null;
    likelyIssue: string | null;
    category: string;
    urgency: string;
    serviceLevel: string;
    serviceArea: string;
    preferredDate: string | null;
    estimatedMin: number | null;
    estimatedMax: number | null;
    estimateCurrency: string;
    safetyNotes: string[];
    materials: unknown[];
    professionalInspectionRequired: boolean;
  };
};

type ResponseForm = {
  responseType:
    | 'available_now'
    | 'available_today'
    | 'available_tomorrow'
    | 'site_visit'
    | 'estimate'
    | 'need_information'
    | 'declined';
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  siteVisitFee: string;
  estimateMin: string;
  estimateMax: string;
  providerMessage: string;
};

const INITIAL_FORM: ResponseForm = {
  responseType: 'available_today',
  arrivalWindowStart: '',
  arrivalWindowEnd: '',
  siteVisitFee: '',
  estimateMin: '',
  estimateMax: '',
  providerMessage: '',
};

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to process this opportunity.');
  return payload;
}

function formatMoney(value: number | null, currency: string): string {
  if (value === null) return 'Not supplied';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return 'Not specified';
  return new Date(value).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function optionalMoney(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ProviderOpportunityPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [form, setForm] = useState<ResponseForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await readJson(
          await fetch(`/api/provider-opportunities/${encodeURIComponent(token)}`, {
            cache: 'no-store',
          }),
        );
        if (active) setOpportunity(payload.opportunity);
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load opportunity.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (token) void load();
    return () => {
      active = false;
    };
  }, [token]);

  const providerName = useMemo(() => {
    const snapshot = opportunity?.providerSnapshot;
    if (!snapshot) return 'Service provider';
    if (typeof snapshot.name === 'string' && snapshot.name.trim()) return snapshot.name;
    const firstName = typeof snapshot.first_name === 'string' ? snapshot.first_name : '';
    const lastName = typeof snapshot.last_name === 'string' ? snapshot.last_name : '';
    return `${firstName} ${lastName}`.trim() || 'Service provider';
  }, [opportunity]);

  const submitResponse = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await readJson(
        await fetch(`/api/provider-opportunities/${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseType: form.responseType,
            arrivalWindowStart: form.arrivalWindowStart
              ? new Date(form.arrivalWindowStart).toISOString()
              : null,
            arrivalWindowEnd: form.arrivalWindowEnd
              ? new Date(form.arrivalWindowEnd).toISOString()
              : null,
            siteVisitFee: optionalMoney(form.siteVisitFee),
            estimateMin: optionalMoney(form.estimateMin),
            estimateMax: optionalMoney(form.estimateMax),
            providerMessage: form.providerMessage,
          }),
        }),
      );
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080d0b] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-amber-300" size={36} />
          <p className="mt-4 text-sm text-zinc-400">Opening project opportunity…</p>
        </div>
      </main>
    );
  }

  if (error && !opportunity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080d0b] px-5 text-white">
        <section className="max-w-md rounded-3xl border border-red-400/30 bg-red-500/10 p-7 text-center">
          <AlertTriangle className="mx-auto text-red-300" size={36} />
          <h1 className="mt-4 text-2xl font-black">Opportunity unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-red-100/80">{error}</p>
        </section>
      </main>
    );
  }

  if (!opportunity) return null;

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080d0b] px-5 text-white">
        <section className="max-w-lg rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center">
          <CheckCircle2 className="mx-auto text-emerald-300" size={46} />
          <h1 className="mt-5 text-3xl font-black">Response received</h1>
          <p className="mt-3 text-sm leading-6 text-emerald-50/80">
            Thank you, {providerName}. Skills Connect Pro has added your response to the customer&apos;s project.
          </p>
        </section>
      </main>
    );
  }

  const project = opportunity.project;

  return (
    <main className="min-h-screen bg-[#080d0b] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            <ShieldCheck size={16} /> Skills Connect Pro opportunity
          </div>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">{project.title}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Hello {providerName}. Review the limited project brief and confirm whether you can assist.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="rounded-lg bg-white/10 px-3 py-2">{project.category}</span>
            <span className="rounded-lg bg-white/10 px-3 py-2">{project.urgency}</span>
            <span className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2"><MapPin size={13} /> {project.serviceArea}</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="flex items-center gap-3">
                <Wrench className="text-amber-300" size={20} />
                <h2 className="text-lg font-black">Project brief</h2>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{project.customerDescription}</p>
              {project.aiSummary && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Preliminary assessment</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{project.aiSummary}</p>
                </div>
              )}
              {project.likelyIssue && (
                <p className="mt-4 text-sm text-zinc-400"><strong className="text-white">Likely issue:</strong> {project.likelyIssue}</p>
              )}
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <h2 className="font-black">Timing and preliminary range</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500"><CalendarClock size={14} /> Preferred time</p>
                  <p className="mt-2 text-sm font-bold">{formatDate(project.preferredDate)}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Customer estimate</p>
                  <p className="mt-2 text-sm font-bold">
                    {project.estimatedMin === null && project.estimatedMax === null
                      ? 'Not supplied'
                      : `${formatMoney(project.estimatedMin, project.estimateCurrency)} – ${formatMoney(project.estimatedMax, project.estimateCurrency)}`}
                  </p>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><Clock3 size={14} /> Response deadline: {formatDate(opportunity.responseDeadline)}</p>
            </article>

            {project.safetyNotes.length > 0 && (
              <article className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6">
                <h2 className="font-black text-amber-200">Safety notes</h2>
                <ul className="mt-3 space-y-2 text-sm text-amber-50/80">
                  {project.safetyNotes.map((note) => <li key={note}>• {note}</li>)}
                </ul>
              </article>
            )}
          </section>

          <form onSubmit={submitResponse} className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-5 lg:sticky lg:top-6">
            <h2 className="text-xl font-black">Your response</h2>
            <p className="mt-2 text-xs leading-5 text-zinc-500">This is preliminary. A formal quotation may follow after inspection.</p>

            <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-zinc-400">Availability</label>
            <select
              value={form.responseType}
              onChange={(event) => setForm({ ...form, responseType: event.target.value as ResponseForm['responseType'] })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#101713] px-3 py-3 text-sm outline-none"
            >
              <option value="available_now">Available now</option>
              <option value="available_today">Available later today</option>
              <option value="available_tomorrow">Available tomorrow</option>
              <option value="site_visit">Site visit required</option>
              <option value="estimate">Submit preliminary estimate</option>
              <option value="need_information">Need more information</option>
              <option value="declined">Not available / decline</option>
            </select>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">From</label>
                <input
                  type="datetime-local"
                  value={form.arrivalWindowStart}
                  onChange={(event) => setForm({ ...form, arrivalWindowStart: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Until</label>
                <input
                  type="datetime-local"
                  value={form.arrivalWindowEnd}
                  onChange={(event) => setForm({ ...form, arrivalWindowEnd: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none"
                />
              </div>
            </div>

            <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-zinc-400">Site visit fee (R)</label>
            <input
              inputMode="decimal"
              value={form.siteVisitFee}
              onChange={(event) => setForm({ ...form, siteVisitFee: event.target.value })}
              placeholder="Optional"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Estimate min (R)</label>
                <input
                  inputMode="decimal"
                  value={form.estimateMin}
                  onChange={(event) => setForm({ ...form, estimateMin: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Estimate max (R)</label>
                <input
                  inputMode="decimal"
                  value={form.estimateMax}
                  onChange={(event) => setForm({ ...form, estimateMax: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-zinc-400">Message</label>
            <textarea
              value={form.providerMessage}
              onChange={(event) => setForm({ ...form, providerMessage: event.target.value })}
              placeholder="Add a short note or question"
              className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
            />

            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

            <button
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-black disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
              Submit response
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
