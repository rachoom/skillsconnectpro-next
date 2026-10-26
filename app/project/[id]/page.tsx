'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  UserRoundCheck,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import styles from './project-overview.module.css';

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
    media: Array<{ path: string; url?: string; type: string; alt?: string; createdAt?: string }>;
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

function responseTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    available_now: 'Available now',
    available_today: 'Available later today',
    available_tomorrow: 'Available tomorrow',
    available_this_week: 'Available later this week',
    available_next_week: 'Available next week',
    site_visit: 'Wants to inspect the job first',
    estimate: 'Provided a preliminary estimate',
    need_information: 'Needs more information',
    declined: 'Cannot assist with this job',
  };
  return labels[value] ?? value.replaceAll('_', ' ');
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

// Safe demonstration data. The public preview has no project credentials,
// provider contact information, API requests or write capabilities.
const PREVIEW_FEED: ProjectFeed = {
  project: {
    id: 'demo-customer-project',
    guestName: 'Sample Customer',
    title: 'Kitchen tap leaking — Plumbing',
    customerDescription: 'Water is leaking continuously from the kitchen tap. The customer needs a plumber to inspect the fitting and complete the repair.',
    category: 'Plumbing', urgency: 'urgent', serviceLevel: 'standard',
    status: 'contact_released', locationText: 'Benoni', suburb: 'Benoni', city: 'Ekurhuleni',
    responseTargetAt: '2026-10-26T10:00:00+02:00', estimatedMin: null, estimatedMax: null,
    estimateCurrency: 'ZAR', safetyNotes: [], createdAt: '2026-10-26T09:30:00+02:00', media: [],
  },
  matching: {
    invitationsSent: 6,
    invitationCounts: { sent: 5, responded: 1 },
    validResponsesReceived: 1,
    providersReviewing: 0,
  },
  responses: [{
    id: 'demo-provider-response', providerId: 0,
    provider: { name: 'Demo Plumbing Services', category: 'Plumber', location: 'Benoni', is_verified: true, rating: 5 },
    responseType: 'site_visit', arrivalWindowStart: null, arrivalWindowEnd: null,
    siteVisitFee: 100, estimateMin: 300, estimateMax: 800, estimateCurrency: 'ZAR',
    providerMessage: 'I can assess the tap and confirm the repair cost after inspection.',
    validUntil: null, createdAt: '2026-10-26T09:40:00+02:00',
  }],
  match: {
    id: 'demo-match', providerId: 0, providerResponseId: 'demo-provider-response',
    status: 'contact_released', selectedAt: '2026-10-26T09:44:00+02:00',
    contactReleasedAt: '2026-10-26T09:45:00+02:00',
  },
  releasedContact: { provider: { id: 0, name: 'Demo Plumbing Services', phone: null, whatsapp: null, email: null } },
  timeline: [
    { id: 1, eventType: 'project_created', message: 'The customer submitted the request.', createdAt: '2026-10-26T09:30:00+02:00' },
    { id: 2, eventType: 'provider_invited', message: 'Local plumbing providers were invited.', createdAt: '2026-10-26T09:34:00+02:00' },
    { id: 3, eventType: 'provider_responded', message: 'A service provider responded.', createdAt: '2026-10-26T09:40:00+02:00' },
    { id: 4, eventType: 'contact_released', message: 'The customer confirmed their provider connection.', createdAt: '2026-10-26T09:45:00+02:00' },
  ],
};

