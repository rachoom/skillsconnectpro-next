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
    const initialisation = window.setTimeout(() => {
      const token = new URLSearchParams(window.location.search).get('token') ?? '';
      setAccessToken(token);
      if (!token) {
        setError('This project link is missing its secure access token.');
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(initialisation);
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
    const initialLoad = window.setTimeout(() => void loadFeed(), 0);
    const interval = window.setInterval(() => void loadFeed(true), 15000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
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

  const openJobControls = () => {
    const controls = document.getElementById('job-status-controls');
    if (controls) controls.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
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
  const releasedProvider = feed.releasedContact?.provider ?? null;
  const selectedName = selectedResponse ? providerName(selectedResponse.provider) : 'the selected provider';
  const whatsappHref = releasedProvider?.whatsapp
    ? `https://wa.me/${whatsappNumber(releasedProvider.whatsapp)}?text=${encodeURIComponent(
        `Hi ${releasedProvider.name}, I selected you through Skills Connect Pro for my project: ${project.title}.`,
      )}`
    : null;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.overviewBar}>
          <div>
            <span>Customer workspace</span>
            <strong>Project Overview</strong>
          </div>
          <div className={styles.liveState}><i /> Live updates</div>
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

            <aside className={styles.matchingPanel}>
              <div className={styles.matchingOrb}>
                <span><Users size={25} /></span>
              </div>
              <p className={styles.matchingKicker}>Matching in progress</p>
              <strong>
                {feed.matching.invitationsSent > 0
                  ? `${feed.matching.invitationsSent} provider${feed.matching.invitationsSent === 1 ? '' : 's'} contacted`
                  : 'Finding suitable providers'}
              </strong>
              <p className={styles.matchingCopy}>
                {feed.matching.validResponsesReceived > 0
                  ? `${feed.matching.validResponsesReceived} response${feed.matching.validResponsesReceived === 1 ? '' : 's'} ready to review.`
                  : 'We are contacting suitable local providers. This page updates automatically.'}
              </p>
              <button type="button" onClick={() => void loadFeed()} className={styles.refreshButton}>
                <RefreshCw size={15} /> Refresh now
              </button>
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
            <div className={styles.metricTop}><span className={styles.metricIcon}><Users size={19} /></span><small>01</small></div>
            <strong>{feed.matching.invitationsSent}</strong>
            <h2>Providers invited</h2>
            <p>Invitations sent to suitable local providers.</p>
          </article>
          <article className={styles.metricCard}>
            <div className={styles.metricTop}><span className={styles.metricIcon}><Clock3 size={19} /></span><small>02</small></div>
            <strong>{feed.matching.providersReviewing}</strong>
            <h2>Currently reviewing</h2>
            <p>Providers actively considering your project.</p>
          </article>
          <article className={`${styles.metricCard} ${styles.metricSuccess}`}>
            <div className={styles.metricTop}><span className={styles.metricIcon}><CheckCircle2 size={19} /></span><small>03</small></div>
            <strong>{feed.matching.validResponsesReceived}</strong>
            <h2>Responses received</h2>
            <p>Provider options ready for you to compare.</p>
          </article>
        </section>

        {selectedResponse && !contactsReleased && (
          <section className={`${styles.actionCard} ${styles.actionSelected}`}>
            <div className={styles.actionIcon}><UserRoundCheck size={27} /></div>
            <div className={styles.actionCopy}>
              <span>Provider selected</span>
              <h2>{selectedName}</h2>
              <p>
                Confirm this provider to exchange contact details. Job-status controls become available immediately after you connect.
              </p>
            </div>
            <button onClick={() => setShowReleaseConfirm(true)} className={styles.primaryAction}>
              <LockKeyhole size={16} /> Confirm & connect
            </button>
          </section>
        )}

        {contactsReleased && releasedProvider && (
          <>
            <section className={`${styles.actionCard} ${styles.actionConnected}`}>
              <div className={styles.actionIcon}><CheckCircle2 size={28} /></div>
              <div className={styles.actionCopy}>
                <span>You are connected</span>
                <h2>{releasedProvider.name}</h2>
                <p>Contact details have been released only to you and the selected provider.</p>
                <div className={styles.contactActions}>
                  {releasedProvider.phone && (
                    <a href={`tel:${releasedProvider.phone}`} className={styles.callButton}>
                      <Phone size={17} /> Call {releasedProvider.phone}
                    </a>
                  )}
                  {whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.whatsappButton}>
                      <MessageCircle size={17} /> WhatsApp provider
                    </a>
                  )}
                </div>
                {releasedProvider.email && <small>Email: {releasedProvider.email}</small>}
              </div>
            </section>

            <section className={`${styles.actionCard} ${styles.jobControlsCard}`}>
              <div className={styles.actionIcon}><Wrench size={25} /></div>
              <div className={styles.actionCopy}>
                <span>Manage job status</span>
                <h2>Keep the project record up to date</h2>
                <p>Mark when work starts, confirm completion, cancel the project or report a problem.</p>
              </div>
              <button type="button" onClick={openJobControls} className={styles.primaryAction}>
                <Wrench size={17} /> Open job controls
              </button>
            </section>
          </>
        )}

        <section className={styles.responsesSection}>
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
              <div className={styles.emptySteps}>
                <span><b>1</b> Request shared</span>
                <span><b>2</b> Providers reviewing</span>
                <span><b>3</b> Responses arrive here</span>
              </div>
            </div>
          ) : (
            <div className={styles.providerGrid}>
              {feed.responses.map((response) => {
                const name = providerName(response.provider);
                const category = providerString(response.provider, 'category');
                const location = providerString(response.provider, 'location');
                const verified = response.provider.verified === true;
                const rating = providerNumber(response.provider, 'rating');
                const selected = response.id === selectedResponseId;
                const showSiteVisitFee = response.responseType === 'site_visit' || response.siteVisitFee !== null;
                const hasEstimate = response.estimateMin !== null || response.estimateMax !== null;

                return (
                  <article key={response.id} className={`${styles.providerCard} ${selected ? styles.providerSelected : ''}`}>
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
                      disabled={contactsReleased || selected || selectingResponseId !== null}
                      onClick={() => void selectProvider(response.id)}
                      className={styles.selectProviderButton}
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

        <section className={styles.activityCard}>
          <div className={styles.activityHeading}>
            <div>
              <span>Project activity</span>
              <h2>Your project journey</h2>
            </div>
            <small>Latest activity updates automatically</small>
          </div>

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
        </section>
      </div>

      {showReleaseConfirm && selectedResponse && (
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
