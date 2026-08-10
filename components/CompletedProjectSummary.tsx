'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

type TimelineEvent = {
  id: number;
  eventType: string;
  message: string | null;
  createdAt: string;
};

type CompletedFeed = {
  project: {
    id: string;
    title: string;
    customerDescription: string;
    category: string;
    urgency: string;
    status: string;
    locationText: string;
    suburb: string | null;
    city: string | null;
    createdAt: string;
  };
  matching: {
    invitationsSent: number;
    validResponsesReceived: number;
  };
  match: {
    providerId: number;
    status: string;
    selectedAt: string;
    contactReleasedAt: string | null;
    finalPrice: number | null;
    finalPriceCurrency: string;
  } | null;
  releasedContact: {
    provider: {
      id: number;
      name: string;
      phone: string | null;
      whatsapp: string | null;
      email: string | null;
    };
  } | null;
  timeline: TimelineEvent[];
};

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to load the completed project.');
  return payload;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatMoney(value: number | null | undefined, currency = 'ZAR') {
  if (value === null || value === undefined) return 'Not recorded';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function whatsappNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
}

function completedAt(feed: CompletedFeed) {
  return feed.timeline
    .filter((event) => ['project_completed', 'project_auto_completed'].includes(event.eventType))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt ?? null;
}

/**
 * A completed project is no longer an active marketplace screen. This component
 * replaces the long response, routing and activity interface with a concise
 * permanent job record while keeping details available on demand.
 */
