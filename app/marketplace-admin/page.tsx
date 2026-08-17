'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Loader2,
  LockKeyhole,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRoundSearch,
  Wrench,
} from 'lucide-react';

type AdminProject = {
  id: string;
  title: string;
  customerDescription: string;
  category: string;
  urgency: string;
  serviceLevel: string;
  status: string;
  locationText: string;
  suburb: string | null;
  city: string | null;
  guestName: string | null;
  guestPhone: string | null;
  responseTargetAt: string | null;
  createdAt: string;
  invitationsSent: number;
  validResponsesReceived: number;
  manualDispatchPending: number;
};

type ProviderCandidate = {
  providerId: number;
  firstName: string;
  lastName: string;
  displayName: string;
  category: string;
  location: string;
  phone: string | null;
  imageUrl: string | null;
  verified: boolean;
  rating: number | null;
  claimed: boolean;
  availabilityStatus: string;
  acceptsEmergencyJobs: boolean;
  score: number;
  scoreReasons: string[];
  alreadyInvited: boolean;
};

type InvitationResult = {
  invitationId: string;
  providerId: number;
  responseToken: string;
  responseDeadline: string;
  deliveryChannel: string;
  deliveryAddress: string | null;
  responseUrl: string;
  deliveryStatus?: 'manual' | 'sent' | 'failed';
  externalMessageId?: string | null;
  deliveryReason?: string | null;
  manualSentAt?: string | null;
};

type NewProjectForm = {
  title: string;
  customerDescription: string;
  category: string;
  urgency: 'emergency' | 'urgent' | 'planned' | 'large_project';
  serviceLevel: 'free' | 'assisted' | 'priority' | 'managed';
  locationText: string;
  suburb: string;
  city: string;
  guestName: string;
  guestPhone: string;
};

type AdminScreen = 'create' | 'projects' | 'routing' | 'delivery';

const EMPTY_PROJECT: NewProjectForm = {
  title: '',
  customerDescription: '',
  category: 'Plumbers',
  urgency: 'planned',
  serviceLevel: 'assisted',
  locationText: '',
  suburb: '',
  city: '',
  guestName: '',
  guestPhone: '',
};

const CATEGORIES = [
  'Plumbers',
  'Electricians',
  'General Contractors',
  'Builders',
  'Painters',
  'Roofers',
  'Carpenters',
  'Tilers',
  'Welders',
];

const ADMIN_SCREENS: Array<{ id: AdminScreen; label: string; description: string }> = [
  { id: 'create', label: 'Create', description: 'Add a pilot job' },
  { id: 'projects', label: 'Projects', description: 'Open routing queue' },
  { id: 'routing', label: 'Routing', description: 'Ranked providers' },
  { id: 'delivery', label: 'Delivery', description: 'Manual WhatsApp sends' },
];

