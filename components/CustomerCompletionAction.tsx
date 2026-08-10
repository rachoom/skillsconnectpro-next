'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react';

type LifecycleState = {
  projectStatus: string;
  matchStatus: string;
  contactReleased: boolean;
  completionReportedAt: string | null;
  completionConfirmedByCustomer: boolean;
  issueReportedAt: string | null;
  providerName: string;
  finalPrice: number | null;
};

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to complete this project.');
  return payload;
}

export const CustomerCompletionAction = () => {
  const pathname = usePathname();
  const projectId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length === 2 && parts[0] === 'project' ? parts[1] : '';
  }, [pathname]);

  const [accessToken, setAccessToken] = useState('');
  const [lifecycle, setLifecycle] = useState<LifecycleState | null>(null);
  const [mountTarget, setMountTarget] = useState<HTMLElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [finalPrice, setFinalPrice] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) {
      setAccessToken('');
      return;
    }
    setAccessToken(new URLSearchParams(window.location.search).get('token')?.trim() ?? '');
  }, [projectId]);

  const loadLifecycle = useCallback(async () => {
    if (!projectId || !accessToken) return;
    try {
      const payload = await readJson(
        await fetch(`/api/projects/${encodeURIComponent(projectId)}/lifecycle`, {
          headers: { 'x-project-access-token': accessToken },
          cache: 'no-store',
        }),
      );
      setLifecycle(payload.lifecycle as LifecycleState);
      setError('');
    } catch (reason) {
      setLifecycle(null);
      setError(reason instanceof Error ? reason.message : 'Unable to load completion controls.');
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    void loadLifecycle();
    if (!projectId || !accessToken) return;
    const timer = window.setInterval(() => void loadLifecycle(), 15000);
    return () => window.clearInterval(timer);
  }, [accessToken, loadLifecycle, projectId]);

  useEffect(() => {
    if (!projectId) {
      setMountTarget(null);
      return;
    }

    const locate = () => {
      const target = document.querySelector<HTMLElement>('#job-status-controls > div');
      if (target) setMountTarget(target);
    };

    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [projectId]);

  const confirmCompletion = async () => {
    if (!projectId || !accessToken) return;
    const parsedPrice = finalPrice.trim() ? Number(finalPrice) : null;

    setSubmitting(true);
    setError('');
    try {
      await readJson(
        await fetch(`/api/projects/${encodeURIComponent(projectId)}/lifecycle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-project-access-token': accessToken,
          },
          body: JSON.stringify({
            action: 'confirm_completion',
            note,
            finalPrice: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
          }),
        }),
      );

      window.dispatchEvent(new Event('customer-dashboard-updated'));
      window.setTimeout(() => window.location.reload(), 650);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to confirm completion.');
    } finally {
      setSubmitting(false);
    }
  };

  const visible = Boolean(
    mountTarget &&
      lifecycle?.contactReleased &&
      ['contact_released', 'in_progress'].includes(lifecycle.projectStatus) &&
      lifecycle.matchStatus !== 'disputed' &&
      !lifecycle.completionConfirmedByCustomer &&
      !lifecycle.completionReportedAt,
  );

  if (!visible || !mountTarget || !lifecycle) return null;

  return createPortal(
    <div className="mt-5 rounded-3xl border-2 border-emerald-400/25 bg-emerald-500/[0.07] p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
            <CheckCircle2 size={25} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              Customer completion
            </p>
            <h3 className="mt-2 text-xl font-black text-white">Has the job been completed?</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              You do not need to wait for {lifecycle.providerName} to update their side. Once you have checked the work, you can close the project yourself.
            </p>
          </div>
        </div>

        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 font-black text-[#052015]"
          >
            <ShieldCheck size={19} /> Confirm job complete
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Final confirmation</p>
              <h4 className="mt-2 text-lg font-black text-white">Confirm that the work is finished</h4>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                This closes the project and unlocks the verified rating. Report a problem instead if the work is incomplete or disputed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setError('');
              }}
              className="rounded-xl border border-white/10 p-2 text-zinc-400"
              aria-label="Close completion confirmation"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">
              <AlertTriangle className="shrink-0" size={18} /> {error}
            </div>
          )}

          <label className="mt-5 block">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Final price — optional</span>
            <input
              inputMode="decimal"
              value={finalPrice}
              onChange={(event) => setFinalPrice(event.target.value)}
              placeholder="For example: 850"
              className="mt-2 min-h-14 w-full rounded-2xl border-2 border-white/10 bg-[#080d0b] px-4 text-white outline-none focus:border-emerald-400/50"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Short note — optional</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add anything useful to the permanent job record."
              className="mt-2 min-h-24 w-full rounded-2xl border-2 border-white/10 bg-[#080d0b] p-4 text-sm text-white outline-none focus:border-emerald-400/50"
            />
          </label>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void confirmCompletion()}
            className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 font-black text-[#052015] disabled:opacity-45"
          >
            {submitting ? <Loader2 className="animate-spin" size={19} /> : <ShieldCheck size={19} />}
            Yes, close this project as completed
          </button>
        </div>
      )}
    </div>,
    mountTarget,
  );
};