export const CompletedProjectSummary = () => {
  const pathname = usePathname();
  const projectId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length === 2 && parts[0] === 'project' ? parts[1] : '';
  }, [pathname]);

  const [accessToken, setAccessToken] = useState('');
  const [feed, setFeed] = useState<CompletedFeed | null>(null);
  const [mountTarget, setMountTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!projectId) {
      setAccessToken('');
      setFeed(null);
      return;
    }
    setAccessToken(new URLSearchParams(window.location.search).get('token')?.trim() ?? '');
  }, [projectId]);

  const load = useCallback(async () => {
    if (!projectId || !accessToken) return;
    try {
      const payload = await readJson(
        await fetch(`/api/projects/${encodeURIComponent(projectId)}/responses`, {
          headers: { 'x-project-access-token': accessToken },
          cache: 'no-store',
        }),
      );
      setFeed(payload as CompletedFeed);
    } catch {
      setFeed(null);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    void load();
    if (!projectId || !accessToken) return;
    const interval = window.setInterval(() => void load(), 15000);
    window.addEventListener('customer-dashboard-updated', load);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('customer-dashboard-updated', load);
    };
  }, [accessToken, load, projectId]);

  const completed = feed?.project.status === 'completed';

  useEffect(() => {
    if (!completed) {
      setMountTarget(null);
      return;
    }

    const locate = () => {
      const main = document.querySelector<HTMLElement>('main.min-h-screen');
      const container = main?.querySelector<HTMLElement>(':scope > div');
      if (container) setMountTarget(container);
    };

    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [completed]);

  useEffect(() => {
    if (!completed || !mountTarget) return;

    const hiddenElements: HTMLElement[] = [];
    const collapse = () => {
      for (const child of Array.from(mountTarget.children)) {
        if (!(child instanceof HTMLElement)) continue;
        if (child.dataset.completedProjectSummary === 'true') continue;
        if (child.style.display === 'none') continue;
        child.dataset.previousDisplay = child.style.display;
        child.style.display = 'none';
        hiddenElements.push(child);
      }

      const lifecycle = document.getElementById('job-status-controls');
      if (lifecycle && lifecycle.style.display !== 'none') {
        lifecycle.dataset.previousDisplay = lifecycle.style.display;
        lifecycle.style.display = 'none';
        hiddenElements.push(lifecycle);
      }
    };

    collapse();
    const observer = new MutationObserver(collapse);
    observer.observe(mountTarget, { childList: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      observer.disconnect();
      for (const element of hiddenElements) {
        element.style.display = element.dataset.previousDisplay || '';
        delete element.dataset.previousDisplay;
      }
    };
  }, [completed, mountTarget]);

  if (!completed || !feed || !mountTarget) return null;

  const provider = feed.releasedContact?.provider ?? null;
  const location = feed.project.suburb || feed.project.city || feed.project.locationText;
  const completionDate = completedAt(feed);
  const whatsappHref = provider?.whatsapp
    ? `https://wa.me/${whatsappNumber(provider.whatsapp)}?text=${encodeURIComponent(
        `Hi ${provider.name}, I am contacting you about our completed Skills Connect Pro project: ${feed.project.title}.`,
      )}`
    : null;

  return createPortal(
    <div data-completed-project-summary="true" className="pb-10">
      <section className="rounded-[2rem] border border-emerald-400/35 bg-gradient-to-b from-emerald-500/15 to-white/[0.035] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
              <CheckCircle2 size={30} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
                Completed job record
              </p>
              <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{feed.project.title}</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                This project is closed. The active matching and provider-selection screens have been archived into this summary.
              </p>
            </div>
          </div>
          <span className="self-start rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300">
            Customer confirmed complete
          </span>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <UserRoundCheck className="text-emerald-300" size={19} />
            <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-600">Selected provider</p>
            <p className="mt-1 font-black text-white">{provider?.name || 'Provider record'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ShieldCheck className="text-emerald-300" size={19} />
            <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-600">Final price</p>
            <p className="mt-1 font-black text-white">
              {formatMoney(feed.match?.finalPrice, feed.match?.finalPriceCurrency || 'ZAR')}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <MapPin className="text-emerald-300" size={19} />
            <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-600">Service area</p>
            <p className="mt-1 font-black text-white">{location || 'Not recorded'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <Clock3 className="text-emerald-300" size={19} />
            <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-600">Completed</p>
            <p className="mt-1 text-sm font-black text-white">{formatDate(completionDate)}</p>
          </div>
        </div>

        {provider && (provider.phone || whatsappHref) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#102018]"
              >
                <Phone size={17} /> Call {provider.phone}
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-black text-[#071d10]"
              >
                <MessageCircle size={17} /> WhatsApp provider
              </a>
            )}
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-4">
        <details className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="text-amber-300" size={21} />
              <div>
                <p className="font-black text-white">Project summary</p>
                <p className="mt-1 text-xs text-zinc-500">Open the original request and marketplace totals</p>
              </div>
            </div>
            <ChevronDown className="text-zinc-500 transition group-open:rotate-180" size={20} />
          </summary>
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-sm leading-6 text-zinc-300">{feed.project.customerDescription}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Category</p>
                <p className="mt-1 text-sm font-bold">{feed.project.category}</p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Urgency</p>
                <p className="mt-1 text-sm font-bold">{titleCase(feed.project.urgency)}</p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Providers invited</p>
                <p className="mt-1 text-sm font-bold">{feed.matching.invitationsSent}</p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Responses received</p>
                <p className="mt-1 text-sm font-bold">{feed.matching.validResponsesReceived}</p>
              </div>
            </div>
          </div>
        </details>

        <details className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock3 className="text-amber-300" size={21} />
              <div>
                <p className="font-black text-white">Project activity</p>
                <p className="mt-1 text-xs text-zinc-500">{feed.timeline.length} recorded step{feed.timeline.length === 1 ? '' : 's'} · tap to view</p>
              </div>
            </div>
            <ChevronDown className="text-zinc-500 transition group-open:rotate-180" size={20} />
          </summary>
          <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
            {feed.timeline.map((event) => (
              <div key={event.id} className="border-l border-white/10 pl-4">
                <p className="text-sm font-bold text-white">{titleCase(event.eventType)}</p>
                {event.message && <p className="mt-1 text-xs leading-5 text-zinc-500">{event.message}</p>}
                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-700">{formatDate(event.createdAt)}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>,
    mountTarget,
  );
};
