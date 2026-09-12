'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';

const STORAGE_KEY = 'marketplaceAdminKey';

type ReadinessState = 'ready' | 'disabled' | 'incomplete';

type ReadinessSection = {
  status: ReadinessState;
  enabled: boolean;
  configured: boolean;
  missing: string[];
  notes: string[];
};

type WhatsAppReadiness = {
  base: ReadinessSection;
  customer: ReadinessSection & {
    templateName: string | null;
    templateLanguage: string | null;
  };
  admin: ReadinessSection & {
    recipientConfigured: boolean;
    templateName: string | null;
    templateLanguage: string | null;
  };
  provider: ReadinessSection & {
    deliveryMode: string;
    autoSendEnabled: boolean;
    templateName: string | null;
    templateLanguage: string | null;
  };
  webhook: ReadinessSection;
  rollout: {
    readyForCustomerAdminTest: boolean;
    readyForProviderAutoSend: boolean;
    providerAutoSendArmed: boolean;
    nextSteps: string[];
  };
};

type ReadinessPayload = {
  readiness?: WhatsAppReadiness;
  error?: string;
};

function statusClasses(status: ReadinessState): string {
  if (status === 'ready') return 'border-emerald-400/40 bg-emerald-950/50 text-emerald-100';
  if (status === 'disabled') return 'border-zinc-600/50 bg-zinc-900/60 text-zinc-200';
  return 'border-amber-400/40 bg-amber-950/50 text-amber-100';
}

function statusLabel(section: ReadinessSection): string {
  if (section.status === 'ready') return 'Ready';
  if (section.status === 'disabled') return 'Off';
  return 'Missing setup';
}

function SectionCard({
  title,
  detail,
  section,
}: {
  title: string;
  detail?: string;
  section: ReadinessSection;
}) {
  return (
    <div className={`rounded-xl border p-3 ${statusClasses(section.status)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em]">{title}</p>
          {detail && <p className="mt-1 text-[11px] opacity-80">{detail}</p>}
        </div>
        <span className="rounded-full bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
          {statusLabel(section)}
        </span>
      </div>
      {section.missing.length > 0 && (
        <p className="mt-2 text-[11px] opacity-90">
          Missing: {section.missing.join(', ')}
        </p>
      )}
      {section.notes[0] && (
        <p className="mt-2 text-[11px] opacity-75">{section.notes[0]}</p>
      )}
    </div>
  );
}

export default function WhatsAppReadinessControl() {
  const [adminKey, setAdminKey] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readiness, setReadiness] = useState<WhatsAppReadiness | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const headerState = useMemo(() => {
    if (!readiness) return 'Check setup';
    if (readiness.rollout.readyForCustomerAdminTest) return 'Customer/admin ready';
    if (readiness.base.configured) return 'Meta base ready';
    return 'Setup needed';
  }, [readiness]);

  const loadReadiness = useCallback(async () => {
    const activeAdminKey = window.sessionStorage.getItem(STORAGE_KEY) ?? adminKey;
    if (!activeAdminKey) return;

    setAdminKey(activeAdminKey);
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/whatsapp/readiness', {
        headers: { 'x-marketplace-admin-key': activeAdminKey },
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => ({}))) as ReadinessPayload;

      if (!response.ok) {
        throw new Error(payload.error || `Readiness check failed with status ${response.status}.`);
      }

      setReadiness(payload.readiness ?? null);
    } catch (readinessError) {
      setError(readinessError instanceof Error ? readinessError.message : 'Unable to check WhatsApp setup.');
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    const handleOpenReadiness = () => {
      void loadReadiness();
    };

    window.addEventListener('marketplace:open-whatsapp-readiness', handleOpenReadiness);

    return () => {
      window.removeEventListener('marketplace:open-whatsapp-readiness', handleOpenReadiness);
    };
  }, [loadReadiness]);

  if (!adminKey || !open) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] max-h-[82vh] overflow-y-auto text-white sm:left-auto sm:max-w-[390px]">
      <div className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                WhatsApp readiness
              </p>
              <p className="mt-1 text-sm font-black">{headerState}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/10 p-1 text-zinc-300"
              aria-label="Close WhatsApp readiness"
            >
              <X size={16} />
            </button>
          </div>

          {loading && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-200">
              <Loader2 size={14} className="animate-spin" />
              Checking production environment setup...
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-950/70 p-3 text-xs text-red-100">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {readiness && !loading && (
            <div className="mt-3 space-y-2">
              <SectionCard title="Meta base" section={readiness.base} />
              <SectionCard
                title="Customer"
                detail={readiness.customer.templateName || 'Template not configured'}
                section={readiness.customer}
              />
              <SectionCard
                title="Admin alerts"
                detail={readiness.admin.templateName || 'Template not configured'}
                section={readiness.admin}
              />
              <SectionCard
                title="Provider auto-send"
                detail={`${readiness.provider.deliveryMode} mode - auto-send ${readiness.provider.autoSendEnabled ? 'on' : 'off'}`}
                section={readiness.provider}
              />
              <SectionCard title="Webhook" section={readiness.webhook} />

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-200">
                  {readiness.rollout.readyForCustomerAdminTest ? (
                    <CheckCircle2 size={15} className="text-emerald-300" />
                  ) : (
                    <AlertTriangle size={15} className="text-amber-300" />
                  )}
                  Next steps
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-zinc-300">
                  {readiness.rollout.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
