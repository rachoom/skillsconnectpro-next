'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellOff, BellRing, Loader2, Volume2 } from 'lucide-react';

type BrowserNotificationStatus = NotificationPermission | 'unsupported';
type BrowserWindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type AdminProjectPayload = {
  manualDispatchPending?: number;
};

const DISPATCH_ALERTS_STORAGE_KEY = 'marketplaceAdminDispatchAlertsEnabled';

function manualDispatchTotal(projects: AdminProjectPayload[]): number {
  return projects.reduce(
    (total, project) => total + Number(project.manualDispatchPending || 0),
    0,
  );
}

export default function AdminDispatchAlertMonitor() {
  const [adminKeyAvailable, setAdminKeyAvailable] = useState(false);
  const [dispatchAlertsEnabled, setDispatchAlertsEnabled] = useState(false);
  const [browserNotificationStatus, setBrowserNotificationStatus] =
    useState<BrowserNotificationStatus>('default');
  const [pendingDispatchCount, setPendingDispatchCount] = useState(0);
  const [checkingQueue, setCheckingQueue] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const dispatchAlertsEnabledRef = useRef(false);
  const previousPendingDispatchCountRef = useRef<number | null>(null);

  useEffect(() => {
    const savedDispatchAlerts =
      window.localStorage.getItem(DISPATCH_ALERTS_STORAGE_KEY) === 'true';

    setDispatchAlertsEnabled(savedDispatchAlerts);
    dispatchAlertsEnabledRef.current = savedDispatchAlerts;
    setBrowserNotificationStatus(
      'Notification' in window ? window.Notification.permission : 'unsupported',
    );
  }, []);

  useEffect(() => {
    dispatchAlertsEnabledRef.current = dispatchAlertsEnabled;
  }, [dispatchAlertsEnabled]);

  useEffect(() => {
    const syncAdminKey = () => {
      const nextKeyAvailable = Boolean(
        window.sessionStorage.getItem('marketplaceAdminKey'),
      );
      setAdminKeyAvailable(nextKeyAvailable);
      if (!nextKeyAvailable) {
        previousPendingDispatchCountRef.current = null;
        setPendingDispatchCount(0);
      }
    };

    syncAdminKey();
    window.addEventListener('focus', syncAdminKey);
    const timer = window.setInterval(syncAdminKey, 2_000);

    return () => {
      window.removeEventListener('focus', syncAdminKey);
      window.clearInterval(timer);
    };
  }, []);

  const browserNotificationLabel = useMemo(() => {
    if (browserNotificationStatus === 'granted') return 'browser on';
    if (browserNotificationStatus === 'denied') return 'browser blocked';
    if (browserNotificationStatus === 'unsupported') return 'browser unavailable';
    return 'browser optional';
  }, [browserNotificationStatus]);

  const getAudioContext = useCallback(() => {
    const audioWindow = window as BrowserWindowWithWebkitAudio;
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    return audioContextRef.current;
  }, []);

  const playDispatchPing = useCallback(async () => {
    if (!dispatchAlertsEnabledRef.current) return;

    const audioContext = getAudioContext();
    if (!audioContext) return;

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const startTime = audioContext.currentTime + 0.02;
      [880, 1174].forEach((frequency, index) => {
        const toneStart = startTime + index * 0.13;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, toneStart);
        gain.gain.setValueAtTime(0.0001, toneStart);
        gain.gain.exponentialRampToValueAtTime(0.08, toneStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + 0.17);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(toneStart);
        oscillator.stop(toneStart + 0.18);
      });
    } catch (soundError) {
      console.warn('Dispatch alert sound could not play:', soundError);
    }
  }, [getAudioContext]);

  const showBrowserDispatchNotification = useCallback((
    newDispatches: number,
    totalDispatches: number,
  ) => {
    if (!dispatchAlertsEnabledRef.current) return;
    if (!('Notification' in window) || window.Notification.permission !== 'granted') return;

    const notification = new window.Notification('Skills Connect Pro dispatch needed', {
      body: `${newDispatches} new WhatsApp dispatch${newDispatches === 1 ? '' : 'es'} pending. ${totalDispatches} total pending.`,
      icon: '/icon.png',
      tag: 'skills-connect-pro-whatsapp-dispatch',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, []);

  const triggerDispatchAlert = useCallback((
    newDispatches: number,
    totalDispatches: number,
  ) => {
    if (!dispatchAlertsEnabledRef.current || newDispatches <= 0) return;
    void playDispatchPing();
    showBrowserDispatchNotification(newDispatches, totalDispatches);
  }, [playDispatchPing, showBrowserDispatchNotification]);

  const refreshPendingDispatches = useCallback(async (silent = true) => {
    const adminKey = window.sessionStorage.getItem('marketplaceAdminKey');
    if (!adminKey) return;

    if (!silent) setCheckingQueue(true);
    try {
      const response = await fetch('/api/admin/projects', {
        headers: { 'x-marketplace-admin-key': adminKey },
        cache: 'no-store',
      });

      if (!response.ok) return;

      const payload = await response.json().catch(() => ({})) as {
        projects?: AdminProjectPayload[];
      };
      const nextPendingDispatchCount = manualDispatchTotal(payload.projects ?? []);
      const previousPendingDispatchCount = previousPendingDispatchCountRef.current;

      previousPendingDispatchCountRef.current = nextPendingDispatchCount;
      setPendingDispatchCount(nextPendingDispatchCount);

      if (
        previousPendingDispatchCount !== null &&
        nextPendingDispatchCount > previousPendingDispatchCount
      ) {
        const newDispatches = nextPendingDispatchCount - previousPendingDispatchCount;
        setNotice(`${newDispatches} new WhatsApp dispatch${newDispatches === 1 ? '' : 'es'} pending.`);
        triggerDispatchAlert(newDispatches, nextPendingDispatchCount);
      }
    } finally {
      if (!silent) setCheckingQueue(false);
    }
  }, [triggerDispatchAlert]);

  useEffect(() => {
    if (!adminKeyAvailable) return;

    void refreshPendingDispatches(true);
    const timer = window.setInterval(() => void refreshPendingDispatches(true), 15_000);

    return () => window.clearInterval(timer);
  }, [adminKeyAvailable, refreshPendingDispatches]);

  const enableDispatchAlerts = useCallback(async () => {
    dispatchAlertsEnabledRef.current = true;
    setDispatchAlertsEnabled(true);
    window.localStorage.setItem(DISPATCH_ALERTS_STORAGE_KEY, 'true');

    let permission: BrowserNotificationStatus = 'unsupported';
    if ('Notification' in window) {
      permission = window.Notification.permission;
      if (permission === 'default') {
        permission = await window.Notification.requestPermission();
      }
    }
    setBrowserNotificationStatus(permission);

    await playDispatchPing();
    setNotice(
      permission === 'denied'
        ? 'Sound alerts on. Browser notifications are blocked.'
        : 'Dispatch alerts on.',
    );
  }, [playDispatchPing]);

  const disableDispatchAlerts = useCallback(() => {
    dispatchAlertsEnabledRef.current = false;
    setDispatchAlertsEnabled(false);
    window.localStorage.setItem(DISPATCH_ALERTS_STORAGE_KEY, 'false');
    setNotice('Dispatch alerts muted.');
  }, []);

  const testDispatchAlerts = useCallback(async () => {
    if (!dispatchAlertsEnabledRef.current) {
      await enableDispatchAlerts();
      return;
    }

    await playDispatchPing();
    showBrowserDispatchNotification(1, Math.max(1, pendingDispatchCount));
    setNotice('Test ping sent.');
  }, [
    enableDispatchAlerts,
    pendingDispatchCount,
    playDispatchPing,
    showBrowserDispatchNotification,
  ]);

  if (!adminKeyAvailable) return null;

  return (
    <aside className="fixed bottom-20 left-4 right-4 z-[70] rounded-2xl border border-white/10 bg-[#09100d]/95 p-3 text-white shadow-2xl backdrop-blur sm:left-auto sm:w-80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
            Dispatch alerts
          </p>
          <p className="mt-1 text-sm font-bold">
            {pendingDispatchCount} WhatsApp pending · {dispatchAlertsEnabled ? 'on' : 'off'}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            sound alert · {browserNotificationLabel}
          </p>
        </div>
        {dispatchAlertsEnabled ? (
          <BellRing size={20} className="shrink-0 text-emerald-300" />
        ) : (
          <BellOff size={20} className="shrink-0 text-zinc-600" />
        )}
      </div>
      {notice && <p className="mt-2 text-xs text-emerald-200">{notice}</p>}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => void (dispatchAlertsEnabled ? disableDispatchAlerts() : enableDispatchAlerts())}
          className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider ${
            dispatchAlertsEnabled
              ? 'border border-white/10 text-zinc-200'
              : 'bg-amber-400 text-black'
          }`}
        >
          {dispatchAlertsEnabled ? 'Mute' : 'Enable'}
        </button>
        <button
          type="button"
          onClick={() => void testDispatchAlerts()}
          className="flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-200"
        >
          <Volume2 size={12} /> Test
        </button>
        <button
          type="button"
          onClick={() => void refreshPendingDispatches(false)}
          className="flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-200"
        >
          {checkingQueue ? <Loader2 className="animate-spin" size={12} /> : 'Check'}
        </button>
      </div>
    </aside>
  );
}
