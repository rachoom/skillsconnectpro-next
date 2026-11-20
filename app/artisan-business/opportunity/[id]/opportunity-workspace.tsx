'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type { ProviderOpportunity } from '@/services/marketplace/providerResponses';
import type { ProviderResponseType } from '@/types/marketplace';
import styles from './opportunity.module.css';

type FormState = {
  responseType: ProviderResponseType;
  siteVisitFee: string;
  estimateMin: string;
  estimateMax: string;
  providerMessage: string;
};

const RESPONSE_OPTIONS: Array<{
  value: ProviderResponseType;
  title: string;
  helper: string;
}> = [
  { value: 'available_now', title: 'Available now', helper: 'I can attend as soon as possible' },
  { value: 'available_today', title: 'Available today', helper: 'I can assist later today' },
  { value: 'available_tomorrow', title: 'Available tomorrow', helper: 'I can assist tomorrow' },
  { value: 'available_this_week', title: 'This week', helper: 'I have availability this week' },
  { value: 'available_next_week', title: 'Next week', helper: 'I can assist next week' },
  { value: 'site_visit', title: 'Site visit first', helper: 'I need to inspect before confirming' },
  { value: 'estimate', title: 'Send estimate', helper: 'I can provide a preliminary price range' },
  { value: 'need_information', title: 'Need information', helper: 'Ask the customer a clarifying question' },
  { value: 'declined', title: 'Decline', helper: 'This job is not suitable for me' },
];

const INITIAL_FORM: FormState = {
  responseType: 'available_today',
  siteVisitFee: '',
  estimateMin: '',
  estimateMax: '',
  providerMessage: '',
};

