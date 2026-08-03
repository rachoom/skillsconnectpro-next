'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Eye,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sun,
  Wrench,
  XCircle,
  Zap,
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

type ResponseType =
  | 'available_now'
  | 'available_today'
  | 'available_tomorrow'
  | 'site_visit'
  | 'estimate'
  | 'need_information'
  | 'declined';

type TimeSlot = 'unsure' | 'morning' | 'midday' | 'afternoon' | 'evening';

type ResponseForm = {
  responseType: ResponseType;
  timeSlot: TimeSlot;
  siteVisitFee: string;
  estimateMin: string;
  estimateMax: string;
  providerMessage: string;
};

const INITIAL_FORM: ResponseForm = {
  responseType: 'available_today',
  timeSlot: 'unsure',
  siteVisitFee: '',
  estimateMin: '',
  estimateMax: '',
  providerMessage: '',
};

const RESPONSE_OPTIONS: Array<{
  value: ResponseType;
  title: string;
  helper: string;
  icon: typeof Zap;
}> = [
  { value: 'available_now', title: 'I can go now', helper: 'Ready immediately', icon: Zap },
  { value: 'available_today', title: 'Later today', helper: 'I can assist today', icon: Sun },
  { value: 'available_tomorrow', title: 'Tomorrow', helper: 'I can assist tomorrow', icon: CalendarClock },
  { value: 'site_visit', title: 'Inspect first', helper: 'I need a site visit', icon: Eye },
  { value: 'estimate', title: 'I can quote', helper: 'Add a rough estimate', icon: Banknote },
  { value: 'need_information', title: 'Need more info', helper: 'Ask the customer a question', icon: CircleHelp },
];

const TIME_SLOTS: Array<{ value: TimeSlot; label: string; start?: number; end?: number }> = [
  { value: 'unsure', label: 'Not sure yet' },
  { value: 'morning', label: 'Morning', start: 8, end: 11 },
  { value: 'midday', label: 'Late morning', start: 11, end: 14 },
  { value: 'afternoon', label: 'Afternoon', start: 14, end: 17 },
  { value: 'evening', label: 'After 5pm', start: 17, end: 20 },
];

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

