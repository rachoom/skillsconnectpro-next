'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FolderOpen,
  Loader2,
  MapPin,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import {
  customerProjectHref,
  listCustomerProjects,
  rememberCustomerProject,
  removeCustomerProject,
  type StoredCustomerProject,
} from '@/services/customerProjectStore';

type LiveProject = StoredCustomerProject & {
  responseCount: number | null;
  providersReviewing: number | null;
  loadState: 'idle' | 'loading' | 'ready' | 'unavailable';
};

function statusLabel(value: string | null): string {
  if (!value) return 'Project saved';
  const labels: Record<string, string> = {
    assessment_complete: 'Ready for matching',
    matching: 'Finding providers',
    responses_received: 'Responses received',
    provider_selected: 'Provider selected',
    contact_released: 'Connected',
    in_progress: 'Work in progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    unfulfilled: 'Closed',
  };
  return labels[value] || value.replaceAll('_', ' ');
}

function formatDate(value: string | null): string {
  if (!value) return 'Recently saved';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently saved';
  return parsed.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<LiveProject[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = async () => {
    const stored = listCustomerProjects();
    setProjects(stored.map((project) => ({ ...project, responseCount: null, providersReviewing: null, loadState: 'loading' })));
    if (stored.length === 0) return;

    setRefreshing(true);
    const refreshed = await Promise.all(stored.map(async (project): Promise<LiveProject> => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/responses`, {
          headers: { 'x-project-access-token': project.token },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('unavailable');
        const feed = await response.json();
        const updated = rememberCustomerProject({
          id: project.id,
          token: project.token,
          title: feed.project?.title || project.title,
          category: feed.project?.category || project.category,
          status: feed.project?.status || project.status,
          locationText: feed.project?.suburb || feed.project?.city || feed.project?.locationText || project.locationText,
          createdAt: feed.project?.createdAt || project.createdAt,
        }) || project;
        return {
          ...updated,
          responseCount: Number(feed.matching?.validResponsesReceived ?? 0),
          providersReviewing: Number(feed.matching?.providersReviewing ?? 0),
          loadState: 'ready',
        };
      } catch {
        return { ...project, responseCount: null, providersReviewing: null, loadState: 'unavailable' };
      }
    }));
    setProjects(refreshed);
    setRefreshing(false);
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const activeCount = useMemo(
    () => projects.filter((project) => !['completed', 'cancelled', 'unfulfilled'].includes(project.status || '')).length,
    [projects],
  );

  const removeProject = (id: string) => {
    removeCustomerProject(id);
    setProjects((current) => current.filter((project) => project.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#080807] px-4 py-5 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[1.6rem] border border-[#f5c518]/25 bg-[radial-gradient(circle_at_90%_0%,rgba(245,197,24,.12),transparent_20rem),linear-gradient(145deg,#171713,#0b0b09)] p-5 shadow-2xl sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-[#f5c518]">
              <ArrowLeft size={17} /> Skills Connect Pro
            </Link>
            <button
              type="button"
              onClick={() => void loadProjects()}
              disabled={refreshing}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 text-xs font-black text-white disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          <div className="mt-8 flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#f5c518]/30 bg-[#f5c518]/10 text-[#f5c518]">
              <FolderOpen size={24} />
            </span>
            <div>
              <span className="text-[11px] font-black uppercase tracking-[.18em] text-[#f5c518]">Customer workspace</span>
              <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">My Projects</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Return to projects you created or opened on this device. Secure project access stays on this device and contact details remain protected until you choose a provider.
              </p>
            </div>
          </div>
          {projects.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider">
              <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2">{projects.length} saved</span>
              <span className="rounded-full border border-[#55d38b]/20 bg-[#55d38b]/[.06] px-3 py-2 text-[#7be2a8]">{activeCount} active</span>
            </div>
          )}
        </header>

        {projects.length === 0 ? (
          <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#11110f] p-8 text-center sm:p-12">
            <span className="mx-auto grid size-16 place-items-center rounded-full border border-[#f5c518]/25 bg-[#f5c518]/[.07] text-[#f5c518]">
              <BriefcaseBusiness size={28} />
            </span>
            <h2 className="mt-5 text-2xl font-black">No projects saved on this device yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/55">
              New projects will appear here automatically. Existing projects will also be added the next time you open their secure dashboard link, including the link sent to you on WhatsApp.
            </p>
            <Link href="/get-help" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#f5c518] px-5 text-sm font-black text-black">
              Start a new request <ArrowRight size={17} />
            </Link>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <article key={project.id} className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(150deg,#171714,#0d0d0b)] p-5 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-[.16em] text-[#f5c518]">{statusLabel(project.status)}</span>
                    <h2 className="mt-2 line-clamp-2 text-xl font-black tracking-[-.025em]">{project.title}</h2>
                  </div>
                  {project.loadState === 'loading' ? (
                    <Loader2 size={18} className="mt-1 shrink-0 animate-spin text-white/45" />
                  ) : project.loadState === 'ready' ? (
                    <CheckCircle2 size={18} className="mt-1 shrink-0 text-[#55d38b]" />
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-white/60">
                  {project.category && <span className="rounded-full border border-white/10 px-3 py-1.5">{project.category}</span>}
                  {project.locationText && <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5"><MapPin size={12} /> {project.locationText}</span>}
                </div>

                {project.loadState === 'ready' && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/8 bg-white/[.025] p-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white/45"><Users size={13} /> Responses</span>
                      <strong className="mt-1 block text-xl">{project.responseCount ?? 0}</strong>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[.025] p-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white/45"><Clock3 size={13} /> Reviewing</span>
                      <strong className="mt-1 block text-xl">{project.providersReviewing ?? 0}</strong>
                    </div>
                  </div>
                )}

                {project.loadState === 'unavailable' && (
                  <p className="mt-4 rounded-xl border border-[#f5c518]/15 bg-[#f5c518]/[.05] p-3 text-xs leading-5 text-white/55">
                    This saved project could not be refreshed. You can still try the secure dashboard link below.
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <span className="text-[11px] text-white/35">Created {formatDate(project.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => removeProject(project.id)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/35 hover:text-white/70"
                    aria-label={`Remove ${project.title} from this device`}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>

                <Link
                  href={customerProjectHref(project)}
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f5c518] px-4 text-sm font-black text-black"
                >
                  Open project dashboard <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
