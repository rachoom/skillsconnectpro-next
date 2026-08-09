'use client';

import { useEffect, useRef, useState } from 'react';
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';

const LEGACY_SESSION_STORAGE_KEY = 'marketplaceAdminKey';
const SESSION_MARKER = 'pin-admin-session';

async function establishServerAdminSession(pin: string) {
  const response = await fetch('/api/admin/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin }),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to establish the administrator session.');
  }
  return payload;
}

export function MarketplaceAdminAuthGate() {
  const pathname = usePathname();
  const isAdminRoute = pathname === '/marketplace-admin';
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (!isAdminRoute) return;
    let cancelled = false;

    const initialise = async () => {
      setChecking(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' });
        if (!response.ok) {
          window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
          if (!cancelled) setAuthenticated(false);
          return;
        }

        const alreadyMarked = window.sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY) === SESSION_MARKER;
        window.sessionStorage.setItem(LEGACY_SESSION_STORAGE_KEY, SESSION_MARKER);

        if (!alreadyMarked) {
          window.location.reload();
          return;
        }

        if (!cancelled) setAuthenticated(true);
      } catch (caught) {
        window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
        if (!cancelled) {
          setAuthenticated(false);
          setError(caught instanceof Error ? caught.message : 'Unable to verify administrator access.');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    void initialise();
    return () => {
      cancelled = true;
    };
  }, [isAdminRoute]);

  useEffect(() => {
    if (!isAdminRoute || !authenticated) return;

    const detectLegacyLockButton = async () => {
      if (signingOutRef.current) return;
      if (window.sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY) === SESSION_MARKER) return;

      signingOutRef.current = true;
      try {
        await fetch('/api/admin/session', { method: 'DELETE', cache: 'no-store' }).catch(() => undefined);
      } finally {
        window.location.reload();
      }
    };

    const timer = window.setInterval(() => void detectLegacyLockButton(), 600);
    return () => window.clearInterval(timer);
  }, [authenticated, isAdminRoute]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanPin = pin.trim();
    if (!/^\d{4,12}$/.test(cleanPin)) {
      setError('Enter your Admin PIN.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await establishServerAdminSession(cleanPin);
      window.sessionStorage.setItem(LEGACY_SESSION_STORAGE_KEY, SESSION_MARKER);
      window.location.reload();
    } catch (caught) {
      window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.');
      setSubmitting(false);
    }
  };

  if (!isAdminRoute || authenticated) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#080d0b] px-5 py-12 text-white">
      <section className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/10 bg-[#111713] p-7 shadow-2xl sm:p-9">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-black">
          {checking ? <ShieldCheck className="h-8 w-8 animate-pulse" /> : <LockKeyhole className="h-8 w-8" />}
        </div>

        <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-amber-300">
          SkillsConnect Pro Administration
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {checking ? 'Checking your session…' : 'Enter Admin PIN'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {checking
            ? 'Securely verifying your administrator session.'
            : 'Use the same Admin PIN you already use for the SkillsConnect Pro admin panel.'}
        </p>

        {!checking ? (
          <form onSubmit={signIn} className="mt-8 space-y-5">
            <div>
              <label htmlFor="scp-admin-pin" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Admin PIN
              </label>
              <input
                id="scp-admin-pin"
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 12))}
                autoComplete="current-password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-center text-2xl font-black tracking-[0.45em] text-white outline-none transition focus:border-amber-400"
                placeholder="••••"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
            >
              <LogIn className="h-5 w-5" />
              {submitting ? 'Unlocking…' : 'Unlock Admin'}
            </button>
          </form>
        ) : null}

        <div className="mt-7 border-t border-white/10 pt-5 text-xs leading-5 text-zinc-500">
          The PIN is verified on the server and creates a secure administrator session. No API key or email password is required.
        </div>
      </section>
    </div>
  );
}