function money(value: number | null, currency = 'ZAR') {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateLabel(value: string | null) {
  if (!value) return 'Not specified';
  return new Date(value).toLocaleDateString('en-ZA', { dateStyle: 'medium' });
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed.');
  return payload;
}

export function ProviderOpportunityWorkspace({ invitationId }: { invitationId: string }) {
  const [opportunity, setOpportunity] = useState<ProviderOpportunity | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(
    () => `/api/account/provider-opportunities/${encodeURIComponent(invitationId)}`,
    [invitationId],
  );

  const load = async () => {
    setError(null);
    try {
      const payload = await readJson(await fetch(endpoint, {
        cache: 'no-store',
        credentials: 'same-origin',
      }));
      const next = payload.opportunity as ProviderOpportunity;
      setOpportunity(next);
      setForm((current) => ({
        ...current,
        responseType: (next.currentResponse?.responseType as ProviderResponseType) || current.responseType,
        siteVisitFee: next.currentResponse?.siteVisitFee === null || next.currentResponse?.siteVisitFee === undefined ? current.siteVisitFee : String(next.currentResponse.siteVisitFee),
        estimateMin: next.currentResponse?.estimateMin === null || next.currentResponse?.estimateMin === undefined ? current.estimateMin : String(next.currentResponse.estimateMin),
        estimateMax: next.currentResponse?.estimateMax === null || next.currentResponse?.estimateMax === undefined ? current.estimateMax : String(next.currentResponse.estimateMax),
        providerMessage: next.currentResponse?.providerMessage || current.providerMessage,
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load opportunity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // invitationId/endpoint uniquely identifies this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await readJson(await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseType: form.responseType,
          siteVisitFee: numberOrNull(form.siteVisitFee),
          estimateMin: numberOrNull(form.estimateMin),
          estimateMax: numberOrNull(form.estimateMax),
          estimateCurrency: 'ZAR',
          providerMessage: form.providerMessage,
        }),
      }));
      setSuccess(form.responseType === 'declined'
        ? 'Opportunity declined. Your workspace has been updated.'
        : 'Response sent. The customer can now review it in their project.');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingCard}>
          <Loader2 className={styles.spin} size={30} />
          <strong>Opening opportunity…</strong>
        </div>
      </main>
    );
  }

  if (!opportunity) {
    return (
      <main className={styles.page}>
        <section className={styles.errorCard}>
          <BriefcaseBusiness size={28} />
          <h1>Opportunity unavailable</h1>
          <p>{error || 'This opportunity could not be opened from your provider account.'}</p>
          <Link href="/artisan-business">Back to Business Workspace</Link>
        </section>
      </main>
    );
  }

  const project = opportunity.project;
  const showSiteVisit = form.responseType === 'site_visit';
  const showEstimate = form.responseType === 'estimate';

  if (opportunity.customerContact) {
    const contact = opportunity.customerContact;
    const digits = contact.phone.replace(/\D/g, '');
    const whatsapp = digits.startsWith('0') ? `27${digits.slice(1)}` : digits;

    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.topbar}>
            <Link href="/artisan-business"><ArrowLeft size={17} /> Business Workspace</Link>
            <span><ShieldCheck size={15} /> Connected project</span>
          </header>

          <section className={styles.connectedHero}>
            <CheckCircle2 size={36} />
            <div>
              <span>CUSTOMER SELECTED YOU</span>
              <h1>You’re connected.</h1>
              <p>{project.title}</p>
            </div>
          </section>

          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <span className={styles.kicker}>CUSTOMER CONTACT</span>
              <h2>{contact.name}</h2>
              <p className={styles.meta}><MapPin size={15} /> {contact.location}</p>
              <div className={styles.contactActions}>
                <a href={`tel:${contact.phone}`}><Phone size={17} /> Call customer</a>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp</a>
              </div>
              {contact.email && <p className={styles.small}>Email: {contact.email}</p>}
            </section>

            <section className={styles.panel}>
              <span className={styles.kicker}>PROJECT BRIEF</span>
              <h2>{project.title}</h2>
              <p>{project.customerDescription}</p>
              <div className={styles.factRow}>
                <span>{project.category}</span><span>{project.urgency}</span><span>{project.serviceArea}</span>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href="/artisan-business"><ArrowLeft size={17} /> Business Workspace</Link>
          <span><BriefcaseBusiness size={15} /> Business mode</span>
        </header>

        <section className={styles.hero}>
          <div>
            <span className={styles.kicker}>CUSTOMER OPPORTUNITY</span>
            <h1>{project.title}</h1>
            <div className={styles.factRow}>
              <span>{project.category}</span>
              <span>{project.urgency}</span>
              <span><MapPin size={12} /> {project.serviceArea}</span>
            </div>
          </div>
          <div className={styles.deadline}>
            <Clock3 size={17} />
            <span>Reply by</span>
            <strong>{dateLabel(opportunity.responseDeadline)}</strong>
          </div>
        </section>

        {opportunity.leadAccess.locked ? (
          <section className={styles.locked}>
            <LockKeyhole size={30} />
            <div>
              <span className={styles.kicker}>LEAD ACCESS PAUSED</span>
              <h2>Unlock this opportunity to respond.</h2>
              <p>You’ve used your complimentary lead access. Your job preview remains visible, but the full brief and response tools stay locked until provider access is active.</p>
              <div className={styles.lockActions}>
                <Link href={`/plans?audience=providers&provider=${opportunity.providerId}`}>
                  View provider plans <ArrowRight size={16} />
                </Link>
                <button type="button" onClick={() => setForm((current) => ({ ...current, responseType: 'declined' }))}>
                  Decline instead
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className={styles.workspaceGrid}>
            <section className={styles.brief}>
              <div className={styles.sectionHeading}><Wrench size={18} /><h2>Job brief</h2></div>
              <p className={styles.description}>{project.customerDescription}</p>

              {opportunity.currentResponse?.customerClarification && (
                <div className={styles.clarification}>
                  <MessageCircle size={17} />
                  <div>
                    <strong>Customer clarification</strong>
                    <p>{opportunity.currentResponse.customerClarification}</p>
                  </div>
                </div>
              )}

              <div className={styles.facts}>
                <div><span>Preferred date</span><strong>{dateLabel(project.preferredDate)}</strong></div>
                <div>
                  <span>Customer estimate</span>
                  <strong>
                    {project.estimatedMin === null && project.estimatedMax === null
                      ? 'Not supplied'
                      : `${money(project.estimatedMin, project.estimateCurrency) || '—'} – ${money(project.estimatedMax, project.estimateCurrency) || '—'}`}
                  </strong>
                </div>
              </div>

              {project.aiSummary && (
                <details className={styles.assessment}>
                  <summary>Preliminary assessment</summary>
                  <p>{project.aiSummary}</p>
                </details>
              )}

              {project.media?.some((item) => item.url) && (
                <div className={styles.mediaGrid}>
                  {project.media.filter((item) => item.url).map((item) => (
                    <img key={item.path} src={item.url} alt={item.alt || 'Customer project reference'} loading="lazy" />
                  ))}
                </div>
              )}
            </section>

            <form className={styles.responseCard} onSubmit={submit}>
              <div className={styles.responseHeading}>
                <div>
                  <span className={styles.kicker}>RESPOND</span>
                  <h2>Can you assist?</h2>
                </div>
                <Sparkles size={21} />
              </div>

              <div className={styles.options}>
                {RESPONSE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    data-selected={form.responseType === option.value ? 'true' : 'false'}
                    onClick={() => setForm((current) => ({ ...current, responseType: option.value }))}
                  >
                    <strong>{option.title}</strong>
                    <span>{option.helper}</span>
                  </button>
                ))}
              </div>

              {showSiteVisit && (
                <label className={styles.field}>
                  <span>Site visit fee (optional)</span>
                  <div><Banknote size={16} /><input inputMode="decimal" value={form.siteVisitFee} onChange={(event) => setForm((current) => ({ ...current, siteVisitFee: event.target.value }))} placeholder="e.g. 250" /></div>
                </label>
              )}

              {showEstimate && (
                <div className={styles.priceGrid}>
                  <label className={styles.field}><span>Estimate from</span><div><Banknote size={16} /><input inputMode="decimal" value={form.estimateMin} onChange={(event) => setForm((current) => ({ ...current, estimateMin: event.target.value }))} placeholder="e.g. 800" /></div></label>
                  <label className={styles.field}><span>Estimate to</span><div><Banknote size={16} /><input inputMode="decimal" value={form.estimateMax} onChange={(event) => setForm((current) => ({ ...current, estimateMax: event.target.value }))} placeholder="e.g. 1500" /></div></label>
                </div>
              )}

              <label className={styles.field}>
                <span>{form.responseType === 'need_information' ? 'Your question' : 'Message to customer (optional)'}</span>
                <textarea
                  value={form.providerMessage}
                  onChange={(event) => setForm((current) => ({ ...current, providerMessage: event.target.value }))}
                  maxLength={1200}
                  placeholder={form.responseType === 'need_information' ? 'What do you need the customer to clarify?' : 'Add timing, scope or pricing context…'}
                />
              </label>

              {error && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.success}>{success}</p>}

              <button className={styles.submit} disabled={submitting}>
                {submitting ? <Loader2 className={styles.spin} size={18} /> : <ArrowRight size={18} />}
                {form.responseType === 'declined' ? 'Submit decline' : form.responseType === 'need_information' ? 'Send question' : 'Send response'}
              </button>

              {opportunity.currentResponse && (
                <p className={styles.saved}>Existing response: {opportunity.currentResponse.responseType.replaceAll('_', ' ')}. Submitting again updates it.</p>
              )}
            </form>
          </div>
        )}

        {opportunity.leadAccess.locked && form.responseType === 'declined' && (
          <form className={styles.declineOnly} onSubmit={submit}>
            <p>You can always decline without using paid lead access.</p>
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
            <button className={styles.submit} disabled={submitting}>
              {submitting ? <Loader2 className={styles.spin} size={18} /> : <ArrowRight size={18} />}
              Confirm decline
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