export function CustomerProjectExperience({ preview = false }: { preview?: boolean }) {
  const params = useParams<{ id: string }>();
  const projectId = preview ? 'demo-customer-project' : params.id;
  const [accessToken, setAccessToken] = useState('');
  const [feed, setFeed] = useState<ProjectFeed | null>(preview ? PREVIEW_FEED : null);
  const [loading, setLoading] = useState(!preview);
  const [selectingResponseId, setSelectingResponseId] = useState<string | null>(null);
  const [releasingContact, setReleasingContact] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [demoControlsOpen, setDemoControlsOpen] = useState(false);
  const [demoControlAction, setDemoControlAction] = useState('');

  useEffect(() => {
    if (preview) return;
    const initialisation = window.setTimeout(() => {
      const token = new URLSearchParams(window.location.search).get('token') ?? '';
      setAccessToken(token);
      if (!token) {
        setError('This project link is missing its secure access token.');
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(initialisation);
  }, [preview]);

  const loadFeed = useCallback(async (quiet = false) => {
    if (preview || !projectId || !accessToken) return;
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
  }, [accessToken, projectId, preview]);

  useEffect(() => {
    if (preview || !accessToken) return;
    const initialLoad = window.setTimeout(() => void loadFeed(), 0);
    const interval = window.setInterval(() => void loadFeed(true), 15000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [accessToken, loadFeed, preview]);

  const selectedResponseId = feed?.match?.providerResponseId ?? null;
  const selectedResponse = useMemo(
    () => feed?.responses.find((response) => response.id === selectedResponseId) ?? null,
    [feed, selectedResponseId],
  );
  const contactsReleased = Boolean(
    feed?.project.status &&
    !['completed', 'cancelled', 'unfulfilled'].includes(feed.project.status) &&
    feed?.match?.contactReleasedAt &&
    feed?.releasedContact?.provider,
  );

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

  const cancelRequest = async () => {
    setCancellingRequest(true);
    setError(null);

    try {
      await readJson(
        await fetch(`/api/projects/${projectId}/lifecycle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-project-access-token': accessToken,
          },
          body: JSON.stringify({ action: 'cancel_project' }),
        }),
      );
      setShowCancelConfirm(false);
      await loadFeed(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to cancel this request.');
    } finally {
      setCancellingRequest(false);
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

  const openJobControls = () => {
    if (preview) {
      setDemoControlsOpen(true);
      window.setTimeout(() => {
        document.getElementById('job-status-controls')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }
    // The lifecycle host can remount controls that were not yet loaded when
    // contact details were first released, then scroll and focus the panel.
    window.dispatchEvent(new Event('marketplace-open-job-controls'));
  };

  const openProviderResponses = () => {
    document.getElementById('provider-responses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingIcon}><Loader2 className="animate-spin" size={30} /></div>
          <strong>Opening your project</strong>
          <p>Preparing the latest provider activity…</p>
        </div>
      </main>
    );
  }

  if (error && !feed) {
    return (
      <main className={styles.loadingPage}>
        <section className={styles.errorCard}>
          <AlertTriangle size={34} />
          <h1>Project unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!feed) return null;
  const project = feed.project;
  const responseCount = feed.matching.validResponsesReceived;
  const hasResponses = responseCount > 0;
  const hasSelection = Boolean(feed.match?.providerResponseId);
  const projectClosed = ['completed', 'cancelled', 'unfulfilled'].includes(project.status);
  const releasedProvider = projectClosed ? null : feed.releasedContact?.provider ?? null;
  const selectedName = selectedResponse ? providerName(selectedResponse.provider) : 'the selected provider';
  const whatsappHref = releasedProvider?.whatsapp
    ? `https://wa.me/${whatsappNumber(releasedProvider.whatsapp)}?text=${encodeURIComponent(
        `Hi ${releasedProvider.name}, I selected you through Skills Connect Pro for my project: ${project.title}.`,
      )}`
    : null;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {preview && (
          <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D3A826] bg-[#272219] px-4 py-3 text-xs font-bold text-[#FFE9A3]">
            <span>INTERACTIVE CUSTOMER DASHBOARD PREVIEW</span>
            <span>Sample project · No real actions</span>
          </div>
        )}
        <div className={styles.overviewBar}>
          <div>
            <span>Customer workspace</span>
            <strong>Project Overview</strong>
          </div>
          <div className={styles.liveState}><i /> {preview ? 'Design preview' : 'Live updates'}</div>
        </div>

        <header className={styles.projectHero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroEyebrow}>
                <span><ShieldCheck size={17} /></span>
                Ongoing project
              </div>
              <h1>{project.title}</h1>
              <p>{project.customerDescription}</p>

              {project.media?.some((item) => item.url) && (
                <figure style={{ margin: '1.25rem 0 0', border: '1px solid rgba(255,255,255,.15)', borderRadius: '1rem', padding: '.75rem', background: 'rgba(0,0,0,.16)' }}>
                  <figcaption style={{ marginBottom: '.6rem', fontSize: '.7rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .72 }}>
                    Uploaded reference image
                  </figcaption>
                  {project.media.filter((item) => item.url).map((item) => (
                    <img
                      key={item.path}
                      src={item.url}
                      alt={item.alt || 'Uploaded project reference'}
                      loading="lazy"
                      style={{ display: 'block', width: '100%', maxHeight: '28rem', objectFit: 'contain', borderRadius: '.75rem', background: '#111' }}
                    />
                  ))}
                </figure>
              )}

              <div className={styles.projectMeta}>
                <span>{project.category}</span>
                <span>{project.urgency}</span>
                <span>{project.status.replaceAll('_', ' ')}</span>
                <span><MapPin size={13} /> {project.suburb || project.city || project.locationText}</span>
              </div>

              <div className={styles.heroFoot}>
                <span>Created {formatDate(project.createdAt)}</span>
                {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString('en-ZA')}</span>}
              </div>
            </div>

            <aside
              className={`${styles.matchingPanel} ${hasResponses ? styles.matchingReady : styles.matchingSearching}`}
              aria-live="polite"
            >
              <div className={styles.matchingOrb}>
                <i className={styles.matchingSpinner} aria-hidden="true" />
                <span>{hasResponses ? <CheckCircle2 size={25} /> : <UsersRound size={26} strokeWidth={1.9} />}</span>
              </div>
              <p className={styles.matchingKicker}>{projectClosed ? 'Project closed' : hasResponses ? 'Response ready' : 'Matching in progress'}</p>
              <strong>
                {projectClosed
                  ? project.status === 'completed' ? 'Project completed' : project.status === 'cancelled' ? 'Project cancelled' : 'Project closed'
                  : hasResponses
                    ? `${responseCount} provider response${responseCount === 1 ? '' : 's'} ready`
                    : feed.matching.invitationsSent > 0
                      ? `${feed.matching.invitationsSent} provider${feed.matching.invitationsSent === 1 ? '' : 's'} contacted`
                      : 'Finding suitable providers'}
              </strong>
              <p className={styles.matchingCopy}>
                {projectClosed
                  ? 'No further provider selection or contact sharing is available for this project. Previous activity remains visible below.'
                  : hasResponses
                    ? 'A provider has replied. Compare the response below and choose when you are ready.'
                    : feed.matching.providersReviewing > 0
                      ? `${feed.matching.providersReviewing} provider${feed.matching.providersReviewing === 1 ? ' is' : 's are'} reviewing your request now.`
                      : 'We are contacting suitable local providers. This page updates automatically.'}
              </p>

              {!projectClosed && !hasResponses && (
                <>
                  <div className={styles.matchingProgress} aria-hidden="true"><span /></div>
                  <div className={styles.matchingActivity}>
                    <span className={styles.activityDot} /><span className={styles.activityDot} /><span className={styles.activityDot} />
                    <em>Working in the background</em>
                  </div>
                </>
              )}

              {!projectClosed && hasResponses && !hasSelection ? (
                <button type="button" onClick={openProviderResponses} className={`${styles.refreshButton} ${styles.reviewResponsesButton}`}>
                  <CheckCircle2 size={16} /> Review {responseCount} response{responseCount === 1 ? '' : 's'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" onClick={() => void loadFeed()} disabled={preview} className={styles.refreshButton}>
                    <RefreshCw size={15} /> Refresh now
                  </button>
                  {!projectClosed && !hasSelection && (
                    <button type="button" onClick={() => setShowCancelConfirm(true)} className={styles.refreshButton}>
                      <X size={15} /> Cancel request
                    </button>
                  )}
                </div>
              )}
            </aside>
          </div>
        </header>

        {error && (
          <div className={styles.inlineError}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <section className={styles.metricsGrid} aria-label="Project matching status">
          <article className={styles.metricCard}>
            <div className={styles.metricTop}><span className={styles.metricIcon}><UsersRound size={20} strokeWidth={1.9} /></span><small>01</small></div>
            <strong key={`invited-${feed.matching.invitationsSent}`} className={styles.metricValue}>{feed.matching.invitationsSent}</strong>
            <h2>Providers invited</h2>
            <p>Invitations sent to suitable local providers.</p>
          </article>
          <article className={`${styles.metricCard} ${feed.matching.providersReviewing > 0 && !hasResponses ? styles.metricReviewing : ''}`}>
            <div className={styles.metricTop}><span className={styles.metricIcon}><Clock3 size={20} strokeWidth={1.9} /></span><small>02</small></div>
            <strong key={`reviewing-${feed.matching.providersReviewing}`} className={styles.metricValue}>{feed.matching.providersReviewing}</strong>
            <h2>Currently reviewing</h2>
            <p>Providers actively considering your project.</p>
          </article>
          <article className={`${styles.metricCard} ${styles.metricSuccess} ${hasResponses && !hasSelection ? styles.metricResponseReady : ''}`}>
            <div className={styles.metricTop}><span className={styles.metricIcon}><MessagesSquare size={20} strokeWidth={1.9} /></span><small>03</small></div>
            <strong key={`responses-${feed.matching.validResponsesReceived}`} className={styles.metricValue}>{feed.matching.validResponsesReceived}</strong>
            <h2>Responses received</h2>
            <p>Provider options ready for you to compare.</p>
          </article>
        </section>

        {selectedResponse && !contactsReleased && !projectClosed && (
          <section className={`${styles.actionCard} ${styles.actionSelected} ${styles.actionNeedsAttention}`}>
            <div className={styles.actionIcon}><UserRoundCheck size={27} /></div>
            <div className={styles.actionCopy}>
              <span>Provider selected · Next step</span>
              <h2>{selectedName}</h2>
              <p>
                Confirm this provider to exchange contact details. Job-status controls become available immediately after you connect.
              </p>
            </div>
            <button onClick={() => setShowReleaseConfirm(true)} className={`${styles.primaryAction} ${styles.primaryAttention}`}>
              <LockKeyhole size={16} /> Confirm & connect
            </button>
          </section>
        )}

        {contactsReleased && releasedProvider && (
          <>
            <section className={`${styles.actionCard} ${styles.actionConnected}`}>
              <div className={styles.actionIcon}><CheckCircle2 size={28} strokeWidth={1.9} /></div>
              <div className={styles.actionCopy}>
                <span>You are connected</span>
                <h2>{releasedProvider.name}</h2>
                <p>You can now call or WhatsApp your provider. Your contact details are shared only with the two of you.</p>
                <div className={styles.contactActions}>
                  {preview && <><button type="button" disabled className={styles.callButton}><Phone size={19} aria-hidden="true" /> Call provider · Demo</button><button type="button" disabled className={styles.whatsappButton}><MessageCircle size={19} aria-hidden="true" /> WhatsApp provider · Demo</button></>}
                  {releasedProvider.phone && (
                    <a href={`tel:${releasedProvider.phone}`} className={styles.callButton}>
                      <Phone size={19} strokeWidth={2} aria-hidden="true" /> Call {releasedProvider.phone}
                    </a>
                  )}
                  {whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.whatsappButton}>
                      <MessageCircle size={19} strokeWidth={2} aria-hidden="true" /> WhatsApp provider
                    </a>
                  )}
                </div>
                {releasedProvider.email && <small>Email: {releasedProvider.email}</small>}
                <div className={styles.connectionNextHint}>
                  <span className={styles.connectionNextIcon}><ClipboardCheck size={20} strokeWidth={2} aria-hidden="true" /></span>
                  <span><strong>What happens next?</strong> Manage your project below to track the work, confirm completion or report a problem.</span>
                  <ArrowRight size={19} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
            </section>

            <section id="manage-project-next-step" aria-label="Next step: manage your project" className={`${styles.actionCard} ${styles.jobControlsCard}`}>
              <div className={styles.actionIcon}><ClipboardCheck size={27} strokeWidth={1.9} aria-hidden="true" /></div>
              <div className={styles.actionCopy}>
                <span>Next step · You're connected</span>
                <h2>Manage your project here</h2>
                <p>Stay in control from start to finish. Track the job, confirm when work is complete, or report a problem.</p>
                <div className={styles.controlsFeatures} aria-label="Project management options">
                  <span><CheckCircle2 size={15} aria-hidden="true" /> Job progress</span>
                  <span><ClipboardCheck size={15} aria-hidden="true" /> Confirm completion</span>
                  <span><ShieldCheck size={15} aria-hidden="true" /> Report an issue</span>
                </div>
              </div>
              <button type="button" onClick={openJobControls} aria-controls="job-status-controls" className={`${styles.primaryAction} ${styles.manageProjectAction}`}>
                <ClipboardCheck size={19} strokeWidth={2} aria-hidden="true" />
                Open project controls
                <ArrowRight size={19} strokeWidth={2.1} aria-hidden="true" />
              </button>
            </section>
          </>
        )}

        <section id="provider-responses" className={styles.responsesSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span>Rolling responses</span>
              <h2>Available provider options</h2>
              <p>Compare real responses as suitable providers reply to your project.</p>
            </div>
            <div className={styles.responseTarget}>
              <Clock3 size={15} />
              <span>Response target</span>
              <strong>{formatDate(project.responseTargetAt)}</strong>
            </div>
          </div>

          {feed.responses.length > 0 && !hasSelection && (
            <div className={styles.responseAlert} role="status">
              <span className={styles.responseAlertIcon}><CheckCircle2 size={18} /></span>
              <div>
                <strong>Provider response received</strong>
                <span>Compare the details below, then select the provider you want to connect with.</span>
              </div>
            </div>
          )}

          {feed.responses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyVisual}>
                <span><Wrench size={28} /></span>
                <i />
              </div>
              <span>Live matching</span>
              <h3>Providers are being contacted</h3>
              <p>
                Responses will appear here as providers confirm availability. You do not need to keep refreshing — this page updates every 15 seconds.
              </p>
              <div className={styles.searchingStatus} aria-hidden="true">
                <span /><span /><span /><em>Searching · contacting · listening for replies</em>
              </div>
              <div className={styles.emptySteps}>
                <span><b>1</b> Request shared</span>
                <span><b>2</b> Providers reviewing</span>
                <span><b>3</b> Responses arrive here</span>
              </div>
            </div>
          ) : (
            <div className={styles.providerGrid}>
              {feed.responses.map((response, index) => {
                const name = providerName(response.provider);
                const category = providerString(response.provider, 'category');
                const location = providerString(response.provider, 'location');
                const verified = response.provider.verified === true;
                const rating = providerNumber(response.provider, 'rating');
                const selected = response.id === selectedResponseId;
                const showSiteVisitFee = response.responseType === 'site_visit' || response.siteVisitFee !== null;
                const hasEstimate = response.estimateMin !== null || response.estimateMax !== null;

                return (
                  <article key={response.id} className={`${styles.providerCard} ${selected ? styles.providerSelected : ''} ${!hasSelection && index === 0 ? styles.providerAttention : ''}`}>
                    <div className={styles.providerHeader}>
                      <div>
                        <div className={styles.providerNameRow}>
                          <h3>{name}</h3>
                          {verified && <ShieldCheck size={17} />}
                        </div>
                        <p className={styles.providerCategory}>{category || 'Service provider'}</p>
                        {location && <p className={styles.providerLocation}><MapPin size={12} /> {location}</p>}
                      </div>
                      {rating !== null && rating > 0 ? (
                        <span className={styles.ratingPill}><Star size={12} /> {rating.toFixed(1)}</span>
                      ) : (
                        <span className={styles.newPill}>New provider</span>
                      )}
                    </div>

                    <div className={styles.providerDetailGrid}>
                      <div>
                        <span>Provider response</span>
                        <strong>{responseTypeLabel(response.responseType)}</strong>
                      </div>
                      {showSiteVisitFee && (
                        <div>
                          <span>Site visit fee</span>
                          <strong>
                            {response.siteVisitFee === null
                              ? 'No fee supplied'
                              : formatMoney(response.siteVisitFee, response.estimateCurrency)}
                          </strong>
                        </div>
                      )}
                    </div>

                    {hasEstimate && (
                      <div className={styles.providerInfoPanel}>
                        <span>Estimated job price</span>
                        <strong>
                          {formatMoney(response.estimateMin, response.estimateCurrency)} – {formatMoney(response.estimateMax, response.estimateCurrency)}
                        </strong>
                        <p>Preliminary estimate only. Final price may change after inspection and agreement.</p>
                      </div>
                    )}

                    {response.arrivalWindowStart && (
                      <div className={styles.providerInfoPanel}>
                        <span>Available to arrive</span>
                        <strong>
                          {formatDate(response.arrivalWindowStart)}
                          {response.arrivalWindowEnd ? ` – ${formatDate(response.arrivalWindowEnd)}` : ''}
                        </strong>
                      </div>
                    )}

                    {response.providerMessage && (
                      <div className={styles.providerMessage}>
                        <span>Message from provider</span>
                        <p>“{response.providerMessage}”</p>
                      </div>
                    )}

                    <button
                      disabled={projectClosed || contactsReleased || selected || selectingResponseId !== null}
                      onClick={() => void selectProvider(response.id)}
                      className={`${styles.selectProviderButton} ${!hasSelection && index === 0 ? styles.selectProviderAttention : ''}`}
                    >
                      {selectingResponseId === response.id ? <Loader2 className="animate-spin" size={16} /> : selected ? <CheckCircle2 size={16} /> : <UserRoundCheck size={16} />}
                      {projectClosed ? 'Project closed' : selected ? (contactsReleased ? 'Connected' : 'Selected') : contactsReleased ? 'Selection closed' : 'Select provider'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.activityCard}>
          <div className={styles.activityHeading}>
            <div>
              <span>Project activity</span>
              <h2>Your project journey</h2>
              <small>{feed.timeline.length} update{feed.timeline.length === 1 ? '' : 's'} recorded</small>
            </div>
            <button
              type="button"
              className={styles.activityToggle}
              onClick={() => setJourneyOpen((open) => !open)}
              aria-expanded={journeyOpen}
              aria-controls="project-journey-timeline"
            >
              {journeyOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              {journeyOpen ? 'Hide activity' : 'Show activity'}
            </button>
          </div>

          {journeyOpen && (
            <div id="project-journey-timeline">
              {feed.timeline.length > 0 ? (
                <div className={styles.timeline}>
                  {feed.timeline.map((event, index) => (
                    <div key={event.id} className={styles.timelineItem}>
                      <div className={styles.timelineMarker}>
                        <span>{index + 1}</span>
                      </div>
                      <div>
                        <p>{event.eventType.replaceAll('_', ' ')}</p>
                        {event.message && <small>{event.message}</small>}
                        <time>{formatDate(event.createdAt)}</time>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.timelineEmpty}>Project activity will appear here as the request progresses.</div>
              )}
            </div>
          )}
        </section>
        {preview && demoControlsOpen && (
          <section id="job-status-controls" className="mt-5 scroll-mt-20 rounded-3xl border-2 border-[#E6C34A] bg-[#151712] p-5 text-[#F5F4EB] shadow-lg sm:p-7" aria-label="Preview job controls">
            <div className="flex items-center gap-3"><span className="rounded-xl border border-[#E6C34A]/30 bg-[#E6C34A]/10 p-3 text-[#F5C518]"><ClipboardCheck size={26} /></span><div><span className="text-xs font-bold uppercase tracking-widest text-[#F5C518]">Example controls · No changes saved</span><h2 className="mt-1 text-2xl font-extrabold">Manage your job</h2></div></div>
            <p className="mt-4 text-sm leading-6 text-[#D2D2C8]">This is a safe preview of the actions available once you are connected to a provider.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {['Mark work started', 'Confirm job completed', 'Report a problem'].map(action => <button key={action} type="button" onClick={() => setDemoControlAction(action)} className="min-h-14 rounded-xl border border-[#BBA34D]/60 bg-[#292818] px-4 py-3 text-sm font-bold text-[#FFE79A] hover:bg-[#40391B]">{action}</button>)}
            </div>
            {demoControlAction && <p role="status" className="mt-4 rounded-xl border border-[#E6C34A]/30 bg-[#E6C34A]/10 px-4 py-3 text-sm"><strong>{demoControlAction}</strong> — preview only. The actual controls request confirmation and save the update to the project.</p>}
          </section>
        )}
      </div>

      {showCancelConfirm && !projectClosed && !hasSelection && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <span>Cancel request</span>
                <h2>Stop looking for providers?</h2>
              </div>
              <button onClick={() => setShowCancelConfirm(false)} aria-label="Close cancellation confirmation"><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              This will close the project request and stop any further provider matching, retries or invitation waves. Providers who already received an invitation will no longer be able to respond to this request.
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowCancelConfirm(false)} className={styles.secondaryModalAction}>Keep request open</button>
              <button disabled={cancellingRequest} onClick={() => void cancelRequest()} className={styles.primaryAction}>
                {cancellingRequest ? <Loader2 className="animate-spin" size={17} /> : <X size={17} />}
                Cancel request
              </button>
            </div>
          </section>
        </div>
      )}

      {showReleaseConfirm && selectedResponse && !projectClosed && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <span>Final confirmation</span>
                <h2>Connect with {selectedName}?</h2>
              </div>
              <button onClick={() => setShowReleaseConfirm(false)} aria-label="Close confirmation"><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              Skills Connect Pro will share your name, phone number and project location only with this provider. Their phone and WhatsApp details will then appear on this page. Other provider invitations will be closed, and your job-status controls will become available.
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowReleaseConfirm(false)} className={styles.secondaryModalAction}>Not yet</button>
              <button disabled={releasingContact} onClick={() => void releaseContact()} className={styles.primaryAction}>
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

export default function CustomerProjectPage() {
  return <CustomerProjectExperience />;
}
