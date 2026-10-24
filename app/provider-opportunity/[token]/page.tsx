'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Eye,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import polish from './provider-opportunity-polish.module.css';

type Opportunity = {
  invitationId: string;
  providerId: number;
  status: string;
  responseDeadline: string | null;
  leadAccess: {
    freeLeadLimit: number;
    freeLeadsUsed: number;
    freeLeadsRemaining: number;
    hasPaidAccess: boolean;
    locked: boolean;
    activePlan: { code: string; type: 'subscription' | 'lead_pack'; remaining?: number } | null;
  };
  providerSnapshot: Record<string, unknown>;
  customerContact: {
    name: string;
    phone: string;
    email: string | null;
    location: string;
    suburb: string | null;
    city: string | null;
  } | null;
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
    status: string;
    media: Array<{ path: string; url?: string; type: string; alt?: string; createdAt?: string }>;
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
  responseType: ResponseType | null;
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
  isiZulu: string;
  icon: typeof Zap;
  tone: string;
};

const INITIAL_FORM: ResponseForm = {
  responseType: null,
  timeSlot: 'unsure',
  siteVisitFee: '',
  estimateMin: '',
  estimateMax: '',
  providerMessage: '',
};

const OPTIONS: Record<Exclude<ResponseType, 'declined'>, ResponseOption> = {
  available_now: { value: 'available_now', title: 'Available now', helper: 'Can attend immediately', isiZulu: 'Ngiyatholakala manje', icon: Zap, tone: 'border-[#D6A524] bg-[#FFD166]' },
  available_today: { value: 'available_today', title: 'Available today', helper: 'Can attend later today', isiZulu: 'Ngiyatholakala namuhla', icon: Sun, tone: 'border-[#D8B43D] bg-[#FFE58A]' },
  available_tomorrow: { value: 'available_tomorrow', title: 'Available tomorrow', helper: 'Can attend tomorrow', isiZulu: 'Ngiyatholakala kusasa', icon: CalendarClock, tone: 'border-[#79ADD0] bg-[#BDE0FE]' },
  available_this_week: { value: 'available_this_week', title: 'Available this week', helper: 'Arrange a suitable day', isiZulu: 'Ngiyatholakala kuleli sonto', icon: CalendarDays, tone: 'border-[#8EB98B] bg-[#CDECCF]' },
  available_next_week: { value: 'available_next_week', title: 'Available next week', helper: 'Suitable for planned work', isiZulu: 'Ngiyatholakala ngesonto elizayo', icon: CalendarDays, tone: 'border-[#A996D1] bg-[#DCCBFF]' },
  site_visit: { value: 'site_visit', title: 'Site visit first', helper: 'Inspect before confirming price', isiZulu: 'Ngifuna ukuhlola indawo kuqala', icon: Eye, tone: 'border-[#A996D1] bg-[#E2D6FF]' },
  estimate: { value: 'estimate', title: 'Send estimate', helper: 'Provide a preliminary range', isiZulu: 'Thumela isilinganiso sentengo', icon: Banknote, tone: 'border-[#79B695] bg-[#C8F0D2]' },
  need_information: { value: 'need_information', title: 'Request details', helper: 'Ask a project question first', isiZulu: 'Cela imininingwane eyengeziwe', icon: CircleHelp, tone: 'border-[#D798AA] bg-[#FFC8D8]' },
};

const TIME_SLOTS: Array<{ value: TimeSlot; label: string; isiZulu: string; start?: number; end?: number }> = [
  { value: 'unsure', label: 'Not sure yet', isiZulu: 'Angikaqiniseki' },
  { value: 'morning', label: 'Morning', isiZulu: 'Ekuseni', start: 8, end: 11 },
  { value: 'midday', label: 'Late morning', isiZulu: 'Ngasekupheleni kwasekuseni', start: 11, end: 14 },
  { value: 'afternoon', label: 'Afternoon', isiZulu: 'Ntambama', start: 14, end: 17 },
  { value: 'evening', label: 'After 5pm', isiZulu: 'Ngemva kuka-5 ntambama', start: 17, end: 20 },
];

