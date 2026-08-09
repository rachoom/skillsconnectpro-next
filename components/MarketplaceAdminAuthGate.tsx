'use client';

import { useEffect, useRef, useState } from 'react';
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { supabase } from '../services/supabase';

const LEGACY_SESSION_STORAGE_KEY = 'marketplaceAdminKey';
const SESSION_MARKER = 'supabase-admin-session';

async function establishServerAdminSession(accessToken: string) {
  const response = await fetch('/api/admin/session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const session = data.session;
        if (!session) {
          window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
          if (!cancelled) setAuthenticated(false);
          return;
        }

        await establishServerAdminSession(session.access_token);
        const alreadyMarked = window.sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY) === SESSION_MARKER;
        window.sessionStorage.setItem(LEGACY_SESSION_STORAGE_KEY, SESSION_MARKER);

        if (!alreadyMarked) {
          window.location.reload();
          return;
        }

        if (!cancelled) {
          setEmail(session.user.email ?? '');
          setAuthenticated(true);
        }
      } catch (caught) {
        await supabase.auth.signOut().catch(() => undefined);
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
        await Promise.all([
          fetch('/api/admin/session', { method: 'DELETE', cache: 'no-store' }).catch(() => undefined),
          supabase.auth.signOut().catch(() => undefined),
        ]);
      } finally {
        window.location.reload();
      }
    };

    const timer = window.setInterval(() => void detectLegacyLockButton(), 600);
    return () => window.clearInterval(timer);
  }, [authenticated, isAdminRoute]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Enter your admin email address and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (signInError) throw signInError;
      if (!data.session) throw new Error('No sign-in session was returned.');

      await establishServerAdminSession(data.session.access_token);
      window.sessionStorage.setItem(LEGACY_SESSION_STORAGE_KEY, SESSION_MARKER);
      window.location.reload();
    } catch (caught) {
      await supabase.auth.signOut().catch(() => undefined);
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
          {checking ? 'Checking your session…' : 'Admin sign in'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {checking
            ? 'Securely verifying your administrator account.'
            : 'Sign in with your SkillsConnect Pro administrator account. No API key is required.'}
        </p>

        {!checking ? (
          <form onSubmit={signIn} className="mt-8 space-y-5">
            <div>
              <label htmlFor="scp-admin-email" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Email address
              </label>
              <input
                id="scp-admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                inputMode="email"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base text-white outline-none transition focus:border-amber-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="scp-admin-password" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <input
                id="scp-admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base text-white outline-none transition focus:border-amber-400"
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
              {submitting ? 'Signing in…' : 'Sign in to Admin'}
            </button>
          </form>
        ) : null}

        <div className="mt-7 border-t border-white/10 pt-5 text-xs leading-5 text-zinc-500">
          Your login is handled by SkillsConnect Pro&apos;s authenticated account system. Infrastructure secrets remain on the server.
        </div>
      </section>
    </div>
  );
}
