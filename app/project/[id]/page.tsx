'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  UserRoundCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';

type ProviderResponse = {
  id: string;
  providerId: number;
  provider: Record<string, unknown>;
  responseType: string;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
  siteVisitFee: number | null;
  estimateMin: number | null;
  estimateMax: number | null;
  estimateCurrency: string;
  providerMessage: string | null;
  validUntil: string | null;
  createdAt: string;
};

type ReleasedProviderContact = {
  id: number;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
};

type ProjectFeed = {
  project: {
    id: string;
    guestName: string | null;
    title: string;
    customerDescription: string;
    category: string;
    urgency: string;
    serviceLevel: string;
    status: string;
    locationText: string;
    suburb: string | null;
    city: string | null;
    responseTargetAt: string | null;
    estimatedMin: number | null;
    estimatedMax: number | null;
    estimateCurrency: string;
    safetyNotes: string[];
    createdAt: string;
  };
  matching: {
    invitationsSent: number;
    invitationCounts: Record<string, number>;
    validResponsesReceived: number;
    providersReviewing: number;
  };
  responses: ProviderResponse[];
  match: {
    id: string;
    providerId: number;
    providerResponseId: string | null;
    status: string;
    selectedAt: string;
    contactReleasedAt: string | null;
  } | null;
  releasedContact: {
    provider: ReleasedProviderContact;
  } | null;
  timeline: Array<{
    id: number;
    eventType: string;
    message: string | null;
    createdAt: string;
  }>;
};

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to load project.');
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

function providerName(provider: Record<string, unknown>): string {
  if (typeof provider.name === 'string' && provider.name.trim()) return provider.name;
  if (typeof provider.business_name === 'string' && provider.business_name.trim()) return provider.business_name;
  const firstName = typeof provider.first_name === 'string' ? provider.first_name : '';
  const lastName = typeof provider.last_name === 'string' ? provider.last_name : '';
  return `${firstName} ${lastName}`.trim() || 'Service provider';
}

function providerString(provider: Record<string, unknown>, field: string): string | null {
  return typeof provider[field] === 'string' ? (provider[field] as string) : null;
}

function providerNumber(provider: Record<string, unknown>, field: string): number | null {
  const value = provider[field];
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function whatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('0')) return `27${digits.slice(1)}`;
  return digits;
}