function responseOptionsForUrgency(urgency: string): ResponseOption[] {
  const normalized = urgency.trim().toLowerCase();
  if (normalized === 'emergency' || normalized === 'urgent') {
    return [OPTIONS.available_now, OPTIONS.available_today, OPTIONS.available_tomorrow, OPTIONS.site_visit, OPTIONS.estimate, OPTIONS.need_information];
  }
  if (normalized === 'large_project') {
    return [OPTIONS.available_this_week, OPTIONS.available_next_week, OPTIONS.site_visit, OPTIONS.estimate, OPTIONS.need_information];
  }
  return [OPTIONS.available_tomorrow, OPTIONS.available_this_week, OPTIONS.available_next_week, OPTIONS.site_visit, OPTIONS.estimate, OPTIONS.need_information];
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
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return 'Not specified';
  return new Date(value).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
}

function optionalMoney(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function whatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
}

function arrivalWindow(responseType: ResponseType | null, timeSlot: TimeSlot) {
  if (responseType === 'available_now') {
    const start = new Date();
    return { start: start.toISOString(), end: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString() };
  }
  if (!responseType || !['available_today', 'available_tomorrow'].includes(responseType) || timeSlot === 'unsure') return { start: null, end: null };
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
  const [hintIndex, setHintIndex] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [language, setLanguage] = useState<'en' | 'zu'>('en');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const payload = await readJson(await fetch(`/api/provider-opportunities/${encodeURIComponent(token)}`, { cache: 'no-store' }));
        if (active) {
          setOpportunity(payload.opportunity);
          setForm((current) => ({ ...current, responseType: null }));
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load opportunity.');
      } finally {
        if (active) setLoading(false);
      }
    }
    if (token) void load();
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (form.responseType || !opportunity) {
      setHintIndex(-1);
      return;
    }

    const count = responseOptionsForUrgency(opportunity.project.urgency).length;
    if (count <= 0) return;
    setHintIndex(0);

    const timer = window.setInterval(() => {
      setHintIndex((current) => {
        if (count === 1) return 0;
        const base = current < 0 ? 0 : current;
        let next = Math.floor(Math.random() * (count - 1));
        if (next >= base) next += 1;
        return next % count;
      });
    }, 1100);

    return () => window.clearInterval(timer);
  }, [form.responseType, opportunity]);

  const providerName = useMemo(() => {
    const snapshot = opportunity?.providerSnapshot;
    if (!snapshot) return 'Service provider';
    if (typeof snapshot.name === 'string' && snapshot.name.trim()) return snapshot.name;
    const firstName = typeof snapshot.first_name === 'string' ? snapshot.first_name : '';
    const lastName = typeof snapshot.last_name === 'string' ? snapshot.last_name : '';
    return `${firstName} ${lastName}`.trim() || 'Service provider';
  }, [opportunity]);

  const chooseResponse = (responseType: ResponseType) => {
    setForm((current) => ({ ...current, responseType, timeSlot: 'unsure' }));
    setStep(responseType === 'declined' ? 3 : 2);
    if (responseType === 'site_visit' || responseType === 'estimate') setShowPricing(true);
  };

  const submitResponse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.responseType) {
      setError('Choose your availability or response before submitting.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const window = arrivalWindow(form.responseType, form.timeSlot);
    try {
      await readJson(await fetch(`/api/provider-opportunities/${encodeURIComponent(token)}`, {
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
      }));
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className={`${polish.scope} flex min-h-screen items-center justify-center bg-[#9FCB8A] text-[#203020]`}><div className="rounded-3xl bg-[#FFF6D8] p-8 text-center shadow-xl shadow-[#355332]/20"><Loader2 className="mx-auto animate-spin text-[#B67B00]" size={36} /><p className="mt-4 text-sm font-bold">Opening project opportunity…</p></div></main>;
  }

  if (error && !opportunity) {
    return <main className={`${polish.scope} flex min-h-screen items-center justify-center bg-[#9FCB8A] px-5 text-[#2D1F1F]`}><section className="max-w-md rounded-3xl border-2 border-[#C95D65] bg-[#FFDDE2] p-7 text-center shadow-xl shadow-[#355332]/20"><AlertTriangle className="mx-auto text-[#A6323B]" size={36} /><h1 className="mt-4 text-2xl font-black">Opportunity unavailable</h1><p className="mt-3 text-sm leading-6 text-[#6E3439]">{error}</p></section></main>;
  }

  if (!opportunity) return null;
  const project = opportunity.project;
  const leadLocked = opportunity.leadAccess.locked;
  const projectClosed = ['cancelled', 'completed', 'unfulfilled'].includes(project.status);
  const responseFinal = ['accepted', 'declined'].includes(opportunity.status);

  if (projectClosed) {
    const title = project.status === 'cancelled' ? 'Project cancelled' : project.status === 'completed' ? 'Project completed' : 'Project closed';
    const copy = project.status === 'cancelled'
      ? 'The customer cancelled this project. No further response is needed and this opportunity is now read-only.'
      : project.status === 'completed'
        ? 'This project has been completed. The opportunity is now read-only.'
        : 'This project is no longer accepting provider responses.';
    return (
      <main className={`${polish.scope} flex min-h-screen items-center justify-center bg-[#9FCB8A] px-5`}>
        <section className="max-w-lg rounded-3xl border-2 border-[#C95D65] bg-[#FFDDE2] p-8 text-center shadow-xl shadow-[#355332]/20">
          <XCircle className="mx-auto text-[#A6323B]" size={46} />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#A6323B]">Opportunity closed</p>
          <h1 className="mt-2 text-3xl font-black">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#6E3439]">{copy}</p>
          <div className="mt-5 rounded-2xl border border-[#B94D5D] bg-[#4A171F] p-4 text-left text-xs leading-5 text-[#FFE8EC] shadow-inner">
            <strong className="text-[#FFF4F5]">{project.title}</strong><br />
            <span className="text-[#F1BAC3]">{project.category} · {project.serviceArea}</span>
          </div>
        </section>
      </main>
    );
  }

  if (responseFinal) {
    return (
      <main className={`${polish.scope} flex min-h-screen items-center justify-center bg-[#9FCB8A] px-5`}>
        <section className="max-w-lg rounded-3xl border-2 border-[#55A979] bg-[#E6F8DF] p-8 text-center shadow-xl shadow-[#355332]/20">
          <CheckCircle2 className="mx-auto text-[#21885A]" size={46} />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#21885A]">Response already submitted</p>
          <h1 className="mt-2 text-3xl font-black">{opportunity.status === 'declined' ? 'Opportunity declined' : 'Response received'}</h1>
          <p className="mt-3 text-sm leading-6 text-[#355D43]">Your response has already been recorded for this project. You do not need to submit it again.</p>
        </section>
      </main>
    );
  }

  if (opportunity.customerContact) {
    const contact = opportunity.customerContact;
    const whatsappHref = `https://wa.me/${whatsappNumber(contact.phone)}?text=${encodeURIComponent(`Hi ${contact.name}, this is ${providerName} from Skills Connect Pro regarding your project: ${project.title}.`)}`;
    return (
      <main className={`${polish.scope} min-h-screen bg-[#9FCB8A] px-4 py-6 text-[#203020] md:px-8 md:py-10`}>
        <div className="mx-auto max-w-3xl space-y-4">
          <header className="rounded-[1.75rem] border-2 border-[#D3A826] bg-[#FFF0A8] p-6 shadow-xl shadow-[#355332]/20 md:p-8">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#5B4300]"><ShieldCheck size={15} /> Skills Connect Pro</div>
            <div className="mt-5 flex items-start gap-4"><CheckCircle2 className="mt-1 shrink-0 text-[#21885A]" size={38} /><div><p className="text-xs font-black uppercase tracking-wider text-[#21885A]">Customer selected you</p><h1 className="mt-2 text-3xl font-black md:text-4xl">You’re connected</h1><p className="mt-3 text-sm leading-6 text-[#4F5D4A]">The customer confirmed your response for <strong>{project.title}</strong>. Their details are shown only because you are the selected provider.</p></div></div>
          </header>

          <article className="rounded-[1.75rem] border-2 border-[#7CAD6E] bg-[#FFF9E8] p-6 shadow-lg shadow-[#355332]/15 md:p-7">
            <div className="flex items-center gap-3"><LockKeyhole className="text-[#B07800]" size={20} /><h2 className="text-xl font-black">Customer contact</h2></div>
            <div className="mt-5 rounded-2xl bg-[#EAF3DE] p-5">
              <p className="text-2xl font-black">{contact.name}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#4F5D4A]"><MapPin size={16} /> {contact.location}</p>
              <p className="mt-1 text-xs text-[#65735E]">{[contact.suburb, contact.city].filter(Boolean).join(', ')}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a href={`tel:${contact.phone}`} className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#C18A00] bg-[#FFC21A] px-4 py-3.5 text-sm font-black text-[#2E2200]"><Phone size={18} /> Call {contact.phone}</a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#21885A] bg-[#C8F0D2] px-4 py-3.5 text-sm font-black text-[#173B28]"><MessageCircle size={18} /> WhatsApp customer</a>
            </div>
            {contact.email && <p className="mt-4 text-sm text-[#4F5D4A]">Email: <a className="font-bold underline" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
            <p className="mt-5 rounded-2xl border border-[#B8CFAE] bg-[#F3F8ED] p-4 text-xs leading-5 text-[#52644E]">Use these details only for this project. Skills Connect Pro has closed the opportunity to other providers.</p>
          </article>

          <article className="rounded-[1.75rem] border-2 border-[#7CAD6E] bg-[#FFF9E8] p-6 shadow-lg shadow-[#355332]/15">
            <div className="flex items-center gap-3"><Wrench className="text-[#B07800]" size={19} /><h2 className="text-lg font-black">Project brief</h2></div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#3E493A]">{project.customerDescription}</p>
            {project.media?.some((item) => item.url) && (
              <figure className="mt-4 overflow-hidden rounded-2xl border-2 border-[#B8CFAE] bg-[#F3F8ED] p-3">
                <figcaption className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#52644E]">Customer reference image</figcaption>
                {project.media.filter((item) => item.url).map((item) => (
                  <img key={item.path} src={item.url} alt={item.alt || 'Customer project reference'} loading="lazy" className="max-h-[28rem] w-full rounded-xl object-contain" />
                ))}
              </figure>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider"><span className="rounded-xl bg-[#EAF3DE] px-3 py-2">{project.category}</span><span className="rounded-xl bg-[#FFE067] px-3 py-2">{project.urgency}</span><span className="rounded-xl bg-[#EAF3DE] px-3 py-2">{project.serviceArea}</span></div>
          </article>
        </div>
      </main>
    );
  }

  if (submitted) {
    return <main className={`${polish.scope} flex min-h-screen items-center justify-center bg-[#9FCB8A] px-5 text-[#173B28]`}><section className="max-w-lg rounded-3xl border-2 border-[#55A979] bg-[#E6F8DF] p-8 text-center shadow-xl shadow-[#355332]/20"><CheckCircle2 className="mx-auto text-[#21885A]" size={46} /><h1 className="mt-5 text-3xl font-black">Response received</h1><p className="mt-3 text-sm leading-6 text-[#355D43]">Thank you, {providerName}. Skills Connect Pro has added your response to the customer&apos;s project.</p></section></main>;
  }

  const responseOptions = responseOptionsForUrgency(project.urgency);
  const showTimeSlots = form.responseType !== null && ['available_today', 'available_tomorrow'].includes(form.responseType);
  const pricingOpen = showPricing || form.responseType === 'site_visit' || form.responseType === 'estimate';
  const submitLabel = form.responseType === 'declined' ? 'Submit decline' : form.responseType === 'need_information' ? 'Submit question' : 'Submit response';
  const submitIsiZulu = form.responseType === 'declined' ? 'Thumela ukuthi awutholakali' : form.responseType === 'need_information' ? 'Thumela umbuzo' : 'Thumela impendulo';
  const t = (en: string, zu: string) => language === 'zu' ? zu : en;

  return (
    <main className={`${polish.scope} min-h-screen ${dark ? 'bg-[#171a19] text-white' : 'bg-[#F8CE35] text-[#203020]'} px-4 py-5 md:px-8 md:py-8`}>
      <div className="mx-auto max-w-4xl">
        <header data-provider-header className="mb-4 rounded-[1.75rem] border-2 border-[#D3A826] bg-[#FFF0A8] p-5 shadow-xl shadow-[#355332]/20 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#5B4300]"><img src="/favicon.ico" alt="" className="size-6 rounded-md object-contain" /> Skills Connect Pro</div><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${leadLocked ? 'border-[#8B5B00] bg-[#3B2C08] text-[#FFE689]' : 'border-[#D3A826] bg-[#FFE067] text-[#4A3600]'}`}>{leadLocked ? 'New lead · unlock to respond' : 'Quick reply · about 1 minute'}</span></div>
          <div className="mt-3 flex items-center justify-end gap-2"><button type="button" onClick={() => setLanguage(language === 'en' ? 'zu' : 'en')} className="rounded-full border border-[#C18A00] bg-white px-3 py-2 text-xs font-black text-[#302300]" aria-label="Change language">{language === 'en' ? 'EN · isiZulu' : 'English · ZU'}</button><button type="button" onClick={() => setDark(!dark)} className="rounded-full border border-[#C18A00] bg-white px-3 py-2 text-xs font-black text-[#302300]">{dark ? '☀ Light' : '☾ Dark'}</button></div>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">{project.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#4F5D4A]">Hi {providerName}. Can you assist with this job? <span data-vernac-inline>· Ungakwazi yini ukwenza lo msebenzi?</span></p>
          <div data-opportunity-meta className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider"><span className="rounded-xl bg-[#FFFFFF]/80 px-3 py-2">{project.category}</span><span className="rounded-xl bg-[#FFD45C] px-3 py-2 text-[#4A3500]">{project.urgency}</span><span className="flex items-center gap-1 rounded-xl bg-[#FFFFFF]/80 px-3 py-2"><MapPin size={13} /> {project.serviceArea}</span></div>
        </header>

        <div className="mx-auto grid max-w-2xl gap-4">
          <section className="space-y-4"><details className="rounded-2xl bg-white/80 p-3 text-sm text-[#203020]"><summary className="cursor-pointer font-bold">{t('Job details', 'Imininingwane yomsebenzi')}</summary>
            {leadLocked && <article data-provider-lead-preview className="rounded-[1.75rem] border-2 border-[#B58D21] bg-[#FFF9E8] p-5 shadow-lg shadow-[#355332]/15 md:p-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-[#FFE067] text-[#5E4300]"><LockKeyhole size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#987300]">Opportunity preview</p><h2 className="text-lg font-black">A new local job is waiting</h2></div></div><p className="mt-4 text-sm leading-6 text-[#4F5D4A]">You can see the job category, urgency and service area. Unlock your lead access to view the full brief, images and customer response options.</p><div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider"><span className="rounded-xl bg-[#EAF3DE] px-3 py-2">{project.category}</span><span className="rounded-xl bg-[#FFE067] px-3 py-2 text-[#4A3500]">{project.urgency}</span><span className="flex items-center gap-1 rounded-xl bg-[#FFFFFF]/80 px-3 py-2"><MapPin size={13} /> {project.serviceArea}</span></div></article>}
            {!leadLocked && <article data-provider-job-card className="rounded-[1.75rem] border-2 border-[#7CAD6E] bg-[#FFF9E8] p-5 shadow-lg shadow-[#355332]/15 md:p-6">
              <div className="flex items-center gap-3"><Wrench className="text-[#B07800]" size={19} /><div><h2 className="text-lg font-black">Job overview</h2><span data-vernac>Imininingwane yomsebenzi</span></div></div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#3E493A]">{project.customerDescription}</p>
              {project.media?.some((item) => item.url) && (
                <figure className="mt-4 overflow-hidden rounded-2xl border-2 border-[#B8CFAE] bg-[#F3F8ED] p-3">
                  <figcaption className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#52644E]">Customer reference image</figcaption>
                  {project.media.filter((item) => item.url).map((item) => (
                    <img key={item.path} src={item.url} alt={item.alt || 'Customer project reference'} loading="lazy" className="max-h-[28rem] w-full rounded-xl object-contain" />
                  ))}
                </figure>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2"><div data-job-fact className="rounded-2xl bg-[#EAF3DE] p-3.5"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#60705A]"><CalendarClock size={13} /> Preferred time <span data-vernac-inline>· Isikhathi esithandwayo</span></p><p className="mt-1.5 text-sm font-bold">{formatDate(project.preferredDate)}</p></div><div data-job-fact className="rounded-2xl bg-[#EAF3DE] p-3.5"><p className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">Customer estimate <span data-vernac-inline>· Isilinganiso sekhasimende</span></p><p className="mt-1.5 text-sm font-bold">{project.estimatedMin === null && project.estimatedMax === null ? 'Not supplied' : `${formatMoney(project.estimatedMin, project.estimateCurrency)} – ${formatMoney(project.estimatedMax, project.estimateCurrency)}`}</p></div></div>
              {project.aiSummary && <details className="mt-4 rounded-2xl border border-[#B8CFAE] bg-[#F3F8ED] p-4"><summary className="cursor-pointer text-xs font-black uppercase tracking-wider text-[#52644E]">View preliminary assessment</summary><p className="mt-3 text-sm leading-6 text-[#3E493A]">{project.aiSummary}</p></details>}
              {project.likelyIssue && <p className="mt-4 text-sm text-[#4F5D4A]"><strong className="text-[#203020]">Likely issue:</strong> {project.likelyIssue}</p>}
              <p className="mt-4 flex items-center gap-2 text-xs text-[#65735E]"><Clock3 size={14} /> Reply by {formatDate(opportunity.responseDeadline)}</p>
            </article>}
            {!leadLocked && project.safetyNotes.length > 0 && <article className="rounded-[1.75rem] border-2 border-[#D9A52D] bg-[#FFF0B8] p-5"><h2 className="font-black text-[#5F4300]">Safety notes</h2><ul className="mt-3 space-y-2 text-sm text-[#6F5414]">{project.safetyNotes.map((note) => <li key={note}>• {note}</li>)}</ul></article>}
          </details></section>

          {leadLocked ? <aside data-provider-lead-lock className="h-fit rounded-[1.75rem] border-2 border-[#D1A93C] bg-[#201a08] p-5 text-[#FFF9E8] shadow-xl shadow-[#355332]/20 lg:sticky lg:top-5"><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#FFD45C] text-[#4A3500]"><Sparkles size={21} /></span><span className="rounded-full border border-[#FFE067]/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#FFE067]">Lead access paused</span></div><h2 className="mt-5 text-2xl font-black leading-tight">Your first {opportunity.leadAccess.freeLeadLimit} leads opened the door. Keep it open.</h2><p className="mt-3 text-sm leading-6 text-[#E7DDBA]">Choose a provider plan to unlock this opportunity and keep responding to new customer work.</p><div className="mt-5 rounded-2xl border border-[#FFE067]/25 bg-white/5 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FFE067]">Your free lead access</p><div className="mt-2 flex items-end justify-between"><strong className="text-3xl font-black">{opportunity.leadAccess.freeLeadsUsed}<span className="text-base text-[#E7DDBA]"> / {opportunity.leadAccess.freeLeadLimit}</span></strong><span className="text-xs font-bold text-[#E7DDBA]">Free leads used</span></div></div><div className="mt-4 grid grid-cols-3 gap-2"><span className="rounded-xl bg-[#FFF7DC] px-2 py-3 text-center text-xs font-black text-[#3B2C08]">Starter<br /><strong>R49</strong></span><span className="rounded-xl bg-[#FFD45C] px-2 py-3 text-center text-xs font-black text-[#3B2C08]">Growth<br /><strong>R99</strong></span><span className="rounded-xl bg-[#FFF7DC] px-2 py-3 text-center text-xs font-black text-[#3B2C08]">Pro<br /><strong>R199</strong></span></div><Link href={`/provider-plans?provider=${encodeURIComponent(opportunity.providerId)}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD45C] px-4 py-3.5 text-sm font-black text-[#342600]">Unlock this lead <ArrowRight size={18} /></Link><Link href="/provider-plans" className="mt-3 flex items-center justify-center text-xs font-bold text-[#FFE689] underline underline-offset-4">Compare every provider plan</Link></aside> : <form data-provider-response-form data-choice-made={form.responseType ? 'true' : 'false'} onSubmit={submitResponse} className="h-fit rounded-[1.75rem] border-2 border-[#D1A93C] bg-[#FFF2C7] p-5 shadow-xl shadow-[#355332]/20 lg:sticky lg:top-5">
            <div className="mb-4 flex items-center justify-between text-xs font-black text-[#4B420D]"><button type="button" onClick={() => setStep(step === 3 ? 2 : 1)} disabled={step === 1} className="disabled:opacity-30">← {t('Back', 'Emuva')}</button><span>{t('Step', 'Isinyathelo')} {step} / 3</span></div>
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">{step === 1 ? t('Choose availability', 'Khetha isikhathi otholakala ngaso') : step === 2 ? t('Arrival & details', 'Isikhathi nemininingwane') : t('Review your response', 'Hlola impendulo yakho')}</h2><span data-vernac>Phendula ngaleli thuba lomsebenzi</span><p className="mt-1 text-xs leading-5 text-[#6E765F]">Choose your availability. Pricing and a note are optional.</p></div><MessageCircle className="mt-1 text-[#B07800]" size={21} /></div>
            {step === 1 && <div className="mt-4 grid grid-cols-1 gap-2">{responseOptions.map((option, index) => { const Icon = option.icon; const active = form.responseType === option.value; const hinted = !form.responseType && hintIndex === index; return <button data-provider-option={option.value} data-selected={active ? 'true' : 'false'} data-hint-active={hinted ? 'true' : 'false'} style={hinted ? { boxShadow: '0 0 0 3px rgba(245,197,24,.72), 0 0 26px rgba(245,197,24,.55), 0 18px 32px -18px rgba(245,197,24,.78)', transform: 'translateY(-3px) scale(1.018)', borderColor: '#f5c518', transition: 'all 280ms ease' } : { transition: 'all 280ms ease' }} type="button" key={option.value} onClick={() => chooseResponse(option.value)} className={`relative rounded-2xl border-2 p-3 text-left text-[#203020] shadow-sm ${option.tone} ${active ? '-translate-y-0.5 ring-4 ring-[#203020]/20' : 'hover:-translate-y-0.5'}`}>{active && <CheckCircle2 className="absolute right-2.5 top-2.5" size={17} />}<Icon size={18} /><span className="mt-2 block pr-4 text-sm font-black leading-tight">{option.title}</span><span className="mt-1 block text-[10px] leading-4 text-[#4D5949]">{option.helper}</span><span data-vernac-choice>{option.isiZulu}</span></button>; })}</div>}
            {step === 1 && <button data-provider-decline data-selected={form.responseType === 'declined' ? 'true' : 'false'} type="button" onClick={() => chooseResponse('declined')} className={`mt-2 flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left ${form.responseType === 'declined' ? 'border-[#B95C69] bg-[#FFC8D2] text-[#6E2430] ring-4 ring-[#6E2430]/15' : 'border-[#D7A5AD] bg-[#FFE5E9] text-[#74404A]'}`}><span className="flex items-center gap-2 text-sm font-bold"><XCircle size={17} /><span>Not available for this job <span data-vernac-inline>· Angitholakali kulo msebenzi</span></span></span><span className="text-[10px] uppercase tracking-wider">Decline</span></button>}
            {step === 2 && <div>
            {showTimeSlots && <div className="mt-5"><p className="text-[10px] font-black uppercase tracking-wider text-[#66725F]">Estimated arrival window <span data-vernac-inline>· Isikhathi engingafika ngaso</span></p><div className="mt-2 flex flex-wrap gap-2">{TIME_SLOTS.map((slot) => <button data-provider-time data-selected={form.timeSlot === slot.value ? 'true' : 'false'} type="button" key={slot.value} onClick={() => setForm((current) => ({ ...current, timeSlot: slot.value }))} className={`rounded-full border-2 px-3 py-2 text-xs font-bold ${form.timeSlot === slot.value ? 'border-[#C89A18] bg-[#FFD75F] text-[#3F2D00]' : 'border-[#9DBA8F] bg-[#FFFFFF]/75 text-[#3E493A]'}`}><span>{slot.label}</span><span data-vernac-time>{slot.isiZulu}</span></button>)}</div></div>}
            {(form.responseType === 'available_this_week' || form.responseType === 'available_next_week') && <p className="mt-4 rounded-2xl bg-[#EAF3DE] px-4 py-3 text-xs font-semibold text-[#53644D]">You can confirm the exact day with the customer after they choose your response.</p>}
            <button data-provider-pricing type="button" onClick={() => setShowPricing((current) => !current)} className="mt-5 flex w-full items-center justify-between rounded-xl border-2 border-[#B7CBAE] bg-[#FFFDF5] px-4 py-3 text-left"><span><span className="block text-xs font-black text-[#293829]">Add pricing details <span data-vernac-inline>· Faka imininingwane yentengo</span></span><span className="mt-0.5 block text-[10px] text-[#6E765F]">Optional — site visit fee or preliminary range</span></span><ChevronDown className={`text-[#60705A] transition ${pricingOpen ? 'rotate-180' : ''}`} size={17} /></button>
            {pricingOpen && <div className="mt-3 space-y-3 rounded-2xl border-2 border-[#B7CBAE] bg-[#F7FAF2] p-3.5"><label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">Site visit fee (R) <span data-vernac-inline>· Imali yokuhlola indawo</span></span><input inputMode="decimal" value={form.siteVisitFee} onChange={(event) => setForm({ ...form, siteVisitFee: event.target.value })} placeholder="For example: 250" className="mt-1.5 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none focus:border-[#D2A326]" /></label><div className="grid grid-cols-2 gap-2"><label><span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">From (R) <span data-vernac-inline>· Kusukela</span></span><input inputMode="decimal" value={form.estimateMin} onChange={(event) => setForm({ ...form, estimateMin: event.target.value })} placeholder="Minimum" className="mt-1.5 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none focus:border-[#D2A326]" /></label><label><span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">To (R) <span data-vernac-inline>· Kuze kufike</span></span><input inputMode="decimal" value={form.estimateMax} onChange={(event) => setForm({ ...form, estimateMax: event.target.value })} placeholder="Maximum" className="mt-1.5 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none focus:border-[#D2A326]" /></label></div></div>}
            <label className="mt-4 block"><span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">Message to customer — optional <span data-vernac-inline>· Umlayezo oya ekhasimendeni</span></span><textarea value={form.providerMessage} onChange={(event) => setForm({ ...form, providerMessage: event.target.value })} placeholder={form.responseType === 'need_information' ? 'What do you need to know?' : 'Add a quick note or question'} className="mt-1.5 min-h-20 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none focus:border-[#D2A326]" /></label>
            <button type="button" onClick={() => setStep(3)} className="mt-4 w-full rounded-xl bg-[#FFC21A] px-4 py-3 font-black text-[#302300]">{t('Review response →', 'Hlola impendulo →')}</button></div>}
            {step === 3 && <div className="mt-4 rounded-xl bg-white/80 p-4 text-sm text-[#203020]"><p className="font-bold">{t('Availability', 'Ukutholakala')}: {form.responseType ? (OPTIONS as Partial<Record<ResponseType, ResponseOption>>)[form.responseType]?.[language === 'zu' ? 'isiZulu' : 'title'] || t('Not available', 'Angitholakali') : '—'}</p><p className="mt-2">{t('Arrival', 'Isikhathi sokufika')}: {TIME_SLOTS.find(slot => slot.value === form.timeSlot)?.[language === 'zu' ? 'isiZulu' : 'label']}</p>{form.providerMessage && <p className="mt-2">{form.providerMessage}</p>}</div>}
            {error && <p className="mt-3 rounded-xl border border-[#C95D65] bg-[#FFDDE2] p-3 text-sm text-[#8E3039]">{error}</p>}
            {step === 3 && <button data-provider-submit disabled={submitting || !form.responseType} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-black uppercase tracking-wider shadow-md disabled:opacity-50 ${form.responseType === 'declined' ? 'border-[#96515C] bg-[#FFC8D2] text-[#64212C]' : 'border-[#C18A00] bg-[#FFC21A] text-[#2E2200]'}`}>{submitting ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}<span data-submit-copy><span>{submitLabel}</span><span data-vernac-submit>{submitIsiZulu}</span></span></button>}
          </form>}
        </div>
      </div>
    </main>
  );
}