function formatDate(value: string | null): string {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function normaliseWhatsAppNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `27${digits.slice(1)}`;
  return digits;
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}.`);
  }
  return payload;
}

function deliverySummary(invitations: InvitationResult[]): string {
  const sentCount = invitations.filter((invitation) => invitation.deliveryStatus === 'sent').length;
  const failedCount = invitations.filter((invitation) => invitation.deliveryStatus === 'failed').length;
  const manualCount = invitations.length - sentCount - failedCount;

  return [
    sentCount ? `${sentCount} sent automatically` : '',
    manualCount ? `${manualCount} ready for manual WhatsApp delivery` : '',
    failedCount ? `${failedCount} failed and requires review` : '',
  ].filter(Boolean).join(' · ');
}

export default function MarketplaceAdminPage() {
  const [activeScreen, setActiveScreen] = useState<AdminScreen>('projects');
  const [adminKey, setAdminKey] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ProviderCandidate[]>([]);
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [invitationResults, setInvitationResults] = useState<InvitationResult[]>([]);
  const [newProject, setNewProject] = useState<NewProjectForm>(EMPTY_PROJECT);
  const [customerAccess, setCustomerAccess] = useState<{ projectId: string; accessToken: string } | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [preparingAutomatedWave, setPreparingAutomatedWave] = useState(false);
  const [markingSentIds, setMarkingSentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem('marketplaceAdminKey') ?? '';
    setAdminKey(saved);
    setKeyDraft(saved);
  }, []);

  const adminHeaders = useMemo(
    () => ({
      'x-marketplace-admin-key': adminKey,
      'Content-Type': 'application/json',
    }),
    [adminKey],
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const pendingDispatchCount = useMemo(
    () => projects.reduce((total, project) => total + project.manualDispatchPending, 0),
    [projects],
  );

  const activeScreenIndex = ADMIN_SCREENS.findIndex((screen) => screen.id === activeScreen);
  const previousScreen = ADMIN_SCREENS[Math.max(0, activeScreenIndex - 1)]?.id;
  const nextScreen = ADMIN_SCREENS[Math.min(ADMIN_SCREENS.length - 1, activeScreenIndex + 1)]?.id;

  const resetRoutingWorkspace = useCallback((message?: string) => {
    setSelectedProjectId(null);
    setCandidates([]);
    setSelectedProviderIds([]);
    setInvitationResults([]);
    setActiveScreen('projects');
    if (message) setNotice(message);
  }, []);

  const loadProjects = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!adminKey) return;
    if (!options.silent) {
      setLoadingProjects(true);
      setError(null);
    }

    try {
      const payload = await readJson(
        await fetch('/api/admin/projects', {
          headers: { 'x-marketplace-admin-key': adminKey },
          cache: 'no-store',
        }),
      );
      const nextProjects: AdminProject[] = payload.projects ?? [];
      setProjects(nextProjects);

      if (
        selectedProjectId &&
        !nextProjects.some((project) => project.id === selectedProjectId)
      ) {
        resetRoutingWorkspace(
          'Provider selected. The completed project was removed from the open routing queue and the matching workspace was reset.',
        );
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load projects.');
    } finally {
      if (!options.silent) setLoadingProjects(false);
    }
  }, [adminKey, resetRoutingWorkspace, selectedProjectId]);

  useEffect(() => {
    if (adminKey) void loadProjects();
  }, [adminKey, loadProjects]);

  useEffect(() => {
    if (!adminKey) return;

    const refreshOpenQueue = () => {
      if (document.visibilityState === 'visible') {
        void loadProjects({ silent: true });
      }
    };

    window.addEventListener('focus', refreshOpenQueue);
    document.addEventListener('visibilitychange', refreshOpenQueue);
    const timer = window.setInterval(refreshOpenQueue, 15000);

    return () => {
      window.removeEventListener('focus', refreshOpenQueue);
      document.removeEventListener('visibilitychange', refreshOpenQueue);
      window.clearInterval(timer);
    };
  }, [adminKey, loadProjects]);

  const unlock = () => {
    const clean = keyDraft.trim();
    if (!clean) {
      setError('Enter the Marketplace Admin API key stored in Vercel.');
      return;
    }
    window.sessionStorage.setItem('marketplaceAdminKey', clean);
    setAdminKey(clean);
    setError(null);
  };

  const lock = () => {
    window.sessionStorage.removeItem('marketplaceAdminKey');
    setAdminKey('');
    setKeyDraft('');
    setProjects([]);
    resetRoutingWorkspace();
  };

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreatingProject(true);
    setError(null);
    setNotice(null);

    try {
      const payload = await readJson(
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newProject,
            sourceChannel: 'admin',
            consentToShare: true,
            professionalInspectionRequired: true,
          }),
        }),
      );

      setCustomerAccess({
        projectId: payload.project.id,
        accessToken: payload.accessToken,
      });
      setSelectedProjectId(payload.project.id);
      setNewProject(EMPTY_PROJECT);
      setActiveScreen('routing');
      setNotice(
        payload.routing?.providersQueued
          ? 'Project created. Automated routing queued the first provider wave; prepare manual WhatsApp delivery from the routing screen.'
          : 'Project created. Its customer access token is displayed once on the Create screen.',
      );
      await loadProjects();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const loadCandidates = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveScreen('routing');
    setLoadingCandidates(true);
    setCandidates([]);
    setSelectedProviderIds([]);
    setInvitationResults([]);
    setError(null);

    try {
      const payload = await readJson(
        await fetch(`/api/projects/${projectId}/candidates`, {
          headers: { 'x-marketplace-admin-key': adminKey },
          cache: 'no-store',
        }),
      );

      if (payload.routingClosed) {
        setProjects((current) => current.filter((project) => project.id !== projectId));
        resetRoutingWorkspace(
          payload.routingReason
            ? `Routing complete. ${payload.routingReason} The matching workspace was reset.`
            : 'Routing complete. The project was removed from the open queue and the matching workspace was reset.',
        );
        return;
      }

      setCandidates(payload.candidates ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load candidates.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const toggleProvider = (providerId: number) => {
    setSelectedProviderIds((current) => {
      if (current.includes(providerId)) return current.filter((id) => id !== providerId);
      if (current.length >= 3) {
        setNotice('The pilot sends each manual override wave to a maximum of three providers.');
        return current;
      }
      return [...current, providerId];
    });
  };

  const prepareAutomatedWave = async () => {
    if (!selectedProjectId) return;
    setPreparingAutomatedWave(true);
    setError(null);
    setNotice(null);

    try {
      const payload = await readJson(
        await fetch(`/api/admin/projects/${selectedProjectId}/manual-dispatch`, {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({}),
        }),
      );

      const invitations: InvitationResult[] = payload.routing?.invitations ?? [];
      await loadProjects();
      await loadCandidates(selectedProjectId);
      setSelectedProviderIds([]);
      setInvitationResults(invitations);

      if (invitations.length === 0) {
        setNotice(payload.routing?.reason || 'No manual WhatsApp delivery is needed right now.');
        return;
      }

      setActiveScreen('delivery');
      setNotice(
        `${invitations.length} automated invitation${invitations.length === 1 ? '' : 's'} ready. ${deliverySummary(invitations)}.`,
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to prepare automated wave.');
    } finally {
      setPreparingAutomatedWave(false);
    }
  };

  const sendInvitations = async () => {
    if (!selectedProjectId || selectedProviderIds.length === 0) return;
    setSendingInvites(true);
    setError(null);
    setNotice(null);

    const selectedCandidates = candidates.filter((candidate) =>
      selectedProviderIds.includes(candidate.providerId),
    );

    try {
      const payload = await readJson(
        await fetch(`/api/projects/${selectedProjectId}/invitations`, {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({
            waveNumber: 1,
            targets: selectedCandidates.map((candidate) => ({
              providerId: candidate.providerId,
              deliveryChannel: candidate.phone ? 'whatsapp' : 'web',
              deliveryAddress: candidate.phone,
              providerSnapshot: {
                name: candidate.displayName,
                first_name: candidate.firstName,
                last_name: candidate.lastName,
                category: candidate.category,
                location: candidate.location,
                image_url: candidate.imageUrl,
                verified: candidate.verified,
                rating: candidate.rating,
              },
            })),
          }),
        }),
      );

      const invitations: InvitationResult[] = payload.invitations ?? [];
      await loadProjects();
      await loadCandidates(selectedProjectId);
      setInvitationResults(invitations);
      setActiveScreen('delivery');
      setNotice(
        `${invitations.length} invitation${invitations.length === 1 ? '' : 's'} prepared. ${deliverySummary(invitations)}.`,
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create invitations.');
    } finally {
      setSendingInvites(false);
    }
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setNotice('Copied to clipboard.');
  };

  const invitationMessage = (invitation: InvitationResult): string => {
    if (!selectedProject) return invitation.responseUrl;
    return [
      `New ${selectedProject.category} opportunity from Skills Connect Pro`,
      `Area: ${selectedProject.suburb || selectedProject.city || selectedProject.locationText}`,
      `Urgency: ${selectedProject.urgency}`,
      `Project: ${selectedProject.title}`,
      '',
      `View the project brief and respond securely: ${invitation.responseUrl}`,
    ].join('\n');
  };

  const markInvitationManuallySent = async (invitation: InvitationResult) => {
    if (markingSentIds.includes(invitation.invitationId)) return;
    setMarkingSentIds((current) => [...current, invitation.invitationId]);

    try {
      const payload = await readJson(
        await fetch(`/api/admin/invitations/${invitation.invitationId}/manual-sent`, {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({}),
        }),
      );

      setInvitationResults((current) =>
        current.map((item) =>
          item.invitationId === invitation.invitationId
            ? {
                ...item,
                deliveryStatus: 'sent',
                manualSentAt: payload.invitation?.sentAt ?? new Date().toISOString(),
              }
            : item,
        ),
      );
      await loadProjects({ silent: true });
      setNotice('Manual WhatsApp dispatch recorded. Confirm the message was sent in WhatsApp.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to record manual dispatch.');
    } finally {
      setMarkingSentIds((current) => current.filter((id) => id !== invitation.invitationId));
    }
  };

  const openWhatsAppInvitation = async (invitation: InvitationResult) => {
    if (!invitation.deliveryAddress) return;
    const number = normaliseWhatsAppNumber(invitation.deliveryAddress);
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(invitationMessage(invitation))}`,
      '_blank',
      'noopener,noreferrer',
    );
    await markInvitationManuallySent(invitation);
  };

  if (!adminKey) {
    return (
      <main className="min-h-screen bg-[#080d0b] px-5 py-16 text-white">
        <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-black">
            <LockKeyhole size={28} />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Pilot operations</p>
          <h1 className="mt-3 text-3xl font-black">Marketplace Admin</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Enter the Marketplace Admin API key. It remains in this browser tab&apos;s session storage and is not embedded in the website.
          </p>
          <label className="mt-7 block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Admin key
          </label>
          <input
            type="password"
            value={keyDraft}
            onChange={(event) => setKeyDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && unlock()}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm outline-none focus:border-amber-400"
            autoComplete="current-password"
          />
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <button
            type="button"
            onClick={unlock}
            className="mt-5 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-black"
          >
            Unlock console
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080d0b] px-4 py-5 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-amber-300">
              <ShieldCheck size={16} /> Pilot operations
            </div>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Marketplace Routing Console</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Work screen by screen: create the job, choose an open project, let routing rank providers, then manually dispatch WhatsApp links.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void loadProjects()}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:border-amber-400"
            >
              <RefreshCw size={15} className={loadingProjects ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={lock}
              className="rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              Lock
            </button>
          </div>
        </header>

        <section className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Open projects</p>
            <p className="mt-1 text-2xl font-black">{projects.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-200">WhatsApp pending</p>
            <p className="mt-1 text-2xl font-black">{pendingDispatchCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:col-span-2 xl:col-span-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Selected project</p>
            <p className="mt-1 truncate text-sm font-bold text-zinc-200">{selectedProject?.title ?? 'None selected'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Prepared links</p>
            <p className="mt-1 text-2xl font-black">{invitationResults.length}</p>
          </div>
        </section>

        <nav role="tablist" aria-label="Marketplace admin sections" className="mb-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
          {ADMIN_SCREENS.map((screen) => {
            const active = screen.id === activeScreen;
            return (
              <button
                key={screen.id}
                id={`admin-tab-${screen.id}`}
                role="tab"
                aria-selected={active}
                aria-controls={`admin-panel-${screen.id}`}
                onClick={() => setActiveScreen(screen.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active
                    ? 'border-amber-400 bg-amber-400 text-black'
                    : 'border-white/10 bg-white/[0.035] text-white hover:border-amber-400/60'
                }`}
              >
                <p className="text-sm font-black uppercase tracking-wider">{screen.label}</p>
                <p className={`mt-1 text-xs ${active ? 'text-black/70' : 'text-zinc-500'}`}>{screen.description}</p>
              </button>
            );
          })}
        </nav>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} /> {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> {notice}
          </div>
        )}

        <section
          id={`admin-panel-${activeScreen}`}
          role="tabpanel"
          aria-labelledby={`admin-tab-${activeScreen}`}
          className="min-h-[560px] rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl md:p-6"
        >
          {activeScreen === 'create' && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]">
              <form onSubmit={createProject} className="rounded-3xl border border-white/10 bg-black/20 p-4 md:p-5">
                <div className="mb-5 flex items-center gap-3">
                  <Wrench className="text-amber-300" size={20} />
                  <div>
                    <h2 className="text-lg font-black">Create pilot project</h2>
                    <p className="mt-1 text-xs text-zinc-500">This creates the project and lets backend routing start automatically.</p>
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <input
                    required
                    placeholder="Project title"
                    value={newProject.title}
                    onChange={(event) => setNewProject({ ...newProject, title: event.target.value })}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-amber-400 lg:col-span-2"
                  />
                  <textarea
                    required
                    placeholder="Describe the customer problem"
                    value={newProject.customerDescription}
                    onChange={(event) =>
                      setNewProject({ ...newProject, customerDescription: event.target.value })
                    }
                    className="min-h-32 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-amber-400 lg:col-span-2"
                  />
                  <select
                    value={newProject.category}
                    onChange={(event) => setNewProject({ ...newProject, category: event.target.value })}
                    className="rounded-xl border border-white/10 bg-[#101713] px-3 py-3 text-sm outline-none"
                  >
                    {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                  </select>
                  <select
                    value={newProject.urgency}
                    onChange={(event) =>
                      setNewProject({ ...newProject, urgency: event.target.value as NewProjectForm['urgency'] })
                    }
                    className="rounded-xl border border-white/10 bg-[#101713] px-3 py-3 text-sm outline-none"
                  >
                    <option value="emergency">Emergency</option>
                    <option value="urgent">Urgent</option>
                    <option value="planned">Planned</option>
                    <option value="large_project">Large project</option>
                  </select>
                  <input
                    required
                    placeholder="Location or area"
                    value={newProject.locationText}
                    onChange={(event) => setNewProject({ ...newProject, locationText: event.target.value })}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-amber-400 lg:col-span-2"
                  />
                  <input
                    placeholder="Suburb"
                    value={newProject.suburb}
                    onChange={(event) => setNewProject({ ...newProject, suburb: event.target.value })}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
                  />
                  <input
                    placeholder="City"
                    value={newProject.city}
                    onChange={(event) => setNewProject({ ...newProject, city: event.target.value })}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
                  />
                  <input
                    placeholder="Customer name"
                    value={newProject.guestName}
                    onChange={(event) => setNewProject({ ...newProject, guestName: event.target.value })}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
                  />
                  <input
                    placeholder="Customer phone"
                    value={newProject.guestPhone}
                    onChange={(event) => setNewProject({ ...newProject, guestPhone: event.target.value })}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
                  />
                </div>
                <button
                  disabled={creatingProject}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-black disabled:opacity-50"
                >
                  {creatingProject ? <Loader2 className="animate-spin" size={17} /> : <Wrench size={17} />}
                  Create project
                </button>
              </form>

              <aside className="space-y-4">
                {customerAccess ? (
                  <section className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-300">Shown once</p>
                    <h3 className="mt-2 font-black">Customer project access</h3>
                    <p className="mt-2 break-all font-mono text-xs text-zinc-300">{customerAccess.accessToken}</p>
                    <button
                      onClick={() => copyText(customerAccess.accessToken)}
                      className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200"
                    >
                      <Clipboard size={14} /> Copy token
                    </button>
                  </section>
                ) : (
                  <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-500">After submit</p>
                    <h3 className="mt-2 font-black">What happens next</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      The backend creates the project, checks consent, ranks eligible providers, and queues the first automated wave.
                    </p>
                  </section>
                )}
                <button
                  type="button"
                  onClick={() => setActiveScreen('projects')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                >
                  Go to projects <ChevronRight size={14} />
                </button>
              </aside>
            </div>
          )}

          {activeScreen === 'projects' && (
            <div className="flex h-full min-h-[520px] flex-col">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-black">Open projects</h2>
                  <p className="mt-1 text-sm text-zinc-500">Select one project to move into its routing screen.</p>
                </div>
                <button
                  onClick={() => void loadProjects()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                >
                  <RefreshCw size={14} className={loadingProjects ? 'animate-spin' : ''} /> Refresh queue
                </button>
              </div>

              {loadingProjects ? (
                <div className="flex flex-1 items-center justify-center"><Loader2 className="animate-spin text-amber-300" /></div>
              ) : projects.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <UserRoundSearch size={46} className="text-zinc-700" />
                  <h3 className="mt-4 font-black">No open marketplace projects yet</h3>
                  <button
                    onClick={() => setActiveScreen('create')}
                    className="mt-4 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-black"
                  >
                    Create first project
                  </button>
                </div>
              ) : (
                <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => void loadCandidates(project.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedProjectId === project.id
                          ? 'border-amber-400 bg-amber-400/10'
                          : project.manualDispatchPending > 0
                            ? 'border-amber-400/60 bg-amber-400/10'
                            : 'border-white/5 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold">{project.title}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                            <MapPin size={12} /> {project.suburb || project.city || project.locationText}
                          </p>
                        </div>
                        <ChevronRight size={17} className="shrink-0 text-zinc-500" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <span className="rounded bg-white/10 px-2 py-1">{project.category}</span>
                        <span className="rounded bg-white/10 px-2 py-1">{project.urgency}</span>
                        <span className="rounded bg-white/10 px-2 py-1">{project.status}</span>
                      </div>
                      <p className="mt-3 text-xs text-zinc-500">
                        {project.invitationsSent} invited · {project.validResponsesReceived} responses
                      </p>
                      {project.manualDispatchPending > 0 && (
                        <p className="mt-2 rounded-lg bg-amber-400/15 px-2 py-1 text-[11px] font-bold text-amber-200">
                          {project.manualDispatchPending} WhatsApp send{project.manualDispatchPending === 1 ? '' : 's'} pending
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeScreen === 'routing' && (
            <div className="min-h-[520px]">
              {!selectedProject ? (
                <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                  <UserRoundSearch size={50} className="text-zinc-700" />
                  <h2 className="mt-5 text-xl font-black">Select a project first</h2>
                  <p className="mt-2 max-w-md text-sm text-zinc-500">
                    Choose an open project so the routing panel can show ranked provider candidates.
                  </p>
                  <button
                    onClick={() => setActiveScreen('projects')}
                    className="mt-5 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-black"
                  >
                    Open project queue
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Selected project</p>
                        <h2 className="mt-2 text-2xl font-black">{selectedProject.title}</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{selectedProject.customerDescription}</p>
                        <p className="mt-3 text-xs text-zinc-500">Response target: {formatDate(selectedProject.responseTargetAt)}</p>
                        {selectedProject.manualDispatchPending > 0 && (
                          <p className="mt-3 inline-flex rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                            {selectedProject.manualDispatchPending} manual WhatsApp dispatch{selectedProject.manualDispatchPending === 1 ? '' : 'es'} pending
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
                        <button
                          onClick={() => void prepareAutomatedWave()}
                          disabled={preparingAutomatedWave}
                          className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
                        >
                          {preparingAutomatedWave ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                          Prepare automated wave
                        </button>
                        <button
                          onClick={() => void loadCandidates(selectedProject.id)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                        >
                          <RefreshCw size={14} /> Re-rank
                        </button>
                        <button
                          onClick={() => setActiveScreen('projects')}
                          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                        >
                          <ChevronLeft size={14} /> Projects
                        </button>
                        <button
                          onClick={() => setActiveScreen('delivery')}
                          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                        >
                          Delivery <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <h3 className="font-black">Ranked provider candidates</h3>
                      <p className="mt-1 text-xs text-zinc-500">Automated wave is primary. Manual selection is available as an admin override.</p>
                    </div>
                    <button
                      onClick={() => void sendInvitations()}
                      disabled={selectedProviderIds.length === 0 || sendingInvites}
                      className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 px-5 py-3 text-xs font-black uppercase tracking-wider text-amber-100 disabled:opacity-40"
                    >
                      {sendingInvites ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      Prepare selected override ({selectedProviderIds.length})
                    </button>
                  </div>

                  {loadingCandidates ? (
                    <div className="flex justify-center py-24"><Loader2 className="animate-spin text-amber-300" size={30} /></div>
                  ) : candidates.length === 0 ? (
                    <div className="py-20 text-center text-sm text-zinc-500">No candidates could be ranked from the current artisan records.</div>
                  ) : (
                    <div className="grid max-h-[46vh] gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
                      {candidates.map((candidate) => {
                        const selected = selectedProviderIds.includes(candidate.providerId);
                        return (
                          <button
                            key={candidate.providerId}
                            onClick={() => toggleProvider(candidate.providerId)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              selected ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-black/20 hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-black">{candidate.displayName}</h4>
                                  {candidate.verified && <ShieldCheck size={15} className="text-emerald-400" />}
                                </div>
                                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-amber-300">{candidate.category}</p>
                                <p className="mt-2 flex items-center gap-1 text-xs text-zinc-400"><MapPin size={12} /> {candidate.location}</p>
                              </div>
                              <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                                <p className="text-xl font-black">{candidate.score}</p>
                                <p className="text-[9px] uppercase tracking-wider text-zinc-500">score</p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {candidate.scoreReasons.slice(0, 4).map((reason) => (
                                <span key={reason} className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-zinc-400">{reason}</span>
                              ))}
                            </div>
                            <p className="mt-3 text-xs text-zinc-500">
                              {candidate.phone || 'No phone number'} · {candidate.availabilityStatus.replaceAll('_', ' ')}
                            </p>
                            {candidate.alreadyInvited && <p className="mt-2 text-xs font-bold text-amber-300">Already queued — automated handoff can refresh the secure delivery link</p>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeScreen === 'delivery' && (
            <div className="min-h-[520px]">
              {!selectedProject ? (
                <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                  <Send size={50} className="text-zinc-700" />
                  <h2 className="mt-5 text-xl font-black">No project selected</h2>
                  <p className="mt-2 max-w-md text-sm text-zinc-500">Select a project before preparing or dispatching WhatsApp links.</p>
                  <button
                    onClick={() => setActiveScreen('projects')}
                    className="mt-5 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-black"
                  >
                    Open project queue
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Invitation delivery</p>
                      <h2 className="mt-2 text-2xl font-black">{selectedProject.title}</h2>
                      <p className="mt-2 text-sm text-zinc-400">Open WhatsApp for each provider and tap Send. The console records the manual dispatch after opening WhatsApp.</p>
                    </div>
                    <button
                      onClick={() => void prepareAutomatedWave()}
                      disabled={preparingAutomatedWave}
                      className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
                    >
                      {preparingAutomatedWave ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                      Prepare automated wave
                    </button>
                  </div>

                  {invitationResults.length === 0 ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
                      <Send size={42} className="text-zinc-700" />
                      <h3 className="mt-4 font-black">No prepared delivery links on this screen</h3>
                      <p className="mt-2 max-w-md text-sm text-zinc-500">
                        Use Prepare automated wave to fetch the current automated provider wave and generate WhatsApp-ready links.
                      </p>
                      {selectedProject.manualDispatchPending > 0 && (
                        <p className="mt-3 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                          {selectedProject.manualDispatchPending} pending send{selectedProject.manualDispatchPending === 1 ? '' : 's'} already queued
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 xl:grid-cols-2">
                      {invitationResults.map((invitation) => {
                        const candidate = candidates.find((item) => item.providerId === invitation.providerId);
                        const markingSent = markingSentIds.includes(invitation.invitationId);
                        const manuallySent = invitation.deliveryStatus === 'sent' || Boolean(invitation.manualSentAt);
                        return (
                          <div key={invitation.invitationId} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold">{candidate?.displayName || `Provider #${invitation.providerId}`}</p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  Deadline: {formatDate(invitation.responseDeadline)}{manuallySent ? ' · sent recorded' : ''}
                                </p>
                              </div>
                              {manuallySent && <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />}
                            </div>
                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                              <a
                                href={invitation.responseUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/50 px-3 py-2 text-xs font-bold text-amber-200"
                              >
                                <ChevronRight size={14} /> Provider view
                              </a>
                              <button
                                onClick={() => void copyText(invitationMessage(invitation))}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold"
                              >
                                <Clipboard size={14} /> Copy
                              </button>
                              {invitation.deliveryAddress && (
                                <button
                                  onClick={() => void openWhatsAppInvitation(invitation)}
                                  disabled={markingSent || manuallySent}
                                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white disabled:opacity-70 ${manuallySent ? 'bg-emerald-700' : 'bg-[#128C7E]'}`}
                                >
                                  {markingSent ? (
                                    <Loader2 className="animate-spin" size={14} />
                                  ) : manuallySent ? (
                                    <CheckCircle2 size={14} />
                                  ) : (
                                    <Send size={14} />
                                  )}
                                  {manuallySent ? 'Sent' : 'WhatsApp'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={activeScreenIndex <= 0}
            onClick={() => previousScreen && setActiveScreen(previousScreen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-300 disabled:opacity-30"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button
            type="button"
            disabled={activeScreenIndex >= ADMIN_SCREENS.length - 1}
            onClick={() => nextScreen && setActiveScreen(nextScreen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-300 disabled:opacity-30"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </main>
  );
}
