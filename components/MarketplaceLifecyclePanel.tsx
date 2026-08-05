'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flag,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Wrench,
  XCircle,
} from 'lucide-react';

type ActorMode = 'customer' | 'provider';
type LifecycleAction =
  | 'start_work'
  | 'report_completion'
  | 'confirm_completion'
  | 'cancel_project'
  | 'report_issue';

type LifecycleState = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  matchStatus: string;
  actorType: ActorMode;
  providerId: number;
  providerName: string;
  customerName: string;
  contactReleased: boolean;
  completionReportedAt: string | null;
  completionReportedBy: string | null;
  completionNote: string | null;
  completionConfirmationDueAt: string | null;
  completionGraceHours: number;
  completionConfirmedAt: string | null;
  completionConfirmedByCustomer: boolean;
  autoClosedAt: string | null;
  issueReportedAt: string | null;
  issueReportedBy: string | null;
  issueNote: string | null;
  finalPrice: number | null;
  finalPriceCurrency: string;
};

type DraftAction = 'complete' | 'cancel' | 'issue' | null;

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to update this job.');
  return payload;
}

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export const MarketplaceLifecyclePanel = () => {
  const pathname = usePathname();
  const route = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 2 && parts[0] === 'project') {
      return { mode: 'customer' as const, identifier: parts[1] };
    }
    if (parts.length === 2 && parts[0] === 'provider-opportunity') {
      return { mode: 'provider' as const, identifier: parts[1] };
    }
    return null;
  }, [pathname]);

  const [customerToken, setCustomerToken] = useState('');
  const [lifecycle, setLifecycle] = useState<LifecycleState | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftAction, setDraftAction] = useState<DraftAction>(null);
  const [note, setNote] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (route?.mode === 'customer') {
      setCustomerToken(new URLSearchParams(window.location.search).get('token')?.trim() ?? '');
    } else {
      setCustomerToken('');
    }
  }, [route]);

  const endpoint = useMemo(() => {
    if (!route) return '';
    if (route.mode === 'provider') {
      return `/api/provider-opportunities/${encodeURIComponent(route.identifier)}/lifecycle`;
    }
    return `/api/projects/${encodeURIComponent(route.identifier)}/lifecycle`;
  }, [route]);

  const loadLifecycle = useCallback(async (quiet = false) => {
    if (!route || !endpoint) return;
    if (route.mode === 'customer' && !customerToken) return;
    if (!quiet) setLoading(true);

    try {
      const response = await fetch(endpoint, {
        headers: route.mode === 'customer'
          ? { 'x-project-access-token': customerToken }
          : undefined,
        cache: 'no-store',
      });

      if ([400, 404, 409].includes(response.status)) {
        setLifecycle(null);
        return;
      }

      const payload = await readJson(response);
      setLifecycle(payload.lifecycle as LifecycleState);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load job controls.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [customerToken, endpoint, route]);

  useEffect(() => {
    setLifecycle(null);
    setDraftAction(null);
    setNote('');
    setFinalPrice('');
    setError('');
    setNotice('');
    void loadLifecycle();
  }, [loadLifecycle]);

  useEffect(() => {
    if (!lifecycle || ['completed', 'cancelled'].includes(lifecycle.projectStatus)) return;
    const interval = window.setInterval(() => void loadLifecycle(true), 15000);
    return () => window.clearInterval(interval);
  }, [lifecycle, loadLifecycle]);

  const submitAction = async (action: LifecycleAction) => {
    if (!route || !endpoint) return;
    setSubmitting(true);
    setError('');
    setNotice('');

    const parsedPrice = finalPrice.trim() ? Number(finalPrice) : null;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(route.mode === 'customer' ? { 'x-project-access-token': customerToken } : {}),
        },
        body: JSON.stringify({
          action,
          note,
          finalPrice: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
        }),
      });
      const payload = await readJson(response);
      setLifecycle(payload.lifecycle as LifecycleState);
      setDraftAction(null);
      setNote('');
      setFinalPrice('');
      setNotice(
        action === 'start_work'
          ? 'The job has been updated to work in progress.'
          : action === 'report_completion'
            ? 'Your completion report was sent to the customer. The job remains open during the confirmation period.'
            : action === 'confirm_completion'
              ? 'You confirmed that the job was completed. Verified feedback is now available.'
              : action === 'cancel_project'
                ? 'The project has been cancelled and recorded.'
                : 'The problem has been recorded for administrator review.',
      );
      window.setTimeout(() => window.location.reload(), 900);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update the job.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!route) return null;
  if (loading && !lifecycle) return null;
  if (!lifecycle || !lifecycle.contactReleased) return null;

  const customerMode = route.mode === 'customer';
  const customerConfirmedCompletion =
    lifecycle.projectStatus === 'completed' && lifecycle.completionConfirmedByCustomer;
  const autoClosedWithoutCustomer =
    lifecycle.projectStatus === 'completed' &&
    Boolean(lifecycle.autoClosedAt) &&
    !lifecycle.completionConfirmedByCustomer;
  const closedWithoutCustomerConfirmation =
    lifecycle.projectStatus === 'completed' &&
    !lifecycle.completionConfirmedByCustomer &&
    !lifecycle.autoClosedAt;
  const cancelled = lifecycle.projectStatus === 'cancelled';
  const disputed = lifecycle.matchStatus === 'disputed';
  const inProgress = lifecycle.projectStatus === 'in_progress';
  const providerReportedCompletion =
    !customerConfirmedCompletion &&
    Boolean(lifecycle.completionReportedAt) &&
    lifecycle.completionReportedBy === 'provider';

  const wrapperClass = customerMode
    ? 'bg-[#080d0b] px-4 pb-12 text-white md:px-8'
    : 'bg-[#9FCB8A] px-4 pb-10 text-[#203020] md:px-8';
  const cardClass = customerMode
    ? 'border-white/10 bg-[#111713]'
    : 'border-[#6F8E65] bg-[#FFF9E8] shadow-xl shadow-[#355332]/15';
  const mutedClass = customerMode ? 'text-zinc-400' : 'text-[#65735E]';

  return (
    <section id="job-status-controls" className={`${wrapperClass} scroll-mt-24`}>
      <div className={`mx-auto max-w-5xl rounded-[2rem] border-2 p-5 md:p-7 ${cardClass}`}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className={`rounded-2xl p-3 ${customerMode ? 'bg-amber-400/15 text-amber-300' : 'bg-[#FFE067] text-[#5B4300]'}`}>
              <Wrench size={24} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${customerMode ? 'text-amber-300' : 'text-[#6B5A16]'}`}>
                {customerMode ? 'Manage your job' : 'Update this job'}
              </p>
              <h2 className="mt-2 text-2xl font-black">What is happening now?</h2>
              <p className={`mt-2 max-w-2xl text-sm leading-6 ${mutedClass}`}>
                {customerMode
                  ? `Keep ${lifecycle.providerName} and Skills Connect Pro informed. Final completion remains under your control during the confirmation period.`
                  : `Keep ${lifecycle.customerName} and Skills Connect Pro informed. You report completion; the customer confirms it or the system closes the record after the confirmation period.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadLifecycle()}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-wider ${customerMode ? 'border-white/10 text-zinc-300' : 'border-[#9DBA8F] bg-white/60 text-[#405044]'}`}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className={`mt-6 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider ${mutedClass}`}>
          <span className={`rounded-full px-3 py-2 ${customerConfirmedCompletion ? 'bg-emerald-500/20 text-emerald-300' : cancelled || disputed || closedWithoutCustomerConfirmation ? 'bg-red-500/15 text-red-300' : autoClosedWithoutCustomer ? 'bg-sky-500/15 text-sky-300' : customerMode ? 'bg-white/5' : 'bg-[#EAF3DE]'}`}>
            {disputed
              ? 'Problem reported'
              : customerConfirmedCompletion
                ? 'Customer confirmed complete'
                : autoClosedWithoutCustomer
                  ? 'Automatically closed'
                  : closedWithoutCustomerConfirmation
                    ? 'Admin review required'
                    : titleCase(lifecycle.projectStatus)}
          </span>
          {providerReportedCompletion && !autoClosedWithoutCustomer && (
            <span className={customerMode ? 'rounded-full bg-amber-400/15 px-3 py-2 text-amber-300' : 'rounded-full bg-[#FFE067] px-3 py-2 text-[#5B4300]'}>
              Provider report received {formatDate(lifecycle.completionReportedAt)}
            </span>
          )}
        </div>

        {error && (
          <div className={`mt-5 flex gap-3 rounded-2xl border p-4 text-sm font-bold ${customerMode ? 'border-red-400/30 bg-red-500/10 text-red-100' : 'border-[#C95D65] bg-[#FFDDE2] text-[#7A2932]'}`}>
            <AlertTriangle className="shrink-0" size={19} /> {error}
          </div>
        )}
        {notice && (
          <div className={`mt-5 flex gap-3 rounded-2xl border p-4 text-sm font-bold ${customerMode ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-[#55A979] bg-[#E6F8DF] text-[#245A3D]'}`}>
            <CheckCircle2 className="shrink-0" size={19} /> {notice}
          </div>
        )}

        {customerConfirmedCompletion ? (
          <div className={`mt-6 rounded-3xl border-2 p-6 ${customerMode ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-[#55A979] bg-[#E6F8DF]'}`}>
            <div className="flex items-start gap-4">
              <CheckCircle2 className={customerMode ? 'text-emerald-300' : 'text-[#21885A]'} size={32} />
              <div>
                <h3 className="text-xl font-black">Job confirmed complete</h3>
                <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>
                  {customerMode
                    ? 'You confirmed the provider’s completion report. Verified rating and support controls are now available.'
                    : 'The customer confirmed your completion report. This project is now part of your verified job record.'}
                </p>
                {lifecycle.completionConfirmedAt && (
                  <p className={`mt-2 text-xs ${mutedClass}`}>Confirmed {formatDate(lifecycle.completionConfirmedAt)}</p>
                )}
                {lifecycle.finalPrice !== null && (
                  <p className="mt-3 text-sm font-black">Final price: R {lifecycle.finalPrice.toLocaleString('en-ZA')}</p>
                )}
              </div>
            </div>
          </div>
        ) : autoClosedWithoutCustomer ? (
          <div className={`mt-6 rounded-3xl border-2 p-6 ${customerMode ? 'border-sky-400/30 bg-sky-500/10' : 'border-[#79ADD0] bg-[#E5F4FF]'}`}>
            <div className="flex items-start gap-4">
              <TimerReset className={customerMode ? 'shrink-0 text-sky-300' : 'shrink-0 text-[#39789B]'} size={31} />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black">Project automatically closed</h3>
                <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>
                  {customerMode
                    ? `No confirmation or support case was received within ${lifecycle.completionGraceHours} hours of the provider’s completion report. The operational record has been closed, but you may still confirm the completed work below.`
                    : `No customer response or support case was received within ${lifecycle.completionGraceHours} hours. The project record was closed automatically.`}
                </p>
                {lifecycle.autoClosedAt && (
                  <p className={`mt-2 text-xs ${mutedClass}`}>Closed {formatDate(lifecycle.autoClosedAt)}</p>
                )}
                {customerMode && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setDraftAction('complete')}
                    className="mt-5 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 font-black text-[#052015] disabled:opacity-45"
                  >
                    <CheckCircle2 size={20} /> Confirm completed work now
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : closedWithoutCustomerConfirmation ? (
          <div className={`mt-6 rounded-3xl border-2 p-6 ${customerMode ? 'border-red-400/30 bg-red-500/10' : 'border-[#C95D65] bg-[#FFDDE2]'}`}>
            <div className="flex items-start gap-4">
              <AlertTriangle className={customerMode ? 'text-red-300' : 'text-[#A6323B]'} size={31} />
              <div>
                <h3 className="text-xl font-black">Customer confirmation is missing</h3>
                <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>
                  This older project was closed without a verified customer confirmation or a recorded timeout. Rating remains locked and the record should be reviewed by Skills Connect Pro.
                </p>
              </div>
            </div>
          </div>
        ) : cancelled ? (
          <div className={`mt-6 rounded-3xl border-2 p-6 ${customerMode ? 'border-red-400/30 bg-red-500/10' : 'border-[#C95D65] bg-[#FFDDE2]'}`}>
            <div className="flex items-start gap-4">
              <XCircle className={customerMode ? 'text-red-300' : 'text-[#A6323B]'} size={31} />
              <div>
                <h3 className="text-xl font-black">Project cancelled</h3>
                <p className={`mt-2 text-sm ${mutedClass}`}>The cancellation has been saved in the permanent job record.</p>
              </div>
            </div>
          </div>
        ) : disputed ? (
          <div className={`mt-6 rounded-3xl border-2 p-6 ${customerMode ? 'border-red-400/30 bg-red-500/10' : 'border-[#C95D65] bg-[#FFDDE2]'}`}>
            <div className="flex items-start gap-4">
              <Flag className={customerMode ? 'text-red-300' : 'text-[#A6323B]'} size={29} />
              <div>
                <h3 className="text-xl font-black">This job needs review</h3>
                <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>{lifecycle.issueNote || 'A project problem has been recorded for administrator review.'}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {providerReportedCompletion && customerMode && (
              <div className="mt-6 rounded-3xl border-2 border-amber-300/35 bg-amber-400/10 p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <Clock3 className="mt-1 shrink-0 text-amber-300" size={29} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-300">Your confirmation is required</p>
                    <h3 className="mt-2 text-xl font-black">{lifecycle.providerName} says the work is finished</h3>
                    <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>
                      The provider’s update has not closed the job. Check the work first, then confirm completion or report a problem.
                    </p>
                    {lifecycle.completionConfirmationDueAt && (
                      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-black/15 p-4">
                        <TimerReset className="mt-0.5 shrink-0 text-amber-300" size={19} />
                        <p className="text-xs leading-5 text-zinc-300">
                          Please respond by <strong>{formatDate(lifecycle.completionConfirmationDueAt)}</strong>. If no response or support case is received, the operational record will close automatically after {lifecycle.completionGraceHours} hours. You may still confirm later.
                        </p>
                      </div>
                    )}
                    {lifecycle.completionNote && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6">
                        “{lifecycle.completionNote}”
                      </div>
                    )}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setDraftAction('complete')}
                        className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 font-black text-[#052015] transition hover:bg-emerald-300 disabled:opacity-45"
                      >
                        <CheckCircle2 size={21} /> Yes, confirm job complete
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setDraftAction('issue')}
                        className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-red-400/30 bg-red-500/10 px-4 font-black text-red-100 transition hover:bg-red-500/15 disabled:opacity-45"
                      >
                        <Flag size={20} /> No, report a problem
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {providerReportedCompletion && !customerMode && (
              <div className="mt-6 rounded-3xl border-2 border-[#D3A826] bg-[#FFF0A8] p-5">
                <div className="flex items-start gap-4">
                  <Clock3 className="shrink-0 text-[#B07800]" size={27} />
                  <div>
                    <h3 className="text-xl font-black">Waiting for customer confirmation</h3>
                    <p className="mt-2 text-sm leading-6 text-[#65735E]">
                      Your report has been sent, but the customer still controls immediate confirmation. If no response or support case is received within {lifecycle.completionGraceHours} hours, the operational record will close automatically.
                    </p>
                    {lifecycle.completionConfirmationDueAt && (
                      <p className="mt-3 text-xs font-black text-[#6B5A16]">
                        Confirmation period ends {formatDate(lifecycle.completionConfirmationDueAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!providerReportedCompletion && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {!inProgress && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void submitAction('start_work')}
                    className={`min-h-24 rounded-2xl border-2 p-4 text-left transition disabled:opacity-45 ${customerMode ? 'border-amber-300/25 bg-amber-400/10 hover:bg-amber-400/15' : 'border-[#D3A826] bg-[#FFF0A8]'}`}
                  >
                    <Play size={20} className={customerMode ? 'text-amber-300' : 'text-[#B07800]'} />
                    <span className="mt-3 block text-base font-black">Work has started</span>
                    <span className={`mt-1 block text-xs ${mutedClass}`}>Move the job into progress</span>
                  </button>
                )}

                {!customerMode && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setDraftAction('complete')}
                    className="min-h-24 rounded-2xl border-2 border-[#55A979] bg-[#E6F8DF] p-4 text-left disabled:opacity-45"
                  >
                    <CheckCircle2 size={21} className="text-[#21885A]" />
                    <span className="mt-3 block text-base font-black">Report work finished</span>
                    <span className="mt-1 block text-xs text-[#65735E]">Start the customer confirmation period</span>
                  </button>
                )}

                {customerMode ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setDraftAction('cancel')}
                    className="min-h-24 rounded-2xl border-2 border-red-400/25 bg-red-500/5 p-4 text-left transition hover:bg-red-500/10 disabled:opacity-45"
                  >
                    <XCircle size={21} className="text-red-300" />
                    <span className="mt-3 block text-base font-black">Cancel project</span>
                    <span className={`mt-1 block text-xs ${mutedClass}`}>Record that the job did not proceed</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setDraftAction('issue')}
                    className="min-h-24 rounded-2xl border-2 border-[#C95D65] bg-[#FFDDE2] p-4 text-left disabled:opacity-45"
                  >
                    <Flag size={21} className="text-[#A6323B]" />
                    <span className="mt-3 block text-base font-black">Report a problem</span>
                    <span className="mt-1 block text-xs text-[#6E3439]">Give your side of what happened</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {draftAction && !customerConfirmedCompletion && !closedWithoutCustomerConfirmation && !cancelled && !disputed && (
          <div className={`mt-6 rounded-3xl border-2 p-5 ${customerMode ? 'border-white/10 bg-black/20' : 'border-[#B7CBAE] bg-[#F7FAF2]'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${customerMode ? 'text-amber-300' : 'text-[#6B5A16]'}`}>
                  {draftAction === 'complete' ? 'Completion confirmation' : draftAction === 'cancel' ? 'Cancellation record' : 'Support report'}
                </p>
                <h3 className="mt-2 text-xl font-black">
                  {draftAction === 'complete'
                    ? customerMode
                      ? 'Confirm the provider completed the job'
                      : 'Report that your work is finished'
                    : draftAction === 'cancel'
                      ? 'Why did the project not proceed?'
                      : 'What problem occurred?'}
                </h3>
                {draftAction === 'complete' && customerMode && (
                  <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>
                    This confirmation closes the job as customer-verified and unlocks the verified rating form.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDraftAction(null)}
                className="rounded-xl border border-current/15 p-2"
                aria-label="Close"
              >
                <XCircle size={18} />
              </button>
            </div>

            {draftAction === 'complete' && (
              <label className="mt-5 block">
                <span className={`text-[10px] font-black uppercase tracking-wider ${mutedClass}`}>Final price — optional</span>
                <input
                  inputMode="decimal"
                  value={finalPrice}
                  onChange={(event) => setFinalPrice(event.target.value)}
                  placeholder="For example: 850"
                  className={`mt-2 min-h-14 w-full rounded-2xl border-2 px-4 text-base outline-none ${customerMode ? 'border-white/10 bg-[#080d0b] text-white' : 'border-[#B7CBAE] bg-white'}`}
                />
              </label>
            )}

            <label className="mt-4 block">
              <span className={`text-[10px] font-black uppercase tracking-wider ${mutedClass}`}>
                {draftAction === 'issue' ? 'Describe the problem' : 'Short note — optional'}
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={draftAction === 'issue' ? 'Explain the important facts so the case can be reviewed fairly.' : 'Add a brief note for the permanent job record.'}
                className={`mt-2 min-h-28 w-full rounded-2xl border-2 p-4 text-sm outline-none ${customerMode ? 'border-white/10 bg-[#080d0b] text-white' : 'border-[#B7CBAE] bg-white'}`}
              />
            </label>

            <button
              type="button"
              disabled={submitting || (draftAction === 'issue' && note.trim().length < 10)}
              onClick={() => void submitAction(
                draftAction === 'complete'
                  ? customerMode
                    ? 'confirm_completion'
                    : 'report_completion'
                  : draftAction === 'cancel'
                    ? 'cancel_project'
                    : 'report_issue',
              )}
              className={`mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl font-black disabled:opacity-45 ${draftAction === 'issue' || draftAction === 'cancel' ? 'bg-[#C95D65] text-white' : customerMode ? 'bg-emerald-400 text-[#052015]' : 'bg-[#F5C518] text-black'}`}
            >
              {submitting
                ? <Loader2 className="animate-spin" size={19} />
                : draftAction === 'issue'
                  ? <Flag size={19} />
                  : draftAction === 'cancel'
                    ? <XCircle size={19} />
                    : <ShieldCheck size={19} />}
              {draftAction === 'complete'
                ? customerMode
                  ? 'Confirm job completed'
                  : 'Send completion report'
                : draftAction === 'cancel'
                  ? 'Confirm cancellation'
                  : 'Send support report'}
            </button>
          </div>
        )}

        {customerMode && !customerConfirmedCompletion && !cancelled && (
          <p className={`mt-5 text-xs leading-5 ${mutedClass}`}>
            A provider completion report does not immediately close the project. You may confirm it, report a problem, or allow the operational record to close after the stated confirmation period. Verified ratings remain locked until you personally confirm completion.
          </p>
        )}
      </div>
    </section>
  );
};
