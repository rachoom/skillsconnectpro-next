'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
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

export default function MarketplaceAdminPage() {
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

  const resetRoutingWorkspace = useCallback((message?: string) => {
    setSelectedProjectId(null);
    setCandidates([]);
    setSelectedProviderIds([]);
    setInvitationResults([]);
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
      setNotice('Project created. Its customer access token is displayed once below.');
      await loadProjects();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const loadCandidates = async (projectId: string) => {
    setSelectedProjectId(projectId);
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
        setNotice('The pilot sends each first wave to a maximum of three providers.');
        return current;
      }
      return [...current, providerId];
    });
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
      setNotice(
        `${invitations.length} invitation${invitations.length === 1 ? '' : 's'} queued. Preview each provider view, copy the prepared message or open WhatsApp below.`,
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

  const openWhatsAppInvitation = (invitation: InvitationResult) => {
    if (!invitation.deliveryAddress) return;
    const number = normaliseWhatsAppNumber(invitation.deliveryAddress);
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(invitationMessage(invitation))}`,
      '_blank',
      'noopener,noreferrer',
    );
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
    <main className="min-h-screen bg-[#080d0b] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-amber-300">
              <ShieldCheck size={16} /> Pilot operations
            </div>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Marketplace Routing Console</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Create structured projects, rank registered providers and issue the first controlled invitation wave.
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

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} /> {error}
          </div>
        )}
        {notice && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> {notice}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <form onSubmit={createProject} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-5 flex items-center gap-3">
                <Wrench className="text-amber-300" size={20} />
                <h2 className="text-lg font-black">Create pilot project</h2>
              </div>
              <div className="space-y-3">
                <input
                  required
                  placeholder="Project title"
                  value={newProject.title}
                  onChange={(event) => setNewProject({ ...newProject, title: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-amber-400"
                />
                <textarea
                  required
                  placeholder="Describe the customer problem"
                  value={newProject.customerDescription}
                  onChange={(event) =>
                    setNewProject({ ...newProject, customerDescription: event.target.value })
                  }
                  className="min-h-28 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-amber-400"
                />
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <input
                  required
                  placeholder="Location or area"
                  value={newProject.locationText}
                  onChange={(event) => setNewProject({ ...newProject, locationText: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-amber-400"
                />
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div className="grid grid-cols-2 gap-3">
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
              </div>
              <button
                disabled={creatingProject}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-black disabled:opacity-50"
              >
                {creatingProject ? <Loader2 className="animate-spin" size={17} /> : <Wrench size={17} />}
                Create project
              </button>
            </form>

            {customerAccess && (
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
            )}

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-black">Open projects</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">{projects.length}</span>
              </div>
              {loadingProjects ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-300" /></div>
              ) : projects.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">No open marketplace projects yet.</p>
              ) : (
                <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => void loadCandidates(project.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedProjectId === project.id
                          ? 'border-amber-400 bg-amber-400/10'
                          : 'border-white/5 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{project.title}</p>
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
                    </button>
                  ))}
                </div>
              )}
            </section>
          </aside>

          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-7">
            {!selectedProject ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <UserRoundSearch size={50} className="text-zinc-700" />
                <h2 className="mt-5 text-xl font-black">Select or create a project</h2>
                <p className="mt-2 max-w-md text-sm text-zinc-500">
                  The routing engine will rank registered providers using trade, location, availability, verification and response history.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-white/10 pb-6">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Selected project</p>
                      <h2 className="mt-2 text-2xl font-black">{selectedProject.title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{selectedProject.customerDescription}</p>
                      <p className="mt-3 text-xs text-zinc-500">Response target: {formatDate(selectedProject.responseTargetAt)}</p>
                    </div>
                    <button
                      onClick={() => void loadCandidates(selectedProject.id)}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                    >
                      <RefreshCw size={14} /> Re-rank
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h3 className="font-black">Provider candidates</h3>
                    <p className="mt-1 text-xs text-zinc-500">Choose up to three providers. Selecting an already queued provider safely refreshes their unanswered delivery link.</p>
                  </div>
                  <button
                    onClick={() => void sendInvitations()}
                    disabled={selectedProviderIds.length === 0 || sendingInvites}
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-40"
                  >
                    {sendingInvites ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    Prepare selected ({selectedProviderIds.length})
                  </button>
                </div>

                {loadingCandidates ? (
                  <div className="flex justify-center py-24"><Loader2 className="animate-spin text-amber-300" size={30} /></div>
                ) : (
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
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
                            <div>
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
                          {candidate.alreadyInvited && <p className="mt-2 text-xs font-bold text-amber-300">Already queued — select to refresh the secure delivery link</p>}
                        </button>
                      );
                    })}
                    {candidates.length === 0 && (
                      <div className="col-span-full py-20 text-center text-sm text-zinc-500">No candidates could be ranked from the current artisan records.</div>
                    )}
                  </div>
                )}

                {invitationResults.length > 0 && (
                  <section className="mt-8 border-t border-white/10 pt-6">
                    <h3 className="font-black">Invitation delivery</h3>
                    <p className="mt-1 text-xs text-zinc-500">Invitation records exist in Supabase. Deliver each secure response link through WhatsApp or copy it.</p>
                    <div className="mt-4 space-y-3">
                      {invitationResults.map((invitation) => {
                        const candidate = candidates.find((item) => item.providerId === invitation.providerId);
                        return (
                          <div key={invitation.invitationId} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-bold">{candidate?.displayName || `Provider #${invitation.providerId}`}</p>
                              <p className="mt-1 text-xs text-zinc-500">Deadline: {formatDate(invitation.responseDeadline)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={invitation.responseUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 rounded-xl border border-amber-400/50 px-3 py-2 text-xs font-bold text-amber-200"
                              >
                                <ChevronRight size={14} /> Provider view
                              </a>
                              <button
                                onClick={() => void copyText(invitationMessage(invitation))}
                                className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold"
                              >
                                <Clipboard size={14} /> Copy message
                              </button>
                              {invitation.deliveryAddress && (
                                <button
                                  onClick={() => openWhatsAppInvitation(invitation)}
                                  className="flex items-center gap-2 rounded-xl bg-[#128C7E] px-3 py-2 text-xs font-bold text-white"
                                >
                                  <Send size={14} /> Open WhatsApp
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
