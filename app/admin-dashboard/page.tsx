'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { AdminDashboard } from '../../components/AdminDashboard';

export default function AdminDashboardPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const verify = async () => {
      try {
        const response = await fetch('/api/provider-admin/session', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (active) setUnlocked(payload.authenticated === true);
      } catch {
        if (active) setUnlocked(false);
      } finally {
        if (active) setChecking(false);
      }
    };
    void verify();
    return () => { active = false; };
  }, []);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChecking(true);
    setError('');
    try {
      const response = await fetch('/api/provider-admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.authenticated !== true) {
        throw new Error(payload.error || 'Sign-in failed.');
      }
      setPassword('');
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setChecking(false);
    }
  };

  const leaveDashboard = async () => {
    await fetch('/api/provider-admin/session', { method: 'DELETE' }).catch(() => undefined);
    window.location.assign('/');
  };

  if (checking && !unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
        <div className="rounded-3xl border border-amber-400/20 bg-[#111] px-8 py-7 text-sm font-bold text-zinc-400">
          Checking admin access…
        </div>
      </main>
    );
  }

  if (unlocked) return <AdminDashboard onBack={() => { void leaveDashboard(); }} />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
      <form onSubmit={signIn} className="w-full max-w-sm rounded-3xl border border-amber-400/30 bg-[#111] p-7 shadow-2xl">
        <LockKeyhole size={28} className="text-amber-300" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-black">Skills Connect Admin</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Enter your administrator password to review provider applications.
        </p>

        <label htmlFor="admin-password" className="mt-6 block text-sm font-bold">Admin password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
          autoFocus
          className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-base text-white outline-none focus:border-amber-400"
        />

        {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}

        <button
          disabled={checking}
          className="mt-6 min-h-12 w-full rounded-xl bg-amber-400 font-black text-black transition hover:bg-amber-300 disabled:opacity-50"
        >
          {checking ? 'Checking access…' : 'Open admin dashboard'}
        </button>

        <p className="mt-4 text-center text-[11px] leading-5 text-zinc-500">
          Secure password-only access · session expires automatically.
        </p>
        <Link href="/" className="mt-4 block text-center text-sm text-zinc-400">Back to home</Link>
      </form>
    </main>
  );
}