export default function CustomerProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [accessToken, setAccessToken] = useState('');
  const [feed, setFeed] = useState<ProjectFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectingResponseId, setSelectingResponseId] = useState<string | null>(null);
  const [releasingContact, setReleasingContact] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') ?? '';
    setAccessToken(token);
    if (!token) {
      setError('This project link is missing its secure access token.');
      setLoading(false);
    }
  }, []);

  const loadFeed = useCallback(async (quiet = false) => {
    if (!projectId || !accessToken) return;
    if (!quiet) setLoading(true);
    setError(null);

    try {
      const payload = await readJson(
        await fetch(`/api/projects/${projectId}/responses`, {
          headers: { 'x-project-access-token': accessToken },
          cache: 'no-store',
        }),
      );
      setFeed(payload);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load project responses.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    if (!accessToken) return;
    void loadFeed();
    const interval = window.setInterval(() => void loadFeed(true), 15000);
    return () => window.clearInterval(interval);
  }, [accessToken, loadFeed]);

  const selectedResponseId = feed?.match?.providerResponseId ?? null;
  const selectedResponse = useMemo(
    () => feed?.responses.find((response) => response.id === selectedResponseId) ?? null,
    [feed, selectedResponseId],
  );
  const contactsReleased = Boolean(feed?.match?.contactReleasedAt && feed?.releasedContact?.provider);

  const selectProvider = async (responseId: string) => {
    setSelectingResponseId(responseId);
    setError(null);

    try {
      await readJson(
        await fetch(`/api/projects/${projectId}/select-provider`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-project-access-token': accessToken,
          },
          body: JSON.stringify({ providerResponseId: responseId }),
        }),
      );
      await loadFeed(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to select provider.');
    } finally {
      setSelectingResponseId(null);
    }
  };

  const releaseContact = async () => {
    setReleasingContact(true);
    setError(null);

    try {
      await readJson(
        await fetch(`/api/projects/${projectId}/release-contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-project-access-token': accessToken,
          },
          body: JSON.stringify({ confirmShare: true }),
        }),
      );
      setShowReleaseConfirm(false);
      await loadFeed(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to release contact details.');
    } finally {
      setReleasingContact(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080d0b] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-amber-300" size={36} />
          <p className="mt-4 text-sm text-zinc-400">Opening your project…</p>
        </div>
      </main>
    );
  }

  if (error && !feed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080d0b] px-5 text-white">
        <section className="max-w-md rounded-3xl border border-red-400/30 bg-red-500/10 p-7 text-center">
          <AlertTriangle className="mx-auto text-red-300" size={38} />
          <h1 className="mt-4 text-2xl font-black">Project unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-red-100/80">{error}</p>
        </section>
      </main>
    );
  }

  if (!feed) return null;
  const project = feed.project;
  const releasedProvider = feed.releasedContact?.provider ?? null;
  const selectedName = selectedResponse ? providerName(selectedResponse.provider) : 'the selected provider';
  const whatsappHref = releasedProvider?.whatsapp
    ? `https://wa.me/${whatsappNumber(releasedProvider.whatsapp)}?text=${encodeURIComponent(
        `Hi ${releasedProvider.name}, I selected you through Skills Connect Pro for my project: ${project.title}.`,
      )}`
    : null;

  return (
    <main className="min-h-screen bg-[#080d0b] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                <ShieldCheck size={16} /> Skills Connect Pro project
              </div>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">{project.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{project.customerDescription}</p>
            </div>
            <button
              onClick={() => void loadFeed()}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="rounded-lg bg-white/10 px-3 py-2">{project.category}</span>
            <span className="rounded-lg bg-white/10 px-3 py-2">{project.urgency}</span>
            <span className="rounded-lg bg-white/10 px-3 py-2">{project.status.replaceAll('_', ' ')}</span>
            <span className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2"><MapPin size={13} /> {project.suburb || project.city || project.locationText}</span>
          </div>
          {lastUpdated && <p className="mt-4 text-[11px] text-zinc-600">Updated {lastUpdated.toLocaleTimeString('en-ZA')}</p>}
        </header>

        {error && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            <AlertTriangle className="shrink-0" size={18} /> {error}
          </div>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <Users className="text-amber-300" size={20} />
            <p className="mt-3 text-3xl font-black">{feed.matching.invitationsSent}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">Providers contacted</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <Clock3 className="text-amber-300" size={20} />
            <p className="mt-3 text-3xl font-black">{feed.matching.providersReviewing}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">Reviewing request</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <p className="mt-3 text-3xl font-black">{feed.matching.validResponsesReceived}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">Responses received</p>
          </div>
        </section>

        {selectedResponse && !contactsReleased && (
          <section className="mt-6 rounded-3xl border border-amber-300/30 bg-amber-400/10 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <UserRoundCheck className="mt-1 shrink-0 text-amber-300" size={28} />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-amber-300">Provider selected</p>
                  <h2 className="mt-2 text-2xl font-black">{selectedName}</h2>
                  <p className="mt-2 max-w-xl text-sm text-zinc-400">
                    Confirm this provider to share your contact details and receive theirs. You can still change your selection before confirming.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReleaseConfirm(true)}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-black"
              >
                <LockKeyhole size={16} /> Confirm & connect
              </button>
            </div>
          </section>
        )}

        {contactsReleased && releasedProvider && (
          <section className="mt-6 rounded-3xl border border-emerald-400/35 bg-emerald-500/10 p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 shrink-0 text-emerald-300" size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-300">You are connected</p>
                <h2 className="mt-2 text-2xl font-black">{releasedProvider.name}</h2>
                <p className="mt-2 text-sm text-emerald-50/70">Contact details have been released only to you and the selected provider.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {releasedProvider.phone && (
                    <a href={`tel:${releasedProvider.phone}`} className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#102018]">
                      <Phone size={17} /> Call {releasedProvider.phone}
                    </a>
                  )}
                  {whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black text-[#071d10]">
                      <MessageCircle size={17} /> WhatsApp provider
                    </a>
                  )}
                </div>
                {releasedProvider.email && <p className="mt-4 text-xs text-zinc-400">Email: {releasedProvider.email}</p>}
              </div>
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Rolling responses</p>
              <h2 className="mt-2 text-2xl font-black">Available provider options</h2>
            </div>
            <p className="text-xs text-zinc-500">Response target: {formatDate(project.responseTargetAt)}</p>
          </div>

          {feed.responses.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.025] py-20 text-center">
              <Wrench className="mx-auto text-zinc-700" size={42} />
              <h3 className="mt-4 text-lg font-black">Providers are being contacted</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Responses will appear here as providers confirm availability. This page refreshes automatically every 15 seconds.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {feed.responses.map((response) => {
                const name = providerName(response.provider);
                const category = providerString(response.provider, 'category');
                const location = providerString(response.provider, 'location');
                const verified = response.provider.verified === true;
                const rating = providerNumber(response.provider, 'rating');
                const selected = response.id === selectedResponseId;

                return (
                  <article
                    key={response.id}
                    className={`rounded-3xl border p-5 ${selected ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-white/[0.035]'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black">{name}</h3>
                          {verified && <ShieldCheck className="text-emerald-400" size={17} />}
                        </div>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-amber-300">{category || 'Service provider'}</p>
                        {location && <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500"><MapPin size={12} /> {location}</p>}
                      </div>
                      {rating !== null && (
                        <span className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-bold">
                          <Star size={12} className="fill-current text-amber-300" /> {rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-black/20 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Availability</p>
                        <p className="mt-1 font-bold capitalize">{response.responseType.replaceAll('_', ' ')}</p>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Site visit</p>
                        <p className="mt-1 font-bold">{formatMoney(response.siteVisitFee, response.estimateCurrency)}</p>
                      </div>
                    </div>

                    {(response.estimateMin !== null || response.estimateMax !== null) && (
                      <div className="mt-3 rounded-2xl bg-black/20 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Preliminary estimate</p>
                        <p className="mt-1 font-bold">
                          {formatMoney(response.estimateMin, response.estimateCurrency)} – {formatMoney(response.estimateMax, response.estimateCurrency)}
                        </p>
                      </div>
                    )}

                    {response.arrivalWindowStart && (
                      <p className="mt-4 text-xs text-zinc-500">Possible arrival: {formatDate(response.arrivalWindowStart)}{response.arrivalWindowEnd ? ` – ${formatDate(response.arrivalWindowEnd)}` : ''}</p>
                    )}
                    {response.providerMessage && <p className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm leading-6 text-zinc-300">“{response.providerMessage}”</p>}

                    <button
                      disabled={contactsReleased || selected || selectingResponseId !== null}
                      onClick={() => void selectProvider(response.id)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-45"
                    >
                      {selectingResponseId === response.id ? <Loader2 className="animate-spin" size={16} /> : selected ? <CheckCircle2 size={16} /> : <UserRoundCheck size={16} />}
                      {selected ? (contactsReleased ? 'Connected' : 'Selected') : contactsReleased ? 'Selection closed' : 'Select provider'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <h2 className="font-black">Project activity</h2>
          <div className="mt-4 space-y-3">
            {feed.timeline.map((event) => (
              <div key={event.id} className="flex gap-3 border-l border-white/10 pl-4">
                <div>
                  <p className="text-sm font-bold capitalize">{event.eventType.replaceAll('_', ' ')}</p>
                  {event.message && <p className="mt-1 text-xs text-zinc-500">{event.message}</p>}
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-700">{formatDate(event.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showReleaseConfirm && selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center">
          <section className="w-full max-w-lg rounded-3xl border border-amber-300/30 bg-[#111713] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Final confirmation</p>
                <h2 className="mt-2 text-2xl font-black">Connect with {selectedName}?</h2>
              </div>
              <button onClick={() => setShowReleaseConfirm(false)} className="rounded-xl border border-white/10 p-2 text-zinc-400" aria-label="Close confirmation">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 rounded-2xl bg-white/[0.04] p-4 text-sm leading-6 text-zinc-300">
              Skills Connect Pro will share your name, phone number and project location only with this provider. Their phone and WhatsApp details will then appear on this page. Other provider invitations will be closed.
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button onClick={() => setShowReleaseConfirm(false)} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-zinc-200">Not yet</button>
              <button disabled={releasingContact} onClick={() => void releaseContact()} className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-black disabled:opacity-50">
                {releasingContact ? <Loader2 className="animate-spin" size={17} /> : <LockKeyhole size={17} />}
                Share & connect
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
