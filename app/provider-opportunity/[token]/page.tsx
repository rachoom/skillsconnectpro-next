'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CalendarDays,
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
  | 'available_this_week'
  | 'available_next_week'
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

type ResponseOption = {
  value: ResponseType;
  title: string;
  helper: string;
  icon: typeof Zap;
  tone: string;
};

const INITIAL_FORM: ResponseForm = {
  responseType: 'available_today',
  timeSlot: 'unsure',
  siteVisitFee: '',
  estimateMin: '',
  estimateMax: '',
  providerMessage: '',
};

const OPTIONS: Record<Exclude<ResponseType, 'declined'>, ResponseOption> = {
  available_now: {
    value: 'available_now',
    title: 'I can go now',
    helper: 'Ready immediately',
    icon: Zap,
    tone: 'border-[#D6A524] bg-[#FFD166]',
  },
  available_today: {
    value: 'available_today',
    title: 'Later today',
    helper: 'I can assist today',
    icon: Sun,
    tone: 'border-[#D8B43D] bg-[#FFE58A]',
  },
  available_tomorrow: {
    value: 'available_tomorrow',
    title: 'Tomorrow',
    helper: 'I can assist tomorrow',
    icon: CalendarClock,
    tone: 'border-[#79ADD0] bg-[#BDE0FE]',
  },
  available_this_week: {
    value: 'available_this_week',
    title: 'Later this week',
    helper: 'We can arrange a day',
    icon: CalendarDays,
    tone: 'border-[#8EB98B] bg-[#CDECCF]',
  },
  available_next_week: {
    value: 'available_next_week',
    title: 'Next week',
    helper: 'Suitable for planned work',
    icon: CalendarDays,
    tone: 'border-[#A996D1] bg-[#DCCBFF]',
  },
  site_visit: {
    value: 'site_visit',
    title: 'Inspect first',
    helper: 'I need a site visit',
    icon: Eye,
    tone: 'border-[#A996D1] bg-[#E2D6FF]',
  },
  estimate: {
    value: 'estimate',
    title: 'I can quote',
    helper: 'Add a rough estimate',
    icon: Banknote,
    tone: 'border-[#79B695] bg-[#C8F0D2]',
  },
  need_information: {
    value: 'need_information',
    title: 'Need more info',
    helper: 'Ask the customer a question',
    icon: CircleHelp,
    tone: 'border-[#D798AA] bg-[#FFC8D8]',
  },
};

const TIME_SLOTS: Array<{ value: TimeSlot; label: string; start?: number; end?: number }> = [
  { value: 'unsure', label: 'Not sure yet' },
  { value: 'morning', label: 'Morning', start: 8, end: 11 },
  { value: 'midday', label: 'Late morning', start: 11, end: 14 },
  { value: 'afternoon', label: 'Afternoon', start: 14, end: 17 },
  { value: 'evening', label: 'After 5pm', start: 17, end: 20 },
];

function responseOptionsForUrgency(urgency: string): ResponseOption[] {
  const normalized = urgency.trim().toLowerCase();

  if (normalized === 'emergency' || normalized === 'urgent') {
    return [
      OPTIONS.available_now,
      OPTIONS.available_today,
      OPTIONS.available_tomorrow,
      OPTIONS.site_visit,
      OPTIONS.estimate,
      OPTIONS.need_information,
    ];
  }

  if (normalized === 'large_project') {
    return [
      OPTIONS.available_this_week,
      OPTIONS.available_next_week,
      OPTIONS.site_visit,
      OPTIONS.estimate,
      OPTIONS.need_information,
    ];
  }

  return [
    OPTIONS.available_tomorrow,
    OPTIONS.available_this_week,
    OPTIONS.available_next_week,
    OPTIONS.site_visit,
    OPTIONS.estimate,
    OPTIONS.need_information,
  ];
}

