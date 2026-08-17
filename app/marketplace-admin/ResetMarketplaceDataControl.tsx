'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'marketplaceAdminKey';
const RESET_CONFIRMATION = 'RESET_MARKETPLACE_TEST_DATA';

type ResetPayload = {
  reset?: {
    projectsBefore: number;
    pendingDispatchBefore: number;
    backendRunsBefore: number;
    projectsAfter: number;
    pendingDispatchAfter: number;
    backendRunsAfter: number;
  };
  error?: string;
};

export default function ResetMarketplaceDataControl() {
  const [adminKey, setAdminKey] = useState('');
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const syncAdminKey = () => {
      setAdminKey(window.sessionStorage.getItem(STORAGE_KEY) ?? '');
    };

    syncAdminKey();
    window.addEventListener('focus', syncAdminKey);
    const timer = window.setInterval(syncAdminKey, 1000);

    return () => {
      window.removeEventListener('focus', syncAdminKey);
      window.clearInterval(timer);
    };
  }, []);

  if (!adminKey) return null;

  const resetDashboard = async () => {
    const confirmed = window.confirm(
      [
        'Reset the marketplace test dashboard?',
        '',
        'This deletes operational job-flow records only: projects, invitations, responses, matches, delivery attempts, feedback/complaints tied to projects, and backend run history.',
        '',
        'Provider records and configuration are kept.',
      ].join('\n'),
    );

    if (!confirmed) return;

    setResetting(true);
    setMessage(null);
    setFailed(false);

    try {
      const response = await fetch('/api/admin/projects/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-marketplace-admin-key': adminKey,
        },
        body: JSON.stringify({ confirm: RESET_CONFIRMATION }),
      });
      const payload = (await response.json().catch(() => ({}))) as ResetPayload;

      if (!response.ok) {
        throw new Error(payload.error || `Reset failed with status ${response.status}.`);
      }

      const reset = payload.reset;
      setMessage(
        reset
          ? `Reset complete: ${reset.projectsBefore} project(s) and ${reset.pendingDispatchBefore} pending WhatsApp send(s) cleared.`
          : 'Reset complete.',
      );

      window.setTimeout(() => {
        window.location.assign('/marketplace-admin');
      }, 1200);
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Unable to reset dashboard.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[min(92vw,360px)] space-y-2 text-white">
      {message && (
        <div
          className={`rounded-2xl border p-3 text-xs shadow-2xl backdrop-blur ${
            failed
              ? 'border-red-400/40 bg-red-950/90 text-red-100'
              : 'border-emerald-400/40 bg-emerald-950/90 text-emerald-100'
          }`}
        >
          <div className="flex items-start gap-2">
            {failed ? <AlertTriangle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
            <span>{message}</span>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => void resetDashboard()}
        disabled={resetting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/40 bg-red-950/90 px-4 py-3 text-xs font-black uppercase tracking-wider text-red-100 shadow-2xl backdrop-blur transition hover:border-red-300 disabled:opacity-60"
      >
        {resetting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
        {resetting ? 'Resetting…' : 'Reset test dashboard'}
      </button>
    </div>
  );
}