function arrivalWindow(responseType: ResponseType, timeSlot: TimeSlot) {
  if (responseType === 'available_now') {
    const start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (!['available_today', 'available_tomorrow'].includes(responseType) || timeSlot === 'unsure') {
    return { start: null, end: null };
  }

  const slot = TIME_SLOTS.find((item) => item.value === timeSlot);
  if (slot?.start === undefined || slot.end === undefined) return { start: null, end: null };

  const start = new Date();
  if (responseType === 'available_tomorrow') start.setDate(start.getDate() + 1);
  start.setHours(slot.start, 0, 0, 0);

  const end = new Date(start);
  end.setHours(slot.end, 0, 0, 0);

  return { start: start.toISOString(), end: end.toISOString() };
}

export default function ProviderOpportunityPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [form, setForm] = useState<ResponseForm>(INITIAL_FORM);
  const [showPricing, setShowPricing] = useState(false);
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

  const chooseResponse = (responseType: ResponseType) => {
    setForm((current) => ({ ...current, responseType }));
    if (responseType === 'site_visit' || responseType === 'estimate') setShowPricing(true);
  };

  const submitResponse = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const window = arrivalWindow(form.responseType, form.timeSlot);

    try {
      await readJson(
        await fetch(`/api/provider-opportunities/${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseType: form.responseType,
            arrivalWindowStart: window.start,
            arrivalWindowEnd: window.end,
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

  const backgroundStyle = {
    background:
      'radial-gradient(circle at 50% -10%, rgba(92,72,31,0.42) 0%, rgba(31,34,20,0.96) 28%, #0a0d09 72%)',
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white" style={backgroundStyle}>
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-amber-300" size={36} />
          <p className="mt-4 text-sm text-stone-400">Opening project opportunity…</p>
        </div>
      </main>
    );
  }

  if (error && !opportunity) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-white" style={backgroundStyle}>
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
      <main className="flex min-h-screen items-center justify-center px-5 text-white" style={backgroundStyle}>
        <section className="max-w-lg rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center shadow-2xl shadow-black/30">
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
  const showTimeSlots = ['available_today', 'available_tomorrow'].includes(form.responseType);
  const pricingOpen = showPricing || form.responseType === 'site_visit' || form.responseType === 'estimate';
  const submitLabel =
    form.responseType === 'declined'
      ? 'Send decline'
      : form.responseType === 'need_information'
        ? 'Send question'
        : 'Send response';

  return (
    <main className="min-h-screen px-4 py-5 text-white md:px-8 md:py-8" style={backgroundStyle}>
      <div className="mx-auto max-w-4xl">
        <header className="mb-4 rounded-[1.75rem] border border-amber-200/10 bg-[#17170f]/90 p-5 shadow-xl shadow-black/20 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
              <ShieldCheck size={15} /> Skills Connect Pro
            </div>
            <span className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">
              Quick reply · about 1 minute
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">{project.title}</h1>
          <p className="mt-2 text-sm leading-6 text-stone-400">Hi {providerName}. Can you assist with this job?</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider">
            <span className="rounded-xl bg-white/[0.07] px-3 py-2">{project.category}</span>
            <span className="rounded-xl bg-amber-300/10 px-3 py-2 text-amber-200">{project.urgency}</span>
            <span className="flex items-center gap-1 rounded-xl bg-white/[0.07] px-3 py-2"><MapPin size={13} /> {project.serviceArea}</span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="space-y-4">
            <article className="rounded-[1.75rem] border border-white/[0.08] bg-[#15170f]/90 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <Wrench className="text-amber-300" size={19} />
                <h2 className="text-lg font-black">Job at a glance</h2>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-300">{project.customerDescription}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-black/20 p-3.5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500"><CalendarClock size={13} /> Preferred time</p>
                  <p className="mt-1.5 text-sm font-bold">{formatDate(project.preferredDate)}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Customer estimate</p>
                  <p className="mt-1.5 text-sm font-bold">
                    {project.estimatedMin === null && project.estimatedMax === null
                      ? 'Not supplied'
                      : `${formatMoney(project.estimatedMin, project.estimateCurrency)} – ${formatMoney(project.estimatedMax, project.estimateCurrency)}`}
                  </p>
                </div>
              </div>

              {project.aiSummary && (
                <details className="mt-4 rounded-2xl border border-white/[0.08] bg-black/15 p-4">
                  <summary className="cursor-pointer text-xs font-black uppercase tracking-wider text-stone-400">View preliminary assessment</summary>
                  <p className="mt-3 text-sm leading-6 text-stone-300">{project.aiSummary}</p>
                </details>
              )}

              {project.likelyIssue && (
                <p className="mt-4 text-sm text-stone-400"><strong className="text-white">Likely issue:</strong> {project.likelyIssue}</p>
              )}

              <p className="mt-4 flex items-center gap-2 text-xs text-stone-500"><Clock3 size={14} /> Reply by {formatDate(opportunity.responseDeadline)}</p>
            </article>

            {project.safetyNotes.length > 0 && (
              <article className="rounded-[1.75rem] border border-amber-400/25 bg-amber-400/[0.08] p-5">
                <h2 className="font-black text-amber-200">Safety notes</h2>
                <ul className="mt-3 space-y-2 text-sm text-amber-50/80">
                  {project.safetyNotes.map((note) => <li key={note}>• {note}</li>)}
                </ul>
              </article>
            )}
          </section>

          <form onSubmit={submitResponse} className="h-fit rounded-[1.75rem] border border-amber-200/10 bg-[#1b190f]/95 p-5 shadow-xl shadow-black/20 lg:sticky lg:top-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Can you help?</h2>
                <p className="mt-1 text-xs leading-5 text-stone-500">Tap one answer. Everything else is optional.</p>
              </div>
              <MessageCircle className="mt-1 text-amber-300" size={21} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {RESPONSE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = form.responseType === option.value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => chooseResponse(option.value)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? 'border-amber-300 bg-amber-300 text-black'
                        : 'border-white/[0.08] bg-black/20 text-white hover:border-amber-200/30'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="mt-2 block text-sm font-black leading-tight">{option.title}</span>
                    <span className={`mt-1 block text-[10px] leading-4 ${active ? 'text-black/65' : 'text-stone-500'}`}>{option.helper}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => chooseResponse('declined')}
              className={`mt-2 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                form.responseType === 'declined'
                  ? 'border-red-300/50 bg-red-400/15 text-red-100'
                  : 'border-white/[0.08] bg-black/15 text-stone-400'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-bold"><XCircle size={17} /> I cannot assist</span>
              <span className="text-[10px] uppercase tracking-wider">Decline</span>
            </button>

            {showTimeSlots && (
              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">Rough arrival time</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot.value}
                      onClick={() => setForm((current) => ({ ...current, timeSlot: slot.value }))}
                      className={`rounded-full border px-3 py-2 text-xs font-bold ${
                        form.timeSlot === slot.value
                          ? 'border-amber-300 bg-amber-300 text-black'
                          : 'border-white/10 bg-black/20 text-stone-300'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPricing((current) => !current)}
              className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-black/15 px-4 py-3 text-left"
            >
              <span>
                <span className="block text-xs font-black text-stone-200">Add fee or rough estimate</span>
                <span className="mt-0.5 block text-[10px] text-stone-500">Optional — you can quote after inspection</span>
              </span>
              <ChevronDown className={`text-stone-500 transition ${pricingOpen ? 'rotate-180' : ''}`} size={17} />
            </button>

            {pricingOpen && (
              <div className="mt-3 space-y-3 rounded-2xl border border-white/[0.07] bg-black/15 p-3.5">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Site visit fee (R)</span>
                  <input
                    inputMode="decimal"
                    value={form.siteVisitFee}
                    onChange={(event) => setForm({ ...form, siteVisitFee: event.target.value })}
                    placeholder="For example: 250"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0c0e09] px-3 py-3 text-sm outline-none focus:border-amber-300/60"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">From (R)</span>
                    <input
                      inputMode="decimal"
                      value={form.estimateMin}
                      onChange={(event) => setForm({ ...form, estimateMin: event.target.value })}
                      placeholder="Minimum"
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0c0e09] px-3 py-3 text-sm outline-none focus:border-amber-300/60"
                    />
                  </label>
                  <label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">To (R)</span>
                    <input
                      inputMode="decimal"
                      value={form.estimateMax}
                      onChange={(event) => setForm({ ...form, estimateMax: event.target.value })}
                      placeholder="Maximum"
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0c0e09] px-3 py-3 text-sm outline-none focus:border-amber-300/60"
                    />
                  </label>
                </div>
              </div>
            )}

            <label className="mt-4 block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Short message — optional</span>
              <textarea
                value={form.providerMessage}
                onChange={(event) => setForm({ ...form, providerMessage: event.target.value })}
                placeholder={form.responseType === 'need_information' ? 'What do you need to know?' : 'Add a quick note or question'}
                className="mt-1.5 min-h-20 w-full rounded-xl border border-white/10 bg-[#0c0e09] px-3 py-3 text-sm outline-none focus:border-amber-300/60"
              />
            </label>

            {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

            <button
              disabled={submitting}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black uppercase tracking-wider disabled:opacity-50 ${
                form.responseType === 'declined' ? 'bg-stone-700 text-white' : 'bg-amber-400 text-black'
              }`}
            >
              {submitting ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
              {submitLabel}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