function defaultResponseForUrgency(urgency: string): ResponseType {
  const normalized = urgency.trim().toLowerCase();
  if (normalized === 'emergency' || normalized === 'urgent') return 'available_today';
  if (normalized === 'large_project') return 'available_this_week';
  return 'available_tomorrow';
}

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
        if (active) {
          setOpportunity(payload.opportunity);
          setForm((current) => ({
            ...current,
            responseType: defaultResponseForUrgency(payload.opportunity.project.urgency),
          }));
        }
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#9FCB8A] text-[#203020]">
        <div className="rounded-3xl bg-[#FFF6D8] p-8 text-center shadow-xl shadow-[#355332]/20">
          <Loader2 className="mx-auto animate-spin text-[#B67B00]" size={36} />
          <p className="mt-4 text-sm font-bold">Opening project opportunity…</p>
        </div>
      </main>
    );
  }

  if (error && !opportunity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#9FCB8A] px-5 text-[#2D1F1F]">
        <section className="max-w-md rounded-3xl border-2 border-[#C95D65] bg-[#FFDDE2] p-7 text-center shadow-xl shadow-[#355332]/20">
          <AlertTriangle className="mx-auto text-[#A6323B]" size={36} />
          <h1 className="mt-4 text-2xl font-black">Opportunity unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-[#6E3439]">{error}</p>
        </section>
      </main>
    );
  }

  if (!opportunity) return null;

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#9FCB8A] px-5 text-[#173B28]">
        <section className="max-w-lg rounded-3xl border-2 border-[#55A979] bg-[#E6F8DF] p-8 text-center shadow-xl shadow-[#355332]/20">
          <CheckCircle2 className="mx-auto text-[#21885A]" size={46} />
          <h1 className="mt-5 text-3xl font-black">Response received</h1>
          <p className="mt-3 text-sm leading-6 text-[#355D43]">
            Thank you, {providerName}. Skills Connect Pro has added your response to the customer&apos;s project.
          </p>
        </section>
      </main>
    );
  }

  const project = opportunity.project;
  const responseOptions = responseOptionsForUrgency(project.urgency);
  const showTimeSlots = ['available_today', 'available_tomorrow'].includes(form.responseType);
  const pricingOpen = showPricing || form.responseType === 'site_visit' || form.responseType === 'estimate';
  const submitLabel =
    form.responseType === 'declined'
      ? 'Send decline'
      : form.responseType === 'need_information'
        ? 'Send question'
        : 'Send response';

  return (
    <main className="min-h-screen bg-[#9FCB8A] px-4 py-5 text-[#203020] md:px-8 md:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-4 rounded-[1.75rem] border-2 border-[#D3A826] bg-[#FFF0A8] p-5 shadow-xl shadow-[#355332]/20 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#5B4300]">
              <ShieldCheck size={15} /> Skills Connect Pro
            </div>
            <span className="rounded-full border border-[#D3A826] bg-[#FFE067] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#4A3600]">
              Quick reply · about 1 minute
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">{project.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#4F5D4A]">Hi {providerName}. Can you assist with this job?</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider">
            <span className="rounded-xl bg-[#FFFFFF]/80 px-3 py-2">{project.category}</span>
            <span className="rounded-xl bg-[#FFD45C] px-3 py-2 text-[#4A3500]">{project.urgency}</span>
            <span className="flex items-center gap-1 rounded-xl bg-[#FFFFFF]/80 px-3 py-2"><MapPin size={13} /> {project.serviceArea}</span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="space-y-4">
            <article className="rounded-[1.75rem] border-2 border-[#7CAD6E] bg-[#FFF9E8] p-5 shadow-lg shadow-[#355332]/15 md:p-6">
              <div className="flex items-center gap-3">
                <Wrench className="text-[#B07800]" size={19} />
                <h2 className="text-lg font-black">Job at a glance</h2>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#3E493A]">{project.customerDescription}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#EAF3DE] p-3.5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#60705A]"><CalendarClock size={13} /> Preferred time</p>
                  <p className="mt-1.5 text-sm font-bold">{formatDate(project.preferredDate)}</p>
                </div>
                <div className="rounded-2xl bg-[#EAF3DE] p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">Customer estimate</p>
                  <p className="mt-1.5 text-sm font-bold">
                    {project.estimatedMin === null && project.estimatedMax === null
                      ? 'Not supplied'
                      : `${formatMoney(project.estimatedMin, project.estimateCurrency)} – ${formatMoney(project.estimatedMax, project.estimateCurrency)}`}
                  </p>
                </div>
              </div>

              {project.aiSummary && (
                <details className="mt-4 rounded-2xl border border-[#B8CFAE] bg-[#F3F8ED] p-4">
                  <summary className="cursor-pointer text-xs font-black uppercase tracking-wider text-[#52644E]">View preliminary assessment</summary>
                  <p className="mt-3 text-sm leading-6 text-[#3E493A]">{project.aiSummary}</p>
                </details>
              )}

              {project.likelyIssue && (
                <p className="mt-4 text-sm text-[#4F5D4A]"><strong className="text-[#203020]">Likely issue:</strong> {project.likelyIssue}</p>
              )}

              <p className="mt-4 flex items-center gap-2 text-xs text-[#65735E]"><Clock3 size={14} /> Reply by {formatDate(opportunity.responseDeadline)}</p>
            </article>

            {project.safetyNotes.length > 0 && (
              <article className="rounded-[1.75rem] border-2 border-[#D9A52D] bg-[#FFF0B8] p-5">
                <h2 className="font-black text-[#5F4300]">Safety notes</h2>
                <ul className="mt-3 space-y-2 text-sm text-[#6F5414]">
                  {project.safetyNotes.map((note) => <li key={note}>• {note}</li>)}
                </ul>
              </article>
            )}
          </section>

          <form onSubmit={submitResponse} className="h-fit rounded-[1.75rem] border-2 border-[#D1A93C] bg-[#FFF2C7] p-5 shadow-xl shadow-[#355332]/20 lg:sticky lg:top-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Can you help?</h2>
                <p className="mt-1 text-xs leading-5 text-[#6E765F]">Tap one answer. Everything else is optional.</p>
              </div>
              <MessageCircle className="mt-1 text-[#B07800]" size={21} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {responseOptions.map((option) => {
                const Icon = option.icon;
                const active = form.responseType === option.value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => chooseResponse(option.value)}
                    className={`relative rounded-2xl border-2 p-3 text-left text-[#203020] shadow-sm transition ${option.tone} ${
                      active ? '-translate-y-0.5 ring-4 ring-[#203020]/20' : 'hover:-translate-y-0.5'
                    }`}
                  >
                    {active && <CheckCircle2 className="absolute right-2.5 top-2.5" size={17} />}
                    <Icon size={18} />
                    <span className="mt-2 block pr-4 text-sm font-black leading-tight">{option.title}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-[#4D5949]">{option.helper}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => chooseResponse('declined')}
              className={`mt-2 flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left ${
                form.responseType === 'declined'
                  ? 'border-[#B95C69] bg-[#FFC8D2] text-[#6E2430] ring-4 ring-[#6E2430]/15'
                  : 'border-[#D7A5AD] bg-[#FFE5E9] text-[#74404A]'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-bold"><XCircle size={17} /> I cannot assist</span>
              <span className="text-[10px] uppercase tracking-wider">Decline</span>
            </button>

            {showTimeSlots && (
              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#66725F]">Rough arrival time</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot.value}
                      onClick={() => setForm((current) => ({ ...current, timeSlot: slot.value }))}
                      className={`rounded-full border-2 px-3 py-2 text-xs font-bold ${
                        form.timeSlot === slot.value
                          ? 'border-[#C89A18] bg-[#FFD75F] text-[#3F2D00]'
                          : 'border-[#9DBA8F] bg-[#FFFFFF]/75 text-[#3E493A]'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(form.responseType === 'available_this_week' || form.responseType === 'available_next_week') && (
              <p className="mt-4 rounded-2xl bg-[#EAF3DE] px-4 py-3 text-xs font-semibold text-[#53644D]">
                You can confirm the exact day with the customer after they choose your response.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowPricing((current) => !current)}
              className="mt-5 flex w-full items-center justify-between rounded-xl border-2 border-[#B7CBAE] bg-[#FFFDF5] px-4 py-3 text-left"
            >
              <span>
                <span className="block text-xs font-black text-[#293829]">Add fee or rough estimate</span>
                <span className="mt-0.5 block text-[10px] text-[#6E765F]">Optional — you can quote after inspection</span>
              </span>
              <ChevronDown className={`text-[#60705A] transition ${pricingOpen ? 'rotate-180' : ''}`} size={17} />
            </button>

            {pricingOpen && (
              <div className="mt-3 space-y-3 rounded-2xl border-2 border-[#B7CBAE] bg-[#F7FAF2] p-3.5">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">Site visit fee (R)</span>
                  <input
                    inputMode="decimal"
                    value={form.siteVisitFee}
                    onChange={(event) => setForm({ ...form, siteVisitFee: event.target.value })}
                    placeholder="For example: 250"
                    className="mt-1.5 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none focus:border-[#D2A326]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">From (R)</span>
                    <input
                      inputMode="decimal"
                      value={form.estimateMin}
                      onChange={(event) => setForm({ ...form, estimateMin: event.target.value })}
                      placeholder="Minimum"
                      className="mt-1.5 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none focus:border-[#D2A326]"
                    />
                  </label>
                  <label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">To (R)</span>
                    <input
                      inputMode="decimal"
                      value={form.estimateMax}
                      onChange={(event) => setForm({ ...form, estimateMax: event.target.value })}
                      placeholder="Maximum"
                      className="mt-1.5 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none focus:border-[#D2A326]"
                    />
                  </label>
                </div>
              </div>
            )}

            <label className="mt-4 block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">Short message — optional</span>
              <textarea
                value={form.providerMessage}
                onChange={(event) => setForm({ ...form, providerMessage: event.target.value })}
                placeholder={form.responseType === 'need_information' ? 'What do you need to know?' : 'Add a quick note or question'}
                className="mt-1.5 min-h-20 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none focus:border-[#D2A326]"
              />
            </label>

            {error && <p className="mt-3 rounded-xl border border-[#C95D65] bg-[#FFDDE2] p-3 text-sm text-[#8E3039]">{error}</p>}

            <button
              disabled={submitting}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-black uppercase tracking-wider shadow-md disabled:opacity-50 ${
                form.responseType === 'declined'
                  ? 'border-[#96515C] bg-[#FFC8D2] text-[#64212C]'
                  : 'border-[#C18A00] bg-[#FFC21A] text-[#2E2200]'
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
